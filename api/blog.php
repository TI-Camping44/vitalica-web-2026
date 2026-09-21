<?php
/* ============================================================================
   VITALICA — api/blog.php  ·  CARGA DE NOTICIAS
   ----------------------------------------------------------------------------
   Alta, edición, borrado y publicación de las notas del blog. Se entra con el
   mismo usuario del área interna.

   DÓNDE QUEDA GUARDADO, Y POR QUÉ EN DOS LADOS
   --------------------------------------------
     api/almacen/blog.json        el original. Es el que se edita.
     assets/js/data-noticias.js   lo que lee el sitio. Se regenera solo.

   El sitio podría leer el JSON con una consulta, pero entonces el blog
   dependería de que haya PHP andando. La propuesta se está revisando en
   GitHub Pages, que sirve archivos y nada más: ahí el blog aparecería vacío.
   Escribiendo también el .js, las notas viajan con el sitio y se ven en
   cualquier lado, igual que los productos (data.js).

   El precio de esto es que hay dos archivos que pueden desincronizarse. Se
   evita escribiendo SIEMPRE los dos en la misma operación, y regenerando el
   .js entero desde el JSON: nunca se lo edita a mano ni por partes.

   SOBRE LAS IMÁGENES
   ------------------
   Subir archivos es la parte peligrosa de cualquier panel: es la vía por la
   que alguien puede dejar un .php disfrazado y después ejecutarlo. Acá:

     · No se confía en el tipo que declara el navegador. Se abre la imagen
       con getimagesize(), que falla si el archivo no es una imagen de verdad.
     · El nombre lo pone el servidor, no el que sube. Nunca se usa el nombre
       original, que puede traer "../" o terminar en .php.
     · La extensión sale del tipo detectado, no de lo que diga el archivo.
     · La carpeta de destino lleva un .htaccess que prohíbe ejecutar nada.

   TOKEN DE FORMULARIO
   -------------------
   Los otros paneles del proyecto no lo tienen. Acá se agrega porque este
   escribe archivos: sin token, alcanza con que alguien con la sesión abierta
   visite una página preparada para que su navegador mande el formulario sin
   que se entere. Conviene sumarlo también en equipo.php y en admin.php.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/sesion.php';
sesion_exigir();

$RAIZ      = dirname(__DIR__);
$ARCHIVO   = __DIR__ . '/almacen/blog.json';
$PUBLICADO = $RAIZ . '/assets/js/data-noticias.js';
$FOTOS     = $RAIZ . '/assets/img/blog';
$MAX_FOTO  = 4 * 1024 * 1024;   // 4 MB

$aviso = '';
$error = '';

/* ---------------------------------------------------------------------------
   Token de formulario
   --------------------------------------------------------------------------- */
if (empty($_SESSION['blog_token'])) {
    $_SESSION['blog_token'] = bin2hex(random_bytes(16));
}
$TOKEN = $_SESSION['blog_token'];

function token_valido(): bool {
    return isset($_POST['token'], $_SESSION['blog_token'])
        && hash_equals($_SESSION['blog_token'], (string)$_POST['token']);
}

require_once __DIR__ . '/blog-datos.php';

/* ---------------------------------------------------------------------------
   Acciones
   --------------------------------------------------------------------------- */
$notas  = notas_leer($ARCHIVO);
$accion = (string)($_POST['accion'] ?? '');
$subida = '';   // ruta de la última imagen subida, para mostrarla y copiarla

if ($accion !== '' && !token_valido()) {
    $error = 'El formulario venció. Volvé a intentarlo.';
    $accion = '';
}

if ($accion === 'subir-imagen') {
    [$ruta, $err] = subir_imagen($_FILES['imagen'] ?? [], $FOTOS, $MAX_FOTO);
    if ($err !== '') { $error = $err; }
    elseif ($ruta !== '') { $subida = $ruta; $aviso = 'Imagen subida. Copiá el renglón de abajo y pegalo en el cuerpo.'; }
}

if ($accion === 'guardar') {
    $editando = (string)($_POST['editando'] ?? '');
    $titulo   = trim((string)($_POST['titulo'] ?? ''));
    $fecha    = trim((string)($_POST['fecha'] ?? ''));

    if ($titulo === '') {
        $error = 'La nota necesita un título.';
    } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        $error = 'La fecha tiene que ser AAAA-MM-DD.';
    } else {
        [$portada, $errFoto] = subir_imagen($_FILES['portada'] ?? [], $FOTOS, $MAX_FOTO);
        if ($errFoto !== '') {
            $error = $errFoto;
        } else {
            if ($portada === '') $portada = trim((string)($_POST['portada_actual'] ?? ''));

            $nota = [
                'id'        => $editando !== '' ? $editando : id_desde($titulo, $notas),
                'titulo'    => $titulo,
                'bajada'    => trim((string)($_POST['bajada'] ?? '')),
                'fecha'     => $fecha,
                'etiqueta'  => trim((string)($_POST['etiqueta'] ?? '')),
                'portada'   => $portada,
                'publicada' => !empty($_POST['publicada']),
                'cuerpo'    => cuerpo_desde_texto((string)($_POST['cuerpo'] ?? '')),
            ];

            $reemplazada = false;
            foreach ($notas as $i => $n) {
                if (($n['id'] ?? '') === $nota['id']) { $notas[$i] = $nota; $reemplazada = true; break; }
            }
            if (!$reemplazada) $notas[] = $nota;

            $error = notas_guardar($notas, $ARCHIVO, $PUBLICADO);
            if ($error === '') {
                $aviso = $editando !== '' ? 'Nota actualizada.' : 'Nota creada.';
                header('Location: blog.php?ok=' . rawurlencode($aviso));
                exit;
            }
        }
    }
}

if ($accion === 'borrar') {
    $id = (string)($_POST['id'] ?? '');
    $notas = array_values(array_filter($notas, fn($n) => ($n['id'] ?? '') !== $id));
    $error = notas_guardar($notas, $ARCHIVO, $PUBLICADO);
    if ($error === '') { header('Location: blog.php?ok=' . rawurlencode('Nota eliminada.')); exit; }
}

if ($accion === 'alternar') {
    $id = (string)($_POST['id'] ?? '');
    foreach ($notas as $i => $n) {
        if (($n['id'] ?? '') === $id) { $notas[$i]['publicada'] = empty($n['publicada']); break; }
    }
    $error = notas_guardar($notas, $ARCHIVO, $PUBLICADO);
    if ($error === '') { header('Location: blog.php?ok=' . rawurlencode('Estado cambiado.')); exit; }
}

if (isset($_GET['ok'])) $aviso = (string)$_GET['ok'];

$notas = notas_ordenar($notas);

/* ¿Estamos editando alguna? */
$edit = null;
if (isset($_GET['editar'])) {
    foreach ($notas as $n) {
        if (($n['id'] ?? '') === (string)$_GET['editar']) { $edit = $n; break; }
    }
}

function h($t): string { return htmlspecialchars((string)$t, ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Noticias · Panel Vitalica</title>
  <style>
    :root { --tinta:#16191d; --suave:#6b7280; --linea:#e5e7eb; --naranja:#ef7d2a; --fondo:#f7f7f8; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--fondo); color:var(--tinta);
           font:15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .barra { background:#0a0a0b; color:#fff; padding:14px 24px; display:flex;
             align-items:center; gap:18px; flex-wrap:wrap; }
    .barra strong { letter-spacing:.06em; }
    .barra a { color:#cbd5e1; text-decoration:none; font-size:14px; }
    .barra a:hover { color:#fff; }
    .envoltorio { max-width:1080px; margin:0 auto; padding:28px 24px 80px; }
    h1 { font-size:24px; margin:0 0 4px; }
    .sub { color:var(--suave); margin:0 0 26px; }
    .aviso, .error { padding:12px 16px; border-radius:10px; margin-bottom:20px; font-size:14px; }
    .aviso { background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; }
    .error { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
    .tarjeta { background:#fff; border:1px solid var(--linea); border-radius:14px;
               padding:22px; margin-bottom:22px; }
    label { display:block; font-weight:600; font-size:13px; margin-bottom:6px; }
    .campo { margin-bottom:16px; }
    input[type=text], input[type=date], textarea, select {
      width:100%; padding:10px 12px; border:1px solid var(--linea);
      border-radius:9px; font:inherit; background:#fff; }
    textarea { min-height:300px; resize:vertical; font-family:ui-monospace, Consolas, monospace; font-size:13.5px; }
    .fila { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .pista { color:var(--suave); font-size:12.5px; margin-top:5px; }
    .btn { display:inline-block; padding:10px 20px; border:0; border-radius:999px;
           background:var(--naranja); color:#0a0a0b; font-weight:700; cursor:pointer; font-size:14px; }
    .btn--fino { background:#fff; border:1px solid var(--linea); color:var(--tinta); font-weight:600; }
    .btn--peligro { background:#fff; border:1px solid #fecaca; color:#991b1b; font-weight:600; }
    table { width:100%; border-collapse:collapse; }
    th, td { text-align:left; padding:12px 8px; border-bottom:1px solid var(--linea); font-size:14px; }
    th { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--suave); }
    .chip { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; }
    .chip--si { background:#ecfdf5; color:#065f46; }
    .chip--no { background:#f3f4f6; color:#6b7280; }
    .acciones { display:flex; gap:8px; flex-wrap:wrap; }
    .ayuda { background:#fffbeb; border:1px solid #fde68a; border-radius:10px;
             padding:14px 16px; font-size:13.5px; margin-bottom:16px; }
    .ayuda code { background:#fff; padding:1px 6px; border-radius:5px; border:1px solid #fde68a; }
    .copiar { width:100%; font-family:ui-monospace, Consolas, monospace; font-size:13px; }
    @media (max-width:700px) { .fila { grid-template-columns:1fr; } }
  </style>
</head>
<body>

<div class="barra">
  <strong>VITALICA</strong>
  <span>Noticias</span>
  <a href="acceso.php">← Menú</a>
  <a href="panel.php">Pedidos</a>
  <a href="../admin.php">Configuración</a>
  <a href="equipo.php">Equipo</a>
  <a href="../noticias.html" target="_blank">Ver el blog ↗</a>
  <a href="acceso.php?salir=1" style="margin-left:auto">Salir</a>
</div>

<div class="envoltorio">

  <h1><?= $edit ? 'Editar nota' : 'Nueva nota' ?></h1>
  <p class="sub">Lo que guardes acá se publica en el sitio al instante.</p>

  <?php if ($aviso): ?><div class="aviso"><?= h($aviso) ?></div><?php endif; ?>
  <?php if ($error): ?><div class="error"><?= h($error) ?></div><?php endif; ?>

  <?php if ($subida !== ''): ?>
    <div class="tarjeta">
      <label>Imagen subida · copiá este renglón y pegalo en el cuerpo</label>
      <input class="copiar" type="text" readonly value="!<?= h($subida) ?> | pie de foto"
             onclick="this.select()">
      <p class="pista">Si no querés pie de foto, borrá todo lo que va después de la barra.</p>
    </div>
  <?php endif; ?>

  <!-- Subir una imagen. Va en su propio formulario porque no tiene que
       arrastrar los datos de la nota que se está escribiendo. -->
  <form class="tarjeta" method="post" enctype="multipart/form-data">
    <input type="hidden" name="token" value="<?= h($TOKEN) ?>">
    <input type="hidden" name="accion" value="subir-imagen">
    <label>Subir una imagen para usar dentro de la nota</label>
    <div class="acciones">
      <input type="file" name="imagen" accept="image/jpeg,image/png,image/webp" required>
      <button class="btn btn--fino" type="submit">Subir</button>
    </div>
    <p class="pista">JPG, PNG o WEBP. Hasta 4 MB.</p>
  </form>

  <form class="tarjeta" method="post" enctype="multipart/form-data">
    <input type="hidden" name="token" value="<?= h($TOKEN) ?>">
    <input type="hidden" name="accion" value="guardar">
    <input type="hidden" name="editando" value="<?= h($edit['id'] ?? '') ?>">
    <input type="hidden" name="portada_actual" value="<?= h($edit['portada'] ?? '') ?>">

    <div class="campo">
      <label for="titulo">Título</label>
      <input id="titulo" type="text" name="titulo" required maxlength="140"
             value="<?= h($edit['titulo'] ?? '') ?>">
      <p class="pista">Es lo que se ve en la tarjeta y arriba de la nota.</p>
    </div>

    <div class="campo">
      <label for="bajada">Bajada</label>
      <input id="bajada" type="text" name="bajada" maxlength="240"
             value="<?= h($edit['bajada'] ?? '') ?>">
      <p class="pista">Dos renglones que resumen. Es lo que decide si alguien entra a leer.</p>
    </div>

    <div class="fila">
      <div class="campo">
        <label for="fecha">Fecha</label>
        <input id="fecha" type="date" name="fecha" required
               value="<?= h($edit['fecha'] ?? date('Y-m-d')) ?>">
      </div>
      <div class="campo">
        <label for="etiqueta">Etiqueta</label>
        <input id="etiqueta" type="text" name="etiqueta" list="etiquetas" maxlength="40"
               value="<?= h($edit['etiqueta'] ?? '') ?>">
        <datalist id="etiquetas">
          <option value="Novedades"><option value="Olimp"><option value="Guías"><option value="Eventos">
        </datalist>
      </div>
    </div>

    <div class="campo">
      <label for="portada">Foto de portada</label>
      <input id="portada" type="file" name="portada" accept="image/jpeg,image/png,image/webp">
      <?php if (!empty($edit['portada'])): ?>
        <p class="pista">Ahora tiene: <code><?= h($edit['portada']) ?></code>. Si no elegís otra, se queda esa.</p>
      <?php else: ?>
        <p class="pista">Sin portada la tarjeta sale sin foto, y se nota.</p>
      <?php endif; ?>
    </div>

    <div class="ayuda">
      <strong>Cómo escribir el cuerpo.</strong> Escribí de corrido; cada renglón en blanco separa.
      <br><code>## Un subtítulo</code> &nbsp;·&nbsp;
      <code>- un punto de lista</code> &nbsp;·&nbsp;
      <code>&gt; una cita | quién la dijo</code>
      <br><code>[el texto del enlace](contacto.html)</code> &nbsp;·&nbsp;
      <code>!assets/img/blog/foto.jpg | pie de foto</code>
      <br>Cualquier otro renglón es un párrafo.
    </div>

    <div class="campo">
      <label for="cuerpo">Cuerpo de la nota</label>
      <textarea id="cuerpo" name="cuerpo"><?= h($edit ? texto_desde_cuerpo($edit['cuerpo'] ?? []) : '') ?></textarea>
    </div>

    <div class="campo">
      <label style="display:flex;align-items:center;gap:9px;font-weight:600">
        <input type="checkbox" name="publicada" value="1"
               <?= (!$edit || !empty($edit['publicada'])) ? 'checked' : '' ?>>
        Publicada (si la destildás queda guardada pero no se ve en el sitio)
      </label>
    </div>

    <div class="acciones">
      <button class="btn" type="submit"><?= $edit ? 'Guardar cambios' : 'Crear nota' ?></button>
      <?php if ($edit): ?><a class="btn btn--fino" href="blog.php">Cancelar</a><?php endif; ?>
    </div>
  </form>


  <div class="tarjeta">
    <h2 style="font-size:17px;margin:0 0 14px">Notas cargadas (<?= count($notas) ?>)</h2>
    <?php if (!$notas): ?>
      <p class="sub" style="margin:0">Todavía no hay ninguna. Creá la primera con el formulario de arriba.</p>
    <?php else: ?>
    <table>
      <tr><th>Título</th><th>Fecha</th><th>Etiqueta</th><th>Estado</th><th></th></tr>
      <?php foreach ($notas as $n): ?>
      <tr>
        <td>
          <strong><?= h($n['titulo'] ?? '') ?></strong><br>
          <span style="color:var(--suave);font-size:12.5px"><?= h($n['id'] ?? '') ?></span>
        </td>
        <td><?= h($n['fecha'] ?? '') ?></td>
        <td><?= h($n['etiqueta'] ?? '—') ?></td>
        <td>
          <span class="chip <?= !empty($n['publicada']) ? 'chip--si' : 'chip--no' ?>">
            <?= !empty($n['publicada']) ? 'Publicada' : 'Borrador' ?>
          </span>
        </td>
        <td>
          <div class="acciones">
            <a class="btn btn--fino" href="blog.php?editar=<?= rawurlencode((string)($n['id'] ?? '')) ?>">Editar</a>
            <form method="post" style="display:inline">
              <input type="hidden" name="token" value="<?= h($TOKEN) ?>">
              <input type="hidden" name="accion" value="alternar">
              <input type="hidden" name="id" value="<?= h($n['id'] ?? '') ?>">
              <button class="btn btn--fino" type="submit"><?= !empty($n['publicada']) ? 'Despublicar' : 'Publicar' ?></button>
            </form>
            <form method="post" style="display:inline"
                  onsubmit="return confirm('¿Borrar esta nota? No se puede deshacer.')">
              <input type="hidden" name="token" value="<?= h($TOKEN) ?>">
              <input type="hidden" name="accion" value="borrar">
              <input type="hidden" name="id" value="<?= h($n['id'] ?? '') ?>">
              <button class="btn btn--peligro" type="submit">Borrar</button>
            </form>
          </div>
        </td>
      </tr>
      <?php endforeach; ?>
    </table>
    <?php endif; ?>
  </div>

</div>
</body>
</html>
