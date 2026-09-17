/* ==========================================================================
   VITALICA — cart.js  ·  CARRITO DE COMPRAS
   --------------------------------------------------------------------------
   Maneja el carrito usando "localStorage", que es una memoria del navegador:
   los productos quedan guardados aunque recargues la página o navegues a otra.

   Guardamos lo mínimo por línea: { id, variante, cantidad }. El resto (nombre,
   precio, foto) sale de data.js cuando hace falta.

   QUÉ ES 'variante'
   -----------------
   El código de barras de la combinación exacta de sabor y presentación
   (ej. '5901330063985' = Whey Doble Chocolate 700 g). Es lo que permite que
   el pedido se convierta en una línea precisa en Odoo.

   Dos líneas son la MISMA solo si coinciden id Y variante. Así, un Whey de
   chocolate y uno de frutilla conviven en el carrito como dos líneas, que es
   lo que el cliente espera.

   Los productos sin variantes (las cápsulas, que vienen en una sola
   presentación) guardan variante: null y se comportan como antes.

   COMPATIBILIDAD
   --------------
   Un carrito guardado antes de que existieran las variantes tiene líneas sin
   ese campo. Se siguen leyendo sin romperse: quedan como variante null.

   Cada cambio dispara el evento 'carrito:cambio'. El contador del header y el
   panel lateral escuchan ese evento y se actualizan solos.

   NOTA (para IT): en producción el carrito vive en el servidor / sesión del
   usuario, no en localStorage. Esto es una simulación de front-end.
   ========================================================================== */

const Carrito = {
  CLAVE: 'vitalica_carrito',

  /* Lee el carrito guardado. Devuelve un array de { id, variante, cantidad }. */
  obtener: function () {
    try {
      var items = JSON.parse(localStorage.getItem(this.CLAVE)) || [];
      // Normaliza: las líneas viejas no tienen 'variante'.
      return items.map(function (i) {
        return { id: i.id, variante: i.variante || null, cantidad: i.cantidad };
      });
    } catch (e) {
      return []; // si el dato está corrupto, empezamos de cero
    }
  },

  /* Guarda el array y avisa al resto del sitio que algo cambió. */
  _guardar: function (items) {
    localStorage.setItem(this.CLAVE, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('carrito:cambio'));
  },

  /* ¿Es la misma línea? Solo si coinciden producto Y variante. */
  _misma: function (i, id, variante) {
    return i.id === id && (i.variante || null) === (variante || null);
  },

  /* Agrega un producto (o suma cantidad si esa misma variante ya estaba).
     Uso: Carrito.agregar('whey-protein-complex', 2, '5901330063985')
     La variante es opcional: sin ella se comporta como antes. */
  agregar: function (id, cantidad, variante) {
    cantidad = cantidad || 1;
    variante = variante || null;
    var self = this;
    var items = this.obtener();
    var existente = items.find(function (i) { return self._misma(i, id, variante); });
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      items.push({ id: id, variante: variante, cantidad: cantidad });
    }
    this._guardar(items);
  },

  /* Cambia la cantidad exacta de una línea. Si llega a 0, la quita. */
  actualizarCantidad: function (id, cantidad, variante) {
    variante = variante || null;
    var self = this;
    var items = this.obtener();
    var item = items.find(function (i) { return self._misma(i, id, variante); });
    if (!item) return;
    item.cantidad = cantidad;
    if (item.cantidad <= 0) {
      items = items.filter(function (i) { return !self._misma(i, id, variante); });
    }
    this._guardar(items);
  },

  /* Quita una línea del carrito. */
  quitar: function (id, variante) {
    variante = variante || null;
    var self = this;
    var items = this.obtener().filter(function (i) { return !self._misma(i, id, variante); });
    this._guardar(items);
  },

  /* Vacía el carrito por completo. */
  vaciar: function () {
    this._guardar([]);
  },

  /* Suma total de unidades (para el badge del header). */
  cantidadTotal: function () {
    return this.obtener().reduce(function (suma, i) { return suma + i.cantidad; }, 0);
  },

  /* Devuelve los items "enriquecidos" con los datos del producto y de la
     variante, listos para mostrar en el carrito y el checkout.

     El precio sale de la variante si Odoo lo publicó; si no, del producto.
     Nunca se inventa: si no hay ninguno, la línea queda en null y el sitio
     muestra "a confirmar". */
  itemsDetallados: function () {
    return this.obtener().map(function (i) {
      var producto = Datos.producto(i.id);
      if (!producto) return { producto: null };

      var variante = i.variante ? Datos.variante(i.id, i.variante) : null;
      var precioUnit = Datos.precioVariante(i.variante);
      if (precioUnit == null) precioUnit = producto.precio;

      /* La promo se aplica ACÁ, no solo en la vitrina. Si el catálogo muestra
         un descuento y el carrito cobra el precio de lista, el cliente lo
         descubre justo antes de pagar — que es el peor momento posible. */
      var conP = Datos.conPromo(precioUnit, i.id);

      return {
        id: i.id,
        variante: i.variante || null,
        varianteInfo: variante,
        varianteTexto: Datos.etiquetaVariante(variante),
        cantidad: i.cantidad,
        producto: producto,
        precioUnitario: conP.precio,
        precioAntes: conP.precioAntes,   // null si no hay promo
        promoTexto: conP.texto,
        // subtotal de la línea (null si el precio aún es placeholder)
        subtotalLinea: (conP.precio != null) ? conP.precio * i.cantidad : null
      };
    }).filter(function (x) { return x.producto; }); // descarta ids inválidos
  },

  /* Subtotal de productos. Devuelve null si ALGÚN precio es placeholder
     (no se puede calcular un total real todavía). */
  subtotal: function () {
    var items = this.itemsDetallados();
    if (items.length === 0) return 0;
    var hayPlaceholder = items.some(function (x) { return x.subtotalLinea == null; });
    if (hayPlaceholder) return null;
    return items.reduce(function (suma, x) { return suma + x.subtotalLinea; }, 0);
  }
};
