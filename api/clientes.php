<?php
/* ============================================================================
   VITALICA — api/clientes.php  ·  CUENTAS DE CLIENTES
   ----------------------------------------------------------------------------
   Registro, ingreso, sesión y cierre. Solo la lógica: acá no se imprime nada
   ni se leen formularios. De eso se encarga cuenta.php.

   ESTO NO ES EL ÁREA INTERNA
   --------------------------
   El equipo de Vitalica entra por api/acceso.php, con sesion.php y un archivo
   JSON de usuarios. Son cinco personas y nunca van a ser muchas más.

   Los clientes son otra cosa y viven aparte a propósito: otra tabla, otra
   cookie, otro mecanismo de sesión. Si compartieran el sistema, un error en
   el registro público podría abrir la puerta del panel de pedidos. Separados,
   el peor caso de un lado no toca el otro.

   POR QUÉ LA SESIÓN NO USA session_start()
   ----------------------------------------
   Las sesiones nativas de PHP las borra el servidor cuando quiere limpiar, y
   "seguir conectado" tiene que durar semanas. Además, con una fila por sesión
   se puede cerrar sesión en todos los dispositivos, que es lo primero que
   hace falta cuando alguien pierde el teléfono.

   Lo que viaja en la cookie es un número al azar. En la base se guarda su
   HASH, no el número. Si alguien llegara a leer la tabla, no podría hacerse
   pasar por nadie: tendría el hash, y con el hash no se entra. Es el mismo
   criterio que con las contraseñas, y por el mismo motivo.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/db.php';

const CLIENTES_COOKIE    = 'vit_cliente';
const CLIENTES_DIAS      = 30;    // cuánto dura "seguir conectado"
const CLIENTES_MIN_CLAVE = 8;
const CLIENTES_TOPE      = 8;     // intentos fallidos antes de frenar
const CLIENTES_VENTANA   = 900;   // ...en estos segundos (15 minutos)


/* ===========================================================================
   NORMALIZAR Y VALIDAR
   =========================================================================== */

/**
 * El correo, siempre igual.
 *
 * Minúsculas porque si no "Juan@gmail.com" y "juan@gmail.com" se registran
 * como dos personas distintas y ninguna entiende por qué su contraseña no
 * anda. La base también lo trata sin distinguir mayúsculas, pero eso es el
 * cinturón: esto son los tirantes.
 */
function clientes_email(string $email): string
{
    return mb_strtolower(trim($email));
}

function clientes_email_valido(string $email): bool
{
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL) && mb_strlen($email) <= 190;
}

/**
 * El teléfono, en dígitos y con el código de país.
 *
 * Entra como la gente lo escribe —"0981 123 456", "+595 981 123456",
 * "(0981) 123-456"— y sale siempre igual: 595981123456. Guardarlo tal cual
 * lo escribieron significa que después el mismo número aparece de cuatro
 * formas distintas y no se puede buscar ni comparar.
 *
 * Devuelve '' si no parece un celular paraguayo. No se acepta cualquier
 * cosa: los pedidos se coordinan por WhatsApp, así que un teléfono que no
 * sirve es lo mismo que no tener teléfono.
 */
function clientes_telefono(string $tel): string
{
    $d = preg_replace('/\D+/', '', $tel) ?? '';

    // 0981123456 -> 595981123456
    if (strlen($d) === 10 && str_starts_with($d, '0')) $d = '595' . substr($d, 1);
    // 981123456 -> 595981123456
    elseif (strlen($d) === 9 && $d[0] === '9')         $d = '595' . $d;

    // Celular paraguayo: 595 + 9 + 8 dígitos.
    if (preg_match('/^5959\d{8}$/', $d)) return $d;

    return '';
}

/**
 * Qué le falta a una contraseña. Devuelve '' si está bien.
 *
 * Ocho caracteres y nada más. No se exige mayúscula, número y símbolo: esas
 * reglas no hacen más segura a la contraseña, hacen que la gente escriba
 * "Vitalica1!" y la anote en un papel. Lo que de verdad frena a quien prueba
 * contraseñas es el límite de intentos, que está más abajo.
 */
function clientes_revisar_clave(string $clave): string
{
    if (mb_strlen($clave) < CLIENTES_MIN_CLAVE) {
        return 'La contraseña necesita al menos ' . CLIENTES_MIN_CLAVE . ' caracteres.';
    }
    if (mb_strlen($clave) > 200) {
        return 'Esa contraseña es demasiado larga.';
    }
    return '';
}


/* ===========================================================================
   LÍMITE DE INTENTOS
   ---------------------------------------------------------------------------
   Se cuenta por correo Y por IP. Solo por correo, alguien puede probar la
   misma contraseña común contra mil correos distintos sin chocar nunca con
   el freno. Solo por IP, basta con cambiar de red.
   =========================================================================== */

function clientes_frenado(string $llave): bool
{
    $desde = gmdate('Y-m-d H:i:s', time() - CLIENTES_VENTANA);
    $n = (int)db_valor(
        'SELECT COUNT(*) FROM intentos WHERE llave = ? AND cuando > ?',
        [$llave, $desde]);
    return $n >= CLIENTES_TOPE;
}

function clientes_anotar_intento(string $llave): void
{
    db_consulta('INSERT INTO intentos (llave, cuando) VALUES (?, ?)',
                [mb_substr($llave, 0, 190), db_ahora()]);

    /* Limpieza oportunista: se borra lo viejo cada tanto en vez de tener una
       tarea programada, que en un hosting compartido es una cosa más que
       configurar y que se olvida. Una de cada veinte veces alcanza. */
    if (random_int(1, 20) === 1) {
        db_consulta('DELETE FROM intentos WHERE cuando < ?',
                    [gmdate('Y-m-d H:i:s', time() - 86400)]);
    }
}

function clientes_limpiar_intentos(string $llave): void
{
    db_consulta('DELETE FROM intentos WHERE llave = ?', [$llave]);
}

function clientes_ip(): string
{
    return mb_substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}


/* ===========================================================================
   REGISTRO
   =========================================================================== */

/**
 * Crea la cuenta. Devuelve ['id' => int] o ['error' => string].
 *
 * El error que se devuelve cuando el correo ya existe dice que ya existe, y
 * eso es una decisión, no un descuido: en un registro público no hay forma
 * de ocultarlo —si no lo dijera, la persona no entendería por qué no puede
 * entrar— y cualquiera puede averiguar lo mismo probando el formulario de
 * "olvidé mi contraseña". Al ingresar SÍ se oculta, que es donde importa.
 */
function clientes_registrar(string $email, string $nombre, string $telefono, string $clave): array
{
    $email  = clientes_email($email);
    $nombre = trim($nombre);
    $tel    = clientes_telefono($telefono);

    if (!clientes_email_valido($email))  return ['error' => 'Ese correo no parece válido.'];
    if (mb_strlen($nombre) < 2)          return ['error' => 'Escribí tu nombre.'];
    if (mb_strlen($nombre) > 120)        return ['error' => 'Ese nombre es demasiado largo.'];
    if ($tel === '')                     return ['error' => 'Necesitamos un celular paraguayo, así te escribimos por WhatsApp.'];

    $mal = clientes_revisar_clave($clave);
    if ($mal !== '') return ['error' => $mal];

    if (db_valor('SELECT id FROM clientes WHERE email = ?', [$email])) {
        return ['error' => 'Ya hay una cuenta con ese correo. Probá ingresando.'];
    }

    try {
        db_consulta(
            'INSERT INTO clientes (email, hash, nombre, telefono, creado)
             VALUES (?, ?, ?, ?, ?)',
            [$email, password_hash($clave, PASSWORD_DEFAULT), $nombre, $tel, db_ahora()]);
    } catch (PDOException $e) {
        /* La consulta de arriba ya miró si existía, pero entre esa consulta y
           este INSERT pueden pasar milisegundos, y en esos milisegundos otro
           pedido puede haber insertado el mismo correo. El índice único es lo
           único que de verdad lo impide; acá se traduce a algo legible. */
        if (clientes_es_duplicado($e)) {
            return ['error' => 'Ya hay una cuenta con ese correo. Probá ingresando.'];
        }
        throw $e;
    }

    return ['id' => db_ultimo_id()];
}

/** ¿El error de la base es por un valor repetido en un índice único? */
function clientes_es_duplicado(PDOException $e): bool
{
    // 23000 en MySQL, 23000 también en SQLite a través de PDO.
    return ($e->getCode() === '23000')
        || stripos($e->getMessage(), 'duplicate') !== false
        || stripos($e->getMessage(), 'unique')    !== false;
}


/* ===========================================================================
   INGRESO
   =========================================================================== */

/**
 * Verifica correo y contraseña. Devuelve ['cliente' => array] o ['error' => string].
 *
 * El mensaje de error es el MISMO para "ese correo no existe" y "la
 * contraseña está mal". Decir cuál de los dos falló le confirmaría a
 * cualquiera qué correos tienen cuenta en el sitio, y con esa lista se puede
 * hacer bastante daño.
 */
function clientes_ingresar(string $email, string $clave): array
{
    $email = clientes_email($email);
    $ip    = clientes_ip();

    $porCorreo = 'correo:' . $email;
    $porIp     = 'ip:' . $ip;

    if (clientes_frenado($porCorreo) || clientes_frenado($porIp)) {
        return ['error' => 'Demasiados intentos. Esperá quince minutos y volvé a probar.'];
    }

    $c = db_fila('SELECT * FROM clientes WHERE email = ?', [$email]);

    /* Si el correo no existe, igual se gasta el tiempo de verificar un hash.
       Sin esto, el "no existe" respondería mucho más rápido que el "clave
       incorrecta", y midiendo el tiempo de respuesta se podría averiguar qué
       correos tienen cuenta. Es el mismo cuidado que ya tiene el área
       interna. */
    $hash = (string)($c['hash'] ?? '$2y$10$noexistenoexistenoexistenoexistenoexistenoexisten');

    if (!password_verify($clave, $hash) || !$c) {
        clientes_anotar_intento($porCorreo);
        clientes_anotar_intento($porIp);
        return ['error' => 'Correo o contraseña incorrectos.'];
    }

    if (($c['estado'] ?? 'activo') !== 'activo') {
        return ['error' => 'Esta cuenta está suspendida. Escribinos y lo vemos.'];
    }

    /* Si la contraseña era correcta pero el hash quedó viejo —porque PHP
       subió el costo por omisión en una versión nueva— se regraba al vuelo.
       Es el único momento en que tenemos la contraseña en claro. */
    if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
        db_consulta('UPDATE clientes SET hash = ? WHERE id = ?',
                    [password_hash($clave, PASSWORD_DEFAULT), (int)$c['id']]);
    }

    clientes_limpiar_intentos($porCorreo);
    return ['cliente' => $c];
}


/* ===========================================================================
   INGRESO CON GOOGLE
   =========================================================================== */

/**
 * Busca o crea la cuenta a partir de lo que devuelve Google.
 *
 * Google entrega correo y nombre. EL TELÉFONO NO, nunca: no es algo que se
 * pueda pedir ni configurar. Por eso la cuenta se crea sin teléfono y queda
 * incompleta hasta que la persona lo escribe. clientes_perfil_completo() es
 * lo que se consulta antes de dejar cerrar un pedido.
 *
 * Si el correo ya tenía cuenta con contraseña, se vinculan en vez de crear
 * una segunda. Es la misma persona: entró por otra puerta.
 */
function clientes_google(string $googleId, string $email, string $nombre): array
{
    $googleId = trim($googleId);
    $email    = clientes_email($email);

    if ($googleId === '')               return ['error' => 'Google no devolvió una identidad válida.'];
    if (!clientes_email_valido($email)) return ['error' => 'Google no devolvió un correo válido.'];

    $c = db_fila('SELECT * FROM clientes WHERE google_id = ?', [$googleId]);
    if ($c) return ['cliente' => $c];

    $c = db_fila('SELECT * FROM clientes WHERE email = ?', [$email]);
    if ($c) {
        db_consulta('UPDATE clientes SET google_id = ?, verificado = 1 WHERE id = ?',
                    [$googleId, (int)$c['id']]);
        $c['google_id']  = $googleId;
        $c['verificado'] = 1;
        return ['cliente' => $c];
    }

    /* Cuenta nueva, sin contraseña y sin teléfono.
       verificado = 1 porque Google ya comprobó que el correo es suyo. */
    db_consulta(
        'INSERT INTO clientes (email, hash, google_id, nombre, telefono, verificado, creado)
         VALUES (?, NULL, ?, ?, ?, 1, ?)',
        [$email, $googleId, mb_substr(trim($nombre) ?: 'Cliente', 0, 120), '', db_ahora()]);

    return ['cliente' => db_fila('SELECT * FROM clientes WHERE id = ?', [db_ultimo_id()])];
}

/** ¿Tiene lo mínimo para poder comprar? */
function clientes_perfil_completo(?array $c): bool
{
    return $c && trim((string)($c['telefono'] ?? '')) !== '';
}


/* ===========================================================================
   LA SESIÓN
   =========================================================================== */

/**
 * Abre sesión: genera el número, guarda su hash y manda la cookie.
 * Devuelve el número, por si hace falta para algo que no sea la cookie.
 */
function clientes_sesion_abrir(int $clienteId): string
{
    $token = bin2hex(random_bytes(32));
    $hasta = time() + CLIENTES_DIAS * 86400;

    db_consulta(
        'INSERT INTO sesiones (cliente_id, token_hash, creado, expira, ip, agente)
         VALUES (?, ?, ?, ?, ?, ?)',
        [$clienteId, hash('sha256', $token), db_ahora(),
         gmdate('Y-m-d H:i:s', $hasta), clientes_ip(),
         mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255)]);

    db_consulta('UPDATE clientes SET visto = ? WHERE id = ?', [db_ahora(), $clienteId]);

    /* httponly: el JavaScript de la página no puede leerla, así que un script
                 ajeno que llegue a colarse tampoco.
       secure:   solo viaja por https. En localhost se apaga, si no no se
                 puede probar nada.
       samesite Lax: no se manda cuando otro sitio hace un pedido a este, que
                 es lo que frena que te hagan enviar un formulario sin querer
                 desde otra página. */
    if (!headers_sent()) {
        setcookie(CLIENTES_COOKIE, $token, [
            'expires'  => $hasta,
            'path'     => '/',
            'httponly' => true,
            'secure'   => clientes_es_https(),
            'samesite' => 'Lax',
        ]);
    }

    clientes_limpiar_sesiones();
    return $token;
}

function clientes_es_https(): bool
{
    if (($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off') return true;
    if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') return true;
    return false;
}

/** Quién está conectado, o null. Se resuelve una vez por pedido. */
function clientes_actual(): ?array
{
    static $resuelto = false;
    static $cliente  = null;

    if ($resuelto) return $cliente;
    $resuelto = true;

    $token = (string)($_COOKIE[CLIENTES_COOKIE] ?? '');
    if ($token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) return null;

    $c = db_fila(
        'SELECT c.* FROM sesiones s
           JOIN clientes c ON c.id = s.cliente_id
          WHERE s.token_hash = ? AND s.expira > ? AND c.estado = ?',
        [hash('sha256', $token), db_ahora(), 'activo']);

    $cliente = $c ?: null;
    return $cliente;
}

/** Cierra la sesión de ESTE dispositivo. */
function clientes_sesion_cerrar(): void
{
    $token = (string)($_COOKIE[CLIENTES_COOKIE] ?? '');
    if ($token !== '') {
        db_consulta('DELETE FROM sesiones WHERE token_hash = ?', [hash('sha256', $token)]);
    }
    if (!headers_sent()) {
        setcookie(CLIENTES_COOKIE, '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'secure'   => clientes_es_https(),
            'samesite' => 'Lax',
        ]);
    }
}

/** Cierra la sesión en TODOS los dispositivos. */
function clientes_sesion_cerrar_todo(int $clienteId): void
{
    db_consulta('DELETE FROM sesiones WHERE cliente_id = ?', [$clienteId]);
}

/** Borra las vencidas. Sin esto la tabla crece para siempre. */
function clientes_limpiar_sesiones(): void
{
    if (random_int(1, 20) !== 1) return;
    db_consulta('DELETE FROM sesiones WHERE expira < ?', [db_ahora()]);
}


/* ===========================================================================
   EDITAR EL PERFIL
   =========================================================================== */

function clientes_guardar_perfil(int $id, string $nombre, string $telefono): array
{
    $nombre = trim($nombre);
    $tel    = clientes_telefono($telefono);

    if (mb_strlen($nombre) < 2)   return ['error' => 'Escribí tu nombre.'];
    if (mb_strlen($nombre) > 120) return ['error' => 'Ese nombre es demasiado largo.'];
    if ($tel === '')              return ['error' => 'Necesitamos un celular paraguayo, así te escribimos por WhatsApp.'];

    db_consulta('UPDATE clientes SET nombre = ?, telefono = ? WHERE id = ?',
                [$nombre, $tel, $id]);
    return ['ok' => true];
}

/**
 * Cambia la contraseña. Pide la actual, salvo que la cuenta no tenga ninguna
 * —las que entraron solo con Google—, donde esto sirve para ponerle una por
 * primera vez.
 */
function clientes_cambiar_clave(int $id, string $actual, string $nueva): array
{
    $c = db_fila('SELECT hash FROM clientes WHERE id = ?', [$id]);
    if (!$c) return ['error' => 'No encontramos la cuenta.'];

    $tiene = (string)($c['hash'] ?? '') !== '';
    if ($tiene && !password_verify($actual, (string)$c['hash'])) {
        return ['error' => 'La contraseña actual no coincide.'];
    }

    $mal = clientes_revisar_clave($nueva);
    if ($mal !== '') return ['error' => $mal];

    db_consulta('UPDATE clientes SET hash = ? WHERE id = ?',
                [password_hash($nueva, PASSWORD_DEFAULT), $id]);

    /* Se cierran las demás sesiones. Si alguien cambia la contraseña es
       porque sospecha que alguien más entró, y dejarle la sesión abierta al
       intruso haría inútil el cambio. La de este dispositivo se vuelve a
       abrir enseguida, así que quien lo hizo no se entera. */
    clientes_sesion_cerrar_todo($id);

    return ['ok' => true];
}


/* ===========================================================================
   PRUEBAS
   ---------------------------------------------------------------------------
       php api/clientes.php --probar

   Corren contra la base de desarrollo y borran lo suyo al terminar. Todas las
   cuentas de prueba usan correos que empiezan con "zz-prueba-", así que la
   limpieza es inequívoca y no puede llevarse por delante a un cliente real.

   Por qué este archivo tiene pruebas y otros no: acá se manejan contraseñas y
   sesiones. Un error en el resto del sitio se ve enseguida; un error acá no
   se ve hasta que alguien entra a una cuenta que no es suya.
   =========================================================================== */
if (PHP_SAPI === 'cli' && in_array('--probar', $argv ?? [], true)) {

    $ok = 0; $mal = 0;
    $prueba = function (string $que, $real, $esperado = true) use (&$ok, &$mal) {
        $pasa = ($esperado === true) ? (bool)$real : ($real === $esperado);
        if ($pasa) { $ok++;  printf("  ok   %s\n", $que); }
        else       { $mal++; printf("  MAL  %s  (dio: %s)\n", $que, var_export($real, true)); }
    };

    $limpiar = function () {
        foreach (db_filas("SELECT id FROM clientes WHERE email LIKE 'zz-prueba-%'") as $f) {
            db_consulta('DELETE FROM clientes WHERE id = ?', [(int)$f['id']]);
        }
        db_consulta("DELETE FROM intentos WHERE llave LIKE '%zz-prueba-%'");
        db_consulta("DELETE FROM pedidos WHERE numero LIKE 'ZZ-PRUEBA%'");
    };
    $limpiar();

    echo "\nTELEFONO\n";
    $prueba('0981 123 456 se normaliza',      clientes_telefono('0981 123 456'), '595981123456');
    $prueba('+595 981 123456 tambien',        clientes_telefono('+595 981 123456'), '595981123456');
    $prueba('(0981) 123-456 tambien',         clientes_telefono('(0981) 123-456'), '595981123456');
    $prueba('981123456 sin el cero tambien',  clientes_telefono('981123456'), '595981123456');
    $prueba('un fijo de Asuncion se rechaza', clientes_telefono('021 123 456'), '');
    $prueba('vacio se rechaza',               clientes_telefono(''), '');
    $prueba('letras se rechazan',             clientes_telefono('no tengo'), '');

    echo "\nCORREO\n";
    $prueba('se pasa a minusculas', clientes_email('  Juan@Gmail.Com '), 'juan@gmail.com');
    $prueba('uno valido pasa',      clientes_email_valido('a@b.com'), true);
    $prueba('uno sin arroba no',    clientes_email_valido('ab.com'), false);

    echo "\nCONTRASENA\n";
    $prueba('siete caracteres se rechazan', clientes_revisar_clave('1234567') !== '', true);
    $prueba('ocho alcanzan',                clientes_revisar_clave('12345678'), '');

    echo "\nREGISTRO\n";
    $r = clientes_registrar('zz-prueba-uno@ejemplo.com', 'Juan Perez', '0981111111', 'clave-larga-1');
    $prueba('se crea la cuenta', isset($r['id']), true);
    $id = (int)($r['id'] ?? 0);

    $prueba('el mismo correo en MAYUSCULAS se rechaza',
        isset(clientes_registrar('ZZ-PRUEBA-UNO@ejemplo.com', 'Otro', '0981222222', 'clave-larga-2')['error']), true);
    $prueba('sin celular valido se rechaza',
        isset(clientes_registrar('zz-prueba-dos@ejemplo.com', 'Ana', '021555444', 'clave-larga-1')['error']), true);
    $prueba('con clave corta se rechaza',
        isset(clientes_registrar('zz-prueba-tres@ejemplo.com', 'Ana', '0981333333', 'corta')['error']), true);

    $g = db_fila('SELECT * FROM clientes WHERE id = ?', [$id]);
    $prueba('el correo quedo en minusculas',  $g['email'], 'zz-prueba-uno@ejemplo.com');
    $prueba('el telefono quedo normalizado',  $g['telefono'], '595981111111');
    $prueba('la clave NO se guarda en claro', strpos((string)$g['hash'], 'clave-larga-1'), false);

    echo "\nINGRESO\n";
    $i = clientes_ingresar('ZZ-Prueba-Uno@ejemplo.com', 'clave-larga-1');
    $prueba('entra aunque escriba el correo con mayusculas', isset($i['cliente']), true);

    $i2 = clientes_ingresar('zz-prueba-uno@ejemplo.com', 'la-que-no-es');
    $prueba('con la clave mal no entra', isset($i2['error']), true);

    $i3 = clientes_ingresar('zz-prueba-noexiste@ejemplo.com', 'cualquiera');
    $prueba('un correo que no existe da el MISMO mensaje que clave mal',
            ($i3['error'] ?? 'a') === ($i2['error'] ?? 'b'), true);

    echo "\nFRENO DE INTENTOS\n";
    for ($k = 0; $k <= CLIENTES_TOPE; $k++) {
        clientes_ingresar('zz-prueba-uno@ejemplo.com', 'mal-a-proposito');
    }
    $prueba('pasados los intentos frena aun con la clave BUENA',
            isset(clientes_ingresar('zz-prueba-uno@ejemplo.com', 'clave-larga-1')['error']), true);
    db_consulta("DELETE FROM intentos WHERE llave LIKE '%zz-prueba-%'");
    db_consulta("DELETE FROM intentos WHERE llave LIKE 'ip:%'");
    $prueba('pasada la ventana vuelve a entrar',
            isset(clientes_ingresar('zz-prueba-uno@ejemplo.com', 'clave-larga-1')['cliente']), true);

    echo "\nGOOGLE\n";
    $g1 = clientes_google('goog-zz-111', 'zz-prueba-google@ejemplo.com', 'Google Uno');
    $prueba('crea la cuenta', isset($g1['cliente']), true);
    $prueba('queda SIN telefono, porque Google no lo da',
            trim((string)$g1['cliente']['telefono']), '');
    $prueba('y por eso el perfil no esta completo',
            clientes_perfil_completo($g1['cliente']), false);
    $prueba('la segunda vez NO crea otra cuenta',
            (int)clientes_google('goog-zz-111', 'zz-prueba-google@ejemplo.com', 'Google Uno')['cliente']['id'],
            (int)$g1['cliente']['id']);

    $g3 = clientes_google('goog-zz-222', 'zz-prueba-uno@ejemplo.com', 'Juan Perez');
    $prueba('si el correo ya tenia cuenta, la VINCULA en vez de duplicar',
            (int)$g3['cliente']['id'], $id);
    $prueba('esa si tiene el perfil completo', clientes_perfil_completo($g3['cliente']), true);

    echo "\nSESION\n";
    $tok = clientes_sesion_abrir($id);
    $prueba('el token tiene 64 caracteres', strlen($tok), 64);
    $guardado = (string)db_valor('SELECT token_hash FROM sesiones WHERE cliente_id = ?', [$id]);
    $prueba('en la base NO esta el token', $guardado !== $tok, true);
    $prueba('esta su hash', $guardado, hash('sha256', $tok));

    $_COOKIE[CLIENTES_COOKIE] = $tok;
    $prueba('con la cookie puesta se reconoce al cliente',
            (int)(clientes_actual()['id'] ?? 0), $id);

    echo "\nCAMBIO DE CONTRASENA\n";
    $prueba('sin la actual no deja',
            isset(clientes_cambiar_clave($id, 'la-que-no-es', 'nueva-clave-larga')['error']), true);
    $antes = (int)db_valor('SELECT COUNT(*) FROM sesiones WHERE cliente_id = ?', [$id]);
    $prueba('con la actual si deja',
            isset(clientes_cambiar_clave($id, 'clave-larga-1', 'nueva-clave-larga')['ok']), true);
    $despues = (int)db_valor('SELECT COUNT(*) FROM sesiones WHERE cliente_id = ?', [$id]);
    $prueba('y cierra las sesiones abiertas', $antes > 0 && $despues === 0, true);
    $prueba('se entra con la nueva',
            isset(clientes_ingresar('zz-prueba-uno@ejemplo.com', 'nueva-clave-larga')['cliente']), true);

    echo "\nAL BORRAR LA CUENTA\n";
    clientes_sesion_abrir($id);
    db_consulta('INSERT INTO pedidos (numero, cliente_id, email, total, creado) VALUES (?,?,?,?,?)',
                ['ZZ-PRUEBA-1', $id, 'zz-prueba-uno@ejemplo.com', 100000, db_ahora()]);
    db_consulta('DELETE FROM clientes WHERE id = ?', [$id]);
    $prueba('se van sus sesiones',
            (int)db_valor('SELECT COUNT(*) FROM sesiones WHERE cliente_id = ?', [$id]), 0);
    $ped = db_fila('SELECT cliente_id FROM pedidos WHERE numero = ?', ['ZZ-PRUEBA-1']);
    $prueba('el pedido SOBREVIVE, sin dueno', $ped !== null && $ped['cliente_id'] === null, true);

    $limpiar();
    printf("\n  %d bien, %d mal\n\n", $ok, $mal);
    exit($mal === 0 ? 0 : 1);
}
