<#
  Recorta y escala una foto al tamano exacto que pide un hueco del sitio.

      powershell -ExecutionPolicy Bypass -File herramientas/encajar-foto.ps1 `
                 -Origen "assets\img\foo.jpg" -Destino "assets\img\hero\portada-2.jpg" `
                 -Ancho 2400 -Alto 800 -Foco 0.72

  POR QUE NO ALCANZA CON ESCALAR
  ------------------------------
  Las fotos de Olimp vienen casi todas verticales (2268x3024) y los huecos del
  sitio son apaisados (2400x800). Escalar sin recortar deforma; recortar por el
  centro deja a la persona fuera del cuadro, porque en estas fotos el sujeto
  casi nunca esta en el medio.

  -Foco dice en que parte del lado largo esta lo que importa, de 0 a 1:
      0    = pegado al borde de arriba / izquierda
      0.5  = centro (lo que hace un recorte comun)
      1    = pegado al borde de abajo / derecha

  Se recorta el rectangulo mas grande con la proporcion pedida, corrido hacia
  ese foco, y recien despues se escala. Asi no se pierde resolucion de mas.

  Usa WPF. En esta maquina no hay ImageMagick ni Pillow.
#>
param(
  [Parameter(Mandatory = $true)][string]$Origen,
  [Parameter(Mandatory = $true)][string]$Destino,
  [Parameter(Mandatory = $true)][int]$Ancho,
  [Parameter(Mandatory = $true)][int]$Alto,
  [double]$Foco = 0.5,
  [int]$Calidad = 86
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase

$rutaOrigen = (Resolve-Path $Origen).Path
$carpeta = Split-Path $Destino
if ($carpeta -and -not (Test-Path $carpeta)) { New-Item -ItemType Directory $carpeta -Force | Out-Null }
if (Test-Path $Destino) { Remove-Item $Destino -Force }   # nunca dejar el viejo

$flujo = [System.IO.File]::OpenRead($rutaOrigen)
$marco = [System.Windows.Media.Imaging.BitmapDecoder]::Create($flujo, 'None', 'OnLoad').Frames[0]
$an = $marco.PixelWidth; $al = $marco.PixelHeight

# El recorte mas grande con la proporcion pedida que entre en la foto.
$relPedida = $Ancho / [double]$Alto
$relFoto   = $an / [double]$al

if ($relFoto -gt $relPedida) {
  # La foto es mas apaisada: sobra ancho, se recorta a los costados.
  $ch = $al
  $cw = [int][math]::Round($al * $relPedida)
  $cy = 0
  $cx = [int][math]::Round(($an - $cw) * $Foco)
} else {
  # La foto es mas vertical: sobra alto, se recorta arriba y abajo.
  $cw = $an
  $ch = [int][math]::Round($an / $relPedida)
  $cx = 0
  $cy = [int][math]::Round(($al - $ch) * $Foco)
}

$recorte = [System.Windows.Media.Imaging.CroppedBitmap]::new(
             $marco, [System.Windows.Int32Rect]::new($cx, $cy, $cw, $ch))

$visual = [System.Windows.Media.DrawingVisual]::new()
$dc = $visual.RenderOpen()
$dc.DrawImage($recorte, [System.Windows.Rect]::new(0, 0, $Ancho, $Alto))
$dc.Close()

$lienzo = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
            $Ancho, $Alto, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
$lienzo.Render($visual)

$cod = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
$cod.QualityLevel = $Calidad
$cod.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($lienzo))
$salida = [System.IO.File]::Create($Destino)
$cod.Save($salida); $salida.Close(); $flujo.Close()

'{0,-30} {1} x {2}   {3:N0} KB   (de {4} x {5})' -f `
  (Split-Path $Destino -Leaf), $Ancho, $Alto, ((Get-Item $Destino).Length/1KB), $an, $al
