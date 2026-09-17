Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# Fotos de respaldo POR TAMAÑO para las variantes que no tienen foto de sabor.
#
# El problema que resuelven: si una variante no trae 'imagen', la ficha caía a
# la foto genérica del producto, que es la bolsa de 2270 g. Un sabor de 700 g
# sin foto propia mostraba el envase del tamaño equivocado.
#
# Olimp no manda packshot de cada sabor, pero sí uno "universal" por tamaño.
# Con eso al menos el ENVASE que se ve es el correcto.
#
# Origen: _drive/productos/ (packshots oficiales, 2000x2000 y varios MB).
# Se bajan a 800x800 como el resto de assets/img/products/variantes/.

$base = Split-Path -Parent $PSScriptRoot
$origen = "$base\_drive\productos"
$destino = "$base\assets\img\products\variantes"
$ladoFinal = 800

$mapa = @(
  @{ de = 'whey-700-universal.png';  a = 'whey-protein-complex-700g.png' },
  @{ de = 'whey-2270-universal.png'; a = 'whey-protein-complex-2270g.png' },
  @{ de = 'redweiler-480.png';       a = 'redweiler-480g.png' }
)

foreach ($m in $mapa) {
  $ruta = Join-Path $origen $m.de
  if (-not (Test-Path $ruta)) { "  FALTA: $($m.de)"; continue }

  $s = [System.IO.File]::OpenRead($ruta)
  $img = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s,'None','OnLoad').Frames[0]
  $esc = $ladoFinal / [Math]::Max($img.PixelWidth, $img.PixelHeight)
  $chico = New-Object System.Windows.Media.Imaging.TransformedBitmap $img,(New-Object System.Windows.Media.ScaleTransform $esc,$esc)

  # PNG y no JPEG: los packshots vienen con fondo transparente y pasarlos a
  # JPEG les pone un rectángulo negro detrás (ya pasó una vez en este proyecto).
  $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($chico))
  $out = Join-Path $destino $m.a
  $fs = New-Object System.IO.FileStream($out,[System.IO.FileMode]::Create)
  $enc.Save($fs); $fs.Close(); $s.Close()
  "  {0,-34} {1}x{2}  {3} KB" -f $m.a, $chico.PixelWidth, $chico.PixelHeight, [math]::Round((Get-Item $out).Length/1KB)
}
