/* ==========================================================================
   VITALICA — pages/noticias.js  ·  EL BLOG
   --------------------------------------------------------------------------
   Un solo archivo para las dos páginas, porque comparten casi todo:

     noticias.html          el listado, con filtro por etiqueta
     nota.html?id=XXX       una nota

   Las notas salen de VITALICA_NOTICIAS (assets/js/data-noticias.js), que
   escribe el panel. Acá no se guarda nada: esto solo dibuja.
   ========================================================================== */
(function () {
  'use strict';

  var notas = (typeof VITALICA_NOTICIAS !== 'undefined' && VITALICA_NOTICIAS) || [];

  /* Solo lo publicado, y de la más nueva a la más vieja. Una nota sin fecha
     va al final en vez de romper el orden. */
  function publicadas() {
    return notas
      .filter(function (n) { return n && n.publicada !== false; })
      .slice()
      .sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
  }

  function escapar(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* "18 de septiembre de 2026". Si la fecha viene rara se muestra tal cual en
     vez de un "Invalid Date", que es peor que no poner nada. */
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaLarga(f) {
    var p = String(f || '').split('-');
    if (p.length !== 3) return f || '';
    var d = parseInt(p[2], 10), m = parseInt(p[1], 10) - 1;
    if (isNaN(d) || !MESES[m]) return f;
    return d + ' de ' + MESES[m] + ' de ' + p[0];
  }

  /* Cuánto se tarda en leerla. 200 palabras por minuto es el número que se
     usa siempre para lectura en pantalla. Se calcula en vez de cargarlo a
     mano: un dato que hay que acordarse de actualizar termina mintiendo. */
  function minutos(n) {
    var palabras = 0;
    (n.cuerpo || []).forEach(function (b) {
      if (b.texto) palabras += String(b.texto).split(/\s+/).length;
      if (b.items) b.items.forEach(function (i) { palabras += String(i).split(/\s+/).length; });
    });
    return Math.max(1, Math.round(palabras / 200));
  }


  /* ======================================================================
     LISTADO
     ====================================================================== */
  var contLista = document.querySelector('[data-noticias]');
  if (contLista) {
    var lista = publicadas();

    if (!lista.length) {
      /* Sin notas se dice por qué, en vez de dejar el hueco. Alguien que
         entra a una sección vacía asume que está rota. */
      contLista.innerHTML =
        '<div class="contenedor">' +
          '<p class="noticias__vacio">Todavía no publicamos ninguna nota. ' +
          'Estamos preparando las primeras.</p>' +
        '</div>';
      return;
    }

    var etiquetas = [];
    lista.forEach(function (n) {
      if (n.etiqueta && etiquetas.indexOf(n.etiqueta) === -1) etiquetas.push(n.etiqueta);
    });

    function tarjeta(n, destacada) {
      var img = n.portada
        ? '<img class="nota-card__foto" src="' + escapar(n.portada) + '" alt="" ' +
          'loading="lazy" width="800" height="500">'
        : '';
      return '<a class="nota-card' + (destacada ? ' nota-card--destacada' : '') + '" ' +
               'href="nota.html?id=' + encodeURIComponent(n.id) + '" ' +
               'data-etiqueta="' + escapar(n.etiqueta || '') + '">' +
               '<span class="nota-card__media">' + img + '</span>' +
               '<span class="nota-card__cuerpo">' +
                 (n.etiqueta ? '<span class="nota-card__etiqueta">' + escapar(n.etiqueta) + '</span>' : '') +
                 '<h2 class="nota-card__titulo">' + escapar(n.titulo) + '</h2>' +
                 (n.bajada ? '<p class="nota-card__bajada">' + escapar(n.bajada) + '</p>' : '') +
                 '<span class="nota-card__pie">' +
                   '<span>' + fechaLarga(n.fecha) + '</span>' +
                   '<span>' + minutos(n) + ' min de lectura</span>' +
                 '</span>' +
               '</span>' +
             '</a>';
    }

    /* La primera va grande. En un blog con pocas notas, todas iguales se
       leen como un archivo muerto; con una destacada hay una entrada
       evidente. */
    contLista.innerHTML =
      '<div class="contenedor">' +
        (etiquetas.length > 1
          ? '<div class="noticias__filtros" data-filtros>' +
              '<button type="button" class="noticias__filtro es-activo" data-filtro="">Todas</button>' +
              etiquetas.map(function (e) {
                return '<button type="button" class="noticias__filtro" data-filtro="' +
                       escapar(e) + '">' + escapar(e) + '</button>';
              }).join('') +
            '</div>'
          : '') +
        '<div class="noticias__grid" data-grid>' +
          lista.map(function (n, i) { return tarjeta(n, i === 0); }).join('') +
        '</div>' +
      '</div>';

    var filtros = contLista.querySelector('[data-filtros]');
    if (filtros) {
      filtros.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filtro]');
        if (!b) return;
        var quiere = b.dataset.filtro;
        filtros.querySelectorAll('[data-filtro]').forEach(function (x) {
          x.classList.toggle('es-activo', x === b);
        });
        contLista.querySelectorAll('.nota-card').forEach(function (c) {
          var entra = !quiere || c.dataset.etiqueta === quiere;
          c.hidden = !entra;
          /* La destacada pierde su tamaño especial al filtrar: si no, queda
             una tarjeta gigante sola y descolgada. */
          c.classList.toggle('nota-card--destacada', entra && !quiere && c === contLista.querySelector('.nota-card'));
        });
      });
    }
  }


  /* ======================================================================
     UNA NOTA
     ====================================================================== */
  var contNota = document.querySelector('[data-nota]');
  if (contNota) {
    var id = '';
    try { id = new URLSearchParams(location.search).get('id') || ''; } catch (e) {}
    var n = notas.filter(function (x) { return x && x.id === id; })[0];

    /* Sin id, id inventado, o nota despublicada: se avisa y se ofrece la
       salida. Una página en blanco deja a la persona sin saber qué pasó. */
    if (!n || n.publicada === false) {
      contNota.innerHTML =
        '<div class="contenedor nota__noesta">' +
          '<h1>No encontramos esta nota</h1>' +
          '<p>Puede que la hayamos despublicado o que el enlace esté incompleto.</p>' +
          '<a class="btn btn--primario" href="noticias.html">Ver todas las notas</a>' +
        '</div>';
      return;
    }

    document.title = n.titulo + ' · Vitalica';
    var meta = document.querySelector('meta[name="description"]');
    if (meta && n.bajada) meta.setAttribute('content', n.bajada);

    function bloque(b) {
      if (!b || !b.tipo) return '';
      switch (b.tipo) {
        case 'parrafo':
          return '<p>' + escapar(b.texto) + '</p>';
        case 'titulo':
          return '<h2>' + escapar(b.texto) + '</h2>';
        case 'imagen':
          if (!b.src) return '';
          return '<figure class="nota__figura">' +
                   '<img src="' + escapar(b.src) + '" alt="' + escapar(b.pie || '') + '" ' +
                   'loading="lazy">' +
                   (b.pie ? '<figcaption>' + escapar(b.pie) + '</figcaption>' : '') +
                 '</figure>';
        case 'lista':
          return '<ul class="nota__lista">' +
                 (b.items || []).map(function (i) { return '<li>' + escapar(i) + '</li>'; }).join('') +
                 '</ul>';
        case 'cita':
          return '<blockquote class="nota__cita">' +
                   '<p>' + escapar(b.texto) + '</p>' +
                   (b.autor ? '<cite>' + escapar(b.autor) + '</cite>' : '') +
                 '</blockquote>';
        case 'enlace':
          /* target="_blank" solo si sale del sitio; y siempre con
             rel="noopener", que impide que la página de destino pueda tocar
             la nuestra desde JavaScript. */
          var fuera = /^https?:\/\//i.test(b.href || '');
          return '<p class="nota__enlace">' +
                   '<a href="' + escapar(b.href) + '"' +
                   (fuera ? ' target="_blank" rel="noopener"' : '') + '>' +
                   escapar(b.texto || b.href) + ' →</a>' +
                 '</p>';
        default:
          return '';   // tipo desconocido: se ignora, no se rompe la página
      }
    }

    var otras = publicadas().filter(function (x) { return x.id !== n.id; }).slice(0, 3);

    contNota.innerHTML =
      '<article class="nota">' +
        '<div class="contenedor nota__cabecera">' +
          '<a class="nota__volver" href="noticias.html">← Noticias</a>' +
          (n.etiqueta ? '<p class="eyebrow">' + escapar(n.etiqueta) + '</p>' : '') +
          '<h1>' + escapar(n.titulo) + '</h1>' +
          (n.bajada ? '<p class="nota__bajada">' + escapar(n.bajada) + '</p>' : '') +
          '<p class="nota__datos">' + fechaLarga(n.fecha) + ' · ' + minutos(n) + ' min de lectura' +
            (n.autor ? ' · ' + escapar(n.autor) : '') + '</p>' +
        '</div>' +
        (n.portada
          ? '<div class="contenedor"><img class="nota__portada" src="' + escapar(n.portada) +
            '" alt="" width="1200" height="675"></div>'
          : '') +
        '<div class="contenedor nota__cuerpo">' +
          (n.cuerpo || []).map(bloque).join('') +
        '</div>' +
      '</article>' +
      (otras.length
        ? '<section class="seccion seccion--suave">' +
            '<div class="contenedor">' +
              '<div class="encabezado-seccion centrado">' +
                '<p class="eyebrow">Seguí leyendo</p>' +
                '<h2>Otras notas</h2>' +
              '</div>' +
              '<div class="noticias__grid">' +
                otras.map(function (o) {
                  return '<a class="nota-card" href="nota.html?id=' + encodeURIComponent(o.id) + '">' +
                           '<span class="nota-card__media">' +
                             (o.portada ? '<img class="nota-card__foto" src="' + escapar(o.portada) +
                                          '" alt="" loading="lazy" width="800" height="500">' : '') +
                           '</span>' +
                           '<span class="nota-card__cuerpo">' +
                             '<h2 class="nota-card__titulo">' + escapar(o.titulo) + '</h2>' +
                             '<span class="nota-card__pie"><span>' + fechaLarga(o.fecha) + '</span></span>' +
                           '</span>' +
                         '</a>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</section>'
        : '');
  }
})();
