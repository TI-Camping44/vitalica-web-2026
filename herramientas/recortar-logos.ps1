Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

<#
  Recorta el aire sobrante de los logos de aliados y calcula el tamaño con el
  que hay que mostrarlos.

  EL PROBLEMA QUE RESUELVE
  ------------------------
  Varios PNG venían con muchísimo margen transparente. shopping-china.png medía
  1168x1100 pero el logo adentro era de 846x195: un 87% del archivo era aire.

  Como el tamaño en la web se calculaba sobre el tamaño del ARCHIVO, ese logo se
  trataba como si fuera casi cuadrado (proporción 1.06) cuando en realidad es
  apaisado (4.34). Resultado: se dibujaba a unos 60x14 px y su bajada no se
  leía. Lo mismo con kb (75% de aire) y toku (38%).

  QUÉ HACE
  --------
  1) Recorta cada PNG al recuadro real del logo, dejando un margen mínimo.
  2) Calcula ancho y alto para la web normalizando por ÁREA, no por ancho ni
     por alto.

  POR QUÉ POR ÁREA
  ----------------
  Con la misma ALTURA, un logo muy apaisado (Vitamin Shoppe es 7,6 veces más
  ancho que alto) queda larguísimo al lado de uno compacto.
  Con el mismo ANCHO, pasa al revés: los apaisados quedan finitos e ilegibles.

  Igualando el ÁREA, cada logo ocupa una mancha de tamaño parecido, que es lo
  que el ojo compara. Es lo que se usa en las paredes de logos.

      alto = raiz(AREA / proporcion)      ancho = alto * proporcion

  Los topes existen porque las proporciones extremas se escapan igual: sin
  ellos, Toku (7,6) saldría de 244 px de ancho y rompería la fila.
#>

$dir = "$PSScriptRoot\..\assets\img\aliados"
$AREA   = 6800      # área objetivo en px² (calibrada mirando la fila completa)
$ALTO_MIN = 26
$ALTO_MAX = 64
$ANCHO_MAX = 190
$MARGEN = 6         # px de aire que se deja alrededor, en la escala del archivo

$resultados = @()

foreach ($f in Get-ChildItem $dir -Filter *.png | Sort-Object Name) {
  $s = [System.IO.File]::OpenRead($f.FullName)
  $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
  $conv = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap $img, ([System.Windows.Media.PixelFormats]::Bgra32), $null, 0
  $an = $conv.PixelWidth; $al = $conv.PixelHeight
  $paso = $an * 4
  $buf = New-Object byte[] ($paso * $al)
  $conv.CopyPixels($buf, $paso, 0)

  # Recuadro real: píxeles opacos que no sean casi blancos
  $x1 = $an; $y1 = $al; $x2 = -1; $y2 = -1
  for ($y = 0; $y -lt $al; $y++) {
    $fila = $y * $paso
    for ($x = 0; $x -lt $an; $x++) {
      $i = $fila + $x * 4
      if ($buf[$i+3] -gt 40 -and -not ($buf[$i+2] -gt 240 -and $buf[$i+1] -gt 240 -and $buf[$i] -gt 240)) {
        if ($x -lt $x1) { $x1 = $x }
        if ($x -gt $x2) { $x2 = $x }
        if ($y -lt $y1) { $y1 = $y }
        if ($y -gt $y2) { $y2 = $y }
      }
    }
  }
  $s.Close()
  if ($x2 -lt 0) { "  $($f.Name): todo transparente, se omite"; continue }

  $x1 = [Math]::Max(0, $x1 - $MARGEN); $y1 = [Math]::Max(0, $y1 - $MARGEN)
  $x2 = [Math]::Min($an - 1, $x2 + $MARGEN); $y2 = [Math]::Min($al - 1, $y2 + $MARGEN)
  $cw = $x2 - $x1 + 1; $ch = $y2 - $y1 + 1

  # Solo se reescribe si vale la pena (más de un 4% de aire)
  $sobra = 1 - (($cw * $ch) / ($an * $al))
  if ($sobra -gt 0.04) {
    $rec = New-Object System.Windows.Media.Imaging.CroppedBitmap $img,(New-Object System.Windows.Int32Rect $x1,$y1,$cw,$ch)
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rec))
    $fs = New-Object System.IO.FileStream($f.FullName,[System.IO.FileMode]::Create)
    $enc.Save($fs); $fs.Close()
    $nota = "recortado ({0}% de aire)" -f [math]::Round($sobra * 100)
  } else {
    $nota = 'sin cambios'
  }

  $prop = $cw / $ch
  $alto = [Math]::Sqrt($AREA / $prop)
  if ($alto -lt $ALTO_MIN) { $alto = $ALTO_MIN }
  if ($alto -gt $ALTO_MAX) { $alto = $ALTO_MAX }
  $ancho = $alto * $prop
  if ($ancho -gt $ANCHO_MAX) { $ancho = $ANCHO_MAX; $alto = $ancho / $prop }

  $resultados += [pscustomobject]@{
    Archivo = $f.Name
    Prop    = [math]::Round($prop, 2)
    Ancho   = [int][math]::Round($ancho)
    Alto    = [int][math]::Round($alto)
    Nota    = $nota
  }
}

''
"{0,-22} {1,-7} {2,-7} {3,-7} {4}" -f 'ARCHIVO','PROP','ANCHO','ALTO','ESTADO'
'-' * 74
foreach ($r in $resultados) {
  "{0,-22} {1,-7} {2,-7} {3,-7} {4}" -f $r.Archivo, $r.Prop, $r.Ancho, $r.Alto, $r.Nota
}
''
'Para data.js:'
foreach ($r in $resultados) {
  "  {0,-24} ancho: {1,3}, altura: {2,2}" -f $r.Archivo.Replace('.png',''), $r.Ancho, $r.Alto
}
