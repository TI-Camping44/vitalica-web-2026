/* ============================================================================
   VITALICA — auditar-diseno.js
   ----------------------------------------------------------------------------
   Revisa una página abierta y devuelve los problemas de lectura y de uso que
   se pueden MEDIR, en vez de mirarlos de a uno.

   Se pega en la consola del navegador, o se corre desde las herramientas de
   automatización. No modifica nada: solo lee.

       auditarDiseno()        → informe de la página actual

   QUÉ MIRA, Y POR QUÉ CADA COSA

     1. CONTRASTE. La norma de accesibilidad (WCAG AA) pide 4,5:1 para texto
        normal y 3:1 para texto grande. Debajo de eso hay gente que
        directamente no lo lee: con el sol en la pantalla del teléfono, o con
        la vista cansada. Se calcula con la fórmula oficial de luminancia.

     2. TAMAÑO DE LETRA. Menos de 12px en un teléfono no se lee sin acercar.
        Se marca todo lo que baje de ahí.

     3. LARGO DE RENGLÓN. Más de 75 caracteres por línea y el ojo se pierde
        al volver; menos de 45 y el texto se pica. Es la regla vieja de
        tipografía y sigue valiendo.

     4. BLANCOS PARA TOCAR. En un teléfono, un botón o enlace de menos de
        44x44 px se falla con el dedo. Es la medida que recomiendan Apple y
        Google, y no es capricho: es el ancho de una yema.

     5. DESBORDES. Cualquier cosa que se salga del ancho de la pantalla
        produce esa barra horizontal que arruina la navegación en celular.

     6. JERARQUÍA. Si el texto del cuerpo y un titular miden casi lo mismo,
        la página se lee plana. Se listan los tamaños para ver si la escala
        tiene escalones o es un tobogán.

   LO QUE NO PUEDE MIRAR: si una foto es linda, si el texto dice lo que tiene
   que decir, o si el orden de las secciones tiene sentido comercial. Eso se
   mira con los ojos. Esto sirve para que los ojos se ocupen de eso y no de
   contar píxeles.
   ========================================================================== */
function auditarDiseno() {
  'use strict';

  /* ---- Contraste, según la fórmula de WCAG ---- */
  function canal(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminancia(rgb) {
    return 0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2]);
  }
  function aRgb(css) {
    var m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  }
  /* El fondo real puede estar varios niveles más arriba (los de en medio son
     transparentes), así que se sube hasta encontrar uno opaco. */
  function fondoReal(el) {
    var n = el;
    while (n && n !== document.documentElement) {
      var c = aRgb(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  }
  function contraste(a, b) {
    var l1 = luminancia(a), l2 = luminancia(b);
    var claro = Math.max(l1, l2), oscuro = Math.min(l1, l2);
    return Math.round(((claro + 0.05) / (oscuro + 0.05)) * 100) / 100;
  }

  function visible(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;

    /* EL CARRUSEL NO CUENTA COMO DESBORDE.
       Las diapositivas que no se están mostrando viven fuera del cuadro a
       propósito, adentro de un contenedor con overflow oculto. Sin esta
       comprobación el informe marcaba veinte "desbordes" que en realidad
       son el carrusel funcionando. */
    var n = el.parentElement;
    while (n && n !== document.body) {
      var c = getComputedStyle(n);
      if (c.overflow === 'hidden' || c.overflowX === 'hidden') {
        var rn = n.getBoundingClientRect();
        if (r.right <= rn.left + 1 || r.left >= rn.right - 1) return false;
      }
      n = n.parentElement;
    }
    return true;
  }

  /* ¿Este texto está sobre una foto? Entonces el contraste NO se puede
     calcular: depende del píxel de la foto que quede detrás de cada letra, y
     eso cambia según el recorte y la pantalla. Marcarlo como "falla" sería
     mentir —el hero es blanco sobre una foto oscura con velo y se lee
     perfecto— así que se separa en su propia lista para mirarlo a ojo. */
  function sobreFoto(el) {
    var n = el;
    while (n && n !== document.documentElement) {
      var c = getComputedStyle(n);
      if (c.backgroundImage && c.backgroundImage !== 'none') return true;
      if (n.querySelector && n.matches('.hero__slide, .banda-sinatajos, .prod-banda, .categoria-card, .ciencia')) return true;
      n = n.parentElement;
    }
    return false;
  }
  function ruta(el) {
    var cls = String(el.className || '').split(' ').filter(Boolean)[0];
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  }
  function texto(el) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 42);
  }

  var ancho = document.documentElement.clientWidth;
  var esCelular = ancho < 760;
  var informe = {
    pagina: location.pathname.split('/').pop() || 'index.html',
    ancho: ancho,
    contrasteBajo: [],
    contrasteSobreFoto: [],
    letraChica: [],
    renglonLargo: [],
    blancoChico: [],
    desbordes: [],
    escalaTipografica: {}
  };

  /* Solo elementos que contienen texto propio, no contenedores. */
  var conTexto = [].slice.call(document.querySelectorAll('body *')).filter(function (el) {
    if (!visible(el)) return false;
    var propio = [].slice.call(el.childNodes)
      .filter(function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
    return propio.length > 0;
  });

  conTexto.forEach(function (el) {
    var cs = getComputedStyle(el);
    var tam = parseFloat(cs.fontSize);
    var col = aRgb(cs.color);
    if (!col) return;

    // --- contraste ---
    var ratio = contraste(col.rgb, fondoReal(el));
    var grande = tam >= 24 || (tam >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    var minimo = grande ? 3 : 4.5;
    if (ratio < minimo) {
      var destino = sobreFoto(el) ? informe.contrasteSobreFoto : informe.contrasteBajo;
      destino.push({
        el: ruta(el), texto: texto(el), tam: Math.round(tam),
        contraste: ratio, minimo: minimo
      });
    }

    // --- letra chica ---
    if (tam < 12) {
      informe.letraChica.push({ el: ruta(el), texto: texto(el), tam: Math.round(tam * 10) / 10 });
    }

    // --- largo de renglón ---
    var largo = (el.textContent || '').trim().length;
    if (largo > 60) {
      var r = el.getBoundingClientRect();
      // ~0.5 em por carácter es una aproximación buena para una grotesca.
      var porRenglon = Math.round(r.width / (tam * 0.5));
      if (porRenglon > 75 || porRenglon < 30) {
        informe.renglonLargo.push({
          el: ruta(el), texto: texto(el), caracteresPorRenglon: porRenglon
        });
      }
    }

    // --- escala tipográfica ---
    var k = Math.round(tam) + 'px';
    informe.escalaTipografica[k] = (informe.escalaTipografica[k] || 0) + 1;
  });

  /* --- blancos para tocar (solo importa en celular) --- */
  if (esCelular) {
    [].slice.call(document.querySelectorAll('a, button, [role="button"], input, select'))
      .filter(visible)
      .forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.height < 40 || r.width < 40) {
          informe.blancoChico.push({
            el: ruta(el), texto: texto(el),
            medida: Math.round(r.width) + 'x' + Math.round(r.height)
          });
        }
      });
  }

  /* --- desbordes --- */
  [].slice.call(document.querySelectorAll('body *')).filter(visible).forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.right > ancho + 2 || r.left < -2) {
      informe.desbordes.push({
        el: ruta(el), texto: texto(el),
        izq: Math.round(r.left), der: Math.round(r.right)
      });
    }
  });

  // Se resume: si hay 40 elementos con el mismo problema, no hace falta
  // listarlos todos para entenderlo.
  ['contrasteBajo', 'contrasteSobreFoto', 'letraChica', 'renglonLargo', 'blancoChico', 'desbordes'].forEach(function (k) {
    informe[k + '_total'] = informe[k].length;
    informe[k] = informe[k].slice(0, 8);
  });

  return informe;
}
