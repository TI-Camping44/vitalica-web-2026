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

  <link rel="stylesheet" href="assets/css/styles.css?v=3">
</head>
<body class="admin-body">

  <!-- El panel completo lo arma admin.js (incluye la portada con clave) -->
  <div data-admin-app></div>

  <!-- PHP ya validó la sesión: admin.js no vuelve a pedir clave. -->
  <script>window.VITALICA_ADMIN_AUTORIZADO = true;</script>

  <!-- data.js trae los valores actuales (ya con overrides aplicados). admin.js edita y guarda. -->
  <script src="assets/js/data.js?v=3"></script>
  <script src="assets/js/pages/admin.js?v=3"></script>

</body>
</html>
