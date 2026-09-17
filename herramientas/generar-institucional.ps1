Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Imagen institucional para "Quiénes somos".
# La sección tenía un packshot de Whey sobre fondo gris, que es una foto de
# producto: no dice nada sobre quiénes somos. La referencia que pidió el
# directorio es la web vieja, donde de fondo está el laboratorio de Olimp.
#
# Mismo tratamiento que las portadas del hero (navy + duotono azul) para que
# las dos piezas se sientan de la misma marca.

$base = Split-Path -Parent $PSScriptRoot
$ANCHO = 1200
$ALTO  = 1000

$s = [System.IO.File]::OpenRead("$base\_drive\marca\olimp-lab.png")
$lab = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]

$vis = New-Object System.Windows.Media.DrawingVisual
$dc = $vis.RenderOpen()
$todo = New-Object System.Windows.Rect 0,0,$ANCHO,$ALTO

# Fondo navy, el mismo par de colores que el hero
$g = New-Object System.Windows.Media.LinearGradientBrush
$g.StartPoint = New-Object System.Windows.Point 0,0
$g.EndPoint   = New-Object System.Windows.Point 1,1
$g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.ColorConverter]::ConvertFromString("#04101F")),0.0))
$g.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.ColorConverter]::ConvertFromString("#0A2B54")),1.0))
$dc.DrawRectangle($g, $null, $todo)

# El PNG viene recortado en hexágono (es la forma de la marca Olimp). Si lo
# dibujo entero sobre el navy, el hexágono se lee como una calcomanía pegada.
# Recorto POR DENTRO: en un hexágono de punta arriba, la franja entre 1/4 y 3/4
# del alto conserva el ancho completo, así que ahí adentro no hay bordes en
# diagonal y queda una foto rectangular del edificio.
$rx = 1000; $ry = 1600; $rw = 3900; $rh = 2750
$rec = New-Object System.Windows.Media.Imaging.CroppedBitmap $lab,(New-Object System.Windows.Int32Rect $rx,$ry,$rw,$rh)

# "cover" dentro del lienzo
$pi = $rec.PixelWidth / $rec.PixelHeight
if ($pi -gt ($ANCHO/$ALTO)) { $h = $ALTO; $w = $ALTO*$pi } else { $w = $ANCHO; $h = $ANCHO/$pi }
$dc.DrawImage($rec, (New-Object System.Windows.Rect (($ANCHO-$w)/2),(($ALTO-$h)/2),$w,$h))

# Tinte azul suave: iguala el registro con las portadas
$t = New-Object System.Windows.Media.LinearGradientBrush
$t.StartPoint = New-Object System.Windows.Point 0,0
$t.EndPoint   = New-Object System.Windows.Point 1,1
$t.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(48,8,30,62)),0.0))
$t.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(30,13,79,151)),1.0))
$dc.DrawRectangle($t, $null, $todo)

# Oscurecido abajo, para que apoye el epígrafe que va sobre la imagen
$p = New-Object System.Windows.Media.LinearGradientBrush
$p.StartPoint = New-Object System.Windows.Point 0,0.45
$p.EndPoint   = New-Object System.Windows.Point 0,1
$p.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(0,3,10,22)),0.0))
$p.GradientStops.Add((New-Object System.Windows.Media.GradientStop ([System.Windows.Media.Color]::FromArgb(215,3,10,22)),1.0))
$dc.DrawRectangle($p, $null, $todo)

$dc.Close()
$rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $ANCHO,$ALTO,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
$rtb.Render($vis)
$enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
$enc.QualityLevel = 86
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$destino = "$base\assets\img\olimp-laboratorio.jpg"
$fs = New-Object System.IO.FileStream($destino,[System.IO.FileMode]::Create)
$enc.Save($fs); $fs.Close(); $s.Close()
"  olimp-laboratorio.jpg  ${ANCHO}x${ALTO}  $([math]::Round((Get-Item $destino).Length/1KB)) KB"
