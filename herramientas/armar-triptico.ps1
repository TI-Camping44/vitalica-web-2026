<#
  Arma una portada apaisada juntando varias fotos verticales, una al lado de
  la otra.

      powershell -ExecutionPolicy Bypass -File herramientas/armar-triptico.ps1 `
                 -Salida assets\img\hero\portada-2.jpg -Ancho 2400 -Alto 800 `
                 -Fotos "a.jpg|0.5","b.jpg|0.3","c.jpg|0.6"

  POR QUE EXISTE
  --------------
  El hueco del hero mide 2400x800, o sea 3:1. En un telefono ese rectangulo
  se recorta a lo ancho y solo se ve una CUARTA PARTE del ancho: una foto de
  una persona, tomada en vertical, queda convertida en un primer plano de un
  hombro. Se probo con tres encuadres distintos y las tres veces paso lo
  mismo. No es cuestion de mover el foco: el problema es la proporcion.

  Un triptico lo resuelve solo: cada panel es una composicion vertical
  completa, asi que el recorte del telefono cae adentro de UN panel y se ve
  bien igual. En pantalla ancha se ven los tres.

  Es el mismo recurso de la portada 1, que ya venia armada asi.

  Cada foto se pasa como "ruta|foco", donde foco es de 0 a 1 y dice que parte
  del lado largo hay que conservar.
#>
param(
  [Parameter(Mandatory = $true)][string]$Salida,
  # Una sola cadena con las fotos separadas por ";" y cada una como
  # "ruta|foco". Se recibe asi y no como arreglo porque al llamarlo desde
  # bash los elementos separados por coma llegan pegados en un solo string.
  [Parameter(Mandatory = $true)][string]$Fotos,
  [int]$Ancho = 2400,
  [int]$Alto = 800,
  [int]$Separador = 6,
  [int]$Calidad = 88
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase

$lista = $Fotos -split ';' | Where-Object { $_.Trim() }
$n = $lista.Count
$anchoPanel = [int](($Ancho - $Separador * ($n - 1)) / $n)

$visual = [System.Windows.Media.DrawingVisual]::new()
$dc = $visual.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.Brushes]::Black, $null,
                  [System.Windows.Rect]::new(0, 0, $Ancho, $Alto))

for ($i = 0; $i -lt $n; $i++) {
  $partes = $lista[$i].Trim() -split '\|'
  $ruta = (Resolve-Path $partes[0]).Path
  # InvariantCulture a proposito: en Windows en espanol el separador decimal
  # es la coma, y [double]"0.42" se cae. Los numeros de este script se
  # escriben siempre con punto.
  $foco = if ($partes.Count -gt 1) {
            [double]::Parse($partes[1], [Globalization.CultureInfo]::InvariantCulture)
          } else { 0.5 }

  $flujo = [System.IO.File]::OpenRead($ruta)
  $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($flujo, 'None', 'OnLoad').Frames[0]
  $an = $img.PixelWidth; $al = $img.PixelHeight

  # Recorte con la proporcion del panel, corrido hacia el foco.
  $rel = $anchoPanel / [double]$Alto
  if (($an / [double]$al) -gt $rel) {
    $ch = $al; $cw = [int]($al * $rel); $cy = 0; $cx = [int](($an - $cw) * $foco)
  } else {
    $cw = $an; $ch = [int]($an / $rel); $cx = 0; $cy = [int](($al - $ch) * $foco)
  }
  $rec = [System.Windows.Media.Imaging.CroppedBitmap]::new(
           $img, [System.Windows.Int32Rect]::new($cx, $cy, $cw, $ch))

  $x = $i * ($anchoPanel + $Separador)
  $dc.DrawImage($rec, [System.Windows.Rect]::new($x, 0, $anchoPanel, $Alto))
  $flujo.Close()
}
$dc.Close()

$lienzo = [System.Windows.Media.Imaging.RenderTargetBitmap]::new(
            $Ancho, $Alto, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
$lienzo.Render($visual)

if (Test-Path $Salida) { Remove-Item $Salida -Force }
$cod = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
$cod.QualityLevel = $Calidad
$cod.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($lienzo))
$fs = [System.IO.File]::Create($Salida)
$cod.Save($fs); $fs.Close()

'{0}  {1} x {2}  ({3} paneles de {4} px)  {5:N0} KB' -f `
  $Salida, $Ancho, $Alto, $n, $anchoPanel, ((Get-Item $Salida).Length/1KB)
