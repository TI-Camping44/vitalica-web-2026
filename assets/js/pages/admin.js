/* ==========================================================================
   VITALICA — pages/admin.js  ·  PANEL DE ADMINISTRADOR (mini-CMS, demo)
   --------------------------------------------------------------------------
   Permite cambiar imágenes, enlaces y textos de toda la maqueta. Cómo funciona:
   • Los cambios se guardan en localStorage['vitalica_overrides'].
   • data.js, al cargar, aplica esos overrides sobre los valores por defecto,
     así TODAS las páginas reflejan los cambios (en este navegador).
   • Exportar/Importar mueven esa configuración como archivo JSON.

   ⚠️ Es una MAQUETA sin backend: la clave es demostrativa y los cambios viven
   en este navegador / en el JSON exportado. La persistencia real para todos
   los visitantes la construye IT con un CMS/backend (ver HANDOFF-IT).
   ========================================================================== */
(function () {
  'use strict';

  var CLAVE_DEMO = 'vitalica2026';
  var app = document.querySelector('[data-admin-app]');
  if (!app) return;

  /* ---------- Utilidades ---------- */
  function v(x) { return x == null ? '' : String(x); }
  function escAttr(s) {
    return v(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escTxt(s) {
    return v(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // Crea/recorre rutas tipo "config.hero.0.cta1.texto" dentro de un objeto.
  function setPath(root, path, value) {
    var parts = path.split('.');
    var cur = root;
    for (var i = 0; i < parts.length - 1; i++) {
      var key = parts[i];
      var nextIsIndex = /^\d+$/.test(parts[i + 1]);
      if (cur[key] == null) cur[key] = nextIsIndex ? [] : {};
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('visible'); });
    setTimeout(function () { t.classList.remove('visible'); setTimeout(function () { t.remove(); }, 300); }, 2800);
  }

  /* ---------- Builders de campos ---------- */
  function fTexto(label, path, val, hint) {
    return '<label class="admin-campo"><span class="admin-campo__label">' + label + '</span>' +
      '<input type="text" data-ov="' + path + '" value="' + escAttr(val) + '">' +
      (hint ? '<span class="admin-hint">' + hint + '</span>' : '') + '</label>';
  }
  // Muestra un monto en guaraníes (375000 -> "375.000"); vacío si no hay valor.
  function gsMostrar(val) {
    var d = v(val).replace(/[^\d]/g, '');
    return d === '' ? '' : Number(d).toLocaleString('es-PY');
  }
  // Campo de monto en GUARANÍES. Usa type="text" (no "number") para aceptar "375.000"
  // o "375000" sin que el "." se tome como decimal, y para que la rueda del mouse no
  // cambie el valor. Al guardar nos quedamos solo con los dígitos (ver recolectar()).
  /* Lista desplegable. 'opciones' es un array de { valor, texto }. */
  function fSelect(label, path, val, opciones, hint) {
    return '<label class="admin-campo"><span class="admin-campo__label">' + label + '</span>' +
      '<select data-ov="' + path + '">' +
        opciones.map(function (o) {
          return '<option value="' + escAttr(o.valor) + '"' +
                 (String(val || '') === String(o.valor) ? ' selected' : '') + '>' +
                 escTxt(o.texto) + '</option>';
        }).join('') +
      '</select>' +
      (hint ? '<span class="admin-hint">' + hint + '</span>' : '') + '</label>';
  }

  /* Fecha. Usa el selector nativo del navegador: escribir fechas a mano es
     la fuente número uno de campañas que nunca arrancan. */
  function fFecha(label, path, val, hint) {
    return '<label class="admin-campo"><span class="admin-campo__label">' + label + '</span>' +
      '<input type="date" data-ov="' + path + '" value="' + escAttr(val || '') + '">' +
      (hint ? '<span class="admin-hint">' + hint + '</span>' : '') + '</label>';
  }

  function fNum(label, path, val, hint) {
    return '<label class="admin-campo"><span class="admin-campo__label">' + label + '</span>' +
      '<input type="text" inputmode="numeric" data-ov="' + path + '" data-num="gs" value="' + escAttr(gsMostrar(val)) + '">' +
      (hint ? '<span class="admin-hint">' + hint + '</span>' : '') + '</label>';
  }
  function fArea(label, path, val, hint, list) {
    return '<label class="admin-campo"><span class="admin-campo__label">' + label + '</span>' +
      '<textarea data-ov="' + path + '"' + (list ? ' data-list="lines"' : '') + ' rows="3">' + escTxt(val) + '</textarea>' +
      (hint ? '<span class="admin-hint">' + hint + '</span>' : '') + '</label>';
  }
  function fEnlace(label, pathT, pathH, t, h) {
    return '<div class="admin-enlace"><span class="admin-campo__label">' + label + '</span>' +
      '<div class="admin-enlace__row">' +
        '<input type="text" data-ov="' + pathT + '" value="' + escAttr(t) + '" placeholder="Texto (lo que dice)">' +
        '<input type="text" data-ov="' + pathH + '" value="' + escAttr(h) + '" placeholder="Destino (página o URL)">' +
      '</div>' +
      '<span class="admin-hint">Texto = lo que se ve · Destino = página interna (ej. <code>productos.html</code>) o URL externa (https://…)</span>' +
    '</div>';
  }
  function fImg(label, path, val, hint) {
    var id = 'im_' + path.replace(/[^a-z0-9]/gi, '_');
    return '<div class="admin-campo admin-img"><span class="admin-campo__label">' + label + '</span>' +
      '<div class="admin-img__row">' +
        '<img class="admin-img__preview" src="' + escAttr(val) + '" alt="" data-prev="' + id + '">' +
        '<div class="admin-img__ctrl">' +
          '<input type="file" accept="image/*" class="admin-file" data-file="' + id + '">' +
          '<span class="admin-hint">' + hint + '</span>' +
        '</div>' +
      '</div>' +
      '<input type="hidden" id="' + id + '" data-ov="' + path + '" value="' + escAttr(val) + '">' +
    '</div>';
  }
  function seccion(titulo, contenido, abierta) {
    return '<details class="admin-sec"' + (abierta ? ' open' : '') + '>' +
      '<summary>' + titulo + '</summary><div class="admin-sec__body">' + contenido + '</div></details>';
  }
  function filaTienda(t) {
    t = t || {};
    // Ya no se pide la dirección: el sitio muestra el logo del comercio, no
    // dónde queda (ver assets/js/pages/contacto.js). El logo tampoco se edita
    // acá porque es un archivo, no un texto: va en assets/img/aliados/ y se
    // enlaza desde VITALICA_TIENDAS en data.js.
    return '<div class="admin-tienda">' +
      '<input type="text" class="t-nombre" value="' + escAttr(t.nombre) + '" placeholder="Nombre del comercio">' +
      '<input type="text" class="t-ciudad" value="' + escAttr(t.ciudad) + '" placeholder="Ciudad (opcional)">' +
      '<input type="hidden" class="t-logo" value="' + escAttr(t.logo) + '">' +
      '<span class="admin-tienda__logo">' + (t.logo ? '🖼️ con logo' : '— sin logo') + '</span>' +
      '<button type="button" class="admin-tienda__del" data-del-tienda aria-label="Quitar comercio">✕</button>' +
    '</div>';
  }

  /* ---------- Render del panel ---------- */
  function renderPanel() {
    var C = VITALICA_CONFIG, marca = C.marca || {}, wa = C.whatsapp || {}, redes = C.redes || {}, envio = C.envio || {};

    var secciones = '';

    // Marca / logos
    secciones += seccion('🖼️ Marca / Logos',
      fImg('Logo Vitalica', 'config.marca.logoVitalica', marca.logoVitalica, 'PNG con fondo transparente · ~600×160 px') +
      fImg('Logo Olimp (va en el footer oscuro)', 'config.marca.logoOlimp', marca.logoOlimp, 'PNG blanco con fondo transparente · ~400×120 px'),
      true);

    // Menú
    var navHTML = (C.nav || []).map(function (it, i) {
      return '<div class="admin-grupo">' +
        fEnlace('Ítem ' + (i + 1), 'config.nav.' + i + '.label', 'config.nav.' + i + '.href', it.label, it.href) +
        (it.megamenu ? '<input type="hidden" data-ov="config.nav.' + i + '.megamenu" value="true">' : '') +
      '</div>';
    }).join('');
    secciones += seccion('🧭 Menú (navegación)', navHTML);

    // Hero
    var heroHTML = (typeof VITALICA_HERO !== 'undefined' ? VITALICA_HERO : []).map(function (s, i) {
      var esBanner = (s.modo === 'banner');
      return '<div class="admin-grupo"><h3 class="admin-grupo__t">Slide ' + (i + 1) + '</h3>' +
        fTexto('Eyebrow (texto chico de arriba)', 'hero.' + i + '.eyebrow', s.eyebrow) +
        fArea('Título (podés usar &lt;br&gt; para cortar la línea)', 'hero.' + i + '.titulo', s.titulo) +
        fArea('Texto', 'hero.' + i + '.texto', s.texto) +
        '<label class="admin-campo"><span class="admin-campo__label">Modo de la imagen</span>' +
          '<select data-ov="hero.' + i + '.modo">' +
            '<option value="producto"' + (esBanner ? '' : ' selected') + '>Producto flotante (foto del envase sobre el fondo azul)</option>' +
            '<option value="banner"' + (esBanner ? ' selected' : '') + '>Banner completo (la imagen cubre todo el rectángulo)</option>' +
          '</select>' +
          '<span class="admin-hint">«Banner completo» hace que la imagen llene todo el slide (se recorta para cubrir, sin deformarse).</span>' +
        '</label>' +
        fImg('Imagen del slide', 'hero.' + i + '.imagen', s.imagen,
          'Producto flotante: ~800×800 px, fondo transparente · Banner completo: ~1920×760 px, JPG/WebP &lt;500 KB') +
        fEnlace('Botón 1', 'hero.' + i + '.cta1.texto', 'hero.' + i + '.cta1.href', s.cta1 && s.cta1.texto, s.cta1 && s.cta1.href) +
        fEnlace('Botón 2', 'hero.' + i + '.cta2.texto', 'hero.' + i + '.cta2.href', s.cta2 && s.cta2.texto, s.cta2 && s.cta2.href) +
      '</div>';
    }).join('');
    secciones += seccion('🎞️ Hero (carrusel principal)', heroHTML);

    // Comunidad / Instagram (sección "Sumate a la comunidad" del home)
    var comu = C.comunidad || { handle: '@vitalica.py', posts: [] };
    var comuHTML = fTexto('Usuario que se muestra', 'config.comunidad.handle', comu.handle,
      'Ej: @vitalica.py — el botón y los posteos enlazan a la URL de Instagram cargada en «Redes sociales».');
    for (var ci = 0; ci < 6; ci++) {
      comuHTML += fImg('Post ' + (ci + 1), 'config.comunidad.posts.' + ci,
        (comu.posts && comu.posts[ci]) || '',
        'Cuadrada · 1080×1080 px (como un post de Instagram) · JPG/WebP &lt;300 KB');
    }
    secciones += seccion('📸 Comunidad / Instagram (home)', comuHTML);

    // Anuncios
    secciones += seccion('📢 Barra de anuncios',
      fArea('Mensajes (uno por línea)', 'config.anuncios', (C.anuncios || []).join('\n'),
        'Cada línea es un mensaje que rota en la barra de arriba.', true));

    // WhatsApp
    secciones += seccion('💬 WhatsApp',
      fTexto('Número (solo dígitos, formato internacional)', 'config.whatsapp.numero', wa.numero, 'Ej: 595976383922 (sin + ni espacios)') +
      fTexto('Número visible', 'config.whatsapp.numeroVisible', wa.numeroVisible) +
      fArea('Mensaje pre-cargado', 'config.whatsapp.mensaje', wa.mensaje));

    // Redes
    secciones += seccion('🔗 Redes sociales',
      fTexto('Instagram (URL)', 'config.redes.instagram', redes.instagram, 'URL completa de tu perfil') +
      fTexto('TikTok (URL)', 'config.redes.tiktok', redes.tiktok) +
      fTexto('Facebook (URL)', 'config.redes.facebook', redes.facebook));

    // Envíos
    secciones += seccion('🚚 Costos de envío (Gs.)',
      fNum('Gran Asunción', 'config.envio.granAsuncion', envio.granAsuncion, 'Monto en guaraníes (ej. 25000).') +
      fNum('Interior', 'config.envio.interior', envio.interior, 'Monto en guaraníes (ej. 40000).'));

    // Productos
    var prodHTML = VITALICA_PRODUCTOS.map(function (p) {
      return '<div class="admin-grupo"><h3 class="admin-grupo__t">' + escTxt(p.nombre) + '</h3>' +
        fTexto('Nombre', 'productos.' + p.id + '.nombre', p.nombre) +
        fNum('Precio (Gs.) — vacío = "a confirmar"', 'productos.' + p.id + '.precio', p.precio, 'Escribí solo el monto: 375000 o 375.000.') +
        fArea('Resumen (frase corta de la tarjeta)', 'productos.' + p.id + '.resumen', p.resumen) +
        fImg('Foto', 'productos.' + p.id + '.imagen', p.imagen, 'Cuadrada 1000×1000 px · fondo blanco o transparente · .webp/.png · &lt;300 KB') +
      '</div>';
    }).join('');
    secciones += seccion('📦 Productos (' + VITALICA_PRODUCTOS.length + ')', prodHTML);

    /* ---- Etiquetas y promociones ----------------------------------------
       Todo lo que es decisión de marketing, junto y con fechas. El precio y
       el stock NO están acá a propósito: esos vienen de Odoo y tienen un
       único dueño. Si se pudieran pisar desde el panel, en dos semanas nadie
       sabría cuál de los dos manda. */
    var hoyISO = (typeof Datos !== 'undefined' && Datos.hoyISO) ? Datos.hoyISO() : '';
    var opcEtiqueta = [
      { valor: '',            texto: '— Sin etiqueta —' },
      { valor: 'Nuevo',       texto: 'Nuevo' },
      { valor: 'Lanzamiento', texto: 'Lanzamiento' },
      { valor: 'Oferta',      texto: 'Oferta' }
    ];

    var campHTML = VITALICA_PRODUCTOS.map(function (p) {
      var c = (typeof VITALICA_CAMPANAS !== 'undefined' && VITALICA_CAMPANAS[p.id]) || {};
      var pr = c.promo || {};
      var vencida = c.etiquetaHasta && hoyISO && c.etiquetaHasta < hoyISO;

      return '<div class="admin-grupo"><h3 class="admin-grupo__t">' + escTxt(p.nombre) +
          (vencida ? ' <span class="admin-vencida">etiqueta vencida</span>' : '') +
        '</h3>' +
        fSelect('Etiqueta', 'campanas.' + p.id + '.etiqueta', c.etiqueta, opcEtiqueta,
                'Se muestra sobre la foto, en el catálogo y en la ficha.') +
        fFecha('La etiqueta se apaga el', 'campanas.' + p.id + '.etiquetaHasta', c.etiquetaHasta,
               'Dejalo vacío y no vence nunca — pero entonces alguien se tiene que acordar de sacarla.') +
        '<div class="admin-sub">Promoción</div>' +
        fSelect('¿Promo activa?', 'campanas.' + p.id + '.promo.activa',
                pr.activa ? '1' : '', [{ valor: '', texto: 'No' }, { valor: '1', texto: 'Sí' }],
                'Además de decir que sí, tiene que haber descuento y estar dentro de las fechas.') +
        fNum('Descuento (%)', 'campanas.' + p.id + '.promo.descuento', pr.descuento || '',
             'Solo el número: 15 = quince por ciento. Se aplica a todos los sabores y tamaños.') +
        fTexto('Texto de la etiqueta', 'campanas.' + p.id + '.promo.texto', pr.texto,
               'Ej: "Semana de la proteína". Vacío = muestra el porcentaje.') +
        fFecha('Desde', 'campanas.' + p.id + '.promo.desde', pr.desde, 'Vacío = ya empezó.') +
        fFecha('Hasta', 'campanas.' + p.id + '.promo.hasta', pr.hasta, 'Vacío = no termina. Poné fecha.') +
      '</div>';
    }).join('');

    secciones += seccion('🏷️ Etiquetas y promociones',
      '<p class="admin-nota-seccion">' +
        'Acá se decide qué producto se muestra como <strong>Nuevo</strong>, <strong>Lanzamiento</strong> o en ' +
        '<strong>promoción</strong>. Todo tiene fecha de vencimiento y se apaga solo.<br>' +
        'El <strong>precio</strong> y el <strong>stock</strong> no se tocan desde acá: vienen de Odoo. ' +
        'La promo es un porcentaje que se calcula sobre el precio que manda Odoo, así funciona bien ' +
        'en todos los sabores y presentaciones.' +
      '</p>' + campHTML);

    // Tiendas
    var tiendasHTML = '<div data-tiendas>' +
      (typeof VITALICA_TIENDAS !== 'undefined' ? VITALICA_TIENDAS : []).map(filaTienda).join('') +
      '</div>' +
      '<button type="button" class="btn btn--contorno" data-add-tienda>+ Agregar tienda</button>';
    secciones += seccion('📍 Comercios aliados (dónde comprar)', tiendasHTML);

    app.innerHTML =
      '<header class="admin-top">' +
        '<div class="admin-top__brand"><strong>Panel de administrador</strong> · Vitalica <span class="admin-demo">DEMO</span></div>' +
        '<div class="admin-acciones">' +
          '<a class="btn btn--contorno" href="index.html" target="_blank" rel="noopener">Ver el sitio ↗</a>' +
          '<button class="btn btn--contorno" type="button" data-exportar>Exportar</button>' +
          '<label class="btn btn--contorno admin-import">Importar<input type="file" accept="application/json,.json" data-importar hidden></label>' +
          '<button class="btn btn--contorno" type="button" data-reset>Restablecer</button>' +
          '<button class="btn btn--primario" type="button" data-guardar>Guardar</button>' +
        '</div>' +
      '</header>' +
      '<div class="admin-aviso">' +
        // Este aviso decía "maqueta sin backend" y "la clave es solo
        // demostrativa". Las dos cosas dejaron de ser ciertas: el ingreso se
        // verifica en el servidor. Lo que SÍ sigue siendo cierto, y es lo que
        // más confunde, es que los cambios viven en el navegador de quien los
        // hizo: nadie más los ve. Eso hay que decirlo sin vueltas.
        '<strong>Lo que cambies acá se ve solo en este navegador.</strong> Sirve para probar y mostrar cómo quedaría, ' +
        'pero <strong>el resto de los visitantes sigue viendo el sitio como estaba</strong>. ' +
        'Para que un cambio salga publicado de verdad hay que pasarlo al archivo de datos del sitio. ' +
        'Usá <strong>Exportar</strong> para bajar lo que configuraste y pasárselo a quien lo publique, ' +
        'e <strong>Importar</strong> para recuperarlo en otra computadora. ' +
        '<strong>Restablecer</strong> borra tus cambios y vuelve a mostrar el sitio real.' +
      '</div>' +
      '<div class="admin-form">' + secciones + '</div>' +
      '<div class="admin-barra-guardar"><button class="btn btn--primario btn--grande" type="button" data-guardar>Guardar cambios</button></div>';

    wirePanel();
  }

  /* ---------- Recolectar valores del formulario → objeto overrides ---------- */
  function recolectar() {
    var ov = {};
    app.querySelectorAll('[data-ov]').forEach(function (el) {
      var path = el.getAttribute('data-ov');
      var val;
      if (el.getAttribute('data-num') === 'gs') {
        // Guaraníes: solo dígitos. "375.000", "Gs. 375.000" o "375000" → 375000. Vacío → "".
        var digitos = el.value.replace(/[^\d]/g, '');
        val = digitos === '' ? '' : Number(digitos);
      } else if (el.getAttribute('data-list') === 'lines') {
        val = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      } else {
        val = el.value;
      }
      setPath(ov, path, val);
    });
    // Tiendas (lista dinámica)
    var tiendas = [];
    app.querySelectorAll('.admin-tienda').forEach(function (row) {
      var n = row.querySelector('.t-nombre').value.trim();
      var c = row.querySelector('.t-ciudad').value.trim();
      // El logo viaja en un campo oculto para no perderlo al guardar: no se
      // edita desde el panel, pero si se pierde el comercio queda sin imagen.
      var campoLogo = row.querySelector('.t-logo');
      var t = { nombre: n, ciudad: c, logo: campoLogo ? campoLogo.value : '' };
      // Ancho y alto del logo se conservan de data.js buscando por nombre: son
      // medidas calculadas por la forma de cada archivo, no algo que se tipee.
      if (typeof VITALICA_TIENDAS !== 'undefined') {
        var orig = VITALICA_TIENDAS.filter(function (x) { return x.nombre === n; })[0];
        if (orig) { t.ancho = orig.ancho; t.altura = orig.altura; }
      }
      if (n) tiendas.push(t);
    });
    ov.tiendas = tiendas;
    return ov;
  }

  function guardar(silencioso) {
    var ov = recolectar();
    localStorage.setItem('vitalica_overrides', JSON.stringify(ov));
    if (!silencioso) toast('✓ Cambios guardados. Abrí o recargá el sitio para verlos.');
    return ov;
  }

  function exportar() {
    var ov = guardar(true);
    var blob = new Blob([JSON.stringify(ov, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'vitalica-config.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('✓ Configuración exportada (vitalica-config.json)');
  }

  function importar(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        JSON.parse(r.result); // validar
        localStorage.setItem('vitalica_overrides', r.result);
        toast('✓ Configuración importada. Recargando…');
        setTimeout(function () { location.reload(); }, 900);
      } catch (e) { toast('✕ El archivo no es una configuración válida.'); }
    };
    r.readAsText(file);
  }

  function restablecer() {
    if (confirm('¿Volver a los valores originales? Se borran todos los cambios de este navegador.')) {
      localStorage.removeItem('vitalica_overrides');
      location.reload();
    }
  }

  /* ---------- Eventos del panel ---------- */
  function wirePanel() {
    // Subir imagen → base64 → preview + input oculto
    app.addEventListener('change', function (e) {
      var f = e.target.closest('.admin-file');
      if (f && f.files && f.files[0]) {
        var id = f.getAttribute('data-file');
        var reader = new FileReader();
        reader.onload = function () {
          var hidden = document.getElementById(id);
          if (hidden) hidden.value = reader.result;
          var prev = app.querySelector('[data-prev="' + id + '"]');
          if (prev) prev.src = reader.result;
        };
        reader.readAsDataURL(f.files[0]);
        return;
      }
      var imp = e.target.closest('[data-importar]');
      if (imp && imp.files && imp.files[0]) importar(imp.files[0]);
    });

    app.addEventListener('click', function (e) {
      if (e.target.closest('[data-guardar]')) guardar();
      else if (e.target.closest('[data-exportar]')) exportar();
      else if (e.target.closest('[data-reset]')) restablecer();
      else if (e.target.closest('[data-add-tienda]')) {
        var cont = app.querySelector('[data-tiendas]');
        cont.insertAdjacentHTML('beforeend', filaTienda({}));
      } else if (e.target.closest('[data-del-tienda]')) {
        var row = e.target.closest('.admin-tienda');
        if (row) row.remove();
      }
    });

    // Al salir de un campo de guaraníes, lo reformatea lindo (375000 → "375.000").
    app.addEventListener('focusout', function (e) {
      var g = e.target.closest('[data-num="gs"]');
      if (g) g.value = gsMostrar(g.value);
    });
  }

  /* ---------- Portada con clave (demo) ---------- */
  function renderLogin(error) {
    app.innerHTML =
      '<div class="admin-login">' +
        '<form class="admin-login__card" data-login>' +
          '<h1>Panel de administrador</h1>' +
          '<p class="texto-apagado">Ingresá la clave para administrar la maqueta.</p>' +
          '<input type="password" data-clave placeholder="Clave" autofocus>' +
          (error ? '<p class="admin-login__err">Clave incorrecta. Probá de nuevo.</p>' : '') +
          '<button class="btn btn--primario btn--bloque" type="submit">Entrar</button>' +
          '<p class="admin-login__nota">Demo: clave <code>vitalica2026</code>. En una maqueta sin backend la clave NO es seguridad real — IT la implementa en producción.</p>' +
        '</form>' +
      '</div>';
    app.querySelector('[data-login]').addEventListener('submit', function (e) {
      e.preventDefault();
      var val = app.querySelector('[data-clave]').value;
      if (val === CLAVE_DEMO) { sessionStorage.setItem('vitalica_admin', 'ok'); renderPanel(); }
      else { renderLogin(true); }
    });
  }

  /* ---------- Arranque ----------
     Si el archivo se sirve como admin.php, el servidor ya verificó la sesión
     antes de mandar una sola línea de HTML, y deja marcado
     VITALICA_ADMIN_AUTORIZADO. En ese caso no tiene sentido volver a pedir la
     clave: sería pedirla dos veces por la misma puerta.

     La pantalla de clave de acá abajo queda solo como respaldo para abrir el
     archivo suelto, sin servidor. NO es seguridad: se verifica en el
     navegador y se puede saltear. La protección real está en api/sesion.php. */
  if (window.VITALICA_ADMIN_AUTORIZADO === true) renderPanel();
  else if (sessionStorage.getItem('vitalica_admin') === 'ok') renderPanel();
  else renderLogin(false);

})();
