# -*- coding: utf-8 -*-
"""
Saca el texto de un PDF sin instalar nada.

    python herramientas/texto-de-pdf.py "ruta\\al\\archivo.pdf"

POR QUE EXISTE
--------------
En esta maquina no hay pypdf, ni pdfminer, ni poppler. Y a veces llega un PDF
—un catalogo, una presentacion de Olimp— del que hace falta leer el texto
antes de decidir si sirve.

COMO FUNCIONA
-------------
Un PDF es texto plano con bloques binarios adentro. Los bloques van entre
`stream` y `endstream` y casi siempre estan comprimidos con zlib, que si
viene en Python. Descomprimido, el contenido de una pagina son ordenes de
dibujo; las que nos importan son:

    (texto) Tj           un pedazo de texto
    [(a) -250 (b)] TJ    varios pedazos con ajustes de espaciado

Se sacan las cadenas entre parentesis de esas dos ordenes.

LIMITES, para no confiarse
--------------------------
  · Si el PDF tiene el texto como IMAGEN (un escaneo, o una presentacion
    exportada como fotos), aca no sale NADA. Que no salga texto no significa
    que el PDF este vacio.
  · Los acentos pueden salir mal si la fuente usa una codificacion propia.
  · No respeta el orden visual de la pagina, sino el orden en que el
    generador escribio las ordenes.

O sea: sirve para saber QUE dice, no para copiar y pegar a ciegas.
"""
import io
import re
import sys
import zlib


def parece_texto(t):
    """True si la linea parece lenguaje y no bytes de una imagen.

    Hace falta porque adentro de un JPEG comprimido aparecen por casualidad
    las secuencias BT y ET y hasta parentesis, y el extractor las tomaba como
    si fueran ordenes de texto. Salian miles de lineas de basura.

    El criterio es tonto y funciona: una linea de verdad es casi toda
    letras, numeros, espacios y signos comunes.
    """
    if not t:
        return False
    buenos = sum(1 for c in t if c.isalnum() or c in " .,:;%()-/+&'°®–’")
    return (buenos / float(len(t))) > 0.85 and any(c.isalpha() for c in t)


def cadenas_de(contenido):
    """Devuelve el texto de las ordenes Tj y TJ de un flujo ya descomprimido."""
    salida = []

    # Las cadenas van entre parentesis. Dentro puede haber \( y \) escapados,
    # por eso el (?<!\\) : un parentesis precedido de barra no cierra nada.
    patron = re.compile(rb'\((?:[^()\\]|\\.)*\)')

    for bloque in re.findall(rb'BT(.*?)ET', contenido, re.S):
        trozos = []
        for cruda in patron.findall(bloque):
            s = cruda[1:-1]
            s = re.sub(rb'\\([()\\])', rb'\1', s)
            s = s.replace(rb'\n', b'\n').replace(rb'\t', b' ')
            trozos.append(s)
        linea = b''.join(trozos).strip()
        if linea:
            salida.append(linea)
    return salida


def main(ruta):
    crudo = open(ruta, 'rb').read()
    print('  archivo: %.1f MB' % (len(crudo) / 1048576.0))

    flujos = re.findall(rb'stream\r?\n(.*?)endstream', crudo, re.S)
    print('  bloques: %d' % len(flujos))

    lineas, comprimidos, imagenes = [], 0, 0
    for f in flujos:
        try:
            datos = zlib.decompress(f)
            comprimidos += 1
        except zlib.error:
            # No es zlib: casi siempre una imagen (JPEG va tal cual adentro).
            imagenes += 1
            continue
        lineas.extend(cadenas_de(datos))

    print('  descomprimidos: %d   ·   no comprimidos (imagenes u otros): %d'
          % (comprimidos, imagenes))
    print('')

    # Se escribe a un .txt en UTF-8 y no por pantalla: la consola de Windows
    # usa cp1252 y se cae con el primer caracter raro, que en un PDF de una
    # marca polaca aparece enseguida.
    salida = ruta.rsplit('.', 1)[0] + '.txt'
    vistos = set()
    with io.open(salida, 'w', encoding='utf-8') as f:
        for l in lineas:
            try:
                t = l.decode('utf-8')
            except UnicodeDecodeError:
                t = l.decode('latin-1', 'replace')
            t = ' '.join(t.split())
            if len(t) < 3 or not parece_texto(t):
                continue
            if t in vistos:      # las presentaciones repiten pies de pagina
                continue
            vistos.add(t)
            f.write(t + u'\n')

    print('  %d lineas distintas -> %s' % (len(vistos), salida))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Falta la ruta del PDF')
        sys.exit(1)
    main(sys.argv[1])
