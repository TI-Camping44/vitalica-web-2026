/* ==========================================================================
   VITALICA — main.js  ·  ARRANQUE COMÚN E INTERACCIONES
   --------------------------------------------------------------------------
   Se ejecuta en TODAS las páginas. Su trabajo:
     1) Insertar el chrome (barra de anuncios, header, footer, WhatsApp).
     2) Hacer rotar la barra de anuncios.
     3) Manejar el menú móvil (hamburguesa) y el mega-menú en celular.
     4) Mantener actualizado el contador del carrito.
     5) Marcar el link activo del menú según la página.
     6) Mostrar avisos (toasts) y manejar formularios de demostración.

   Cada página HTML debe tener:
     <div id="chrome-top"></div>   (arriba del <main>)
     <div id="chrome-bottom"></div>(abajo del <main>)
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- 1) Insertar el chrome ---------- */
  function montarChrome() {
    var top = document.getElementById('chrome-top');
    var bottom = document.getElementById('chrome-bottom');
    if (top) top.innerHTML = Vitalica.barraAnuncios() + Vitalica.header();
    if (bottom) bottom.innerHTML = Vitalica.footer();

    // Menú móvil y botón de WhatsApp se agregan al final del body
    document.body.insertAdjacentHTML('beforeend', construirMenuMovil());
    document.body.insertAdjacentHTML('beforeend', Vitalica.cartDrawer());
    document.body.insertAdjacentHTML('beforeend', Vitalica.buscador());
    document.body.insertAdjacentHTML('beforeend', Vitalica.botonWhatsapp());
    vigilarDesplazamientoDelHeader();
    saludarSiHaySesion();
  }


  /* ---------- 1-ter) El nombre en el encabezado ----------
     Le pregunta al servidor quien esta conectado y, si hay alguien, pone su
     nombre al lado del icono de cuenta.

     TRES DECISIONES

     Se pregunta DESPUES de armar el encabezado, no antes. Si esperara la
     respuesta para dibujarlo, cada pagina del sitio tardaria en aparecer lo
     que tarde el servidor, y para el 99% de los visitantes -que no tienen
     cuenta- esa espera no sirve para nada.

     Si falla, no pasa nada. El enlace ya esta puesto y lleva a cuenta.html,
     que sabe resolverse sola. Esto solo agrega el nombre.

     Y falla a proposito en silencio: en un sitio servido sin PHP -GitHub
     Pages, una copia local- la consulta devuelve 404. No es un error que
     nadie tenga que ver. */
  function saludarSiHaySesion() {
    var enlace = document.querySelector('[data-cuenta-enlace]');
    if (!enlace || typeof fetch !== 'function') return;

    fetch('api/cuenta.php?accion=yo', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var c = d && d.ok && d.cliente;
        if (!c) return;

        var span = enlace.querySelector('[data-cuenta-nombre]');
        if (span) {
          span.textContent = String(c.nombre || '').split(' ')[0];
          span.hidden = false;
        }
        enlace.setAttribute('aria-label', 'Mi cuenta, ' + (c.nombre || ''));
        enlace.setAttribute('title', 'Mi cuenta');

        /* Sin telefono no se puede cerrar un pedido, asi que se marca para
           que la pagina de cuenta lo pida apenas entre. */
        if (!c.completo) enlace.classList.add('icono-accion--incompleto');
      })
      .catch(function () { /* sin PHP o sin red: queda el icono y basta */ });
  }


  /* ---------- 1-bis) El header pasa a color al deslizar ----------
     Pedido de marketing: arriba de todo la barra es transparente y se ve el
     hero entero; apenas se baja, se pinta.

     DOS DETALLES QUE IMPORTAN

     1. No todas las páginas empiezan con hero. En el catálogo o en la ficha,
        arriba hay una cabecera con texto: si la barra empieza transparente,
        el menú se superpone al título. Por eso, si no hay hero, la barra
        arranca pintada y se queda así.

     2. El listener va con { passive: true }. Sin eso el navegador tiene que
        esperar a ver si el handler llama a preventDefault() antes de
        desplazar, y el scroll se siente pegajoso en celular. Acá solo se
        lee scrollY y se prende una clase, así que nunca se cancela nada.

     Y el trabajo real se hace en requestAnimationFrame: el evento de scroll
     se dispara decenas de veces por segundo y tocar clases en cada uno hace
     que el navegador recalcule de más. */
  function vigilarDesplazamientoDelHeader() {
    var header = document.querySelector('.header-sitio');
    if (!header) return;

    if (!document.querySelector('.hero')) {
      header.classList.add('header-sitio--siempre-solido');
      return;
    }

    var pedido = false;
    function revisar() {
      pedido = false;
      header.classList.toggle('header-sitio--desplazado', window.scrollY > 40);
    }
    window.addEventListener('scroll', function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(revisar);
    }, { passive: true });

    revisar();   // por si la página se abre ya desplazada (volver atrás, un #ancla)
  }

  // HTML del menú móvil (drawer lateral). En desktop queda oculto por CSS.
  function construirMenuMovil() {
    var marca = VITALICA_CONFIG.marca || {};
    var logo = marca.logoVitalica || 'assets/img/logo-vitalica.png';
    var nav = VITALICA_CONFIG.nav || [];
    var itemMega = nav.find(function (it) { return it.megamenu; }) || { label: 'Productos', href: 'productos.html' };
    var metas = VITALICA_METAS.map(function (m) {
      return '<a href="productos.html?meta=' + m.id + '">' + m.nombre + '</a>';
    }).join('');
    var otros = nav.filter(function (it) { return !it.megamenu; }).map(function (it) {
      return '<a href="' + it.href + '">' + it.label + '</a>';
    }).join('');

    return '' +
      '<div class="menu-movil" id="menu-movil" hidden>' +
        '<div class="menu-movil__overlay" data-cerrar-menu></div>' +
        '<div class="menu-movil__panel">' +
          '<div class="menu-movil__head">' +
            '<img src="' + logo + '" alt="Vitalica" width="110" height="52">' +
            '<button class="menu-movil__cerrar" aria-label="Cerrar menú" data-cerrar-menu>' + Vitalica.iconos.cerrar + '</button>' +
          '</div>' +
          '<nav class="menu-movil__nav" aria-label="Menú móvil">' +
            '<button class="menu-movil__acordeon" aria-expanded="false">' + itemMega.label + ' ' + Vitalica.iconos.chevron + '</button>' +
            '<div class="menu-movil__sub">' + metas + '</div>' +
            '<a href="' + itemMega.href + '" class="menu-movil__link-fuerte">Ver todos los productos</a>' +
            otros +
            '<a class="btn btn--primario btn--bloque" style="margin-top:1rem" href="' + Vitalica.linkWhatsapp() + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a>' +
          '</nav>' +
        '</div>' +
      '</div>';
  }


  /* ---------- 2) Rotación de la barra de anuncios ---------- */
  function iniciarBarraAnuncios() {
    var items = document.querySelectorAll('.barra-anuncios__item');
    if (items.length < 2) return;
    // Respeta "reducir movimiento" del sistema operativo (accesibilidad).
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var i = 0;
    var timer = setInterval(function () {
      items[i].classList.remove('activo');
      i = (i + 1) % items.length;
      items[i].classList.add('activo');
    }, 3500);

    // Pausa al pasar el mouse (detalle de UX)
    var barra = document.querySelector('.barra-anuncios');
    if (barra) {
      barra.addEventListener('mouseenter', function () { clearInterval(timer); });
    }
  }


  /* ---------- 3) Menú móvil ---------- */
  function iniciarMenuMovil() {
    var menu = document.getElementById('menu-movil');
    var abrir = document.querySelector('.boton-menu');
    if (!menu || !abrir) return;

    function abrirMenu() {
      menu.hidden = false;
      // pequeño retardo para que la animación CSS se dispare
      requestAnimationFrame(function () { menu.classList.add('abierto'); });
      document.body.style.overflow = 'hidden';
      abrir.setAttribute('aria-expanded', 'true');
    }
    function cerrarMenu() {
      menu.classList.remove('abierto');
      document.body.style.overflow = '';
      abrir.setAttribute('aria-expanded', 'false');
      setTimeout(function () { menu.hidden = true; }, 250);
    }

    abrir.addEventListener('click', abrirMenu);
    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-menu]')) cerrarMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) cerrarMenu();
    });

    // Acordeón "Catálogo" dentro del menú móvil
    var acordeon = menu.querySelector('.menu-movil__acordeon');
    var sub = menu.querySelector('.menu-movil__sub');
    if (acordeon && sub) {
      acordeon.addEventListener('click', function () {
        var abierto = sub.classList.toggle('abierto');
        acordeon.classList.toggle('abierto', abierto);
        acordeon.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      });
    }
  }


  /* ---------- 4) Contador del carrito ---------- */
  function actualizarBadgeCarrito() {
    var total = Carrito.cantidadTotal();
    document.querySelectorAll('[data-carrito-badge]').forEach(function (badge) {
      badge.textContent = total;
      badge.hidden = total === 0;
    });
  }


  /* ---------- 5) Link activo del menú ---------- */
  function marcarLinkActivo() {
    var archivo = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-principal__link, .menu-movil__nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
      if (href === archivo) a.classList.add('activo');
    });
  }


  /* ---------- 6) Toast (aviso flotante) ---------- */
  // Se expone en Vitalica para que otras páginas lo usen (ej: "agregado al carrito").
  Vitalica.toast = function (mensaje) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = mensaje;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('visible'); });
    setTimeout(function () {
      t.classList.remove('visible');
      setTimeout(function () { t.remove(); }, 300);
    }, 2600);
  };

  // Formularios de demostración (newsletter, contacto): no envían nada real.
  function iniciarFormulariosDemo() {
    document.querySelectorAll('[data-form-demo]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = form.getAttribute('data-form-demo') || '¡Listo! (demostración)';
        form.reset();
        Vitalica.toast(msg);
      });
    });
  }


  /* ---------- 7) Carrito drawer (panel lateral, estilo BPN) ---------- */
  function fmtMonto(v) { return v == null ? 'A confirmar' : Vitalica.formatearGs(v); }

  /* ---- Cuánto falta para el envío gratis ---------------------------------
     Es el recurso más visible de BPN: la franja de arriba dice "FREE SHIPPING
     ON ALL US ORDERS $99+" y el carrito muestra una barra con cuánto falta.

     El motor acá ya existía: checkout.js no cobra envío cuando el subtotal
     llega a VITALICA_CONFIG.envio.gratisDesde. Lo que faltaba era DECÍRSELO al
     cliente mientras arma el pedido, que es el único momento en que le sirve
     para agregar algo más.

     SI gratisDesde ES null —hoy lo es— NO SE DIBUJA NADA. El umbral depende
     del margen y lo tiene que decidir Vitalica; poner un número inventado acá
     sería prometer un envío gratis que después el checkout no cumple.

     Devuelve '' también cuando el subtotal es null (algún precio todavía es
     provisorio): no se puede decir cuánto falta si no se sabe cuánto va. */
  function medidorEnvio(sub) {
    var meta = (VITALICA_CONFIG.envio || {}).gratisDesde;
    if (!meta || sub == null) return '';

    var falta = meta - sub;
    var pct = Math.max(0, Math.min(100, (sub / meta) * 100));
    var logrado = falta <= 0;

    return '<div class="envio-medidor' + (logrado ? ' envio-medidor--logrado' : '') + '">' +
             '<p class="envio-medidor__texto">' +
               (logrado
                 ? '<strong>¡Tenés envío gratis!</strong>'
                 : 'Te faltan <strong>' + Vitalica.formatearGs(falta) + '</strong> para el envío gratis') +
             '</p>' +
             '<div class="envio-medidor__barra" role="progressbar" aria-valuemin="0" ' +
               'aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" ' +
               'aria-label="Progreso hacia el envío gratis">' +
               '<span style="width:' + pct + '%"></span>' +
             '</div>' +
           '</div>';
  }

  // Arma el contenido del drawer (items + upsell + resumen)
  function drawerCuerpoHTML() {
    var items = Carrito.itemsDetallados();

    if (items.length === 0) {
      return '<div class="drawer__vacio">' +
               '<p class="texto-apagado">Tu carrito está vacío.</p>' +
               '<a class="btn btn--primario btn--bloque" href="productos.html" data-cerrar-drawer>Ver productos</a>' +
             '</div>';
    }

    var filas = items.map(function (it) {
      var p = it.producto;
      // data-variante identifica la línea: dos sabores del mismo producto son
      // dos líneas distintas y cada una tiene sus propios botones.
      return '<div class="drawer-item" data-id="' + p.id + '" data-variante="' + (it.variante || '') + '">' +
        '<a class="drawer-item__media" href="producto.html?id=' + p.id + '"><img src="' + p.imagen + '" alt="' + p.nombre + '"></a>' +
        '<div class="drawer-item__info">' +
          '<a class="drawer-item__nombre" href="producto.html?id=' + p.id + '">' + p.nombre + '</a>' +
          (it.varianteTexto ? '<span class="drawer-item__variante">' + it.varianteTexto + '</span>' : '') +
          '<span class="drawer-item__precio">' + Vitalica.formatearGs(it.precioUnitario) + '</span>' +
          '<div class="selector-cantidad selector-cantidad--sm">' +
            '<button type="button" data-menos aria-label="Restar">−</button>' +
            '<input type="text" value="' + it.cantidad + '" readonly aria-label="Cantidad">' +
            '<button type="button" data-mas aria-label="Sumar">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="drawer-item__quitar" data-quitar aria-label="Quitar ' + p.nombre + '">' + Vitalica.iconos.cerrar + '</button>' +
      '</div>';
    }).join('');

    // Upsell: productos que "van juntos" (mismo combo) con lo que hay en el carrito,
    // que todavía no estén agregados.
    var enCarrito = {};
    Carrito.obtener().forEach(function (i) { enCarrito[i.id] = 1; });
    var idsSugeridos = {};
    Carrito.obtener().forEach(function (i) {
      (Datos.relacionados(i.id) || []).forEach(function (p) {
        if (!enCarrito[p.id]) idsSugeridos[p.id] = 1;
      });
    });
    var sugeridos = Object.keys(idsSugeridos).map(function (id) { return Datos.producto(id); }).filter(Boolean).slice(0, 3);
    // Respaldo: si no hubo coincidencias de combo, sugerimos cualquier otro
    if (!sugeridos.length) {
      sugeridos = VITALICA_PRODUCTOS.filter(function (p) { return !enCarrito[p.id]; }).slice(0, 3);
    }
    var upsell = '';
    if (sugeridos.length) {
      upsell = '<div class="drawer-upsell"><h3>Sumá a tu pedido</h3>' +
        sugeridos.map(function (p) {
          return '<div class="upsell-item">' +
            '<img src="' + p.imagen + '" alt="' + p.nombre + '">' +
            '<span class="upsell-item__nombre">' + p.nombre + '</span>' +
            // El texto dice la verdad de lo que va a pasar: si hay sabores o
            // tamaños para elegir, el botón lleva a la ficha, no agrega.
            (function (n) {
              return '<button class="upsell-item__add" type="button" data-agregar-upsell="' + p.id + '">' +
                     (n > 1 ? 'Elegir' : '+ Agregar') + '</button>';
            })((typeof Datos !== 'undefined' && Datos.variantes) ? Datos.variantes(p.id).length : 0) +
          '</div>';
        }).join('') +
      '</div>';
    }

    var sub = Carrito.subtotal();
    var footer = '<div class="drawer__footer">' +
      '<div class="resumen-linea"><span>Subtotal</span><span>' + fmtMonto(sub) + '</span></div>' +
      '<p class="drawer__nota">Envío e impuestos se calculan en el checkout.</p>' +
      '<a class="btn btn--primario btn--bloque btn--grande" href="checkout.html">Continuar con mi pedido</a>' +
      '<a class="btn btn--contorno btn--bloque" href="carrito.html">Ver carrito</a>' +
    '</div>';

    // El medidor va arriba de todo: es lo que decide si el cliente suma algo
    // más, y abajo del listado ya sería tarde.
    return medidorEnvio(sub) +
           '<div class="drawer__items">' + filas + '</div>' + upsell + footer;
  }

  function renderDrawer() {
    var cuerpo = document.querySelector('[data-drawer-cuerpo]');
    if (cuerpo) cuerpo.innerHTML = drawerCuerpoHTML();
  }

  function abrirCarrito() {
    var drawer = document.getElementById('drawer-carrito');
    if (!drawer) return;
    renderDrawer();
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('abierto'); });
    document.body.style.overflow = 'hidden';
  }
  function cerrarCarrito() {
    var drawer = document.getElementById('drawer-carrito');
    if (!drawer) return;
    drawer.classList.remove('abierto');
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; }, 250);
  }
  // Exponemos abrir para que otras páginas (producto) abran el drawer al agregar
  Vitalica.abrirCarrito = abrirCarrito;

  function iniciarDrawer() {
    var drawer = document.getElementById('drawer-carrito');
    if (!drawer) return;

    // El ícono del carrito del header abre el drawer
    document.querySelectorAll('[data-abrir-carrito]').forEach(function (b) {
      b.addEventListener('click', abrirCarrito);
    });

    // Delegación de clics dentro del drawer
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-drawer]')) { cerrarCarrito(); return; }

      /* Sugeridos del carrito.
         Un producto con UNA sola presentación se agrega directo. Uno con
         varias NO: la creatina viene en 250 g y en 550 g, y cuestan
         200.000 y 390.000. Elegir por el cliente sería inventarle casi el
         doble de precio, y además el pedido llegaría a Odoo sin saber cuál
         de las dos preparar. En ese caso lo llevamos a la ficha a elegir. */
      var addUp = e.target.closest('[data-agregar-upsell]');
      if (addUp) {
        var idUp = addUp.getAttribute('data-agregar-upsell');
        var varsUp = (typeof Datos !== 'undefined' && Datos.variantes) ? Datos.variantes(idUp) : [];
        if (varsUp.length === 1) {
          Carrito.agregar(idUp, 1, varsUp[0].codigo);
        } else if (varsUp.length > 1) {
          window.location.href = 'producto.html?id=' + idUp;
        } else {
          Carrito.agregar(idUp, 1);   // producto sin variantes cargadas
        }
        return;
      }

      var row = e.target.closest('.drawer-item');
      if (row) {
        var id = row.dataset.id;
        var variante = row.dataset.variante || null;
        var item = Carrito.obtener().find(function (i) {
          return i.id === id && (i.variante || null) === variante;
        });
        var c = item ? item.cantidad : 1;
        if (e.target.closest('[data-mas]')) Carrito.actualizarCantidad(id, c + 1, variante);
        else if (e.target.closest('[data-menos]')) Carrito.actualizarCantidad(id, c - 1, variante);
        else if (e.target.closest('[data-quitar]')) Carrito.quitar(id, variante);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) cerrarCarrito();
    });
  }


  /* ---------- Arranque ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    montarChrome();
    iniciarBarraAnuncios();
    iniciarMenuMovil();
    iniciarDrawer();
    actualizarBadgeCarrito();
    marcarLinkActivo();
    iniciarFormulariosDemo();
  });

  // El carrito avisa cuando cambia → actualizamos contador y drawer en vivo.
  window.addEventListener('carrito:cambio', function () {
    actualizarBadgeCarrito();
    renderDrawer();
  });


  /* ---------- 8) Buscador en vivo (overlay de la lupa) ----------
     Filtra los productos de data.js al escribir: nombre, categoría, tags y
     resumen, ignorando mayúsculas y acentes ("creatina" encuentra "Creatine"). */
  function normalizar(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function abrirBusqueda() {
    var b = document.querySelector('[data-buscador]');
    if (!b) return;
    b.hidden = false;
    requestAnimationFrame(function () { b.classList.add('abierto'); });
    var inp = b.querySelector('[data-buscador-input]');
    if (inp) { inp.value = ''; inp.focus(); }
    renderResultadosBusqueda('');
  }

  function cerrarBusqueda() {
    var b = document.querySelector('[data-buscador]');
    if (!b || b.hidden) return;
    b.classList.remove('abierto');
    b.hidden = true;
  }

  function renderResultadosBusqueda(q) {
    var cont = document.querySelector('[data-buscador-resultados]');
    if (!cont) return;
    var nq = normalizar(q).trim();

    /* CAMPO VACÍO: atajos en vez de un cartel.
       Decía "Escribí para buscar entre nuestros 10 productos" y no llevaba a
       ninguna parte. Con seis atajos, quien no sabe qué escribir igual entra
       al catálogo por donde le sirve. */
    if (!nq) {
      cont.innerHTML =
        '<p class="buscador__ayuda">Buscá por producto, por objetivo o por síntoma. ' +
          'Por ejemplo:</p>' +
        '<div class="buscador__atajos">' +
          Datos.busquedasSugeridas().map(function (t) {
            return '<button type="button" class="buscador__atajo" data-atajo="' + t + '">' +
                     t + '</button>';
          }).join('') +
        '</div>';
      return;
    }

    /* La búsqueda vive en Datos.buscar() (data.js): entiende sinónimos
       ("isotónica" → Iso Plus), no se traba con los guiones ("preentreno"
       encuentra "pre-entreno") y ordena por dónde coincide. */
    var lista = Datos.buscar(q, 6);

    /* Las guías de uso también entran en los resultados: mucha gente busca
       "cómo tomar creatina", y esa respuesta está en un artículo, no en un
       envase. Van al final y marcadas, para que nadie las confunda con algo
       que se compra. */
    var guias = Datos.buscarGuias(q, 2);

    if (!lista.length && !guias.length) {
      cont.innerHTML = '<p class="buscador__ayuda">Sin resultados para &ldquo;' + q +
        '&rdquo;. <a href="productos.html">Ver todos los productos</a></p>';
      return;
    }

    cont.innerHTML =
      lista.map(function (p) {
        return '<a class="buscador__item" href="producto.html?id=' + p.id + '">' +
                 '<img src="' + p.imagen + '" alt="">' +
                 '<span class="buscador__item-info">' +
                   '<span class="buscador__item-nombre">' + p.nombre + '</span>' +
                   '<span class="buscador__item-precio">' + Vitalica.formatearGs(p.precio) + '</span>' +
                 '</span>' +
               '</a>';
      }).join('') +
      guias.map(function (a) {
        return '<a class="buscador__item buscador__item--guia" href="' + a.archivo + '">' +
                 (a.foto ? '<img src="' + a.foto + '" alt="">' : '<span class="buscador__item-icono"></span>') +
                 '<span class="buscador__item-info">' +
                   '<span class="buscador__item-nombre">' + a.titulo + '</span>' +
                   '<span class="buscador__item-precio">Guía de uso · ' + a.leeMin + ' min</span>' +
                 '</span>' +
               '</a>';
      }).join('') +
      '<a class="buscador__todos" href="productos.html">Ver todos los productos &rarr;</a>';
  }

  document.addEventListener('click', function (e) {
    /* Los atajos del campo vacío: escriben el texto y buscan, en vez de
       llevar directo a un resultado. Así queda a la vista qué se buscó y se
       puede seguir editando desde ahí. */
    var atajo = e.target.closest('[data-atajo]');
    if (atajo) {
      var campo = document.querySelector('[data-buscador-input]');
      if (campo) {
        campo.value = atajo.dataset.atajo;
        campo.focus();
        renderResultadosBusqueda(campo.value);
      }
      return;
    }
    if (e.target.closest('[data-abrir-busqueda]')) abrirBusqueda();
    else if (e.target.closest('[data-cerrar-busqueda]')) cerrarBusqueda();
  });
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[data-buscador-input]')) {
      renderResultadosBusqueda(e.target.value);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarBusqueda();
    // Enter en el buscador = ir al primer resultado
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-buscador-input]')) {
      var primero = document.querySelector('[data-buscador-resultados] .buscador__item');
      if (primero) window.location.href = primero.getAttribute('href');
    }
  });

})();


/* ==========================================================================
   PANTALLA DE CARGA — progreso de 0 a 100
   --------------------------------------------------------------------------
   El header, el carrusel y las grillas los arma JavaScript. Hasta que
   terminan, la página se ve vacía y después salta. Esta capa tapa ese momento
   y muestra cuánto falta.

   EL PORCENTAJE ES REAL, NO UN RELOJ
   Sube según lo que de verdad se cargó: el HTML, los scripts, y cada imagen
   que va llegando. Una barra que siempre tarda tres segundos es una mentira
   cara: le agrega tres segundos a todo el mundo, incluso a quien ya tenía el
   sitio en caché y podría haberlo visto al instante.

   DOS LÍMITES
   • Mínimo 900 ms. Sin esto, en una conexión rápida el número salta de 0 a
     100 en un parpadeo y no se ve nada: peor que no poner nada.
   • Máximo 3 s. Si una imagen tarda muchísimo, no vale la pena seguir
     tapando el sitio: se muestra igual y la foto entra cuando llegue.

   El número nunca baja ni retrocede: siempre avanza hacia el objetivo real.
   Ver un porcentaje que retrocede da la sensación de que algo se rompió.

   (styles.css además desvanece la capa a los 5 s por si este archivo nunca
   llegara a ejecutarse.)
   ========================================================================== */
(function () {
  var capa = document.querySelector('[data-cargando]');
  if (!capa) return;

  var relleno = capa.querySelector('[data-relleno]');
  var texto   = capa.querySelector('[data-pct]');

  var MINIMO = 900;    // ms que la pantalla se muestra como mínimo
  var TECHO  = 3000;   // ms tras los cuales se muestra el sitio igual
  var arranque = Date.now();

  var objetivo = 0.05;   // progreso real (0 a 1)
  var mostrado = 0;      // el que se ve, persiguiendo al objetivo
  var terminado = false;

  /* ---- Señales de progreso real ---- */
  function medirImagenes() {
    var imgs = document.images;
    if (!imgs.length) return 1;
    var listas = 0;
    for (var i = 0; i < imgs.length; i++) if (imgs[i].complete) listas++;
    return listas / imgs.length;
  }

  function recalcular() {
    // El HTML parseado vale 30%; las imágenes, el 60% restante.
    var base = (document.readyState === 'loading') ? 0.05 : 0.30;
    var img  = medirImagenes() * 0.60;
    var nuevo = base + img;
    if (document.readyState === 'complete') nuevo = 1;
    if (nuevo > objetivo) objetivo = nuevo;   // nunca retrocede
  }

  document.addEventListener('DOMContentLoaded', recalcular);
  window.addEventListener('load', recalcular);
  var vigilante = setInterval(recalcular, 120);

  /* ---- Dibujo: el número persigue al objetivo con suavidad ---- */
  function pintar() {
    if (terminado) return;

    var transcurrido = Date.now() - arranque;

    // Se acerca al objetivo un 12% de la distancia por cuadro: arranca rápido
    // y desacelera al final, que es como se percibe algo que "va llegando".
    mostrado += (objetivo - mostrado) * 0.12;

    // No llega a 100 antes del mínimo, aunque ya esté todo cargado.
    var tope = transcurrido < MINIMO ? (transcurrido / MINIMO) * 0.97 : 1;
    if (mostrado > tope) mostrado = tope;

    var pct = Math.min(100, Math.round(mostrado * 100));
    if (relleno) relleno.style.width = pct + '%';
    if (texto) texto.textContent = pct + '%';

    var listo = (objetivo >= 1 && pct >= 100 && transcurrido >= MINIMO);
    if (listo || transcurrido >= TECHO) { completar(); return; }

    requestAnimationFrame(pintar);
  }

  function completar() {
    if (terminado) return;
    terminado = true;
    clearInterval(vigilante);

    if (relleno) relleno.style.width = '100%';
    if (texto) texto.textContent = '100%';

    // Un respiro en 100 antes de abrir: si desaparece en el mismo instante
    // en que llega, el ojo no alcanza a registrar que completó.
    setTimeout(function () {
      capa.classList.add('cargando--listo');
      // Se saca del DOM al terminar la transición: con opacidad 0 seguiría
      // tapando los clics de toda la página.
      setTimeout(function () {
        if (capa.parentNode) capa.parentNode.removeChild(capa);
      }, 340);
    }, 180);
  }

  recalcular();
  requestAnimationFrame(pintar);

  // Red de seguridad que NO depende de requestAnimationFrame.
  //
  // El techo de 3 s se comprueba adentro de pintar(), y pintar() solo se
  // vuelve a llamar cuando el navegador entrega un cuadro. Si deja de
  // entregarlos —pestaña en segundo plano, equipo muy cargado, o una captura
  // automatizada— pintar() no corre nunca más y la pantalla de carga se
  // queda puesta tapando el sitio entero. Pasó justo eso al fotografiar el
  // home: quedó la barra en 100% y nada más.
  //
  // setTimeout sí corre igual en todos esos casos.
  setTimeout(completar, TECHO + 200);
})();
