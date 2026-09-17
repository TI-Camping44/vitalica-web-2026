<?php
/* ============================================================================
   VITALICA — api/sync-precios.php  ·  ACTUALIZA PRECIOS Y STOCK DESDE ODOO
   ----------------------------------------------------------------------------
   Escribe assets/js/precios.js, que es de donde el sitio lee los precios y el
   stock. Hace exactamente lo mismo que sync-odoo-precios.py, pero en PHP.

   POR QUÉ EXISTE ESTA VERSIÓN
   ---------------------------
   La versión en Python corre en la computadora de alguien y hay que subir el
   archivo a mano. Resultado: el stock del sitio tenía un día de atraso, porque
   se actualizaba solo cuando alguien se acordaba.

   Ésta corre EN EL SERVIDOR, como tarea programada de cPanel. Se actualiza
   sola aunque no haya nadie. El hosting es cPanel con PHP 8.2; Python puede
   no estar disponible ahí, PHP seguro que sí.

   Las dos versiones conviven: la de Python sigue sirviendo para probar desde
   tu compu y para el modo --listar.

   NO SE DUPLICA EL MAPEO
   ----------------------
   Qué código de barras corresponde a cada producto del sitio está en
   odoo-mapeo.json, en la raíz, y lo leen las DOS versiones. Si estuviera
   copiado en cada una, tarde o temprano quedarían distintas y nadie se
   enteraría hasta que un precio saliera mal.

   SOLO SE PUEDE CORRER POR CONSOLA
   --------------------------------
   No responde por HTTP. Una tarea de cPanel usa PHP de consola, así que no
   hace falta exponer una dirección web que después haya que proteger.

   CÓMO SE PROGRAMA EN cPANEL
   --------------------------
   cPanel → "Trabajos cron" (Cron Jobs) → Agregar nuevo:

       Cada hora (minuto 5):   5 * * * *
       Comando:
       /usr/local/bin/php /home/USUARIO/public_html/api/sync-precios.php >> /home/USUARIO/logs/sync-precios.log 2>&1

   Reemplazá USUARIO por tu usuario de cPanel (aparece arriba a la derecha).
   La ruta de php puede variar; cPanel la muestra en "Seleccionar versión de PHP".

   CREDENCIALES
   ------------
   Salen de api/config.php, sección 'odoo' — el mismo lugar que ya usa
   api/odoo.php para crear presupuestos. No se agrega ningún archivo de claves
   nuevo. Ese config está bloqueado por api/htaccess: no se puede descargar.

   Si esa sección está vacía (por ejemplo corriendo desde tu compu), cae al
   archivo odoo-credenciales.ini de la raíz, que es el que usa la versión
   Python.
   ============================================================================ */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script solo se ejecuta por consola.\n");
}

require_once __DIR__ . '/odoo.php';   // odoo_llamar, odoo_login, odoo_ejecutar

$RAIZ    = dirname(__DIR__);
$SALIDA  = $RAIZ . '/assets/js/precios.js';
$MAPEO   = $RAIZ . '/odoo-mapeo.json';


/* ---------------------------------------------------------------- registro */
function avisar(string $texto): void {
    fwrite(STDOUT, date('Y-m-d H:i:s') . '  ' . $texto . "\n");
}

function morir(string $texto): never {
    fwrite(STDERR, date('Y-m-d H:i:s') . '  ERROR: ' . $texto . "\n");
    exit(1);
}


/* ----------------------------------------------------------- configuración */
/**
 * Lee un .ini sencillo.
 *
 * No se usa parse_ini_file() de PHP porque odoo-credenciales.ini tiene los
 * comentarios con '#', y esa función solo acepta ';' — con '#' tira un error
 * de sintaxis y devuelve false.
 */
function leer_ini(string $ruta): array {
    $datos = [];
    foreach (file($ruta, FILE_IGNORE_NEW_LINES) as $linea) {
        $linea = trim($linea);
        if ($linea === '' || $linea[0] === '#' || $linea[0] === ';' || $linea[0] === '[') continue;
        $partes = explode('=', $linea, 2);
        if (count($partes) !== 2) continue;
        $datos[trim($partes[0])] = trim($partes[1]);
    }
    return $datos;
}

function cargar_config(string $raiz): array {
    $c = [];

    $rutaConfig = __DIR__ . '/config.php';
    if (is_file($rutaConfig)) {
        $cfg = require $rutaConfig;
        if (!empty($cfg['odoo'])) $c = $cfg['odoo'];
    }

    // ¿Alcanza con lo que hay? Si no, probamos el .ini de la raíz.
    $completa = fn(array $x) => !empty($x['url']) && !empty($x['db'])
                             && !empty($x['usuario']) && !empty($x['api_key']);

    if (!$completa($c)) {
        $rutaIni = $raiz . '/odoo-credenciales.ini';
        if (is_file($rutaIni)) {
            $ini = leer_ini($rutaIni);
            $c = [
                'url'        => $ini['url']        ?? ($c['url'] ?? ''),
                'db'         => $ini['db']         ?? '',
                'usuario'    => $ini['usuario']    ?? '',
                'api_key'    => $ini['api_key']    ?? '',
                'company_id' => (int)($ini['company_id'] ?? ($c['company_id'] ?? 2)),
                'pricelist'  => $ini['pricelist']  ?? 'Público',
            ];
            avisar('Config tomada de odoo-credenciales.ini');
        }
    } else {
        $c['pricelist'] = $c['pricelist'] ?? 'Público';
        avisar('Config tomada de api/config.php');
    }

    if (!$completa($c)) {
        morir('Faltan credenciales de Odoo. Completá la sección odoo de '
            . 'api/config.php, o dejá odoo-credenciales.ini en la raíz.');
    }
    return $c;
}


/* -------------------------------------------------------- lectura de Odoo */
function leer_productos(array $c, int $uid): array {
    // Mismo filtro que la versión Python: productos vendibles de la compañía
    // (o sin compañía asignada, que en Odoo significa "todas").
    $dominio = [
        '|', ['company_id', '=', false], ['company_id', '=', (int)$c['company_id']],
        ['sale_ok', '=', true],
    ];
    return odoo_ejecutar($c, $uid, 'product.template', 'search_read', [$dominio], [
        'fields'  => ['name', 'default_code', 'barcode', 'list_price', 'qty_available'],
        'limit'   => 500,
        'context' => ['allowed_company_ids' => [(int)$c['company_id']]],
    ]);
}

/**
 * Precios de la lista publicada, indexados por id de plantilla.
 *
 * No se usa list_price (el "precio de venta" base) porque el precio que
 * Vitalica publica sale de la lista "Público", y puede diferir.
 *
 * Solo se aplican reglas de PRECIO FIJO. Las de porcentaje o fórmula dependen
 * de un precio base y de la jerarquía de listas: replicarlas acá sería
 * adivinar. Si aparecen, se avisa y ese producto cae a su precio base.
 */
function leer_lista_precios(array $c, int $uid): array {
    $listas = odoo_ejecutar($c, $uid, 'product.pricelist', 'search_read',
        [[['name', '=', $c['pricelist']]]],
        ['fields' => ['name'], 'limit' => 5]);

    if (!$listas) {
        avisar('AVISO: no encontré la lista "' . $c['pricelist'] . '". Se usa el precio base.');
        return [[], null];
    }
    $lista = $listas[0];

    $items = odoo_ejecutar($c, $uid, 'product.pricelist.item', 'search_read',
        [[['pricelist_id', '=', $lista['id']]]],
        ['fields' => ['product_tmpl_id', 'fixed_price', 'compute_price',
                      'min_quantity', 'date_start', 'date_end'], 'limit' => 2000]);

    $hoy = date('Y-m-d');
    $precios = [];
    $ignoradas = 0;

    foreach ($items as $it) {
        if (($it['compute_price'] ?? '') !== 'fixed') { $ignoradas++; continue; }
        if ((float)($it['min_quantity'] ?? 0) > 1) continue;          // mayorista
        $ini = $it['date_start'] ?? '';
        $fin = $it['date_end'] ?? '';
        if ($ini && substr((string)$ini, 0, 10) > $hoy) continue;      // todavía no rige
        if ($fin && substr((string)$fin, 0, 10) < $hoy) continue;      // vencida

        $tmpl = $it['product_tmpl_id'] ?? null;
        if (is_array($tmpl) && isset($tmpl[0])) {
            $precios[(int)$tmpl[0]] = (float)($it['fixed_price'] ?? 0);
        }
    }

    if ($ignoradas) {
        avisar('AVISO: ' . $ignoradas . ' reglas no son de precio fijo y no se aplicaron.');
    }
    avisar('Lista "' . $lista['name'] . '": ' . count($precios) . ' precios fijos.');
    return [$precios, $lista['name']];
}


/* ------------------------------------------------------------------ salida */
function como_json(array $x): string {
    if (!$x) return "{}";
    $lineas = [];
    foreach ($x as $k => $v) {
        $val = is_bool($v) ? ($v ? 'true' : 'false') : (string)$v;
        $lineas[] = '  "' . $k . '": ' . $val;
    }
    return "{\n" . implode(",\n", $lineas) . "\n}";
}


/* -------------------------------------------------------------------- main */
$c = cargar_config($RAIZ);

if (!is_file($MAPEO)) morir('Falta odoo-mapeo.json en la raíz.');
$mapeo = json_decode((string)file_get_contents($MAPEO), true);
if (!is_array($mapeo) || !$mapeo) morir('odoo-mapeo.json vacío o mal formado.');

try {
    $uid = odoo_login($c);
    avisar('Conectado a Odoo (uid ' . $uid . ').');
    $productos = leer_productos($c, $uid);
    avisar(count($productos) . ' productos vendibles leídos.');
    [$preciosLista, ] = leer_lista_precios($c, $uid);
} catch (Throwable $e) {
    morir('Odoo: ' . $e->getMessage());
}

// Índices por referencia interna y por código de barras (el mapeo usa EAN,
// pero en esta base la referencia interna suele ser el mismo número).
$porRef = $porCb = [];
foreach ($productos as $p) {
    if (!empty($p['default_code'])) $porRef[(string)$p['default_code']] = $p;
    if (!empty($p['barcode']))      $porCb[(string)$p['barcode']]      = $p;
}

$precioDe = function (array $p) use ($preciosLista): array {
    $v = $preciosLista[(int)$p['id']] ?? null;
    if ($v) return [$v, true];
    return [(float)($p['list_price'] ?? 0), false];
};

$precios = $desde = $stock = $precioVar = $stockVar = [];
$faltantes = [];

foreach ($mapeo as $idWeb => $refs) {
    $encontrados = [];
    foreach ((array)$refs as $ref) {
        $p = $porRef[(string)$ref] ?? $porCb[(string)$ref] ?? null;
        if ($p) $encontrados[] = $p;
        else    $faltantes[] = $idWeb . ' / ' . $ref;
    }
    if (!$encontrados) continue;

    $conPrecio = [];
    foreach ($encontrados as $p) { [$v, ] = $precioDe($p); if ($v > 0) $conPrecio[] = $p; }
    if (!$conPrecio) continue;

    $valores = [];
    foreach ($conPrecio as $p) { [$v, ] = $precioDe($p); $valores[] = (int)round($v); }

    $precios[$idWeb] = min($valores);
    // "Desde" solo si las variantes tienen precios distintos entre sí: así el
    // sitio no dice "Desde" cuando en realidad hay un solo precio.
    $desde[$idWeb]   = count(array_unique($valores)) > 1;

    $suma = 0;
    foreach ($encontrados as $p) $suma += (float)($p['qty_available'] ?? 0);
    $stock[$idWeb] = (int)$suma;

    // Precio y stock de CADA variante, por código de barras. Es lo que usa el
    // selector de sabor y presentación.
    foreach ($encontrados as $p) {
        $cb = trim((string)($p['barcode'] ?? ''));
        if ($cb === '') continue;
        [$v, ] = $precioDe($p);
        if ($v > 0) $precioVar[$cb] = (int)round($v);
        $stockVar[$cb] = (int)($p['qty_available'] ?? 0);
    }
}

if ($faltantes) {
    avisar('AVISO: ' . count($faltantes) . ' referencias del mapeo no están en Odoo: '
        . implode(', ', array_slice($faltantes, 0, 8)));
}
if (!$precios) morir('No se armó ningún precio. No se toca precios.js.');

$sello = date('d/m/Y H:i');
$cuerpo = <<<JS
/* GENERADO POR api/sync-precios.php — NO EDITAR A MANO */
/* Sincronizado desde Odoo el {$sello}. NO EDITAR A MANO:
   este bloque lo reescribe el sync y cualquier
   cambio manual se pierde. Los precios se cambian en Odoo.

   PRECIO = el más bajo entre las variantes (sabores y tamaños).
   DESDE  = true si las variantes tienen precios distintos, para
            que el sitio muestre "Desde Gs. X" y no mienta.

   Las dos tablas _VARIANTE van por código de barras y las usa
   el selector de sabor/presentación de la página de producto.
   Tienen que coincidir con VITALICA_VARIANTES de data.js. */
window.VITALICA_PRECIOS =

JS;

$cuerpo = rtrim($cuerpo) . ' ' . como_json($precios) . ";\n"
        . 'window.VITALICA_PRECIO_DESDE = ' . como_json($desde) . ";\n"
        . 'window.VITALICA_STOCK = ' . como_json($stock) . ";\n"
        . 'window.VITALICA_PRECIOS_VARIANTE = ' . como_json($precioVar) . ";\n"
        . 'window.VITALICA_STOCK_VARIANTE = ' . como_json($stockVar) . ";\n";

// Se escribe primero a un temporal y recién ahí se reemplaza: si el proceso se
// corta a la mitad, el sitio se queda con el precios.js anterior —viejo pero
// entero— en vez de con un archivo cortado que rompería toda la web.
$tmp = $SALIDA . '.tmp';
if (@file_put_contents($tmp, $cuerpo) === false) morir('No pude escribir ' . $tmp);
if (!@rename($tmp, $SALIDA)) { @unlink($tmp); morir('No pude reemplazar ' . $SALIDA); }

avisar('Listo: ' . count($precios) . ' productos, ' . count($stockVar)
     . ' variantes con stock → assets/js/precios.js');
