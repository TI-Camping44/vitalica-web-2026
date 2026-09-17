param([int]$Columnas = 6, [int]$Celda = 260, [int]$PorHoja = 30)

Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Arma hojas de contactos con todas las fotos sueltas de assets/img.
# Existe porque el banco de fotos de Olimp son ~86 archivos de hasta 46 MB con
# nombres tipo "_P7A4560.jpg", y abrirlos de a uno para elegir es inviable.

$d = "$PSScriptRoot\..\assets\img"
$salida = "$PSScriptRoot\..\_previsualizacion"
if (-not (Test-Path $salida)) { New-Item -ItemType Directory $salida | Out-Null }

$fotos = Get-ChildItem $d -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } | Sort-Object Name
$hojas = [math]::Ceiling($fotos.Count / $PorHoja)
$tipo = New-Object System.Windows.Media.Typeface "Segoe UI"
$amarillo = New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.Colors]::Yellow)

for ($hoja = 0; $hoja -lt $hojas; $hoja++) {
  $lote = $fotos | Select-Object -Skip ($hoja * $PorHoja) -First $PorHoja
  $filas = [math]::Ceiling($lote.Count / $Columnas)
  $an = $Columnas * $Celda
  $al = $filas * ($Celda + 22)

  $vis = New-Object System.Windows.Media.DrawingVisual
  $dc = $vis.RenderOpen()
  $dc.DrawRectangle((New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.Colors]::Black)), $null, (New-Object System.Windows.Rect 0,0,$an,$al))

  for ($i = 0; $i -lt $lote.Count; $i++) {
    $f = $lote[$i]
    try {
      $s = [System.IO.File]::OpenRead($f.FullName)
      $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
    } catch { continue }

    $cx = ($i % $Columnas) * $Celda
    $cy = [math]::Floor($i / $Columnas) * ($Celda + 22)
    # "contain": quiero ver la foto entera para juzgar el encuadre, no recortada
    $p = $img.PixelWidth / $img.PixelHeight
    if ($p -gt 1) { $w = $Celda - 8; $h = ($Celda - 8) / $p } else { $h = $Celda - 8; $w = ($Celda - 8) * $p }
    $dc.DrawImage($img, (New-Object System.Windows.Rect ($cx + ($Celda-$w)/2),($cy + ($Celda-$h)/2),$w,$h))

    $etiqueta = $f.Name
    if ($etiqueta.Length -gt 30) { $etiqueta = $etiqueta.Substring(0,29) + '…' }
    $t = New-Object System.Windows.Media.FormattedText $etiqueta, ([System.Globalization.CultureInfo]::InvariantCulture), 0, $tipo, 12, $amarillo, 96
    $dc.DrawText($t, (New-Object System.Windows.Point ($cx+4),($cy+$Celda+2)))
    $s.Close()
  }
  $dc.Close()

  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $an,$al,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($vis)
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 78
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $ruta = "$salida\contactos-$($hoja+1).jpg"
  $fs = New-Object System.IO.FileStream($ruta,[System.IO.FileMode]::Create)
  $enc.Save($fs); $fs.Close()
  "  contactos-$($hoja+1).jpg  ($($lote.Count) fotos)"
}
