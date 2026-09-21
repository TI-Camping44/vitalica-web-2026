<?php
/* ============================================================================
   VITALICA — api/acceso.php  ·  ENTRADA AL ÁREA INTERNA
   ----------------------------------------------------------------------------
   Una sola puerta. Se entra acá y desde el menú se va al panel de pedidos o a
   la configuración del sitio.

   Antes había dos accesos separados con dos claves distintas, y la del panel
   de configuración era de mentira (se verificaba en el navegador). Ver la
   explicación en sesion.php.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/sesion.php';

if (isset($_GET['salir'])) {
    sesion_salir();
    header('Location: acceso.php');
    exit;
}

$error = '';
$volver = preg_replace('/[^a-zA-Z0-9._-]/', '', (string)($_GET['volver'] ?? ''));

if (isset($_POST['clave'])) {
    $error = sesion_login((string)($_POST['usuario'] ?? ''), (string)$_POST['clave']);
    if ($error === '') {
        // Si venía de una página puntual, lo devolvemos ahí.
        $destinos = ['panel.php' => 'panel.php', 'admin.php' => '../admin.php',
                     'equipo.php' => 'equipo.php', 'blog.php' => 'blog.php',
                     'esquema.php' => 'esquema.php'];
        $ir = $destinos[$volver] ?? 'acceso.php';
        // Si no es administrador, no lo mandamos a una página que va a rechazarlo.
        // Pedidos y noticias los puede usar cualquier usuario del área interna:
        // marketing carga sus notas sin depender de que le den permisos de admin.
        $libres = ['panel.php', 'blog.php'];
        if (!sesion_es_admin() && !in_array($ir, $libres, true)) $ir = 'acceso.php';
        header('Location: ' . $ir);
        exit;
    }
}

$dentro = sesion_activa();
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= $dentro ? 'Área interna' : 'Ingresar' ?> · Vitalica</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --naranja:#EF7D2A; --naranja-txt:#A85410; --naranja-suave:#FDEEE1;
    --navy:#0B55A3; --navy-suave:#E7F0FA;
    --tinta:#16191D; --suave:#5B6270; --tenue:#8A919E;
    --linea:#E4E7EC; --fondo:#F7F8FA; --blanco:#fff;
    --rojo:#A3342F; --rojo-bg:#FBE7E5;
    --sombra:0 1px 2px rgba(16,25,45,.04), 0 8px 28px -12px rgba(16,25,45,.16);
  }
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;background:var(--fondo);color:var(--tinta);
       font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.55;
       display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  a{text-decoration:none;color:inherit}

  .caja{width:100%;max-width:620px}
  .marca{font-weight:800;letter-spacing:2px;font-size:20px;text-align:center;display:block;margin-bottom:6px}
  .marca span{color:var(--naranja)}
  .sub{text-align:center;color:var(--tenue);font-size:12.5px;letter-spacing:.1em;
       text-transform:uppercase;margin-bottom:28px}

  .tarjeta{background:var(--blanco);border:1px solid var(--linea);border-radius:14px;
           padding:32px;box-shadow:var(--sombra)}
  .tarjeta h1{font-size:19px;margin:0 0 4px}
  .tarjeta p.intro{color:var(--suave);font-size:14px;margin:0 0 22px}

  input[type=text],input[type=password]{width:100%;padding:12px 14px;border:1px solid var(--linea);
                       border-radius:9px;font:inherit;margin-bottom:12px}
  input[type=text]:focus,input[type=password]:focus{outline:2px solid var(--navy);outline-offset:-1px;border-color:transparent}

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;
       padding:12px 16px;border-radius:9px;border:1px solid var(--naranja);background:var(--naranja);
       color:#16191D;font:inherit;font-weight:700;cursor:pointer}
  .btn:hover{background:#e0701f;border-color:#e0701f}

  .error{background:var(--rojo-bg);color:var(--rojo);padding:11px 14px;border-radius:9px;
         margin-bottom:16px;font-size:13.5px}

  /* ---- Menú ---- */
  .opciones{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:520px){ .opciones{grid-template-columns:1fr} }
  .opcion{display:block;background:var(--blanco);border:1px solid var(--linea);border-radius:14px;
          padding:26px 24px;box-shadow:var(--sombra);transition:.15s}
  .opcion:hover{border-color:var(--naranja);transform:translateY(-2px)}
  .opcion__ico{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px}
  .opcion--pedidos .opcion__ico{background:var(--naranja-suave);color:var(--naranja-txt)}
  .opcion--config .opcion__ico{background:var(--navy-suave);color:var(--navy)}
  .opcion--noticias .opcion__ico{background:#E6F1EA;color:#2C6B49}
  .opcion--equipo .opcion__ico{background:#EDEEF1;color:var(--suave)}
  .opcion h2{font-size:16.5px;margin:0 0 5px}
  .opcion p{margin:0;color:var(--suave);font-size:13.5px;line-height:1.5}

  .pie{text-align:center;margin-top:22px;font-size:13px;color:var(--tenue)}
  .pie a{color:var(--suave);font-weight:600}
  .pie a:hover{color:var(--tinta)}
</style>
</head>
<body>

<div class="caja">
  <span class="marca">VITA<span>LICA</span></span>
  <p class="sub">Área interna</p>

<?php if (!$dentro): ?>

  <div class="tarjeta">
    <h1>Ingresar</h1>
    <p class="intro">Acceso para el equipo de Vitalica.</p>
    <?php if ($error): ?><div class="error"><?= e($error) ?></div><?php endif; ?>
    <form method="post">
      <input type="text" name="usuario" placeholder="Usuario" autofocus required
             autocomplete="username" autocapitalize="none" spellcheck="false">
      <input type="password" name="clave" placeholder="Contraseña" required
             autocomplete="current-password">
      <button class="btn" type="submit">Entrar</button>
    </form>
  </div>

<?php else: ?>

  <div class="opciones">

    <a class="opcion opcion--pedidos" href="panel.php">
      <span class="opcion__ico">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </span>
      <h2>Pedidos</h2>
      <p>Ver y procesar los pedidos que entran por la web. Estados, responsables y contacto con el cliente.</p>
    </a>

    <a class="opcion opcion--noticias" href="blog.php">
      <span class="opcion__ico">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/>
          <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
        </svg>
      </span>
      <h2>Noticias</h2>
      <p>Escribir y publicar notas del blog. Texto, fotos, enlaces y citas, sin pedirle nada a nadie.</p>
    </a>

    <a class="opcion opcion--config" href="../admin.php">
      <span class="opcion__ico">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
        </svg>
      </span>
      <h2>Configuración</h2>
      <p>Editar textos, logos, hero, etiquetas y promociones, envíos y tiendas. Sin tocar código.</p>
    </a>

    <?php if (sesion_es_admin()): ?>
    <a class="opcion opcion--equipo" href="equipo.php">
      <span class="opcion__ico">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </span>
      <h2>Equipo</h2>
      <p>Crear usuarios, cambiar contraseñas y definir qué puede ver cada uno.</p>
    </a>
    <?php endif; ?>

  </div>

  <p class="pie">
    <?php $q = sesion_usuario(); ?>
    <span style="display:block;margin-bottom:8px">Hola, <strong><?= e($q['nombre']) ?></strong></span>
    <a href="../index.html" target="_blank" rel="noopener">Ver el sitio ↗</a>
    &nbsp;·&nbsp;
    <a href="?salir=1">Cerrar sesión</a>
  </p>

<?php endif; ?>
</div>

</body>
</html>
