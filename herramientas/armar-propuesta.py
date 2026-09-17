# -*- coding: utf-8 -*-
"""
Arma la propuesta de rediseño como una página autocontenida.

Las capturas se incrustan en el HTML (data URI) porque la propuesta se comparte
por enlace y tiene que verse sin depender de este proyecto ni de un servidor.

Antes de correr esto:
    php -S localhost:4323 -t .
    powershell -ExecutionPolicy Bypass -File herramientas/comparar-temas.ps1
    powershell -ExecutionPolicy Bypass -File herramientas/achicar.ps1 \
        -Carpeta _previsualizacion\\temas -Ancho 820 -Calidad 78 -Sufijo -med

    python herramientas/armar-propuesta.py
"""
import io, os, base64, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURAS = os.path.join(RAIZ, '_previsualizacion', 'temas', 'chicas')
PLANTILLA = os.path.join(RAIZ, 'herramientas', 'plantilla-propuesta.html')
SALIDA = os.path.join(RAIZ, '_previsualizacion', 'propuesta-2026.html')

PAGINAS = ['home', 'producto', 'catalogo', 'nosotros']
TEMAS = ['actual', '2026']

# El carrito no es una pagina: son dos estados del mismo panel, y por eso
# no entra en el bucle de las paginas. Los captura
# herramientas/capturar-carrito.ps1.
SUELTAS = [('carrito', 'falta'), ('carrito', 'logrado')]

MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
         'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def main():
    html = io.open(PLANTILLA, encoding='utf-8').read()
    total = 0
    faltan = []

    for pagina in PAGINAS:
        for tema in TEMAS:
            ruta = os.path.join(CAPTURAS, '%s-%s-med.jpg' % (pagina, tema))
            marca = '__IMG_%s_%s__' % (pagina.upper(), tema.upper())

            if not os.path.isfile(ruta):
                faltan.append(os.path.basename(ruta))
                continue
            if marca not in html:
                faltan.append('%s (marca sin usar en la plantilla)' % marca)
                continue

            datos = open(ruta, 'rb').read()
            total += len(datos)
            html = html.replace(
                marca,
                'data:image/jpeg;base64,' + base64.b64encode(datos).decode('ascii'))
            print('  %-24s %6.0f KB' % (pagina + ' / ' + tema, len(datos) / 1024))

    for pagina, tema in SUELTAS:
        ruta = os.path.join(CAPTURAS, '%s-%s-med.jpg' % (pagina, tema))
        marca = '__IMG_%s_%s__' % (pagina.upper(), tema.upper())
        if not os.path.isfile(ruta):
            faltan.append(os.path.basename(ruta))
            continue
        if marca not in html:
            faltan.append('%s (marca sin usar en la plantilla)' % marca)
            continue
        datos = open(ruta, 'rb').read()
        total += len(datos)
        html = html.replace(
            marca,
            'data:image/jpeg;base64,' + base64.b64encode(datos).decode('ascii'))
        print('  %-24s %6.0f KB' % (pagina + ' / ' + tema, len(datos) / 1024))

    hoy = datetime.date.today()
    html = html.replace('__FECHA__', '%d de %s de %d' % (hoy.day, MESES[hoy.month - 1], hoy.year))

    io.open(SALIDA, 'w', encoding='utf-8').write(html)

    print('')
    print('  imagenes: %.1f MB - pagina: %.1f MB'
          % (total / 1048576.0, os.path.getsize(SALIDA) / 1048576.0))
    if faltan:
        print('  FALTAN: %s' % ', '.join(faltan))
    print('  ' + os.path.relpath(SALIDA, RAIZ))


if __name__ == '__main__':
    main()
