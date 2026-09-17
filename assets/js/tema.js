/* ==========================================================================
   VITALICA — Selector de tema (propuesta de rediseño 2026)
   --------------------------------------------------------------------------
   Prende y apaga assets/css/tema-2026.css poniendo o sacando el atributo
   data-tema="2026" en el <html>.

       vitalica.com.py/               el diseño NUEVO (es el predeterminado)
       vitalica.com.py/?tema=actual   vuelve al diseño viejo (y queda así)
       vitalica.com.py/?tema=2026     vuelve al nuevo

   La elección se guarda en el navegador, así que una vez elegido se puede
   navegar todo el sitio y seguir viéndolo igual. Es por navegador: si Diego
   lo prende en su compu, marketing sigue viendo el diseño actual.

   POR QUÉ ESTE ARCHIVO VA PRIMERO Y SIN defer
   -------------------------------------------
   Si el atributo se pusiera después de pintar, se vería medio segundo el
   diseño viejo y recién ahí el nuevo. Va en el <head>, antes que todo, para
   que el navegador ya pinte el primer cuadro con el tema correcto.

   CUANDO SE DECIDA
   ----------------
   Si se aprueba, esto y el ?tema= desaparecen: el contenido de tema-2026.css
   se funde dentro de styles.css y listo. Si no se aprueba, se borran los dos
   archivos y no queda rastro. No hay nada del sitio que dependa de esto.
   ========================================================================== */
(function () {
  'use strict';

  var CLAVE = 'vitalica_tema';
  var raiz = document.documentElement;

  // 1) ¿Viene pedido por la URL? Eso manda y además se recuerda.
  var pedido = null;
  try {
    pedido = new URLSearchParams(location.search).get('tema');
  } catch (e) { /* navegador viejo: se ignora y se usa lo guardado */ }

  if (pedido === '2026' || pedido === 'actual') {
    try { localStorage.setItem(CLAVE, pedido); } catch (e) {}
  }

  /* 1-bis) OLVIDAR LA ELECCIÓN VIEJA, UNA SOLA VEZ
     ------------------------------------------------------------------
     Al invertir el predeterminado no alcanza con cambiar la regla: quien
     ya había tocado "Ver el actual" tiene guardado 'actual' en su
     navegador y le iba a seguir apareciendo el diseño viejo, con la
     misma confusión de siempre — "¿por qué no veo los cambios?".

     Esta marca se escribe una vez. Si no está, quiere decir que lo
     guardado viene de antes del cambio y se descarta. De ahí en adelante
     la elección de cada uno se respeta como siempre.

     Cuando la propuesta se apruebe y esto se borre entero, la marca se va
     con el archivo. */
  var MARCA = 'vitalica_tema_v2';
  try {
    if (!localStorage.getItem(MARCA)) {
      localStorage.setItem(MARCA, '1');
      if (!pedido) localStorage.removeItem(CLAVE);
    }
  } catch (e) { /* sin localStorage: se usa el predeterminado y listo */ }

  // 2) Si no, lo que se haya elegido antes en este navegador.
  var tema = pedido;
  if (tema !== '2026' && tema !== 'actual') {
    try { tema = localStorage.getItem(CLAVE); } catch (e) { tema = null; }
  }

  /* EL NUEVO ES EL PREDETERMINADO  ·  cambiado el 17/9/2026
     ------------------------------------------------------------------
     Antes, sin elección previa, se veía el diseño viejo y el nuevo había
     que pedirlo con ?tema=2026. Eso se dio vuelta porque la propuesta ya
     está en revisión: quien abre el sitio —Diego, marketing— tiene que
     ver lo nuevo sin saberse un parámetro de memoria.

     Y había un problema peor: la elección se guarda en el navegador. A
     quien alguna vez tocó "Ver el actual" le quedaba pegado el diseño
     viejo para siempre, y después parecía que los cambios no se habían
     hecho. Pasó varias veces.

     Ahora manda esta regla: solo se ve el diseño viejo si se pidió
     explícitamente. En cualquier otro caso, el nuevo. */
  if (tema === 'actual') raiz.removeAttribute('data-tema');
  else raiz.setAttribute('data-tema', '2026');


  /* ------------------------------------------------------------------
     Botón flotante para cambiar sin tocar la URL.

     Aparece en dos casos:

       · si el tema se eligió alguna vez en este navegador, para poder
         volver atrás;
       · SIEMPRE que el sitio corra en localhost, porque ahí estamos
         probando y no tiene sentido esconder el botón.

     Lo segundo es por algo concreto: al abrir localhost:4323 a secas se ve
     el diseño actual —correcto, el nuevo se pide— y no hay ninguna pista
     de que exista el otro. Sin el botón, la única forma de llegar es saber
     de memoria que hay que escribir ?tema=2026. Pasó dos veces.

     En el sitio publicado sigue igual que antes: un visitante normal no ve
     ningún botón de pruebas hasta que alguien le pasa el enlace con el
     parámetro.
     ------------------------------------------------------------------ */
  var enLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (!enLocal && tema !== '2026' && tema !== 'actual') return;

  document.addEventListener('DOMContentLoaded', function () {
    var esNuevo = raiz.getAttribute('data-tema') === '2026';

    /* En celular, abajo de todo ya vive la barra fija de comprar de la ficha
       de producto. Si este selector se queda en bottom:16px, se le acuesta
       encima justo al botón de agregar al carrito — que es lo que hay que
       probar. En pantallas chicas sube, y en la ficha sube un poco más.

       Va como <style> y no como estilo en línea porque hace falta una media
       query, que en línea no se puede escribir.

       Y lleva !important porque el resto del recuadro se arma con estilos en
       línea, que le ganan a cualquier regla de hoja de estilos. Sin eso, el
       bottom:16px de abajo seguía mandando y el selector se quedaba encima de
       la barra igual. */
    var estilos = document.createElement('style');
    estilos.textContent =
      '@media (max-width: 760px){' +
        '[data-selector-tema]{left:8px !important;right:8px;' +
          'justify-content:space-between}' +
        'body.con-compra-fija [data-selector-tema]{bottom:88px !important}' +
      '}';
    document.head.appendChild(estilos);

    var caja = document.createElement('div');
    caja.setAttribute('data-selector-tema', '');
    caja.style.cssText = [
      'position:fixed', 'left:16px', 'bottom:16px', 'z-index:9999',
      'display:flex', 'align-items:center', 'gap:8px',
      'background:#0A0A0B', 'color:#fff', 'padding:8px 10px 8px 14px',
      'border-radius:4px', 'box-shadow:0 6px 24px rgba(0,0,0,.35)',
      'font:600 12px/1 system-ui,sans-serif', 'letter-spacing:.04em'
    ].join(';');

    var texto = document.createElement('span');
    texto.textContent = esNuevo ? 'Diseño propuesto' : 'Diseño actual';
    texto.style.cssText = 'opacity:.75;text-transform:uppercase';

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = esNuevo ? 'Ver el actual' : 'Ver el propuesto';
    boton.style.cssText = [
      'background:#EF7D2A', 'color:#0A0A0B', 'border:0', 'cursor:pointer',
      'padding:7px 12px', 'border-radius:3px',
      'font:800 12px/1 system-ui,sans-serif', 'letter-spacing:.04em',
      'text-transform:uppercase'
    ].join(';');

    // Se recarga en vez de solo cambiar el atributo: el header, el hero y
    // las tarjetas los arma JavaScript leyendo medidas del navegador, y
    // algunas quedan calculadas con el tema anterior. Recargar evita tener
    // que perseguir ese tipo de resto.
    boton.addEventListener('click', function () {
      try { localStorage.setItem(CLAVE, esNuevo ? 'actual' : '2026'); } catch (e) {}
      location.reload();
    });

    caja.appendChild(texto);
    caja.appendChild(boton);
    document.body.appendChild(caja);
  });
})();
