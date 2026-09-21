<?php
/* ============================================================================
   VITALICA — admin.php  ·  CONFIGURACIÓN DEL SITIO
   ----------------------------------------------------------------------------
   Antes era admin.html y pedía la clave desde JavaScript. Eso no protegía
   nada: la clave viajaba dentro del archivo que descarga cualquier visitante,
   y la pantalla se salteaba escribiendo una línea en la consola.

   Ahora la verificación ocurre en el servidor. Sin sesión válida, PHP corta
   acá y ni siquiera manda el HTML de abajo.
   ============================================================================ */
require_once __DIR__ . '/api/sesion.php';
sesion_exigir();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Panel de administrador · Vitalica</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="assets/css/styles.css?v=59">
</head>
<body class="admin-body">

  <!-- =====================================================================
       BARRA DEL AREA INTERNA
       ---------------------------------------------------------------------
       Este era el UNICO panel sin forma de volver al menu: se entraba y se
       quedaba encerrado, con el boton de atras del navegador como unica
       salida. Los otros tres ya la tenian.

       Va escrita en PHP y no la arma admin.js a proposito: si un dia el
       JavaScript falla, la pantalla queda en blanco pero la salida sigue
       estando. Una barra de navegacion que depende de que todo lo demas
       funcione no sirve justamente el dia que hace falta.
       ===================================================================== -->
  <nav class="barra-interna">
    <strong>VITALICA</strong>
    <span class="barra-interna__aqui">Configuración</span>
    <a href="api/acceso.php">← Menú</a>
    <a href="api/panel.php">Pedidos</a>
    <a href="api/blog.php">Noticias</a>
    <a href="api/equipo.php">Equipo</a>
    <a href="index.html" target="_blank" rel="noopener">Ver el sitio ↗</a>
    <a href="api/acceso.php?salir=1" class="barra-interna__salir">Salir</a>
  </nav>

  <style>
    /* Autocontenida: no depende de styles.css, que es la hoja del sitio
       publico y podria cambiar por otro motivo. */
    .barra-interna {
      display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
      background: #16191D; color: #fff;
      padding: 11px 20px;
      font: 500 13.5px/1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .barra-interna strong { letter-spacing: 1.5px; font-weight: 800; }
    .barra-interna__aqui {
      color: #EF7D2A; font-weight: 700;
      padding-right: 18px; border-right: 1px solid #333;
    }
    .barra-interna a { color: #C9CDD4; text-decoration: none; }
    .barra-interna a:hover { color: #fff; }
    .barra-interna__salir { margin-left: auto; }
    /* La cabecera del panel es sticky con top:0. Sin esto se monta encima
       de la barra al bajar y tapa la salida. */
    .admin-top { top: 41px !important; }
    @media (max-width: 720px) { .admin-top { top: 0 !important; } }
  </style>


  <!-- El panel completo lo arma admin.js (incluye la portada con clave) -->
  <div data-admin-app></div>

  <!-- PHP ya validó la sesión: admin.js no vuelve a pedir clave. -->
  <script>window.VITALICA_ADMIN_AUTORIZADO = true;</script>

  <!-- data.js trae los valores actuales (ya con overrides aplicados). admin.js edita y guarda. -->
  <!-- Lo publicado, para que el panel arranque mostrando el estado real del sitio. -->
  <script src="assets/js/data-overrides.js?v=59"></script>
  <script src="assets/js/data.js?v=59"></script>
  <script src="assets/js/pages/admin.js?v=59"></script>

</body>
</html>
