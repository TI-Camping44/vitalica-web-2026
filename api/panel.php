<?php
/* ============================================================================
   VITALICA — api/panel.php  ·  PANEL DE PEDIDOS
   ----------------------------------------------------------------------------
   Para que logística y ventas trabajen los pedidos que entran por la web.

   CÓMO GUARDA LOS ESTADOS
   Los pedidos se escriben en pedidos-AAAA-MM.jsonl y ese archivo NO se toca
   nunca más: es el registro de lo que pidió el cliente y tiene que quedar tal
   cual entró. Los cambios (estado, responsable, notas) van a estados.json,
   indexado por número de pedido. Si algo se rompe editando estados, el pedido
   original sigue intacto.

   SEGURIDAD
   Muestra nombre, teléfono y dirección de clientes reales. Está detrás de una
   contraseña, pero la protección fuerte se agrega en cPanel con "Privacidad de
   directorios" sobre panel.php. Ver INSTALAR-BACKEND.md.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/sesion.php';   // login único del área interna

$rutaConfig = __DIR__ . '/config.php';
if (!file_exists($rutaConfig)) { exit('Falta config.php. Ver INSTALAR-BACKEND.md.'); }
$cfg = require $rutaConfig;

$clave        = $cfg['panel']['clave'] ?? '';
$minutos      = (int)($cfg['panel']['minutos_sesion'] ?? 120);
$responsables = $cfg['panel']['responsables'] ?? ['Sin asignar'];
$carpeta      = ($cfg['carpeta_pedidos'] ?? '') ?: (__DIR__ . '/almacen');

/* El orden del flujo importa: define el botón "siguiente paso" y la barra de
   progreso del detalle. 'cancelado' queda fuera del flujo a propósito. */
$FLUJO = ['nuevo', 'contactado', 'confirmado', 'preparando', 'enviado', 'entregado'];
$ESTADOS = [
    'nuevo'      => ['Nuevo',      'Entró y nadie lo tocó todavía'],
    'contactado' => ['Contactado', 'Ya le escribimos, esperamos respuesta'],
    'confirmado' => ['Confirmado', 'El cliente confirmó y va a pagar'],
    'preparando' => ['Preparando', 'Armando el pedido'],
    'enviado'    => ['Enviado',    'En camino o listo para retirar'],
    'entregado'  => ['Entregado',  'Cerrado'],
    'cancelado'  => ['Cancelado',  'No se concretó'],
];

/* ---------------------------------------------------------------------------
   Acceso
   ---------------------------------------------------------------------------
   El login vive en api/acceso.php y es el mismo para el panel de pedidos y
   para la configuración del sitio. Acá solo se exige la sesión: si no hay,
   sesion_exigir() redirige y este archivo no llega a mandar nada.
   --------------------------------------------------------------------------- */
if (isset($_GET['salir'])) { sesion_salir(); header('Location: acceso.php'); exit; }
sesion_exigir();
$dentro = true;

/* ---------------------------------------------------------------------------
   Datos
   --------------------------------------------------------------------------- */
function leerEstados(string $c): array {
    $f = $c . '/estados.json';
    if (!file_exists($f)) return [];
    $d = json_decode((string)@file_get_contents($f), true);
    return is_array($d) ? $d : [];
}
function guardarEstados(string $c, array $e): bool {
    return @file_put_contents($c . '/estados.json',
        json_encode($e, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}
function leerPedidos(string $c): array {
    $p = [];
    foreach (glob($c . '/pedidos-*.jsonl') ?: [] as $a) {
        foreach (file($a, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $l) {
            $x = json_decode($l, true);
            if (is_array($x) && !empty($x['numero'])) $p[$x['numero']] = $x;
        }
    }
    uasort($p, fn($a, $b) => strcmp($b['fecha'] ?? '', $a['fecha'] ?? ''));
    return $p;
}

/* ---------------------------------------------------------------------------
   Guardar cambios
   --------------------------------------------------------------------------- */
$aviso = '';
if ($dentro && ($_POST['accion'] ?? '') === 'actualizar') {
    $num = preg_replace('/[^A-Z0-9\-]/', '', strtoupper((string)($_POST['numero'] ?? '')));
    if ($num !== '') {
        $es = leerEstados($carpeta);
        $previo = $es[$num] ?? [];
        $nuevo  = (string)($_POST['estado'] ?? 'nuevo');
        $es[$num] = [
            'estado'      => isset($ESTADOS[$nuevo]) ? $nuevo : 'nuevo',
            'responsable' => mb_substr(trim((string)($_POST['responsable'] ?? ($previo['responsable'] ?? ''))), 0, 60),
            'nota'        => mb_substr(trim((string)($_POST['nota'] ?? ($previo['nota'] ?? ''))), 0, 1000),
            'actualizado' => date('c'),
        ];
        $aviso = guardarEstados($carpeta, $es)
            ? 'Pedido ' . $num . ' → ' . $ESTADOS[$es[$num]['estado']][0]
            : 'No se pudo guardar. Revisá los permisos de la carpeta de pedidos.';
    }
}

$pedidos = $dentro ? leerPedidos($carpeta) : [];
$estados = $dentro ? leerEstados($carpeta) : [];

$filtro = (string)($_GET['estado'] ?? '');
$busca  = trim((string)($_GET['q'] ?? ''));

$estadoDe = fn($n) => $estados[$n]['estado'] ?? 'nuevo';

$visibles = array_filter($pedidos, function ($p) use ($estadoDe, $filtro, $busca) {
    if ($filtro === 'pendientes') {
        if (in_array($estadoDe($p['numero']), ['entregado', 'cancelado'], true)) return false;
    } elseif ($filtro !== '' && $estadoDe($p['numero']) !== $filtro) return false;
    if ($busca !== '') {
        $h = $p['numero'] . ' ' . ($p['cliente']['nombre'] ?? '') . ' ' .
             ($p['cliente']['apellido'] ?? '') . ' ' . ($p['cliente']['telefono'] ?? '');
        if (mb_stripos($h, $busca) === false) return false;
    }
    return true;
});

/* --- Números del resumen ------------------------------------------------- */
$conteo = array_fill_keys(array_keys($ESTADOS), 0);
$hoy = date('Y-m-d');
$nuevosHoy = 0; $pendientes = 0; $montoPendiente = 0; $montoMes = 0;
$mes = date('Y-m');
foreach ($pedidos as $p) {
    $e = $estadoDe($p['numero']);
    if (isset($conteo[$e])) $conteo[$e]++;
    $f = substr((string)($p['fecha'] ?? ''), 0, 10);
    if ($f === $hoy) $nuevosHoy++;
    if (!in_array($e, ['entregado', 'cancelado'], true)) {
        $pendientes++;
        $montoPendiente += (float)($p['total'] ?? 0);
    }
    if (substr((string)($p['fecha'] ?? ''), 0, 7) === $mes && $e !== 'cancelado') {
        $montoMes += (float)($p['total'] ?? 0);
    }
}

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function gs($v): string { return $v === null ? '—' : 'Gs. ' . number_format((float)$v, 0, ',', '.'); }
function iniciales(string $n, string $a): string {
    return mb_strtoupper(mb_substr($n, 0, 1) . mb_substr($a, 0, 1));
}
function haceCuanto(string $iso): string {
    $t = strtotime($iso); if (!$t) return '';
    $d = time() - $t;
    if ($d < 3600)  return 'hace ' . max(1, (int)($d / 60)) . ' min';
    if ($d < 86400) return 'hace ' . (int)($d / 3600) . ' h';
    if ($d < 172800) return 'ayer';
    if ($d < 604800) return 'hace ' . (int)($d / 86400) . ' días';
    return date('d/m/Y', $t);
}
function telWa(string $t): string {
    $d = preg_replace('/\D/', '', $t) ?: '';
    return (strlen($d) && $d[0] === '0') ? '595' . substr($d, 1) : $d;
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Pedidos · Vitalica</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --naranja:#EF7D2A; --naranja-txt:#A85410; --naranja-suave:#FDEEE1;
    --navy:#0B55A3; --navy-suave:#E7F0FA;
    --tinta:#16191D; --suave:#5B6270; --tenue:#8A919E;
    --linea:#E4E7EC; --fondo:#F7F8FA; --blanco:#fff;
    --verde:#1F7A4C; --verde-bg:#E3F3EA;
    --ambar:#9A6206; --ambar-bg:#FBF0D9;
    --rojo:#A3342F;  --rojo-bg:#FBE7E5;
    --sombra:0 1px 2px rgba(16,25,45,.04), 0 4px 16px -8px rgba(16,25,45,.12);
    --radio:10px;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--fondo);color:var(--tinta);
       font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
       font-size:14.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  button,input,select,textarea{font:inherit}

  /* ---------- Barra superior ---------- */
  .top{position:sticky;top:0;z-index:20;background:var(--blanco);
       border-bottom:1px solid var(--linea);padding:0 20px}
  .top__in{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:16px;
           height:60px;flex-wrap:wrap}
  .marca{font-weight:800;letter-spacing:1.5px;font-size:15px}
  .marca span{color:var(--naranja)}
  .top__sep{flex:1}
  .top__meta{color:var(--tenue);font-size:13px}

  .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;
       border:1px solid var(--linea);background:var(--blanco);color:var(--tinta);
       font-weight:600;font-size:13.5px;cursor:pointer;transition:.15s}
  .btn:hover{border-color:var(--tenue)}
  .btn--p{background:var(--naranja);border-color:var(--naranja);color:#16191D}
  .btn--p:hover{background:#e0701f;border-color:#e0701f}
  .btn--wa{background:#25D366;border-color:#25D366;color:#fff}
  .btn--wa:hover{background:#1fb857;border-color:#1fb857}
  .btn--sm{padding:6px 11px;font-size:12.5px}

  .wrap{max-width:1200px;margin:0 auto;padding:22px 20px 60px}

  /* ---------- Tarjetas de resumen ---------- */
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:22px}
  .stat{background:var(--blanco);border:1px solid var(--linea);border-radius:var(--radio);
        padding:16px 18px;box-shadow:var(--sombra)}
  .stat__lbl{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
             color:var(--tenue);margin-bottom:6px}
  .stat__val{font-size:26px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
  .stat__sub{font-size:12.5px;color:var(--suave);margin-top:2px}
  .stat--alerta{border-color:var(--naranja);background:var(--naranja-suave)}
  .stat--alerta .stat__lbl{color:var(--naranja-txt)}

  /* ---------- Filtros ---------- */
  .barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
  .tabs{display:flex;gap:6px;flex-wrap:wrap;flex:1}
  .tab{padding:7px 13px;border-radius:20px;background:var(--blanco);border:1px solid var(--linea);
       color:var(--suave);font-size:13px;font-weight:600;transition:.15s;white-space:nowrap}
  .tab:hover{border-color:var(--tenue)}
  .tab.on{background:var(--tinta);border-color:var(--tinta);color:#fff}
  .tab b{margin-left:5px;opacity:.65;font-weight:700}
  .buscar{display:flex;gap:8px}
  .buscar input{padding:8px 12px;border:1px solid var(--linea);border-radius:8px;
                background:var(--blanco);width:230px}
  .buscar input:focus{outline:2px solid var(--navy);outline-offset:-1px;border-color:transparent}

  /* ---------- Lista ---------- */
  .lista{display:flex;flex-direction:column;gap:9px}
  .ped{background:var(--blanco);border:1px solid var(--linea);border-radius:var(--radio);
       box-shadow:var(--sombra);overflow:hidden;transition:.15s}
  .ped:hover{border-color:var(--tenue)}
  .ped.abierto{border-color:var(--navy);box-shadow:0 0 0 3px var(--navy-suave)}

  .ped__head{display:flex;align-items:center;gap:14px;padding:14px 16px;cursor:pointer;
             width:100%;text-align:left;background:none;border:0}
  .av{width:38px;height:38px;border-radius:50%;background:var(--navy-suave);color:var(--navy);
      display:grid;place-items:center;font-weight:700;font-size:13px;flex-shrink:0}
  .ped__mid{flex:1;min-width:0}
  .ped__cli{font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ped__sub{color:var(--tenue);font-size:12.5px;font-variant-numeric:tabular-nums}
  .ped__der{display:flex;align-items:center;gap:14px;flex-shrink:0}
  .ped__tot{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
  .chevron{color:var(--tenue);transition:transform .2s}
  .ped.abierto .chevron{transform:rotate(180deg)}

  .badge{padding:4px 11px;border-radius:20px;font-size:11.5px;font-weight:700;white-space:nowrap;
         letter-spacing:.02em}
  .b-nuevo{background:var(--naranja-suave);color:var(--naranja-txt)}
  .b-contactado,.b-confirmado{background:var(--navy-suave);color:var(--navy)}
  .b-preparando{background:var(--ambar-bg);color:var(--ambar)}
  .b-enviado,.b-entregado{background:var(--verde-bg);color:var(--verde)}
  .b-cancelado{background:var(--rojo-bg);color:var(--rojo)}

  /* ---------- Detalle ---------- */
  .ped__body{display:none;border-top:1px solid var(--linea);background:#FCFCFD}
  .ped.abierto .ped__body{display:block}
  .cuerpo{padding:18px 16px}

  /* Línea de progreso del pedido */
  .flujo{display:flex;align-items:center;gap:0;margin-bottom:22px;overflow-x:auto;padding-bottom:4px}
  .paso{display:flex;align-items:center;gap:0;flex:1;min-width:0}
  .paso__punto{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;
               font-size:11px;font-weight:700;background:var(--linea);color:var(--tenue)}
  .paso.hecho .paso__punto{background:var(--verde);color:#fff}
  .paso.actual .paso__punto{background:var(--naranja);color:#16191D;
                            box-shadow:0 0 0 4px var(--naranja-suave)}
  .paso__lbl{font-size:11px;margin-left:7px;color:var(--tenue);white-space:nowrap}
  .paso.actual .paso__lbl{color:var(--tinta);font-weight:700}
  .paso__linea{height:2px;background:var(--linea);flex:1;margin:0 8px;min-width:12px}
  .paso.hecho .paso__linea{background:var(--verde)}

  .cancelado-aviso{padding:10px 14px;background:var(--rojo-bg);color:var(--rojo);
                   border-radius:8px;font-weight:600;margin-bottom:18px}

  .cols{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:24px}
  @media(max-width:820px){ .cols{grid-template-columns:1fr} }
  .col h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--tenue);
          margin:0 0 9px;font-weight:700}

  .items{width:100%;border-collapse:collapse}
  .items td{padding:8px 0;border-bottom:1px solid var(--linea);vertical-align:top}
  .items tr:last-child td{border-bottom:0}
  .items td:last-child{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .var{color:var(--suave);font-size:12.5px}
  .cod{color:var(--tenue);font-size:11.5px;font-family:ui-monospace,Menlo,monospace}
  .tot-fila td{font-weight:800;font-size:15.5px;border-top:2px solid var(--tinta);border-bottom:0;padding-top:10px}

  .dato{margin-bottom:12px;line-height:1.65}
  .dato strong{display:block}
  .copiar{background:none;border:0;color:var(--navy);cursor:pointer;font-size:12px;
          font-weight:600;padding:0;margin-left:4px}

  .nota-int{background:var(--ambar-bg);border-radius:8px;padding:10px 12px;font-size:13px;
            color:var(--ambar);margin-top:10px}

  /* Acciones */
  .acciones{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:20px;
            padding-top:16px;border-top:1px solid var(--linea)}
  .campo{display:flex;flex-direction:column;gap:5px}
  .campo label{font-size:11.5px;font-weight:700;color:var(--tenue);text-transform:uppercase;letter-spacing:.05em}
  .campo select,.campo input{padding:8px 11px;border:1px solid var(--linea);border-radius:8px;background:var(--blanco)}
  .campo--ancho{flex:1;min-width:190px}
  .acciones__rapidas{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}

  .vacio{background:var(--blanco);border:1px dashed var(--linea);border-radius:var(--radio);
         padding:56px 24px;text-align:center;color:var(--suave)}
  .vacio strong{display:block;color:var(--tinta);font-size:16px;margin-bottom:6px}

  .aviso{background:var(--verde-bg);color:var(--verde);padding:11px 16px;border-radius:8px;
         margin-bottom:16px;font-weight:600;display:flex;align-items:center;gap:8px}

  /* Login */
  .login{max-width:370px;margin:90px auto;background:var(--blanco);padding:34px;
         border-radius:14px;border:1px solid var(--linea);box-shadow:var(--sombra)}
  .login .marca{font-size:18px;margin-bottom:4px;display:block}
  .login p{color:var(--suave);margin:0 0 20px;font-size:13.5px}
  .login input{width:100%;padding:11px 13px;border:1px solid var(--linea);border-radius:8px;margin-bottom:12px}
  .error{background:var(--rojo-bg);color:var(--rojo);padding:10px 13px;border-radius:8px;
         margin-bottom:14px;font-size:13.5px}
</style>
</head>
<body>

<?php if (false): ?>

  <div class="login">
    <span class="marca">VITA<span>LICA</span></span>
    <p>Panel de pedidos · logística y ventas</p>
    <?php if ($errorLogin): ?><div class="error"><?= h($errorLogin) ?></div><?php endif; ?>
    <form method="post">
      <input type="password" name="clave" placeholder="Contraseña" autofocus required>
      <button class="btn btn--p" type="submit" style="width:100%;justify-content:center">Entrar</button>
    </form>
  </div>

<?php else: ?>

  <div class="top"><div class="top__in">
    <span class="marca">VITA<span>LICA</span></span>
    <span class="top__meta">Pedidos</span>
    <span class="top__sep"></span>
    <span class="top__meta"><?= date('d/m/Y H:i') ?></span>
    <a class="btn btn--sm" href="acceso.php">← Menú</a>
    <a class="btn btn--sm" href="blog.php">Noticias</a>
    <a class="btn btn--sm" href="../admin.php">Configuración</a>
    <a class="btn btn--sm" href="equipo.php">Equipo</a>
    <a class="btn btn--sm" href="?salir=1">Salir</a>
  </div></div>

  <div class="wrap">

    <?php if ($aviso): ?><div class="aviso">✓ <?= h($aviso) ?></div><?php endif; ?>

    <!-- Resumen. Responde de un vistazo: ¿qué tengo que atender hoy? -->
    <div class="stats">
      <div class="stat <?= $conteo['nuevo'] > 0 ? 'stat--alerta' : '' ?>">
        <div class="stat__lbl">Sin atender</div>
        <div class="stat__val"><?= $conteo['nuevo'] ?></div>
        <div class="stat__sub"><?= $conteo['nuevo'] === 1 ? 'pedido nuevo' : 'pedidos nuevos' ?></div>
      </div>
      <div class="stat">
        <div class="stat__lbl">En curso</div>
        <div class="stat__val"><?= $pendientes ?></div>
        <div class="stat__sub"><?= gs($montoPendiente) ?> por cobrar</div>
      </div>
      <div class="stat">
        <div class="stat__lbl">Entraron hoy</div>
        <div class="stat__val"><?= $nuevosHoy ?></div>
        <div class="stat__sub"><?= date('d/m/Y') ?></div>
      </div>
      <div class="stat">
        <div class="stat__lbl">Vendido este mes</div>
        <div class="stat__val" style="font-size:20px"><?= gs($montoMes) ?></div>
        <div class="stat__sub"><?= count($pedidos) ?> pedidos en total</div>
      </div>
    </div>

    <div class="barra">
      <div class="tabs">
        <a class="tab <?= $filtro === 'pendientes' ? 'on' : '' ?>" href="?estado=pendientes">Por atender <b><?= $pendientes ?></b></a>
        <a class="tab <?= $filtro === '' ? 'on' : '' ?>" href="?">Todos <b><?= count($pedidos) ?></b></a>
        <?php foreach ($ESTADOS as $k => $d): if ($conteo[$k] === 0 && $filtro !== $k) continue; ?>
          <a class="tab <?= $filtro === $k ? 'on' : '' ?>" href="?estado=<?= $k ?>"><?= h($d[0]) ?> <b><?= $conteo[$k] ?></b></a>
        <?php endforeach; ?>
      </div>
      <form class="buscar" method="get">
        <?php if ($filtro): ?><input type="hidden" name="estado" value="<?= h($filtro) ?>"><?php endif; ?>
        <input type="search" name="q" value="<?= h($busca) ?>" placeholder="Número, nombre o teléfono">
        <button class="btn" type="submit">Buscar</button>
        <?php if ($busca): ?><a class="btn" href="?<?= $filtro ? 'estado=' . h($filtro) : '' ?>">✕</a><?php endif; ?>
      </form>
    </div>

    <?php if (!$visibles): ?>
      <div class="vacio">
        <?php if (!$pedidos): ?>
          <strong>Todavía no entró ningún pedido</strong>
          Cuando alguien complete el checkout en la web, aparece acá automáticamente.
        <?php elseif ($filtro === 'pendientes'): ?>
          <strong>No queda nada por atender</strong>
          Todos los pedidos están entregados o cancelados.
        <?php else: ?>
          <strong>Sin resultados</strong>
          Ningún pedido coincide con ese filtro.
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <div class="lista">
      <?php foreach ($visibles as $p):
        $num = $p['numero'];
        $est = $estados[$num] ?? [];
        $e   = $est['estado'] ?? 'nuevo';
        $cli = $p['cliente'];
        $wa  = telWa($cli['telefono'] ?? '');
        $idx = array_search($e, $FLUJO, true);
        $siguiente = ($idx !== false && $idx < count($FLUJO) - 1) ? $FLUJO[$idx + 1] : null;
      ?>
      <div class="ped" id="p-<?= h($num) ?>">
        <button class="ped__head" type="button" onclick="this.parentNode.classList.toggle('abierto')">
          <span class="av"><?= h(iniciales($cli['nombre'] ?? '', $cli['apellido'] ?? '')) ?></span>
          <span class="ped__mid">
            <span class="ped__cli"><?= h(trim(($cli['nombre'] ?? '') . ' ' . ($cli['apellido'] ?? ''))) ?></span>
            <span class="ped__sub">
              <?= h($num) ?> · <?= h(haceCuanto($p['fecha'] ?? '')) ?>
              <?php if (!empty($est['responsable']) && $est['responsable'] !== 'Sin asignar'): ?>
                · <?= h($est['responsable']) ?>
              <?php endif; ?>
            </span>
          </span>
          <span class="ped__der">
            <span class="badge b-<?= h($e) ?>"><?= h($ESTADOS[$e][0] ?? $e) ?></span>
            <span class="ped__tot"><?= gs($p['total'] ?? null) ?></span>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </button>

        <div class="ped__body"><div class="cuerpo">

          <?php if ($e === 'cancelado'): ?>
            <div class="cancelado-aviso">Este pedido está cancelado.</div>
          <?php else: ?>
            <!-- Dónde está el pedido dentro del circuito -->
            <div class="flujo">
              <?php foreach ($FLUJO as $i => $paso):
                $pos = array_search($e, $FLUJO, true);
                $clase = $i < $pos ? 'hecho' : ($i === $pos ? 'actual' : '');
              ?>
                <div class="paso <?= $clase ?>">
                  <span class="paso__punto"><?= $i < $pos ? '✓' : ($i + 1) ?></span>
                  <span class="paso__lbl"><?= h($ESTADOS[$paso][0]) ?></span>
                  <?php if ($i < count($FLUJO) - 1): ?><span class="paso__linea"></span><?php endif; ?>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <!-- Acciones rápidas: lo que se hace el 90% de las veces -->
          <div class="acciones__rapidas">
            <?php if ($wa): ?>
              <a class="btn btn--wa btn--sm" target="_blank" rel="noopener"
                 href="https://wa.me/<?= h($wa) ?>?text=<?= rawurlencode('Hola ' . ($cli['nombre'] ?? '') . '! Te escribo de Vitalica por tu pedido ' . $num . '.') ?>">
                Escribir al cliente
              </a>
            <?php endif; ?>
            <?php if ($siguiente): ?>
              <form method="post" style="display:inline">
                <input type="hidden" name="accion" value="actualizar">
                <input type="hidden" name="numero" value="<?= h($num) ?>">
                <input type="hidden" name="estado" value="<?= h($siguiente) ?>">
                <button class="btn btn--p btn--sm" type="submit">
                  Marcar como <?= h($ESTADOS[$siguiente][0]) ?> →
                </button>
              </form>
            <?php endif; ?>
          </div>

          <div class="cols">

            <div class="col">
              <h3>Productos</h3>
              <table class="items">
                <?php foreach ($p['items'] as $it): ?>
                  <tr>
                    <td>
                      <strong><?= (int)$it['cantidad'] ?>×</strong> <?= h($it['nombre']) ?>
                      <?php if (!empty($it['varianteTexto'])): ?><div class="var"><?= h($it['varianteTexto']) ?></div><?php endif; ?>
                      <?php if (!empty($it['variante'])): ?><div class="cod"><?= h($it['variante']) ?></div><?php endif; ?>
                    </td>
                    <td><?= gs($it['subtotal'] ?? null) ?></td>
                  </tr>
                <?php endforeach; ?>
                <tr><td style="color:var(--suave)">Envío</td><td style="color:var(--suave)"><?= gs($p['envio'] ?? null) ?></td></tr>
                <tr class="tot-fila"><td>Total</td><td><?= gs($p['total'] ?? null) ?></td></tr>
              </table>
            </div>

            <div class="col">
              <h3>Cliente</h3>
              <div class="dato">
                <strong><?= h(trim(($cli['nombre'] ?? '') . ' ' . ($cli['apellido'] ?? ''))) ?></strong>
                <?= h($cli['telefono'] ?? '') ?>
                <button class="copiar" type="button" data-copiar="<?= h($cli['telefono'] ?? '') ?>">copiar</button>
                <?php if (!empty($cli['email'])): ?><br><?= h($cli['email']) ?><?php endif; ?>
              </div>
              <h3>Forma de pago</h3>
              <div class="dato"><?= h($p['pagoLabel'] ?: 'A coordinar') ?></div>
            </div>

            <div class="col">
              <h3>Entrega</h3>
              <div class="dato">
                <strong><?= h($p['entregaLabel'] ?: $p['entrega']) ?></strong>
                <?php if (($p['entrega'] ?? '') === 'retiro'): ?>
                  <?= h($cli['local'] ?? 'Local no indicado') ?>
                <?php else:
                  $dir = trim(($cli['direccion'] ?? '') . ', ' . ($cli['ciudad'] ?? ''), ', '); ?>
                  <?= h($cli['direccion'] ?? '') ?><br><?= h($cli['ciudad'] ?? '') ?>
                  <button class="copiar" type="button" data-copiar="<?= h($dir) ?>">copiar</button>
                  <?php if (!empty($cli['referencia'])): ?>
                    <div class="var"><?= h($cli['referencia']) ?></div>
                  <?php endif; ?>
                <?php endif; ?>
              </div>
              <?php if (!empty($est['nota'])): ?>
                <div class="nota-int">📌 <?= h($est['nota']) ?></div>
              <?php endif; ?>
            </div>

          </div>

          <form method="post" class="acciones">
            <input type="hidden" name="accion" value="actualizar">
            <input type="hidden" name="numero" value="<?= h($num) ?>">
            <div class="campo">
              <label>Estado</label>
              <select name="estado">
                <?php foreach ($ESTADOS as $k => $d): ?>
                  <option value="<?= $k ?>" <?= $e === $k ? 'selected' : '' ?>><?= h($d[0]) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="campo">
              <label>Responsable</label>
              <select name="responsable">
                <?php foreach ($responsables as $r): ?>
                  <option <?= ($est['responsable'] ?? '') === $r ? 'selected' : '' ?>><?= h($r) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="campo campo--ancho">
              <label>Nota interna</label>
              <input type="text" name="nota" value="<?= h($est['nota'] ?? '') ?>"
                     placeholder="Ej: transferencia recibida, entregar el jueves">
            </div>
            <button class="btn btn--p" type="submit">Guardar</button>
          </form>

          <?php if (!empty($est['actualizado'])): ?>
            <p style="margin:10px 0 0;font-size:12px;color:var(--tenue)">
              Última actualización: <?= h(haceCuanto($est['actualizado'])) ?>
            </p>
          <?php endif; ?>

        </div></div>
      </div>
      <?php endforeach; ?>
    </div>

  </div>

  <script>
    /* Copiar teléfono o dirección: logística los pega en el sistema de envíos
       o en el mapa, y escribirlos a mano es la fuente número uno de entregas
       que llegan a la dirección equivocada. */
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-copiar]');
      if (!b) return;
      ev.stopPropagation();
      navigator.clipboard.writeText(b.dataset.copiar).then(function () {
        var t = b.textContent; b.textContent = '¡copiado!';
        setTimeout(function () { b.textContent = t; }, 1400);
      });
    });
  </script>

<?php endif; ?>

</body>
</html>
