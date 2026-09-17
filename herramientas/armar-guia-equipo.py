# -*- coding: utf-8 -*-
"""
Arma la guía del equipo como una página autocontenida.

Las capturas se incrustan en el HTML (data URI) porque la guía se comparte por
enlace y tiene que verse sin depender de este proyecto ni de ningún servidor.

Antes de correr esto:
    powershell -ExecutionPolicy Bypass -File herramientas/capturar-guia.ps1

    python herramientas/armar-guia-equipo.py
"""
import io, os, base64, subprocess, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURAS = os.path.join(RAIZ, '_previsualizacion', 'guia')
CHICAS = os.path.join(CAPTURAS, 'chicas')
PLANTILLA = os.path.join(RAIZ, 'herramientas', 'plantilla-guia.html')
SALIDA = os.path.join(RAIZ, '_previsualizacion', 'guia-equipo.html')

# Las capturas con fotos pesan mucho como PNG: van a JPEG.
# Las de interfaz (paneles, formularios) son colores planos y comprimen mejor
# en PNG, así que quedan como están.
CON_FOTOS = {'home', 'producto', 'productos', 'quienes-somos', 'puntos-de-venta'}
ANCHO = 1100


def convertir(nombre):
    """Achica y, si tiene fotos, pasa a JPEG. Devuelve (ruta, tipo)."""
    origen = os.path.join(CAPTURAS, nombre + '.png')
    if not os.path.isfile(origen):
        return None, None

    jpeg = nombre in CON_FOTOS
    destino = os.path.join(CHICAS, nombre + ('.jpg' if jpeg else '.png'))
    codificador = ('$e = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder; '
                   '$e.QualityLevel = 82') if jpeg else \
                  '$e = New-Object System.Windows.Media.Imaging.PngBitmapEncoder'

    ps = '''
Add-Type -AssemblyName PresentationCore
$s = [System.IO.File]::OpenRead("%s")
$img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
$esc = %d / $img.PixelWidth
if ($esc -gt 1) { $esc = 1 }
$out = New-Object System.Windows.Media.Imaging.TransformedBitmap $img,(New-Object System.Windows.Media.ScaleTransform $esc,$esc)
%s
$e.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($out))
$fs = New-Object System.IO.FileStream("%s",[System.IO.FileMode]::Create)
$e.Save($fs); $fs.Close(); $s.Close()
''' % (origen.replace('\\', '\\\\'), ANCHO, codificador, destino.replace('\\', '\\\\'))
    subprocess.run(['powershell', '-NoProfile', '-Command', ps],
                   check=True, capture_output=True)
    return destino, ('image/jpeg' if jpeg else 'image/png')


def main():
    if not os.path.isdir(CHICAS):
        os.makedirs(CHICAS)

    nombres = ['home', 'producto', 'quienes-somos', 'puntos-de-venta', 'checkout',
               'acceso', 'menu-interno', 'pedidos', 'pedido-detalle',
               'configuracion', 'equipo', 'productos']

    uris, total = {}, 0
    for n in nombres:
        ruta, tipo = convertir(n)
        if not ruta:
            print('  FALTA %s' % n)
            continue
        with open(ruta, 'rb') as f:
            datos = f.read()
        uris[n] = 'data:%s;base64,%s' % (tipo, base64.b64encode(datos).decode('ascii'))
        total += len(datos)
        print('  %-22s %6.0f KB' % (n, len(datos) / 1024))

    html = io.open(PLANTILLA, encoding='utf-8').read()
    faltantes = []
    for n, uri in uris.items():
        marca = '__IMG_%s__' % n.upper().replace('-', '_')
        if marca not in html:
            faltantes.append(marca)
        html = html.replace(marca, uri)

    io.open(SALIDA, 'w', encoding='utf-8').write(html)
    print('\n  imágenes: %.1f MB · página: %.1f MB'
          % (total / 1048576, os.path.getsize(SALIDA) / 1048576))
    if faltantes:
        print('  (sin usar en la plantilla: %s)' % ', '.join(faltantes))
    print('  ' + os.path.relpath(SALIDA, RAIZ))


if __name__ == '__main__':
    main()
