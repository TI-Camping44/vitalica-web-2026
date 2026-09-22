/* ==========================================================================
   VITALICA — pages/home.js  ·  PARTES DINÁMICAS DEL HOME
   --------------------------------------------------------------------------
   Rellena cuatro bloques del index.html leyendo data.js:
     • [data-hero]      → carrusel de 3 slides (con autoplay, flechas y puntos)
     • [data-metas]     → tarjetas "¿Qué querés lograr?" (3 objetivos)
     • [data-productos] → grilla con toda la línea de productos
     • [data-articulos] → tarjetas del blog
   ========================================================================== */
(function () {

  /* ---------- HERO: carrusel ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero && typeof VITALICA_HERO !== 'undefined') {

    // 1) Armamos el HTML de los slides.
    //    modo 'banner'  → la imagen cubre TODO el rectángulo (con velo oscuro para leer el texto)
    //    modo 'producto' → foto del envase flotando a la derecha (layout clásico)
    // Si la imagen del slide viene de un cambio guardado en admin.html y ese
    // archivo ya no existe, la portada queda rota sin ninguna pista de por qué.
    // Marcamos cuál era la de fábrica; más abajo se engancha el respaldo.
    function respaldo(s) {
      if (!s.imagenPorDefecto || s.imagenPorDefecto === s.imagen) return '';
      return ' data-por-defecto="' + s.imagenPorDefecto + '"';
    }

    var slides = VITALICA_HERO.map(function (s, i) {
      var esBanner = (s.modo === 'banner');
      return '<div class="hero__slide hero__slide--' + (i + 1) + (esBanner ? ' hero__slide--banner' : '') + '">' +
               /* `foco` dice qué parte de la foto no se puede perder al
                  recortar. El CSS trae un 78% 42% que sirve para la mayoría
                  —sujeto a la derecha, aire a la izquierda para el titular—
                  pero no para todas: en la portada del gimnasio la cara está
                  al 63% y con el 78% el recorte caía en el hombro.
                  Cada slide puede pisarlo desde data.js sin tocar el CSS. */
               /* VIDEO DE FONDO, si el slide trae uno.
                  ------------------------------------------------------------
                  La FOTO sigue estando siempre, como poster del video. No es
                  un detalle: mientras el video carga se ve la foto, si el
                  video falla se ve la foto, y si el visitante pidio "reducir
                  movimiento" tambien. La portada nunca queda en blanco
                  esperando megabytes.

                  muted y playsinline no son opcionales: sin los dos, ningun
                  navegador de celular arranca un video solo. Y con sonido
                  seria peor que no ponerlo.

                  preload="none": el video NO se descarga hasta que hace
                  falta. Lo enciende el carrusel cuando ese slide esta a la
                  vista. Sin esto, todos los visitantes se bajan el video
                  aunque nunca lleguen a verlo. */
               (esBanner && s.video
                 ? '<video class="hero__cover hero__video" data-hero-video ' +
                       'muted playsinline loop preload="none" ' +
                       'poster="' + s.imagen + '" ' +
                       (s.foco ? 'style="object-position:' + s.foco + '" ' : '') +
                       'aria-hidden="true" tabindex="-1">' +
                     '<source src="' + s.video + '" type="video/mp4">' +
                   '</video>'
                 : '') +
               (esBanner
                 ? '<img class="hero__cover" src="' + s.imagen + '" alt=""' +
                   (s.foco ? ' style="object-position:' + s.foco + '"' : '') +
                   (s.video ? ' data-tapado-por-video' : '') +
                   respaldo(s) + '>'
                 : '') +
               '<div class="contenedor hero__inner">' +
                 '<div class="hero__contenido">' +
                   '<p class="hero__eyebrow">' + s.eyebrow + '</p>' +
                   '<h1 class="hero__titulo">' + s.titulo + '</h1>' +
                   '<p class="hero__texto">' + s.texto + '</p>' +
                   '<div class="hero__acciones">' +
                     '<a href="' + s.cta1.href + '" class="btn btn--primario btn--grande">' + s.cta1.texto + '</a>' +
                     (s.cta2 ? '<a href="' + s.cta2.href + '" class="btn btn--claro btn--grande">' + s.cta2.texto + '</a>' : '') +
                   '</div>' +
                 '</div>' +
                 (esBanner ? '' : '<div class="hero__media"><img src="' + s.imagen + '" alt="" width="700" height="700"></div>') +
               '</div>' +
             '</div>';
    }).join('');

    // 2) Puntos indicadores (uno por slide)
    var puntos = VITALICA_HERO.map(function (_, i) {
      return '<button class="hero__dot' + (i === 0 ? ' activo' : '') + '" data-ir="' + i + '" aria-label="Ir al slide ' + (i + 1) + '"></button>';
    }).join('');

    hero.innerHTML =
      '<div class="hero__track">' + slides + '</div>' +
      '<button class="hero__flecha hero__flecha--prev" aria-label="Anterior">&#8249;</button>' +
      '<button class="hero__flecha hero__flecha--next" aria-label="Siguiente">&#8250;</button>' +
      '<div class="hero__dots">' + puntos + '</div>';

    // Respaldo de la portada: si la imagen guardada desde admin.html no carga,
    // volvemos a la de fábrica en vez de dejar el hueco. Va como listener y no
    // como atributo onerror porque el HTML se arma concatenando cadenas y las
    // comillas anidadas ahí adentro son un problema esperando a pasar.
    hero.querySelectorAll('.hero__cover[data-por-defecto]').forEach(function (img) {
      img.addEventListener('error', function () {
        var dePorDefecto = img.getAttribute('data-por-defecto');
        if (img.getAttribute('src') === dePorDefecto) return;  // ya falló el respaldo: cortamos
        console.warn('Hero: no cargó ' + img.getAttribute('src') +
                     ' (viene de un cambio guardado en admin.html). Uso ' + dePorDefecto + '.');
        img.setAttribute('src', dePorDefecto);
      });
    });

    // 3) Lógica del carrusel
    var track = hero.querySelector('.hero__track');
    var dots = hero.querySelectorAll('.hero__dot');
    var total = VITALICA_HERO.length;
    var actual = 0;
    var timer;

    /* ------------------------------------------------------------------
       LOS VIDEOS DEL HERO

       Solo toca el del slide que se esta viendo. Los demas quedan quietos y
       sin descargar: un video detenido pero descargado ya le costo los
       megabytes al visitante.

       NO SE REPRODUCE NADA si:

         · El sistema pide "reducir movimiento". Hay gente a la que el
           movimiento en pantalla le da mareo, y el sistema operativo ya
           tiene una casilla donde lo dijo.
         · El navegador avisa que la conexion es cara o lenta (saveData,
           2g, 3g). Bajarle 4 MB a alguien que paga por megabyte para
           adornar una portada no esta bien.

       En cualquiera de esos casos queda la foto, que es el poster del
       video, y nadie nota que falta nada.
       ------------------------------------------------------------------ */
    var videos = hero.querySelectorAll('[data-hero-video]');

    function videosPermitidos() {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      } catch (e) {}
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c) {
        if (c.saveData) return false;
        if (/(^|-)(2g|3g)$/.test(String(c.effectiveType || ''))) return false;
      }
      return true;
    }

    var conVideo = videosPermitidos();

    function acomodarVideos() {
      if (!conVideo || !videos.length) return;

      for (var i = 0; i < videos.length; i++) {
        var v = videos[i];
        var suyo = v.closest('.hero__slide');
        var esteEsElQueSeVe = suyo && suyo === hero.querySelectorAll('.hero__slide')[actual];

        if (esteEsElQueSeVe) {
          /* preload="none" en el HTML significa que ni el primer byte se
             pidio. load() es lo que arranca la descarga, y recien acá. */
          if (!v.dataset.arrancado) { v.dataset.arrancado = '1'; v.load(); }
          var promesa = v.play();
          /* Si el navegador se niega igual -pasa en algunos con ahorro de
             bateria- no se hace nada: queda el poster. */
          if (promesa && promesa.catch) promesa.catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      }
    }

    function ir(i) {
      actual = (i + total) % total;
      track.style.transform = 'translateX(-' + (actual * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('activo', di === actual); });
      acomodarVideos();
    }

    /* Con la pestaña en segundo plano no tiene sentido seguir decodificando
       video: gasta bateria para nadie. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        for (var i = 0; i < videos.length; i++) videos[i].pause();
      } else {
        acomodarVideos();
      }
    });

    acomodarVideos();
    function reiniciarAutoplay() {
      clearInterval(timer);
      timer = setInterval(function () { ir(actual + 1); }, 6000);
    }

    hero.querySelector('.hero__flecha--next').addEventListener('click', function () { ir(actual + 1); reiniciarAutoplay(); });
    hero.querySelector('.hero__flecha--prev').addEventListener('click', function () { ir(actual - 1); reiniciarAutoplay(); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { ir(parseInt(d.dataset.ir, 10)); reiniciarAutoplay(); });
    });
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', reiniciarAutoplay);

    reiniciarAutoplay();
  }

  /* ---------- METAS ("¿Qué querés lograr?") ---------- */
  var contMetas = document.querySelector('[data-metas]');
  if (contMetas) {
    contMetas.innerHTML = VITALICA_METAS.map(function (m) {
      /* La foto va como <img> y no como background-image para que el
         navegador la trate como imagen de verdad: la puede diferir con
         loading="lazy" y la sirve del tamaño que corresponde. El velo oscuro
         y el texto encima los pone el CSS.
         Se emite siempre; en el diseño actual el CSS no la muestra, porque
         ahí cada mosaico tiene su degradado de color. */
      return '<a class="categoria-card" href="productos.html?meta=' + m.id + '">' +
               (m.foto
                 ? '<img class="categoria-card__foto" src="' + m.foto + '" alt="" ' +
                   'width="900" height="600" loading="lazy">'
                 : '') +
               /* El envoltorio existe siempre. En el diseño actual es
                  `display: contents`, o sea que no cambia nada: los tres
                  <span> siguen siendo hijos directos de la tarjeta. En el
                  2026 se convierte en la placa de vidrio sobre la foto. */
               '<span class="categoria-card__texto">' +
                 '<span class="categoria-card__nombre">' + (m.accion || m.nombre) + '</span>' +
                 '<span class="categoria-card__desc">' + m.descripcion + '</span>' +
                 '<span class="categoria-card__cta">Ver productos →</span>' +
               '</span>' +
             '</a>';
    }).join('');
  }

  /* ---------- PRODUCTOS (toda la línea) ---------- */
  var contProductos = document.querySelector('[data-productos]');
  if (contProductos) {
    contProductos.innerHTML = VITALICA_PRODUCTOS.map(function (p) {
      return Vitalica.cardProducto(p);
    }).join('');
  }

  /* ---------- BLOG ---------- */
  var contArticulos = document.querySelector('[data-articulos]');
  if (contArticulos) {
    contArticulos.innerHTML = VITALICA_ARTICULOS.map(function (a) {
      return Vitalica.cardArticulo(a);
    }).join('');
  }

  /* ---------- COMUNIDAD / INSTAGRAM ("Sumate a la comunidad") ----------
     Posteos simulados que enlazan al perfil real. En producción, IT conecta
     el feed verdadero de Instagram (ver HANDOFF-IT.md). */
  var contIg = document.querySelector('[data-instagram]');
  if (contIg && VITALICA_CONFIG.comunidad) {
    var com = VITALICA_CONFIG.comunidad;
    var urlIg = (VITALICA_CONFIG.redes && VITALICA_CONFIG.redes.instagram) || '#';

    /* Feed REAL de Instagram vía Curator.io (el mismo que ya corre en
       vitalica.com.py). Si 'curatorId' está vacío, más abajo cae a la
       grilla de imágenes simuladas. */
    if (com.curatorId) {
      contIg.className = 'ig-embed';
      contIg.innerHTML = '<div id="curator-feed-default-feed-layout">' +
        '<a href="https://curator.io" target="_blank" rel="noopener" class="crt-logo crt-tag">Powered by Curator.io</a></div>';
      var s = document.createElement('script');
      s.async = true;
      s.charset = 'UTF-8';
      s.src = 'https://cdn.curator.io/published/' + com.curatorId + '.js';
      document.head.appendChild(s);
    } else {
    contIg.innerHTML = (com.posts || []).filter(Boolean).map(function (src) {
      return '<a class="ig-tile" href="' + urlIg + '" target="_blank" rel="noopener" aria-label="Ver publicación en Instagram">' +
               '<img src="' + src + '" alt="Publicación de Instagram de Vitalica" loading="lazy">' +
               '<span class="ig-tile__overlay">' + Vitalica.iconos.instagram + '</span>' +
             '</a>';
    }).join('');
    }
    var handleEl = document.querySelector('[data-ig-handle]');
    if (handleEl) handleEl.textContent = com.handle || '@vitalica.py';
    var linkEl = document.querySelector('[data-ig-link]');
    if (linkEl) {
      linkEl.href = urlIg;
      linkEl.textContent = 'Seguir a ' + (com.handle || '@vitalica.py');
    }
  }

  /* ---------- EMBAJADORES Y NUTRICIONISTAS ----------
     Sin biografías a propósito: ver el comentario en data.js.

     DOS COLUMNAS, PERO SOLO SI HAY DOS GRUPOS
     -----------------------------------------
     Marketing pidió la sección partida en dos: embajadores de un lado,
     nutricionistas del otro. El reparto lo decide el campo `rol` de cada
     persona en data.js.

     Si uno de los dos grupos está vacío —que es la situación de hoy, porque
     la planilla de contratos no trae la profesión de nadie— se dibuja la
     grilla de siempre, entera. Una columna vacía al lado de otra llena se
     lee como un error de maquetado, no como "esto todavía no está cargado".
     En cuanto alguien tenga rol 'nutricionista', las dos columnas salen
     solas sin tocar una línea de acá. */
  var contEmb = document.querySelector('[data-embajadores]');
  if (contEmb && VITALICA_CONFIG.embajadores) {
    var em = VITALICA_CONFIG.embajadores;
    var todos = em.gente || [];

    function figuraEmbajador(g) {
      /* Sin foto se dibuja una placa con las iniciales en vez de un <img>
         roto. No es un adorno: es el aviso de que falta esa foto, y se va
         solo en cuanto se carga la ruta en data.js. */
      var medio = g.foto
        ? '<img class="embajador__foto" src="' + g.foto + '" alt="' + g.nombre + '" ' +
               'width="700" height="700" loading="lazy">'
        : '<span class="embajador__foto embajador__foto--falta" aria-hidden="true">' +
            g.nombre.split(' ').map(function (p) { return p.charAt(0); })
                    .join('').slice(0, 2).toUpperCase() +
          '</span>';

      return '<figure class="embajador">' +
               medio +
               '<figcaption class="embajador__nombre">' + g.nombre + '</figcaption>' +
               (g.disciplina
                 ? '<p class="embajador__disciplina">' + g.disciplina + '</p>' : '') +
               (g.instagram
                 ? '<a class="embajador__ig" href="https://instagram.com/' +
                   g.instagram.replace('@', '') + '" target="_blank" rel="noopener">@' +
                   g.instagram.replace('@', '') + '</a>' : '') +
             '</figure>';
    }

    function grupo(rol) {
      return todos.filter(function (g) {
        // Quien no tenga rol cargado cuenta como embajador: es lo que era
        // antes de que existiera el campo.
        return (g.rol || 'embajador') === rol;
      });
    }

    var embajadores   = grupo('embajador');
    var nutricionistas = grupo('nutricionista');
    var cols = em.columnas || {};
    var cuerpo;

    /* LAS DOS COLUMNAS SE DIBUJAN SIEMPRE.
       -----------------------------------------------------------------
       El primer intento las mostraba solo si los dos grupos tenían gente,
       para no dejar un hueco. El resultado fue que la sección quedó
       exactamente igual que antes y el cambio pedido no se veía por
       ninguna parte.

       Un hueco vacío se lee como un error; un hueco CON UNA LÍNEA QUE
       EXPLICA se lee como una sección en construcción, que es la verdad.
       Así que la columna vacía muestra su texto de espera y listo. */
    cuerpo =
      '<div class="embajadores__columnas">' +
        [['embajador', embajadores], ['nutricionista', nutricionistas]].map(function (par) {
          var meta = cols[par[0]] || {};
          var gente = par[1];
          return '<div class="embajadores__columna">' +
                   '<h3 class="embajadores__columna-titulo">' +
                     (meta.titulo || par[0]) + '</h3>' +
                   (meta.texto
                     ? '<p class="embajadores__columna-texto">' + meta.texto + '</p>' : '') +
                   (gente.length
                     ? '<div class="embajadores__grid">' +
                         gente.map(figuraEmbajador).join('') +
                       '</div>'
                     : '<p class="embajadores__vacio">' +
                         (meta.vacio || 'Todavía no hay nadie cargado en este grupo.') +
                       '</p>') +
                 '</div>';
        }).join('') +
      '</div>';

    contEmb.innerHTML =
      '<div class="contenedor">' +
        '<div class="encabezado-seccion centrado">' +
          '<p class="eyebrow">' + (em.eyebrow || 'Olimp Team') + '</p>' +
          '<h2>' + em.titulo + '</h2>' +
          '<p class="embajadores__intro">' + em.texto + '</p>' +
        '</div>' +
        cuerpo +
      '</div>';
  }

  /* ---------- CIENCIA REAL: los tres pilares de Olimp ----------
     Textos e íconos salen de VITALICA_CONFIG.ciencia (data.js), que a su vez
     viene del brief de marketing. */
  var contCiencia = document.querySelector('[data-ciencia]');
  if (contCiencia && VITALICA_CONFIG.ciencia) {
    var ci = VITALICA_CONFIG.ciencia;
    var pilares = (ci.pilares || []).map(function (pl) {
      return '<article class="pilar">' +
               // Sin width/height fijos: cada ícono tiene su propia proporción
               // (uno es vertical y dos son logotipos apaisados). El CSS les da
               // alto común y deja el ancho libre.
               // La foto real del laboratorio o de la planta. Se emite
               // siempre que exista; en el diseño actual el CSS la esconde y
               // deja el ícono gris, como estaba.
               (pl.foto
                 ? '<img class="pilar__foto" src="' + pl.foto + '" alt="" ' +
                   'width="700" height="500" loading="lazy">'
                 : '') +
               '<img class="pilar__icono" src="' + pl.icono + '" alt="" loading="lazy">' +
               '<h3 class="pilar__titulo">' + pl.titulo + '</h3>' +
               '<p class="pilar__texto">' + pl.texto + '</p>' +
             '</article>';
    }).join('');

    /* VIDEO VERTICAL DE LA PLANTA
       ------------------------------------------------------------------
       Va aca y no en el hero por una razon de formato: la pieza que mando
       Olimp es 1080x1920, hecha para Instagram. En el hero, que es una
       banda ancha, se perderia el 72% del cuadro y quedaria una franja sin
       sentido. Aca se muestra completa, con la forma que le corresponde.

       Y ademas es donde corresponde por contenido: el video es de la planta
       de Olimp y esta seccion habla justamente de como fabrican.

       Mismas reglas que el hero: no se descarga hasta que se ve, no arranca
       con "reducir movimiento" ni con datos limitados, y la imagen de
       respaldo es el poster. */
    var video = (ci.video || '').trim();

    contCiencia.innerHTML =
      '<div class="contenedor">' +
        '<div class="encabezado-seccion centrado">' +
          '<p class="eyebrow">' + (ci.eyebrow || 'Respaldo') + '</p>' +
          '<h2>' + ci.titulo + '</h2>' +
          '<p class="ciencia__intro">' + ci.texto + '</p>' +
        '</div>' +
        (video
          ? '<div class="ciencia-con-video">' +
              '<figure class="ciencia-video">' +
                '<video data-ciencia-video muted playsinline loop preload="none" ' +
                       'poster="' + (ci.videoPoster || '') + '" aria-hidden="true" tabindex="-1">' +
                  '<source src="' + video + '" type="video/mp4">' +
                '</video>' +
              '</figure>' +
              '<div class="pilares-grid pilares-grid--angosta">' + pilares + '</div>' +
            '</div>'
          : '<div class="pilares-grid">' + pilares + '</div>') +
      '</div>';

    /* Se enciende cuando entra en pantalla, no antes. Un video que se
       descarga al abrir la pagina le cuesta megabytes a todo el mundo,
       incluida la mayoria que nunca baja hasta aca. */
    var vid = contCiencia.querySelector('[data-ciencia-video]');
    if (vid) {
      var permitido = true;
      try { permitido = !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      var con = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (con && (con.saveData || /(^|-)(2g|3g)$/.test(String(con.effectiveType || '')))) permitido = false;

      if (permitido && 'IntersectionObserver' in window) {
        var ojo = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) {
              if (!vid.dataset.arrancado) { vid.dataset.arrancado = '1'; vid.load(); }
              var pr = vid.play();
              if (pr && pr.catch) pr.catch(function () {});
            } else if (!vid.paused) {
              vid.pause();
            }
          });
        }, { threshold: 0.35 });
        ojo.observe(vid);
      }
    }
  }

  /* ---------- ALIADOS COMERCIALES ----------
     Logos de los locales donde se consigue la línea Olimp. Cada uno lleva su
     propia altura (vienen con proporciones muy distintas entre sí). */
  var contAliados = document.querySelector('[data-aliados]');
  if (contAliados && typeof VITALICA_TIENDAS !== 'undefined') {
    contAliados.innerHTML = VITALICA_TIENDAS.map(function (t) { return Vitalica.logoAliado(t); }).join('');
    var al = VITALICA_CONFIG.aliados || {};
    var tit = document.querySelector('[data-aliados-titulo]');
    if (tit && al.titulo) tit.textContent = al.titulo;
    var txt = document.querySelector('[data-aliados-texto]');
    if (txt && al.texto) txt.textContent = al.texto;
  }

})();
