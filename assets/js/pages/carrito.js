/* ==========================================================================
   VITALICA — pages/carrito.js  ·  CARRITO
   --------------------------------------------------------------------------
   Muestra los productos agregados, permite cambiar cantidades y quitar, y
   calcula el resumen en tiempo real. Como los precios son placeholder, los
   totales muestran "A confirmar" hasta que cargues precios reales en data.js.
   ========================================================================== */
(function () {
  var vista = document.querySelector('[data-carrito-vista]');
  if (!vista) return;

  // Formatea un monto, o "A confirmar" si todavía es placeholder (null)
  function fmt(v) { return v == null ? 'A confirmar' : Vitalica.formatearGs(v); }

  function render() {
    var items = Carrito.itemsDetallados();

    // --- Carrito vacío ---
    if (items.length === 0) {
      vista.innerHTML =
        '<div class="carrito-vacio">' +
          '<h2>Tu carrito está vacío</h2>' +
          '<p class="texto-apagado">Sumá productos desde el catálogo y aparecerán acá.</p>' +
          '<a class="btn btn--primario btn--grande" href="productos.html">Ver productos</a>' +
        '</div>';
      return;
    }

    // --- Filas de productos ---
    var filas = items.map(function (it) {
      var p = it.producto;
      var cat = Datos.categoria(p.categoria);
      return '<div class="carrito-item" data-id="' + p.id + '" data-variante="' + (it.variante || '') + '">' +
        '<a class="carrito-item__media" href="producto.html?id=' + p.id + '"><img src="' + p.imagen + '" alt="' + p.nombre + '"></a>' +
        '<div class="carrito-item__info">' +
          '<a class="carrito-item__nombre" href="producto.html?id=' + p.id + '">' + p.nombre + '</a>' +
          '<span class="carrito-item__cat">' + (cat ? cat.nombre : '') + '</span>' +
          (it.varianteTexto ? '<span class="carrito-item__variante">' + it.varianteTexto + '</span>' : '') +
          '<span class="carrito-item__unit">' + Vitalica.formatearGs(it.precioUnitario) + ' c/u</span>' +
          '<button class="carrito-item__quitar" data-quitar>Quitar</button>' +
        '</div>' +
        '<div class="selector-cantidad selector-cantidad--sm">' +
          '<button type="button" data-menos aria-label="Restar">−</button>' +
          '<input type="text" value="' + it.cantidad + '" readonly aria-label="Cantidad">' +
          '<button type="button" data-mas aria-label="Sumar">+</button>' +
        '</div>' +
        '<div class="carrito-item__subtotal">' + fmt(it.subtotalLinea) + '</div>' +
      '</div>';
    }).join('');

    // --- Resumen ---
    var unidades = items.reduce(function (s, i) { return s + i.cantidad; }, 0);
    var sub = Carrito.subtotal();

    vista.innerHTML =
      '<div class="carrito">' +
        '<div class="carrito__items">' + filas + '</div>' +
        '<aside class="carrito__resumen">' +
          '<h2>Resumen</h2>' +
          '<div class="resumen-linea"><span>Productos (' + unidades + ')</span><span>' + fmt(sub) + '</span></div>' +
          '<div class="resumen-linea texto-apagado"><span>Envío</span><span>Se calcula en el checkout</span></div>' +
          '<div class="resumen-total"><span>Total</span><span>' + fmt(sub) + '</span></div>' +
          '<a class="btn btn--primario btn--bloque btn--grande" href="checkout.html">Continuar con mi pedido</a>' +
          '<a class="btn btn--contorno btn--bloque" href="productos.html">Seguir comprando</a>' +
          '<p class="carrito__nota">Los precios se confirman antes de pagar. Maqueta: sin cobro real.</p>' +
        '</aside>' +
      '</div>';

    // --- Eventos de cada fila ---
    vista.querySelectorAll('.carrito-item').forEach(function (row) {
      var id = row.dataset.id;
      var variante = row.dataset.variante || null;
      var item = Carrito.obtener().find(function (i) {
        return i.id === id && (i.variante || null) === variante;
      });
      var cant = item ? item.cantidad : 1;
      row.querySelector('[data-mas]').addEventListener('click', function () { Carrito.actualizarCantidad(id, cant + 1, variante); });
      row.querySelector('[data-menos]').addEventListener('click', function () { Carrito.actualizarCantidad(id, cant - 1, variante); });
      row.querySelector('[data-quitar]').addEventListener('click', function () { Carrito.quitar(id, variante); });
    });
  }

  render();
  // Cuando el carrito cambia (acá o en otra pestaña), re-dibujamos
  window.addEventListener('carrito:cambio', render);
})();
