/* ==========================================================================
   VITALICA — pages/legales.js  ·  DATOS DE EMPRESA EN LAS PÁGINAS LEGALES
   --------------------------------------------------------------------------
   Rellena razón social, RUC, domicilio y contactos en terminos.html y
   privacidad.html, tomándolos de VITALICA_CONFIG.empresa (data.js).

   POR QUÉ SE CARGAN DESDE UN SOLO LUGAR
   Si el RUC estuviera escrito a mano en las dos páginas, el día que cambie
   alguien va a actualizar una y olvidarse de la otra. Y un dato fiscal
   equivocado en un documento legal es exactamente lo que no se puede permitir.

   QUÉ PASA SI FALTA UN DATO
   Se marca en naranja, visible, con el nombre del campo que hay que completar.
   La alternativa —dejar un guion mudo— haría que el documento pareciera
   terminado cuando no lo está, y podría publicarse así. Un hueco que se ve es
   un hueco que se completa.
   ========================================================================== */
(function () {
  var cont = document.querySelector('[data-legal]');
  if (!cont) return;

  var emp = (typeof VITALICA_CONFIG !== 'undefined' && VITALICA_CONFIG.empresa) || {};
  var faltantes = [];

  /* Escribe un valor, o deja un aviso si está vacío. */
  function poner(selector, valor, nombreCampo) {
    var els = cont.querySelectorAll(selector);
    if (!els.length) return;
    var vacio = !valor || String(valor).trim() === '';
    if (vacio && faltantes.indexOf(nombreCampo) === -1) faltantes.push(nombreCampo);

    els.forEach(function (el) {
      if (vacio) {
        el.className = (el.className + ' legal__falta').trim();
        el.textContent = '[completar: ' + nombreCampo + ']';
        if (el.tagName === 'A') { el.removeAttribute('href'); }
      } else {
        el.textContent = valor;
      }
    });
  }

  /* Igual que poner(), pero además arma el enlace. */
  function ponerEnlace(selector, texto, href, nombreCampo) {
    var els = cont.querySelectorAll(selector);
    if (!els.length) return;
    var vacio = !texto || String(texto).trim() === '';
    if (vacio && faltantes.indexOf(nombreCampo) === -1) faltantes.push(nombreCampo);

    els.forEach(function (el) {
      if (vacio) {
        el.className = (el.className + ' legal__falta').trim();
        el.textContent = '[completar: ' + nombreCampo + ']';
        el.removeAttribute('href');
      } else {
        el.textContent = texto;
        el.setAttribute('href', href);
      }
    });
  }

  poner('[data-empresa-razon]',     emp.razonSocial, 'razón social');
  poner('[data-empresa-ruc]',       emp.ruc,         'RUC');
  poner('[data-empresa-domicilio]', emp.domicilio,   'domicilio fiscal');
  poner('[data-empresa-ciudad]',    emp.ciudad,      'ciudad');

  var wa = (VITALICA_CONFIG.whatsapp && VITALICA_CONFIG.whatsapp.numeroVisible) || '';
  ponerEnlace('[data-empresa-whatsapp]', wa,
              (typeof Vitalica !== 'undefined' && Vitalica.linkWhatsapp) ? Vitalica.linkWhatsapp() : '#',
              'WhatsApp');

  var mail = VITALICA_CONFIG.email || '';
  ponerEnlace('[data-empresa-email]', mail, 'mailto:' + mail, 'email de contacto');

  // Para privacidad puede haber un email distinto; si no, se usa el general.
  var mailPriv = emp.emailPrivacidad || mail;
  ponerEnlace('[data-empresa-email-privacidad]', mailPriv, 'mailto:' + mailPriv, 'email de privacidad');

  /* Fecha de última actualización: la del archivo, no una escrita a mano que
     queda vieja. Si el navegador no la informa, se deja lo que diga el HTML. */
  var elFecha = cont.querySelector('[data-fecha-actualizacion]');
  if (elFecha && document.lastModified) {
    var d = new Date(document.lastModified);
    if (!isNaN(d.getTime())) {
      var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      elFecha.textContent = meses[d.getMonth()] + ' de ' + d.getFullYear();
    }
  }

  /* Aviso general arriba del documento, solo si falta algo. No se le muestra
     al visitante como un error del sitio: se explica qué es y qué hacer. */
  if (faltantes.length) {
    var aviso = document.createElement('div');
    aviso.className = 'legal__pendiente';
    aviso.innerHTML =
      '<strong>Este documento todavía no está listo para publicar.</strong> ' +
      'Faltan datos de la empresa: <strong>' + faltantes.join(', ') + '</strong>.<br>' +
      'Se cargan una sola vez en <code>assets/js/data.js</code> → ' +
      '<code>VITALICA_CONFIG.empresa</code>, y aparecen en todas las páginas legales.';
    cont.insertBefore(aviso, cont.firstChild);
  }
})();
