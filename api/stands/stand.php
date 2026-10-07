<?php
/* ============================================================================
   VITALICA — api/stands/stand.php  ·  ABRIR EL STAND
   ----------------------------------------------------------------------------
   Lo llama la página a la que lleva el QR del stand:

       GET /api/stands/stand.php?c=RMLAM2026

   Contesta JSON con el gimnasio, si está abierto ahora y el catálogo.

   REGLAS (docs/proyecto-stands.md)
     · Cupón inexistente o inactivo: 404 y SIN catálogo. Los dos casos dan la
       misma respuesta, para que no se pueda averiguar qué cupones existieron.
     · Fuera del horario: el catálogo va igual, con  abierto = false.
     · Solo productos con disponible > 0 en el almacén de ese gym, con
       disponible = cantidad − reservado. Eso lo calcula n8n; acá se vuelve a
       filtrar por las dudas (ver stands_normalizar_catalogo).

   LO QUE NO SALE NUNCA AL NAVEGADOR: ids de almacén y ubicación, el WhatsApp
   del recepcionista, credenciales. El socio ve nombre, dirección y ciudad.

   SI n8n NO CONTESTA
     · Con una copia de hace menos de 15 minutos: se muestra esa, marcada
       desactualizado = true. pedido.php revisa el stock de nuevo antes de
       cobrar, así que no se vende lo que no hay.
     · Sin copia: 503. Nunca un catálogo vacío, que el socio leería como
       "no hay nada" cuando en realidad no sabemos.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/base.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function stands_responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    stands_responder(405, ['ok' => false, 'error' => 'metodo']);
}

$cupon = stands_limpiar_cupon((string)($_GET['c'] ?? ''));
$noExiste = ['ok' => false, 'error' => 'cupon_invalido',
             'mensaje' => 'Este código no corresponde a ningún stand activo.'];
if ($cupon === '') stands_responder(404, $noExiste);

try {
    $stand = stands_buscar($cupon);
} catch (Throwable $e) {
    stands_log('stand', "base de datos: " . $e->getMessage());
    stands_responder(503, ['ok' => false, 'error' => 'no_disponible',
        'mensaje' => 'El stand no está disponible en este momento. Probá de nuevo en unos minutos.']);
}
if (!$stand) stands_responder(404, $noExiste);

try {
    $horario  = stands_horario((int)$stand['id']);
    $catalogo = stands_catalogo($stand);
} catch (Throwable $e) {
    stands_log('stand', "$cupon: " . $e->getMessage());
    stands_responder(503, ['ok' => false, 'error' => 'catalogo_no_disponible',
        'mensaje' => 'No pudimos cargar los productos del stand. Probá de nuevo en unos minutos.']);
}

stands_responder(200, [
    'ok'    => true,
    'stand' => [
        'cupon'     => $stand['cupon'],
        'nombre'    => $stand['nombre'],
        'direccion' => $stand['direccion'],
        'ciudad'    => $stand['ciudad'],
    ],
    'abierto' => $horario['abierto'],
    'horario' => [
        'cargado' => $horario['cargado'],
        'hoy'     => $horario['hoy'],
        'semana'  => $horario['semana'],   // 1 = lunes ... 7 = domingo
    ],
    'catalogo'       => $catalogo['productos'],
    'actualizado'    => $catalogo['actualizado'] . ' UTC',
    'desactualizado' => $catalogo['desactualizado'],
]);
