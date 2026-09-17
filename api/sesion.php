<?php
/* ============================================================================
   VITALICA — api/sesion.php  ·  ACCESO ÚNICO AL ÁREA INTERNA
   ----------------------------------------------------------------------------
   Un solo login para las dos herramientas internas: el panel de pedidos y la
   configuración del sitio.

   POR QUÉ ESTO EXISTE
   Antes había dos accesos con dos mecanismos distintos, y uno de los dos no
   era seguridad de verdad: admin.html pedía una clave desde JavaScript, o
   sea del lado del visitante. Cualquiera podía abrir el archivo y leerla, o
   saltear la pantalla entera escribiendo una línea en la consola.

   Una clave que se verifica en el navegador no protege nada: protege igual
   que un cartel que dice "no pasar".

   Acá la verificación ocurre en el servidor. El navegador nunca ve la clave,
   y sin sesión válida el PHP ni siquiera manda el contenido de la página.

   CÓMO SE USA
     require_once __DIR__ . '/sesion.php';   // desde /api
     sesion_exigir();                        // corta y redirige si no hay sesión
   ============================================================================ */

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    // La cookie de sesión no debe ser legible por JavaScript ni viajar a otros
    // sitios: reduce el riesgo de que se la roben desde una página ajena.
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => (($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off'),
    ]);
    session_start();
}

function sesion_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $ruta = __DIR__ . '/config.php';
        $cfg = file_exists($ruta) ? (require $ruta) : [];
    }
    return $cfg;
}

/** Ruta al login, calculada desde donde se llame (raíz o /api). */
function sesion_url_login(): string {
    $enApi = strpos((string)($_SERVER['SCRIPT_NAME'] ?? ''), '/api/') !== false;
    return ($enApi ? '' : 'api/') . 'acceso.php';
}

function sesion_activa(): bool {
    $cfg = sesion_config();
    $min = (int)($cfg['panel']['minutos_sesion'] ?? 120);
    if (empty($_SESSION['vit_ok'])) return false;
    if ((time() - (int)($_SESSION['vit_visto'] ?? 0)) >= $min * 60) return false;
    $_SESSION['vit_visto'] = time();   // renueva mientras se use
    return true;
}

/**
 * Verifica usuario y contraseña. Devuelve '' si entró, o el motivo del rechazo.
 * Frena los intentos por fuerza bruta: cinco y se cierra.
 */
function sesion_login(string $usuario, string $clave): string {
    require_once __DIR__ . '/usuarios.php';
    $cfg = sesion_config();

    // Primer arranque: si no hay ningún usuario, se crea el inicial.
    usuarios_sembrar($cfg);

    $_SESSION['vit_intentos'] = ($_SESSION['vit_intentos'] ?? 0) + 1;
    if ($_SESSION['vit_intentos'] > 5) {
        return 'Demasiados intentos. Cerrá el navegador y volvé a entrar.';
    }

    $u = usuarios_verificar($cfg, $usuario, $clave);
    if (!$u) {
        /* Un solo mensaje para los dos casos —usuario que no existe y
           contraseña equivocada— a propósito. Decir "ese usuario no existe"
           le confirmaría a un atacante qué nombres son válidos. */
        return 'Usuario o contraseña incorrectos.';
    }

    // Sesión nueva al entrar: evita que alguien fije un id de sesión de antemano.
    session_regenerate_id(true);
    $_SESSION['vit_ok']       = true;
    $_SESSION['vit_visto']    = time();
    $_SESSION['vit_intentos'] = 0;
    $_SESSION['vit_usuario']  = $u['usuario'];
    $_SESSION['vit_nombre']   = $u['nombre'];
    $_SESSION['vit_rol']      = $u['rol'];
    return '';
}

/** Quién entró. Sirve para mostrarlo y para registrar quién hizo cada cambio. */
function sesion_usuario(): array {
    return [
        'usuario' => (string)($_SESSION['vit_usuario'] ?? ''),
        'nombre'  => (string)($_SESSION['vit_nombre'] ?? ''),
        'rol'     => (string)($_SESSION['vit_rol'] ?? 'pedidos'),
    ];
}

function sesion_es_admin(): bool {
    return ($_SESSION['vit_rol'] ?? '') === 'admin';
}

/** Corta si el usuario no es administrador. */
function sesion_exigir_admin(): void {
    sesion_exigir();
    if (sesion_es_admin()) return;
    http_response_code(403);
    exit('<!doctype html><meta charset="utf-8"><title>Sin permiso</title>'
       . '<div style="font-family:system-ui;max-width:440px;margin:80px auto;text-align:center">'
       . '<h1 style="font-size:20px">No tenés permiso para entrar acá</h1>'
       . '<p style="color:#5B6270">Esta sección es solo para administradores. '
       . 'Si creés que es un error, pedile a un administrador que revise tu usuario.</p>'
       . '<p><a href="' . sesion_url_login() . '" style="color:#A85410;font-weight:600">Volver al menú</a></p>'
       . '</div>');
}

function sesion_salir(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/** Corta la ejecución y manda al login si no hay sesión válida. */
function sesion_exigir(): void {
    if (sesion_activa()) return;
    $volver = basename((string)($_SERVER['SCRIPT_NAME'] ?? ''));
    header('Location: ' . sesion_url_login() . '?volver=' . urlencode($volver));
    exit;
}
