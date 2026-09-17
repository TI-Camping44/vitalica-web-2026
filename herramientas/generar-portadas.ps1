Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase

# ============================================================================
# PORTADAS DEL HERO
# ----------------------------------------------------------------------------
# Antes cada slide hablaba un idioma distinto: collage en blanco y negro, foto
# de gimnasio virada a teal/naranja, y un grafico navy. El carrusel cambiaba de
# registro cada 5 segundos y por eso se leia armado a pedazos.
#
# Ahora los tres comparten un solo sistema:
#   - fondo navy oscuro identico
#   - la imagen en gris, teñida de azul (duotono)
#   - el peso visual a la derecha, y el mismo velo a la izquierda para el titular
#
# Slide 1 va a sangre (el collage ya es horizontal y aguanta).
# Slides 2 y 3 son composiciones: el sujeto entra como panel a la derecha, que
# es la unica forma de meter una foto vertical en 2.67:1 sin que quede una tira.
# ============================================================================

$base = "C:\Users\NB-C44\Downloads\WEB VITALICA"
$ANCHO = 2400
$ALTO  = 800
$dirHero = "$base\assets\img\hero"

function Punto($x,$y) { New-Object System.Windows.Point $x,$y }
function Parada($c,$p) { New-Object System.Windows.Media.GradientStop $c,$p }
function Rect($x,$y,$w,$h) { New-Object System.Windows.Rect $x,$y,$w,$h }
function Argb($a,$r,$g,$b) { [System.Windows.Media.Color]::FromArgb($a,$r,$g,$b) }

function Abrir($ruta) {
  $s = [System.IO.File]::OpenRead($ruta)
  $f = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
  $c = New-Object System.Windows.Media.Imaging.WriteableBitmap $f
  $s.Close()
  $c
}

# A gris primero: si no, el virado original de cada foto se filtra por debajo
# del tinte y vuelve la incoherencia que estamos tratando de sacar.
function EnGris($bmp) {
  New-Object System.Windows.Media.Imaging.FormatConvertedBitmap $bmp, ([System.Windows.Media.PixelFormats]::Gray32Float), $null, 0
}

function Recortar($bmp,$x,$y,$w,$h) {
  New-Object System.Windows.Media.Imaging.CroppedBitmap $bmp,(New-Object System.Windows.Int32Rect $x,$y,$w,$h)
}

function Fondo($dc) {
  $g = New-Object System.Windows.Media.LinearGradientBrush
  $g.StartPoint = Punto 0 0
  $g.EndPoint   = Punto 1 1
  $g.GradientStops.Add((Parada ([System.Windows.Media.ColorConverter]::ConvertFromString("#050F1F")) 0.0))
  $g.GradientStops.Add((Parada ([System.Windows.Media.ColorConverter]::ConvertFromString("#0A2B54")) 1.0))
  $dc.DrawRectangle($g, $null, (Rect 0 0 $ANCHO $ALTO))
}

function Tinte($dc) {
  $g = New-Object System.Windows.Media.LinearGradientBrush
  $g.StartPoint = Punto 0 0
  $g.EndPoint   = Punto 1 1
  $g.GradientStops.Add((Parada (Argb 150 8 30 62) 0.0))
  $g.GradientStops.Add((Parada (Argb 105 13 79 151) 1.0))
  $dc.DrawRectangle($g, $null, (Rect 0 0 $ANCHO $ALTO))
}

function Guardar($vis,$destino) {
  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $ANCHO,$ALTO,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($vis)
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 84
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs = New-Object System.IO.FileStream($destino,[System.IO.FileMode]::Create)
  $enc.Save($fs); $fs.Close()
  "  $([System.IO.Path]::GetFileName($destino))  ${ANCHO}x${ALTO}  $([math]::Round((Get-Item $destino).Length/1KB)) KB"
}

# --- Slide 1: collage de deportes a sangre -----------------------------------
function Slide1 {
  $foto = EnGris (Abrir "$base\portadablanconegro.webp")
  $vis = New-Object System.Windows.Media.DrawingVisual
  $dc = $vis.RenderOpen()
  Fondo $dc
  $p = $foto.PixelWidth / $foto.PixelHeight
  if ($p -gt ($ANCHO/$ALTO)) { $h = $ALTO; $w = $ALTO*$p } else { $w = $ANCHO; $h = $ANCHO/$p }
  $dc.PushOpacity(0.60)
  $dc.DrawImage($foto, (Rect (($ANCHO-$w)/2) (($ALTO-$h)/2) $w $h))
  $dc.Pop()
  Tinte $dc
  $dc.Close()
  Guardar $vis "$dirHero\portada-1.jpg"
}

# --- Slide 2: el atleta como panel a la derecha -------------------------------
function Slide2 {
  # Recorte casi cuadrado alrededor de cabeza y torso. Arranco alto (y=850) para
  # dejar aire sobre la cabeza: si el recorte empieza justo arriba de la cabeza,
  # al encajar el panel la cabeza termina pegada al borde superior del hero.
  # Corto en 4450, antes de las mancuernas.
  $foto = EnGris (Recortar (Abrir "$base\assets\img\_P7A2140.jpg") 700 850 3100 3600)

  $vis = New-Object System.Windows.Media.DrawingVisual
  $dc = $vis.RenderOpen()
  Fondo $dc

  # El panel sangra por arriba, por abajo y por el borde derecho: si termina
  # antes de 2400 queda un canto vertical con el navy mas claro detras.
  $ph = 1000
  $pw = $ph * ($foto.PixelWidth / $foto.PixelHeight)
  $px = 1540
  $py = ($ALTO - $ph) / 2
  $panel = Rect $px $py $pw $ph

  # El borde izquierdo del panel se disuelve en el navy: sin esto se ve el
  # rectangulo de la foto pegado encima del fondo.
  $mascara = New-Object System.Windows.Media.LinearGradientBrush
  $mascara.StartPoint = Punto 0 0
  $mascara.EndPoint   = Punto 1 0
  $mascara.GradientStops.Add((Parada (Argb 0 0 0 0) 0.0))
  $mascara.GradientStops.Add((Parada (Argb 255 0 0 0) 0.18))
  $mascara.GradientStops.Add((Parada (Argb 255 0 0 0) 1.0))

  $dc.PushOpacity(0.85)
  $dc.PushOpacityMask($mascara)
  $dc.DrawImage($foto, $panel)
  $dc.Pop(); $dc.Pop()

  Tinte $dc
  $dc.Close()
  Guardar $vis "$dirHero\portada-2.jpg"
}

# --- Slide 3: el laboratorio de Olimp -----------------------------------------
function Slide3 {
  $lab = Abrir "$base\_drive\marca\olimp-lab.png"
  $vis = New-Object System.Windows.Media.DrawingVisual
  $dc = $vis.RenderOpen()

  # Fondo propio, mas oscuro que el de los otros dos slides. Los otros tienen
  # una foto encima que baja la densidad sola; este no, y con el fondo comun
  # quedaba mas claro. Antes lo corregia con un velo negro ENCIMA del edificio,
  # pero eso tapaba justamente lo que hay que ver. Se oscurece abajo, no arriba.
  $g = New-Object System.Windows.Media.LinearGradientBrush
  $g.StartPoint = Punto 0 0
  $g.EndPoint   = Punto 1 1
  $g.GradientStops.Add((Parada ([System.Windows.Media.ColorConverter]::ConvertFromString("#030A16")) 0.0))
  $g.GradientStops.Add((Parada ([System.Windows.Media.ColorConverter]::ConvertFromString("#061A33")) 1.0))
  $dc.DrawRectangle($g, $null, (Rect 0 0 $ANCHO $ALTO))

  # Mas alto que el lienzo a proposito: se sale por arriba y por abajo, asi se
  # lee como textura arquitectonica y no como una figura pegada al centro.
  $h = 1550
  $w = $h * ($lab.PixelWidth / $lab.PixelHeight)
  $dc.PushOpacity(0.78)
  $dc.DrawImage($lab, (Rect (1700-$w/2) (($ALTO-$h)/2) $w $h))
  $dc.Pop()

  Tinte $dc
  $dc.Close()
  Guardar $vis "$dirHero\portada-3.jpg"
}

Slide1
Slide2
Slide3
