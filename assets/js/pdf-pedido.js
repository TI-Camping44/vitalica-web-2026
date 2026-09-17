/* ==========================================================================
   VITALICA — pdf-pedido.js  ·  ARMA EL PDF DEL PEDIDO EN EL NAVEGADOR
   --------------------------------------------------------------------------
   Genera un archivo .pdf de verdad y lo baja a la carpeta de descargas.

   POR QUÉ NO ALCANZABA CON window.print()
   ---------------------------------------
   El botón "Descargar mi pedido" llamaba a window.print(), que abre el
   diálogo de impresión. De ahí, para tener un PDF, la persona tiene que
   saber que existe "Guardar como PDF" en el destino, elegirlo, y después
   encontrar el archivo. En el celular la mitad de las veces ni aparece esa
   opción y termina ofreciendo imprimir en una impresora que no existe.

   Lo que se pidió es otra cosa: que al confirmar el pedido se pueda bajar un
   PDF. Con esto, un clic deja el archivo en Descargas, listo para adjuntar
   en un correo o mandarlo por WhatsApp.

   POR QUÉ ESTÁ ESCRITO A MANO Y NO CON UNA LIBRERÍA
   ------------------------------------------------
   Las librerías del rubro (jsPDF y compañía) pesan entre 300 y 400 KB y
   habría que traerlas de un CDN ajeno en la página donde el cliente deja su
   nombre, su teléfono y su dirección. Meter un tercero justo ahí, para
   dibujar ocho renglones de texto, es mal negocio.

   Un PDF con texto plano es un formato simple: objetos numerados, una tabla
   de posiciones al final y un flujo de órdenes de dibujo. Son unas 200
   líneas y no depende de nadie.

   LO QUE SÍ Y LO QUE NO
     · Tipografías: las 14 estándar que todo lector de PDF ya tiene
       (Helvetica). No se incrusta ninguna fuente, así que el archivo pesa
       unos 3 KB en vez de varios cientos.
     · Acentos y ñ: sí, con WinAnsiEncoding (ver aWinAnsi()).
     · Logo: no. Meter una imagen obliga a incrustar el archivo y a manejar
       compresión; el encabezado se resuelve con tipografía.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------------
     TEXTO → BYTES
     ------------------------------------------------------------------------
     Un PDF con las fuentes estándar no habla UTF-8: habla WinAnsi, que es
     Latin-1 con algunos agregados entre 0x80 y 0x9F.

     Por suerte los acentos, la ñ y los signos de apertura (¿ ¡) tienen en
     Latin-1 el mismo número que en Unicode, así que salen solos. Los que no
     coinciden son los signos tipográficos —la raya, las comillas curvas, los
     puntos suspensivos— y esos van en la tabla de abajo.

     Cualquier otro carácter fuera de rango se reemplaza por un signo de
     pregunta: es preferible un "?" suelto a un PDF que no abre.
     ------------------------------------------------------------------------ */
  var ESPECIALES = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F
  };

  function aWinAnsi(texto) {
    var salida = '';
    for (var i = 0; i < texto.length; i++) {
      var c = texto.charCodeAt(i);
      if (c < 256) { salida += String.fromCharCode(c); continue; }
      salida += String.fromCharCode(ESPECIALES[c] || 0x3F);   // 0x3F = "?"
    }
    return salida;
  }

  /* Adentro de un PDF el texto va entre paréntesis, así que los paréntesis y
     la barra invertida tienen que escaparse o el archivo se rompe. */
  function escapar(texto) {
    return aWinAnsi(texto).replace(/([\\()])/g, '\\$1');
  }

  /* Ancho aproximado de un texto, para poder alinear a la derecha y cortar
     lo que no entra. Son las métricas de Helvetica en milésimas de punto,
     agrupadas: no hace falta la tabla exacta de 256 valores para acomodar
     precios y nombres de producto. */
  function ancho(texto, tam, negrita) {
    var t = aWinAnsi(texto), total = 0;
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      var w = 556;                                   // caso general
      if ('ilj|!.,:;\'`'.indexOf(c) !== -1) w = 250;
      else if ('ftIr()[]{}-'.indexOf(c) !== -1) w = 333;
      else if (' '.indexOf(c) !== -1) w = 278;
      else if ('mwMW@'.indexOf(c) !== -1) w = 833;
      else if (c >= 'A' && c <= 'Z') w = 667;
      total += w;
    }
    if (negrita) total *= 1.05;
    return total * tam / 1000;
  }

  function recortar(texto, tam, negrita, maximo) {
    if (ancho(texto, tam, negrita) <= maximo) return texto;
    var t = texto;
    while (t.length > 1 && ancho(t + '...', tam, negrita) > maximo) t = t.slice(0, -1);
    return t + '...';
  }


  /* ------------------------------------------------------------------------
     LA HOJA
     ------------------------------------------------------------------------
     A4 en puntos: 595 x 842. El origen del PDF está abajo a la izquierda, al
     revés que en la pantalla, así que se lleva una cuenta `y` que arranca
     arriba y va bajando, y se convierte al escribir.
     ------------------------------------------------------------------------ */
  var ANCHO_HOJA = 595, ALTO_HOJA = 842;
  var MARGEN = 48;
  var ANCHO_UTIL = ANCHO_HOJA - MARGEN * 2;

  function Hoja() {
    this.paginas = [];
    this.actual = null;
    this.nuevaPagina();
  }

  Hoja.prototype.nuevaPagina = function () {
    this.actual = { ordenes: [], y: MARGEN + 18 };
    this.paginas.push(this.actual);
  };

  /* Deja lugar para `alto` puntos; si no entra, pasa a la hoja siguiente. */
  Hoja.prototype.espacio = function (alto) {
    if (this.actual.y + alto > ALTO_HOJA - MARGEN - 30) this.nuevaPagina();
  };

  Hoja.prototype.texto = function (t, x, opciones) {
    opciones = opciones || {};
    var tam = opciones.tam || 10;
    var negrita = !!opciones.negrita;
    var gris = opciones.gris;
    var izquierda = x;

    if (opciones.derecha) izquierda = x - ancho(t, tam, negrita);
    if (opciones.centrado) izquierda = x - ancho(t, tam, negrita) / 2;

    var y = ALTO_HOJA - this.actual.y;
    var color = gris ? gris + ' ' + gris + ' ' + gris + ' rg' : '0 0 0 rg';
    this.actual.ordenes.push(
      'BT ' + color + ' /' + (negrita ? 'F2' : 'F1') + ' ' + tam + ' Tf ' +
      '1 0 0 1 ' + izquierda.toFixed(2) + ' ' + y.toFixed(2) + ' Tm (' +
      escapar(t) + ') Tj ET');
    return this;
  };

  Hoja.prototype.bajar = function (px) { this.actual.y += px; return this; };

  Hoja.prototype.linea = function (grosor, gris) {
    var y = ALTO_HOJA - this.actual.y;
    var g = gris == null ? 0.82 : gris;
    this.actual.ordenes.push(
      g + ' ' + g + ' ' + g + ' RG ' + (grosor || 0.7) + ' w ' +
      MARGEN + ' ' + y.toFixed(2) + ' m ' + (ANCHO_HOJA - MARGEN) + ' ' +
      y.toFixed(2) + ' l S');
    return this;
  };

  Hoja.prototype.recuadro = function (alto, gris) {
    var y = ALTO_HOJA - this.actual.y - alto + 10;
    var g = gris == null ? 0.96 : gris;
    this.actual.ordenes.push(
      g + ' ' + g + ' ' + g + ' rg ' + MARGEN + ' ' + y.toFixed(2) + ' ' +
      ANCHO_UTIL + ' ' + alto + ' re f');
    return this;
  };


  /* ------------------------------------------------------------------------
     ARMADO DEL ARCHIVO
     ------------------------------------------------------------------------
     La parte delicada es la tabla `xref`: lleva la posición EN BYTES de cada
     objeto dentro del archivo. Si un número está mal, el lector abre el PDF
     en blanco o directamente lo rechaza.

     Por eso se arma en dos tiempos: primero se juntan los pedazos, midiendo
     cuánto ocupa cada uno, y recién al final se escribe la tabla.

     Y por eso todo el texto ya pasó por aWinAnsi(): así cada carácter ocupa
     exactamente un byte y la cuenta de posiciones cierra. Con UTF-8 una
     tilde ocuparía dos y todas las posiciones quedarían corridas.
     ------------------------------------------------------------------------ */
  function construir(hoja) {
    var objetos = [];
    var nPaginas = hoja.paginas.length;

    // 1 catálogo · 2 páginas · 3..(2+n) páginas · luego contenidos · fuentes
    var idPrimeraPagina = 3;
    var idPrimerContenido = idPrimeraPagina + nPaginas;
    var idFuente = idPrimerContenido + nPaginas;

    var kids = [];
    for (var i = 0; i < nPaginas; i++) kids.push((idPrimeraPagina + i) + ' 0 R');

    objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objetos[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + nPaginas + ' >>';

    for (i = 0; i < nPaginas; i++) {
      objetos[idPrimeraPagina + i] =
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + ANCHO_HOJA + ' ' + ALTO_HOJA + '] ' +
        '/Resources << /Font << /F1 ' + idFuente + ' 0 R /F2 ' + (idFuente + 1) + ' 0 R >> >> ' +
        '/Contents ' + (idPrimerContenido + i) + ' 0 R >>';

      var flujo = hoja.paginas[i].ordenes.join('\n');
      objetos[idPrimerContenido + i] =
        '<< /Length ' + flujo.length + ' >>\nstream\n' + flujo + '\nendstream';
    }

    objetos[idFuente] =
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objetos[idFuente + 1] =
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    var partes = ['%PDF-1.4\n%âãÏÓ\n'];
    var largo = partes[0].length;
    var posiciones = [];

    for (i = 1; i < objetos.length; i++) {
      posiciones[i] = largo;
      var obj = i + ' 0 obj\n' + objetos[i] + '\nendobj\n';
      partes.push(obj);
      largo += obj.length;
    }

    var inicioXref = largo;
    var xref = 'xref\n0 ' + objetos.length + '\n0000000000 65535 f \n';
    for (i = 1; i < objetos.length; i++) {
      xref += ('0000000000' + posiciones[i]).slice(-10) + ' 00000 n \n';
    }
    partes.push(xref);
    partes.push('trailer\n<< /Size ' + objetos.length + ' /Root 1 0 R >>\n' +
                'startxref\n' + inicioXref + '\n%%EOF\n');

    // Cada carácter es un byte (ya está en WinAnsi), así que se copia tal cual.
    var texto = partes.join('');
    var bytes = new Uint8Array(texto.length);
    for (i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i) & 0xFF;
    return new Blob([bytes], { type: 'application/pdf' });
  }


  /* ------------------------------------------------------------------------
     EL COMPROBANTE
     ------------------------------------------------------------------------ */
  function armarPedido(d) {
    var h = new Hoja();
    var derecha = ANCHO_HOJA - MARGEN;

    // --- Encabezado ---
    h.texto('VITALICA', MARGEN, { tam: 22, negrita: true });
    h.texto('Pedido ' + d.numero, derecha, { tam: 13, negrita: true, derecha: true });
    h.bajar(15);
    h.texto('Olimp Sport Nutrition · Paraguay', MARGEN, { tam: 9, gris: 0.45 });
    h.texto(d.fecha, derecha, { tam: 9, gris: 0.45, derecha: true });
    h.bajar(14);
    h.linea(1.4, 0.15);
    h.bajar(26);

    // --- Detalle ---
    h.texto('DETALLE DEL PEDIDO', MARGEN, { tam: 9, negrita: true, gris: 0.35 });
    h.bajar(14);
    h.linea(0.7);
    h.bajar(16);

    (d.items || []).forEach(function (it) {
      h.espacio(30);
      var nombre = it.cantidad + ' x ' + it.nombre;
      var precio = it.subtotal || 'A confirmar';
      // El nombre se recorta para que nunca se monte sobre el precio.
      h.texto(recortar(nombre, 10, false, ANCHO_UTIL - 110), MARGEN, { tam: 10 });
      h.texto(precio, derecha, { tam: 10, derecha: true });
      if (it.variante) {
        h.bajar(12);
        h.texto(it.variante, MARGEN + 12, { tam: 8.5, gris: 0.5 });
      }
      h.bajar(16);
    });

    h.linea(0.7);
    h.bajar(18);

    // --- Totales ---
    if (d.subtotal) {
      h.texto('Subtotal', derecha - 110, { tam: 10, gris: 0.4, derecha: true });
      h.texto(d.subtotal, derecha, { tam: 10, derecha: true });
      h.bajar(15);
    }
    h.texto('Envío', derecha - 110, { tam: 10, gris: 0.4, derecha: true });
    h.texto(d.envio || 'A confirmar', derecha, { tam: 10, derecha: true });
    h.bajar(20);
    h.texto('TOTAL', derecha - 110, { tam: 12, negrita: true, derecha: true });
    h.texto(d.total || 'A confirmar', derecha, { tam: 12, negrita: true, derecha: true });
    h.bajar(30);

    // --- Bloques de datos ---
    function bloque(titulo, renglones) {
      var vivas = (renglones || []).filter(Boolean);
      if (!vivas.length) return;
      h.espacio(28 + vivas.length * 13);
      h.texto(titulo, MARGEN, { tam: 9, negrita: true, gris: 0.35 });
      h.bajar(14);
      vivas.forEach(function (r) { h.texto(r, MARGEN, { tam: 10 }); h.bajar(13); });
      h.bajar(10);
    }

    bloque('DATOS DEL CLIENTE', d.cliente);
    bloque('ENTREGA', d.entrega);
    bloque('FORMA DE PAGO', d.pago);

    // --- Aviso legal ---
    h.espacio(60);
    h.bajar(6);
    h.recuadro(34);
    h.bajar(6);
    h.texto('Esto no es un comprobante de pago.', MARGEN + 12, { tam: 9, negrita: true });
    h.bajar(12);
    h.texto('El pedido queda confirmado cuando un asesor responde por WhatsApp.',
            MARGEN + 12, { tam: 9, gris: 0.35 });
    h.bajar(30);

    h.texto('Los suplementos no sustituyen una alimentación equilibrada.',
            ANCHO_HOJA / 2, { tam: 8, gris: 0.55, centrado: true });

    return construir(h);
  }


  /* Baja el archivo. El object URL se libera después: si no, el navegador se
     queda con el PDF entero en memoria hasta que se cierre la pestaña. */
  function descargar(blob, nombre) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  global.PdfPedido = { armar: armarPedido, descargar: descargar };
})(window);
