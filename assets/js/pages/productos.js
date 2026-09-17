/* ==========================================================================
   VITALICA — pages/productos.js  ·  PÁGINA "PRODUCTOS"
   --------------------------------------------------------------------------
   Arma DOS interfaces sobre la misma grilla:

     · los chips de objetivo, que es como se filtra hoy;
     · un panel lateral con casillas y contadores, más un contador de
       resultados y un selector de orden, que es como filtra BPN.

   Las dos se escriben siempre y el CSS decide cuál se ve (ver la sección 22
   de tema-2026.css). Así se pueden comparar los dos diseños navegando el
   sitio de verdad, y el que se descarte se borra de un lado solo.

   Si la URL trae ?meta=fuerza arranca filtrado por esa meta, y eso vale para
   las dos interfaces: es el mismo estado. Así siguen funcionando los enlaces
   del home, el mega-menú y el pie.
   ========================================================================== */
(function () {
  var grilla = document.querySelector('[data-grilla-productos]');
  var nav    = document.querySelector('[data-filtro-metas]');
  if (!grilla) return;

  var panel   = document.querySelector('[data-filtros-panel]');
  var cuenta  = document.querySelector('[data-cuenta-productos]');
  var orden   = document.querySelector('[data-orden]');

  /* ---- Estado ----------------------------------------------------------
     metasSel y formatosSel son listas porque el panel deja marcar varias.
     Los chips, en cambio, eligen una sola: cuando se toca un chip la lista
     queda con un solo elemento. Un estado para los dos. */
  var metasSel    = [];
  var formatosSel = [];
  var ordenSel    = 'destacados';

  var metaURL = new URLSearchParams(location.search).get('meta');
  if (metaURL && metaURL !== 'todos') metasSel = [metaURL];


  /* ---- Formato: se agrupa en dos ---------------------------------------
     En data-fichas.js los formatos están escritos como en el envase:
     "Polvo", "Polvo micronizado 200 mesh", "Cápsulas", "Cápsulas blandas".
     Para filtrar, lo que importa es polvo o cápsula. */
  function formatoDe(p) {
    var f = (typeof VITALICA_FICHAS_TECNICAS !== 'undefined' &&
             VITALICA_FICHAS_TECNICAS[p.id] &&
             VITALICA_FICHAS_TECNICAS[p.id].formato) || '';
    if (/c[áa]psula/i.test(f)) return 'capsulas';
    if (/polvo/i.test(f))      return 'polvo';
    return '';
  }

  var FORMATOS = [
    { id: 'polvo',    nombre: 'Polvo' },
    { id: 'capsulas', nombre: 'Cápsulas' }
  ];

  function tieneMeta(p, idMeta) {
    var m = Datos.meta(idMeta);
    if (!m) return false;
    var cats = [p.categoria].concat(p.categoriasExtra || []);
    return cats.some(function (c) { return m.categorias.indexOf(c) !== -1; });
  }

  /* Filtra por todo menos por UN grupo. Sirve para contar cuántos productos
     quedarían al marcar cada casilla de ese grupo, que es lo que muestran
     los números al lado de cada opción. Sin esto, los contadores cambiarían
     al marcar algo del mismo grupo y darían números raros (marcar "Polvo"
     dejaría "Cápsulas (0)"). */
  function filtrar(saltearGrupo) {
    return VITALICA_PRODUCTOS.filter(function (p) {
      if (saltearGrupo !== 'meta' && metasSel.length &&
          !metasSel.some(function (m) { return tieneMeta(p, m); })) return false;
      if (saltearGrupo !== 'formato' && formatosSel.length &&
          formatosSel.indexOf(formatoDe(p)) === -1) return false;
      return true;
    });
  }

  function ordenar(lista) {
    var copia = lista.slice();
    // Sin precio cargado, el producto va al final en los dos órdenes de
    // precio: no se puede ordenar por un número que no existe, y esconderlo
    // arriba haría pensar que es el más barato.
    function precio(p) { return (p.precio == null) ? Infinity : p.precio; }

    if (ordenSel === 'precio-asc')  copia.sort(function (a, b) { return precio(a) - precio(b); });
    if (ordenSel === 'precio-desc') copia.sort(function (a, b) { return precio(b) - precio(a); });
    if (ordenSel === 'nombre')      copia.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    // 'destacados': los marcados primero, y adentro de cada bloque el orden
    // de data.js, que es el que eligió marketing.
    if (ordenSel === 'destacados')  copia.sort(function (a, b) { return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0); });
    return copia;
  }


  /* ---- Panel lateral ---- */
  function grupoHTML(titulo, tipo, opciones, seleccion) {
    var base = filtrar(tipo);   // todo lo demás ya aplicado
    return '<div class="filtro-grupo">' +
      '<h3 class="filtro-grupo__titulo">' + titulo + '</h3>' +
      '<ul class="filtro-grupo__lista">' +
        opciones.map(function (o) {
          var n = base.filter(function (p) {
            return tipo === 'meta' ? tieneMeta(p, o.id) : formatoDe(p) === o.id;
          }).length;
          var marcado = seleccion.indexOf(o.id) !== -1;
          return '<li>' +
            '<label class="filtro-opcion' + (n === 0 && !marcado ? ' filtro-opcion--vacia' : '') + '">' +
              '<input type="checkbox" data-tipo="' + tipo + '" value="' + o.id + '"' +
                (marcado ? ' checked' : '') + (n === 0 && !marcado ? ' disabled' : '') + '>' +
              '<span>' + o.nombre + '</span>' +
              '<span class="filtro-opcion__n">' + n + '</span>' +
            '</label>' +
          '</li>';
        }).join('') +
      '</ul></div>';
  }

  function pintarPanel() {
    if (!panel) return;
    panel.innerHTML =
      '<div class="filtros__cab">' +
        '<h2 class="filtros__titulo">Filtros</h2>' +
        ((metasSel.length || formatosSel.length)
          ? '<button type="button" class="filtros__limpiar" data-limpiar>Limpiar</button>' : '') +
      '</div>' +
      grupoHTML('Formato', 'formato', FORMATOS, formatosSel) +
      grupoHTML('Objetivo', 'meta', VITALICA_METAS, metasSel);
  }


  /* ---- Chips (el diseño actual) ---- */
  function pintarChips() {
    if (!nav) return;
    if (!nav.children.length) {
      var filtros = [{ id: 'todos', nombre: 'Todos' }].concat(VITALICA_METAS);
      nav.innerHTML = filtros.map(function (m) {
        return '<button type="button" data-meta="' + m.id + '" aria-pressed="false">' + m.nombre + '</button>';
      }).join('');
    }
    // El chip activo es el único marcado, o "Todos" si hay 0 o más de 1.
    var actual = (metasSel.length === 1) ? metasSel[0] : 'todos';
    nav.querySelectorAll('[data-meta]').forEach(function (b) {
      var activo = (b.dataset.meta === actual);
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
  }


  function pintar() {
    var lista = ordenar(filtrar(null));

    grilla.innerHTML = lista.length
      ? lista.map(function (p) { return Vitalica.cardProducto(p); }).join('')
      : '<p class="catalogo__vacio">No hay productos con esos filtros. ' +
        '<button type="button" data-limpiar>Ver todos</button></p>';

    if (cuenta) {
      cuenta.textContent = lista.length + (lista.length === 1 ? ' producto' : ' productos');
    }

    pintarPanel();
    pintarChips();

    // La dirección refleja el filtro para poder compartirla. Solo se guarda
    // la meta: es el único filtro que llega desde afuera (home, menú, pie).
    var url = (metasSel.length === 1)
      ? 'productos.html?meta=' + metasSel[0]
      : 'productos.html';
    history.replaceState(null, '', url);
  }

  pintar();


  /* ---- Eventos ---- */
  if (nav) {
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-meta]');
      if (!b) return;
      metasSel = (b.dataset.meta === 'todos') ? [] : [b.dataset.meta];
      formatosSel = [];
      pintar();
    });
  }

  if (panel) {
    panel.addEventListener('change', function (e) {
      var c = e.target.closest('input[type="checkbox"]');
      if (!c) return;
      var lista = (c.dataset.tipo === 'meta') ? metasSel : formatosSel;
      var i = lista.indexOf(c.value);
      if (c.checked && i === -1) lista.push(c.value);
      if (!c.checked && i !== -1) lista.splice(i, 1);
      pintar();
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-limpiar]')) return;
    metasSel = [];
    formatosSel = [];
    pintar();
  });

  if (orden) {
    orden.addEventListener('change', function () {
      ordenSel = orden.value;
      pintar();
    });
  }
})();
