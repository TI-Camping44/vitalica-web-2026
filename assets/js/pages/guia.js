/* ==========================================================================
   VITALICA — pages/guia.js  ·  ÍNDICE DE GUÍAS DE USO
   Pinta las tarjetas de guías desde VITALICA_ARTICULOS (data.js).
   ========================================================================== */
(function () {
  var c = document.querySelector('[data-guias]');
  if (c) c.innerHTML = VITALICA_ARTICULOS.map(function (a) { return Vitalica.cardArticulo(a); }).join('');
})();
