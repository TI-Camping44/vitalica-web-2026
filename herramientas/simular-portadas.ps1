Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Reproduce lo que hace el navegador con las portadas: el recorte de
# object-fit:cover con object-position, mas el velo que pone el CSS.
# Sirve para ver el resultado real sin poder sacar captura de pantalla.

$d = "C:\Users\NB-C44\Downloads\WEB VITALICA\assets\img\hero"
$posX = 0.78; $posY = 0.42

$salida = "$PSScriptRoot\..\_previsualizacion"
if (-not (Test-Path $salida)) { New-Item -ItemType Directory $salida | Out-Null }

function Componer($caja, $anchoCaja, $altoCaja, $velo) {
  $vis = New-Object System.Windows.Media.DrawingVisual
  $dc = $vis.RenderOpen()
  for ($i = 1; $i -le 3; $i++) {
    $s = [System.IO.File]::OpenRead("$d\portada-$i.jpg")
    $f = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]

    $oy = ($i-1) * ($altoCaja + 10)
    $r = New-Object System.Windows.Rect 0,$oy,$anchoCaja,$altoCaja
    $dc.PushClip((New-Object System.Windows.Media.RectangleGeometry $r))

    # object-fit: cover -> escala al lado que falta y desborda el otro
    $pi = $f.PixelWidth / $f.PixelHeight
    $pc = $anchoCaja / $altoCaja
    if ($pi -gt $pc) { $h = $altoCaja; $w = $altoCaja * $pi } else { $w = $anchoCaja; $h = $anchoCaja / $pi }
    # object-position: el sobrante se reparte segun el porcentaje
    $x = -($w - $anchoCaja) * $posX
    $y = $oy - ($h - $altoCaja) * $posY
    $dc.DrawImage($f, (New-Object System.Windows.Rect $x,$y,$w,$h))

    # El velo del CSS
    $g = New-Object System.Windows.Media.LinearGradientBrush
    if ($velo -eq 'horizontal') {
      $g.StartPoint = New-Object System.Windows.Point 0,0
      $g.EndPoint   = New-Object System.Windows.Point 1,0
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(209,7,13,24)),0.0))
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(140,7,13,24)),0.42))
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(46,7,13,24)),0.75))
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(13,7,13,24)),1.0))
    } else {
      $g.StartPoint = New-Object System.Windows.Point 0,0
      $g.EndPoint   = New-Object System.Windows.Point 0,1
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(184,7,13,24)),0.0))
      $g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(115,7,13,24)),1.0))
    }
    $dc.DrawRectangle($g, $null, $r)
    $dc.Pop()
    $s.Close()
  }
  $dc.Close()
  $total = $altoCaja*3 + 20
  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $anchoCaja,$total,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($vis)
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 82
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs = New-Object System.IO.FileStream($caja,[System.IO.FileMode]::Create)
  $enc.Save($fs); $fs.Close()
  "  $caja"
}

# Medidos en el navegador: 1905x600 a 1920 de ancho, 375x528 en celular.
Componer "$PSScriptRoot\..\_previsualizacion\sim-ancho.jpg" 1200 378 'horizontal'
Componer "$PSScriptRoot\..\_previsualizacion\sim-celular.jpg" 375 528 'vertical'
