<?php
/* ============================================================================
   VITALICA — api/google.php  ·  VERIFICAR EL INGRESO CON GOOGLE
   ----------------------------------------------------------------------------
   Recibe el "credential" que entrega el botón de Google y dice de quién es.

   CÓMO FUNCIONA EL BOTÓN, EN CRIOLLO
   ----------------------------------
   El visitante toca "Continuar con Google", elige su cuenta en una ventana
   de Google, y Google le devuelve AL NAVEGADOR un papelito firmado que dice
   "esta persona es juan@gmail.com, y lo firmo yo". Ese papelito es el
   credential.

   El navegador nos lo manda. Nosotros NO le creemos al navegador: le
   preguntamos a Google si ese papelito es suyo y si sigue vigente. Eso es
   todo lo que hace este archivo.

   POR QUÉ NO ALCANZA CON LEER EL PAPELITO
   ---------------------------------------
   El credential es un JWT: tres partes separadas por puntos, y la del medio
   es JSON en base64 que se lee sin ninguna clave. O sea que cualquiera puede
   fabricar uno que diga "soy diego@vitalica.com.py" y mandárnoslo.

   Lo que no puede fabricar es la FIRMA. Por eso el paso de preguntarle a
   Google no es opcional ni una formalidad: es lo único que separa un ingreso
   real de que cualquiera entre a la cuenta de cualquiera.

   POR QUÉ SE LE PREGUNTA A GOOGLE EN VEZ DE VERIFICAR LA FIRMA ACÁ
   ----------------------------------------------------------------
   Se puede hacer local: bajar las claves públicas de Google, guardarlas y
   verificar la firma con openssl. Es más rápido porque ahorra una consulta
   por ingreso.

   No se hace, por ahora, por una razón de tamaño: implica manejar el
   recambio de claves de Google —las rota— y una caché que puede quedar
   vieja. Un error ahí no se ve hasta el día que Google rota y nadie puede
   entrar. Con el volumen de este sitio, una consulta extra por ingreso no se
   nota, y este camino tiene una sola forma de fallar en vez de tres.

   NO HAY NINGÚN SECRETO EN ESTE ARCHIVO
   -------------------------------------
   El client_id de Google es público: viaja en el HTML de la página, a la
   vista de cualquiera. No es una contraseña y no hay que cuidarlo. El flujo
   del botón no usa client_secret.
   ============================================================================ */

declare(strict_types=1);

const GOOGLE_TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

/** El identificador de la aplicación, de config.php. Vacío = botón apagado. */
function google_client_id(): string
{
    static $id = null;
    if ($id !== null) return $id;

    $cfg = [];
    $ruta = __DIR__ . '/config.php';
    if (is_file($ruta)) {
        $leido = require $ruta;
        if (is_array($leido)) $cfg = $leido;
    }
    $id = trim((string)($cfg['google']['client_id'] ?? ''));
    return $id;
}

function google_activo(): bool
{
    return google_client_id() !== '';
}

/**
 * Verifica el credential. Devuelve ['sub','email','nombre'] o ['error'].
 *
 * 'sub' es el identificador que Google le da a esa persona. Es lo que se
 * guarda, y no el correo: alguien puede cambiar el correo de su cuenta de
 * Google, y si nos guiáramos por el correo perdería el acceso a su cuenta
 * nuestra sin entender por qué.
 */
function google_verificar(string $credential): array
{
    if (!google_activo()) {
        return ['error' => 'El ingreso con Google no está configurado.'];
    }

    $credential = trim($credential);
    if ($credential === '' || substr_count($credential, '.') !== 2) {
        return ['error' => 'Google no devolvió una credencial válida.'];
    }
    if (strlen($credential) > 4096) {
        return ['error' => 'Google no devolvió una credencial válida.'];
    }
    // Solo lo que puede tener un JWT. Evita mandarle basura a Google y, de
    // paso, que alguien meta algo raro en la URL de la consulta.
    if (!preg_match('~^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$~', $credential)) {
        return ['error' => 'Google no devolvió una credencial válida.'];
    }

    $respuesta = google_consultar(GOOGLE_TOKENINFO . urlencode($credential));
    if ($respuesta === null) {
        return ['error' => 'No pudimos confirmar tu cuenta con Google. Probá de nuevo.'];
    }

    $d = json_decode($respuesta, true);
    if (!is_array($d) || isset($d['error'])) {
        return ['error' => 'Google rechazó la credencial. Probá de nuevo.'];
    }

    /* --- Las tres comprobaciones que importan --------------------------- */

    // 1) Que el papelito sea para NOSOTROS. Sin esto, un credential emitido
    //    para otro sitio cualquiera serviría para entrar acá.
    if (!hash_equals(google_client_id(), (string)($d['aud'] ?? ''))) {
        return ['error' => 'Esa credencial no es de este sitio.'];
    }

    // 2) Que lo haya emitido Google.
    $emisor = (string)($d['iss'] ?? '');
    if (!in_array($emisor, ['accounts.google.com', 'https://accounts.google.com'], true)) {
        return ['error' => 'Esa credencial no la emitió Google.'];
    }

    // 3) Que no esté vencido. tokeninfo ya lo revisa, pero se repite acá:
    //    una respuesta cacheada por un proxy en el medio podría estar vieja.
    if ((int)($d['exp'] ?? 0) <= time()) {
        return ['error' => 'La credencial venció. Volvé a intentar.'];
    }

    $email = mb_strtolower(trim((string)($d['email'] ?? '')));
    if ($email === '') {
        return ['error' => 'Google no compartió tu correo.'];
    }

    /* Google marca si el correo está verificado. Uno sin verificar podría no
       ser de quien dice: aceptarlo permitiría entrar a la cuenta de otra
       persona registrando ese correo en Google sin comprobarlo. */
    $verificado = ($d['email_verified'] ?? '') === true
               || ($d['email_verified'] ?? '') === 'true';
    if (!$verificado) {
        return ['error' => 'Google dice que ese correo no está verificado.'];
    }

    $sub = trim((string)($d['sub'] ?? ''));
    if ($sub === '') return ['error' => 'Google no devolvió un identificador.'];

    return [
        'sub'    => $sub,
        'email'  => $email,
        'nombre' => trim((string)($d['name'] ?? '')) ?: 'Cliente',
    ];
}

/** Una consulta HTTPS, con curl si está y con fopen si no. */
function google_consultar(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
            // Verificar el certificado NO es opcional: sin esto, quien esté
            // en el medio de la conexión puede contestar por Google.
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT      => 'Vitalica/1.0',
        ]);
        $r = curl_exec($ch);
        $codigo = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return ($r !== false && $codigo === 200) ? (string)$r : null;
    }

    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create([
            'http' => ['timeout' => 8, 'ignore_errors' => true],
            'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $r = @file_get_contents($url, false, $ctx);
        return $r === false ? null : (string)$r;
    }

    return null;
}
