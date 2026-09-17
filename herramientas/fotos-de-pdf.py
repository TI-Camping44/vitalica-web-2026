# -*- coding: utf-8 -*-
"""
Saca las fotos que vienen adentro de un PDF, sin instalar nada.

    python herramientas/fotos-de-pdf.py "archivo.pdf" carpeta-de-salida

COMO FUNCIONA
-------------
Cuando un PDF trae una foto, casi siempre la guarda como el JPEG original,
tal cual, entre `stream` y `endstream`. El diccionario que va justo antes lo
declara con /DCTDecode ("esto es un JPEG").

O sea que no hay que decodificar nada: alcanza con encontrar esos bloques y
escribirlos a disco con extension .jpg. Salen con la resolucion original, que
suele ser mucho mejor que la que se ve en pantalla.

Las imagenes con /FlateDecode (PNG, logos, planos) no se tocan: reconstruirlas
pide armar el PNG a mano y casi nunca son fotos utiles.

LIMITES
-------
  · Salen TODAS, incluidos fondos, texturas y recortes sueltos. Hay que
    mirarlas: para eso esta herramientas/hoja-de-contactos-fotos.ps1.
  · No conserva el nombre ni el orden de las paginas: se numeran como
    aparecen en el archivo.
"""
import io
import os
import re
import sys


def main(pdf, destino):
    crudo = open(pdf, 'rb').read()
    if not os.path.isdir(destino):
        os.makedirs(destino)

    # El objeto completo: "<< ...diccionario... >> stream ...bytes... endstream"
    patron = re.compile(rb'<<([^<>]*(?:<<[^>]*>>[^<>]*)*)>>\s*stream\r?\n(.*?)endstream',
                        re.S)

    n = 0
    for dic, datos in patron.findall(crudo):
        if b'/DCTDecode' not in dic:
            continue

        # Un JPEG empieza con FF D8 y termina con FF D9. Se recorta a eso por
        # si el bloque trae bytes de relleno al final.
        i = datos.find(b'\xff\xd8')
        j = datos.rfind(b'\xff\xd9')
        if i < 0 or j < 0 or j <= i:
            continue
        jpg = datos[i:j + 2]

        # Menos de 20 KB casi siempre es un icono o una textura.
        if len(jpg) < 20000:
            continue

        n += 1
        ruta = os.path.join(destino, 'osn-%02d.jpg' % n)
        with open(ruta, 'wb') as f:
            f.write(jpg)
        print('  osn-%02d.jpg   %7.0f KB' % (n, len(jpg) / 1024.0))

    print('')
    print('  %d fotos -> %s' % (n, destino))


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Uso: python herramientas/fotos-de-pdf.py archivo.pdf carpeta')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
