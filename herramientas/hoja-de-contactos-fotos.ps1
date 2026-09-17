<#
  Arma UNA imagen con miniaturas de todas las fotos de una carpeta, numeradas.

      powershell -ExecutionPolicy Bypass -File herramientas/hoja-de-contactos-fotos.ps1 `
                 -Carpeta assets\img -Salida _previsualizacion\contactos.jpg

  PARA QUE SIRVE
  --------------
  En assets/img hay 84 fotos sueltas que el sitio no usa: sesiones de Olimp,
  atletas, ambiente de gimnasio. Abrirlas de a una para ver cual sirve es
  media tarde. Con una sola hoja se elige en un minuto.

  Cada miniatura lleva su numero arriba; el script imprime la lista numerada
  para poder decir "la 23" y saber de que archivo se habla.

  Usa WPF (viene con Windows). No hay ImageMagick en esta maquina.
#>

param(
  [Parameter(Mandatory = $true)][string]$Carpeta,
  [Parameter(Mandatory = $true)][string]$Salida,
  [int]$Columnas = 8,
  [int]$Lado = 190
)

Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase

$dir = Resolve-Path $Carpeta
$fotos = Get-ChildItem $dir -File |
         Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp)$' } |
         Sort-Object Name

if (-not $fotos) { throw "No hay imagenes en $dir" }

$filas = [math]::Ceiling($fotos.Count / $Columnas)
$pie   = 18                                   # franja para el numero
$celda = $Lado + $pie
$ancho = $Columnas * $Lado
$alto  = $filas * $celda

$visual = New-Object System.Windows.Media.DrawingVisual
$dc = $visual.RenderOpen()
$dc.DrawRectangle([System.Windows.Media.Brushes]::Black, $null,
                  [System.Windows.Rect]::new(0, 0, $ancho, $alto))

$tipografia = New-Object System.Windows.Media.Typeface 'Consolas'
$blanco = [System.Windows.Media.Brushes]::White

for ($i = 0; $i -lt $fotos.Count; $i++) {
  $col = $i % $Columnas
  $fil = [math]::Floor($i / $Columnas)
  $x = $col * $Lado
  $y = $fil * $celda

  try {
    $flujo = [System.IO.File]::OpenRead($fotos[$i].FullName)
    $marco = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
               $flujo, 'None', 'OnLoad').Frames[0]

    # Se recorta al cuadrado por el centro para que la grilla quede pareja.
    #
    # OJO CON EL NOMBRE: en PowerShell las variables NO distinguen mayusculas,
    # asi que $lado y $Lado son la MISMA variable. Cuando esto se llamaba
    # $lado, el lado del recorte (2000 y pico) pisaba al lado de la miniatura
    # (150) y a partir de la segunda foto cada una se dibujaba del tamano de
    # la hoja entera: salian franjas horizontales en vez de una grilla.
    $ladoOrigen = [math]::Min($marco.PixelWidth, $marco.PixelHeight)
    $recorte = [System.Windows.Media.Imaging.CroppedBitmap]::new($marco,
                 [System.Windows.Int32Rect]::new(
                   [int](($marco.PixelWidth - $ladoOrigen) / 2),
                   [int](($marco.PixelHeight - $ladoOrigen) / 2),
                   $ladoOrigen, $ladoOrigen))

    $dc.DrawImage($recorte, [System.Windows.Rect]::new($x, $y, $Lado, $Lado))
    $flujo.Close()
  } catch {
    # Una foto ilegible no puede tumbar la hoja entera: queda el hueco negro.
  }

  $texto = New-Object System.Windows.Media.FormattedText(
    ('{0}' -f ($i + 1)), [System.Globalization.CultureInfo]::InvariantCulture,
    [System.Windows.FlowDirection]::LeftToRight, $tipografia, 12, $blanco, 1)
  $dc.DrawText($texto, [System.Windows.Point]::new($x + 4, $y + $Lado + 2))
}

$dc.Close()

$mapa = New-Object System.Windows.Media.Imaging.RenderTargetBitmap `
          $ancho, $alto, 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32)
$mapa.Render($visual)

$codificador = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
$codificador.QualityLevel = 78
$codificador.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($mapa))

$carpetaSalida = Split-Path -Parent $Salida
if ($carpetaSalida -and -not (Test-Path $carpetaSalida)) {
  New-Item -ItemType Directory $carpetaSalida -Force | Out-Null
}
$fs = New-Object System.IO.FileStream $Salida, ([System.IO.FileMode]::Create)
$codificador.Save($fs); $fs.Close()

''
for ($i = 0; $i -lt $fotos.Count; $i++) { '{0,3}. {1}' -f ($i + 1), $fotos[$i].Name }
''
"{0} fotos -> {1}  ({2} x {3})" -f $fotos.Count, $Salida, $ancho, $alto
