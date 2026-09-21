<?php
/* ============================================================================
   VITALICA — api/equipo.php  ·  USUARIOS DEL ÁREA INTERNA
   ----------------------------------------------------------------------------
   Alta, edición y baja de las personas que pueden entrar.
   Solo para administradores.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/usuarios.php';
sesion_exigir_admin();

$cfg = sesion_config();
usuarios_sembrar($cfg);

$yo = sesion_usuario();
$aviso = '';
$error = '';

/* ---------------------------------------------------------------------------
   Acciones
   --------------------------------------------------------------------------- */
$accion = (string)($_POST['accion'] ?? '');

if ($accion === 'guardar') {
    $editando = (string)($_POST['editando'] ?? '');
    $error = usuarios_grabar(
        $cfg,
        (string)($_POST['usuario'] ?? ''),
        (string)($_POST['nombre'] ?? ''),
        (string)($_POST['rol'] ?? 'pedidos'),
        (string)($_POST['clave'] ?? ''),
        !empty($_POST['activo']),
        $editando !== '' ? $editando : null
    );
    if ($error === '') {
        $aviso = $editando !== '' ? 'Usuario actualizado.' : 'Usuario creado.';
    }
}

if ($accion === 'borrar') {
    $k = (string)($_POST['clave_id'] ?? '');
    if ($k === usuarios_normalizar($yo['usuario'])) {
        $error = 'No podés borrar tu propio usuario mientras estás usándolo.';
    } else {
        $error = usuarios_borrar($cfg, $k);
        if ($error === '') $aviso = 'Usuario eliminado.';
    }
}

$usuarios = usuarios_leer($cfg);
uasort($usuarios, fn($a, $b) => strcmp($a['usuario'] ?? '', $b['usuario'] ?? ''));

// ¿Estamos editando a alguien?
$edit = null;
if (isset($_GET['editar']) && isset($usuarios[(string)$_GET['editar']])) {
    $edit = $usuarios[(string)$_GET['editar']];
    $edit['clave_id'] = (string)$_GET['editar'];
}

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function cuando(?string $iso): string {
    if (!$iso) return 'nunca';
    $t = strtotime($iso); if (!$t) return '—';
    $d = time() - $t;
    if ($d < 3600) return 'hace ' . max(1, (int)($d/60)) . ' min';
    if ($d < 86400) return 'hace ' . (int)($d/3600) . ' h';
    return date('d/m/Y', $t);
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Equipo · Vitalica</title>
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
    --rojo:#A3342F; --rojo-bg:#FBE7E5;
    --sombra:0 1px 2px rgba(16,25,45,.04), 0 4px 16px -8px rgba(16,25,45,.12);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--fondo);color:var(--tinta);
       font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14.5px;line-height:1.55;
       -webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  button,input,select{font:inherit}

  .top{background:var(--blanco);border-bottom:1px solid var(--linea);padding:0 20px;
       position:sticky;top:0;z-index:10}
  .top__in{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:14px;height:60px;flex-wrap:wrap}
  .marca{font-weight:800;letter-spacing:1.5px;font-size:15px}
  .marca span{color:var(--naranja)}
  .top__sep{flex:1}
  .quien{color:var(--tenue);font-size:13px}

  .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;
       border:1px solid var(--linea);background:var(--blanco);color:var(--tinta);
       font-weight:600;font-size:13.5px;cursor:pointer;transition:.15s}
  .btn:hover{border-color:var(--tenue)}
  .btn--p{background:var(--naranja);border-color:var(--naranja);color:#16191D}
  .btn--p:hover{background:#e0701f;border-color:#e0701f}
  .btn--sm{padding:6px 11px;font-size:12.5px}
  .btn--peligro{color:var(--rojo);border-color:#F0C9C6}
  .btn--peligro:hover{background:var(--rojo-bg);border-color:var(--rojo)}

  .wrap{max-width:960px;margin:0 auto;padding:24px 20px 60px}
  h1{font-size:20px;margin:0 0 4px}
  .intro{color:var(--suave);margin:0 0 22px;max-width:62ch}

  .aviso{padding:11px 16px;border-radius:8px;margin-bottom:16px;font-weight:600}
  .aviso--ok{background:var(--verde-bg);color:var(--verde)}
  .aviso--mal{background:var(--rojo-bg);color:var(--rojo)}

  .grid{display:grid;grid-template-columns:1.25fr .95fr;gap:20px;align-items:start}
  @media(max-width:860px){ .grid{grid-template-columns:1fr} }

  .tarjeta{background:var(--blanco);border:1px solid var(--linea);border-radius:10px;
           box-shadow:var(--sombra);overflow:hidden}
  .tarjeta__t{padding:14px 18px;border-bottom:1px solid var(--linea);font-weight:700;font-size:14px}

  .fila{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--linea)}
  .fila:last-child{border-bottom:0}
  .av{width:36px;height:36px;border-radius:50%;background:var(--navy-suave);color:var(--navy);
      display:grid;place-items:center;font-weight:700;font-size:13px;flex-shrink:0}
  .fila__mid{flex:1;min-width:0}
  .fila__n{font-weight:600;display:block}
  .fila__u{color:var(--tenue);font-size:12.5px}
  .rol{padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:700;white-space:nowrap}
  .rol--admin{background:var(--naranja-suave);color:var(--naranja-txt)}
  .rol--pedidos{background:var(--navy-suave);color:var(--navy)}
  .inactivo{background:var(--rojo-bg);color:var(--rojo)}
  .fila--off .fila__n{text-decoration:line-through;color:var(--tenue)}

  .form{padding:18px}
  .campo{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
  .campo label{font-size:11.5px;font-weight:700;color:var(--tenue);text-transform:uppercase;letter-spacing:.05em}
  .campo input,.campo select{padding:9px 12px;border:1px solid var(--linea);border-radius:8px;background:var(--blanco)}
  .campo input:focus,.campo select:focus{outline:2px solid var(--navy);outline-offset:-1px;border-color:transparent}
  .pista{font-size:12px;color:var(--tenue);margin-top:2px}
  .check{display:flex;align-items:center;gap:9px;margin-bottom:16px;font-size:13.5px}

  .nota{margin-top:20px;padding:14px 16px;background:var(--naranja-suave);
        border-radius:8px;font-size:13px;line-height:1.6;color:var(--tinta)}
</style>
</head>
<body>

<div class="top"><div class="top__in">
  <span class="marca">VITA<span>LICA</span></span>
  <span class="quien">Equipo</span>
  <span class="top__sep"></span>
  <span class="quien"><?= h($yo['nombre']) ?></span>
  <a class="btn btn--sm" href="acceso.php">← Menú</a>
  <a class="btn btn--sm" href="panel.php">Pedidos</a>
  <a class="btn btn--sm" href="blog.php">Noticias</a>
  <a class="btn btn--sm" href="../admin.php">Configuración</a>
  <a class="btn btn--sm" href="acceso.php?salir=1">Salir</a>
</div></div>

<div class="wrap">

  <h1>Equipo</h1>
  <p class="intro">
    Quiénes pueden entrar al área interna y qué puede ver cada uno.
    Cada persona con su propio usuario: así se sabe quién hizo qué, y dar de baja
    a alguien no obliga a cambiarle la contraseña al resto.
  </p>

  <?php if ($aviso): ?><div class="aviso aviso--ok">✓ <?= h($aviso) ?></div><?php endif; ?>
  <?php if ($error): ?><div class="aviso aviso--mal"><?= h($error) ?></div><?php endif; ?>

  <div class="grid">

    <!-- Lista -->
    <div class="tarjeta">
      <div class="tarjeta__t"><?= count($usuarios) ?> usuario<?= count($usuarios) === 1 ? '' : 's' ?></div>
      <?php foreach ($usuarios as $k => $u):
        $ini = mb_strtoupper(mb_substr($u['nombre'] ?: $u['usuario'], 0, 2)); ?>
        <div class="fila <?= empty($u['activo']) ? 'fila--off' : '' ?>">
          <span class="av"><?= h($ini) ?></span>
          <span class="fila__mid">
            <span class="fila__n"><?= h($u['nombre']) ?></span>
            <span class="fila__u">
              <?= h($u['usuario']) ?> · último ingreso <?= h(cuando($u['ultimo'] ?? null)) ?>
            </span>
          </span>
          <?php if (empty($u['activo'])): ?>
            <span class="rol inactivo">Inactivo</span>
          <?php endif; ?>
          <span class="rol rol--<?= h($u['rol']) ?>"><?= h(VIT_ROLES[$u['rol']] ?? $u['rol']) ?></span>
          <a class="btn btn--sm" href="?editar=<?= urlencode($k) ?>">Editar</a>
          <?php if ($k !== usuarios_normalizar($yo['usuario'])): ?>
            <form method="post" onsubmit="return confirm('¿Borrar a <?= h($u['nombre']) ?>? No se puede deshacer.')">
              <input type="hidden" name="accion" value="borrar">
              <input type="hidden" name="clave_id" value="<?= h($k) ?>">
              <button class="btn btn--sm btn--peligro" type="submit">Borrar</button>
            </form>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>

    <!-- Alta / edición -->
    <div class="tarjeta">
      <div class="tarjeta__t"><?= $edit ? 'Editar usuario' : 'Nuevo usuario' ?></div>
      <form class="form" method="post">
        <input type="hidden" name="accion" value="guardar">
        <?php if ($edit): ?>
          <input type="hidden" name="editando" value="<?= h($edit['clave_id']) ?>">
        <?php endif; ?>

        <div class="campo">
          <label>Nombre</label>
          <input type="text" name="nombre" value="<?= h($edit['nombre'] ?? '') ?>"
                 placeholder="Ej: María Benítez">
          <span class="pista">Es el que aparece en los pedidos como responsable.</span>
        </div>

        <div class="campo">
          <label>Usuario</label>
          <input type="text" name="usuario" value="<?= h($edit['usuario'] ?? '') ?>"
                 placeholder="mbenitez" required>
          <span class="pista">Con el que inicia sesión. Letras, números, punto, guion.</span>
        </div>

        <div class="campo">
          <label>Contraseña<?= $edit ? ' nueva' : '' ?></label>
          <input type="password" name="clave" autocomplete="new-password"
                 placeholder="<?= $edit ? 'Dejar vacío para no cambiarla' : 'Mínimo 8 caracteres' ?>"
                 <?= $edit ? '' : 'required' ?>>
          <span class="pista">
            <?= $edit
                ? 'Solo completá si querés cambiarla. No se puede ver la actual: se guarda cifrada.'
                : 'No se guarda tal cual: se guarda cifrada y no se puede recuperar.' ?>
          </span>
        </div>

        <div class="campo">
          <label>Permisos</label>
          <select name="rol">
            <?php foreach (VIT_ROLES as $k => $n): ?>
              <option value="<?= $k ?>" <?= ($edit['rol'] ?? 'pedidos') === $k ? 'selected' : '' ?>>
                <?= h($n) ?>
              </option>
            <?php endforeach; ?>
          </select>
          <span class="pista">
            <strong>Pedidos:</strong> solo el panel de pedidos.<br>
            <strong>Administrador:</strong> además configura el sitio y gestiona el equipo.
          </span>
        </div>

        <label class="check">
          <input type="checkbox" name="activo" <?= ($edit === null || !empty($edit['activo'])) ? 'checked' : '' ?>>
          Puede entrar
        </label>
        <p class="pista" style="margin:-10px 0 16px">
          Destildalo para bloquear el acceso sin borrar el usuario. Conviene sobre
          borrar: se conserva el historial de qué pedidos atendió.
        </p>

        <button class="btn btn--p" type="submit" style="width:100%;justify-content:center">
          <?= $edit ? 'Guardar cambios' : 'Crear usuario' ?>
        </button>
        <?php if ($edit): ?>
          <p style="text-align:center;margin:12px 0 0"><a href="equipo.php" style="color:var(--suave);font-size:13px">Cancelar</a></p>
        <?php endif; ?>
      </form>
    </div>

  </div>

  <div class="nota">
    <strong>Las contraseñas no se pueden ver, ni siquiera desde acá.</strong>
    Se guardan cifradas en un solo sentido: sirven para verificar si la que
    escribieron coincide, pero no se puede volver atrás para leerlas. Si
    alguien olvida la suya, entrás a su usuario y le ponés una nueva.
  </div>

</div>

</body>
</html>
