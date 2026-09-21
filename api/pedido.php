<?php
/* ============================================================================
   VITALICA — api/pedido.php  ·  RECIBE Y GUARDA UN PEDIDO
   ----------------------------------------------------------------------------
   Qué hace, en orden:
     1) Valida que el pedido venga del sitio y tenga sentido
     2) Lo guarda en un archivo (una línea por pedido)
     3) Le avisa al equipo por email
     4) Le manda copia al cliente, si dejó email
     5) Si Odoo está activado, crea el presupuesto (viene apagado)

   QUÉ NO HACE: no cobra. No toca tarjetas. El pago se sigue cerrando por
   WhatsApp con un asesor.

   PRINCIPIO DE DISEÑO — esto NUNCA puede frenar una venta.
   Si el guardado falla, si el mail no sale, si Odoo no responde: el pedido
   igual se da por recibido y el cliente sigue a WhatsApp. Los errores se
   anotan en el log, no se le muestran al cliente. Perder una venta porque
   el servidor de correo estaba caído sería el peor negocio posible.
   ============================================================================ */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
$rutaConfig = __DIR__ . '/config.php';
if (!file_exists($rutaConfig)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'sin_configurar']);
    exit;
}
$cfg = require $rutaConfig;

// ---------------------------------------------------------------------------
// Solo POST
// ---------------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'metodo_no_permitido']);
    exit;
}

// ---------------------------------------------------------------------------
// Origen permitido
// Sin esto, cualquier sitio podría mandar pedidos falsos a este endpoint.
// ---------------------------------------------------------------------------
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$permitidos = $cfg['origenes_permitidos'] ?? [];

/* Si el servidor ES la máquina de desarrollo, se aceptan también los orígenes
   locales. Así se puede probar todo con "php -S localhost:8080" sin tener que
   tocar la lista de orígenes ni, peor, desactivar el control y olvidarse
   prendido en producción.

   Esto NO abre un agujero: la excepción depende de que el SERVIDOR sea
   localhost. En vitalica.com.py el host es el dominio real, así que un
   Origin: http://localhost sigue siendo rechazado igual que antes. */
$host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
    $permitidos[] = 'http://localhost:' . ($_SERVER['SERVER_PORT'] ?? '80');
    $permitidos[] = 'http://127.0.0.1:' . ($_SERVER['SERVER_PORT'] ?? '80');
}

if ($origen !== '' && !in_array($origen, $permitidos, true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'origen_no_permitido', 'origen' => $origen]);
    exit;
}
if ($origen !== '') {
    header('Access-Control-Allow-Origin: ' . $origen);
}

// ---------------------------------------------------------------------------
// Carpeta de almacenamiento
// ---------------------------------------------------------------------------
$carpeta = $cfg['carpeta_pedidos'] ?: (__DIR__ . '/almacen');
if (!is_dir($carpeta)) {
    @mkdir($carpeta, 0750, true);
}

function anotarLog(string $carpeta, string $texto): void {
    @file_put_contents(
        $carpeta . '/errores.log',
        '[' . date('Y-m-d H:i:s') . '] ' . $texto . "\n",
        FILE_APPEND | LOCK_EX
    );
}

// ---------------------------------------------------------------------------
// Freno de spam por IP
// ---------------------------------------------------------------------------
$limite = (int)($cfg['limite_por_hora'] ?? 20);
if ($limite > 0) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $archivoRitmo = $carpeta . '/ritmo-' . md5($ip) . '.txt';
    $ahora = time();
    $marcas = [];
    if (file_exists($archivoRitmo)) {
        $marcas = array_filter(
            explode(',', (string)@file_get_contents($archivoRitmo)),
            fn($t) => is_numeric($t) && ($ahora - (int)$t) < 3600
        );
    }
    if (count($marcas) >= $limite) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'demasiados_pedidos']);
        exit;
    }
    $marcas[] = (string)$ahora;
    @file_put_contents($archivoRitmo, implode(',', $marcas), LOCK_EX);
}

// ---------------------------------------------------------------------------
// Leer y validar el pedido
// ---------------------------------------------------------------------------
$crudo = file_get_contents('php://input');
if ($crudo === false || strlen($crudo) > 100000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'cuerpo_invalido']);
    exit;
}
$p = json_decode($crudo, true);
if (!is_array($p)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'json_invalido']);
    exit;
}

function limpiar($v, int $max = 200): string {
    if (!is_scalar($v)) return '';
    $s = trim((string)$v);
    $s = preg_replace('/[\r\n\t]+/', ' ', $s) ?? '';
    return mb_substr($s, 0, $max);
}

$numero = limpiar($p['numero'] ?? '', 40);
// El número lo propone el navegador. Si no viene o viene raro, lo hacemos acá:
// nunca confiar en que el cliente mandó algo con el formato correcto.
if (!preg_match('/^VIT-\d{6}-\d{4}$/', $numero)) {
    $numero = 'VIT-' . date('ymd') . '-' . str_pad((string)random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
}

$cliente = [
    'nombre'     => limpiar($p['nombre'] ?? '', 80),
    'apellido'   => limpiar($p['apellido'] ?? '', 80),
    'telefono'   => limpiar($p['telefono'] ?? '', 40),
    'email'      => filter_var(trim((string)($p['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '',
    'ciudad'     => limpiar($p['ciudad'] ?? '', 80),
    'direccion'  => limpiar($p['direccion'] ?? '', 200),
    'referencia' => limpiar($p['referencia'] ?? '', 200),
    'local'      => limpiar($p['local'] ?? '', 120),
];

if ($cliente['nombre'] === '' || $cliente['telefono'] === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'faltan_datos']);
    exit;
}

$items = [];
foreach ((array)($p['items'] ?? []) as $it) {
    if (!is_array($it)) continue;
    $cant = (int)($it['cantidad'] ?? 0);
    if ($cant < 1 || $cant > 999) continue;
    // 'variante' es el código de barras de la combinación exacta de sabor y
    // presentación. Es lo que permite crear la línea correcta en Odoo.
    $variante = preg_replace('/[^0-9A-Za-z\-]/', '', (string)($it['variante'] ?? '')) ?: null;
    $items[] = [
        'id'            => limpiar($it['id'] ?? '', 60),
        'nombre'        => limpiar($it['nombre'] ?? '', 120),
        'variante'      => $variante ? mb_substr($variante, 0, 40) : null,
        'varianteTexto' => limpiar($it['varianteTexto'] ?? '', 80),
        'cantidad'      => $cant,
        'subtotal'      => is_numeric($it['subtotal'] ?? null) ? (float)$it['subtotal'] : null,
    ];
}
if (!$items) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'pedido_vacio']);
    exit;
}

$pedido = [
    'numero'    => $numero,
    'fecha'     => date('c'),
    'cliente'   => $cliente,
    'items'     => $items,
    'entrega'   => limpiar($p['entrega'] ?? '', 40),
    'entregaLabel' => limpiar($p['entregaLabel'] ?? '', 80),
    'pago'      => limpiar($p['pago'] ?? '', 40),
    'pagoLabel' => limpiar($p['pagoLabel'] ?? '', 80),
    'subtotal'  => is_numeric($p['subtotal'] ?? null) ? (float)$p['subtotal'] : null,
    'envio'     => is_numeric($p['envio'] ?? null) ? (float)$p['envio'] : null,
    'total'     => is_numeric($p['total'] ?? null) ? (float)$p['total'] : null,
    'ip'        => $_SERVER['REMOTE_ADDR'] ?? '',
];

// ---------------------------------------------------------------------------
// 1) Guardar — un archivo por mes, un pedido por línea (formato JSONL).
//    Se elige así y no una base de datos porque no necesita instalar nada,
//    se abre con cualquier editor y se puede importar a Excel sin drama.
// ---------------------------------------------------------------------------
$guardado = false;
$archivo = $carpeta . '/pedidos-' . date('Y-m') . '.jsonl';
$linea = json_encode($pedido, JSON_UNESCAPED_UNICODE) . "\n";
if (@file_put_contents($archivo, $linea, FILE_APPEND | LOCK_EX) !== false) {
    $guardado = true;
} else {
    anotarLog($carpeta, 'No se pudo escribir el pedido ' . $numero . ' en ' . $archivo);
}

// ---------------------------------------------------------------------------
// 2) y 3) Emails
// ---------------------------------------------------------------------------
function moneda(?float $v): string {
    return $v === null ? 'a confirmar' : 'Gs. ' . number_format($v, 0, ',', '.');
}

function cuerpoTexto(array $pe): string {
    $L = [];
    $L[] = 'PEDIDO ' . $pe['numero'];
    $L[] = 'Recibido: ' . date('d/m/Y H:i');
    $L[] = '';
    $L[] = 'PRODUCTOS';
    foreach ($pe['items'] as $it) {
        $linea = '  ' . $it['cantidad'] . ' x ' . $it['nombre'];
        if (!empty($it['varianteTexto'])) $linea .= ' (' . $it['varianteTexto'] . ')';
        $L[] = $linea . '   ' . moneda($it['subtotal']);
    }
    $L[] = '';
    $L[] = 'Subtotal: ' . moneda($pe['subtotal']);
    $L[] = 'Envio:    ' . moneda($pe['envio']);
    $L[] = 'TOTAL:    ' . moneda($pe['total']);
    $L[] = '';
    $L[] = 'CLIENTE';
    $L[] = '  ' . $pe['cliente']['nombre'] . ' ' . $pe['cliente']['apellido'];
    $L[] = '  WhatsApp: ' . $pe['cliente']['telefono'];
    if ($pe['cliente']['email']) $L[] = '  Email: ' . $pe['cliente']['email'];
    $L[] = '';
    $L[] = 'ENTREGA';
    $L[] = '  ' . ($pe['entregaLabel'] ?: $pe['entrega']);
    if ($pe['entrega'] === 'retiro') {
        if ($pe['cliente']['local']) $L[] = '  Local: ' . $pe['cliente']['local'];
    } else {
        if ($pe['cliente']['ciudad'])     $L[] = '  Ciudad: ' . $pe['cliente']['ciudad'];
        if ($pe['cliente']['direccion'])  $L[] = '  Direccion: ' . $pe['cliente']['direccion'];
        if ($pe['cliente']['referencia']) $L[] = '  Referencia: ' . $pe['cliente']['referencia'];
    }
    if ($pe['pagoLabel']) {
        $L[] = '';
        $L[] = 'FORMA DE PAGO';
        $L[] = '  ' . $pe['pagoLabel'];
    }
    return implode("\n", $L);
}

function enviarMail(array $cfg, string $para, string $asunto, string $cuerpo, string $responderA = '', string $html = ''): bool {
    $desde = $cfg['email_desde'] ?? '';
    if ($desde === '' || $para === '') return false;
    $nombre = $cfg['nombre_desde'] ?? 'Vitalica';

    /* Modo prueba: en vez de enviar, se guarda el correo como archivo.
       Se usa para probar en una compu sin servidor de correo (Windows), y
       para revisar el diseño sin mandarle nada a nadie. */
    if (!empty($cfg['correos_a_archivo'])) {
        $dir = ($cfg['carpeta_pedidos'] ?? '') ?: (__DIR__ . '/almacen');
        if (!is_dir($dir)) @mkdir($dir, 0750, true);
        $nombreArch = $dir . '/correo-' . date('Ymd-His') . '-' .
                      preg_replace('/[^a-z0-9]/i', '_', $para) . '.html';
        $contenido =
            '<!-- Para: ' . $para . ' | Asunto: ' . $asunto . ' -->' . "\n" .
            ($html !== '' ? $html : '<pre>' . htmlspecialchars($cuerpo) . '</pre>');
        return @file_put_contents($nombreArch, $contenido) !== false;
    }

    $cabeceras = [
        'From: ' . mb_encode_mimeheader($nombre) . ' <' . $desde . '>',
        'MIME-Version: 1.0',
        'X-Mailer: Vitalica-Web',
    ];
    if ($responderA !== '') $cabeceras[] = 'Reply-To: ' . $responderA;

    if ($html === '') {
        // Aviso interno al equipo: texto plano, que se lee de un vistazo.
        $cabeceras[] = 'Content-Type: text/plain; charset=UTF-8';
        $mensaje = $cuerpo;
    } else {
        /* Correo al cliente: se manda en los DOS formatos a la vez
           (multipart/alternative). El cliente de correo elige: si soporta
           HTML muestra la versión con marca; si no —o si el cliente bloquea
           HTML— muestra el texto plano, que dice exactamente lo mismo.
           Nunca queda un correo vacío o ilegible. */
        $limite = 'vit_' . bin2hex(random_bytes(12));
        $cabeceras[] = 'Content-Type: multipart/alternative; boundary="' . $limite . '"';
        $mensaje =
            "--$limite\r\n" .
            "Content-Type: text/plain; charset=UTF-8\r\n" .
            "Content-Transfer-Encoding: 8bit\r\n\r\n" .
            $cuerpo . "\r\n\r\n" .
            "--$limite\r\n" .
            "Content-Type: text/html; charset=UTF-8\r\n" .
            "Content-Transfer-Encoding: 8bit\r\n\r\n" .
            $html . "\r\n\r\n" .
            "--$limite--";
    }

    return @mail(
        $para,
        mb_encode_mimeheader($asunto),
        $mensaje,
        implode("\r\n", $cabeceras),
        '-f' . $desde
    );
}

/* ---------------------------------------------------------------------------
   CORREO DE CONFIRMACIÓN PARA EL CLIENTE (HTML)
   ---------------------------------------------------------------------------
   El diseño NO está acá: está en plantilla-correo.html, que es HTML común y se
   puede editar sin saber PHP. Esta función solo reemplaza lo que va entre
   llaves dobles.

   Se separó a propósito: así el correo se puede abrir en el navegador para ver
   cómo queda, cambiar un texto o un color no obliga a tocar código, y no hay
   riesgo de romper el PHP por editar el diseño.

   Si la plantilla no existe, devuelve cadena vacía y el correo sale igual en
   texto plano. Nunca deja al cliente sin confirmación.
   --------------------------------------------------------------------------- */
function cuerpoHtmlCliente(array $pe, array $cfg): string {
    $ruta = __DIR__ . '/plantilla-correo.html';
    if (!file_exists($ruta)) return '';
    $tpl = (string)@file_get_contents($ruta);
    if ($tpl === '') return '';

    $e  = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
    $gs = fn($v) => $v === null ? 'a confirmar' : 'Gs. ' . number_format($v, 0, ',', '.');
    $cli = $pe['cliente'];

    // Filas de productos
    $filas = '';
    foreach ($pe['items'] as $it) {
        $variante = !empty($it['varianteTexto'])
            ? '<div style="color:#565C66;font-size:13px;margin-top:2px">' . $e($it['varianteTexto']) . '</div>'
            : '';
        $filas .=
            '<tr>' .
              '<td style="padding:12px 0;border-bottom:1px solid #E6E8EC;color:#16191D;font-size:15px">' .
                '<strong>' . (int)$it['cantidad'] . '&times;</strong> ' . $e($it['nombre']) . $variante .
              '</td>' .
              '<td style="padding:12px 0;border-bottom:1px solid #E6E8EC;text-align:right;white-space:nowrap;color:#16191D;font-size:15px">' .
                $e($gs($it['subtotal'])) .
              '</td>' .
            '</tr>';
    }

    // Entrega
    if (($pe['entrega'] ?? '') === 'retiro') {
        $entrega = '<strong>' . $e($pe['entregaLabel']) . '</strong>';
        if (!empty($cli['local'])) $entrega .= '<br>' . $e($cli['local']);
    } else {
        $entrega = '<strong>' . $e($pe['entregaLabel']) . '</strong><br>' .
                   $e($cli['direccion']) . '<br>' . $e($cli['ciudad']);
        if (!empty($cli['referencia'])) $entrega .= '<br><em>' . $e($cli['referencia']) . '</em>';
    }

    return strtr($tpl, [
        '{{NUMERO}}'   => $e($pe['numero']),
        '{{NOMBRE}}'   => $e($cli['nombre']),
        '{{FILAS}}'    => $filas,
        '{{SUBTOTAL}}' => $e($gs($pe['subtotal'])),
        '{{ENVIO}}'    => $e($gs($pe['envio'])),
        '{{TOTAL}}'    => $e($gs($pe['total'])),
        '{{ENTREGA}}'  => $entrega,
        '{{PAGO}}'     => $e($pe['pagoLabel'] ?: 'A coordinar'),
        '{{WHATSAPP}}' => $e($cfg['whatsapp_link'] ?? '#'),
    ]);
}

$texto = cuerpoTexto($pedido);
$avisoEquipo = false;

foreach ((array)($cfg['emails_equipo'] ?? []) as $dest) {
    $asunto = 'Pedido web ' . $numero . ' — ' . $cliente['nombre'] . ' ' . $cliente['apellido'];
    if (enviarMail($cfg, $dest, $asunto, $texto, $cliente['email'])) {
        $avisoEquipo = true;
    } else {
        anotarLog($carpeta, 'Falló el aviso al equipo (' . $dest . ') del pedido ' . $numero);
    }
}

if (!empty($cfg['avisar_cliente']) && $cliente['email'] !== '') {
    // Versión en texto plano: la misma información, para clientes de correo
    // que no muestran HTML. Va siempre junto con la versión con diseño.
    $cuerpoCliente =
        'Hola ' . $cliente['nombre'] . ",\n\n" .
        "Recibimos tu pedido. Un asesor te va a escribir por WhatsApp para confirmar\n" .
        "disponibilidad y coordinar la entrega.\n\n" .
        "IMPORTANTE: este correo no es un comprobante de pago. Tu pedido queda\n" .
        "confirmado cuando hablemos y acordemos el pago. Todavía no se cobró nada.\n\n" .
        $texto . "\n\n" .
        "Si algo no coincide, respondé este correo o escribinos por WhatsApp.\n\n" .
        "Vitalica — Representante exclusivo de Olimp Sport Nutrition en Paraguay\n" .
        "Los suplementos no sustituyen una alimentación equilibrada.\n";

    // El link de WhatsApp se arma acá para que el HTML no tenga que saber
    // de dónde sale el número.
    $cfgMail = $cfg;
    $waNum = preg_replace('/\D/', '', (string)($cfg['whatsapp'] ?? '595976383922'));
    $cfgMail['whatsapp_link'] = 'https://wa.me/' . $waNum . '?text=' .
        rawurlencode('Hola Vitalica! Consulto por mi pedido ' . $numero . '.');

    $htmlCliente = cuerpoHtmlCliente($pedido, $cfgMail);

    if (!enviarMail($cfgMail, $cliente['email'], 'Tu pedido ' . $numero . ' — Vitalica',
                    $cuerpoCliente, '', $htmlCliente)) {
        anotarLog($carpeta, 'Falló la copia al cliente del pedido ' . $numero);
    }
}

// ---------------------------------------------------------------------------
// 4) Odoo (viene apagado — ver la nota en config.ejemplo.php)
// ---------------------------------------------------------------------------
$odooOk = null;
if (!empty($cfg['odoo']['activo'])) {
    try {
        require_once __DIR__ . '/odoo.php';
        $odooOk = odoo_crear_presupuesto($cfg['odoo'], $pedido);
        if ($odooOk === false) anotarLog($carpeta, 'Odoo rechazó el pedido ' . $numero);
    } catch (Throwable $e) {
        $odooOk = false;
        anotarLog($carpeta, 'Odoo falló en ' . $numero . ': ' . $e->getMessage());
    }
}

// ---------------------------------------------------------------------------
// 4) Anotarlo en la base, para que aparezca en "Mis pedidos"
// ---------------------------------------------------------------------------
//    El pedido sigue guardandose en el .jsonl de arriba, que es el original y
//    el que abre el equipo. Esto es un indice aparte: lo minimo para poder
//    listar los pedidos de alguien sin recorrer archivos mes por mes.
//
//    POR QUE VA ENVUELTO EN UN try QUE SE TRAGA TODO
//    Porque el pedido YA ESTA GUARDADO y el correo YA SALIO. Si la base
//    estuviera caida, dejar que reviente acá significaria devolverle un error
//    a alguien cuyo pedido si entro, y que probablemente lo vuelva a hacer.
//    Un pedido duplicado es peor que no verlo en "Mis pedidos".
//
//    cliente_id sale de la sesion, NO de lo que mande el navegador. Si viniera
//    del formulario, cualquiera podria mandar el id de otro y meterle un
//    pedido en la cuenta.
$enBase = false;
try {
    require_once __DIR__ . '/clientes.php';

    $quien = clientes_actual();
    $resumen = [];
    foreach ($items as $it) {
        $resumen[] = (int)($it['cantidad'] ?? 1) . ' x ' . (string)($it['nombre'] ?? '');
    }

    db_consulta(
        'INSERT INTO pedidos (numero, cliente_id, email, total, estado, resumen, creado)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            $numero,
            $quien ? (int)$quien['id'] : null,
            // El correo se guarda igual aunque no haya cuenta: si esa persona
            // se registra despues con el mismo correo, sus pedidos viejos
            // aparecen solos.
            mb_strtolower($cliente['email']),
            (int)round((float)($pedido['total'] ?? 0)),
            'nuevo',
            mb_substr(implode(' · ', $resumen), 0, 2000),
            db_ahora(),
        ]);
    $enBase = true;
} catch (Throwable $e) {
    anotarLog($carpeta, 'No se pudo indexar ' . $numero . ' en la base: ' . $e->getMessage());
}

// ---------------------------------------------------------------------------
// Respuesta — siempre ok. El cliente sigue a WhatsApp pase lo que pase.
// ---------------------------------------------------------------------------
echo json_encode([
    'ok'       => true,
    'numero'   => $numero,
    'guardado' => $guardado,
    'avisado'  => $avisoEquipo,
    'odoo'     => $odooOk,
    'enBase'   => $enBase,
], JSON_UNESCAPED_UNICODE);
