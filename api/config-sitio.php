<?php
/* ============================================================================
   VITALICA — api/config-sitio.php  ·  PUBLICAR LA CONFIGURACIÓN DEL SITIO
   ----------------------------------------------------------------------------
   Recibe lo que armó el panel de administrador y lo deja publicado para
   todos los visitantes.

   QUÉ PROBLEMA RESUELVE
   ---------------------
   El panel guardaba en localStorage, o sea en la memoria del navegador de
   quien lo usaba. Los cambios se veían en esa computadora y en ninguna otra:
   el resto del mundo seguía viendo el sitio como estaba. Por eso el panel
   decía DEMO.

   Para publicar de verdad había que tocar Exportar, mandarle el archivo a
   quien programa y esperar a que lo suba. Es exactamente la dependencia que
   habíamos sacado del blog y que acá seguía.

   DÓNDE QUEDA GUARDADO, Y POR QUÉ EN DOS LADOS
   --------------------------------------------
     api/almacen/overrides.json       el original. Es el que se edita.
     assets/js/data-overrides.js      lo que lee el sitio. Se regenera solo.

   Es el mismo criterio que el blog. El sitio podría leer el JSON con una
   consulta, pero entonces cada página dependería de que PHP conteste antes
   de poder dibujarse, y si el servidor tarda, el visitante ve el sitio sin
   configurar durante un instante. Escribiendo también el .js, la
   configuración viaja como un archivo estático más.

   DOS CAPAS, Y EL ORDEN IMPORTA
   -----------------------------
     1. Lo PUBLICADO (este archivo)   lo ve todo el mundo
     2. Lo LOCAL (localStorage)       lo ve solo quien está probando

   Se aplica primero lo publicado y después lo local, así quien está
   configurando ve sus cambios sin guardar por encima de lo que ya está
   publicado. "Restablecer" borra solo la capa local: nunca despublica.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/sesion.php';
sesion_exigir_admin();

const CFG_MAX = 3 * 1024 * 1024;   // 3 MB: los logos viajan adentro como data:

$RAIZ      = dirname(__DIR__);
$ARCHIVO   = __DIR__ . '/almacen/overrides.json';
$PUBLICADO = $RAIZ . '/assets/js/data-overrides.js';

/* Solo estas claves de primer nivel. No es paranoia: lo que entra acá se
   escribe en un .js que ejecutan TODAS las páginas del sitio. Si un día el
   panel manda una clave de más por un error, mejor que se pierda a que
   termine publicada. */
const CFG_CLAVES = ['config', 'hero', 'productos', 'tiendas'];

header('Content-Type: application/json; charset=utf-8');

/* --- Token de formulario ---------------------------------------------------
   Sin esto, alcanza con que alguien con la sesión abierta visite una página
   preparada para que su navegador publique cambios sin que se entere. */
if (empty($_SESSION['cfg_token'])) {
    $_SESSION['cfg_token'] = bin2hex(random_bytes(16));
}

function cfg_responder(array $d, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* --- GET: devuelve lo publicado y el token -------------------------------- */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $actual = is_file($ARCHIVO) ? (string)@file_get_contents($ARCHIVO) : '{}';
    $datos  = json_decode($actual, true);
    cfg_responder([
        'ok'        => true,
        'token'     => $_SESSION['cfg_token'],
        'overrides' => is_array($datos) ? $datos : new stdClass(),
        'publicado' => is_file($ARCHIVO) ? gmdate('c', (int)filemtime($ARCHIVO)) : null,
    ]);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cfg_responder(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

$crudo = (string)file_get_contents('php://input');

if (strlen($crudo) > CFG_MAX) {
    cfg_responder(['ok' => false,
        'error' => 'La configuración pesa demasiado. Suele ser un logo muy grande: '
                 . 'subilo en PNG de menos de 300 KB.'], 413);
}

$entra = json_decode($crudo, true);
if (!is_array($entra)) {
    cfg_responder(['ok' => false, 'error' => 'No se entendió lo que llegó.'], 400);
}

if (!hash_equals((string)$_SESSION['cfg_token'], (string)($entra['token'] ?? ''))) {
    cfg_responder(['ok' => false,
        'error' => 'La sesión venció. Recargá la página y volvé a publicar.'], 403);
}

/* --- Publicar o despublicar ------------------------------------------------ */
$ov = $entra['overrides'] ?? null;
if (!is_array($ov)) $ov = [];

$limpio = [];
foreach (CFG_CLAVES as $k) {
    if (isset($ov[$k])) $limpio[$k] = $ov[$k];
}

$dir = dirname($ARCHIVO);
if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
    cfg_responder(['ok' => false, 'error' => 'No pude crear la carpeta de guardado.'], 500);
}

$json = json_encode($limpio, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    cfg_responder(['ok' => false, 'error' => 'No pude convertir la configuración.'], 500);
}

if (@file_put_contents($ARCHIVO, $json, LOCK_EX) === false) {
    cfg_responder(['ok' => false,
        'error' => 'No pude guardar. Revisá los permisos de api/almacen.'], 500);
}

/* El .js se arma con json_encode y no pegando texto: un apóstrofo en el
   nombre de una tienda alcanzaría para romper todas las páginas del sitio. */
$cab = "/* ==========================================================================\n"
     . "   VITALICA — data-overrides.js  ·  CONFIGURACIÓN PUBLICADA\n"
     . "   --------------------------------------------------------------------------\n"
     . "   GENERADO POR api/config-sitio.php. No editar a mano: se sobrescribe entero\n"
     . "   cada vez que alguien publica desde el panel de administrador.\n"
     . "   El original está en api/almacen/overrides.json.\n"
     . "   Se carga ANTES que data.js, que es quien lo aplica.\n"
     . "   Última publicación: " . date('d/m/Y H:i') . "\n"
     . "   ========================================================================== */\n"
     . "window.VITALICA_OVERRIDES = ";

if (@file_put_contents($PUBLICADO, $cab . $json . ";\n", LOCK_EX) === false) {
    cfg_responder(['ok' => false,
        'error' => 'Guardé los cambios pero no pude publicarlos. '
                 . 'Revisá los permisos de assets/js.'], 500);
}

$quien = sesion_usuario();
cfg_responder([
    'ok'        => true,
    'publicado' => gmdate('c'),
    'por'       => $quien['nombre'] ?? '',
    'peso'      => strlen($json),
]);
