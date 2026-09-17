/* ============================================================================
   VITALICA — Ficha técnica de producto
   ----------------------------------------------------------------------------
   Lee el ?id= de la URL, busca la ficha en VITALICA_FICHAS (data-fichas.js)
   y la dibuja dentro de <div data-ficha-tecnica></div>.

   Si el producto no tiene ficha cargada, no dibuja nada y avisa por consola
   qué id faltó. Nunca rompe la página.
   ========================================================================== */

(function () {
  'use strict';

  var contenedor = document.querySelector('[data-ficha-tecnica]');
  if (!contenedor) return;

  var fichas = window.VITALICA_FICHAS || {};

  // Normalmente el id sale del ?id= de la URL. La variable
  // VITALICA_FICHA_ID_FORZADO existe solo para la vista previa y para pruebas;
  // en el sitio no está definida, así que no cambia nada.
  var id = window.VITALICA_FICHA_ID_FORZADO ||
           new URLSearchParams(window.location.search).get('id');

  var ficha = id ? fichas[id] : null;

  if (!ficha) {
    if (id) {
      console.info(
        '[Ficha técnica] No hay ficha cargada para el id "' + id + '".\n' +
        'Ids disponibles en data-fichas.js: ' + Object.keys(fichas).join(', ')
      );
    }
    return;
  }

  /* --- utilidades ------------------------------------------------------- */

  // Escapa texto para que un valor con < o & no rompa el HTML.
  function esc(txt) {
    return String(txt == null ? '' : txt)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var flecha =
    '<svg class="acordeon__flecha" viewBox="0 0 24 24" width="20" height="20" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  // Arma un acordeón. `abierto` decide si arranca desplegado.
  function acordeon(titulo, cuerpoHTML, abierto) {
    return '' +
      '<details class="acordeon"' + (abierto ? ' open' : '') + '>' +
        '<summary class="acordeon__cabecera">' +
          '<span>' + esc(titulo) + '</span>' + flecha +
        '</summary>' +
        '<div class="acordeon__cuerpo">' + cuerpoHTML + '</div>' +
      '</details>';
  }

  /* --- bloque 1: especificaciones --------------------------------------- */

  function bloqueSpecs(specs) {
    if (!specs || !specs.length) return '';
    var filas = specs.map(function (par) {
      return '<dt>' + esc(par[0]) + '</dt><dd>' + esc(par[1]) + '</dd>';
    }).join('');
    return '<dl class="ficha-specs">' + filas + '</dl>';
  }

  /* --- bloque 2: información nutricional -------------------------------- */

  function bloqueNutricional(n) {
    if (!n || !n.filas || !n.filas.length) return '';

    var html = '';

    if (n.porcion) {
      html += '<p class="ficha-porcion">Porción: <strong>' +
              esc(n.porcion) + '</strong></p>';
    }

    var columnas = n.columnas || ['Cantidad'];

    html += '<table class="ficha-tabla"><thead><tr><th scope="col">Nutriente</th>';
    columnas.forEach(function (c) {
      html += '<th scope="col">' + esc(c) + '</th>';
    });
    html += '</tr></thead><tbody>';

    n.filas.forEach(function (fila) {
      // Los nombres que arrancan con espacios se muestran indentados.
      var esSub = /^\s{2,}/.test(fila[0]);
      html += '<tr' + (esSub ? ' class="es-subfila"' : '') + '>';
      html += '<td>' + esc(String(fila[0]).trim()) + '</td>';
      for (var i = 0; i < columnas.length; i++) {
        html += '<td>' + esc(fila[i + 1] || '—') + '</td>';
      }
      html += '</tr>';
    });

    html += '</tbody></table>';

    html += '<p class="ficha-nota">' +
            (n.nota ? esc(n.nota) + ' ' : '') +
            'Valores de referencia. La información que manda es la de la ' +
            'etiqueta del envase.</p>';

    return html;
  }

  /* --- armado final ------------------------------------------------------ */

  var partes = '';

  var specs = bloqueSpecs(ficha.specs);
  if (specs) partes += acordeon('Ficha técnica', specs, true);

  var nutri = bloqueNutricional(ficha.nutricional);
  if (nutri) partes += acordeon('Información nutricional', nutri, false);

  if (!partes) return;

  var codigo = ficha.codigo
    ? '<p class="ficha-codigo">Código de artículo: <strong>' +
      esc(ficha.codigo) + '</strong></p>'
    : '';

  contenedor.innerHTML =
    '<section class="ficha">' +
      '<div class="contenedor">' +
        '<div class="ficha__contenedor">' +
          '<h2 class="ficha__titulo">Detalle del producto</h2>' +
          partes +
          codigo +
        '</div>' +
      '</div>' +
    '</section>';

})();
