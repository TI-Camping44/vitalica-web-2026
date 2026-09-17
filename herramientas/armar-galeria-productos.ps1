<#
  Convierte las fotos crudas de Drive en la galeria de la ficha de producto.

      powershell -ExecutionPolicy Bypass -File herramientas/armar-galeria-productos.ps1 `
                 -Origen <carpeta con slug__id.jpg> -Destino assets\img\products\galeria

  QUE HACE, Y POR QUE
  -------------------
  Las fotos de Olimp vienen a 1000x1000 sobre blanco, pero el envase ocupa
  una fraccion distinta en cada una: en las de frente llena el cuadro y en
  las de perfil es una astilla de 40 px de ancho. Puestas una al lado de la
  otra sin tocar, la galeria se ve despareja -que es exactamente la queja
  que ya hubo sobre la grilla.

  Entonces, por cada foto:

    1. Se mide el recuadro de lo que NO es blanco (el envase).
    2. Si ese recuadro es mas de -RelacionMaxima veces mas largo que ancho,
       la foto se descarta. Son las tomas de canto: una caja plana
       fotografiada de perfil se lee como un palito y no aporta nada.
       El corte esta puesto en 4 porque ahi hay un hueco real en el lote de
       Olimp: las tomas utiles llegan hasta 2,9 y las de canto arrancan
       en 4,3. No es un numero elegido a ojo.
    3. Se recorta al envase, se le deja un margen parejo y se vuelve a
       centrar en un cuadrado. Asi todos los envases se ven del mismo
       tamano aunque las tomas vengan distintas.
    4. Se baja a -Lado px y se guarda como JPG.

  El blanco se mide con tolerancia (-Umbral) porque el fondo de estudio no
  es 255 puro: tiene sombra y viñeteo.

  Usa WPF, que viene con Windows. En esta maquina no hay ImageMagick ni
  Pillow (ver la nota en herramientas/achicar.ps1).
#>

param(
  [Parameter(Mandatory = $true)][string]$Origen,
  [Parameter(Mandatory = $true)][string]$Destino,
  [int]$Lado = 900,
  [int]$Umbral = 244,        # por debajo de esto ya no es "fondo blanco"
  [double]$RelacionMaxima = 4.0,
  [double]$Margen = 0.06,    # aire alrededor del envase, en partes del lado
  [int]$Calidad = 84
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase

$dirOrigen = (Resolve-Path $Origen).Path
if (-not (Test-Path $Destino)) { New-Item -ItemType Directory -Path $Destino | Out-Null }
$dirDestino = (Resolve-Path $Destino).Path

$fotos = Get-ChildItem $dirOrigen -File -Filter *.jpg | Sort-Object Name
$porSlug = @{}
$descartadas = @()

foreach ($foto in $fotos) {
  $slug = ($foto.BaseName -split '__')[0]

  $flujo = [System.IO.File]::OpenRead($foto.FullName)
  $marco = [System.Windows.Media.Imaging.BitmapDecoder]::Create($flujo, 'None', 'OnLoad').Frames[0]

  # Se pasa a BGRA32 para leer los pixeles con un paso conocido.
  $rgb = [System.Windows.Media.Imaging.FormatConvertedBitmap]::new(
           $marco, [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)
  $an = $rgb.PixelWidth
  $al = $rgb.PixelHeight
  $paso = $an * 4
  $pixeles = [byte[]]::new($paso * $al)
  $rgb.CopyPixels($pixeles, $paso, 0)

  # Recuadro de lo que no es fondo. Se recorre de a 2 px: alcanza de sobra
  # para encontrar el borde de un envase y baja el trabajo a la cuarta parte.
  $x0 = $an; $y0 = $al; $x1 = -1; $y1 = -1
  for ($y = 0; $y -lt $al; $y += 2) {
    $base = $y * $paso
    for ($x = 0; $x -lt $an; $x += 2) {
      $i = $base + $x * 4
      if ($pixeles[$i] -lt $Umbral -or $pixeles[$i+1] -lt $Umbral -or $pixeles[$i+2] -lt $Umbral) {
        if ($x -lt $x0) { $x0 = $x }
        if ($x -gt $x1) { $x1 = $x }
        if ($y -lt $y0) { $y0 = $y }
        if ($y -gt $y1) { $y1 = $y }
      }
    }
  }
  $flujo.Close()

  if ($x1 -lt 0) { $descartadas += "$($foto.Name)  (toda blanca)"; continue }

  $anchoTinta = $x1 - $x0 + 1
  $altoTinta  = $y1 - $y0 + 1
  $relacion = [math]::Max($anchoTinta, $altoTinta) / [math]::Max(1, [math]::Min($anchoTinta, $altoTinta))
  if ($relacion -gt $RelacionMaxima) {
    $descartadas += ("{0}  (envase de canto: {1:N1} veces mas largo que ancho)" -f $foto.Name, $relacion)
    continue
  }

  # Cuadrado centrado en el envase, con margen parejo.
  $lado = [math]::Max($anchoTinta, $altoTinta) * (1 + 2 * $Margen)
  $cx = ($x0 + $x1) / 2
  $cy = ($y0 + $y1) / 2

  $visual = [System.Windows.Media.DrawingVisual]::new()
  $dc = $visual.RenderOpen()
  $dc.DrawRectangle([System.Windows.Media.Brushes]::White, $null,
                    [System.Windows.Rect]::new(0, 0, $Lado, $Lado))
  $escala = $Lado / $lado
  $destinoRect = [System.Windows.Rect]::new(
      ($Lado / 2) - ($cx * $escala), ($Lado / 2) - ($cy * $escala),
      $an * $escala, $al * $escala)
  $dc.DrawImage($marco, $destinoRect)
  $dc.Close()

  $lienzo = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
              $Lado, $Lado, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $lienzo.Render($visual)

  if (-not $porSlug.ContainsKey($slug)) { $porSlug[$slug] = 0 }
  $porSlug[$slug]++
  $nombre = '{0}-{1}.jpg' -f $slug, $porSlug[$slug]
  $ruta = Join-Path $dirDestino $nombre

  $cod = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
  $cod.QualityLevel = $Calidad
  $cod.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($lienzo))
  $salida = [System.IO.File]::Create($ruta)
  $cod.Save($salida)
  $salida.Close()

  '{0,-34} {1,6:N0} KB' -f $nombre, ((Get-Item $ruta).Length / 1KB)
}

''
'DESCARTADAS'
if ($descartadas) { $descartadas | ForEach-Object { '  ' + $_ } } else { '  ninguna' }
''
'POR PRODUCTO'
$porSlug.GetEnumerator() | Sort-Object Name | ForEach-Object { '  {0,-28} {1} fotos' -f $_.Key, $_.Value }
