Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Mide el RECUADRO REAL de cada logo: dónde empiezan y terminan los píxeles que
# no son transparentes ni blancos.
#
# Por qué importa: varios PNG vienen con mucho aire alrededor. Si el tamaño en
# la web se calcula sobre el tamaño del ARCHIVO, los que traen más margen se
# ven más chicos de lo que corresponde, aunque en el CSS midan lo mismo.
# Eso es lo que hacía que "Shopping China" o "kb" no se leyeran.

$d = "$PSScriptRoot\..\assets\img\aliados"

"{0,-22} {1,-13} {2,-13} {3,-7} {4}" -f 'ARCHIVO','ARCHIVO(px)','CONTENIDO(px)','AIRE','ar_real"'
'-' * 78

foreach ($f in Get-ChildItem $d -Filter *.png | Sort-Object Name) {
  $s = [System.IO.File]::OpenRead($f.FullName)
  $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]

  $conv = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap $img, ([System.Windows.Media.PixelFormats]::Bgra32), $null, 0
  $an = $conv.PixelWidth; $al = $conv.PixelHeight
  $paso = $an * 4
  $buf = New-Object byte[] ($paso * $al)
  $conv.CopyPixels($buf, $paso, 0)

  $x1 = $an; $y1 = $al; $x2 = -1; $y2 = -1
  for ($y = 0; $y -lt $al; $y++) {
    $fila = $y * $paso
    for ($x = 0; $x -lt $an; $x++) {
      $i = $fila + $x * 4
      $b = $buf[$i]; $g = $buf[$i+1]; $r = $buf[$i+2]; $a = $buf[$i+3]
      # Cuenta como contenido si es opaco y no es casi blanco
      if ($a -gt 40 -and -not ($r -gt 240 -and $g -gt 240 -and $b -gt 240)) {
        if ($x -lt $x1) { $x1 = $x }
        if ($x -gt $x2) { $x2 = $x }
        if ($y -lt $y1) { $y1 = $y }
        if ($y -gt $y2) { $y2 = $y }
      }
    }
  }
  $s.Close()

  if ($x2 -lt 0) { "{0,-22} (todo transparente)" -f $f.Name; continue }
  $cw = $x2 - $x1 + 1; $ch = $y2 - $y1 + 1
  $aire = [math]::Round(100 - (($cw * $ch) / ($an * $al) * 100))
  "{0,-22} {1,-13} {2,-13} {3,-7} {4}" -f $f.Name, "$($an)x$al", "$($cw)x$ch", "$aire%", [math]::Round($cw/$ch,2)
}
