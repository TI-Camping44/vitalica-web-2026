<?php
/* ============================================================================
   VITALICA — api/stands/config.ejemplo.php  ·  CONFIGURACIÓN DE LOS STANDS
   ----------------------------------------------------------------------------
   CÓMO USAR:
     1) Copiá este archivo como  config.php  (en esta misma carpeta)
     2) Completá los valores
     3) config.php NUNCA se comparte ni se sube a un repositorio

   ES UNA CONFIGURACIÓN APARTE de la de api/config.php, a propósito: los
   stands corren en paralelo a la web y no tocan nada de lo que ya anda.
   Si esto se rompe, la tienda sigue igual.
   ============================================================================ */

return [

  /* --- La base de los stands ----------------------------------------------
     En el servidor va MySQL. Puede ser la misma base de la web (las tablas
     de acá empiezan todas con  stands_  y no chocan con ninguna) o una
     aparte. Lo que importa es que NO se usa api/config.php: si mañana se
     cambia la base de la web, los stands no se enteran.

     SIN ESTA SECCIÓN se usa un archivo SQLite en api/stands/almacen/, que
     sirve para probar en la compu. */
  'db' => [
    'motor'   => 'mysql',
    'host'    => 'localhost',
    'puerto'  => 3306,
    'base'    => '',   // el nombre COMPLETO, con el prefijo de la cuenta
    'usuario' => '',
    'clave'   => '',
  ],

  /* --- n8n: de dónde sale el catálogo -------------------------------------
     El flujo "Catálogo del gym" ya calcula stock, lotes y precios por
     almacén. stand.php no repite esa lógica: le pregunta a n8n.

     'url'      el webhook de producción del flujo (no el de "test", que solo
                responde mientras el editor está abierto).
     'cabecera' y 'token': la autenticación por cabecera del webhook
                (Header Auth en n8n). Sin token, el webhook queda abierto a
                cualquiera que adivine la dirección.
     'segundos' cuánto se espera a n8n antes de rendirse. */
  'n8n' => [
    'url'      => '',
    'cabecera' => 'X-Vitalica-Token',
    'token'    => '',
    'segundos' => 12,
  ],

  /* --- Caché del catálogo --------------------------------------------------
     Cada escaneo del QR NO va hasta n8n y Odoo: se guarda la respuesta un
     rato. El stock de un stand no cambia cada segundo, y pedido.php vuelve
     a verificarlo antes de cobrar, así que unos segundos de atraso acá no
     hacen vender lo que no hay.

     'vigente'  segundos en que la copia se usa sin preguntar.
     'respaldo' si n8n no contesta, hasta cuántos segundos de vieja se acepta
                la copia, marcada como desactualizada. Pasado eso, error. */
  'cache' => [
    'vigente'  => 90,
    'respaldo' => 900,
  ],

  // El huso del gimnasio, para decidir si está abierto.
  'zona_horaria' => 'America/Asuncion',
];
