/* ==========================================================================
   VITALICA — pages/producto.js  ·  DETALLE DE PRODUCTO (estilo BPN)
   --------------------------------------------------------------------------
   Lee el ?id= de la URL, arma la zona de compra arriba y, debajo, secciones
   de marketing con bloques de marca + el contenido REAL de la guía de uso
   (Datos.guia): Lo que sí/no hace, Cómo tomarla, Qué esperar, Cuidados y FAQ.
   "Agregar al carrito" abre el carrito drawer. Relacionados = combo (van juntos).

   NOVEDADES DE ESTA VERSIÓN
   -------------------------
   1) GALERÍA DE FOTOS: debajo de la foto principal aparece una tira de
      miniaturas. Busca sola los archivos -2, -3, -4 y -5 al lado de la foto
      principal (ver assets/js/data-fichas.js). Si no hay ninguno, no muestra
      nada y la página queda igual que antes.
   2) FICHA TÉCNICA EN ACORDEONES: la vieja sección "Valores por porción" se
      reemplaza por dos acordeones (Ficha técnica / Información nutricional),
      al estilo del bloque de especificaciones de actionsportgames.com.
      Los datos salen de VITALICA_FICHAS (data.js) + VITALICA_FICHAS_TECNICAS
      (data-fichas.js). Necesita assets/css/producto-ficha.css.
   ========================================================================== */
(function () {
  var cont = document.querySelector('[data-producto]');
  if (!cont) return;

  var id = new URLSearchParams(location.search).get('id');
  var p = id ? Datos.producto(id) : null;
  var bc = document.querySelector('[data-breadcrumb]');

  if (!p) {
    if (bc) bc.innerHTML = '<a href="index.html">Inicio</a><span>/</span><a href="productos.html">Productos</a>';
    cont.innerHTML =
      '<div class="producto-no-encontrado">' +
        '<h1>Producto no encontrado</h1>' +
        '<p class="texto-apagado">El producto que buscás no existe o cambió de dirección.</p>' +
        '<a class="btn btn--primario" href="productos.html">Ver productos</a>' +
      '</div>';
    return;
  }

  document.title = p.nombre + ' · Vitalica';
  var cat = Datos.categoria(p.categoria);
  var meta = VITALICA_METAS.find(function (m) { return m.categorias.indexOf(p.categoria) !== -1; });
  var g = Datos.guia(p.id) || {};

  // Migas de pan
  if (bc) {
    bc.innerHTML =
      '<a href="index.html">Inicio</a><span>/</span>' +
      '<a href="productos.html' + (meta ? '?meta=' + meta.id : '') + '">' + (meta ? meta.nombre : 'Productos') + '</a>' +
      '<span>/</span><span class="breadcrumb__actual">' + p.nombre + '</span>';
  }

  // La etiqueta la decide Vitalica.etiquetaDe(), el mismo criterio que usan
  // las tarjetas del catálogo (promo > campaña > tags).
  var _et = Vitalica.etiquetaDe(p);
  var etiqueta = _et ? _et.texto : '';
  var claseTag = _et ? _et.clase : '';

  /* ===== FICHA TÉCNICA =====
     ficha  → VITALICA_FICHAS de data.js         (stats, sabores, catálogo)
     fichaT → VITALICA_FICHAS_TECNICAS de        (presentación, nutricional,
              data-fichas.js                      galería)
     Si alguno no está, se usa un objeto vacío y esos bloques no se dibujan. */
  var ficha  = Datos.ficha(p.id) || {};
  var fichaT = (typeof VITALICA_FICHAS_TECNICAS !== 'undefined' &&
                VITALICA_FICHAS_TECNICAS[p.id]) || {};

  var statsHTML = (ficha.stats && ficha.stats.length)
    ? '<div class="ficha-stats">' + ficha.stats.map(function (s) {
        return '<div class="stat-badge">' +
                 '<p class="stat-badge__label">' + s.label + '</p>' +
                 '<p class="stat-badge__valor">' + s.valor + '</p>' +
               '</div>';
      }).join('') + '</div>'
    : '';

  /* ======================================================================
     SELECTOR DE SABOR Y PRESENTACIÓN
     ----------------------------------------------------------------------
     Si el producto tiene más de una variante, se elige acá. Lo que se elige
     define el código de barras que viaja al carrito, y con eso el pedido
     puede convertirse en una línea exacta en Odoo.

     Solo se muestra la fila que aporta algo: la creatina tiene un solo
     "sabor" (sin sabor) y dos tamaños, así que muestra tamaños nada más.

     Las combinaciones que no existen se apagan en vez de ocultarse: es más
     honesto mostrar que el Whey de Cookies no viene en 2270 g que hacer
     desaparecer la opción sin explicación.
     ====================================================================== */
  var variantes    = Datos.variantes(p.id);
  var hayOpciones  = Datos.tieneOpciones(p.id);
  var sabores      = Datos.sabores(p.id);
  var tamanos      = Datos.tamanos(p.id);
  var mostrarSabor = sabores.length > 1;
  var mostrarTamano = tamanos.length > 1;

  function filaOpciones(titulo, tipo, lista) {
    return '<div class="variantes__fila">' +
      '<p class="variantes__titulo">' + titulo + '</p>' +
      '<div class="variantes__lista" role="group" aria-label="' + titulo + '">' +
        lista.map(function (o, i) {
          var val = o.valor;

          // La foto del envase en ese sabor. Se emite SIEMPRE que exista; que
          // se vea o no lo decide el CSS, así el diseño actual queda igual
          // (ver .variante-chip__foto en styles.css y en tema-2026.css).
          //
          // Solo para sabores: una presentación ("700 g") no tiene foto propia
          // y un disco vacío al lado del peso no dice nada.
          //
          // Cuando el sabor no tiene foto queda el disco con el emoji. Es a
          // propósito: faltan nueve packshots y así se ve dónde faltan, en vez
          // de disimularlo.
          var foto = '';
          if (tipo === 'sabor') {
            foto = '<span class="variante-chip__foto' +
                     (o.imagen ? '' : ' variante-chip__foto--sin') + '">' +
                     (o.imagen
                       ? '<img src="' + o.imagen + '" alt="" loading="lazy">'
                       : '<span aria-hidden="true">' + (o.icono || '') + '</span>') +
                   '</span>';
          }

          return '<button type="button" class="variante-chip" data-tipo="' + tipo + '" ' +
                 'data-valor="' + val.replace(/"/g, '&quot;') + '"' +
                 (i === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
                 foto +
                 (o.icono ? '<span class="variante-chip__emoji">' + o.icono + '</span> ' : '') +
                 '<span class="variante-chip__texto">' + o.texto + '</span>' +
                 '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  var saboresHTML;
  if (hayOpciones) {
    saboresHTML = '<div class="variantes" data-variantes>' +
      (mostrarSabor ? filaOpciones('Sabor', 'sabor', sabores.map(function (s) {
        return { valor: s.nombre, texto: s.nombre, icono: s.icono, imagen: s.imagen };
      })) : '') +
      (mostrarTamano ? filaOpciones('Presentación', 'tamano', tamanos.map(function (t) {
        return { valor: t, texto: t, icono: '' };
      })) : '') +
    '</div>';
  } else if (ficha.sabores && ficha.sabores.length) {
    // Una sola variante: no hay nada que elegir, solo se informa.
    saboresHTML = '<div class="ficha-sabores">' +
        '<p class="ficha-sabores__titulo">Sabores disponibles</p>' +
        '<div class="ficha-sabores__lista">' + ficha.sabores.map(function (s) {
          return '<span class="sabor-chip">' + (s.icono || '') + ' ' + s.nombre + '</span>';
        }).join('') + '</div>' +
      '</div>';
  } else {
    saboresHTML = '';
  }

  /* ===== ZONA DE COMPRA ===== */
  cont.innerHTML =
    '<div class="producto__col-media">' +
      '<div class="producto__media">' +
        (etiqueta ? '<span class="tag ' + claseTag + ' card-producto__tag">' + etiqueta + '</span>' : '') +
        '<img src="' + p.imagen + '" alt="' + p.nombre + '" width="700" height="700" data-foto-principal>' +
      '</div>' +
      // Aviso de "esta foto es de otra presentación". Arranca oculto y lo
      // llena refrescar() solo cuando hace falta.
      '<p class="producto__nota-foto" data-nota-foto hidden></p>' +
      '<div class="producto__galeria" data-galeria hidden></div>' +
    '</div>' +
    '<div class="producto__info">' +
      '<p class="producto__cat">' + (cat ? cat.nombre : '') + '</p>' +
      '<h1>' + p.nombre + '</h1>' +
      (VITALICA_CONFIG.mostrarRatings
        ? '<div class="producto__rating">' + Vitalica.estrellas(p.rating) +
          '<span>' + p.rating.toFixed(1) + ' · ' + p.reviews + ' opiniones</span></div>'
        : '') +
      // "Desde" cuando las variantes (sabores y tamaños) tienen precios
      // distintos: el número es el más bajo, así que sin la palabra sería
      // mentira para las presentaciones grandes. Lo marca el sync de Odoo
      // en VITALICA_PRECIO_DESDE, igual que en las tarjetas del catálogo.
      '<div class="producto__precio" data-precio>' +
        (function (pr) {
          var desde = (p.precio != null && p.precioDesde) ? 'Desde ' : '';
          if (pr.precioAntes == null) return desde + Vitalica.formatearGs(p.precio);
          return desde + Vitalica.formatearGs(pr.precio) +
                 ' <s class="precio-antes">' + Vitalica.formatearGs(pr.precioAntes) + '</s>';
        })(Datos.conPromo(p.precio, p.id)) +
      '</div>' +
      // La nota del precio existe siempre en el HTML y se muestra u oculta
      // según el caso (ver refrescar()). Antes solo se creaba cuando no había
      // precio, y entonces no había dónde avisar que el precio depende de la
      // presentación elegida.
      '<p class="producto__precio-nota"' + (p.precio == null ? '' : ' hidden') + '>' +
        (p.precio == null ? 'Precio a confirmar — consultanos por WhatsApp' : '') +
      '</p>' +
      // Aviso de stock, con el mismo criterio que las tarjetas del catálogo.
      '<div data-stock>' +
        (function (av) {
          return av ? '<p class="stock ' + av.clase + '">' + av.texto + '</p>' : '';
        })(Vitalica.avisoStock(p)) +
      '</div>' +
      '<p class="producto__resumen">' + p.resumen + '</p>' +
      statsHTML + saboresHTML +
      '<div class="producto__compra">' +
        '<div class="selector-cantidad">' +
          '<button type="button" data-menos aria-label="Restar uno">−</button>' +
          '<input type="text" inputmode="numeric" data-cantidad value="1" aria-label="Cantidad">' +
          '<button type="button" data-mas aria-label="Sumar uno">+</button>' +
        '</div>' +
        '<button class="btn btn--primario btn--grande" data-agregar>Agregar al carrito</button>' +
      '</div>' +
      /* La cuenta a la vista: "3 × Gs. 200.000". Existe siempre y arranca
         oculta; refrescar() la muestra solo cuando se lleva más de uno.
         Así queda claro que el número del botón es el total y el de arriba
         es el de una unidad. */
      '<p class="producto__cuenta" data-cuenta hidden></p>' +
      '<a class="btn btn--whatsapp producto__whatsapp" target="_blank" rel="noopener" href="' +
        Vitalica.linkWhatsapp('Hola Vitalica, quiero consultar por ' + p.nombre + '.') +
        '">Consultar por WhatsApp</a>' +
      /* "Más información", con la flecha para abajo.
         ------------------------------------------------------------------
         Pedido de marketing. Debajo del botón de compra la ficha sigue con
         cinco secciones plegadas — cómo se toma, ingredientes, preguntas —
         pero desde arriba no se ve que haya nada más: la página parece
         terminar en el botón.

         La flecha apunta abajo porque eso es literalmente lo que hace:
         lleva a lo que sigue. Y de paso abre la primera sección, así quien
         llega no se encuentra con cinco títulos cerrados y ningún texto. */
      '<button type="button" class="producto__mas-info" data-mas-info>' +
        '<span>Más información</span>' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
             'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="m6 9 6 6 6-6"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

  var input = cont.querySelector('[data-cantidad]');
  function cantidad() { var n = parseInt(input.value, 10); return (isNaN(n) || n < 1) ? 1 : n; }
  /* Los tres avisan a refrescar(). Antes no lo hacían, y por eso el precio
     del botón se quedaba clavado en el de una unidad por más que se
     cambiara la cantidad. */
  function cambiarCantidad(n) {
    input.value = Math.max(1, n);
    refrescar();
  }
  cont.querySelector('[data-menos]').addEventListener('click', function () { cambiarCantidad(cantidad() - 1); });
  cont.querySelector('[data-mas]').addEventListener('click', function () { cambiarCantidad(cantidad() + 1); });
  input.addEventListener('change', function () { cambiarCantidad(cantidad()); });
  input.addEventListener('input',  function () { refrescar(); });
  /* ---- Estado del selector de variante -----------------------------------
     Guardamos qué sabor y qué presentación están elegidos, y de ahí sale la
     variante (el código de barras). Si el producto tiene una sola variante,
     igual la usamos: así el pedido siempre lleva la identidad exacta. */
  var saborSel  = sabores.length  ? sabores[0].nombre : '';
  var tamanoSel = tamanos.length  ? tamanos[0]        : '';

  function varianteActual() {
    if (!variantes.length) return null;
    var v = variantes.find(function (x) {
      return (!saborSel || x.sabor === saborSel) && (!tamanoSel || x.tamano === tamanoSel);
    });
    return v || variantes[0];
  }

  /* El precio unitario de la variante elegida, como número. Lo escribe
     refrescar() al pintar el precio y lo usa el botón para el total. Es null
     cuando el precio que se muestra es un "desde", porque ahí multiplicar
     por la cantidad daría un total que no es el que se va a cobrar. */
  var precioUnitario = null;

  /* La barra fija de celular se arma más abajo, después de la primera
     corrida de refrescar(). Deja acá su función de actualización para que
     refrescar() pueda llamarla sin saber nada de ella. Mientras no exista,
     refrescar() simplemente no la llama. */
  var barraFijaCopiarPrecio = null;

  var elPrecio = cont.querySelector('[data-precio]');
  var elStock  = cont.querySelector('[data-stock]');
  var elNota   = cont.querySelector('.producto__precio-nota');

  /* Repinta precio, stock, foto y qué combinaciones están disponibles. */
  function refrescar() {
    var v = varianteActual();

    /* ---- La foto sigue al sabor elegido ----------------------------------
       Cada variante puede tener su propio packshot (ver VITALICA_VARIANTES en
       data.js). Si el cliente elige Frutilla, ve el envase de frutilla.

       No todas las variantes tienen foto propia: las que faltan caen a la
       imagen general del producto, que es la que estaba antes. Nunca queda un
       hueco, y a medida que lleguen más packshots aparecen solos. */
    var elFoto = cont.querySelector('[data-foto-principal]');
    if (elFoto && v) {
      // No es 'v.imagen || p.imagen': si la variante no tiene foto propia, la
      // genérica del producto es la bolsa de 2270 g, y un sabor de 700 g
      // terminaba mostrando el envase del tamaño equivocado. El helper mete
      // en el medio la foto por tamaño.
      var nueva = Datos.imagenVariante(p.id, v, p.imagen);
      // El src se toca solo si cambió, para no forzar una recarga innecesaria.
      if (elFoto.getAttribute('src') !== nueva) elFoto.setAttribute('src', nueva);
      // El alt, en cambio, se actualiza SIEMPRE: dos variantes pueden compartir
      // la misma foto de respaldo (Vainilla y Vainilla Ice Cream en 2270 g usan
      // las dos el packshot del tamaño), y si el alt viviera dentro del if de
      // arriba se quedaría describiendo la variante anterior.
      var etiqueta = Datos.etiquetaVariante(v);
      elFoto.setAttribute('alt', p.nombre + (etiqueta ? ' — ' + etiqueta : ''));

      /* Cuando la foto que se está mostrando es la de OTRA presentación del
         mismo sabor, se avisa. El envase lleva el peso impreso en la
         etiqueta, así que sin este renglón alguien puede leer "1505 g" en la
         bolsa mientras arriba eligió 700 g y creer que lleva el grande.
         Desaparece solo en cuanto llegue el packshot que falta. */
      // OJO con el nombre: arriba ya hay un `elNota`, que es el aviso del
      // PRECIO. Si esta variable se llamara igual, al declararla con var
      // pisaría a la otra en toda la función y el bloque del precio terminaría
      // escondiendo esta nota en vez de la suya. Pasó exactamente eso.
      var elNotaFoto = cont.querySelector('[data-nota-foto]');
      if (elNotaFoto) {
        var notaFoto = Datos.notaFotoVariante(p.id, v);
        elNotaFoto.textContent = notaFoto;
        elNotaFoto.hidden = !notaFoto;
      }
    }

    /* La tira de miniaturas también sigue al sabor elegido: las fotos están
       indexadas por código de barras, así que son las del envase de ESTA
       variante. Se redibuja entera en vez de ir tocando <img> uno por uno,
       porque la cantidad de fotos cambia de una variante a otra.

       En la primera pasada esto no hace nada — refrescar() corre antes de que
       exista `cajaGaleria` y pintarGaleria() sale por la puerta de atrás. El
       primer dibujo lo hace la llamada que está al final del bloque de la
       galería; de ahí en adelante manda esta línea. */
    if (typeof pintarGaleria === 'function') pintarGaleria(v);

    // --- Precio de la variante elegida ---
    // Si Odoo todavía no publica precios por variante, dejamos el precio
    // "desde" del producto. Nunca mostramos un número inventado.
    if (elPrecio && v) {
      var pv = Datos.precioVariante(v.codigo);
      if (pv != null) {
        // Precio exacto de la variante elegida. Sin "Desde": ya no hay dudas.
        // Si hay promo vigente, se aplica sobre ESTE precio (no sobre el más
        // barato del producto) y se muestra el de lista tachado al lado.
        var conP = Datos.conPromo(pv, p.id);
        precioUnitario = conP.precio;      // el número que se cobra, para el total
        if (conP.precioAntes != null) {
          elPrecio.innerHTML = Vitalica.formatearGs(conP.precio) +
            ' <s class="precio-antes">' + Vitalica.formatearGs(conP.precioAntes) + '</s>';
        } else {
          elPrecio.textContent = Vitalica.formatearGs(pv);
        }
        if (elNota) { elNota.hidden = true; }
      } else {
        var base = Datos.conPromo(p.precio, p.id);
        /* Sin precio por variante, el número de arriba es un "desde": NO se
           puede multiplicar por la cantidad sin mentir. Se deja en null y el
           botón muestra el precio suelto, sin total. */
        precioUnitario = (p.precio != null && !p.precioDesde) ? base.precio : null;
        var desde = (p.precio != null && p.precioDesde) ? 'Desde ' : '';
        elPrecio.innerHTML = base.precioAntes == null
          ? desde + Vitalica.formatearGs(p.precio)
          : desde + Vitalica.formatearGs(base.precio) +
            ' <s class="precio-antes">' + Vitalica.formatearGs(base.precioAntes) + '</s>';
        /* Sin precio por variante no podemos decir cuánto sale ESTA
           presentación. Dejar solo "Desde Gs. X" haría creer que el envase
           grande cuesta lo mismo que el chico, así que lo aclaramos.
           Este aviso desaparece solo en cuanto el sync de Odoo traiga los
           precios por variante. */
        if (elNota) {
          if (p.precio == null) {
            elNota.textContent = 'Precio a confirmar — consultanos por WhatsApp';
            elNota.hidden = false;
          } else if (mostrarTamano) {
            elNota.textContent = 'El precio final depende de la presentación. Te lo confirmamos por WhatsApp.';
            elNota.hidden = false;
          } else {
            elNota.hidden = true;
          }
        }
      }
    }

    /* --- El precio, también adentro del botón ----------------------------
       BPN pone el precio dentro del botón de compra: "ADD TO CART - $41.24".
       La razón es que el botón suele ser lo único que se mira antes de
       hacer clic, y en celular el precio ya quedó fuera de la pantalla.

       Se copia el precio que se acaba de pintar en vez de recalcularlo, así
       no hay forma de que los dos números se contradigan: toda la lógica de
       promos, "Desde" y precio por variante sigue viviendo en un solo lugar.

       El <span> se escribe siempre; que se vea o no lo decide el CSS. */
    var elBoton = cont.querySelector('[data-agregar]');
    if (elBoton && elPrecio) {
      var spanP = elBoton.querySelector('.btn__precio');
      if (!spanP) {
        spanP = document.createElement('span');
        spanP.className = 'btn__precio';
        elBoton.appendChild(spanP);
      }

      /* EL BOTÓN MUESTRA EL TOTAL, NO EL PRECIO DE UNO
         ------------------------------------------------------------------
         Antes copiaba tal cual el número grande de arriba. Con cantidad 1
         daba igual, pero al poner 3 la ficha mostraba "Gs. 200.000" en dos
         lugares distintos y ninguno de los dos era lo que se iba a cobrar.
         No se entendía cuál era el monto de verdad.

         Ahora cada número dice una cosa sola:
           arriba  → cuánto sale UNO
           abajo   → cuánto se agrega al carrito, ya multiplicado

         Y cuando hay más de uno aparece el renglón "3 × Gs. 200.000", que es
         la cuenta a la vista. */
      var cant = cantidad();
      if (precioUnitario != null) {
        spanP.textContent = Vitalica.formatearGs(precioUnitario * cant);
      } else {
        // Precio "desde" o a confirmar: se copia el texto de arriba y no se
        // multiplica nada. El primer nodo es el precio que se cobra (cuando
        // hay promo, adentro de [data-precio] también vive el tachado).
        var primero = elPrecio.firstChild;
        spanP.textContent = primero && primero.nodeType === 3
          ? primero.nodeValue.trim()
          : elPrecio.textContent.trim();
      }

      if (barraFijaCopiarPrecio) barraFijaCopiarPrecio();

      // El renglón de la cuenta, solo si hay más de una unidad.
      var elCuenta = cont.querySelector('[data-cuenta]');
      if (elCuenta) {
        var hayCuenta = (precioUnitario != null && cant > 1);
        elCuenta.textContent = hayCuenta
          ? cant + ' × ' + Vitalica.formatearGs(precioUnitario)
          : '';
        elCuenta.hidden = !hayCuenta;
      }
    }

    // --- Stock de la variante elegida ---
    if (elStock && v) {
      var sv = Datos.stockVariante(v.codigo);
      var av = (sv != null)
        ? Vitalica.avisoStock({ stock: sv })
        : Vitalica.avisoStock(p);
      elStock.innerHTML = av ? '<p class="stock ' + av.clase + '">' + av.texto + '</p>' : '';
    }

    // --- Apagar las presentaciones que no existen para el sabor elegido ---
    var posibles = Datos.tamanosDe(p.id, saborSel);
    cont.querySelectorAll('[data-tipo="tamano"]').forEach(function (b) {
      var existe = posibles.indexOf(b.dataset.valor) !== -1;
      b.disabled = !existe;
      b.title = existe ? '' : 'No disponible en ' + saborSel;
    });

    // --- Marcar los elegidos ---
    cont.querySelectorAll('.variante-chip').forEach(function (b) {
      var elegido = (b.dataset.tipo === 'sabor')  ? (b.dataset.valor === saborSel)
                  : (b.dataset.tipo === 'tamano') ? (b.dataset.valor === tamanoSel)
                  : false;
      b.setAttribute('aria-pressed', elegido ? 'true' : 'false');
    });
  }

  cont.querySelectorAll('.variante-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.disabled) return;
      if (b.dataset.tipo === 'sabor') {
        saborSel = b.dataset.valor;
        // Si la presentación elegida no existe para el sabor nuevo, pasamos
        // a la primera que sí exista, en vez de dejar una combinación falsa.
        var posibles = Datos.tamanosDe(p.id, saborSel);
        if (posibles.indexOf(tamanoSel) === -1 && posibles.length) tamanoSel = posibles[0];
      } else {
        tamanoSel = b.dataset.valor;
      }
      refrescar();
    });
  });

  if (hayOpciones) refrescar();

  function agregarAlCarrito() {
    var v = varianteActual();
    Carrito.agregar(p.id, cantidad(), v ? v.codigo : null);
    if (Vitalica.abrirCarrito) Vitalica.abrirCarrito();
  }
  cont.querySelector('[data-agregar]').addEventListener('click', agregarAlCarrito);

  /* ======================================================================
     BARRA FIJA DE COMPRA (celular)
     ----------------------------------------------------------------------
     Aparece cuando el botón real sale de la pantalla. La ficha es larga
     —beneficios, ingredientes, guía de uso, preguntas frecuentes— y la
     decisión de comprar puede tomarse en cualquier punto de esa lectura.
     Si en ese momento el botón quedó tres pantallas arriba, se pierde.

     Refleja siempre la variante y la cantidad elegidas, y agrega exactamente
     lo mismo que el botón de arriba: comparten la misma función.
     ====================================================================== */
  (function barraFija() {
    var btnReal = cont.querySelector('[data-agregar]');
    if (!btnReal) return;

    var barra = document.createElement('div');
    barra.className = 'compra-fija';
    barra.innerHTML =
      '<span class="compra-fija__info">' +
        '<span class="compra-fija__nombre">' + p.nombre + '</span>' +
        '<span class="compra-fija__precio" data-precio-fijo></span>' +
      '</span>' +
      '<button type="button" class="btn btn--primario" data-agregar-fijo>Agregar</button>';
    document.body.appendChild(barra);
    document.body.classList.add('con-compra-fija');

    var elPrecioFijo = barra.querySelector('[data-precio-fijo]');
    barra.querySelector('[data-agregar-fijo]').addEventListener('click', agregarAlCarrito);

    /* Copia el TOTAL que muestra el botón de arriba, no el precio de una
       unidad. La barra tiene su propio botón "Agregar" y hace exactamente lo
       mismo, así que tiene que decir el mismo número: si arriba dice
       Gs. 600.000 por tres unidades y acá abajo dijera Gs. 200.000, uno de
       los dos está mintiendo.

       Se copia en vez de recalcular para que la cuenta siga viviendo en un
       solo lugar. */
    function copiarPrecio() {
      if (!elPrecioFijo) return;
      var spanP = btnReal.querySelector('.btn__precio');
      if (spanP && spanP.textContent.trim()) {
        elPrecioFijo.textContent = spanP.textContent.trim();
      } else if (elPrecio) {
        elPrecioFijo.innerHTML = elPrecio.innerHTML;
      }
    }
    copiarPrecio();
    barraFijaCopiarPrecio = copiarPrecio;   // refrescar() la vuelve a llamar

    /* IntersectionObserver en vez de escuchar el scroll: el navegador avisa
       solo cuando el botón entra o sale de la vista, sin hacer cuentas en
       cada píxel de desplazamiento. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          barra.classList.toggle('compra-fija--visible', !e.isIntersecting);
        });
      }, { rootMargin: '0px 0px -40px 0px' }).observe(btnReal);
    } else {
      // Navegador viejo: la dejamos siempre visible antes que no mostrarla.
      barra.classList.add('compra-fija--visible');
    }
  })();

  /* ======================================================================
     GALERÍA DE FOTOS
     ----------------------------------------------------------------------
     La ficha mostraba UNA foto. Ahora muestra todas las que hay del envase
     que está elegido: frente, dorso con la tabla nutricional, perfil, 3/4.

     DE DÓNDE SALEN
     Del código de barras, no del producto: VITALICA_GALERIA (data.js) las
     tiene indexadas por código porque son fotos de un envase concreto. La
     bolsa de Frutilla de 700 g no es la de Doble Chocolate de 2270 g, y si
     la galería colgara del producto se verían fotos del sabor equivocado.

     POR ESO SE REDIBUJA AL CAMBIAR DE SABOR
     La función se llama desde refrescar(), que es lo que corre cada vez que
     alguien toca el selector. Antes esto era un IIFE que se ejecutaba una
     sola vez al cargar; con fotos por variante eso ya no alcanza.

     Y PORQUE ESTO YA FALLÓ UNA VEZ: los listeners se ponen UNA sola vez,
     sobre la caja, y no en cada redibujo. Si se agregaran adentro de
     pintarGaleria(), cada cambio de sabor sumaría otro listener sobre el
     mismo elemento y al décimo clic el manejador correría diez veces.
     ====================================================================== */
  var cajaGaleria = cont.querySelector('[data-galeria]');

  function pintarGaleria(v) {
    var foto = cont.querySelector('[data-foto-principal]');
    if (!cajaGaleria || !foto) return;

    // La primera miniatura es siempre el packshot que ya se está mostrando.
    var packshot = v ? Datos.imagenVariante(p.id, v, p.imagen) : p.imagen;
    var extras = v ? Datos.galeria(v.codigo) : [];

    // Si la galería solo tendría el packshot, no hay galería: una tira de
    // una sola miniatura no sirve para nada y ocupa lugar.
    if (!extras.length) {
      cajaGaleria.hidden = true;
      cajaGaleria.innerHTML = '';
      return;
    }

    var fotos = [packshot].concat(extras);
    var etiqueta = v ? Datos.etiquetaVariante(v) : '';
    var nombre = p.nombre + (etiqueta ? ' — ' + etiqueta : '');

    cajaGaleria.innerHTML = fotos.map(function (src, i) {
      return '<button type="button" class="producto__miniatura' +
               (i === 0 ? ' es-activa' : '') + '" ' +
               'data-src="' + src + '" aria-pressed="' + (i === 0) + '">' +
               '<img src="' + src + '" alt="' + nombre + ' — foto ' + (i + 1) + '" ' +
               'loading="lazy" width="120" height="120">' +
             '</button>';
    }).join('');
    cajaGaleria.hidden = false;
  }

  if (cajaGaleria) {
    cajaGaleria.addEventListener('click', function (e) {
      var btn = e.target.closest('.producto__miniatura');
      if (!btn) return;
      var foto = cont.querySelector('[data-foto-principal]');
      if (foto) foto.src = btn.dataset.src;
      cajaGaleria.querySelectorAll('.producto__miniatura').forEach(function (b) {
        b.classList.toggle('es-activa', b === btn);
        b.setAttribute('aria-pressed', b === btn);
      });
    });

    /* Si una foto de la lista no está en el servidor, la miniatura se saca en
       vez de dejar el ícono de imagen rota. El listener va en captura porque
       `error` no burbujea. */
    cajaGaleria.addEventListener('error', function (e) {
      var img = e.target;
      if (img && img.tagName === 'IMG' && img.closest('.producto__miniatura')) {
        img.closest('.producto__miniatura').remove();
      }
    }, true);
  }

  // Primer dibujo. Después lo mantiene al día refrescar().
  pintarGaleria(typeof varianteActual === 'function' ? varianteActual() : null);

  /* ======================================================================
     VISOR DE FOTOS  ·  la imagen en grande, encima de la página
     ----------------------------------------------------------------------
     Pedido: "que se pueda hacer zoom a la imagen, o si se abre en una
     ventana emergente para ver más".

     Se hizo la segunda: un visor que ocupa la pantalla. Es mejor que el
     zoom con lupa por dos motivos concretos de esta tienda:

       · La mitad de las fotos son el DORSO del envase, con la tabla
         nutricional. Eso es letra chica de verdad: con una lupa de 2x sobre
         una foto de 520 px no se lee igual. En el visor la foto se muestra
         a su tamaño real (900 px) y encima se puede acercar más.
       · En celular no hay mouse, así que la lupa al pasar por encima
         directamente no existe. El visor funciona igual en los dos.

     CÓMO SE MANEJA
       · Tocar la foto grande, o cualquier miniatura ya activa, lo abre.
       · Flechas ← → para moverse entre las fotos de esa variante.
       · Clic en la foto (o el botón +) para acercar; otra vez para alejar.
       · Esc, el botón × o un clic en el fondo lo cierran.

     ACCESIBILIDAD: mientras está abierto se bloquea el desplazamiento del
     fondo y el foco vuelve a la foto al cerrarlo, para que quien navega con
     teclado no quede perdido al final de la página.
     ====================================================================== */
  var visor = null;
  var visorFotos = [];
  var visorIndice = 0;

  function fotosDeLaVariante() {
    var v = typeof varianteActual === 'function' ? varianteActual() : null;
    var packshot = v ? Datos.imagenVariante(p.id, v, p.imagen) : p.imagen;
    return [packshot].concat(v ? Datos.galeria(v.codigo) : []);
  }

  function crearVisor() {
    if (visor) return visor;
    visor = document.createElement('div');
    visor.className = 'visor';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Fotos de ' + p.nombre);
    visor.innerHTML =
      '<div class="visor__fondo" data-visor-cerrar></div>' +
      '<div class="visor__caja">' +
        '<img class="visor__foto" alt="" data-visor-foto>' +
      '</div>' +
      '<button type="button" class="visor__btn visor__btn--cerrar" data-visor-cerrar ' +
              'aria-label="Cerrar">&times;</button>' +
      '<button type="button" class="visor__btn visor__btn--antes" data-visor-mover="-1" ' +
              'aria-label="Foto anterior">&#8249;</button>' +
      '<button type="button" class="visor__btn visor__btn--luego" data-visor-mover="1" ' +
              'aria-label="Foto siguiente">&#8250;</button>' +
      '<p class="visor__pie" data-visor-pie></p>';
    document.body.appendChild(visor);

    visor.addEventListener('click', function (e) {
      if (e.target.closest('[data-visor-cerrar]')) { cerrarVisor(); return; }
      var mover = e.target.closest('[data-visor-mover]');
      if (mover) { moverVisor(parseInt(mover.dataset.visorMover, 10)); return; }
      // Clic sobre la foto: acerca y aleja.
      if (e.target.closest('[data-visor-foto]')) visor.classList.toggle('visor--cerca');
    });
    return visor;
  }

  function pintarVisor() {
    var img = visor.querySelector('[data-visor-foto]');
    var pie = visor.querySelector('[data-visor-pie]');
    img.src = visorFotos[visorIndice];
    img.alt = p.nombre + ' — foto ' + (visorIndice + 1) + ' de ' + visorFotos.length;
    // Cada foto arranca sin acercar: si no, al pasar a la siguiente se
    // quedaba en el mismo zoom y se veía un recorte al azar.
    visor.classList.remove('visor--cerca');
    if (pie) pie.textContent = (visorIndice + 1) + ' / ' + visorFotos.length;
    // Con una sola foto, las flechas sobran.
    var solaUna = visorFotos.length < 2;
    visor.querySelectorAll('[data-visor-mover]').forEach(function (b) { b.hidden = solaUna; });
  }

  function moverVisor(paso) {
    if (!visorFotos.length) return;
    // Da la vuelta: de la última pasa a la primera. Llegar al final y que no
    // pase nada se siente como que la página se trabó.
    visorIndice = (visorIndice + paso + visorFotos.length) % visorFotos.length;
    pintarVisor();
  }

  function abrirVisor(src) {
    visorFotos = fotosDeLaVariante();
    if (!visorFotos.length) return;
    var i = visorFotos.indexOf(src);
    visorIndice = i >= 0 ? i : 0;
    crearVisor();
    pintarVisor();
    document.body.classList.add('con-visor');
    requestAnimationFrame(function () { visor.classList.add('visor--abierto'); });
  }

  function cerrarVisor() {
    if (!visor) return;
    visor.classList.remove('visor--abierto', 'visor--cerca');
    document.body.classList.remove('con-visor');
    var foto = cont.querySelector('[data-foto-principal]');
    if (foto) foto.focus({ preventScroll: true });
  }

  (function engancharVisor() {
    var foto = cont.querySelector('[data-foto-principal]');
    if (!foto) return;

    // La foto grande pasa a ser un control: se abre con el mouse y con Enter.
    foto.setAttribute('tabindex', '0');
    foto.setAttribute('role', 'button');
    foto.setAttribute('aria-label', 'Ampliar la foto de ' + p.nombre);
    foto.classList.add('producto__foto--ampliable');

    foto.addEventListener('click', function () { abrirVisor(foto.getAttribute('src')); });
    foto.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirVisor(foto.getAttribute('src')); }
    });

    // Tocar la miniatura que ya está elegida abre el visor en esa foto. La
    // primera vez solo cambia la foto grande, que es lo esperable.
    if (cajaGaleria) {
      cajaGaleria.addEventListener('click', function (e) {
        var btn = e.target.closest('.producto__miniatura');
        if (btn && btn.classList.contains('es-activa')) abrirVisor(btn.dataset.src);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!visor || !visor.classList.contains('visor--abierto')) return;
      if (e.key === 'Escape')     { cerrarVisor(); }
      else if (e.key === 'ArrowLeft')  { moverVisor(-1); }
      else if (e.key === 'ArrowRight') { moverVisor(1); }
    });
  })();

  /* ===== Helpers de render ===== */
  function li(arr) { return arr.map(function (x) { return '<li>' + x + '</li>'; }).join(''); }

  var beneficios = (p.beneficios || []).map(function (b) {
    return '<div class="beneficio-card"><span class="beneficio-card__icono">' + Vitalica.iconoBeneficio(b.icono) +
           '</span><h3>' + b.titulo + '</h3><p>' + b.texto + '</p></div>';
  }).join('');

  var ingredientes = (p.ingredientes || []).map(function (i) {
    return '<div class="ingrediente"><h3>' + i.nombre + '</h3><p>' + i.texto + '</p></div>';
  }).join('');

  // Lo que sí / lo que no
  var siNo = '';
  if ((g.siSirve && g.siSirve.length) || (g.noSirve && g.noSirve.length)) {
    siNo = '<section class="seccion"><div class="contenedor">' +
      '<div class="encabezado-seccion centrado"><p class="eyebrow">Expectativas reales</p><h2>Lo que sí hace (y lo que no)</h2></div>' +
      '<div class="sino-grid">' +
        (g.siSirve ? '<div class="sino sino--si"><h3>Para esto sí sirve</h3><ul>' + li(g.siSirve) + '</ul></div>' : '') +
        (g.noSirve ? '<div class="sino sino--no"><h3>Para esto no</h3><ul>' + li(g.noSirve) + '</ul></div>' : '') +
      '</div></div></section>';
  }

  // Cómo tomarla (reemplaza el "modo de uso" genérico)
  var comoTomar = '';
  if (g.comoTomar) {
    comoTomar = '<section class="seccion seccion--suave"><div class="contenedor guia-uso">' +
      '<div class="encabezado-seccion"><p class="eyebrow">Modo de uso</p><h2>Cómo tomarla</h2></div>' +
      '<p class="guia-uso__dosis">' + g.comoTomar + '</p>' +
      (g.pasos ? '<ol class="guia-pasos">' + li(g.pasos) + '</ol>' : '') +
    '</div></section>';
  }

  // Qué esperar (línea de tiempo)
  var queEsperar = '';
  if (g.queEsperar && g.queEsperar.length) {
    queEsperar = '<section class="seccion"><div class="contenedor">' +
      '<div class="encabezado-seccion centrado"><p class="eyebrow">Resultados reales</p><h2>Qué esperar</h2></div>' +
      '<div class="timeline">' + g.queEsperar.map(function (e) {
        return '<div class="timeline__item"><span class="timeline__etapa">' + e.etapa + '</span><p>' + e.texto + '</p></div>';
      }).join('') + '</div></div></section>';
  }

  // Cuidados
  var cuidados = '';
  if (g.cuidados && g.cuidados.length) {
    cuidados = '<section class="seccion seccion--suave"><div class="contenedor guia-cuidados">' +
      '<div class="encabezado-seccion"><p class="eyebrow">Importante</p><h2>Cuidados</h2></div>' +
      '<ul class="guia-lista">' + li(g.cuidados) + '</ul>' +
    '</div></section>';
  }

  // FAQ (real del producto, o genérica si no hay)
  var faqs = (g.faqs && g.faqs.length) ? g.faqs : [
    { q: '¿Los productos son originales?', a: 'Sí. Vitalica es representante exclusivo de Olimp Sport Nutrition en Paraguay, con garantía oficial.' },
    { q: '¿Hacen envíos?', a: 'Sí, a todo el país: Gran Asunción e interior. El costo se calcula en el checkout.' },
    { q: '¿Me asesoran sobre cómo tomarlo?', a: 'Claro. Escribinos por WhatsApp y te ayudamos según tu objetivo.' }
  ];
  var faqHTML = '<section class="seccion"><div class="contenedor prod-faq">' +
    '<div class="encabezado-seccion centrado"><p class="eyebrow">Preguntas frecuentes</p><h2>Lo que más nos consultan</h2></div>' +
    faqs.map(function (f) { return '<details class="faq-item"><summary>' + f.q + '</summary><p>' + f.a + '</p></details>'; }).join('') +
  '</div></section>';

  /* ======================================================================
     FICHA TÉCNICA EN ACORDEONES
     ----------------------------------------------------------------------
     Acordeón 1 — Ficha técnica: tabla de dato/valor. Las filas vacías no se
                  dibujan, así que se puede ir completando de a poco.
     Acordeón 2 — Información nutricional: tabla por porción.
     Abajo quedan los dos botones que ya estaban (catálogo PDF y WhatsApp).
     ====================================================================== */

  var flecha =
    '<svg class="acordeon__flecha" viewBox="0 0 24 24" width="20" height="20" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  function acordeon(titulo, cuerpo, abierto) {
    if (!cuerpo) return '';
    return '<details class="acordeon"' + (abierto ? ' open' : '') + '>' +
             '<summary class="acordeon__cabecera"><span>' + titulo + '</span>' + flecha + '</summary>' +
             '<div class="acordeon__cuerpo">' + cuerpo + '</div>' +
           '</details>';
  }

  // --- Acordeón 1: especificaciones -------------------------------------
  var sabores = (ficha.sabores || []).map(function (s) { return s.nombre; }).join(' · ');

  var specs = [
    ['Marca',                'Olimp Sport Nutrition'],
    ['Origen',               'Polonia'],
    ['Categoría',            cat ? cat.nombre : ''],
    ['Objetivo',             meta ? meta.nombre : ''],
    ['Formato',              fichaT.formato],
    ['Presentación',         fichaT.presentacion],
    ['Porciones por envase', fichaT.porcionesPorEnvase],
    ['Sabores',              sabores],
    ['Modo de uso',          p.modoDeUso],
    ['Código de artículo',   fichaT.codigo]
  ].filter(function (f) { return f[1]; });   // fuera las filas sin dato

  var specsHTML = specs.length
    ? '<dl class="ficha-specs">' + specs.map(function (f) {
        return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>';
      }).join('') + '</dl>'
    : '';

  // --- Acordeón 2: información nutricional ------------------------------
  var n = fichaT.nutricional;
  var nutriHTML = '';

  if (n && n.filas && n.filas.length) {
    var columnas = n.columnas || ['Cantidad'];

    nutriHTML =
      (n.porcion ? '<p class="ficha-porcion">Porción: <strong>' + n.porcion + '</strong></p>' : '') +
      '<table class="ficha-tabla"><thead><tr><th scope="col">Nutriente</th>' +
      columnas.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      n.filas.map(function (fila) {
        var celdas = '<th scope="row">' + fila[0] + '</th>';
        for (var i = 0; i < columnas.length; i++) {
          celdas += '<td>' + (fila[i + 1] || '—') + '</td>';
        }
        return '<tr>' + celdas + '</tr>';
      }).join('') +
      '</tbody></table>' +
      '<p class="ficha-nota">' + (n.nota ? n.nota + ' ' : '') +
      'Valores de referencia. La información que manda siempre es la de la etiqueta del envase.</p>';
  }

  var acordeones = acordeon('Ficha técnica', specsHTML, true) +
                   acordeon('Información nutricional', nutriHTML, false);

  var fichaHTML = acordeones
    ? '<section class="seccion seccion--suave"><div class="contenedor">' +
        '<div class="ficha-detalle">' +
          '<div class="encabezado-seccion centrado">' +
            '<p class="eyebrow">Detalle</p><h2>Ficha del producto</h2>' +
          '</div>' +
          acordeones +
          '<div class="ficha-acciones" style="justify-content:center">' +
            '<a class="btn btn--contorno" target="_blank" rel="noopener" href="' + Datos.linkCatalogo(p.id) + '">Ver en el catálogo completo</a>' +
            '<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="' +
              Vitalica.linkWhatsapp('Hola Vitalica! Vengo de la web y quiero consultar la disponibilidad y precio de: ' + p.nombre) +
              '">Consultar por este producto</a>' +
          '</div>' +
        '</div>' +
      '</div></section>'
    : '';

  /* ===== FICHA DE USO (fichas-uso.js) =====
     Contenido redactado y aprobado por marketing (Drive: FICHA TÉCNICA DE USO).
     fichas-uso.js lo genera un script; no se edita a mano. Si un producto no
     tiene ficha, esta sección simplemente no aparece.

     OJO: es distinto de VITALICA_GUIAS (data.js), que son las guías cortas de
     la web. Cuando un producto tiene ficha del Drive, más abajo se ocultan los
     bloques cortos que dirían lo mismo. */
  var guiaHTML = '';
  var guia = (typeof VITALICA_FICHAS_USO !== 'undefined') ? VITALICA_FICHAS_USO[p.id] : null;
  if (guia && guia.secciones && guia.secciones.length) {
    var secs = guia.secciones.map(function (sec, i) {
      var bloques = '', enLista = false;
      sec.bloques.forEach(function (b) {
        if (b.tipo === 'vineta') {
          if (!enLista) { bloques += '<ul class="guia__lista">'; enLista = true; }
          // El texto suele venir como "Etiqueta: explicación". Cuando pasa,
          // la etiqueta va en negrita: hace la lista mucho más escaneable.
          var t = b.texto, corte = t.indexOf(': ');
          var cuerpo = (corte > 0 && corte < 60)
            ? '<strong>' + t.slice(0, corte) + '</strong>' + t.slice(corte)
            : t;
          bloques += '<li class="' + (b.aviso ? 'guia__item guia__item--aviso' : 'guia__item') +
                     (b.nivel ? ' guia__item--sub' : '') + '">' + cuerpo + '</li>';
        } else {
          if (enLista) { bloques += '</ul>'; enLista = false; }
          bloques += '<p>' + b.texto + '</p>';
        }
      });
      if (enLista) bloques += '</ul>';

      // La primera va abierta; el resto plegadas, porque son fichas largas
      // y de golpe empujarían todo lo demás fuera de la pantalla.
      return '<details class="guia__seccion"' + (i === 0 ? ' open' : '') + '>' +
               '<summary class="guia__resumen">' + (sec.titulo || 'Sobre el producto') + '</summary>' +
               '<div class="guia__cuerpo">' + bloques + '</div>' +
             '</details>';
    }).join('');

    guiaHTML =
      '<section class="seccion seccion--suave" id="ficha-de-uso" style="scroll-margin-top:110px">' +
        '<div class="contenedor" style="max-width:820px">' +
          '<div class="encabezado-seccion centrado">' +
            '<p class="eyebrow">Ficha de uso</p>' +
            '<h2>Cómo aprovecharlo</h2>' +
            (guia.bajada ? '<p class="guia__bajada">' + guia.bajada + '</p>' : '') +
          '</div>' +
          '<div class="guia">' + secs + '</div>' +
        '</div>' +
      '</section>';
  }

  /* ===== DIFERENCIALES DEL CATÁLOGO =====
     Los cuatro puntos que el catálogo oficial de Vitalica usa para explicar por
     qué este producto no es uno más. Texto aprobado por marketing; sale de
     data-fichas.js -> diferenciales, que carga herramientas/cargar-catalogo.py
     desde las páginas del catálogo (_drive/catalogo/).
     Si un producto no los tiene, la sección no aparece. */
  var difHTML = '';
  if (fichaT.diferenciales && fichaT.diferenciales.length) {
    var tarjetas = fichaT.diferenciales.map(function (d) {
      return '<article class="dif">' +
               '<h3 class="dif__titulo">' + d.titulo + '</h3>' +
               '<p class="dif__texto">' + d.texto + '</p>' +
             '</article>';
    }).join('');
    difHTML =
      '<section class="seccion seccion--suave"><div class="contenedor">' +
        '<div class="encabezado-seccion centrado">' +
          '<p class="eyebrow">Por qué este</p>' +
          '<h2>Lo que lo hace distinto</h2>' +
        '</div>' +
        '<div class="dif-grid">' + tarjetas + '</div>' +
      '</div></section>';
  }

  var marketing =
    '<section class="prod-banda"><div class="contenedor"><span class="prod-banda__txt">' + (p.bandaBeneficio || '') + '</span></div></section>' +
    '<section class="seccion"><div class="contenedor">' +
      '<div class="encabezado-seccion centrado"><p class="eyebrow">Beneficios</p><h2>¿Qué hace por vos?</h2></div>' +
      '<div class="beneficios-grid">' + beneficios + '</div></div></section>' +
    '<section class="seccion seccion--suave"><div class="contenedor prod-sobre">' +
      '<div class="encabezado-seccion centrado"><p class="eyebrow">Sobre el producto</p><h2>' + p.nombre + '</h2></div>' +
      '<p class="prod-sobre__texto">' + p.descripcion + '</p></div></section>' +
    '<section class="seccion"><div class="contenedor">' +
      '<div class="encabezado-seccion centrado"><p class="eyebrow">Fórmula</p><h2>Ingredientes destacados</h2></div>' +
      '<div class="ingredientes-lista">' + ingredientes + '</div></div></section>' +
    difHTML + fichaHTML + guiaHTML +
    // La ficha del Drive ya cubre dosificación, qué esperar y cuidados. Si
    // está, no repetimos los bloques cortos: dos veces lo mismo en la misma
    // página confunde más de lo que ayuda. "Sí sirve / no sirve" y las
    // preguntas frecuentes sí se mantienen, porque la ficha no los trae.
    siNo + (guia ? '' : comoTomar + queEsperar + cuidados) + faqHTML +
    // Banda "Sin Atajos" (CTA)
    '<section class="banda-sinatajos"><div class="contenedor banda-sinatajos__inner">' +
      '<p class="eyebrow" style="color:var(--color-primario)">Sin Atajos</p>' +
      '<h2>Sumalo a tu rutina</h2>' +
      '<p>Los resultados llegan con constancia. Si tenés dudas sobre cómo usarlo para tu objetivo, escribinos y te asesoramos.</p>' +
      '<a class="btn btn--primario btn--grande" target="_blank" rel="noopener" href="' +
        Vitalica.linkWhatsapp('Hola Vitalica, quiero consultar por ' + p.nombre + '.') + '">Consultar por WhatsApp</a>' +
    '</div></section>';

  var mk = document.querySelector('[data-producto-marketing]');
  if (mk) mk.innerHTML = marketing;

  /* ===== Secciones plegadas (solo en el diseño propuesto) ==================
     La ficha tenía hasta trece secciones seguidas, casi todas de texto. Diego
     lo resumió bien: "todo es muy letra acá letra allá".

     BPN resuelve lo mismo plegando: en su ficha, NUTRITION FACTS, HOW TO USE
     e INGREDIENTS son tres renglones que se abren al tocarlos. La página se
     ve corta y la información sigue estando entera.

     Se hace acá y no borrando texto A PROPÓSITO: esos textos vienen del
     catálogo oficial y están marcados como aprobados por marketing. Plegarlos
     no cambia una palabra — solo deja de mostrarlas todas juntas de entrada.

     Solo corre con el tema nuevo puesto: el diseño actual queda igual.
     ======================================================================== */
  if (document.documentElement.getAttribute('data-tema') === '2026' && mk) {
    // Los títulos que se pliegan. El resto de las secciones queda abierto:
    // la banda, "¿Qué hace por vos?" (tres tarjetas con ícono, ya es visual)
    // y la ficha técnica, que ya venía plegada de antes.
    var plegables = ['Sobre el producto', 'Ingredientes destacados',
                     'Lo que lo hace distinto', 'Lo que sí hace (y lo que no)',
                     'Preguntas frecuentes'];

    mk.querySelectorAll('section').forEach(function (sec) {
      var enc = sec.querySelector('.encabezado-seccion');
      var h2  = enc && enc.querySelector('h2');
      var ojo = enc && enc.querySelector('.eyebrow');
      if (!enc || !h2) return;

      /* Se compara contra LOS DOS títulos, el del eyebrow y el del h2.
         No siempre coinciden y cada sección usa uno distinto:
           "Sobre el producto"       → eyebrow, porque el h2 es el nombre
                                       del producto;
           "Ingredientes destacados" → h2, porque el eyebrow dice "Fórmula";
           "Lo que lo hace distinto" → h2, con eyebrow "Por qué este".
         Mirando uno solo se plegaba una de las cuatro. */
      var tOjo = ojo ? ojo.textContent.trim() : '';
      var tH2  = h2.textContent.trim();
      var clave = (plegables.indexOf(tOjo) !== -1) ? tOjo
                : (plegables.indexOf(tH2) !== -1) ? tH2
                : '';
      if (!clave) return;

      var det = document.createElement('details');
      det.className = 'prod-plegable';
      var sum = document.createElement('summary');
      sum.className = 'prod-plegable__titulo';
      sum.textContent = clave;
      det.appendChild(sum);

      // Todo lo que había adentro del contenedor, menos el encabezado.
      var caja = sec.querySelector('.contenedor') || sec;
      enc.remove();
      while (caja.firstChild) det.appendChild(caja.firstChild);
      caja.appendChild(det);
      sec.classList.add('seccion--plegada');
    });
  }

  /* El botón "Más información" de la zona de compra.
     ------------------------------------------------------------------------
     Va acá abajo y no arriba a propósito: los plegables recién existen
     después de este bloque, porque se arman moviendo secciones que ya estaban
     en la página. Enganchado antes, el botón no encontraría nada.

     Si el tema actual no pliega nada (el diseño de siempre no lo hace), el
     botón igual sirve: baja hasta la primera sección de contenido. */
  (function masInfo() {
    var btn = document.querySelector('[data-mas-info]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var primero = document.querySelector('.prod-plegable') ||
                    document.querySelector('.seccion--plegada') ||
                    document.querySelector('main section:nth-of-type(2)');
      if (!primero) return;

      // Si está plegado, se abre. Bajar hasta un título cerrado deja a la
      // persona mirando una lista de títulos y ningún contenido.
      if (primero.tagName === 'DETAILS') primero.open = true;

      primero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  })();

  /* ===== Relacionados (productos que "van juntos" = mismo combo) ===== */
  var wrap = document.querySelector('[data-relacionados-wrap]');
  var contRel = document.querySelector('[data-relacionados]');
  if (contRel) {
    var rel = Datos.relacionados(p.id).slice(0, 4);
    if (rel.length) {
      contRel.innerHTML = rel.map(function (x) { return Vitalica.cardProducto(x); }).join('');
      if (wrap) wrap.hidden = false;
    }
  }
})();
