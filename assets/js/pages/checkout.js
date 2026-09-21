/* ==========================================================================
   VITALICA — pages/checkout.js  ·  ARMAR PEDIDO POR WHATSAPP
   --------------------------------------------------------------------------
   La venta NO se cobra en el sitio: se cierra por WhatsApp con un asesor.
   Este paso final junta los datos del cliente y arma un mensaje prolijo con
   el pedido completo, que se abre directamente en el chat de Vitalica.

   Flujo:
     1) Datos de contacto
     2) Entrega: Gran Asunción / Interior / Retiro en un local
     3) Cómo va a pagar
     4) "Enviar pedido por WhatsApp" → abre wa.me con todo precargado

   QUÉ SÍ Y QUÉ NO HACE ESTO
   -------------------------
   Sí: calcula el envío según la zona, suma el total, numera el pedido y se lo
   manda al asesor con todos los datos para que no haya que preguntar nada.
   No: no cobra. No hay pasarela, no se toca una tarjeta y no se guarda ningún
   dato en ningún servidor — el pedido viaja por WhatsApp y nada más.

   El número de pedido es del lado del cliente: sirve para que las dos partes
   hablen del mismo pedido ("el VIT-...") sin backend. No garantiza unicidad
   absoluta; cuando exista base de datos, el número lo da ella.

   NOTA (IT): si más adelante se integra una pasarela (Bancard vPOS 2.0), el
   punto de reemplazo es la función enviarPedido(): en vez de abrir WhatsApp,
   ahí se crea la operación de pago. Ver HANDOFF-IT.md, sección 5.1.
   ========================================================================== */
(function () {
  var cont = document.querySelector('[data-checkout]');
  if (!cont) return;

  // Tomamos una "foto" de los items al entrar al checkout
  var items = Carrito.itemsDetallados();

  // --- Carrito vacío: no hay pedido que armar ---
  if (items.length === 0) {
    cont.innerHTML =
      '<div class="carrito-vacio">' +
        '<h2>Tu carrito está vacío</h2>' +
        '<p class="texto-apagado">Agregá productos antes de armar tu pedido.</p>' +
        '<a class="btn btn--primario btn--grande" href="productos.html">Ver productos</a>' +
      '</div>';
    return;
  }

  function fmt(v) { return v == null ? 'A confirmar' : Vitalica.formatearGs(v); }

  var envios  = VITALICA_CONFIG.envio || {};
  var metodos = (VITALICA_CONFIG.pagos && VITALICA_CONFIG.pagos.metodos) || [];

  /* Puntos de retiro PROPIOS. No son los aliados comerciales: en un local
     de un tercero se puede comprar, pero no retirar un pedido de la web.
     Si la lista está vacía, la opción de retiro no se ofrece. */
  var puntosRetiro = (VITALICA_CONFIG.retiro && VITALICA_CONFIG.retiro.puntos) || [];
  var hayRetiro = puntosRetiro.length > 0;

  var checkIcon = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  var waIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1a14 14 0 0 1-6-5.3c-.5-.7-.8-1.6-.8-2.4 0-.9.5-1.4.7-1.6.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.3.5.8 1.2 1.4 1.7.8.7 1.4.9 1.7 1 .2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3.1.2.1.7-.1 1.4Z"/></svg>';
  var pdfIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  /* ---- Número de pedido ----------------------------------------------------
     Formato VIT-AAMMDD-XXXX. Lo genera el navegador: sirve como referencia
     compartida en la conversación de WhatsApp, no como identificador de
     sistema. Cuando haya backend, el número lo emite el backend. */
  function generarNumero() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    var fecha = String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
    var azar = String(Math.floor(Math.random() * 9000) + 1000);
    return 'VIT-' + fecha + '-' + azar;
  }
  var numeroPedido = generarNumero();

  /* ---- Costo del envío según la zona elegida ------------------------------
     Devuelve un número (0 = gratis) o null si la tarifa no está cargada,
     en cuyo caso el sitio dice "a confirmar" en vez de inventar un monto. */
  function costoEnvio(entrega) {
    if (entrega === 'retiro') return 0;
    var sub = Carrito.subtotal();
    if (envios.gratisDesde != null && sub != null && sub >= envios.gratisDesde) return 0;
    if (entrega === 'gran-asuncion') return envios.granAsuncion != null ? envios.granAsuncion : null;
    if (entrega === 'interior')      return envios.interior     != null ? envios.interior     : null;
    return null;
  }
  function etiquetaCosto(entrega) {
    var c = costoEnvio(entrega);
    if (c === null) return 'Costo a confirmar';
    if (c === 0)    return entrega === 'retiro' ? 'Sin costo' : 'Envío gratis';
    return Vitalica.formatearGs(c);
  }

  // ---- Helpers de render ----
  function campo(label, name, tipo, req) {
    return '<div class="campo">' +
      '<label for="c-' + name + '">' + label + (req ? '' : ' <span class="texto-apagado">(opcional)</span>') + '</label>' +
      '<input id="c-' + name + '" name="' + name + '" type="' + tipo + '"' + (req ? ' required' : '') + '>' +
    '</div>';
  }
  function opcionEntrega(val, titulo, desc, checked) {
    return '<label class="opcion">' +
      '<input type="radio" name="entrega" value="' + val + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="opcion__texto"><strong>' + titulo + '</strong><span class="opcion__desc">' + desc + '</span></span>' +
      '<span class="opcion__precio" data-costo="' + val + '">' + etiquetaCosto(val) + '</span>' +
    '</label>';
  }
  function opcionPago(m, checked) {
    return '<label class="opcion" data-pago-opcion="' + m.id + '">' +
      '<input type="radio" name="pago" value="' + m.id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="opcion__texto"><strong>' + m.nombre + '</strong>' +
        (m.descripcion ? '<span class="opcion__desc">' + m.descripcion + '</span>' : '') +
      '</span>' +
    '</label>';
  }

  /* ---- Resumen lateral: subtotal + envío + total ---- */
  function resumen(entrega) {
    var lineas = items.map(function (it) {
      return '<div class="resumen-linea"><span>' + it.cantidad + '× ' + it.producto.nombre +
        (it.varianteTexto ? ' <small class="texto-apagado">' + it.varianteTexto + '</small>' : '') +
        '</span><span>' + fmt(it.subtotalLinea) + '</span></div>';
    }).join('');

    var sub = Carrito.subtotal();
    var unidades = items.reduce(function (s, it) { return s + it.cantidad; }, 0);
    var env = costoEnvio(entrega);

    var htmlEnvio = env === 0
      ? '<span class="envio-gratis">' + (entrega === 'retiro' ? 'Sin costo' : 'Gratis') + '</span>'
      : (env === null ? 'A confirmar' : Vitalica.formatearGs(env));

    // El total solo se muestra si se puede calcular de verdad.
    var total = (sub != null && env != null) ? sub + env : null;

    return lineas +
      '<div class="resumen-linea resumen-linea--sep"><span>Unidades</span><span>' + unidades + '</span></div>' +
      '<div class="resumen-linea"><span>Subtotal</span><span>' + fmt(sub) + '</span></div>' +
      '<div class="resumen-linea resumen-linea--envio"><span>Envío</span><span>' + htmlEnvio + '</span></div>' +
      '<div class="resumen-total"><span>Total</span><span>' + fmt(total) + '</span></div>';
  }

  /* ---- Arma el texto del pedido que se manda por WhatsApp ----
     Usamos saltos de línea reales: encodeURIComponent los convierte a %0A,
     que es como WhatsApp entiende los renglones. */
  function construirMensaje(datos) {
    var L = [];
    L.push('Hola Vitalica! Quiero hacer este pedido desde la web:');
    L.push('');
    L.push('*PEDIDO ' + numeroPedido + '*');
    items.forEach(function (it) {
      var linea = '• ' + it.cantidad + '× ' + it.producto.nombre;
      if (it.varianteTexto) linea += ' (' + it.varianteTexto + ')';
      if (it.subtotalLinea != null) linea += ' — ' + Vitalica.formatearGs(it.subtotalLinea);
      L.push(linea);
    });

    var sub = Carrito.subtotal();
    var env = costoEnvio(datos.entrega);
    L.push('');
    if (sub != null) L.push('Subtotal: ' + Vitalica.formatearGs(sub));
    L.push('Envío: ' + (env === null ? 'a confirmar' : (env === 0 ? 'sin costo' : Vitalica.formatearGs(env))));
    if (sub != null && env != null) L.push('*TOTAL: ' + Vitalica.formatearGs(sub + env) + '*');

    L.push('');
    L.push('*MIS DATOS*');
    L.push('Nombre: ' + datos.nombre + ' ' + datos.apellido);
    L.push('Teléfono: ' + datos.telefono);
    if (datos.email) L.push('Email: ' + datos.email);

    L.push('');
    L.push('*ENTREGA*');
    L.push(datos.entregaLabel);
    if (datos.entrega === 'retiro') {
      if (datos.local) L.push('Local: ' + datos.local);
    } else {
      L.push('Ciudad: ' + datos.ciudad);
      L.push('Dirección: ' + datos.direccion);
      if (datos.referencia) L.push('Referencia: ' + datos.referencia);
    }

    if (datos.pagoLabel) {
      L.push('');
      L.push('*FORMA DE PAGO*');
      L.push(datos.pagoLabel);
    }

    L.push('');
    L.push('Quedo atento/a para confirmar disponibilidad y coordinar la entrega. Gracias!');
    return L.join('\n');
  }

  // ---- Render del formulario + resumen ----
  var htmlPagos = metodos.length
    ? '<div class="form-bloque">' +
        '<h2>3 · Cómo querés pagar</h2>' +
        '<p class="form-bloque__nota">No se cobra nada en la web. Esto le sirve al asesor para tener todo listo cuando te escriba.</p>' +
        '<div class="opciones">' +
          metodos.map(function (m, i) { return opcionPago(m, i === 0); }).join('') +
        '</div>' +
        '<div data-pago-nota hidden></div>' +
      '</div>'
    : '';

  /* Selector de punto de retiro. Con un solo punto no se pregunta nada:
     se muestra la dirección y listo. Ofrecer una lista de un solo elemento
     es hacerle elegir al cliente algo que no tiene alternativa. */
  var htmlLocales = '';
  if (hayRetiro) {
    var p0 = puntosRetiro[0];
    var linea = function (p) {
      return p.nombre + ' — ' + p.direccion + (p.ciudad ? ', ' + p.ciudad : '');
    };
    if (puntosRetiro.length === 1) {
      htmlLocales =
        '<div class="punto-retiro" data-selector-local hidden>' +
          '<input type="hidden" name="local" value="' + linea(p0) + '">' +
          '<p class="punto-retiro__titulo">Retirás en</p>' +
          '<p class="punto-retiro__dir"><strong>' + p0.nombre + '</strong><br>' +
            p0.direccion + (p0.ciudad ? '<br>' + p0.ciudad : '') + '</p>' +
          (p0.horario ? '<p class="punto-retiro__horario">' + p0.horario + '</p>' : '') +
        '</div>';
    } else {
      htmlLocales =
        '<div class="selector-local" data-selector-local hidden>' +
          '<label for="c-local">¿Dónde lo retirás?</label>' +
          '<select id="c-local" name="local">' +
            puntosRetiro.map(function (p) {
              return '<option value="' + linea(p) + '">' + linea(p) + '</option>';
            }).join('') +
          '</select>' +
        '</div>';
    }
  }

  cont.innerHTML =
    '<form class="checkout" id="form-checkout" novalidate>' +
      '<div class="checkout__form">' +

        '<div class="form-bloque">' +
          '<h2>1 · Tus datos</h2>' +
          '<p class="form-bloque__nota">No hace falta crear una cuenta. Con estos datos te contactamos para cerrar el pedido.</p>' +
          '<div class="campos-grid">' +
            campo('Nombre', 'nombre', 'text', true) +
            campo('Apellido', 'apellido', 'text', true) +
            campo('Teléfono (WhatsApp)', 'telefono', 'tel', true) +
            campo('Email', 'email', 'email', false) +
          '</div>' +
        '</div>' +

        '<div class="form-bloque">' +
          '<h2>2 · Entrega</h2>' +
          '<div class="opciones">' +
            opcionEntrega('gran-asuncion', 'Gran Asunción', 'Asunción y alrededores · 24–48 h hábiles', true) +
            opcionEntrega('interior', 'Interior del país', 'Envío al interior · 2–5 días hábiles', false) +
            // La opción de retiro solo existe si hay un punto de retiro propio
            // cargado en VITALICA_CONFIG.retiro.puntos.
            (hayRetiro
              ? opcionEntrega('retiro', 'Retiro en nuestro local', 'Pasás a buscarlo cuando te avisamos', false)
              : '') +
          '</div>' +
          htmlLocales +
          '<div class="campos-grid" data-campos-direccion style="margin-top:var(--space-4)">' +
            campo('Ciudad / Localidad', 'ciudad', 'text', true) +
            campo('Dirección', 'direccion', 'text', true) +
          '</div>' +
          '<div data-campo-referencia>' + campo('Referencia para la entrega', 'referencia', 'text', false) + '</div>' +
        '</div>' +

        htmlPagos +

        '<div class="form-bloque">' +
          '<h2>' + (metodos.length ? '4' : '3') + ' · Confirmá tu pedido</h2>' +
          '<p class="form-bloque__nota">Al continuar se abre WhatsApp con tu pedido ya escrito. Un asesor te confirma disponibilidad y coordina la entrega.</p>' +
          '<button type="submit" class="btn btn--whatsapp btn--grande btn--bloque">' + waIcon + ' Enviar pedido por WhatsApp</button>' +
        '</div>' +
      '</div>' +

      '<aside class="carrito__resumen">' +
        '<h2>Tu pedido</h2>' +
        '<div data-resumen>' + resumen('gran-asuncion') + '</div>' +
        '<p class="carrito__nota">El precio final se confirma por WhatsApp. Pedido <strong>' + numeroPedido + '</strong>.</p>' +
      '</aside>' +
    '</form>';

  var form       = document.getElementById('form-checkout');
  var camposDir  = form.querySelector('[data-campos-direccion]');

  /* ------------------------------------------------------------------
     SI HAY SESION, LOS DATOS YA VIENEN CARGADOS

     Es la razon por la que alguien se toma el trabajo de tener cuenta:
     no volver a escribir su nombre y su telefono cada vez. Sin esto, la
     cuenta solo sirve para mirar pedidos viejos.

     TRES DECISIONES

     Se pregunta DESPUES de dibujar el formulario. Si esperara la
     respuesta, el checkout tardaria en aparecer para todo el mundo,
     incluida la mayoria que compra sin cuenta.

     NO se pisa lo que la persona ya escribio. Entre que se dibuja el
     formulario y que contesta el servidor pasan milisegundos, pero si
     alguien llego escribiendo rapido y le borramos lo que puso, eso es
     mucho peor que no prellenar nada.

     Y si falla, no pasa nada: el formulario esta vacio, como siempre.
     ------------------------------------------------------------------ */
  (function prellenarDesdeLaCuenta() {
    if (typeof fetch !== 'function') return;

    fetch('api/cuenta.php?accion=yo', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var c = d && d.ok && d.cliente;
        if (!c) return;

        /* El telefono se guarda como 595981123456. Al formulario va en el
           formato que la persona reconoce como suyo. */
        var tel = String(c.telefono || '').replace(/\D/g, '');
        if (/^5959\d{8}$/.test(tel)) {
          tel = '0' + tel.slice(3, 6) + ' ' + tel.slice(6, 9) + ' ' + tel.slice(9);
        }

        /* La cuenta guarda "Nombre y apellido" en un solo campo, porque eso
           es lo que entrega Google y lo que la gente escribe de corrido. El
           checkout los tiene separados. Sin partirlo, "Facundo Colman"
           entraba entero en Nombre y Apellido quedaba vacio.

           Se corta en el PRIMER espacio y el resto va a apellido: asi
           "Maria Jose Gonzalez Paredes" queda Maria / Jose Gonzalez Paredes.
           No es perfecto -nadie puede adivinar donde termina un nombre
           compuesto- pero lo que queda es corregible de un toque, y lo
           importante es que el apellido NO quede vacio. */
        var entero = String(c.nombre || '').trim();
        var corte = entero.indexOf(' ');
        var soloNombre = corte === -1 ? entero : entero.slice(0, corte);
        var soloApellido = corte === -1 ? '' : entero.slice(corte + 1).trim();

        poner('nombre', soloNombre);
        poner('apellido', soloApellido);
        poner('telefono', tel);
        poner('email', c.email);

        var aviso = document.createElement('p');
        aviso.className = 'checkout__quien';
        aviso.innerHTML = 'Comprando como <strong>' + textoSeguro(c.nombre) + '</strong>. ' +
                          '<a href="cuenta.html">No soy yo</a>';
        form.insertBefore(aviso, form.firstChild);
      })
      .catch(function () { /* sin PHP o sin red: el formulario queda vacio */ });

    function poner(nombre, valor) {
      var campo = form.querySelector('[name="' + nombre + '"]');
      if (campo && !campo.value.trim() && valor) campo.value = valor;
    }
    function textoSeguro(t) {
      return String(t == null ? '' : t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  })();

  var campoRef   = form.querySelector('[data-campo-referencia]');
  var selLocal   = form.querySelector('[data-selector-local]');
  var notaPago   = form.querySelector('[data-pago-nota]');
  var contResumen= form.querySelector('[data-resumen]');

  function entregaElegida() {
    var sel = form.querySelector('input[name="entrega"]:checked');
    return sel ? sel.value : 'gran-asuncion';
  }
  function pagoElegido() {
    var sel = form.querySelector('input[name="pago"]:checked');
    return sel ? sel.value : null;
  }

  /* ---- Al cambiar la entrega cambian: dirección, local, resumen y pagos ---- */
  function alCambiarEntrega() {
    var entrega = entregaElegida();
    var esRetiro = entrega === 'retiro';

    camposDir.hidden = esRetiro;
    campoRef.hidden = esRetiro;
    if (selLocal) selLocal.hidden = !esRetiro;

    // Los campos ocultos no pueden seguir siendo obligatorios (bloquearían el submit)
    ['ciudad', 'direccion'].forEach(function (n) {
      var input = form.querySelector('[name="' + n + '"]');
      if (input) input.required = !esRetiro;
    });

    contResumen.innerHTML = resumen(entrega);
    actualizarPagos(entrega);
  }

  /* ---- Habilita solo los medios de pago que aplican a la entrega elegida.
     Pagar con tarjeta o en efectivo en el mostrador no aplica si el pedido
     se envía a domicilio.

     Los que no corresponden se apagan y se explica por qué, en vez de
     desaparecer: si una opción se esfuma, el cliente se pregunta si la vio
     mal o si el sitio está roto.

     La regla NO está escrita acá: cada medio declara sus entregas en
     data.js. Agregar una billetera nueva no obliga a tocar este archivo. */
  function actualizarPagos(entrega) {
    if (!metodos.length) return;

    metodos.forEach(function (m) {
      var opcion = form.querySelector('[data-pago-opcion="' + m.id + '"]');
      if (!opcion) return;
      var aplica = !m.entregas || m.entregas.indexOf(entrega) !== -1;
      var radio = opcion.querySelector('input');
      radio.disabled = !aplica;
      opcion.classList.toggle('opcion--apagada', !aplica);
      opcion.title = aplica ? '' : 'No disponible con esta forma de entrega';
      if (!aplica && radio.checked) radio.checked = false;
    });

    // Si la selección quedó vacía, elegimos el primer medio que sí aplique.
    if (!form.querySelector('input[name="pago"]:checked')) {
      var primero = form.querySelector('input[name="pago"]:not(:disabled)');
      if (primero) primero.checked = true;
    }
    mostrarNotaPago();
  }

  function mostrarNotaPago() {
    if (!notaPago) return;
    var id = pagoElegido();
    var m = metodos.filter(function (x) { return x.id === id; })[0];
    var texto = m && m.instrucciones ? m.instrucciones : '';

    // Sin instrucciones cargadas decimos la verdad: se mandan por WhatsApp.
    if (m && m.id === 'transferencia' && !texto) {
      texto = 'Te enviamos los datos de la cuenta por WhatsApp al confirmar el pedido.';
    }
    if (!texto) { notaPago.hidden = true; notaPago.innerHTML = ''; return; }
    notaPago.hidden = false;
    notaPago.className = 'opcion__nota';
    notaPago.innerHTML = texto;
  }

  form.querySelectorAll('input[name="entrega"]').forEach(function (r) {
    r.addEventListener('change', alCambiarEntrega);
  });
  form.querySelectorAll('input[name="pago"]').forEach(function (r) {
    r.addEventListener('change', mostrarNotaPago);
  });
  alCambiarEntrega();

  // ---- Enviar pedido ----
  function enviarPedido() {
    function val(n) {
      var el = form.querySelector('[name="' + n + '"]');
      return el ? el.value.trim() : '';
    }
    var entrega = entregaElegida();
    var etiquetas = {
      'gran-asuncion': 'Envío a Gran Asunción',
      'interior': 'Envío al interior del país',
      'retiro': 'Retiro en nuestro local'
    };
    var idPago = pagoElegido();
    var mPago = metodos.filter(function (x) { return x.id === idPago; })[0];

    var datos = {
      nombre: val('nombre'), apellido: val('apellido'),
      telefono: val('telefono'), email: val('email'),
      ciudad: val('ciudad'), direccion: val('direccion'), referencia: val('referencia'),
      local: val('local'),
      entrega: entrega, entregaLabel: etiquetas[entrega],
      pagoLabel: mPago ? mPago.nombre : ''
    };

    var numero = (VITALICA_CONFIG.whatsapp && VITALICA_CONFIG.whatsapp.numero) || '';
    var url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(construirMensaje(datos));

    /* ---- Registrar el pedido en el servidor ------------------------------
       Si existe api/pedido.php, le mandamos el pedido para que quede guardado
       y le llegue un aviso al equipo por email.

       Esto es DELIBERADAMENTE opcional y silencioso:
       • Si el backend no está subido, el fetch falla y no pasa nada.
       • Si el servidor está caído, tampoco pasa nada.
       • No esperamos la respuesta: WhatsApp se abre igual.

       Perder una venta porque el servidor de correo estaba caído sería el
       peor negocio posible. WhatsApp es el camino principal; esto es el
       registro interno.

       keepalive: true hace que el pedido llegue aunque la página cambie
       inmediatamente después. */
    try {
      var sub0 = Carrito.subtotal();
      var env0 = costoEnvio(entrega);
      fetch('api/pedido.php', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numeroPedido,
          nombre: datos.nombre, apellido: datos.apellido,
          telefono: datos.telefono, email: datos.email,
          ciudad: datos.ciudad, direccion: datos.direccion,
          referencia: datos.referencia, local: datos.local,
          entrega: datos.entrega, entregaLabel: datos.entregaLabel,
          pago: idPago || '', pagoLabel: datos.pagoLabel,
          subtotal: sub0, envio: env0,
          total: (sub0 != null && env0 != null) ? sub0 + env0 : null,
          items: items.map(function (it) {
            return {
              id: it.producto.id,
              nombre: it.producto.nombre,
              // 'variante' es el código de barras: con eso el backend arma
              // la línea exacta en Odoo, sin adivinar sabor ni tamaño.
              variante: it.variante || null,
              varianteTexto: it.varianteTexto || '',
              cantidad: it.cantidad,
              subtotal: it.subtotalLinea
            };
          })
        })
      }).catch(function () { /* sin backend: seguimos por WhatsApp */ });
    } catch (e) { /* navegador sin fetch: idem */ }

    // Analítica: registramos el pedido enviado (si GA4 está cargado)
    if (typeof gtag === 'function') {
      var sub = Carrito.subtotal();
      gtag('event', 'pedido_whatsapp', {
        pedido: numeroPedido,
        items: items.length,
        unidades: items.reduce(function (s, it) { return s + it.cantidad; }, 0),
        entrega: entrega,
        pago: idPago || '(sin elegir)',
        valor: sub == null ? 0 : sub
      });
    }

    // Abrimos WhatsApp ANTES de vaciar el carrito (si el navegador bloquea la
    // ventana, el cliente todavía tiene su pedido y el link de respaldo).
    window.open(url, '_blank', 'noopener');

    var env = costoEnvio(entrega);
    var sub2 = Carrito.subtotal();
    var lineas = items.map(function (it) {
      return '<div class="resumen-linea"><span>' + it.cantidad + '× ' + it.producto.nombre +
        (it.varianteTexto ? ' <small class="texto-apagado">' + it.varianteTexto + '</small>' : '') +
        '</span><span>' + fmt(it.subtotalLinea) + '</span></div>';
    }).join('');

    Carrito.vaciar();

    var emp = VITALICA_CONFIG.empresa || {};
    var fechaHoy = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cont.innerHTML =
      '<div class="confirmacion" data-comprobante>' +

        /* Encabezado que SOLO se ve al imprimir o guardar en PDF.
           En pantalla sobra —el header del sitio ya dice quién sos— pero en
           un papel suelto sin él no se sabe de dónde salió el documento. */
        '<div class="comprobante-cabecera">' +
          '<div>' +
            '<p class="comprobante-marca">VITALICA</p>' +
            '<p class="comprobante-sub">Olimp Sport Nutrition · Paraguay</p>' +
          '</div>' +
          '<div class="comprobante-datos">' +
            (emp.razonSocial ? emp.razonSocial + '<br>' : '') +
            (emp.ruc ? 'RUC ' + emp.ruc + '<br>' : '') +
            (VITALICA_CONFIG.whatsapp ? VITALICA_CONFIG.whatsapp.numeroVisible : '') +
          '</div>' +
        '</div>' +

        '<div class="confirmacion__icono">' + checkIcon + '</div>' +
        '<h1>¡Pedido enviado!</h1>' +
        '<p class="confirmacion__intro">Gracias, ' + datos.nombre + '. Te abrimos WhatsApp con tu pedido listo para mandar.</p>' +
        '<p class="confirmacion__numero">' + numeroPedido + '</p>' +
        '<p class="confirmacion__fecha">' + fechaHoy + '</p>' +
        '<p class="texto-apagado confirmacion__ayuda">Guardá este número: es la referencia de tu pedido.<br>¿No se abrió la ventana? Tocá el botón verde de abajo.</p>' +

        '<div class="confirmacion__resumen">' + lineas +
          (sub2 != null ? '<div class="resumen-linea resumen-linea--sep"><span>Subtotal</span><span>' + Vitalica.formatearGs(sub2) + '</span></div>' : '') +
          (env != null ? '<div class="resumen-linea"><span>Envío</span><span>' + (env === 0 ? 'Sin costo' : Vitalica.formatearGs(env)) + '</span></div>' : '') +
          (sub2 != null && env != null
            ? '<div class="resumen-total"><span>Total</span><span>' + Vitalica.formatearGs(sub2 + env) + '</span></div>' : '') +
        '</div>' +

        '<div class="comprobante-bloques">' +
          '<div>' +
            '<h2>Entrega</h2>' +
            '<p><strong>' + datos.entregaLabel + '</strong><br>' +
              (datos.entrega === 'retiro'
                ? (datos.local || '')
                : (datos.direccion + '<br>' + datos.ciudad +
                   (datos.referencia ? '<br>' + datos.referencia : ''))) +
            '</p>' +
          '</div>' +
          '<div>' +
            '<h2>Forma de pago</h2>' +
            '<p>' + (datos.pagoLabel || 'A coordinar') + '</p>' +
          '</div>' +
          '<div>' +
            '<h2>Tus datos</h2>' +
            '<p>' + datos.nombre + ' ' + datos.apellido + '<br>' + datos.telefono +
              (datos.email ? '<br>' + datos.email : '') + '</p>' +
          '</div>' +
        '</div>' +

        '<p class="comprobante-nota">' +
          '<strong>Esto no es un comprobante de pago.</strong> Tu pedido queda confirmado cuando ' +
          'hablemos y acordemos el pago. Todavía no se cobró nada.' +
        '</p>' +

        '<div class="confirmacion__acciones">' +
          '<a class="btn btn--whatsapp btn--grande" href="' + url + '" target="_blank" rel="noopener">' + waIcon + ' Abrir WhatsApp</a>' +
          '<button type="button" class="btn btn--contorno btn--grande" data-descargar>' + pdfIcon + ' Descargar mi pedido</button>' +
          '<a class="btn btn--contorno btn--grande" href="productos.html">Seguir comprando</a>' +
        '</div>' +

        '<p class="comprobante-pie">Los suplementos no sustituyen una alimentación equilibrada.</p>' +
      '</div>';

    /* DESCARGAR EL PEDIDO EN PDF
       ----------------------------------------------------------------------
       Antes esto llamaba a window.print(). Funcionaba, pero lo que hacía era
       abrir el diálogo de impresión: para terminar con un PDF había que
       saber que existe "Guardar como PDF" en el destino, elegirlo y después
       encontrar el archivo. En celular muchas veces ni aparece esa opción y
       ofrece imprimir en una impresora que no existe.

       Ahora assets/js/pdf-pedido.js arma el archivo y lo baja de una. Si por
       lo que sea ese archivo no cargó, se vuelve a la impresión: es peor,
       pero es mejor que un botón que no hace nada. */
    var btnDescargar = cont.querySelector('[data-descargar]');
    if (btnDescargar) {
      btnDescargar.addEventListener('click', function () {
        if (global_PdfPedido()) { bajarPdf(datos); return; }

        var tituloOriginal = document.title;
        document.title = 'Pedido ' + numeroPedido + ' - Vitalica';
        window.print();
        setTimeout(function () { document.title = tituloOriginal; }, 500);
      });
    }

    function global_PdfPedido() {
      return typeof PdfPedido !== 'undefined' && PdfPedido && PdfPedido.armar;
    }

    /* Traduce el pedido al formato que espera pdf-pedido.js. Los importes ya
       vienen formateados desde acá: el PDF no vuelve a calcular nada, solo
       escribe. Así no hay forma de que el papel y la pantalla digan números
       distintos. */
    function bajarPdf(d) {
      var sub = Carrito.subtotal();
      var env = costoEnvio(d.entrega);
      var total = (sub != null && env != null) ? Vitalica.formatearGs(sub + env) : null;

      var entrega = [d.entregaLabel];
      if (d.entrega === 'retiro') {
        if (d.local) entrega.push('Local: ' + d.local);
      } else {
        entrega.push('Ciudad: ' + d.ciudad);
        entrega.push('Dirección: ' + d.direccion);
        if (d.referencia) entrega.push('Referencia: ' + d.referencia);
      }

      var blob = PdfPedido.armar({
        numero: numeroPedido,
        fecha: fechaHoy,
        items: items.map(function (it) {
          return {
            cantidad: it.cantidad,
            nombre: it.producto.nombre,
            variante: it.varianteTexto || '',
            subtotal: it.subtotalLinea != null ? Vitalica.formatearGs(it.subtotalLinea) : null
          };
        }),
        subtotal: sub != null ? Vitalica.formatearGs(sub) : null,
        envio: env === null ? 'A confirmar' : (env === 0 ? 'Sin costo' : Vitalica.formatearGs(env)),
        total: total,
        cliente: [
          d.nombre + ' ' + d.apellido,
          'Teléfono: ' + d.telefono,
          d.email ? 'Email: ' + d.email : null
        ],
        entrega: entrega,
        pago: [d.pagoLabel]
      });

      PdfPedido.descargar(blob, 'Pedido-' + numeroPedido + '-Vitalica.pdf');
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    enviarPedido();
  });

})();
