<?php
/* ============================================================================
   VITALICA — api/cuenta.php  ·  LO QUE LLAMA LA PÁGINA DE CUENTA
   ----------------------------------------------------------------------------
   Recibe los formularios de cuenta.html y contesta JSON. Toda la lógica está
   en clientes.php; acá solo se leen los datos que llegan, se llama a la
   función que corresponde y se devuelve la respuesta.

   Esa división importa: clientes.php se puede probar desde la consola sin
   levantar un servidor —y se prueba, con 40 casos— porque no sabe nada de
   pedidos HTTP.

   POR QUÉ NO HAY TOKEN DE FORMULARIO ACÁ
   --------------------------------------
   El panel del blog sí lo tiene. Acá la protección es otra y es más fuerte:
   la cookie de sesión va con SameSite=Lax, así que el navegador NO la manda
   en un POST que venga de otro sitio. Un formulario preparado en otra página
   llega sin sesión, y sin sesión estas acciones no hacen nada.

   Se agrega además una revisión del Origin, que es un segundo cerrojo para
   los navegadores viejos que no respetan SameSite.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/clientes.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function cuenta_responder(array $d, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Lo que se le cuenta a la página sobre quién está conectado. */
function cuenta_publico(?array $c): ?array
{
    if (!$c) return null;
    return [
        'id'       => (int)$c['id'],
        'nombre'   => (string)$c['nombre'],
        'email'    => (string)$c['email'],
        'telefono' => (string)$c['telefono'],
        'completo' => clientes_perfil_completo($c),
        // Para saber si ofrecer "cambiar contraseña" o "ponerle una".
        'conClave' => (string)($c['hash'] ?? '') !== '',
        'conGoogle'=> (string)($c['google_id'] ?? '') !== '',
    ];
}

/* --- De dónde viene el pedido ---------------------------------------------
   Solo se revisa en POST: un GET no cambia nada. El pedido sin Origin se
   deja pasar porque los navegadores no siempre lo mandan en formularios del
   mismo sitio, y rechazarlo dejaría afuera a gente legítima. */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $origen = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origen !== '') {
        $host = (string)($_SERVER['HTTP_HOST'] ?? '');
        $esperado = ['https://' . $host, 'http://' . $host];
        if (!in_array($origen, $esperado, true)) {
            cuenta_responder(['ok' => false, 'error' => 'Pedido rechazado.'], 403);
        }
    }
}

/* --- Lo que llegó ---------------------------------------------------------
   Se acepta JSON y también un formulario común. Lo segundo es la red de
   seguridad: si un día falla el JavaScript, un <form> normal sigue andando. */
$entra = [];
$tipo  = (string)($_SERVER['CONTENT_TYPE'] ?? '');
if (stripos($tipo, 'application/json') !== false) {
    $j = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($j)) $entra = $j;
} else {
    $entra = $_POST;
}

$accion = (string)($entra['accion'] ?? $_GET['accion'] ?? 'yo');
$txt = fn(string $k): string => trim((string)($entra[$k] ?? ''));


/* ===========================================================================
   ACCIONES
   =========================================================================== */
switch ($accion) {

    /* Quién está conectado. Lo llama el encabezado de todas las páginas. */
    case 'yo':
        cuenta_responder(['ok' => true, 'cliente' => cuenta_publico(clientes_actual())]);

    case 'registro': {
        if (clientes_actual()) {
            cuenta_responder(['ok' => false, 'error' => 'Ya tenés la sesión abierta.'], 400);
        }
        $r = clientes_registrar($txt('email'), $txt('nombre'), $txt('telefono'), (string)($entra['clave'] ?? ''));
        if (isset($r['error'])) cuenta_responder(['ok' => false, 'error' => $r['error']], 400);

        /* Se entra solo después de registrarse. Pedirle que escriba de nuevo
           lo que acaba de escribir es la forma más rápida de que abandone. */
        clientes_sesion_abrir((int)$r['id']);
        $c = db_fila('SELECT * FROM clientes WHERE id = ?', [(int)$r['id']]);
        cuenta_responder(['ok' => true, 'cliente' => cuenta_publico($c)]);
    }

    case 'ingreso': {
        $r = clientes_ingresar($txt('email'), (string)($entra['clave'] ?? ''));
        if (isset($r['error'])) cuenta_responder(['ok' => false, 'error' => $r['error']], 401);
        clientes_sesion_abrir((int)$r['cliente']['id']);
        cuenta_responder(['ok' => true, 'cliente' => cuenta_publico($r['cliente'])]);
    }

    case 'salir':
        clientes_sesion_cerrar();
        cuenta_responder(['ok' => true, 'cliente' => null]);

    case 'salir-de-todo': {
        $c = clientes_actual();
        if (!$c) cuenta_responder(['ok' => false, 'error' => 'No hay sesión.'], 401);
        clientes_sesion_cerrar_todo((int)$c['id']);
        cuenta_responder(['ok' => true, 'cliente' => null]);
    }

    case 'perfil': {
        $c = clientes_actual();
        if (!$c) cuenta_responder(['ok' => false, 'error' => 'Iniciá sesión para cambiar tus datos.'], 401);
        $r = clientes_guardar_perfil((int)$c['id'], $txt('nombre'), $txt('telefono'));
        if (isset($r['error'])) cuenta_responder(['ok' => false, 'error' => $r['error']], 400);
        $c = db_fila('SELECT * FROM clientes WHERE id = ?', [(int)$c['id']]);
        cuenta_responder(['ok' => true, 'cliente' => cuenta_publico($c)]);
    }

    case 'clave': {
        $c = clientes_actual();
        if (!$c) cuenta_responder(['ok' => false, 'error' => 'Iniciá sesión para cambiar tu contraseña.'], 401);
        $r = clientes_cambiar_clave((int)$c['id'],
                                    (string)($entra['actual'] ?? ''),
                                    (string)($entra['nueva'] ?? ''));
        if (isset($r['error'])) cuenta_responder(['ok' => false, 'error' => $r['error']], 400);

        /* clientes_cambiar_clave() cierra TODAS las sesiones, incluida esta.
           Se abre una nueva enseguida, así que quien cambió la contraseña no
           se ve pateado afuera de su propia pantalla. */
        clientes_sesion_abrir((int)$c['id']);
        cuenta_responder(['ok' => true]);
    }

    /* Los pedidos de quien está conectado, para "mis pedidos". */
    case 'pedidos': {
        $c = clientes_actual();
        if (!$c) cuenta_responder(['ok' => false, 'error' => 'No hay sesión.'], 401);

        /* Se buscan por id Y por correo. El por qué: los pedidos que hizo
           antes de tener cuenta quedaron sin dueño, pero llevan su correo.
           Sin esto, se registra y ve "no tenés pedidos" el mismo día que
           compró, que es exactamente cuando más ganas tiene de mirar. */
        $filas = db_filas(
            'SELECT numero, total, estado, creado, resumen
               FROM pedidos
              WHERE cliente_id = ? OR (cliente_id IS NULL AND email = ?)
              ORDER BY creado DESC
              LIMIT 50',
            [(int)$c['id'], (string)$c['email']]);

        cuenta_responder(['ok' => true, 'pedidos' => $filas]);
    }
}

cuenta_responder(['ok' => false, 'error' => 'No entendí qué querés hacer.'], 400);
