Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Retratos cuadrados de los embajadores de Olimp para la sección de la web.
# Las fotos son del banco oficial de Olimp (Drive: DROPBOX OLIMP > IMÁGENES
# OLIMP), ya descargado en assets/img/.
#
# El recorte se ancla arriba (no al centro): en fotos de cuerpo entero el
# centro cae en el torso y la cara queda fuera. 'anclaY' es qué parte de la
# altura original queda en el centro del cuadrado; se ajusta por foto.

$base = Split-Path -Parent $PSScriptRoot
$origen = "$base\assets\img"
$destino = "$base\assets\img\embajadores"
if (-not (Test-Path $destino)) { New-Item -ItemType Directory $destino | Out-Null }
$ladoFinal = 700

# Los archivos se buscan por PATRON y no por nombre exacto: varios traen
# caracteres polacos (la 'l' cruzada de Slaby) que PowerShell no lee bien
# desde un .ps1 guardado en UTF-8 sin BOM, y rompen el script entero.
$gente = @(
  @{ patron = '2025_02_ELTON_PINTO_MOTA (2)*';    salida = 'elton-pinto-mota';      anclaY = 0.30 },
  @{ patron = '2023_01_09_Patrycja*';             salida = 'patrycja-slaby';        anclaY = 0.32 },
  @{ patron = '2023_03_08_Kasia_Dziurska14*';     salida = 'kasia-dziurska';        anclaY = 0.35 },
  # Katja Nowack quedo afuera: el unico archivo suyo del banco es un packshot
  # del envase, no un retrato. Si Olimp manda una foto de ella, se agrega aca.
  @{ patron = '2021_06_07_Wojciech_Sobierajski*'; salida = 'wojciech-sobierajski';  anclaY = 0.35 },
  @{ patron = '2020_10_27_Kasia_Oleskiewicz*';    salida = 'kasia-oleskiewicz';     anclaY = 0.30 }
)

foreach ($g in $gente) {
  $hallado = Get-ChildItem $origen -File -Filter $g.patron | Select-Object -First 1
  if (-not $hallado) { "  FALTA: $($g.patron)"; continue }
  $ruta = $hallado.FullName

  $s = [System.IO.File]::OpenRead($ruta)
  $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]

  # Cuadrado tomando el lado más corto
  $ladoRecorte = [Math]::Min($img.PixelWidth, $img.PixelHeight)
  $x = [int](($img.PixelWidth - $ladoRecorte) / 2)
  $y = [int](($img.PixelHeight * $g.anclaY) - ($ladoRecorte / 2))
  if ($y -lt 0) { $y = 0 }
  if ($y + $ladoRecorte -gt $img.PixelHeight) { $y = $img.PixelHeight - $ladoRecorte }

  $rec = New-Object System.Windows.Media.Imaging.CroppedBitmap $img,(New-Object System.Windows.Int32Rect $x,$y,$ladoRecorte,$ladoRecorte)
  $esc = $ladoFinal / $ladoRecorte
  $chico = New-Object System.Windows.Media.Imaging.TransformedBitmap $rec,(New-Object System.Windows.Media.ScaleTransform $esc,$esc)

  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 82
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($chico))
  $out = "$destino\$($g.salida).jpg"
  $fs = New-Object System.IO.FileStream($out,[System.IO.FileMode]::Create)
  $enc.Save($fs); $fs.Close(); $s.Close()
  "  {0,-24} {1}x{1}  {2} KB" -f $g.salida, $ladoFinal, [math]::Round((Get-Item $out).Length/1KB)
}
