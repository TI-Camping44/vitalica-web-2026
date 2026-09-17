/* ==========================================================================
   VITALICA — popups.js  ·  AVISOS DE CAMPAÑA
   --------------------------------------------------------------------------
   Muestra un aviso sobre la página para comunicar promociones, beneficios,
   lanzamientos o campañas. Las campañas se cargan en data.js (VITALICA_POPUPS)
   y no hace falta tocar este archivo para cambiarlas.

   Decisiones de diseño, por si mañana hay que discutirlas:

   • SOLO UNO A LA VEZ. Si hay varias campañas activas para la misma página,
     gana la primera de la lista. Dos pop-ups encima del otro no venden más:
     venden menos.

   • NO APARECE EN EL CHECKOUT NI EN EL CARRITO. Interrumpir a alguien que ya
     está comprando es la forma más cara de ganar un click.

   • SE ACUERDA DE QUIEN LO CERRÓ, guardando el id en el navegador. Por eso el
     id de cada campaña tiene que ser único (ver la nota en data.js).

   • RESPETA EL TECLADO: se cierra con Escape, el foco entra al panel y no se
     escapa mientras está abierto. Al cerrarse, el foco vuelve donde estaba.
     Esto no es un lujo: sin ello, quien navega con teclado queda atrapado.
   ========================================================================== */
(function () {

  var CLAVE = 'vitalica_popups_vistos';

  /* ---- Memoria de lo ya cerrado -------------------------------------------
     Guarda { id: timestamp }. Si el navegador tiene el almacenamiento
     bloqueado (modo privado en algunos casos), devolvemos objetos vacíos y el
     pop-up simplemente se comporta como si fuera la primera visita. */
  function leerVistos() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; }
    catch (e) { return {}; }
  }
  function marcarVisto(id) {
    try {
      var v = leerVistos();
      v[id] = Date.now();
      localStorage.setItem(CLAVE, JSON.stringify(v));
    } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function paginaActual() {
    var p = window.location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p;
  }

  /* ---- ¿Le toca a esta campaña? ---- */
  function corresponde(pop) {
    if (!pop || !pop.activo) return false;

    // Nunca sobre alguien que está comprando.
    var pag = paginaActual();
    if (pag === 'checkout.html' || pag === 'carrito.html') return false;

    // Filtro por página (lista vacía = todas)
    if (Array.isArray(pop.paginas) && pop.paginas.length > 0) {
      if (pop.paginas.indexOf(pag) === -1) return false;
    }

    var visto = leerVistos()[pop.id];
    if (!visto) return true;
    if (pop.soloUnaVez) return false;

    var dias = pop.repetirDias == null ? 7 : pop.repetirDias;
    if (dias <= 0) return true;
    return (Date.now() - visto) > dias * 24 * 60 * 60 * 1000;
  }

  /* ---- Resuelve el destino de un botón ----
     'whatsapp' es un atajo para no tener que escribir el link entero en
     data.js, que además cambiaría si cambia el número. */
  function destino(href) {
    if (href === 'whatsapp' && typeof Vitalica !== 'undefined' && Vitalica.linkWhatsapp) {
      return Vitalica.linkWhatsapp('Hola Vitalica! Vengo de la web y quiero hacer una consulta.');
    }
    return href;
  }

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- Mostrar ---- */
  function mostrar(pop) {
    var previo = document.activeElement;

    var caja = document.createElement('div');
    caja.className = 'popup';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'popup-titulo');

    var botones = '';
    if (pop.cta && pop.cta.texto) {
      botones += '<a class="btn btn--primario btn--grande" href="' + escapar(destino(pop.cta.href)) + '"' +
                 (pop.cta.href === 'whatsapp' ? ' target="_blank" rel="noopener"' : '') +
                 ' data-popup-cta>' + escapar(pop.cta.texto) + '</a>';
    }
    if (pop.cta2 && pop.cta2.texto) {
      botones += '<a class="btn btn--contorno btn--grande" href="' + escapar(destino(pop.cta2.href)) + '"' +
                 ' data-popup-cta>' + escapar(pop.cta2.texto) + '</a>';
    }

    caja.innerHTML =
      '<div class="popup__velo" data-popup-cerrar></div>' +
      '<div class="popup__panel">' +
        '<button class="popup__cerrar" type="button" aria-label="Cerrar aviso" data-popup-cerrar>&times;</button>' +
        (pop.imagen ? '<img class="popup__imagen" src="' + escapar(pop.imagen) + '" alt="" onerror="this.remove()">' : '') +
        '<div class="popup__cuerpo">' +
          (pop.etiqueta ? '<p class="popup__etiqueta">' + escapar(pop.etiqueta) + '</p>' : '') +
          '<h2 class="popup__titulo" id="popup-titulo">' + escapar(pop.titulo) + '</h2>' +
          (pop.texto ? '<p class="popup__texto">' + escapar(pop.texto) + '</p>' : '') +
          (botones ? '<div class="popup__acciones">' + botones + '</div>' : '') +
        '</div>' +
      '</div>';

    document.body.appendChild(caja);
    // Un tick después para que la transición de entrada se vea.
    requestAnimationFrame(function () { caja.classList.add('popup--visible'); });

    function cerrar() {
      marcarVisto(pop.id);
      caja.classList.remove('popup--visible');
      document.removeEventListener('keydown', alTeclado);
      setTimeout(function () {
        caja.remove();
        if (previo && previo.focus) previo.focus();
      }, 200);
    }

    /* Escape cierra; Tab queda encerrado dentro del panel mientras está
       abierto (si no, el foco se va a la página de atrás y se pierde). */
    function alTeclado(e) {
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return;
      var foco = caja.querySelectorAll('button, a[href]');
      if (!foco.length) return;
      var primero = foco[0], ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }

    caja.querySelectorAll('[data-popup-cerrar]').forEach(function (b) {
      b.addEventListener('click', cerrar);
    });
    // Tocar un botón de acción también cuenta como visto: ya cumplió su función.
    caja.querySelectorAll('[data-popup-cta]').forEach(function (b) {
      b.addEventListener('click', function () { marcarVisto(pop.id); });
    });
    document.addEventListener('keydown', alTeclado);

    var primerBoton = caja.querySelector('.popup__cerrar');
    if (primerBoton) primerBoton.focus();

    if (typeof gtag === 'function') {
      gtag('event', 'popup_mostrado', { campana: pop.id });
    }
  }

  /* ---- Arranque ---- */
  function iniciar() {
    if (typeof VITALICA_POPUPS === 'undefined' || !Array.isArray(VITALICA_POPUPS)) return;

    var elegido = null;
    for (var i = 0; i < VITALICA_POPUPS.length; i++) {
      if (corresponde(VITALICA_POPUPS[i])) { elegido = VITALICA_POPUPS[i]; break; }
    }
    if (!elegido) return;

    var espera = (elegido.segundos == null ? 5 : elegido.segundos) * 1000;
    setTimeout(function () { mostrar(elegido); }, espera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* Para probar desde la consola sin esperar ni borrar el almacenamiento:
       VitalicaPopups.probar('envio-gratis-lanzamiento')
       VitalicaPopups.olvidar()   ← vuelve a mostrar todos */
  window.VitalicaPopups = {
    probar: function (id) {
      var p = (VITALICA_POPUPS || []).filter(function (x) { return x.id === id; })[0];
      if (p) { mostrar(p); } else { console.warn('No existe la campaña: ' + id); }
    },
    olvidar: function () {
      try { localStorage.removeItem(CLAVE); console.log('Listo: los pop-ups vuelven a aparecer.'); }
      catch (e) { console.warn('No se pudo limpiar.'); }
    }
  };

})();
