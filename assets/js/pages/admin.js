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

  /* ---------- LISTAS QUE SE PUEDEN AGRANDAR Y ACHICAR --------------------
     Los campos normales se identifican con data-ov="ruta.al.campo" y
     recolectar() los lee por esa ruta. Para las listas donde se agregan y
     quitan filas eso no sirve: la ruta lleva el índice adentro
     —hero.2.titulo— y al borrar la fila 1, la 2 pasa a ser la 1 y todas las
     rutas quedan mintiendo.

     Por eso estas filas NO usan data-ov. Se marcan con una clase y
     recolectar() las lee por posición, de arriba hacia abajo, que es
     exactamente el orden en que se van a ver en el sitio. Es el mismo
     mecanismo que ya usaban los comercios aliados.

     Agregar y quitar tampoco redibujan el panel entero: insertan o sacan un
     nodo. Redibujar perdería lo que la persona esté escribiendo en otra
     sección, y eso enoja con razón. */
  var contadorImg = 0;

  /* Campo de imagen para una fila dinámica: igual que fImg pero sin ruta,
     con un id único para que el lector de archivos sepa a cuál escribirle. */
  function fImgLibre(label, clase, val, hint) {
    var id = 'imx_' + (++contadorImg);
    return '<div class="admin-campo admin-img"><span class="admin-campo__label">' + label + '</span>' +
      '<div class="admin-img__row">' +
        '<img class="admin-img__preview" src="' + escAttr(val) + '" alt="" data-prev="' + id + '">' +
        '<div class="admin-img__ctrl">' +
          '<input type="file" accept="image/*" class="admin-file" data-file="' + id + '">' +
          '<span class="admin-hint">' + hint + '</span>' +
        '</div>' +
      '</div>' +
      '<input type="hidden" id="' + id + '" class="' + clase + '" value="' + escAttr(val) + '">' +
    '</div>';
  }

  function barraFila(titulo, accionBorrar) {
    return '<div class="admin-fila__barra">' +
      '<h3 class="admin-grupo__t">' + titulo + '</h3>' +
      '<button type="button" class="admin-quitar" ' + accionBorrar + '>Quitar</button>' +
    '</div>';
  }
  function botonAgregar(accion, texto) {
    return '<button type="button" class="admin-agregar" ' + accion + '>+ ' + texto + '</button>';
  }

  /* --- Una diapositiva del carrusel --- */
  function filaSlide(s) {
    s = s || { modo: 'banner', cta1: {}, cta2: {} };
    var esBanner = (s.modo !== 'producto');
    var c1 = s.cta1 || {}, c2 = s.cta2 || {};
    return '<div class="admin-grupo admin-slide">' +
      barraFila('Slide', 'data-del-slide') +
      '<label class="admin-campo"><span class="admin-campo__label">Eyebrow (texto chico de arriba)</span>' +
        '<input type="text" class="s-eyebrow" value="' + escAttr(s.eyebrow) + '"></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Título (podés usar &lt;br&gt; para cortar la línea)</span>' +
        '<textarea class="s-titulo" rows="2">' + escTxt(s.titulo) + '</textarea></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Texto</span>' +
        '<textarea class="s-texto" rows="3">' + escTxt(s.texto) + '</textarea></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Modo de la imagen</span>' +
        '<select class="s-modo">' +
          '<option value="producto"' + (esBanner ? '' : ' selected') + '>Producto flotante (foto del envase sobre el fondo azul)</option>' +
          '<option value="banner"' + (esBanner ? ' selected' : '') + '>Banner completo (la imagen cubre todo el rectángulo)</option>' +
        '</select></label>' +
      fImgLibre('Imagen del slide', 's-imagen', s.imagen,
        'Banner completo: ~1920×760 px, JPG/WebP &lt;500 KB · Producto flotante: ~800×800 px con fondo transparente') +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón 1 — texto</span>' +
          '<input type="text" class="s-c1t" value="' + escAttr(c1.texto) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón 1 — destino</span>' +
          '<input type="text" class="s-c1h" value="' + escAttr(c1.href) + '" placeholder="productos.html"></label>' +
      '</div>' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón 2 — texto</span>' +
          '<input type="text" class="s-c2t" value="' + escAttr(c2.texto) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón 2 — destino</span>' +
          '<input type="text" class="s-c2h" value="' + escAttr(c2.href) + '" placeholder="sobre.html"></label>' +
      '</div>' +
      '<span class="admin-hint">Dejá los dos botones vacíos si el slide no lleva botones.</span>' +
    '</div>';
  }

  /* --- Un mensaje de la barra de anuncios, con fechas --- */
  function filaAnuncio(a) {
    a = (typeof a === 'string') ? { texto: a } : (a || {});
    return '<div class="admin-anuncio">' +
      '<input type="text" class="a-texto" value="' + escAttr(a.texto) + '" placeholder="Mensaje que rota en la barra de arriba">' +
      '<label class="admin-mini">Desde<input type="date" class="a-desde" value="' + escAttr(a.desde) + '"></label>' +
      '<label class="admin-mini">Hasta<input type="date" class="a-hasta" value="' + escAttr(a.hasta) + '"></label>' +
      '<button type="button" class="admin-quitar" data-del-anuncio aria-label="Quitar mensaje">✕</button>' +
    '</div>';
  }

  /* --- Una persona de "Quiénes nos eligen" --- */
  function filaPersona(g) {
    g = g || { rol: 'nutricionista' };
    var esAtleta = (g.rol || 'embajador') === 'embajador';
    return '<div class="admin-grupo admin-persona">' +
      barraFila(escTxt(g.nombre) || 'Persona nueva', 'data-del-persona') +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Nombre y apellido</span>' +
          '<input type="text" class="g-nombre" value="' + escAttr(g.nombre) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Va en la columna de</span>' +
          '<select class="g-rol">' +
            '<option value="embajador"' + (esAtleta ? ' selected' : '') + '>Atletas</option>' +
            '<option value="nutricionista"' + (esAtleta ? '' : ' selected') + '>Nutricionistas</option>' +
          '</select></label>' +
      '</div>' +
      '<label class="admin-campo"><span class="admin-campo__label">Instagram (sin la arroba)</span>' +
        '<input type="text" class="g-ig" value="' + escAttr(g.instagram) + '" placeholder="nutrigabi_azcona">' +
        '<span class="admin-hint">Dejalo vacío y la tarjeta no lleva enlace.</span></label>' +
      fImgLibre('Foto', 'g-foto', g.foto,
        'Vertical 3:4 · 600×800 px · la cara en el tercio de arriba · JPG &lt;120 KB. ' +
        'Sin foto se muestran las iniciales sobre el naranja de marca, que también se ve bien.') +
    '</div>';
  }

  /* --- Una variante: un sabor y tamaño concreto de un producto ---
     El 'codigo' es el código de barras del envase, y es la llave con la que
     Odoo manda precio y stock. Sin código la variante se muestra en el sitio
     pero nunca va a tener precio propio: por eso el campo va primero y con
     el aviso puesto. */
  function filaVariante(v) {
    v = v || {};
    return '<div class="admin-variante">' +
      '<input type="text" class="v-codigo" value="' + escAttr(v.codigo) + '" placeholder="Código de barras">' +
      '<input type="text" class="v-sabor"  value="' + escAttr(v.sabor) + '" placeholder="Sabor">' +
      '<input type="text" class="v-icono"  value="' + escAttr(v.icono) + '" placeholder="🍫" maxlength="4">' +
      '<input type="text" class="v-tamano" value="' + escAttr(v.tamano) + '" placeholder="700 g">' +
      '<input type="hidden" class="v-imagen" value="' + escAttr(v.imagen) + '">' +
      '<button type="button" class="admin-quitar" data-del-variante aria-label="Quitar variante">✕</button>' +
    '</div>';
  }

  /* --- Un producto del catálogo --- */
  function filaProducto(p) {
    p = p || {};
    var cats = (typeof VITALICA_CATEGORIAS !== 'undefined' ? VITALICA_CATEGORIAS : []);
    var vars = (typeof VITALICA_VARIANTES !== 'undefined' && p.id ? (VITALICA_VARIANTES[p.id] || []) : []);
    var esNuevo = !p.id;

    return '<div class="admin-grupo admin-producto">' +
      barraFila(escTxt(p.nombre) || 'Producto nuevo', 'data-del-producto') +
      /* El id NO se edita. Es la dirección de la ficha
         (producto.html?id=...), la llave de las variantes y la de las
         etiquetas, y está escrito en los pedidos que ya se hicieron.
         Cambiarlo rompe enlaces que ya circulan. En un producto nuevo se
         arma solo con el nombre. */
      '<input type="hidden" class="d-id" value="' + escAttr(p.id) + '">' +
      (esNuevo ? '' : '<p class="admin-hint">Dirección fija: <code>producto.html?id=' + escTxt(p.id) + '</code></p>') +
      '<label class="admin-campo"><span class="admin-campo__label">Nombre</span>' +
        '<input type="text" class="d-nombre" value="' + escAttr(p.nombre) + '"></label>' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Categoría</span>' +
          '<select class="d-categoria">' +
            cats.map(function (c) {
              return '<option value="' + escAttr(c.id) + '"' +
                     (p.categoria === c.id ? ' selected' : '') + '>' + escTxt(c.nombre) + '</option>';
            }).join('') +
          '</select></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Precio (Gs.)</span>' +
          '<input type="text" class="d-precio" value="' + escAttr(gsMostrar(p.precio)) + '" placeholder="vacío = el de Odoo">' +
          '<span class="admin-hint">Vacío usa el precio que manda Odoo, que es lo normal. ' +
          'Escribir uno acá lo pisa: sirve para una promo puntual, pero después hay que acordarse de borrarlo.</span></label>' +
      '</div>' +
      '<label class="admin-campo admin-check"><input type="checkbox" class="d-destacado"' +
        (p.destacado ? ' checked' : '') + '> Destacado (aparece primero en el catálogo)</label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Resumen (la frase de la tarjeta)</span>' +
        '<textarea class="d-resumen" rows="2">' + escTxt(p.resumen) + '</textarea></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Descripción (va en la ficha)</span>' +
        '<textarea class="d-descripcion" rows="4">' + escTxt(p.descripcion) + '</textarea></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Modo de uso</span>' +
        '<textarea class="d-modo" rows="2">' + escTxt(p.modoDeUso) + '</textarea></label>' +
      fImgLibre('Foto', 'd-imagen', p.imagen,
        'Cuadrada 1000×1000 px · fondo blanco o transparente · &lt;300 KB') +
      '<div class="admin-sublista">' +
        '<h4 class="admin-sublista__t">Sabores y tamaños</h4>' +
        '<p class="admin-hint">El <b>código de barras</b> es con lo que Odoo manda el precio y el stock de ' +
        'cada envase. Sin código la variante se ve en el sitio pero nunca va a tener precio propio.</p>' +
        '<div class="admin-variantes">' + vars.map(filaVariante).join('') + '</div>' +
        '<button type="button" class="admin-agregar admin-agregar--mini" data-add-variante>+ Agregar sabor o tamaño</button>' +
      '</div>' +
    '</div>';
  }

  /* --- Un pop-up de campaña ---
     El motor ya existía en popups.js desde siempre; lo único que faltaba era
     poder cargarlos sin tocar data.js. Las reglas duras del motor —uno solo
     a la vez, nunca en el carrito ni en el checkout— no se exponen acá a
     propósito: no son decisiones de campaña, son decisiones de no arruinar
     una compra en curso. */
  function filaPopup(p) {
    p = p || { activo: false, segundos: 6, repetirDias: 7, cta: {}, cta2: {}, paginas: [] };
    var c1 = p.cta || {}, c2 = p.cta2 || {};
    var pags = (p.paginas || []).join(', ');
    return '<div class="admin-grupo admin-popup">' +
      barraFila(escTxt(p.titulo) || 'Pop-up nuevo', 'data-del-popup') +
      '<input type="hidden" class="o-id" value="' + escAttr(p.id) + '">' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">¿Está prendido?</span>' +
          '<select class="o-activo">' +
            '<option value="no"' + (p.activo ? '' : ' selected') + '>No — no se muestra</option>' +
            '<option value="si"' + (p.activo ? ' selected' : '') + '>Sí — se muestra</option>' +
          '</select></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Etiqueta chica de arriba</span>' +
          '<input type="text" class="o-etiqueta" value="' + escAttr(p.etiqueta) + '" placeholder="Promo, Lanzamiento, Beneficio"></label>' +
      '</div>' +
      '<label class="admin-campo"><span class="admin-campo__label">Título</span>' +
        '<input type="text" class="o-titulo" value="' + escAttr(p.titulo) + '"></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Texto</span>' +
        '<textarea class="o-texto" rows="3">' + escTxt(p.texto) + '</textarea></label>' +
      fImgLibre('Imagen (opcional)', 'o-imagen', p.imagen, 'Apaisada ~800×450 px · JPG/WebP &lt;150 KB. Sin imagen queda solo el texto, que también funciona.') +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón — texto</span>' +
          '<input type="text" class="o-c1t" value="' + escAttr(c1.texto) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Botón — destino</span>' +
          '<input type="text" class="o-c1h" value="' + escAttr(c1.href) + '" placeholder="productos.html o whatsapp"></label>' +
      '</div>' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Segundo botón — texto</span>' +
          '<input type="text" class="o-c2t" value="' + escAttr(c2.texto) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Segundo botón — destino</span>' +
          '<input type="text" class="o-c2h" value="' + escAttr(c2.href) + '"></label>' +
      '</div>' +
      '<span class="admin-hint">En «destino» podés poner una página del sitio (<code>productos.html</code>) ' +
      'o la palabra <code>whatsapp</code>, que abre el chat con el mensaje ya armado. ' +
      'Dejá el texto vacío y el botón no aparece.</span>' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Aparece a los… (segundos)</span>' +
          '<input type="number" class="o-segundos" min="0" max="60" value="' + escAttr(p.segundos == null ? 6 : p.segundos) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">No repetir durante… (días)</span>' +
          '<input type="number" class="o-dias" min="0" max="365" value="' + escAttr(p.repetirDias == null ? 7 : p.repetirDias) + '">' +
          '<span class="admin-hint"><b>0 = aparece en cada visita.</b> 7 = a quien lo cerró no se le muestra por una semana.</span></label>' +
      '</div>' +
      '<div class="admin-dos">' +
        '<label class="admin-campo"><span class="admin-campo__label">Se muestra desde</span>' +
          '<input type="date" class="o-desde" value="' + escAttr(p.desde) + '"></label>' +
        '<label class="admin-campo"><span class="admin-campo__label">Se apaga el</span>' +
          '<input type="date" class="o-hasta" value="' + escAttr(p.hasta) + '"></label>' +
      '</div>' +
      '<span class="admin-hint">Vacías = sin límite. <b>Poner «Se apaga el» es lo que evita que un sorteo ' +
      'siga invitando a participar después de sorteado</b>, sin depender de que alguien se acuerde de apagarlo.</span>' +
      '<label class="admin-campo"><span class="admin-campo__label">¿En qué páginas?</span>' +
        '<input type="text" class="o-paginas" value="' + escAttr(pags) + '" placeholder="index.html, productos.html">' +
        '<span class="admin-hint">Separadas por coma. <b>Vacío = en todas.</b> Nunca se muestra en el carrito ' +
        'ni en el checkout: interrumpir a alguien que ya está comprando es la forma más cara de ganar un clic.</span></label>' +
      '<label class="admin-campo admin-check"><input type="checkbox" class="o-unavez"' + (p.soloUnaVez ? ' checked' : '') + '>' +
        ' Mostrarlo una sola vez por persona</label>' +
      '<label class="admin-campo admin-check"><input type="checkbox" class="o-notoco"' + (p.noRepetirSiToco ? ' checked' : '') + '>' +
        ' A quien ya tocó el botón, no mostrárselo más</label>' +
      '<span class="admin-hint">Esta última es la combinación útil para un sorteo: poné ' +
      '<b>0 días</b> arriba para que aparezca siempre, y tildá esto para que ' +
      'desaparezca apenas la persona participa. Seguir mostrándoselo a quien ya ' +
      'hizo lo que pedías es la forma de que lo empiece a cerrar sin leer.</span>' +
    '</div>';
  }

  /* --- Un pilar de "Ciencia real" --- */
  function filaPilar(p) {
    p = p || {};
    return '<div class="admin-grupo admin-pilar">' +
      barraFila(escTxt(p.titulo) || 'Pilar nuevo', 'data-del-pilar') +
      '<label class="admin-campo"><span class="admin-campo__label">Título</span>' +
        '<input type="text" class="p-titulo" value="' + escAttr(p.titulo) + '"></label>' +
      '<label class="admin-campo"><span class="admin-campo__label">Texto</span>' +
        '<textarea class="p-texto" rows="4">' + escTxt(p.texto) + '</textarea></label>' +
      fImgLibre('Foto', 'p-foto', p.foto, 'Apaisada ~700×500 px · JPG/WebP &lt;200 KB') +
      '<input type="hidden" class="p-icono" value="' + escAttr(p.icono) + '">' +
    '</div>';
  }
  /* --- Un comercio aliado ---
     Ya no se pide la dirección: el sitio muestra el logo del comercio, no
     dónde queda (ver assets/js/pages/contacto.js).

     EL LOGO AHORA SE SUBE DESDE ACÁ.
     Antes viajaba en un campo oculto y solo se podía cargar escribiéndolo en
     data.js. El razonamiento era "es un archivo, no un texto", pero el
     resultado fue que todo comercio que marketing agregara nacía sin logo y
     sin forma de ponérselo: en la fila de aliados aparecía el nombre suelto
     en texto, que es exactamente lo que la sección quiere evitar.

     Las medidas se calculan solas al subir la imagen (ver wirePanel): los
     logos vienen con proporciones muy distintas —hay uno de 190×27 y otro de
     111×61— y pedirle a alguien que las escriba a mano es pedirle que las
     invente. */
  function filaTienda(t) {
    t = t || {};
    var id = 'tl_' + (++contadorImg);
    return '<div class="admin-tienda">' +
      '<div class="admin-tienda__datos">' +
        '<input type="text" class="t-nombre" value="' + escAttr(t.nombre) + '" placeholder="Nombre del comercio">' +
        '<input type="text" class="t-ciudad" value="' + escAttr(t.ciudad) + '" placeholder="Ciudad (opcional)">' +
      '</div>' +
      '<div class="admin-tienda__logo">' +
        '<img class="admin-img__preview admin-img__preview--logo" src="' + escAttr(t.logo) + '" alt="" data-prev="' + id + '">' +
        '<input type="file" accept="image/*" class="admin-file" data-file="' + id + '">' +
        '<span class="admin-hint">PNG con fondo transparente · el logo del comercio, no una foto del local</span>' +
      '</div>' +
      '<input type="hidden" id="' + id + '" class="t-logo" value="' + escAttr(t.logo) + '">' +
      '<input type="hidden" class="t-ancho"  value="' + escAttr(t.ancho) + '">' +
      '<input type="hidden" class="t-altura" value="' + escAttr(t.altura) + '">' +
      '<button type="button" class="admin-quitar" data-del-tienda aria-label="Quitar comercio">✕</button>' +
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

    // Hero — ahora se pueden agregar y quitar slides
    var slides = (typeof VITALICA_HERO !== 'undefined' ? VITALICA_HERO : []);
    secciones += seccion('🎞️ Hero (carrusel principal)',
      '<p class="admin-nota">Los slides se muestran en este orden y rotan solos. ' +
      'Con uno solo, el carrusel deja de rotar y queda una portada fija.</p>' +
      '<div data-slides>' + slides.map(filaSlide).join('') + '</div>' +
      botonAgregar('data-add-slide', 'Agregar slide'));

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

    // Anuncios — con fecha de inicio y fin
    secciones += seccion('📢 Barra de anuncios',
      '<p class="admin-nota">Los mensajes rotan en la franja de arriba de todo. ' +
      'Las fechas son opcionales: vacías quiere decir que el mensaje está siempre. ' +
      'Poner «Hasta» es la forma de que una promo se apague sola y no quede ' +
      'anunciando en enero algo que terminó en noviembre.</p>' +
      '<div data-anuncios>' + (C.anuncios || []).map(filaAnuncio).join('') + '</div>' +
      botonAgregar('data-add-anuncio', 'Agregar mensaje'));

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

    /* ---- Quiénes nos eligen -------------------------------------------
       La sección que más se mueve: cada vez que llega una foto nueva o
       entra alguien al programa había que tocar data.js. Ahora no.

       Lo que NO se pide a propósito: cédula, teléfono y ciudad. Los dos
       primeros están en la planilla de contratos y no pueden entrar nunca
       —data.js se descarga entero con solo abrir el sitio—; la ciudad la
       sacó marketing el 24/9. */
    var emb = C.embajadores || {};
    var gente = emb.gente || [];
    var cols = emb.columnas || {};
    secciones += seccion('👥 Quiénes nos eligen (atletas y nutricionistas)',
      '<p class="admin-nota">Se muestran en este orden, repartidos en dos grupos según la columna ' +
      'que elijas. Quien no tenga foto cargada va al final del grupo con sus iniciales. ' +
      '<b>No cargues cédula ni teléfono acá</b>: este archivo lo descarga cualquiera que abra el sitio.</p>' +
      fTexto('Encabezado de la sección', 'embajadores.titulo', emb.titulo) +
      fArea('Texto de abajo', 'embajadores.texto', emb.texto) +
      '<div class="admin-dos">' +
        fTexto('Título de la columna izquierda', 'embajadores.columnas.embajador.titulo',
               (cols.embajador || {}).titulo) +
        fTexto('Título de la columna derecha', 'embajadores.columnas.nutricionista.titulo',
               (cols.nutricionista || {}).titulo) +
      '</div>' +
      '<div data-gente>' + gente.map(filaPersona).join('') + '</div>' +
      botonAgregar('data-add-persona', 'Agregar persona'));

    // Ciencia real
    var ci = C.ciencia || {};
    secciones += seccion('🔬 Ciencia real (los pilares de Olimp)',
      fTexto('Eyebrow', 'ciencia.eyebrow', ci.eyebrow) +
      fArea('Título', 'ciencia.titulo', ci.titulo) +
      fArea('Texto de presentación', 'ciencia.texto', ci.texto) +
      '<p class="admin-nota">El video vertical de la planta no se edita acá: es un archivo ' +
      'que se sube una sola vez por cPanel a <code>assets/video/</code>. Si querés cambiarlo, avisá.</p>' +
      '<div data-pilares>' + (ci.pilares || []).map(filaPilar).join('') + '</div>' +
      botonAgregar('data-add-pilar', 'Agregar pilar'));

    /* ---- Pop-ups de campaña -------------------------------------------
       El motor vive en popups.js y ya existía; lo que faltaba era cargarlos
       sin tocar data.js. */
    var pops = (typeof VITALICA_POPUPS !== 'undefined' ? VITALICA_POPUPS : []);
    secciones += seccion('🔔 Pop-ups de campaña',
      '<p class="admin-nota">Avisos que aparecen sobre la página para comunicar una promo, ' +
      'un lanzamiento o un beneficio. <b>Se muestra uno solo por visita</b>: si hay varios ' +
      'prendidos para la misma página gana el primero de la lista. Dos pop-ups encima del otro ' +
      'no venden más, venden menos.</p>' +
      '<div data-popups>' + pops.map(filaPopup).join('') + '</div>' +
      botonAgregar('data-add-popup', 'Agregar pop-up'));

    // Datos de la empresa (pie de página y documentos legales)
    var em = C.empresa || {};
    secciones += seccion('🏢 Datos de la empresa',
      '<p class="admin-nota">Se usan en el pie del sitio y en las páginas de términos y privacidad.</p>' +
      fTexto('Razón social', 'config.empresa.razonSocial', em.razonSocial) +
      fTexto('RUC', 'config.empresa.ruc', em.ruc) +
      fTexto('Domicilio', 'config.empresa.domicilio', em.domicilio) +
      fTexto('Ciudad', 'config.empresa.ciudad', em.ciudad) +
      fTexto('Teléfono', 'config.empresa.telefono', em.telefono) +
      fTexto('Email para temas de privacidad', 'config.empresa.emailPrivacidad', em.emailPrivacidad,
             'Si queda vacío se usa el correo general de contacto.'));

    // Productos — con alta, baja y variantes
    secciones += seccion('📦 Productos (' + VITALICA_PRODUCTOS.length + ')',
      '<p class="admin-nota">El catálogo completo. El <b>precio y el stock los manda Odoo</b>: ' +
      'dejá el precio vacío salvo que quieras pisarlo para una promo. ' +
      'La dirección de cada ficha se arma con el nombre la primera vez y después ' +
      'ya no cambia, porque es el enlace que circula.</p>' +
      '<div data-productos>' + VITALICA_PRODUCTOS.map(filaProducto).join('') + '</div>' +
      botonAgregar('data-add-producto', 'Agregar producto'));

    /* ---- Etiquetas y promociones ----------------------------------------
       Todo lo que es decisión de marketing, junto y con fechas. El precio y
       el stock NO están acá a propósito: esos vienen de Odoo y tienen un
       único dueño. Si se pudieran pisar desde el panel, en dos semanas nadie
       sabría cuál de los dos manda. */
    var hoyISO = (typeof Datos !== 'undefined' && Datos.hoyISO) ? Datos.hoyISO() : '';
    /* "ninguna" y no cadena vacía: ver el comentario largo en
       components.js → Comp.etiquetaDe(). Vacío significa "nadie decidió" y
       deja que el sitio caiga en p.tags o en p.destacado; "ninguna" es una
       decisión y apaga la chapita de verdad. */
    var opcEtiqueta = [
      { valor: 'ninguna',     texto: '— Sin etiqueta —' },
      { valor: 'Nuevo',       texto: 'Nuevo' },
      { valor: 'Lanzamiento', texto: 'Lanzamiento' },
      { valor: 'Oferta',      texto: 'Oferta' },
      { valor: 'Destacado',   texto: 'Destacado' }
    ];

    /* Lo que el SITIO muestra hoy para este producto, que no es lo mismo que
       lo que hay cargado en campanas. Si acá se mostrara solo c.etiqueta, el
       panel diría "— Sin etiqueta —" para un producto que en el catálogo
       tiene un "DESTACADO" bien grande, y nadie entendería de dónde sale.
       Pasó. */
    function etiquetaEfectiva(p, c) {
      if (c.etiqueta) return c.etiqueta;
      if (p.tags && p.tags.length) return p.tags[0];
      if (p.destacado) return 'Destacado';
      return 'ninguna';
    }

    var campHTML = VITALICA_PRODUCTOS.map(function (p) {
      var c = (typeof VITALICA_CAMPANAS !== 'undefined' && VITALICA_CAMPANAS[p.id]) || {};
      var pr = c.promo || {};
      var vencida = c.etiquetaHasta && hoyISO && c.etiquetaHasta < hoyISO;

      return '<div class="admin-grupo"><h3 class="admin-grupo__t">' + escTxt(p.nombre) +
          (vencida ? ' <span class="admin-vencida">etiqueta vencida</span>' : '') +
        '</h3>' +
        fSelect('Etiqueta', 'campanas.' + p.id + '.etiqueta', etiquetaEfectiva(p, c), opcEtiqueta,
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
        '<div class="admin-top__brand"><strong>Panel de administrador</strong> · Vitalica <span class="admin-demo" data-estado>vista previa</span></div>' +
        '<div class="admin-acciones">' +
          '<a class="btn btn--contorno" href="index.html" target="_blank" rel="noopener">Ver el sitio ↗</a>' +
          '<button class="btn btn--contorno" type="button" data-exportar>Exportar</button>' +
          '<label class="btn btn--contorno admin-import">Importar<input type="file" accept="application/json,.json" data-importar hidden></label>' +
          '<button class="btn btn--contorno" type="button" data-vista-abrir>Ver mientras edito</button>' +
          '<button class="btn btn--contorno" type="button" data-reset>Restablecer</button>' +
          '<button class="btn btn--contorno" type="button" data-guardar>Guardar borrador</button>' +
          '<button class="btn btn--primario" type="button" data-publicar>Publicar</button>' +
        '</div>' +
      '</header>' +
      '<div class="admin-aviso">' +
        /* Este aviso ya dijo dos cosas que dejaron de ser ciertas: primero que
           era "una maqueta sin backend", despues que los cambios se veian solo
           en este navegador. Hoy se puede publicar de verdad, asi que lo que
           hay que explicar es otra cosa: que son DOS pasos y en que se
           diferencian. Si alguien toca Guardar y se va creyendo que publico,
           el sitio no cambia y nadie entiende por que. */
        '<strong>Guardar borrador</strong> deja tus cambios en esta computadora, para ' +
        'mirarlos antes de largarlos. Solo los ves vos. ' +
        '<strong>Publicar</strong> los deja en el sitio para todos los visitantes. ' +
        '<strong>Restablecer</strong> borra tu borrador y te vuelve a mostrar lo que está ' +
        'publicado hoy; no despublica nada.' +
      '</div>' +
      /* AVISO DE BORRADOR SIN PUBLICAR.
         ------------------------------------------------------------------
         Un borrador guardado reemplaza listas enteras —pop-ups, slides,
         productos— y lo hace en silencio, solo en esta computadora. El
         efecto es desconcertante: alguien agrega algo, lo guarda, lo ve en
         el sitio... y nadie más lo ve. O al revés: queda un borrador viejo
         de hace semanas tapando lo que sí está publicado, y cada cambio
         nuevo parece no tomar.

         Pasó. Por eso, si hay borrador, el panel lo dice arriba de todo en
         vez de dejarlo como un estado invisible. */
      (localStorage.getItem('vitalica_overrides')
        ? '<div class="admin-aviso admin-aviso--borrador">' +
            '<strong>Tenés un borrador sin publicar.</strong> Lo que ves en el sitio desde ' +
            'esta computadora incluye esos cambios, pero <strong>nadie más los ve</strong>. ' +
            'Tocá <strong>Publicar</strong> para que salgan, o <strong>Restablecer</strong> ' +
            'para descartarlos y volver a ver lo que está publicado.' +
          '</div>'
        : '') +
      /* ---- VISTA EN VIVO ---------------------------------------------
         El sitio al lado del formulario, actualizándose solo mientras se
         escribe. Es lo que convierte "publico y cruzo los dedos" en "lo veo
         y después publico", que era el paso donde más se tropezaba.

         Son DOS iframes, no uno. Recargar el único que había hacía parpadear
         la pantalla de carga del sitio en cada tecleo. Así se carga en el
         que está escondido y recién cuando terminó se intercambian: el
         cambio aparece de una, sin parpadeo. */
      '<div class="admin-split" data-split>' +
        '<div class="admin-form">' + secciones + '</div>' +
        '<aside class="admin-vista" data-vista>' +
          '<div class="admin-vista__barra">' +
            '<select data-vista-pagina title="Qué página mirar">' +
              '<option value="index.html">Portada</option>' +
              '<option value="productos.html">Productos</option>' +
              '<option value="noticias.html">Noticias</option>' +
              '<option value="contacto.html">Contacto</option>' +
              '<option value="sobre.html">Olimp</option>' +
            '</select>' +
            '<div class="admin-vista__anchos">' +
              '<button type="button" data-ancho="suelto" class="on" title="Pantalla de computadora">🖥</button>' +
              '<button type="button" data-ancho="390" title="Celular">📱</button>' +
            '</div>' +
            '<span class="admin-vista__estado" data-vista-estado></span>' +
            '<button type="button" class="admin-vista__cerrar" data-vista-cerrar title="Ocultar la vista">✕</button>' +
          '</div>' +
          '<div class="admin-vista__marco" data-vista-marco>' +
            '<iframe data-vista-a title="Vista del sitio"></iframe>' +
            '<iframe data-vista-b title="Vista del sitio" hidden></iframe>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="admin-barra-guardar"><button class="btn btn--primario btn--grande" type="button" data-guardar>Guardar cambios</button></div>';

    wirePanel();

    /* Si la vista quedó abierta la última vez, se abre sola. Volver a
       prenderla en cada visita sería una tarea diaria sin sentido. */
    var abierta = '';
    try { abierta = localStorage.getItem('vitalica_vista_abierta') || ''; } catch (e) {}
    if (abierta) vistaAbrir(true);
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
    /* --- LISTAS DINÁMICAS, LEÍDAS POR POSICIÓN -------------------------
       Ver el comentario de filaSlide(): estas filas no tienen data-ov
       porque el índice cambia al agregar o quitar. Se leen de arriba hacia
       abajo, que es el orden en que se van a ver en el sitio. */
    var leer = function (row, sel) {
      var el = row.querySelector(sel);
      return el ? el.value.trim() : '';
    };

    // Slides del carrusel
    var slides = [];
    app.querySelectorAll('.admin-slide').forEach(function (row) {
      var s = {
        eyebrow: leer(row, '.s-eyebrow'),
        titulo:  leer(row, '.s-titulo'),
        texto:   leer(row, '.s-texto'),
        modo:    leer(row, '.s-modo') || 'banner',
        imagen:  leer(row, '.s-imagen'),
        cta1: { texto: leer(row, '.s-c1t'), href: leer(row, '.s-c1h') },
        cta2: { texto: leer(row, '.s-c2t'), href: leer(row, '.s-c2h') }
      };
      // Un slide sin título ni imagen es una fila que alguien agregó y no
      // llenó. Guardarlo dejaría una portada en blanco rotando en el sitio.
      if (s.titulo || s.imagen) slides.push(s);
    });
    if (slides.length) ov.hero = slides;

    // Mensajes de la barra de anuncios
    var anuncios = [];
    app.querySelectorAll('.admin-anuncio').forEach(function (row) {
      var t = leer(row, '.a-texto');
      if (!t) return;
      var a = { texto: t };
      var d = leer(row, '.a-desde'), h = leer(row, '.a-hasta');
      if (d) a.desde = d;
      if (h) a.hasta = h;
      anuncios.push(a);
    });
    ov.config = ov.config || {};
    ov.config.anuncios = anuncios;

    // Atletas y nutricionistas
    var gente = [];
    app.querySelectorAll('.admin-persona').forEach(function (row) {
      var n = leer(row, '.g-nombre');
      if (!n) return;
      gente.push({
        nombre: n,
        rol: leer(row, '.g-rol') || 'nutricionista',
        instagram: leer(row, '.g-ig').replace('@', ''),
        foto: leer(row, '.g-foto'),
        disciplina: ''   // la ciudad se sacó el 24/9; el campo queda vacío
      });
    });
    ov.embajadores = ov.embajadores || {};
    ov.embajadores.gente = gente;

    // Pilares de "Ciencia real"
    var pilares = [];
    app.querySelectorAll('.admin-pilar').forEach(function (row) {
      var t = leer(row, '.p-titulo');
      if (!t) return;
      pilares.push({
        titulo: t,
        texto:  leer(row, '.p-texto'),
        foto:   leer(row, '.p-foto'),
        icono:  leer(row, '.p-icono')
      });
    });
    ov.ciencia = ov.ciencia || {};
    ov.ciencia.pilares = pilares;

    /* Catálogo de productos.
       --------------------------------------------------------------------
       El id es sagrado: es la dirección de la ficha (producto.html?id=...),
       la llave de las variantes y de las etiquetas, y está escrito en los
       pedidos que ya se hicieron. Para un producto que ya existe se
       respeta el que tiene; para uno nuevo se arma con el nombre, una sola
       vez, y después queda fijo porque viaja en un campo oculto. */
    function aSlug(s) {
      return (s || '').toString().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')  // saca las tildes
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    }
    var catalogo = [], variantes = {}, usados = {};
    app.querySelectorAll('.admin-producto').forEach(function (row) {
      var nombre = leer(row, '.d-nombre');
      if (!nombre) return;
      var id = leer(row, '.d-id') || aSlug(nombre);
      if (!id) return;
      // Dos productos con el mismo nombre darían el mismo id y uno pisaría
      // al otro en silencio. Al segundo se le agrega un sufijo.
      if (usados[id]) { id = id + '-' + (usados[id] + 1); }
      usados[id] = (usados[id] || 0) + 1;

      var campoId = row.querySelector('.d-id');
      if (campoId) campoId.value = id;   // queda fijo de acá en más

      var precioTxt = leer(row, '.d-precio').replace(/[^\d]/g, '');
      catalogo.push({
        id: id,
        nombre: nombre,
        categoria: leer(row, '.d-categoria'),
        precio: precioTxt === '' ? null : Number(precioTxt),
        imagen: leer(row, '.d-imagen'),
        resumen: leer(row, '.d-resumen'),
        descripcion: leer(row, '.d-descripcion'),
        modoDeUso: leer(row, '.d-modo'),
        destacado: !!(row.querySelector('.d-destacado') || {}).checked
      });

      var lista = [];
      row.querySelectorAll('.admin-variante').forEach(function (vr) {
        var sab = leer(vr, '.v-sabor'), tam = leer(vr, '.v-tamano'), cod = leer(vr, '.v-codigo');
        if (!sab && !tam && !cod) return;
        lista.push({
          codigo: cod,
          sabor: sab,
          icono: leer(vr, '.v-icono'),
          tamano: tam,
          imagen: leer(vr, '.v-imagen')
        });
      });
      if (lista.length) variantes[id] = lista;
    });
    if (catalogo.length) {
      ov.catalogo = catalogo;
      ov.variantes = variantes;
    }

    // Pop-ups de campaña
    var popups = [];
    app.querySelectorAll('.admin-popup').forEach(function (row, i) {
      var t = leer(row, '.o-titulo');
      if (!t) return;
      var c1t = leer(row, '.o-c1t'), c2t = leer(row, '.o-c2t');
      /* El id tiene que ser único Y estable: popups.js guarda en el navegador
         cuáles ya se cerraron, y si el id cambia, a quien lo cerró le vuelve
         a aparecer. Por eso se conserva el que ya tenía, y solo se inventa
         uno cuando la fila es nueva. */
      var id = leer(row, '.o-id') ||
               ('pop-' + Date.now().toString(36) + '-' + i);
      popups.push({
        id: id,
        activo: leer(row, '.o-activo') === 'si',
        etiqueta: leer(row, '.o-etiqueta'),
        titulo: t,
        texto: leer(row, '.o-texto'),
        imagen: leer(row, '.o-imagen'),
        cta:  c1t ? { texto: c1t, href: leer(row, '.o-c1h') } : null,
        cta2: c2t ? { texto: c2t, href: leer(row, '.o-c2h') } : null,
        paginas: leer(row, '.o-paginas').split(',')
                   .map(function (s) { return s.trim(); }).filter(Boolean),
        segundos: Number(leer(row, '.o-segundos') || 6),
        repetirDias: Number(leer(row, '.o-dias') || 7),
        desde: leer(row, '.o-desde'),
        hasta: leer(row, '.o-hasta'),
        soloUnaVez: !!(row.querySelector('.o-unavez') || {}).checked,
        noRepetirSiToco: !!(row.querySelector('.o-notoco') || {}).checked
      });
    });
    ov.popups = popups;

    // Tiendas (lista dinámica)
    var tiendas = [];
    app.querySelectorAll('.admin-tienda').forEach(function (row) {
      var n = row.querySelector('.t-nombre').value.trim();
      var c = row.querySelector('.t-ciudad').value.trim();
      var campoLogo = row.querySelector('.t-logo');
      var t = { nombre: n, ciudad: c, logo: campoLogo ? campoLogo.value : '' };

      /* Medidas del logo. Si la imagen se subió recién, las calculó el
         lector de archivos midiéndola de verdad. Si no, se buscan en la
         lista de fábrica por nombre, que es lo que pasaba hasta ahora con
         los diez comercios que ya estaban. */
      var a = (row.querySelector('.t-ancho') || {}).value;
      var al = (row.querySelector('.t-altura') || {}).value;
      if (a && al) {
        t.ancho = Number(a); t.altura = Number(al);
      } else if (typeof VITALICA_TIENDAS !== 'undefined') {
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

  /* ------------------------------------------------------------------
     PUBLICAR
     El panel guardaba solo en localStorage, o sea en la memoria del navegador
     de quien lo usaba: los cambios se veian en esa computadora y en ninguna
     otra. Para publicar de verdad habia que exportar el archivo y pedirle a
     quien programa que lo suba.

     Ahora se manda al servidor, que lo escribe en assets/js/data-overrides.js
     y ese archivo lo carga todo el sitio.

     El token sale de una consulta previa a la misma direccion. Sin eso,
     alcanzaria con que alguien con la sesion abierta visite una pagina
     preparada para que su navegador publique cambios sin que se entere.
     ------------------------------------------------------------------ */
  var cfgToken = '';

  function pedirToken(listo) {
    /* cache: 'no-store' no es un adorno. Esta respuesta lleva el token, que
       vale para una sesión, y el navegador la cacheaba: después de cerrar e
       iniciar sesión de nuevo seguía usando el token viejo, publicar seguía
       fallando y volver a entrar no arreglaba nada. */
    fetch('api/guardar-sitio.php', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) { cfgToken = (d && d.token) || ''; listo(); })
      .catch(function () { cfgToken = ''; listo(); });
  }

  /** Cuánto pesa, en MB, lo que se va a mandar. */
  function pesoMB(ov) {
    try { return (JSON.stringify(ov).length / 1024 / 1024).toFixed(1); }
    catch (e) { return '?'; }
  }

  /* Qué sección es la que pesa. Sirve para que el aviso diga dónde mirar en
     vez de mandar a revisar las catorce. */
  function masPesada(ov) {
    var peor = '', max = 0;
    Object.keys(ov || {}).forEach(function (k) {
      var n = 0;
      try { n = JSON.stringify(ov[k]).length; } catch (e) {}
      if (n > max) { max = n; peor = k; }
    });
    var nombres = {
      config: 'Marca / Logos, menú, Instagram o anuncios',
      hero: 'el carrusel', catalogo: 'los productos', variantes: 'los sabores',
      embajadores: 'atletas y nutricionistas', ciencia: 'Ciencia real',
      popups: 'los pop-ups', tiendas: 'los comercios aliados',
      campanas: 'etiquetas y promociones'
    };
    return nombres[peor] || peor;
  }

  function publicar() {
    var ov = guardar(true);
    var boton = app.querySelector('[data-publicar]');

    /* Aviso ANTES de mandar. El servidor igual lo va a rechazar, pero
       enterarse despues de esperar la subida de varios MB es peor, y el
       mensaje del servidor no puede decir cual seccion pesa porque recibe
       todo junto. */
    if (JSON.stringify(ov).length > 2.6 * 1024 * 1024) {
      toast('✗ Esto pesa ' + pesoMB(ov) + ' MB y el servidor acepta hasta 3. ' +
            'Lo más pesado es ' + masPesada(ov) + ': cambiá esa imagen por una más chica. ' +
            'No se publicó nada; tus cambios siguen guardados acá.');
      return;
    }

    if (boton) { boton.disabled = true; boton.textContent = 'Publicando…'; }

    /* Un solo reintento, y automático.
       -------------------------------------------------------------------
       El token se guarda en esta variable y se reusaba sin volver a pedirlo
       nunca: `if (cfgToken) mandar()`. Entonces, si el token quedaba viejo
       —porque la sesión se renovó, o porque el navegador sirvió la respuesta
       cacheada— publicar fallaba, y seguía fallando igual para siempre. La
       única salida era recargar la página, y nada lo decía.

       Ahora, ante un 401 o un 403, se pide un token nuevo y se manda otra
       vez. Si vuelve a fallar, ahí sí es de verdad y el mensaje se muestra. */
    var reintento = false;

    var mandar = function () {
      fetch('api/guardar-sitio.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cfgToken, overrides: ov })
      })
      /* El .json() va con su propio catch a propósito. Si el servidor
         contestara algo que no es JSON -una pantalla de error de PHP, una
         página del hosting- sin esto el fallo se mezclaba con el de red y
         los dos terminaban diciendo "¿Seguís conectado?", que era mentira
         la mitad de las veces. Acá se distingue y se muestra el código. */
      .then(function (r) {
        return r.json()
          .then(function (d) { return { ok: r.ok, estado: r.status, d: d }; })
          .catch(function () { return { ok: false, estado: r.status, d: null }; });
      })
      .then(function (res) {
        if (res.ok && res.d && res.d.ok) {
          /* El servidor avisa si tiró alguna sección por no estar en su
             lista blanca. Antes se perdían sin decir nada y el panel
             festejaba igual; así se perdieron las etiquetas durante semanas
             sin que nadie pudiera darse cuenta. */
          var fuera = res.d.ignoradas || [];
          if (fuera.length) {
            toast('⚠ Publicado, PERO el servidor no aceptó: ' + fuera.join(', ') +
                  '. Avisá que falta agregarlas en api/guardar-sitio.php.');
          } else {
            toast('✓ Publicado. Ya lo ven todos los visitantes.');
          }
          marcarEstado('publicado');
          return;
        }
        /* Token vencido o sesión renovada: se pide uno nuevo y se manda otra
           vez, una sola. Sin esto hacía falta recargar a mano. */
        if ((res.estado === 401 || res.estado === 403) && !reintento) {
          reintento = true;
          pedirToken(mandar);
          return;
        }

        if (res.d && res.d.error) { toast('✗ ' + res.d.error); return; }

        /* 413 = el pedido pesa demasiado. PHP tiene su propio tope además del
           nuestro, y cuando lo pasa contesta el servidor web directamente,
           sin JSON: por eso caía en el mensaje genérico "no entiendo", que no
           le dice a nadie qué hacer. Pasó con la imagen del sorteo. */
        if (res.estado === 413) {
          toast('✗ La configuración pesa demasiado para el servidor (' + pesoMB(ov) + ' MB). ' +
                'Casi siempre es una imagen: subí una más chica en la sección que acabás de tocar. ' +
                'Tus cambios siguen guardados acá.');
          return;
        }
        if (res.estado === 401 || res.estado === 403) {
          toast('✗ Se cerró tu sesión. Entrá de nuevo y volvé a publicar: lo que editaste no se perdió.');
          return;
        }
        /* Un 403 con el cuerpo vacío no viene de PHP: viene del servidor web,
           que corta antes. Pasó con el nombre del endpoint —ver el comentario
           arriba de api/guardar-sitio.php— y el mensaje genérico mandó a todo
           el mundo a buscar el problema en la sesión, donde no estaba. */
        if (res.estado === 403 && !res.d) {
          toast('✗ El servidor bloqueó el pedido antes de procesarlo (403 vacío). '
              + 'No es tu sesión: es una regla del hosting. Avisá y pasame esta frase.');
          return;
        }
        toast('✗ El servidor contestó algo que no entiendo (código ' + res.estado + '). '
            + 'Tus cambios siguen guardados acá.');
      })
      .catch(function () {
        toast('✗ No llegué al servidor. Revisá tu conexión; lo que editaste no se perdió.');
      })
      .then(function () {
        if (boton) { boton.disabled = false; boton.textContent = 'Publicar'; }
      });
    };

    if (cfgToken) mandar(); else pedirToken(mandar);
  }

  function marcarEstado(estado) {
    var e = app.querySelector('[data-estado]');
    if (!e) return;
    e.textContent = estado === 'publicado' ? 'publicado' : 'vista previa';
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
  /* ======================================================================
     VISTA EN VIVO
     ----------------------------------------------------------------------
     El sitio se dibuja solo a partir de data.js más el borrador guardado en
     localStorage (ver "LAS DOS CAPAS" en data.js). Así que para que la vista
     muestre lo que se está escribiendo alcanza con guardar el borrador y
     recargar el iframe: no hace falta tocar una sola línea del sitio, y lo
     que se ve es exactamente lo que verían los visitantes al publicar, no
     una simulación aparte que mañana se desincroniza.

     El precio es que escribir auto-guarda el borrador. Es lo que hace
     WordPress y es lo correcto acá: el aviso rojo de arriba dice que hay
     borrador sin publicar, y "Restablecer" lo descarta.
     ====================================================================== */
  var vistaTimer = null;
  var vistaActiva = false;

  function vistaMarco(cual) { return app.querySelector('[data-vista-' + cual + ']'); }

  function vistaEstado(txt) {
    var e = app.querySelector('[data-vista-estado]');
    if (e) e.textContent = txt || '';
  }

  /** Carga la página en el iframe escondido y recién ahí los intercambia. */
  function vistaRefrescar() {
    if (!vistaActiva) return;
    var a = vistaMarco('a'), b = vistaMarco('b');
    if (!a || !b) return;

    var visible = a.hidden ? b : a;
    var oculto  = a.hidden ? a : b;

    var sel = app.querySelector('[data-vista-pagina]');
    var pagina = (sel && sel.value) || 'index.html';

    vistaEstado('actualizando…');
    guardar(true);   // el borrador es lo que la vista va a leer

    oculto.onload = function () {
      oculto.onload = null;
      /* Se mantiene la posición de scroll entre recargas. Sin esto, tocar
         una coma en "Comercios aliados" devolvía la vista al encabezado y
         había que bajar de nuevo cada vez. */
      try {
        var y = visible.contentWindow.scrollY;
        if (y) oculto.contentWindow.scrollTo(0, y);
      } catch (e) { /* otra página, otro origen: no pasa nada */ }
      oculto.hidden = false;
      visible.hidden = true;
      vistaEstado('al día');
    };
    // El sello de tiempo evita que el navegador sirva la página de su cache.
    oculto.src = pagina + (pagina.indexOf('?') === -1 ? '?' : '&') + 'vp=' + Date.now();
  }

  /** Se llama en cada tecleo; espera a que la persona pare de escribir. */
  function vistaPedirRefresco() {
    if (!vistaActiva) return;
    vistaEstado('escribiendo…');
    clearTimeout(vistaTimer);
    vistaTimer = setTimeout(vistaRefrescar, 700);
  }

  function vistaAbrir(abrir) {
    vistaActiva = !!abrir;
    var split = app.querySelector('[data-split]');
    if (split) split.classList.toggle('admin-split--con-vista', vistaActiva);
    try { localStorage.setItem('vitalica_vista_abierta', vistaActiva ? '1' : ''); } catch (e) {}
    if (vistaActiva) vistaRefrescar();
  }

  function wirePanel() {
    // Subir imagen → base64 → preview + input oculto
    app.addEventListener('change', function (e) {
      var f = e.target.closest('.admin-file');
      if (f && f.files && f.files[0]) {
        var id = f.getAttribute('data-file');
        var reader = new FileReader();
        reader.onload = function () {
          var hidden = document.getElementById(id);
          var prev = app.querySelector('[data-prev="' + id + '"]');

          /* LA IMAGEN SE ACHICA ACÁ, ANTES DE GUARDARLA.
             ----------------------------------------------------------------
             Todas las imágenes del panel viajan adentro de la configuración
             como texto (data:), y el servidor acepta 3 MB en total. Una foto
             de celular sola se come eso.

             Pasó: marketing subió la placa del sorteo, toco Publicar, y la
             imagen no cambió. El servidor la rechazaba entera por tamaño y
             el aviso pasaba desapercibido. Pedirle a alguien que achique un
             archivo antes de subirlo es pedirle que haga el trabajo de la
             herramienta.

             Se achica al lado largo de 1200 px, que sobra para cualquier
             lugar del sitio. Un PNG se guarda como PNG para no perder la
             transparencia -los logos la necesitan-; el resto sale JPG, que
             para una foto pesa una fracción. */
          var original = reader.result;

          /* ¿Tiene transparencia de verdad?
             ----------------------------------------------------------------
             Esto antes se decidía por la extensión: si era PNG, se guardaba
             PNG para no perderle la transparencia a los logos. El error es
             que PNG comprime fatal las fotos, y marketing exporta sus placas
             de campaña en PNG. La del sorteo pesaba 2,7 MB DESPUÉS de
             achicarla, y el panel la rechazaba igual.

             Lo que importa no es la extensión sino si hay píxeles
             transparentes. Se revisa el canal alfa de una muestra —no de los
             millones de píxeles, que trabaría el navegador— y con eso se
             decide: con transparencia va PNG, sin transparencia va JPG, que
             para una foto pesa una fracción. */
          function tieneTransparencia(lienzo, cx) {
            try {
              var d = cx.getImageData(0, 0, lienzo.width, lienzo.height).data;
              // Un píxel de cada 40: alcanza para encontrar un fondo recortado
              // y es instantáneo incluso en imágenes grandes.
              for (var i = 3; i < d.length; i += 4 * 40) {
                if (d[i] < 250) return true;
              }
            } catch (e) { return true; }   // ante la duda, no se pierde nada
            return false;
          }

          var medidor = new Image();
          medidor.onload = function () {
            var w = medidor.width, h = medidor.height;
            var dato = original;

            if (w && h) {
              var esc = Math.min(1, 1200 / Math.max(w, h));
              var cw = Math.round(w * esc), ch = Math.round(h * esc);
              // Se reescribe aunque no haya que achicar: una foto de celular
              // de 1000 px puede pesar 4 MB igual, y el re-encode la baja.
              try {
                var lienzo = document.createElement('canvas');
                lienzo.width = cw; lienzo.height = ch;
                var cx = lienzo.getContext('2d');
                cx.drawImage(medidor, 0, 0, cw, ch);

                var reducida = tieneTransparencia(lienzo, cx)
                  ? lienzo.toDataURL('image/png')
                  : lienzo.toDataURL('image/jpeg', 0.85);

                /* Un PNG con transparencia y mucho detalle puede seguir
                   pesando de más. Se baja de tamaño antes que de calidad:
                   perder transparencia rompe el logo, perder 300 px no se
                   nota en pantalla. */
                var vuelta = 0;
                while (reducida.length > 700 * 1024 && vuelta < 3) {
                  vuelta++;
                  lienzo.width  = Math.round(lienzo.width * 0.7);
                  lienzo.height = Math.round(lienzo.height * 0.7);
                  cx = lienzo.getContext('2d');
                  cx.drawImage(medidor, 0, 0, lienzo.width, lienzo.height);
                  reducida = tieneTransparencia(lienzo, cx)
                    ? lienzo.toDataURL('image/png')
                    : lienzo.toDataURL('image/jpeg', 0.85);
                }

                // Solo se usa si realmente quedó más liviana.
                if (reducida && reducida.length < original.length) dato = reducida;
              } catch (e) { /* si el navegador no deja, va la original */ }
            }

            if (hidden) hidden.value = dato;
            if (prev) prev.src = dato;

            var kb = Math.round(dato.length * 0.75 / 1024);
            if (kb > 900) {
              toast('⚠ Esa imagen pesa ' + kb + ' KB aun achicada. Si al publicar da error ' +
                    'de tamaño, probá con una más chica.');
            }
            medir(hidden, prev);
          };
          medidor.onerror = function () {
            if (hidden) hidden.value = original;
            if (prev) prev.src = original;
            medir(hidden, prev);
          };
          medidor.src = original;

          /* Medidas del logo de comercio aliado. Se mide la imagen YA
             achicada, no la original: los logos vienen con proporciones muy
             distintas -hay uno de 190x27 y otro de 111x61- y sin medida
             propia saldrian todos con la misma. Se encajan en una caja de
             190x52 conservando la proporcion. */
          function medir(campo, vista) {
            if (!campo || !campo.classList.contains('t-logo')) return;
            var fila = campo.closest('.admin-tienda');
            if (!fila) return;
            var m = new Image();
            m.onload = function () {
              if (!m.width || !m.height) return;
              var e2 = Math.min(190 / m.width, 52 / m.height);
              var a = fila.querySelector('.t-ancho'), al = fila.querySelector('.t-altura');
              if (a)  a.value  = Math.round(m.width * e2);
              if (al) al.value = Math.round(m.height * e2);
            };
            m.src = campo.value;
          }
        };
        reader.readAsDataURL(f.files[0]);
        return;
      }
      var imp = e.target.closest('[data-importar]');
      if (imp && imp.files && imp.files[0]) importar(imp.files[0]);
    });

    /* Cualquier cambio en el formulario pide refrescar la vista. Va con
       'input' además de 'change' para que se vea mientras se escribe y no
       recién al salir del campo, que es la diferencia entre "dinámico" y
       "otro formulario más". */
    app.addEventListener('input', function (e) {
      if (e.target.closest('.admin-form')) vistaPedirRefresco();
    });
    app.addEventListener('change', function (e) {
      if (e.target.closest('.admin-form')) vistaPedirRefresco();
      /* El selector de página vive en la barra de la vista, no en el
         formulario, así que no lo agarra la línea de arriba. Y acá se
         refresca de una, sin esperar: no es tecleo, es una decisión. */
      if (e.target.closest('[data-vista-pagina]')) vistaRefrescar();
    });

    app.addEventListener('click', function (e) {
      /* Agregar y quitar filas no disparan 'input', así que se refresca acá.
         setTimeout(0) para que corra después de que el nodo se agregó. */
      if (e.target.closest('[data-add-tienda],[data-add-slide],[data-add-anuncio],' +
                           '[data-add-persona],[data-add-pilar],[data-add-popup],' +
                           '[data-add-producto],[data-add-variante],[data-del-tienda],' +
                           '[data-del-slide],[data-del-anuncio],[data-del-persona],' +
                           '[data-del-pilar],[data-del-popup],[data-del-producto],' +
                           '[data-del-variante]')) {
        setTimeout(vistaPedirRefresco, 0);
      }

      if (e.target.closest('[data-vista-abrir]')) { vistaAbrir(true); return; }
      if (e.target.closest('[data-vista-cerrar]')) { vistaAbrir(false); return; }

      var ancho = e.target.closest('[data-ancho]');
      if (ancho) {
        var marco = app.querySelector('[data-vista-marco]');
        app.querySelectorAll('[data-ancho]').forEach(function (b) { b.classList.remove('on'); });
        ancho.classList.add('on');
        if (marco) marco.style.maxWidth = ancho.getAttribute('data-ancho') === 'suelto'
          ? '' : ancho.getAttribute('data-ancho') + 'px';
        return;
      }

      if (e.target.closest('[data-publicar]')) publicar();
      else if (e.target.closest('[data-guardar]')) { guardar(); marcarEstado('borrador'); }
      else if (e.target.closest('[data-exportar]')) exportar();
      else if (e.target.closest('[data-reset]')) restablecer();
      else if (e.target.closest('[data-add-tienda]')) {
        app.querySelector('[data-tiendas]').insertAdjacentHTML('beforeend', filaTienda({}));
      }
      else if (e.target.closest('[data-add-slide]')) {
        app.querySelector('[data-slides]').insertAdjacentHTML('beforeend', filaSlide(null));
      }
      else if (e.target.closest('[data-add-anuncio]')) {
        app.querySelector('[data-anuncios]').insertAdjacentHTML('beforeend', filaAnuncio(''));
      }
      else if (e.target.closest('[data-add-persona]')) {
        app.querySelector('[data-gente]').insertAdjacentHTML('beforeend', filaPersona(null));
      }
      else if (e.target.closest('[data-add-pilar]')) {
        app.querySelector('[data-pilares]').insertAdjacentHTML('beforeend', filaPilar(null));
      }
      else if (e.target.closest('[data-add-popup]')) {
        app.querySelector('[data-popups]').insertAdjacentHTML('beforeend', filaPopup(null));
      }
      else if (e.target.closest('[data-add-producto]')) {
        app.querySelector('[data-productos]').insertAdjacentHTML('beforeend', filaProducto(null));
      }
      else if (e.target.closest('[data-add-variante]')) {
        var prod = e.target.closest('.admin-producto');
        if (prod) prod.querySelector('.admin-variantes').insertAdjacentHTML('beforeend', filaVariante(null));
      }
      else {
        /* Quitar. Una sola rama para todas las listas: cada botón dice de
           qué fila cuelga y acá se busca ese ancestro. Agregar una lista
           nueva es agregar un par acá y nada más.

           Pide confirmación porque no hay deshacer dentro del panel: lo que
           sí hay es "Restablecer", que tira TODO el borrador, y usar eso
           para recuperar una fila borrada por error es desproporcionado. */
        var quitar = [
          ['[data-del-tienda]',  '.admin-tienda',  'este comercio'],
          ['[data-del-slide]',   '.admin-slide',   'este slide del carrusel'],
          ['[data-del-anuncio]', '.admin-anuncio', 'este mensaje'],
          ['[data-del-persona]', '.admin-persona', 'a esta persona'],
          ['[data-del-pilar]',   '.admin-pilar',   'este pilar'],
          ['[data-del-popup]',   '.admin-popup',   'este pop-up'],
          ['[data-del-producto]','.admin-producto','este producto del catalogo'],
          ['[data-del-variante]','.admin-variante','este sabor o tamano']
        ];
        for (var i = 0; i < quitar.length; i++) {
          if (e.target.closest(quitar[i][0])) {
            var fila = e.target.closest(quitar[i][1]);
            if (fila && confirm('¿Quitar ' + quitar[i][2] + '?\n\nSe va a ir cuando guardes o publiques.')) {
              fila.remove();
            }
            break;
          }
        }
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
