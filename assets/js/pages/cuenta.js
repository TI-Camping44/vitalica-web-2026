/* ==========================================================================
   VITALICA — pages/cuenta.js  ·  LA PÁGINA DE CUENTA
   --------------------------------------------------------------------------
   Una sola página para tres estados, porque son el mismo lugar visto en
   momentos distintos:

     sin sesión        ingresar / crear cuenta
     con sesión        tus datos, tus pedidos, cerrar sesión
     perfil incompleto pedirle el celular antes de seguir

   Tres archivos .html separados obligarían a decidir a cuál mandar a cada
   visitante ANTES de saber si tiene sesión, y esa decisión solo se puede
   tomar después de preguntarle al servidor.

   TODO LO QUE DECIDE PASA EN EL SERVIDOR
   --------------------------------------
   Acá no se valida nada de verdad. Se revisa lo mínimo para no mandar un
   formulario obviamente vacío, pero quien dice si una contraseña sirve, si
   un correo ya existe o si alguien puede ver un pedido es api/cuenta.php.
   Cualquier revisión que viva solo en esta página se saltea abriendo la
   consola del navegador.

   POR QUÉ SE REDIBUJA TODO Y NO SE ACTUALIZAN PARTES
   --------------------------------------------------
   Cada acción vuelve a pintar la pantalla entera con el estado nuevo. Es más
   trabajo para el navegador y ni se nota: son cuatro formularios. A cambio,
   no hay forma de que quede un pedazo mostrando datos viejos, que es el error
   más común y el más difícil de encontrar en una pantalla con sesión.
   ========================================================================== */
(function () {
  'use strict';

  var caja = document.querySelector('[data-cuenta]');
  if (!caja) return;

  var API = 'api/cuenta.php';
  var yo = null;          // el cliente conectado, o null
  var googleId = '';      // el client_id de Google; vacio = sin boton
  var vista = 'ingreso';  // 'ingreso' | 'registro'

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* El teléfono se guarda como 595981123456. Mostrarlo así es ilegible, y a
     nadie le sirve reconocer su propio número en ese formato. */
  function telefonoLindo(t) {
    var d = String(t || '').replace(/\D/g, '');
    if (/^5959\d{8}$/.test(d)) {
      return '0' + d.slice(3, 6) + ' ' + d.slice(6, 9) + ' ' + d.slice(9);
    }
    return t || '';
  }

  function guaranies(n) {
    var v = Number(n) || 0;
    return 'Gs. ' + v.toLocaleString('es-PY');
  }

  function fechaLinda(f) {
    var d = new Date(String(f || '').replace(' ', 'T') + 'Z');
    if (isNaN(d)) return f || '';
    return d.toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /* ------------------------------------------------------------------
     Hablar con el servidor
     ------------------------------------------------------------------ */
  function pedir(datos) {
    return fetch(API, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
    .then(function (r) {
      return r.json().catch(function () {
        /* Si el servidor devolvió algo que no es JSON —un error de PHP, una
           página de mantenimiento— no se puede leer el mensaje. Decirle
           "error inesperado" a alguien que está intentando entrar no ayuda,
           pero al menos no se queda mirando un botón que no hace nada. */
        return { ok: false, error: 'El servidor contestó algo raro. Probá de nuevo en un momento.' };
      });
    })
    .catch(function () {
      return { ok: false, error: 'No hay conexión con el servidor. Revisá tu internet.' };
    });
  }

  function mostrarError(texto) {
    var d = caja.querySelector('[data-error]');
    if (!d) return;
    d.textContent = texto || '';
    d.hidden = !texto;
  }

  function ocupado(si) {
    var b = caja.querySelectorAll('button[type="submit"]');
    for (var i = 0; i < b.length; i++) {
      b[i].disabled = si;
      if (si) { b[i].dataset.antes = b[i].textContent; b[i].textContent = 'Un momento…'; }
      else if (b[i].dataset.antes) { b[i].textContent = b[i].dataset.antes; }
    }
  }

  /* ------------------------------------------------------------------
     Las pantallas
     ------------------------------------------------------------------ */
  function pantallaSinSesion() {
    var esIngreso = vista === 'ingreso';

    return '' +
      '<div class="contenedor cuenta">' +
        '<div class="cuenta__caja">' +

          '<div class="cuenta__tabs" role="tablist">' +
            '<button class="cuenta__tab' + (esIngreso ? ' es-activo' : '') + '" type="button" data-ver="ingreso">Ingresar</button>' +
            '<button class="cuenta__tab' + (!esIngreso ? ' es-activo' : '') + '" type="button" data-ver="registro">Crear cuenta</button>' +
          '</div>' +

          '<p class="cuenta__intro">' +
            (esIngreso
              ? 'Entrá para ver tus pedidos y tener tus datos cargados la próxima vez.'
              : 'Con una cuenta no tenés que volver a escribir tus datos en cada compra, y podés ver lo que pediste antes.') +
          '</p>' +

          '<p class="cuenta__error" data-error hidden></p>' +

          '<form data-form="' + (esIngreso ? 'ingreso' : 'registro') + '" novalidate>' +

            (esIngreso ? '' :
              '<div class="campo">' +
                '<label for="c-nombre">Nombre y apellido</label>' +
                '<input id="c-nombre" name="nombre" type="text" autocomplete="name" required>' +
              '</div>' +
              '<div class="campo">' +
                '<label for="c-telefono">Celular</label>' +
                '<input id="c-telefono" name="telefono" type="tel" inputmode="tel" ' +
                       'autocomplete="tel" placeholder="0981 123 456" required>' +
                '<span class="campo__ayuda">Por acá coordinamos la entrega. Solo celulares.</span>' +
              '</div>') +

            '<div class="campo">' +
              '<label for="c-email">Correo</label>' +
              '<input id="c-email" name="email" type="email" inputmode="email" ' +
                     'autocomplete="email" required>' +
            '</div>' +

            '<div class="campo">' +
              '<label for="c-clave">Contraseña</label>' +
              '<input id="c-clave" name="clave" type="password" ' +
                     'autocomplete="' + (esIngreso ? 'current-password' : 'new-password') + '" required>' +
              (esIngreso ? '' : '<span class="campo__ayuda">Ocho caracteres o más.</span>') +
            '</div>' +

            '<button class="btn btn--primario btn--bloque" type="submit">' +
              (esIngreso ? 'Entrar' : 'Crear mi cuenta') +
            '</button>' +
          '</form>' +

          (googleId ?
            '<div class="cuenta__o"><span>o</span></div>' +
            '<div class="cuenta__google" data-google></div>' : '') +

          '<p class="cuenta__pie">' +
            'Podés comprar sin cuenta cuando quieras. ' +
            '<a href="productos.html">Ver productos</a>.' +
          '</p>' +

        '</div>' +
      '</div>';
  }

  /* Google no entrega el teléfono, nunca. Así que una cuenta creada con
     Google llega sin él, y sin teléfono no se puede coordinar una entrega.
     Esta pantalla es la que cierra ese hueco. */
  function pantallaCompletar() {
    return '' +
      '<div class="contenedor cuenta">' +
        '<div class="cuenta__caja">' +
          '<h1 class="cuenta__titulo">Falta tu celular</h1>' +
          '<p class="cuenta__intro">Hola, ' + esc(yo.nombre) + '. Nos falta un dato para poder ' +
            'coordinar las entregas: los pedidos los cerramos por WhatsApp.</p>' +
          '<p class="cuenta__error" data-error hidden></p>' +
          '<form data-form="perfil" novalidate>' +
            '<input type="hidden" name="nombre" value="' + esc(yo.nombre) + '">' +
            '<div class="campo">' +
              '<label for="c-telefono">Celular</label>' +
              '<input id="c-telefono" name="telefono" type="tel" inputmode="tel" ' +
                     'autocomplete="tel" placeholder="0981 123 456" required autofocus>' +
            '</div>' +
            '<button class="btn btn--primario btn--bloque" type="submit">Guardar</button>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  function pantallaConSesion() {
    return '' +
      '<div class="contenedor cuenta cuenta--adentro">' +

        '<header class="cuenta__cabecera">' +
          '<p class="eyebrow">Mi cuenta</p>' +
          '<h1>Hola, ' + esc(yo.nombre.split(' ')[0]) + '</h1>' +
        '</header>' +

        '<p class="cuenta__error" data-error hidden></p>' +

        '<div class="cuenta__grid">' +

          '<section class="cuenta__bloque">' +
            '<h2>Tus datos</h2>' +
            '<form data-form="perfil" novalidate>' +
              '<div class="campo">' +
                '<label for="c-nombre">Nombre y apellido</label>' +
                '<input id="c-nombre" name="nombre" type="text" autocomplete="name" ' +
                       'value="' + esc(yo.nombre) + '" required>' +
              '</div>' +
              '<div class="campo">' +
                '<label for="c-telefono">Celular</label>' +
                '<input id="c-telefono" name="telefono" type="tel" inputmode="tel" ' +
                       'autocomplete="tel" value="' + esc(telefonoLindo(yo.telefono)) + '" required>' +
              '</div>' +
              '<div class="campo">' +
                '<label for="c-email">Correo</label>' +
                '<input id="c-email" type="email" value="' + esc(yo.email) + '" disabled>' +
                '<span class="campo__ayuda">El correo identifica tu cuenta y no se cambia acá. ' +
                  'Si lo necesitás, escribinos.</span>' +
              '</div>' +
              '<button class="btn btn--primario" type="submit">Guardar cambios</button>' +
            '</form>' +
          '</section>' +

          '<section class="cuenta__bloque">' +
            '<h2>' + (yo.conClave ? 'Cambiar contraseña' : 'Poner una contraseña') + '</h2>' +
            (yo.conClave ? '' :
              '<p class="cuenta__nota">Entraste con Google, así que todavía no tenés ' +
              'contraseña acá. Si le ponés una, vas a poder entrar de las dos formas.</p>') +
            '<form data-form="clave" novalidate>' +
              (yo.conClave ?
                '<div class="campo">' +
                  '<label for="c-actual">Contraseña actual</label>' +
                  '<input id="c-actual" name="actual" type="password" ' +
                         'autocomplete="current-password" required>' +
                '</div>' : '') +
              '<div class="campo">' +
                '<label for="c-nueva">' + (yo.conClave ? 'Nueva contraseña' : 'Contraseña') + '</label>' +
                '<input id="c-nueva" name="nueva" type="password" autocomplete="new-password" required>' +
                '<span class="campo__ayuda">Ocho caracteres o más.</span>' +
              '</div>' +
              '<button class="btn btn--contorno" type="submit">Guardar</button>' +
            '</form>' +
          '</section>' +

        '</div>' +

        '<section class="cuenta__bloque cuenta__bloque--ancho">' +
          '<h2>Tus pedidos</h2>' +
          '<div data-pedidos><p class="texto-apagado">Buscando…</p></div>' +
        '</section>' +

        '<footer class="cuenta__salidas">' +
          '<button class="btn btn--contorno" type="button" data-salir>Cerrar sesión</button>' +
          '<button class="btn btn--fino" type="button" data-salir-todo>' +
            'Cerrar sesión en todos los dispositivos</button>' +
        '</footer>' +

      '</div>';
  }

  /* ------------------------------------------------------------------
     Pintar
     ------------------------------------------------------------------ */
  function pintar() {
    if (!yo)                caja.innerHTML = pantallaSinSesion();
    else if (!yo.completo)  caja.innerHTML = pantallaCompletar();
    else {
      caja.innerHTML = pantallaConSesion();
      traerPedidos();
    }
    var foco = caja.querySelector('input:not([disabled])');
    if (foco && !yo) foco.focus();

    dibujarGoogle();
  }


  /* ------------------------------------------------------------------
     EL BOTON DE GOOGLE

     Se dibuja despues de cada repintado porque la pantalla se rehace
     entera, y el boton que dibuja Google vive en el DOM: si no se lo
     vuelve a pedir, queda el hueco vacio.

     El script de Google se carga UNA sola vez y recien cuando hace falta.
     Si alguien entra con la sesion ya abierta, no se le pide nada a un
     servidor ajeno. Eso no es solo velocidad: es no contarle a Google que
     esa persona entro, cuando no hay ningun motivo para hacerlo.
     ------------------------------------------------------------------ */
  var googleCargando = false;

  function dibujarGoogle() {
    var hueco = caja.querySelector('[data-google]');
    if (!hueco || !googleId) return;

    if (window.google && window.google.accounts && window.google.accounts.id) {
      pintarBotonGoogle(hueco);
      return;
    }
    if (googleCargando) return;
    googleCargando = true;

    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = function () {
      var h = caja.querySelector('[data-google]');
      if (h) pintarBotonGoogle(h);
    };
    /* Si el script no carga -sin internet, una red que bloquea Google- no se
       muestra ningun error: el formulario de correo y contrasena sigue ahi y
       funciona. Un cartel rojo por algo que la persona no puede arreglar solo
       la asusta. */
    s.onerror = function () { googleCargando = false; };
    document.head.appendChild(s);
  }

  function pintarBotonGoogle(hueco) {
    try {
      window.google.accounts.id.initialize({
        client_id: googleId,
        callback: entrarConGoogle,
        /* Sin la ventanita que aparece sola arriba a la derecha. Tapa el
           contenido, sorprende, y en esta pagina el boton ya esta a la vista. */
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.google.accounts.id.renderButton(hueco, {
        theme: 'outline',
        size: 'large',
        width: 340,
        shape: 'pill',
        text: 'continue_with',
        locale: 'es'
      });
    } catch (e) { /* si Google cambia su interfaz, queda el formulario normal */ }
  }

  function entrarConGoogle(respuesta) {
    if (!respuesta || !respuesta.credential) return;
    mostrarError('');
    pedir({ accion: 'google', credential: respuesta.credential }).then(function (r) {
      if (!r.ok) { mostrarError(r.error || 'No se pudo entrar con Google.'); return; }
      yo = r.cliente || null;
      pintar();
    });
  }

  function traerPedidos() {
    var d = caja.querySelector('[data-pedidos]');
    if (!d) return;

    pedir({ accion: 'pedidos' }).then(function (r) {
      if (!r.ok || !r.pedidos || !r.pedidos.length) {
        d.innerHTML =
          '<p class="texto-apagado">Todavía no hiciste ningún pedido.</p>' +
          '<a class="btn btn--primario mt-4" href="productos.html">Ver productos</a>';
        return;
      }
      d.innerHTML =
        '<ul class="cuenta__pedidos">' +
        r.pedidos.map(function (p) {
          return '<li class="cuenta__pedido">' +
                   '<div>' +
                     '<strong>' + esc(p.numero) + '</strong>' +
                     '<span class="cuenta__pedido-fecha">' + esc(fechaLinda(p.creado)) + '</span>' +
                   '</div>' +
                   '<div class="cuenta__pedido-der">' +
                     '<span class="cuenta__pedido-total">' + guaranies(p.total) + '</span>' +
                     '<span class="cuenta__pedido-estado">' + esc(p.estado || 'nuevo') + '</span>' +
                   '</div>' +
                 '</li>';
        }).join('') +
        '</ul>';
    });
  }

  /* ------------------------------------------------------------------
     Lo que hace la gente
     ------------------------------------------------------------------ */
  caja.addEventListener('click', function (e) {
    var tab = e.target.closest('[data-ver]');
    if (tab) { vista = tab.dataset.ver; pintar(); return; }

    if (e.target.closest('[data-salir]')) {
      pedir({ accion: 'salir' }).then(function () { yo = null; vista = 'ingreso'; pintar(); });
      return;
    }

    if (e.target.closest('[data-salir-todo]')) {
      pedir({ accion: 'salir-de-todo' }).then(function () { yo = null; vista = 'ingreso'; pintar(); });
    }
  });

  caja.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    mostrarError('');

    var datos = { accion: form.dataset.form };
    var campos = form.querySelectorAll('input[name]');
    for (var i = 0; i < campos.length; i++) {
      datos[campos[i].name] = campos[i].value;
    }

    /* Lo único que se revisa acá: que no esté vacío. Todo lo demás lo decide
       el servidor, que es el que no se puede saltear. */
    var vacio = false;
    for (var k = 0; k < campos.length; k++) {
      if (campos[k].required && !campos[k].value.trim()) { vacio = true; campos[k].focus(); break; }
    }
    if (vacio) { mostrarError('Completá los campos que faltan.'); return; }

    ocupado(true);
    pedir(datos).then(function (r) {
      ocupado(false);
      if (!r.ok) { mostrarError(r.error || 'No se pudo.'); return; }

      if (datos.accion === 'clave') {
        /* Acá no hay que repintar: los datos no cambiaron y repintar borraría
           el aviso antes de que alcance a leerlo. */
        form.reset();
        mostrarError('');
        avisar('Contraseña actualizada.');
        return;
      }

      yo = r.cliente || null;
      pintar();
      if (datos.accion === 'perfil') avisar('Datos guardados.');
    });
  });

  /* Un aviso que se va solo. No usa alert() porque eso frena la página entera
     y en el celular tapa todo. */
  function avisar(texto) {
    var p = document.createElement('p');
    p.className = 'cuenta__aviso';
    p.textContent = texto;
    var c = caja.querySelector('.cuenta');
    if (c) c.insertBefore(p, c.firstChild);
    setTimeout(function () { p.remove(); }, 4000);
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */
  pedir({ accion: 'yo' }).then(function (r) {
    yo = (r && r.ok && r.cliente) || null;
    googleId = (r && r.googleId) || '';

    /* ?crear en la dirección abre directo el formulario de alta. Lo usan los
       enlaces de "creá tu cuenta" que hay en otras páginas: mandar a alguien
       a una pantalla de ingreso cuando toco "crear cuenta" es el tipo de cosa
       que hace que se vaya. */
    try {
      if (new URLSearchParams(location.search).has('crear')) vista = 'registro';
    } catch (err) {}

    pintar();
  });

})();
