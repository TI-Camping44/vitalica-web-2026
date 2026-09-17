/* ==========================================================================
   VITALICA — pages/contacto.js  ·  DÓNDE COMPRAR
   --------------------------------------------------------------------------
   Muestra los comercios aliados igual que la home: el logo del negocio.

   POR QUÉ NO HAY DIRECCIONES
   Antes esta sección listaba nombre + ciudad + dirección, y en cuatro de los
   seis comercios la dirección decía "Dirección a confirmar" — o sea que la
   sección se veía a medio hacer. Y no es un dato que se pueda sostener: son
   cadenas con varias sucursales que abren y cierran locales.

   Lo que sí se sostiene es quiénes son. Quien necesita un local puntual
   pregunta por WhatsApp, que está justo debajo.

   La lista es VITALICA_TIENDAS (data.js), la misma que usa la home.
   El formulario de contacto lo maneja main.js (data-form-demo).
   ========================================================================== */
(function () {
  var cont = document.querySelector('[data-tiendas]');
  if (!cont || typeof VITALICA_TIENDAS === 'undefined') return;

  cont.innerHTML = VITALICA_TIENDAS.map(function (t) {
    return Vitalica.logoAliado(t);
  }).join('');
})();
