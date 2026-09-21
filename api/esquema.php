<?php
/* ============================================================================
   VITALICA — api/esquema.php  ·  LAS TABLAS
   ----------------------------------------------------------------------------
   Crea lo que falte. Se puede correr las veces que haga falta: si una tabla
   ya está, no la toca.

       php api/esquema.php            crea o actualiza
       php api/esquema.php --estado   dice qué hay, sin tocar nada

   POR QUÉ EL SQL ESTÁ ARMADO EN PHP Y NO EN UN .sql SUELTO

   Porque son dos motores. MySQL en el servidor, SQLite acá para poder
   probar. Las diferencias son pocas pero reales —cómo se declara un id que
   se autonumera, cómo se llama un entero— y con dos archivos .sql separados
   uno de los dos queda viejo el día que alguien agregue una columna y se
   olvide del otro. Acá la lista de columnas está escrita UNA vez.

   SOBRE LOS BORRADOS
   Este archivo no borra ni vacía nada, nunca. No hay un "--reiniciar".
   Es a propósito: es la base con los datos de los clientes, y un script que
   sabe borrarla es un script que alguien va a correr sin querer.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/db.php';

/* ---------------------------------------------------------------------------
   Las tablas, en el orden en que se crean.

   El orden importa: 'sesiones' apunta a 'clientes', así que clientes va
   primero o la clave foránea no tiene a qué apuntar.
   --------------------------------------------------------------------------- */
function esquema_tablas(): array
{
    return [

        /* --- La cuenta -----------------------------------------------------
           email es la identidad. Se guarda SIEMPRE en minúsculas (lo hace
           clientes.php antes de escribir), porque si no, "Juan@gmail.com" y
           "juan@gmail.com" se registran como dos personas distintas y ninguna
           de las dos entiende por qué su contraseña no anda.

           hash puede ser NULL: quien entra solo con Google no tiene
           contraseña en este sitio, y guardar una inventada sería peor que
           no guardar nada.

           telefono arranca vacío y no NULL. Es obligatorio para comprar, pero
           Google no lo entrega al iniciar sesión: solo da correo y nombre.
           Así que la cuenta puede existir un rato sin teléfono, y se lo pide
           antes de dejar cerrar un pedido. Un NOT NULL sin valor por omisión
           haría fallar el alta con Google. */
        'clientes' => [
            'id'         => 'ID',
            'email'      => 'TEXTO(190) NOT NULL SINMAYUS',
            'hash'       => 'TEXTO(255) NULL',
            'google_id'  => 'TEXTO(64) NULL',
            'nombre'     => 'TEXTO(120) NOT NULL',
            'telefono'   => "TEXTO(32) NOT NULL DEFAULT ''",
            'verificado' => 'ENTERO NOT NULL DEFAULT 0',
            'estado'     => "TEXTO(16) NOT NULL DEFAULT 'activo'",
            'creado'     => 'FECHA NOT NULL',
            'visto'      => 'FECHA NULL',
            '@indices'   => [
                'UNIQUE uq_clientes_email  (email)',
                'UNIQUE uq_clientes_google (google_id)',
            ],
        ],

        /* --- Sesiones ------------------------------------------------------
           Una fila por sesión abierta, en vez de las sesiones nativas de PHP.
           Dos motivos concretos:

             · "Seguir conectado" dura semanas, y las sesiones de PHP las
               limpia el servidor cuando quiere.
             · Se puede cerrar sesión en todos los dispositivos, que es lo
               primero que hace falta si a alguien le roban el teléfono.

           Se guarda el HASH del token, no el token. Si alguien llega a leer
           esta tabla, no puede hacerse pasar por nadie: tendría el hash, y
           con eso no se entra. Es el mismo criterio que con las contraseñas. */
        'sesiones' => [
            'id'         => 'ID',
            'cliente_id' => 'REF NOT NULL',
            'token_hash' => 'TEXTO(64) NOT NULL',
            'creado'     => 'FECHA NOT NULL',
            'expira'     => 'FECHA NOT NULL',
            'ip'         => "TEXTO(45) NOT NULL DEFAULT ''",
            'agente'     => "TEXTO(255) NOT NULL DEFAULT ''",
            '@fk'        => ['cliente_id -> clientes(id) BORRA'],
            '@indices'   => [
                'UNIQUE uq_sesiones_token (token_hash)',
                'INDEX ix_sesiones_cliente (cliente_id)',
                'INDEX ix_sesiones_expira (expira)',
            ],
        ],

        /* --- Intentos de ingreso -------------------------------------------
           Para frenar a quien prueba contraseñas de a miles. Se anota cada
           intento fallido y, pasada la cuenta, se cierra un rato.

           Se guarda por correo Y por IP: solo por correo, alguien puede
           probar una contraseña común contra mil correos distintos sin
           chocar nunca con el freno. */
        'intentos' => [
            'id'       => 'ID',
            'llave'    => 'TEXTO(190) NOT NULL',
            'cuando'   => 'FECHA NOT NULL',
            '@indices' => [
                'INDEX ix_intentos_llave (llave)',
                'INDEX ix_intentos_cuando (cuando)',
            ],
        ],

        /* --- Direcciones guardadas ------------------------------------------
           Para no volver a escribir la dirección en cada compra, que es una
           de las dos razones por las que un cliente quiere tener cuenta. */
        'direcciones' => [
            'id'             => 'ID',
            'cliente_id'     => 'REF NOT NULL',
            'etiqueta'       => "TEXTO(40) NOT NULL DEFAULT ''",
            'ciudad'         => "TEXTO(80) NOT NULL DEFAULT ''",
            'barrio'         => "TEXTO(80) NOT NULL DEFAULT ''",
            'direccion'      => "TEXTO(200) NOT NULL DEFAULT ''",
            'referencia'     => "TEXTO(200) NOT NULL DEFAULT ''",
            'telefono'       => "TEXTO(32) NOT NULL DEFAULT ''",
            'predeterminada' => 'ENTERO NOT NULL DEFAULT 0',
            'creado'         => 'FECHA NOT NULL',
            '@fk'            => ['cliente_id -> clientes(id) BORRA'],
            '@indices'       => ['INDEX ix_direcciones_cliente (cliente_id)'],
        ],

        /* --- Índice de pedidos ----------------------------------------------
           Los pedidos SIGUEN guardándose donde están hoy, en los archivos
           .jsonl de almacen/. Esta tabla no los reemplaza: guarda lo mínimo
           para poder mostrar "mis pedidos" sin abrir y recorrer archivos.

           Se escriben los dos, igual que hace el blog con su JSON y su .js.
           No se cambia el flujo de pedidos ahora: eso ya funciona y anda en
           producción, y mezclar las dos cosas es la forma segura de romper
           lo que anda mientras se agrega lo que falta.

           cliente_id puede ser NULL: se puede seguir comprando sin cuenta, y
           eso no se va a sacar. Obligar a registrarse para comprar es la
           forma más rápida de perder al que compra por primera vez. */
        'pedidos' => [
            'id'         => 'ID',
            'numero'     => 'TEXTO(40) NOT NULL',
            'cliente_id' => 'REF NULL',
            'email'      => "TEXTO(190) NOT NULL DEFAULT '' SINMAYUS",
            'total'      => 'ENTERO NOT NULL DEFAULT 0',
            'estado'     => "TEXTO(24) NOT NULL DEFAULT 'nuevo'",
            'resumen'    => "LARGO NOT NULL DEFAULT ''",
            'creado'     => 'FECHA NOT NULL',
            '@fk'        => ['cliente_id -> clientes(id) DESLIGA'],
            '@indices'   => [
                'UNIQUE uq_pedidos_numero (numero)',
                'INDEX ix_pedidos_cliente (cliente_id)',
                'INDEX ix_pedidos_email (email)',
            ],
        ],
    ];
}

/* ---------------------------------------------------------------------------
   Traducción de los tipos a cada motor.
   --------------------------------------------------------------------------- */
function esquema_tipo(string $decl, string $motor): string
{
    if ($decl === 'ID') {
        return $motor === 'sqlite'
            ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
            : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    }

    /* REF: una columna que apunta al id de otra tabla. Tiene que quedar
       EXACTAMENTE del mismo tipo que ese id —INT UNSIGNED, no INT— o MySQL
       rechaza la clave foránea con un error que no dice cuál es el problema.
       Por eso es un tipo propio y no un ENTERO cualquiera. */
    /* SINMAYUS: el correo no distingue mayusculas.

       En MySQL esto ya pasa, porque las tablas se crean con collation
       utf8mb4_unicode_ci y la _ci del final significa case insensitive.
       En SQLite NO: por omision compara byte a byte, asi que
       "Juan@gmail.com" y "juan@gmail.com" entran como dos cuentas distintas
       y ninguna de las dos entiende por que su contrasena no anda.

       Se probo y pasaba exactamente eso. Sin esto, las pruebas locales
       mienten sobre lo que hace el servidor, que es peor que no probar.

       El correo igual se guarda en minusculas desde PHP. Esto es el
       cinturon ademas de los tirantes: si algun dia alguien escribe un
       INSERT que se saltea esa normalizacion, la base lo frena. */
    $decl = preg_replace('/\s*SINMAYUS/', $motor === 'sqlite' ? ' COLLATE NOCASE' : '', $decl);

    $decl = preg_replace('/REF/', $motor === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED', $decl);

    // TEXTO(n) -> VARCHAR(n). En SQLite el largo no se aplica, pero se deja
    // escrito igual: el día que alguien lea el esquema, la intención está.
    $decl = preg_replace('/\bTEXTO\((\d+)\)/', 'VARCHAR($1)', $decl);
    $decl = str_replace('LARGO', 'TEXT', $decl);
    $decl = str_replace('ENTERO', $motor === 'sqlite' ? 'INTEGER' : 'INT', $decl);
    $decl = str_replace('FECHA', 'DATETIME', $decl);

    return $decl;
}

function esquema_motor(): string
{
    return (string)(db_config()['motor'] ?? 'mysql');
}

function esquema_existe(string $tabla): bool
{
    $motor = esquema_motor();
    if ($motor === 'sqlite') {
        return (bool)db_valor(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?", [$tabla]);
    }
    return (bool)db_valor(
        'SELECT 1 FROM information_schema.tables
          WHERE table_schema = DATABASE() AND table_name = ?', [$tabla]);
}

/** Crea lo que falte. Devuelve qué hizo, para poder contarlo. */
function esquema_crear(): array
{
    $motor = esquema_motor();
    $hecho = [];

    foreach (esquema_tablas() as $tabla => $cols) {
        if (esquema_existe($tabla)) { $hecho[$tabla] = 'ya estaba'; continue; }

        $indices = $cols['@indices'] ?? [];
        $foraneas = $cols['@fk'] ?? [];
        unset($cols['@indices'], $cols['@fk']);

        $partes = [];
        foreach ($cols as $nombre => $decl) {
            $partes[] = "  `$nombre` " . esquema_tipo($decl, $motor);
        }

        /* En MySQL los índices van adentro del CREATE TABLE; en SQLite van
           en sentencias aparte. Por eso se separan acá y no antes. */
        if ($motor !== 'sqlite') {
            foreach ($indices as $i) {
                /* MySQL escribe "UNIQUE KEY nombre (col)" y "KEY nombre (col)".
                   "INDEX KEY" no existe: antes se generaba eso y el CREATE
                   TABLE fallaba entero en el servidor. Acá no se notaba
                   porque SQLite crea los índices por separado. */
                $partes[] = '  ' . preg_replace(
                    ['/^UNIQUE\s+/', '/^INDEX\s+/'],
                    ['UNIQUE KEY ', 'KEY '],
                    $i);
            }
        }

        /* Las claves foraneas van dentro del CREATE TABLE, en los dos motores.

           Que la base misma impida dejar una sesion apuntando a un cliente que
           ya no existe no es purismo. Sin eso, el dia que se borre una cuenta
           quedan filas huerfanas que nadie ve, hasta que una consulta devuelve
           un cliente vacio y la pagina explota con el visitante adelante.

           BORRA   (CASCADE):  se va la cuenta, se van sus sesiones y sus
                               direcciones. No significan nada sin ella.
           DESLIGA (SET NULL): el pedido SOBREVIVE y se queda sin dueno. Un
                               pedido es un documento contable: borrarlo
                               porque el cliente se dio de baja seria borrar
                               una venta de los registros. */
        foreach ($foraneas as $f) {
            if (!preg_match('/^(\w+) -> (\w+)\((\w+)\) (BORRA|DESLIGA)$/', $f, $m)) continue;
            $accion = $m[4] === 'BORRA' ? 'CASCADE' : 'SET NULL';
            $partes[] = "  FOREIGN KEY (`{$m[1]}`) REFERENCES `{$m[2]}`(`{$m[3]}`)"
                      . " ON DELETE $accion ON UPDATE CASCADE";
        }

        $sql = "CREATE TABLE `$tabla` (\n" . implode(",\n", $partes) . "\n)";
        if ($motor !== 'sqlite') {
            $sql .= ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        }

        db()->exec($sql);

        if ($motor === 'sqlite') {
            foreach ($indices as $i) {
                if (!preg_match('/^(UNIQUE|INDEX)\s+(\S+)\s+\((.+)\)$/', $i, $m)) continue;
                $uq = $m[1] === 'UNIQUE' ? 'UNIQUE ' : '';
                db()->exec("CREATE {$uq}INDEX `{$m[2]}` ON `$tabla` ({$m[3]})");
            }
        }

        $hecho[$tabla] = 'creada';
    }

    return $hecho;
}

/* ---------------------------------------------------------------------------
   Desde la consola
   --------------------------------------------------------------------------- */
if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $cfg = db_config();
    $donde = ($cfg['motor'] ?? 'mysql') === 'sqlite'
        ? $cfg['archivo']
        : ($cfg['usuario'] ?? '') . '@' . ($cfg['host'] ?? '') . '/' . ($cfg['base'] ?? '');

    echo "\n  motor: " . ($cfg['motor'] ?? 'mysql') . "\n  donde: $donde\n\n";

    if (in_array('--estado', $argv, true)) {
        foreach (array_keys(esquema_tablas()) as $t) {
            $hay = esquema_existe($t);
            $n = $hay ? (int)db_valor("SELECT COUNT(*) FROM `$t`") : 0;
            printf("  %-14s %s\n", $t, $hay ? "$n filas" : 'NO EXISTE');
        }
        echo "\n";
        exit(0);
    }

    foreach (esquema_crear() as $t => $q) printf("  %-14s %s\n", $t, $q);
    echo "\n  Listo.\n\n";
}
