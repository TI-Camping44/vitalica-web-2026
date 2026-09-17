<#
  Achica imagenes a un ancho dado y las pasa a JPEG.

      powershell -ExecutionPolicy Bypass -File herramientas/achicar.ps1 -Carpeta _previsualizacion\temas -Ancho 620

  Existe porque las capturas de pagina completa salen de 1440 px de ancho y
  varios miles de alto: pesan demasiado para mirarlas o mandarlas. Usa WPF,
  que viene con Windows; en esta maquina no hay ImageMagick.
#>

param(
  [Parameter(Mandatory = $true)][string]$Carpeta,
  [int]$Ancho = 620,
  [int]$Calidad = 80,
  [string]$Sufijo = '-chico'
)

Add-Type -AssemblyName PresentationCore

$dir = Resolve-Path $Carpeta
$destino = Join-Path $dir 'chicas'
New-Item -ItemType Directory $destino -Force | Out-Null

# PNG y JPG: las capturas del sitio salen en PNG, pero las fotos que vienen
# del Drive son JPG y también hay que poder achicarlas.
foreach ($archivo in Get-ChildItem $dir -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' }) {
  $flujo = [System.IO.File]::OpenRead($archivo.FullName)
  $marco = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
             $flujo, 'None', 'OnLoad').Frames[0]

  # Nunca se agranda: una captura mas angosta que el objetivo se deja igual.
  $escala = $Ancho / $marco.PixelWidth
  if ($escala -gt 1) { $escala = 1 }

  $transformada = New-Object System.Windows.Media.Imaging.TransformedBitmap `
                    $marco, (New-Object System.Windows.Media.ScaleTransform $escala, $escala)

  $codificador = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $codificador.QualityLevel = $Calidad
  $codificador.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($transformada))

  $ruta = Join-Path $destino ($archivo.BaseName + $Sufijo + '.jpg')
  $salida = New-Object System.IO.FileStream $ruta, ([System.IO.FileMode]::Create)
  $codificador.Save($salida)
  $salida.Close()
  $flujo.Close()

  '  {0,-30} {1,5} x {2,-6} -> {3,6:N0} KB' -f $archivo.Name,
    $transformada.PixelWidth, $transformada.PixelHeight, ((Get-Item $ruta).Length / 1KB)
}

''
"Listo: $destino"
