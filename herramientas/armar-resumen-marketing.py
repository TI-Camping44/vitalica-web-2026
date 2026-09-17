# -*- coding: utf-8 -*-
"""
Arma el resumen para marketing como una página autocontenida.

Las imágenes van incrustadas en el propio HTML (data URI) porque la página se
comparte por enlace y tiene que verse sin depender de este proyecto ni de
ningún servidor.

    python herramientas/armar-resumen-marketing.py
"""
import io, os, base64, subprocess, json

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHICOS = os.path.join(RAIZ, '_previsualizacion', 'logos-chicos')


def achicar(origen, destino, ancho_max=420):
    """Baja el logo a un tamaño razonable para incrustar.

    Se muestran a 190 px como mucho; guardarlos a 3082 px de ancho haría una
    página de varios MB sin ninguna ganancia visible.
    """
    ps = '''
Add-Type -AssemblyName PresentationCore
$s = [System.IO.File]::OpenRead("%s")
$img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
$esc = %d / [Math]::Max($img.PixelWidth, 1)
if ($esc -gt 1) { $esc = 1 }
$out = New-Object System.Windows.Media.Imaging.TransformedBitmap $img,(New-Object System.Windows.Media.ScaleTransform $esc,$esc)
$enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($out))
$fs = New-Object System.IO.FileStream("%s",[System.IO.FileMode]::Create)
$enc.Save($fs); $fs.Close(); $s.Close()
''' % (origen.replace('\\', '\\\\'), ancho_max, destino.replace('\\', '\\\\'))
    subprocess.run(['powershell', '-NoProfile', '-Command', ps],
                   check=True, capture_output=True)


def data_uri(ruta):
    with open(ruta, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')


def main():
    if not os.path.isdir(CHICOS):
        os.makedirs(CHICOS)

    aliados = ['shopping-china', 'kb', 'energy', 'bigg', 'cellshop', 'gtc',
               'fitway', 'el-negro', 'toku', 'contimarket', 'vitamin-shoppe']

    uris = {}
    for nombre in aliados:
        origen = os.path.join(RAIZ, 'assets', 'img', 'aliados', nombre + '.png')
        chico = os.path.join(CHICOS, nombre + '.png')
        achicar(origen, chico)
        uris[nombre] = data_uri(chico)

    # El "antes" de Shopping China: el archivo sin recortar
    origen = os.path.join(RAIZ, '_drive', 'aliados-originales', 'shopping-china.png')
    chico = os.path.join(CHICOS, 'shopping-china-original.png')
    achicar(origen, chico)
    uris['shopping-china-original'] = data_uri(chico)

    salida = os.path.join(CHICOS, 'uris.json')
    io.open(salida, 'w', encoding='utf-8').write(json.dumps(uris))
    total = sum(len(v) for v in uris.values())
    print('%d imágenes · %.0f KB incrustadas' % (len(uris), total / 1024))
    print(salida)


if __name__ == '__main__':
    main()
