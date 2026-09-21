<?php
/* ============================================================================
   VITALICA — api/db.php  ·  LA CONEXIÓN A LA BASE DE DATOS
   ----------------------------------------------------------------------------
   POR QUÉ APARECE UNA BASE DE DATOS EN UN PROYECTO QUE GUARDABA EN ARCHIVOS

   Todo lo demás del sitio guarda en archivos JSON, y está bien que así sea:
   los pedidos, las notas del blog y los cinco usuarios del área interna no
   justifican administrar un motor de base de datos.

   Las cuentas de clientes sí, y no es por elegancia. Para guardar un usuario
   en un JSON hay que leer el archivo entero, modificarlo y volver a
   escribirlo. Si dos personas se registran en el mismo segundo, la segunda
   escritura pisa a la primera y uno de los dos registros DESAPARECE, sin
   error y sin que nadie se entere. Con cinco personas del equipo eso no pasa
   nunca. Con clientes va a pasar, y el que se registró y no puede entrar no
   vuelve.

   La base de datos resuelve eso de raíz: dos escrituras a la vez es
   exactamente el problema para el que se inventó.

   DOS MOTORES, UN SOLO CÓDIGO
   ---------------------------
   En el servidor va MySQL, que ya viene con el hosting de cPanel.
   En esta computadora no hay servidor de base de datos, así que para probar
   se usa SQLite, que es un archivo y no necesita instalar nada.

   Las consultas del proyecto están escritas en SQL común, que funciona igual
   en los dos. Lo único que cambia de verdad es cómo se crea cada tabla, y
   eso vive aparte, en esquema.php.

   Esto NO es para que se pueda elegir motor: producción es MySQL. Es para
   que se pueda probar de verdad antes de subir, en vez de escribir a ciegas
   y descubrir los errores con un cliente adelante.

   DÓNDE VAN LAS CREDENCIALES
   --------------------------
   En api/config.php, sección 'db'. Ese archivo no viaja en el paquete de
   despliegue y el .htaccess impide descargarlo.
   ============================================================================ */

declare(strict_types=1);

/**
 * Devuelve la conexión. Siempre la misma dentro del mismo pedido HTTP:
 * abrir una conexión por consulta es lento y, en un hosting compartido,
 * una forma rápida de que te corten por exceso de conexiones.
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $cfg = db_config();

    if (($cfg['motor'] ?? 'mysql') === 'sqlite') {
        $archivo = (string)($cfg['archivo'] ?? '');
        if ($archivo === '') throw new RuntimeException('Falta la ruta del archivo SQLite.');
        $dir = dirname($archivo);
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $pdo = new PDO('sqlite:' . $archivo, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        // Sin esto SQLite ignora las claves foráneas y deja huérfanos.
        $pdo->exec('PRAGMA foreign_keys = ON');
        // WAL: permite leer mientras otro escribe. Sin esto, dos pedidos a la
        // vez se bloquean entre sí.
        $pdo->exec('PRAGMA journal_mode = WAL');
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['host'] ?? 'localhost',
        (int)($cfg['puerto'] ?? 3306),
        $cfg['base'] ?? ''
    );

    $pdo = new PDO($dsn, (string)($cfg['usuario'] ?? ''), (string)($cfg['clave'] ?? ''), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Consultas preparadas DE VERDAD, del lado del servidor. Con emulación
        // activada PDO arma la consulta pegando texto, y ahí es donde entra
        // una inyección SQL si alguna vez se escapa un parámetro.
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}

/** La configuración de la base, con valores por omisión para desarrollo. */
function db_config(): array
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;

    $todo = [];
    $ruta = __DIR__ . '/config.php';
    if (is_file($ruta)) {
        $leido = require $ruta;
        if (is_array($leido)) $todo = $leido;
    }

    $cfg = $todo['db'] ?? [];

    /* Sin sección 'db' en la configuración se usa SQLite en un archivo local.
       Así el proyecto arranca y se puede probar recién clonado, sin pedirle a
       nadie que levante un MySQL antes de ver si funciona.

       El archivo va en almacen/, que el .htaccess bloquea: una base de datos
       de clientes descargable desde el navegador sería el peor error posible
       de todo este trabajo. */
    if (!$cfg) {
        $cfg = ['motor' => 'sqlite', 'archivo' => __DIR__ . '/almacen/vitalica.sqlite'];
    }

    return $cfg;
}

/** Atajo: ejecuta y devuelve el statement ya listo para recorrer. */
function db_consulta(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

/** Una sola fila, o null. */
function db_fila(string $sql, array $params = []): ?array
{
    $f = db_consulta($sql, $params)->fetch();
    return $f === false ? null : $f;
}

/** Todas las filas. */
function db_filas(string $sql, array $params = []): array
{
    return db_consulta($sql, $params)->fetchAll();
}

/** Un solo valor de la primera fila, o null. */
function db_valor(string $sql, array $params = [])
{
    $v = db_consulta($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

/** El id que acaba de generar un INSERT. */
function db_ultimo_id(): int
{
    return (int)db()->lastInsertId();
}

/**
 * La fecha y hora para guardar, siempre en el mismo formato y en UTC.
 *
 * En UTC y no en hora de Paraguay a propósito: el servidor puede estar en
 * otro huso, y si un día se mueve el hosting, las fechas viejas quedarían
 * corridas contra las nuevas sin forma de saber cuáles son cuáles. Se guarda
 * en UTC y se muestra en hora local, que es al revés de como se siente
 * natural pero es lo único que no se rompe.
 */
function db_ahora(): string
{
    return gmdate('Y-m-d H:i:s');
}
