<?php
/* ============================================================================
   VITALICA — api/odoo.php  ·  CREAR PRESUPUESTO EN ODOO
   ----------------------------------------------------------------------------
   Se usa solo si 'odoo.activo' está en true (viene apagado).

   Crea un PRESUPUESTO (sale.order en estado borrador), nunca una venta
   confirmada. La confirmación la hace una persona en Odoo después de hablar
   con el cliente por WhatsApp. Eso es a propósito: la web no sabe si hay
   stock del sabor pedido ni si el cliente va a pagar.

   CÓMO SABE QUÉ PRODUCTO CARGAR
   La página de producto pide sabor y presentación antes de agregar al
   carrito, y el pedido viaja con el código de barras de esa combinación
   exacta (ej. 5901330063985 = Whey Doble Chocolate 700 g). Acá se busca ese
   código en Odoo y se carga la línea correcta, sin adivinar.

   Si alguna vez llega un pedido sin código —un carrito guardado de antes del
   selector— se usa el mapeo de respaldo de abajo. Y si el código no existe en
   Odoo, la línea NO se inventa: queda anotada en el presupuesto para que el
   vendedor la agregue a mano.

   Usa JSON-RPC (no XML-RPC) porque en PHP es HTTP + JSON y no necesita
   ninguna extensión extra. El script de Python usa XML-RPC; son dos puertas
   al mismo Odoo.
   ============================================================================ */

declare(strict_types=1);

/* Mapeo id del sitio → códigos de barra en Odoo.
   Es el mismo MAPEO de sync-odoo-precios.py. Si allá se agrega un producto,
   agregalo también acá. Se pone el código de la presentación más vendida
   primero: es la que se usa cuando el sitio no dice cuál. */
const ODOO_MAPEO = [
    'whey-protein-complex'       => ['5901330063985'],
    'creatine-monohydrate'       => ['5901330026461'],
    'redweiler'                  => ['5901330044861'],
    'knockout-2'                 => ['5901330056291'],
    'beta-alanina-xplode'        => ['5901330077739'],
    'iso-plus-powder'            => ['5901330024214'],
    'vitamin-multiple-sport'     => [],
    'vitamin-multiple-sport-40'  => [],
    'gold-omega-3-sport'         => [],
    'arthroblock-forte'          => [],
];

/**
 * Llama a Odoo por JSON-RPC. Devuelve el resultado o lanza excepción.
 */
function odoo_llamar(string $url, array $params, int $timeout = 15) {
    $cuerpo = json_encode([
        'jsonrpc' => '2.0',
        'method'  => 'call',
        'params'  => $params,
        'id'      => random_int(1, 999999),
    ]);

    $ch = curl_init(rtrim($url, '/') . '/jsonrpc');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $cuerpo,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($resp === false) throw new RuntimeException('Sin conexión a Odoo: ' . $err);

    $data = json_decode((string)$resp, true);
    if (!is_array($data)) throw new RuntimeException('Odoo respondió algo que no es JSON');
    if (isset($data['error'])) {
        $msg = $data['error']['data']['message'] ?? ($data['error']['message'] ?? 'error desconocido');
        throw new RuntimeException('Odoo: ' . $msg);
    }
    return $data['result'] ?? null;
}

function odoo_login(array $c): int {
    $uid = odoo_llamar($c['url'], [
        'service' => 'common',
        'method'  => 'login',
        'args'    => [$c['db'], $c['usuario'], $c['api_key']],
    ]);
    if (!is_int($uid) || $uid <= 0) {
        throw new RuntimeException('Odoo rechazó las credenciales');
    }
    return $uid;
}

function odoo_ejecutar(array $c, int $uid, string $modelo, string $metodo, array $args, array $kwargs = []) {
    return odoo_llamar($c['url'], [
        'service' => 'object',
        'method'  => 'execute_kw',
        'args'    => [$c['db'], $uid, $c['api_key'], $modelo, $metodo, $args, $kwargs],
    ]);
}

/**
 * Crea el presupuesto. Devuelve el id, o false si no se pudo.
 */
function odoo_crear_presupuesto(array $c, array $pedido) {
    $uid = odoo_login($c);

    // --- Cliente: se busca por teléfono o email; si no está, se crea ---
    $cli = $pedido['cliente'];
    $nombreCompleto = trim($cli['nombre'] . ' ' . $cli['apellido']);

    $dominio = [];
    if ($cli['email'] !== '')    $dominio[] = ['email', '=', $cli['email']];
    if ($cli['telefono'] !== '') $dominio[] = ['phone', '=', $cli['telefono']];
    // OR entre las dos condiciones, en la notación polaca que usa Odoo
    if (count($dominio) === 2) array_unshift($dominio, '|');

    $partnerId = null;
    if ($dominio) {
        $hallados = odoo_ejecutar($c, $uid, 'res.partner', 'search', [$dominio], ['limit' => 1]);
        if (is_array($hallados) && $hallados) $partnerId = (int)$hallados[0];
    }
    if ($partnerId === null) {
        $partnerId = (int)odoo_ejecutar($c, $uid, 'res.partner', 'create', [[
            'name'       => $nombreCompleto !== '' ? $nombreCompleto : 'Cliente web',
            'phone'      => $cli['telefono'],
            'email'      => $cli['email'] ?: false,
            'street'     => $cli['direccion'] ?: false,
            'city'       => $cli['ciudad'] ?: false,
            'comment'    => 'Creado automáticamente desde la web (pedido ' . $pedido['numero'] . ')',
            'company_id' => (int)($c['company_id'] ?? 2),
        ]]);
    }

    // --- Líneas del pedido ---
    $lineas = [];
    $sinResolver = [];

    foreach ($pedido['items'] as $it) {
        // El sitio manda el código de barras de la variante exacta que eligió
        // el cliente. Ese es el camino normal desde que existe el selector de
        // sabor y presentación.
        $codigos = [];
        if (!empty($it['variante'])) {
            $codigos[] = $it['variante'];
        } else {
            // Respaldo para pedidos viejos (o si algún día se agrega un
            // producto al sitio sin cargarlo en VITALICA_VARIANTES).
            $codigos = ODOO_MAPEO[$it['id']] ?? [];
        }

        $productId = null;
        foreach ($codigos as $barcode) {
            $r = odoo_ejecutar($c, $uid, 'product.product', 'search', [[['barcode', '=', $barcode]]], ['limit' => 1]);
            if (is_array($r) && $r) { $productId = (int)$r[0]; break; }
        }

        if ($productId === null) {
            // No lo encontramos: no inventamos un producto. Queda anotado y el
            // vendedor lo agrega a mano.
            $texto = $it['cantidad'] . ' x ' . $it['nombre'];
            if (!empty($it['varianteTexto'])) $texto .= ' (' . $it['varianteTexto'] . ')';
            if (!empty($it['variante']))      $texto .= ' [código ' . $it['variante'] . ' no existe en Odoo]';
            $sinResolver[] = $texto;
            continue;
        }

        $lineas[] = [0, 0, [
            'product_id'       => $productId,
            'product_uom_qty'  => $it['cantidad'],
        ]];
    }

    if (!$lineas && !$sinResolver) return false;

    // --- Nota interna: qué pidió el cliente y qué hay que revisar ---
    $nota = [];
    $nota[] = 'PEDIDO WEB ' . $pedido['numero'];
    $nota[] = 'Entrega: ' . ($pedido['entregaLabel'] ?: $pedido['entrega']);
    if ($pedido['entrega'] === 'retiro' && $cli['local']) $nota[] = 'Local de retiro: ' . $cli['local'];
    if ($cli['referencia']) $nota[] = 'Referencia: ' . $cli['referencia'];
    if ($pedido['pagoLabel']) $nota[] = 'Forma de pago elegida: ' . $pedido['pagoLabel'];
    $nota[] = '';
    $nota[] = 'Sabor y presentación los eligió el cliente en la web.';
    $nota[] = 'Confirmar stock por WhatsApp antes de pasar a pedido de venta.';
    if ($sinResolver) {
        $nota[] = '';
        $nota[] = 'NO SE PUDIERON CARGAR (agregar a mano):';
        foreach ($sinResolver as $s) $nota[] = '  - ' . $s;
    }

    $datos = [
        'partner_id' => $partnerId,
        'company_id' => (int)($c['company_id'] ?? 2),
        'origin'     => $pedido['numero'],
        'note'       => implode("\n", $nota),
    ];
    if ($lineas) $datos['order_line'] = $lineas;

    $orderId = odoo_ejecutar($c, $uid, 'sale.order', 'create', [$datos]);
    return is_int($orderId) ? $orderId : false;
}
