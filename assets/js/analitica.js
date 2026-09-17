/* ==========================================================================
   VITALICA — analitica.js  ·  GOOGLE ANALYTICS + CONSENTIMIENTO DE COOKIES
   --------------------------------------------------------------------------
   Por qué existe este archivo:

   Antes el snippet de GA4 estaba escrito a mano dentro de index.html. Eso
   traía dos problemas:

     1) Solo medía la home. Las otras 17 páginas no cargaban gtag, así que no
        había datos de producto, carrito ni checkout. Peor: checkout.js dispara
        el evento 'pedido_whatsapp' (la conversión) detrás de un
        `if (typeof gtag === 'function')`, y como checkout.html no cargaba gtag
        esa condición SIEMPRE era falsa. El evento nunca se disparó ni una vez.

     2) Cargaba sin preguntar. GA4 instala cookies de seguimiento; medir gente
        sin avisarle no corresponde, y privacidad.html ya habla de cookies.

   Cómo funciona ahora:

     - gtag NO se carga hasta que la persona acepta. No es un cartel decorativo:
       si dice que no, no se pide nada a Google y no se instala ninguna cookie.
     - La decisión se guarda en localStorage y no se vuelve a preguntar.
     - Se puede cambiar después desde el enlace "Cookies" del footer.

   El ID de medición sale de data.js -> VITALICA_CONFIG.analytics.ga4, así que
   este archivo va DESPUÉS de data.js en todas las páginas.
   ========================================================================== */
(function () {
  'use strict';

  var CLAVE = 'vitalica_cookies';   // 'si' | 'no'
  var cargado = false;

  function decision() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  function guardar(valor) {
    try { localStorage.setItem(CLAVE, valor); } catch (e) { /* modo incógnito */ }
  }

  /* ---------- Cargar GA4 (solo si aceptaron) ---------- */
  function cargarGA() {
    if (cargado) return;
    var id = (typeof VITALICA_CONFIG !== 'undefined' &&
              VITALICA_CONFIG.analytics && VITALICA_CONFIG.analytics.ga4) || '';
    if (!id) return;                      // sin ID configurado no hacemos nada
    cargado = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    // Consent Mode: dejamos explícito que la publicidad sigue denegada.
    // Solo medimos visitas; no hacemos remarketing.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);

    gtag('js', new Date());
    gtag('config', id);
  }

  /* ---------- El cartel ---------- */
  function mostrarCartel() {
    if (document.querySelector('[data-cookies]')) return;

    var caja = document.createElement('div');
    caja.className = 'cookies';
    caja.setAttribute('data-cookies', '');
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-label', 'Aviso de cookies');
    caja.innerHTML =
      '<div class="cookies__texto">' +
        '<strong>Usamos cookies para medir visitas</strong>' +
        '<p>Nos ayudan a entender qué se busca en la web y mejorarla. ' +
           'No las usamos para publicidad. Podés cambiar tu elección cuando quieras. ' +
           '<a href="privacidad.html">Ver política de privacidad</a>.</p>' +
      '</div>' +
      '<div class="cookies__acciones">' +
        '<button type="button" class="btn btn--claro" data-cookies-no>Rechazar</button>' +
        '<button type="button" class="btn btn--primario" data-cookies-si>Aceptar</button>' +
      '</div>';

    document.body.appendChild(caja);
    // Corre el botón de WhatsApp para arriba mientras el cartel esté puesto
    // (en celular le tapaba el botón Aceptar).
    document.body.classList.add('con-cookies');
    // El alta con clase aparte es para que el CSS pueda animar la entrada.
    requestAnimationFrame(function () { caja.classList.add('cookies--visible'); });

    caja.querySelector('[data-cookies-si]').addEventListener('click', function () {
      guardar('si'); cerrar(caja); cargarGA();
    });
    caja.querySelector('[data-cookies-no]').addEventListener('click', function () {
      guardar('no'); cerrar(caja);
    });
  }

  function cerrar(caja) {
    document.body.classList.remove('con-cookies');
    caja.classList.remove('cookies--visible');
    setTimeout(function () { if (caja.parentNode) caja.parentNode.removeChild(caja); }, 300);
  }

  /* ---------- Permitir cambiar de opinión después ---------- */
  // El footer tiene un enlace con data-cookies-abrir; también se puede llamar
  // a Vitalica.cookies() desde la consola para probar.
  function reabrir() {
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    mostrarCartel();
  }

  function iniciar() {
    var d = decision();
    if (d === 'si') cargarGA();
    else if (d !== 'no') mostrarCartel();

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-cookies-abrir]');
      if (a) { e.preventDefault(); reabrir(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  window.VitalicaCookies = { reabrir: reabrir, decision: decision };
})();
