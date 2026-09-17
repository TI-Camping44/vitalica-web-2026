<?php
/* ============================================================================
   VITALICA — api/prueba.php  ·  DIAGNÓSTICO DE INSTALACIÓN
   ----------------------------------------------------------------------------
   Abrí esto en el navegador después de subir la carpeta /api:
       https://vitalica.com.py/api/prueba.php

   Revisa una por una las cosas que tienen que funcionar y te dice cuál falla
   y cómo arreglarla. No manda pedidos ni toca datos.

   ⚠️ BORRÁ ESTE ARCHIVO cuando termines de configurar. Mientras esté, muestra
   información de tu servidor a cualquiera que sepa la dirección.
   ============================================================================ */

declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');

$pruebas = [];
function chequear(string $nombre, bool $ok, string $detalle, string $arreglo = ''): void {
    global $pruebas;
    $pruebas[] = compact('nombre', 'ok', 'detalle', 'arreglo');
}

// 1) PHP
$vOk = PHP_VERSION_ID >= 70400;
chequear('Versión de PHP', $vOk, PHP_VERSION,
    $vOk ? '' : 'Se necesita PHP 7.4 o superior. Cambialo en cPanel → Select PHP Version.');

// 2) config.php
$hayConfig = file_exists(__DIR__ . '/config.php');
chequear('Archivo config.php', $hayConfig,
    $hayConfig ? 'Encontrado' : 'No existe',
    $hayConfig ? '' : 'Copiá config.ejemplo.php como config.php y completá los datos.');

$cfg = $hayConfig ? (require __DIR__ . '/config.php') : [];

// 3) Carpeta de pedidos: existe y se puede escribir
if ($hayConfig) {
    $carpeta = ($cfg['carpeta_pedidos'] ?? '') ?: (__DIR__ . '/almacen');
    if (!is_dir($carpeta)) @mkdir($carpeta, 0750, true);
    $puedeEscribir = is_dir($carpeta) && is_writable($carpeta);

    if ($puedeEscribir) {
        $tmp = $carpeta . '/.prueba-escritura';
        $puedeEscribir = @file_put_contents($tmp, 'ok') !== false;
        @unlink($tmp);
    }
    chequear('Guardar pedidos', $puedeEscribir,
        $carpeta . ($puedeEscribir ? ' (se puede escribir)' : ' (NO se puede escribir)'),
        $puedeEscribir ? '' : 'Dale permiso de escritura a esa carpeta (755 o 750) desde el Administrador de archivos de cPanel.');

    // ¿Está dentro de public_html? Es una advertencia, no un error.
    $raizWeb = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $real = realpath($carpeta);
    if ($raizWeb && $real && str_starts_with($real, $raizWeb)) {
        chequear('Ubicación de los pedidos', false,
            'La carpeta está dentro de public_html',
            'Funciona, pero es más seguro moverla afuera. En config.php poné algo como /home/TU_USUARIO/pedidos-vitalica');
    } else {
        chequear('Ubicación de los pedidos', true, 'Fuera de public_html — correcto');
    }
}

// 4) Email
$hayMail = function_exists('mail');
chequear('Función de correo', $hayMail,
    $hayMail ? 'Disponible' : 'No disponible',
    $hayMail ? '' : 'Activá el correo en el hosting, o usá SMTP.');

if ($hayConfig) {
    $desde = $cfg['email_desde'] ?? '';
    $equipo = $cfg['emails_equipo'] ?? [];
    $desdeOk = $desde !== '' && !preg_match('/@(gmail|hotmail|outlook|yahoo)\./i', $desde);
    chequear('Remitente configurado', $desdeOk, $desde ?: '(vacío)',
        $desdeOk ? '' : 'Usá una dirección del dominio propio (ej: no-responder@vitalica.com.py). Con un Gmail, los correos caen en spam.');
    chequear('Destinatarios del equipo', !empty($equipo),
        $equipo ? implode(', ', $equipo) : '(ninguno)',
        $equipo ? '' : 'Completá emails_equipo en config.php.');
}

// 5) curl (necesario solo para Odoo)
$hayCurl = function_exists('curl_init');
chequear('Extensión curl', $hayCurl,
    $hayCurl ? 'Disponible' : 'No disponible',
    $hayCurl ? '' : 'Solo hace falta si vas a conectar Odoo. Se activa en cPanel → Select PHP Version → Extensions.');

// 6) Odoo (solo si está activado)
if ($hayConfig && !empty($cfg['odoo']['activo'])) {
    try {
        require_once __DIR__ . '/odoo.php';
        $uid = odoo_login($cfg['odoo']);
        chequear('Conexión con Odoo', true, 'Conectado (usuario ' . $uid . ')');
    } catch (Throwable $e) {
        chequear('Conexión con Odoo', false, $e->getMessage(),
            'Revisá url, db, usuario y api_key en config.php.');
    }
} else {
    chequear('Odoo', true, 'Apagado — el resto funciona igual');
}

// 7) config.php no debe ser accesible desde la web
chequear('Protección de config.php', file_exists(__DIR__ . '/.htaccess'),
    file_exists(__DIR__ . '/.htaccess') ? 'El .htaccess de /api está en su lugar' : 'FALTA el .htaccess en /api',
    file_exists(__DIR__ . '/.htaccess') ? '' : 'Subí el archivo api/htaccess y renombralo a .htaccess');

// 8) Panel de pedidos
if ($hayConfig) {
    $clavePanel = $cfg['panel']['clave'] ?? '';
    $largo = strlen($clavePanel);
    chequear('Contraseña del panel de pedidos', $largo >= 10,
        $largo === 0 ? 'Sin configurar' : 'Configurada (' . $largo . ' caracteres)',
        $largo === 0
            ? 'Completá "panel" => "clave" en config.php. Sin eso, api/panel.php no abre.'
            : ($largo < 10 ? 'Es corta. Usá al menos 10 caracteres: el panel muestra teléfonos y direcciones de clientes.' : ''));

    chequear('Sesiones de PHP', function_exists('session_start'),
        function_exists('session_start') ? 'Disponibles' : 'No disponibles',
        function_exists('session_start') ? '' : 'El panel necesita sesiones para mantener el acceso.');
}

$fallan = array_filter($pruebas, fn($p) => !$p['ok']);
?>
<!doctype html>
<meta charset="utf-8">
<title>Diagnóstico · Vitalica</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px;
         color: #16191D; line-height: 1.6; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .sub { color: #565C66; margin-top: 0; }
  .item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #E6E8EC; }
  .marca { font-size: 20px; line-height: 1.2; flex-shrink: 0; width: 24px; }
  .ok .marca { color: #1F7A4C; }
  .mal .marca { color: #A3342F; }
  .nombre { font-weight: 600; }
  .detalle { color: #565C66; font-size: 14px; word-break: break-all; }
  .arreglo { margin-top: 6px; padding: 10px 12px; background: #FBF0D9; border-left: 3px solid #EF7D2A;
             font-size: 14px; border-radius: 4px; }
  .resumen { padding: 16px 20px; border-radius: 6px; margin: 24px 0; font-weight: 600; }
  .todo-bien { background: #E3F3EA; color: #1F7A4C; }
  .hay-fallas { background: #FBE7E5; color: #A3342F; }
  .aviso { margin-top: 32px; padding: 14px 18px; background: #FBE7E5; border-radius: 6px;
           color: #A3342F; font-size: 14px; }
</style>

<h1>Diagnóstico del backend de pedidos</h1>
<p class="sub">Vitalica · <?= date('d/m/Y H:i') ?></p>

<div class="resumen <?= $fallan ? 'hay-fallas' : 'todo-bien' ?>">
  <?= $fallan
      ? count($fallan) . ' cosa' . (count($fallan) === 1 ? '' : 's') . ' por resolver antes de recibir pedidos.'
      : 'Todo listo. El sitio ya puede recibir pedidos.' ?>
</div>

<?php foreach ($pruebas as $p): ?>
  <div class="item <?= $p['ok'] ? 'ok' : 'mal' ?>">
    <div class="marca"><?= $p['ok'] ? '✓' : '✕' ?></div>
    <div>
      <div class="nombre"><?= htmlspecialchars($p['nombre']) ?></div>
      <div class="detalle"><?= htmlspecialchars($p['detalle']) ?></div>
      <?php if (!$p['ok'] && $p['arreglo']): ?>
        <div class="arreglo"><?= htmlspecialchars($p['arreglo']) ?></div>
      <?php endif; ?>
    </div>
  </div>
<?php endforeach; ?>

<div class="aviso">
  <strong>Cuando termines, borrá este archivo.</strong> Mientras esté en el servidor,
  cualquiera que sepa la dirección puede ver esta información.
</div>
