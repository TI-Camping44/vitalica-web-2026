/* ==========================================================================
   404 — la página de "no existe" también vende
   --------------------------------------------------------------------------
   En BPN la 404 no es un callejón sin salida: abajo del mensaje ponen
   "OUR BEST SELLERS" con las tarjetas de producto de verdad. Tiene sentido —
   quien cae acá venía buscando algo para comprar.

   Acá se usan los productos marcados con `destacado: true` en data.js. Esa
   marca ya existía desde el primer día y no la usaba ninguna página: son seis
   productos elegidos a mano.

   El botón de WhatsApp de esta página NO se toca acá: ya lo arma un script al
   final de 404.html, que le mete la dirección que falló en el mensaje.
   ========================================================================== */
(function () {
  'use strict';

  var caja = document.querySelector('[data-404-productos]');
  if (!caja || typeof VITALICA_PRODUCTOS === 'undefined') return;

  var destacados = VITALICA_PRODUCTOS.filter(function (p) { return p.destacado; });
  // Si algún día se saca la marca de todos, mejor mostrar los primeros que
  // dejar el hueco: esta sección existe para que la página no sea un final.
  if (!destacados.length) destacados = VITALICA_PRODUCTOS.slice(0, 4);

  caja.innerHTML = destacados.slice(0, 4).map(function (p) {
    return Vitalica.cardProducto(p);
  }).join('');
  caja.closest('[data-404-seccion]').hidden = false;
})();
