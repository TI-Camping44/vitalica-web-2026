<#
  Arma la imagen que se ve al compartir el sitio (Open Graph).

      powershell -ExecutionPolicy Bypass -File herramientas/armar-og.ps1

  POR QUE HACE FALTA
  ------------------
  La que habia era un .webp. WhatsApp y varios lectores de enlaces no lo
  previsualizan, asi que al compartir el sitio no aparecia ninguna imagen:
  solo el titulo y una direccion pelada. En un negocio que vende por WhatsApp
  eso es el peor lugar posible para fallar.

  El formato que entienden todos es JPG, y la medida estandar es 1200x630
  (relacion 1,91:1). Mas grande no sirve; mas chico se ve borroso.

  La tipografia sale del archivo Degular que ya esta en el proyecto, que es la
  del manual de marca. Si no cargara, se usa una del sistema: es preferible
  una imagen con otra letra que ninguna imagen.
#>
param(
  [string]$Foto   = 'assets/img/og-portada.webp',
  [string]$Salida = 'assets/img/og-portada.jpg',
  [int]$Ancho = 1200,
  [int]$Alto  = 630
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase

$raiz = Split-Path -Parent $PSScriptRoot
$rutaFoto = Join-Path $raiz $Foto
$destino  = Join-Path $raiz $Salida
if (Test-Path $destino) { Remove-Item $destino -Force }

$fl = [System.IO.File]::OpenRead($rutaFoto)
$img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fl,'None','OnLoad').Frames[0]

# Recorte que cubre, centrado.
$escala = [math]::Max($Ancho / $img.PixelWidth, $Alto / $img.PixelHeight)
$w = $img.PixelWidth * $escala; $h = $img.PixelHeight * $escala

$v = [System.Windows.Media.DrawingVisual]::new()
$dc = $v.RenderOpen()
$dc.DrawImage($img, [System.Windows.Rect]::new(($Ancho-$w)/2, ($Alto-$h)/2, $w, $h))

# Velo: de negro casi opaco abajo a transparente arriba, para que el texto se
# lea sin tapar la foto entera.
$grad = [System.Windows.Media.LinearGradientBrush]::new()
$grad.StartPoint = [System.Windows.Point]::new(0,1)
$grad.EndPoint   = [System.Windows.Point]::new(0,0)
$grad.GradientStops.Add([System.Windows.Media.GradientStop]::new(
  [System.Windows.Media.Color]::FromArgb(245,5,5,6), 0))
$grad.GradientStops.Add([System.Windows.Media.GradientStop]::new(
  [System.Windows.Media.Color]::FromArgb(150,5,5,6), 0.55))
$grad.GradientStops.Add([System.Windows.Media.GradientStop]::new(
  [System.Windows.Media.Color]::FromArgb(40,5,5,6), 1))
$dc.DrawRectangle($grad, $null, [System.Windows.Rect]::new(0,0,$Ancho,$Alto))

# La tipografia de marca, desde el archivo del proyecto.
function Fuente([string]$archivo, [string]$familia) {
  $p = Join-Path $raiz $archivo
  if (Test-Path $p) {
    try { return [System.Windows.Media.Typeface]::new(
      [System.Windows.Media.FontFamily]::new(([uri]"file:///$($raiz -replace '\','/')/"), "./#$familia"),
      'Normal','Normal','Normal') } catch {}
  }
  return [System.Windows.Media.Typeface]::new('Segoe UI Black')
}
$negra = Fuente 'DegularDisplay-Black.otf' 'Degular Display'
$media = Fuente 'Degular-Medium.otf' 'Degular'

function Texto($t, $tipo, $tam, $color, $x, $y) {
  $ft = [System.Windows.Media.FormattedText]::new(
    $t, [System.Globalization.CultureInfo]::GetCultureInfo('es-PY'),
    [System.Windows.FlowDirection]::LeftToRight, $tipo, $tam, $color, 1.25)
  $dc.DrawText($ft, [System.Windows.Point]::new($x, $y))
  return $ft
}

$blanco  = [System.Windows.Media.Brushes]::White
$naranja = [System.Windows.Media.SolidColorBrush]::new(
             [System.Windows.Media.Color]::FromRgb(239,125,42))

Texto 'VITALICA' $negra 96 $blanco 64 384 | Out-Null
Texto 'REPRESENTANTE EXCLUSIVO DE OLIMP SPORT NUTRITION EN PARAGUAY' $media 21 $naranja 68 500 | Out-Null
$tilde = [char]0xF3   # ó
Texto "Suplementaci${tilde}n deportiva con respaldo europeo." $media 24 $blanco 68 532 | Out-Null

$dc.Close()

$b = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($Ancho,$Alto,96,96,[System.Windows.Media.PixelFormats]::Pbgra32)
$b.Render($v)
$c = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
$c.QualityLevel = 88
$c.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($b))
$fs = [System.IO.File]::Create($destino); $c.Save($fs); $fs.Close(); $fl.Close()

'{0}  {1}x{2}  {3:N0} KB' -f $Salida, $Ancho, $Alto, ((Get-Item $destino).Length/1KB)
