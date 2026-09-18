# -*- coding: utf-8 -*-
"""
Pone (o corrige) las etiquetas de compartir en todas las páginas.

    python herramientas/poner-og.py

QUÉ SON Y POR QUÉ IMPORTAN
--------------------------
Cuando alguien pega un enlace en WhatsApp, el que lo recibe no ve la
dirección: ve una tarjeta con una imagen, un título y una bajada. Eso lo
arman las etiquetas Open Graph.

Sin ellas, compartir la ficha de un producto mostraba:

    Producto · Vitalica
    Detalle de producto Olimp en Vitalica.

Sin foto y sin decir de qué producto se trata. Para un negocio que cierra las
ventas por WhatsApp, es el peor lugar donde fallar.

DOS COSAS QUE ESTABAN MAL, ADEMÁS DE FALTAR
-------------------------------------------
  · La única página que las tenía (la portada) apuntaba a un .webp. WhatsApp
    no previsualiza webp, así que ni ahí aparecía la imagen. Ahora se usa
    og-portada.jpg, que lo arma herramientas/armar-og.ps1.
  · No había <link rel="canonical">, que es lo que le dice a Google cuál es
    la dirección buena de cada página.

LO QUE ESTE SCRIPT NO PUEDE RESOLVER
------------------------------------
Las fichas de producto y las notas del blog son UNA sola página cada una
(producto.html y nota.html) que cambia de contenido según el ?id=. El texto
lo pone JavaScript al abrirse, pero los lectores de enlaces de WhatsApp y
Facebook NO ejecutan JavaScript: leen el HTML tal como viene del servidor.

O sea que todas las fichas van a compartir la misma tarjeta. Se les pone una
tarjeta genérica honesta ("Productos Olimp en Vitalica") en vez de la que
decía "Producto · Vitalica", que parecía un error.

Para que cada producto tenga la suya hay que generar un archivo por producto.
Es otro trabajo y cambia las direcciones, así que se decide aparte.
"""
import io
import os
import re

SITIO = 'https://vitalica.com.py'
IMAGEN = SITIO + '/assets/img/og-portada.jpg'

# pagina -> (titulo para compartir, bajada, direccion canonica)
PAGINAS = {
    'index.html': (
        'Vitalica · Suplementos deportivos en Paraguay',
        'Representante exclusivo de OLIMP Sport Nutrition. Proteínas, creatina y '
        'pre-entrenos de grado farmacéutico europeo.',
        '/'),
    'productos.html': (
        'Productos Olimp · Vitalica',
        'Toda la línea de OLIMP Sport Nutrition en Paraguay: proteínas, creatina, '
        'pre-entrenos, vitaminas y omega 3.',
        '/productos.html'),
    'producto.html': (
        'Productos Olimp · Vitalica',
        'Suplementos OLIMP originales en Paraguay, con respaldo y trazabilidad. '
        'Consultá disponibilidad por WhatsApp.',
        '/productos.html'),
    'sobre.html': (
        'Olimp Sport Nutrition · Vitalica',
        '35 años fabricando en Polonia bajo estándares farmacéuticos europeos. '
        'Vitalica es su representante exclusivo en Paraguay.',
        '/sobre.html'),
    'guia.html': (
        'Guía de uso de suplementos · Vitalica',
        'Cómo y por qué usar cada suplemento. Información clara, sin mitos.',
        '/guia.html'),
    'guia-creatina.html': (
        'Creatina: cómo tomarla y por qué funciona · Vitalica',
        'Qué dice la ciencia sobre la creatina, la dosis correcta y los mitos que '
        'conviene dejar atrás.',
        '/guia-creatina.html'),
    'guia-proteina-suero.html': (
        'Proteína de suero: cuándo, cuánto y para qué · Vitalica',
        'Timing, cantidad y para quién tiene sentido la proteína en polvo. '
        'Lo esencial, sin vueltas.',
        '/guia-proteina-suero.html'),
    'guia-pre-entrenos.html': (
        'Pre-entrenos: beta-alanina, citrulina y cafeína · Vitalica',
        'Qué hace cada ingrediente de tu pre-entreno y cómo usarlo bien, '
        'sin pasarte de la raya.',
        '/guia-pre-entrenos.html'),
    'noticias.html': (
        'Noticias y notas · Vitalica',
        'Novedades de la línea de Olimp, cómo se fabrica y qué hay detrás de '
        'cada producto.',
        '/noticias.html'),
    'nota.html': (
        'Noticias y notas · Vitalica',
        'Novedades de la línea de Olimp, cómo se fabrica y qué hay detrás de '
        'cada producto.',
        '/noticias.html'),
    'contacto.html': (
        'Contacto y puntos de venta · Vitalica',
        'Dónde comprar la línea Olimp en Paraguay y cómo contactarnos.',
        '/contacto.html'),
    'carrito.html': (
        'Tu carrito · Vitalica',
        'Revisá tu pedido y cerralo por WhatsApp con un asesor.',
        '/carrito.html'),
    'checkout.html': (
        'Armá tu pedido · Vitalica',
        'Completá tus datos y te abrimos WhatsApp con el pedido listo.',
        '/checkout.html'),
    'privacidad.html': (
        'Política de privacidad · Vitalica',
        'Qué datos guardamos, para qué y cómo pedir que los borremos.',
        '/privacidad.html'),
    'terminos.html': (
        'Términos y condiciones · Vitalica',
        'Condiciones de compra, envíos y devoluciones.',
        '/terminos.html'),
    '404.html': (
        'Página no encontrada · Vitalica',
        'El enlace que abriste ya no existe. Mirá los productos o escribinos.',
        '/404.html'),
}

# Las que no deben aparecer en buscadores. Privacidad y terminos SI se indexan:
# Meta y Google Merchant revisan que esas paginas existan y sean alcanzables
# antes de aprobar una cuenta publicitaria.
SIN_INDICE = ['carrito.html', 'checkout.html', '404.html']

MARCA_INI = '  <!-- COMPARTIR: lo que se ve al pegar el enlace en WhatsApp. -->'
MARCA_FIN = '  <!-- /COMPARTIR -->'


def bloque(titulo, bajada, canonica, sin_indice):
    """El mismo juego de etiquetas para todas, para no tener doce variantes."""
    l = [MARCA_INI]
    l.append('  <link rel="canonical" href="%s%s">' % (SITIO, canonica))
    if sin_indice:
        # Un carrito o un checkout en Google no le sirve a nadie.
        l.append('  <meta name="robots" content="noindex, follow">')
    l.append('  <meta property="og:type" content="website">')
    l.append('  <meta property="og:site_name" content="Vitalica">')
    l.append('  <meta property="og:locale" content="es_PY">')
    l.append('  <meta property="og:title" content="%s">' % titulo)
    l.append('  <meta property="og:description" content="%s">' % bajada)
    l.append('  <meta property="og:url" content="%s%s">' % (SITIO, canonica))
    l.append('  <meta property="og:image" content="%s">' % IMAGEN)
    l.append('  <meta property="og:image:width" content="1200">')
    l.append('  <meta property="og:image:height" content="630">')
    # El texto alternativo de la imagen: lo leen los lectores de pantalla y
    # algunos clientes lo muestran si la imagen no carga.
    l.append('  <meta property="og:image:alt" content="Vitalica · representante '
             'exclusivo de Olimp Sport Nutrition en Paraguay">')
    l.append('  <meta name="twitter:card" content="summary_large_image">')
    l.append('  <meta name="twitter:title" content="%s">' % titulo)
    l.append('  <meta name="twitter:description" content="%s">' % bajada)
    l.append('  <meta name="twitter:image" content="%s">' % IMAGEN)
    l.append(MARCA_FIN)
    return '\n'.join(l)


def limpiar(html):
    """Saca lo que hubiera de antes: el bloque nuestro y las etiquetas sueltas.

    Sin esto, cada corrida dejaría og:title repetido y el lector de enlaces se
    queda con el primero, que sería el viejo."""
    html = re.sub(re.escape(MARCA_INI) + r'.*?' + re.escape(MARCA_FIN) + r'\n?',
                  '', html, flags=re.S)
    html = re.sub(r'^[ \t]*<meta property="og:[^"]+"[^>]*>\n?', '', html, flags=re.M)
    html = re.sub(r'^[ \t]*<meta name="twitter:[^"]+"[^>]*>\n?', '', html, flags=re.M)
    html = re.sub(r'^[ \t]*<link rel="canonical"[^>]*>\n?', '', html, flags=re.M)
    return html


def main():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tocados = 0

    for archivo, (titulo, bajada, canonica) in PAGINAS.items():
        ruta = os.path.join(raiz, archivo)
        if not os.path.exists(ruta):
            print('  falta %s' % archivo)
            continue

        html = io.open(ruta, encoding='utf-8').read()
        html = limpiar(html)

        nuevo = bloque(titulo, bajada, canonica, archivo in SIN_INDICE)

        # Va justo después de la meta description, que es donde se espera
        # encontrarlo al leer el <head>.
        m = re.search(r'^[ \t]*<meta name="description"[^>]*>\n', html, flags=re.M)
        if m:
            html = html[:m.end()] + nuevo + '\n' + html[m.end():]
        else:
            html = html.replace('</head>', nuevo + '\n</head>', 1)

        io.open(ruta, 'w', encoding='utf-8').write(html)
        tocados += 1
        print('  %-26s %s' % (archivo, titulo[:46]))

    print('\n  %d páginas con etiquetas de compartir' % tocados)


if __name__ == '__main__':
    main()
