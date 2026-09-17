# -*- coding: utf-8 -*-
"""
Llena el campo `galeria` de cada producto en assets/js/data-fichas.js.

QUÉ ES LA GALERÍA
-----------------
La tira de miniaturas al costado de la foto grande, en la ficha de producto.
El código que la dibuja está en assets/js/pages/producto.js desde hace rato,
pero nunca se vio: si `galeria` está vacío prueba los nombres automáticos
(-2, -3, -4, -5), no encuentra nada y se esconde. O sea que era una función
completa esperando imágenes.

DE DÓNDE SALEN LAS IMÁGENES
---------------------------
  1. La tabla nutricional del producto, que estaba en _drive/nutricional/
     sin que ninguna página la usara. Es la miniatura 2 de BPN.
  2. Las fotos de las otras variantes (sabores y tamaños) que ya están
     cargadas en VITALICA_VARIANTES.

No se inventa nada: si un producto no tiene ninguna de las dos, se queda con
la galería vacía y la tira sigue sin aparecer, que es lo correcto.

    python herramientas/armar-galerias.py
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, 'assets', 'js', 'data.js')
FICHAS = os.path.join(RAIZ, 'assets', 'js', 'data-fichas.js')
NUTRI = os.path.join(RAIZ, 'assets', 'img', 'products', 'nutricional')

# El Whey tiene dos tablas: la universal y la del Doble Chocolate. Va la
# universal, que es la que corresponde a la mayoría de los sabores.
ALIAS_NUTRI = {'whey-protein-complex': 'whey-protein-complex'}


def variantes_por_producto():
    """Lee VITALICA_VARIANTES de data.js sin ejecutarlo."""
    texto = io.open(DATOS, encoding='utf-8').read()
    ini = texto.index('const VITALICA_VARIANTES')
    fin = texto.index('\n};', ini)
    bloque = texto[ini:fin]

    res, actual = {}, None
    for linea in bloque.split('\n'):
        m = re.match(r"\s*'([a-z0-9-]+)':\s*\[", linea)
        if m:
            actual = m.group(1)
            res[actual] = []
            continue
        if actual:
            f = re.search(r"imagen:\s*'([^']+)'", linea)
            if f and f.group(1) not in res[actual]:
                res[actual].append(f.group(1))
    return res


def main():
    variantes = variantes_por_producto()
    texto = io.open(FICHAS, encoding='utf-8').read()

    # Cada producto es  'id': {  ...  galeria: [...],
    ids = re.findall(r"^  '([a-z0-9-]+)':\s*\{", texto, re.M)
    cambiados = 0

    for pid in ids:
        fotos = []

        # LA TABLA NUTRICIONAL NO VA ACA.
        # Se probo y quedaba mal: una tira de tabla flotando en el recuadro
        # blanco de la foto grande, que ademas repite lo que ya esta mas
        # abajo en la ficha como tabla de verdad, con texto seleccionable y
        # legible en el celular. Una foto de una tabla es peor que la tabla.
        # Las imagenes quedan en assets/img/products/nutricional/ por si
        # alguna vez sirven para otra cosa.

        # Las variantes, sin repetir la foto principal del producto
        for v in variantes.get(pid, []):
            if v not in fotos:
                fotos.append(v)

        # La tira se muestra recién con 2 fotos (principal + 1). Con la
        # galería vacía, producto.js no dibuja nada: así queda.
        if not fotos:
            continue

        lista = '[\n' + ''.join("      '%s',\n" % f for f in fotos)[:-2] + '\n    ]'

        # Se reemplaza SOLO dentro del bloque de ese producto
        ini = texto.index("  '%s': {" % pid)
        try:
            fin = texto.index("\n  '", ini + 5)
        except ValueError:
            fin = len(texto)
        bloque = texto[ini:fin]

        nuevo = re.sub(r"galeria:\s*\[[^\]]*\]", 'galeria: ' + lista, bloque, count=1)
        if nuevo != bloque:
            texto = texto[:ini] + nuevo + texto[fin:]
            cambiados += 1
            print('  %-28s %d foto(s)' % (pid, len(fotos)))

    io.open(FICHAS, 'w', encoding='utf-8').write(texto)
    print('')
    print('  %d productos con galeria' % cambiados)


if __name__ == '__main__':
    main()
