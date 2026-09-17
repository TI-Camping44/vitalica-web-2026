/* ==========================================================================
   VITALICA — components.js  ·  COMPONENTES Y HELPERS REUTILIZABLES
   --------------------------------------------------------------------------
   Acá vive el objeto global "Vitalica" con:
     • Helpers de formato (precios, cuotas, estrellas, link de WhatsApp)
     • Íconos SVG
     • La card de producto (se usa en home y catálogo)
     • El "chrome" del sitio: barra de anuncios, header con mega-menú,
       footer y botón flotante de WhatsApp.

   IDEA CLAVE (componentes): en vez de copiar el header en las 8 páginas,
   lo definimos UNA vez como una función que devuelve HTML, y main.js lo
   inserta en cada página. Cambiás el menú acá → cambia en todo el sitio.
   En producción esto se hace con "includes" del servidor o componentes de
   un framework; la idea es la misma.
   ========================================================================== */

const Vitalica = {

  /* ====================== HELPERS DE FORMATO ====================== */

  // Formatea un número como guaraníes. null => placeholder "Gs. ——".
  formatearGs: function (n) {
    if (n == null) return 'Gs. ——';
    return 'Gs. ' + Number(n).toLocaleString('es-PY');
  },

  /* ETIQUETA DE UN PRODUCTO ("Nuevo", "Lanzamiento", "-15%"…)
     Devuelve { texto, clase } o null.

     Orden de prioridad, y el porqué:
       1) La PROMO gana sobre todo lo demás. Si algo está con descuento, ese
          es el mensaje más fuerte que se le puede dar a alguien que está
          mirando una grilla de diez productos.
       2) La etiqueta de campaña ("Nuevo", "Lanzamiento"), ya filtrada por
          fecha en Datos.campana().
       3) p.tags, que es como estaba antes. Se conserva para no romper nada
          si alguien lo sigue usando.

     Se centraliza acá para que la tarjeta del catálogo y la ficha de producto
     no puedan mostrar cosas distintas del mismo producto. */
  etiquetaDe: function (p) {
    var c = Datos.campana(p.id);

    if (c.promo) {
      return {
        texto: c.promo.texto || ('-' + c.promo.descuento + '%'),
        clase: 'tag--oferta'
      };
    }

    var txt = c.etiqueta || ((p.tags && p.tags.length) ? p.tags[0] : '');

    /* Sin etiqueta propia, los productos marcados con `destacado` en data.js
       llevan la suya. Es el equivalente del "BEST SELLER" de BPN, que es lo
       primero que se lee en cada tarjeta y lo que ordena la vista.

       Dice "Destacado" y no "Más vendido" a propósito: `destacado` es una
       lista elegida a mano, no un dato de ventas. Para decir "más vendido"
       habría que traer las ventas de Odoo; hasta entonces sería un número
       inventado, y en suplementos eso no se hace.

       Se emite siempre; que se vea o no lo decide el CSS (.tag--destacado). */
    if (!txt && p.destacado) return { texto: 'Destacado', clase: 'tag--destacado' };
    if (!txt) return null;

    var clase = 'tag--nuevo';
    var bajo = txt.toLowerCase();
    if (bajo === 'lanzamiento') clase = 'tag--lanzamiento';
    if (bajo === 'oferta' || bajo === 'promo') clase = 'tag--oferta';
    return { texto: txt, clase: clase };
  },

  /* AVISO DE STOCK
     Devuelve { clase, texto } o null si no hay nada que avisar.
     El stock viene de Odoo (VITALICA_STOCK -> p.stock) y el umbral se
     configura en VITALICA_CONFIG.stockBajo. Devuelve null cuando no hay dato
     de stock, así que si el sync no corrió el sitio no inventa nada. */
  avisoStock: function (p) {
    var umbral = VITALICA_CONFIG.stockBajo;
    if (!umbral || p.stock == null) return null;
    if (p.stock <= 0)      return { clase: 'stock--agotado', texto: 'Sin stock' };
    if (p.stock <= umbral) return { clase: 'stock--bajo', texto: 'Últimas unidades' };
    return null;
  },

  // HTML de estrellas según el rating (técnica de dos capas, ver styles.css).
  estrellas: function (rating) {
    var pct = (rating / 5 * 100).toFixed(1);
    return '<span class="estrellas" style="--pct:' + pct + '%" aria-label="' +
           rating + ' de 5 estrellas"></span>';
  },

  // Arma el link de WhatsApp (wa.me) con el mensaje opcional.
  linkWhatsapp: function (mensaje) {
    var msg = encodeURIComponent(mensaje || VITALICA_CONFIG.whatsapp.mensaje);
    return 'https://wa.me/' + VITALICA_CONFIG.whatsapp.numero + '?text=' + msg;
  },


  /* ====================== ÍCONOS (SVG en línea) ====================== */
  iconos: {
    carrito: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    whatsapp: '<svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16.04 4C9.4 4 4 9.4 4 16.04c0 2.12.55 4.17 1.6 5.99L4 28l6.13-1.6a12 12 0 0 0 5.9 1.5h.01C22.68 27.9 28 22.5 28 15.86 28 9.4 22.68 4 16.04 4Zm0 21.9a10 10 0 0 1-5.1-1.4l-.36-.22-3.64.95.97-3.55-.24-.37a9.9 9.9 0 0 1-1.52-5.3c0-5.5 4.48-9.96 9.99-9.96 2.67 0 5.18 1.04 7.07 2.93a9.9 9.9 0 0 1 2.92 7.04c0 5.5-4.48 9.96-9.99 9.96Zm5.48-7.46c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9h2.8l-.45 2.9h-2.35v7A10 10 0 0 0 22 12Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.7v2.4c-1.2.1-2.4-.2-3.5-.8v6.1c0 3-2.2 5.3-5.1 5.3a5 5 0 0 1-5-5 5 5 0 0 1 6-4.9v2.6a2.4 2.4 0 0 0-1-.2 2.4 2.4 0 1 0 2.4 2.4V3h2.7Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23 12s0-3.1-.4-4.6a2.5 2.5 0 0 0-1.7-1.7C19.4 5.3 12 5.3 12 5.3s-7.4 0-8.9.4A2.5 2.5 0 0 0 1.4 7.4C1 8.9 1 12 1 12s0 3.1.4 4.6a2.5 2.5 0 0 0 1.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.1 23 12 23 12Zm-13 3V9l5 3-5 3Z"/></svg>',
    candado: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  },


  /* LOGO DE UN COMERCIO ALIADO
     Se usa en la home y en "Dónde comprar" (contacto.html): la misma lista,
     mostrada igual en los dos lados.

     Ancho y alto van declarados y NO como max-height. Sin dimensiones el <img>
     mide 0x0 hasta que la imagen carga; el contenedor queda en 0 de alto y,
     como son loading="lazy", el navegador nunca los ve entrar en pantalla y no
     los carga NUNCA. La fila entera quedaba invisible. Declararlos además evita
     que la página salte al terminar de cargar.

     Si el aliado todavía no mandó su logo, se muestra el nombre en texto en vez
     de dejar un hueco. */
  logoAliado: function (t) {
    if (!t.logo) {
      return '<span class="aliados__nombre">' + t.nombre + '</span>';
    }
    var alto = t.altura || 50;
    return '<img class="aliados__logo" src="' + t.logo + '" alt="' + t.nombre + '" ' +
           'width="' + (t.ancho || 150) + '" height="' + alto + '" ' +
           'style="--alto:' + alto + 'px;height:var(--alto)" loading="lazy" ' +
           'onerror="this.style.display=\'none\'">';
  },

  /* ------------------------------------------------------------------
     "5 sabores · 2 presentaciones"
     --------------------------------------------------------------------
     BPN pone en cada tarjeta una línea con las porciones y la cantidad de
     sabores ("Servings - 27 • 8 Flavors"). Es el dato que decide si alguien
     entra a la ficha o sigue de largo, y nosotros lo teníamos escondido
     adentro del producto.

     Sale de VITALICA_VARIANTES contando valores distintos, así que no hay
     nada que mantener a mano: si mañana entra un sabor nuevo, la línea se
     actualiza sola.

     El elemento se emite SIEMPRE; que se vea o no lo decide el CSS. Así el
     diseño actual queda igual que estaba mientras se compara.
     ------------------------------------------------------------------ */
  lineaVariantes: function (id) {
    var vs = (typeof VITALICA_VARIANTES !== 'undefined' && VITALICA_VARIANTES[id]) || [];
    if (!vs.length) return '';

    var sabores = [], tamanos = [];
    vs.forEach(function (v) {
      if (v.sabor  && sabores.indexOf(v.sabor)  === -1) sabores.push(v.sabor);
      if (v.tamano && tamanos.indexOf(v.tamano) === -1) tamanos.push(v.tamano);
    });

    var partes = [];
    // "1 sabor" no aporta nada, y "Sin sabor" menos todavía.
    if (sabores.length > 1) partes.push(sabores.length + ' sabores');
    if (tamanos.length > 1) partes.push(tamanos.length + ' presentaciones');
    if (!partes.length) return '';

    return '<span class="card-producto__variantes">' + partes.join(' · ') + '</span>';
  },

  /* ====================== CARD DE PRODUCTO ====================== */
  cardProducto: function (p) {
    var cat = Datos.categoria(p.categoria);
    var nombresCat = [cat ? cat.nombre : ''];
    (p.categoriasExtra || []).forEach(function (id) {
      var c = Datos.categoria(id); if (c) nombresCat.push(c.nombre);
    });

    var et = this.etiquetaDe(p);
    var etiqueta = et ? et.texto : '';
    var claseTag = et ? et.clase : '';

    var url = 'producto.html?id=' + p.id;

    // La card ENTERA es un solo enlace (estilo BPN): sin botón naranja repetido.
    // El "Ver producto →" es una pista sutil; el naranja fuerte queda reservado
    // para acciones reales (Agregar al carrito).
    return '' +
      // data-destacado deja que el CSS los ponga primero sin tocar el orden
      // en que llegan los datos. Ver la sección 19 de tema-2026.css.
      '<a class="card-producto"' + (p.destacado ? ' data-destacado' : '') +
        ' href="' + url + '">' +
        '<span class="card-producto__media">' +
          (etiqueta ? '<span class="tag ' + claseTag + ' card-producto__tag">' + etiqueta + '</span>' : '') +
          '<img src="' + p.imagen + '" alt="' + p.nombre + '" loading="lazy" width="600" height="600">' +
        '</span>' +
        '<span class="card-producto__body">' +
          '<span class="card-producto__categoria">' + nombresCat.join(' · ') + '</span>' +
          '<span class="card-producto__nombre">' + p.nombre + '</span>' +
          this.lineaVariantes(p.id) +
          // Las estrellas solo se muestran si hay reseñas reales
          // (VITALICA_CONFIG.mostrarRatings en data.js).
          (VITALICA_CONFIG.mostrarRatings
            ? '<span class="card-producto__rating">' + this.estrellas(p.rating) +
              '<span>(' + p.reviews + ')</span></span>'
            : '') +
          '<span class="card-producto__precio">' +
            // "Desde" cuando el producto tiene variantes de distinto precio
            // (ver VITALICA_PRECIO_DESDE, que llena el sync con Odoo).
            // Si hay una promo vigente, el precio de lista se muestra tachado
            // al lado: sin la referencia, un descuento no se percibe.
            (function (pr, self) {
              if (pr.precioAntes == null) {
                return '<span class="precio">' + (p.precioDesde ? 'Desde ' : '') + self.formatearGs(p.precio) + '</span>';
              }
              return '<span class="precio precio--promo">' + (p.precioDesde ? 'Desde ' : '') + self.formatearGs(pr.precio) + '</span>' +
                     '<s class="precio-antes">' + self.formatearGs(pr.precioAntes) + '</s>';
            })(Datos.conPromo(p.precio, p.id), this) +
          '</span>' +
          // Aviso de stock: solo aparece si Odoo dice que queda poco.
          (function (av) {
            return av ? '<span class="stock ' + av.clase + '">' + av.texto + '</span>' : '';
          })(this.avisoStock(p)) +
          '<span class="card-producto__hint">Ver producto <span class="card-producto__flecha" aria-hidden="true">→</span></span>' +
        '</span>' +
      '</a>';
  },

  /* ====================== BUSCADOR (overlay del header) ====================== */
  // Panel que se abre con la lupa: filtra los productos en vivo (main.js).
  buscador: function () {
    return '' +
      '<div class="buscador" data-buscador hidden>' +
        '<div class="buscador__overlay" data-cerrar-busqueda></div>' +
        '<div class="buscador__panel">' +
          '<div class="contenedor">' +
            '<div class="buscador__inner">' +
              this.iconos.buscar +
              '<input type="search" data-buscador-input placeholder="Buscar productos (ej: creatina, omega, pre-entreno)" aria-label="Buscar productos" autocomplete="off">' +
              '<button class="buscador__cerrar" type="button" data-cerrar-busqueda aria-label="Cerrar búsqueda">&times;</button>' +
            '</div>' +
            '<div class="buscador__resultados" data-buscador-resultados></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  },


  /* ====================== CARD DE ARTÍCULO (blog) ====================== */
  cardArticulo: function (a) {
    return '' +
      '<a class="card-articulo" href="' + a.archivo + '">' +
        '<div class="card-articulo__cover acento-' + a.acento + '">' +
          // La foto se emite siempre que exista; el diseño actual no la
          // muestra (ahí la portada de la guía es un bloque de color).
          (a.foto
            ? '<img class="card-articulo__foto" src="' + a.foto + '" alt="" ' +
              'width="900" height="600" loading="lazy">'
            : '') +
          '<span class="card-articulo__tema">' + a.tema + '</span>' +
        '</div>' +
        '<div class="card-articulo__body">' +
          '<h3 class="card-articulo__titulo">' + a.titulo + '</h3>' +
          '<p class="card-articulo__resumen">' + a.resumen + '</p>' +
          '<div class="card-articulo__meta">' +
            '<span>' + a.leeMin + ' min de lectura</span>' +
            '<span class="card-articulo__link">Leer más →</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  },


  /* ====================== BARRA DE ANUNCIOS (rotativa) ====================== */
  barraAnuncios: function () {
    var textos = (VITALICA_CONFIG.anuncios || []).slice();

    /* El envío gratis se anuncia solo.
       -------------------------------------------------------------------
       En BPN, el primero de los dos mensajes que rotan arriba es
       "FREE SHIPPING ON ALL US ORDERS $99+". Tiene sentido: es lo único de
       esa franja que cambia lo que la persona va a poner en el carrito.

       Va PRIMERO en la rotación porque es el que más pesa, y se arma solo
       con VITALICA_CONFIG.envio.gratisDesde — el mismo número que usan el
       checkout y la barra del carrito. Así no puede pasar que el cartel
       diga un monto y el checkout cobre según otro.

       Si gratisDesde es null (hoy lo es), no se agrega nada. */
    var desde = (VITALICA_CONFIG.envio || {}).gratisDesde;
    if (desde) {
      textos.unshift('Envío gratis en compras desde ' + Vitalica.formatearGs(desde));
    }

    var items = textos.map(function (t, i) {
      return '<span class="barra-anuncios__item' + (i === 0 ? ' activo' : '') + '">' + t + '</span>';
    }).join('');
    return '<div class="barra-anuncios"><div class="barra-anuncios__viewport">' + items + '</div></div>';
  },


  /* ====================== HEADER (con mega-menú) ====================== */
  header: function () {
    var marca = VITALICA_CONFIG.marca || {};
    var logo = marca.logoVitalica || 'assets/img/logo-vitalica.png';
    /* OJO CON CUÁL DE LOS DOS ARCHIVOS VA ACÁ
       marca.logoOlimp apunta a logo-olimp.png, que es el logo BLANCO. Sirve
       para el pie, que es negro. En el header del diseño actual, que es
       blanco, ese archivo es invisible — pasó exactamente eso.
       Acá va la versión negra, y el tema 2026 la invierte a blanca con un
       filter, igual que hace con el logo de Vitalica. */
    var logoOlimp = marca.logoOlimpOscuro || 'assets/img/logo-olimp-negro.png';
    var items = (VITALICA_CONFIG.nav || []).map(function (it) {
      if (it.megamenu) {
        return '<li class="nav-principal__item tiene-megamenu">' +
                 '<a class="nav-principal__link" href="' + it.href + '">' + it.label + ' ' + Vitalica.iconos.chevron + '</a>' +
                 Vitalica._megamenu() +
               '</li>';
      }
      return '<li class="nav-principal__item"><a class="nav-principal__link" href="' + it.href + '">' + it.label + '</a></li>';
    }).join('');

    return '' +
      '<header class="header-sitio">' +
        '<div class="contenedor header-sitio__inner">' +
          '<button class="boton-menu" aria-label="Abrir menú" aria-expanded="false">' + this.iconos.menu + '</button>' +
          /* LOS DOS LOGOS, JUNTOS
             Marketing pidió que la web siga mostrando los dos. Van pegados y
             separados por una línea porque juntos dicen lo que ninguno dice
             solo: que Vitalica es el representante de Olimp en Paraguay.
             El de Olimp NO es un enlace a index: lleva a la página de Olimp
             del sitio, que es lo que alguien espera al tocarlo.
             En celular el de Olimp se esconde por CSS (sección 35 del tema). */
          '<div class="header-sitio__marcas">' +
            '<a class="header-sitio__logo" href="index.html" aria-label="Vitalica — inicio">' +
              '<img src="' + logo + '" alt="Vitalica" width="120" height="56">' +
            '</a>' +
            '<a class="header-sitio__olimp" href="sobre.html" aria-label="Olimp Sport Nutrition">' +
              '<img src="' + logoOlimp + '" alt="Olimp Sport Nutrition" width="120" height="40">' +
            '</a>' +
          '</div>' +
          '<nav class="nav-principal" aria-label="Navegación principal">' +
            '<ul class="nav-principal__lista">' + items + '</ul>' +
          '</nav>' +
          '<div class="header-sitio__acciones">' +
            // "Hacé tu pedido": es la acción de conversión, así que va como
            // botón y no como un ítem más del menú. El brief de marketing pide
            // que derive al WhatsApp de CONSUMIDOR FINAL, que es distinto del
            // número general (ver whatsapp.consumidorFinal en data.js).
            // En celular se esconde: ahí ya está el botón flotante de WhatsApp.
            '<a class="btn btn--primario header-sitio__pedido" target="_blank" rel="noopener" href="' +
              ((VITALICA_CONFIG.whatsapp && VITALICA_CONFIG.whatsapp.consumidorFinal) || this.linkWhatsapp()) +
            '">Hacé tu pedido</a>' +
            '<button class="icono-accion" type="button" data-abrir-busqueda aria-label="Buscar productos">' + this.iconos.buscar + '</button>' +
            '<button class="icono-accion boton-carrito" type="button" data-abrir-carrito aria-label="Ver carrito">' +
              this.iconos.carrito +
              '<span class="boton-carrito__badge" data-carrito-badge hidden>0</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>';
  },

  // Panel del mega-menú: lista PLANA de todos los productos (sin clasificar).
  _megamenu: function () {
    var prods = VITALICA_PRODUCTOS.map(function (p) {
      return '<a class="megamenu__link" href="producto.html?id=' + p.id + '">' + p.nombre + '</a>';
    }).join('');

    return '<div class="megamenu">' +
             '<div class="contenedor megamenu__inner">' +
               '<div class="megamenu__lista">' + prods + '</div>' +
               '<a class="megamenu__promo" href="productos.html">' +
                 '<span class="megamenu__promo-eyebrow">Vitalica</span>' +
                 '<span class="megamenu__promo-titulo">Sin Atajos</span>' +
                 '<span class="megamenu__promo-cta">Ver todos los productos →</span>' +
               '</a>' +
             '</div>' +
           '</div>';
  },


  /* ====================== FOOTER ====================== */
  footer: function () {
    var marca = VITALICA_CONFIG.marca || {};
    var cats = VITALICA_METAS.map(function (m) {
      return '<li><a href="productos.html?meta=' + m.id + '">' + m.nombre + '</a></li>';
    }).join('');
    var navLinks = (VITALICA_CONFIG.nav || []).map(function (it) {
      return '<li><a href="' + it.href + '">' + it.label + '</a></li>';
    }).join('');

    return '' +
      '<footer class="footer-sitio">' +
        '<div class="contenedor footer-sitio__top">' +

          '<div class="footer-sitio__marca">' +
            '<img class="footer-sitio__logo" src="' + (marca.logoVitalica || "assets/img/logo-vitalica.png") + '" alt="Vitalica" width="150" height="70">' +
            '<p>Suplementación deportiva con respaldo. Representante exclusivo de Olimp Sport Nutrition en Paraguay.</p>' +
            '<div class="footer-sitio__olimp">' +
              '<span>Representante oficial de</span>' +
              '<img src="' + (marca.logoOlimp || "assets/img/logo-olimp.png") + '" alt="Olimp Sport Nutrition" width="120" height="40">' +
            '</div>' +
          '</div>' +

          '<div class="footer-sitio__col">' +
            '<h4>Comprar</h4><ul>' + cats + '<li><a href="productos.html">Todos los productos</a></li></ul>' +
          '</div>' +

          '<div class="footer-sitio__col">' +
            '<h4>Vitalica</h4><ul>' + navLinks + '</ul>' +
          '</div>' +

          '<div class="footer-sitio__col">' +
            '<h4>Atención al cliente</h4><ul>' +
              '<li><a href="' + this.linkWhatsapp() + '" target="_blank" rel="noopener">WhatsApp</a></li>' +
              '<li><a href="contacto.html">Dónde comprar</a></li>' +
              '<li><a href="contacto.html#envios">Envíos y entregas</a></li>' +
              '<li><a href="contacto.html#cambios">Cambios y devoluciones</a></li>' +
            '</ul>' +
          '</div>' +

        '</div>' +

        '<div class="footer-sitio__bottom">' +
          '<div class="contenedor footer-sitio__bottom-inner">' +
            '<div class="redes">' +
              '<a href="' + VITALICA_CONFIG.redes.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + this.iconos.instagram + '</a>' +
              '<a href="' + VITALICA_CONFIG.redes.tiktok + '" target="_blank" rel="noopener" aria-label="TikTok">' + this.iconos.tiktok + '</a>' +
              '<a href="' + VITALICA_CONFIG.redes.facebook + '" target="_blank" rel="noopener" aria-label="Facebook">' + this.iconos.facebook + '</a>' +
            '</div>' +
            // Sin badges de tarjetas: el pedido se cierra por WhatsApp y el
            // pago se coordina con el asesor. Ponerlos sería prometer algo
            // que el sitio todavía no hace.
            '<div class="footer-sitio__contacto">' +
              '<a href="mailto:' + (VITALICA_CONFIG.email || '') + '">' + (VITALICA_CONFIG.email || '') + '</a>' +
              '<a href="' + this.linkWhatsapp() + '" target="_blank" rel="noopener">' + (VITALICA_CONFIG.whatsapp.numeroVisible || '') + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="contenedor footer-sitio__legal">' +
            // Los legales tienen que ser alcanzables desde cualquier página:
            // es requisito para vender online y lo pide la pasarela de pago.
            '<nav class="footer-sitio__enlaces-legales" aria-label="Información legal">' +
              '<a href="terminos.html">Términos y Condiciones</a>' +
              '<a href="privacidad.html">Política de Privacidad</a>' +
              // Reabre el cartel de cookies (lo maneja analitica.js). Es la vía
              // para cambiar la decisión sin tener que borrar el navegador.
              '<a href="#" data-cookies-abrir>Cookies</a>' +
              '<a href="contacto.html#envios">Envíos</a>' +
              '<a href="contacto.html#cambios">Cambios y devoluciones</a>' +
            '</nav>' +
            '<p>Los suplementos no sustituyen una alimentación equilibrada.</p>' +
            (function (e) {
              // Razón social y RUC solo si están cargados: un footer que dice
              // "RUC —" es peor que un footer que no lo menciona.
              if (!e || !e.razonSocial || !e.ruc) return '';
              return '<p>' + e.razonSocial + ' · RUC ' + e.ruc + '</p>';
            })(VITALICA_CONFIG.empresa) +
            '<p>© 2026 Vitalica · Representante exclusivo de Olimp Sport Nutrition en Paraguay.' +
              /* Acceso al área interna: discreto pero encontrable.
                 No es un secreto —la protección es la contraseña, no que el
                 enlace esté escondido— y sin él hay que acordarse de escribir
                 la dirección a mano cada vez.
                 Para sacarlo, borrá esta línea. */
              ' <a class="footer-sitio__acceso" href="api/acceso.php">Acceso equipo</a>' +
            '</p>' +
          '</div>' +
        '</div>' +
      '</footer>';
  },


  /* ====================== BOTÓN FLOTANTE DE WHATSAPP ====================== */
  botonWhatsapp: function () {
    return '<a class="whatsapp-flotante" href="' + this.linkWhatsapp() + '" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">' +
             this.iconos.whatsapp +
             '<span class="whatsapp-flotante__texto">¿Dudas? Escribinos</span>' +
           '</a>';
  },


  /* ====================== ÍCONOS DE BENEFICIOS (página de producto) ====================== */
  iconosBeneficio: {
    pesa:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></svg>',
    rayo:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    escudo:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    corazon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-9.5-8.5C1 9 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.4 0 5 3.5 3.5 7C19 16.65 12 21 12 21Z"/></svg>',
    cerebro: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/></svg>',
    gota:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7S5 10 5 14a7 7 0 0 0 14 0c0-4-7-11.3-7-11.3Z"/></svg>',
    diana:   '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
    hueso:   '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c1.4 0 2.5-1.1 2.5-2.5S18.4 5 17 5c-1.2 0-1.7.7-2.2 1.2l-6.6 6.6c-.5.5-1 1.2-2.2 1.2C4.6 14 3.5 15.1 3.5 16.5S4.6 19 6 19c1.2 0 1.7-.7 2.2-1.2l6.6-6.6c.5-.5 1-1.2 2.2-1.2Z"/></svg>',
    hoja:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13C4 8 9 4 20 4c0 11-4 16-9 16Z"/><path d="M4 20c4-7 8-9 12-10"/></svg>',
    balanza: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M8 21h8M4 7h16M7 7l-3 6h6l-3-6ZM17 7l-3 6h6l-3-6Z"/></svg>'
  },
  iconoBeneficio: function (clave) {
    return this.iconosBeneficio[clave] || this.iconosBeneficio.escudo;
  },


  /* ====================== CARRITO DRAWER (cáscara; main.js lo llena) ====================== */
  cartDrawer: function () {
    return '<div class="drawer" id="drawer-carrito" hidden>' +
             '<div class="drawer__overlay" data-cerrar-drawer></div>' +
             '<aside class="drawer__panel" role="dialog" aria-modal="true" aria-label="Tu carrito">' +
               '<div class="drawer__head">' +
                 '<h2>Tu carrito</h2>' +
                 '<button class="drawer__cerrar" data-cerrar-drawer aria-label="Cerrar carrito">' + this.iconos.cerrar + '</button>' +
               '</div>' +
               '<div class="drawer__cuerpo" data-drawer-cuerpo></div>' +
             '</aside>' +
           '</div>';
  }

};
