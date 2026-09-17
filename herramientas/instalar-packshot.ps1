<#
  Guarda en el proyecto una foto bajada del Drive.

      powershell -ExecutionPolicy Bypass -File herramientas/instalar-packshot.ps1 `
                 -Json "ruta\al\resultado.txt" -Destino "assets\img\products\variantes\5901330024207.webp"

  POR QUE EXISTE
  --------------
  Las descargas del conector de Drive vuelven como JSON con la imagen en
  base64 adentro. Son 300 KB de texto por foto; pasarlos a mano seria absurdo
  y ademas propenso a romperse. Este script los lee del archivo y los decodifica.

  Se lee con StreamReader y no con Get-Content: el JSON es UNA sola linea de
  300.000 caracteres y Get-Content la parte en pedazos por ancho de consola.
#>

param(
  [Parameter(Mandatory = $true)][string]$Json,
  [Parameter(Mandatory = $true)][string]$Destino
)

if (-not (Test-Path $Json)) { throw "No encuentro el archivo $Json" }

$texto = [System.IO.File]::ReadAllText($Json)
$datos = $texto | ConvertFrom-Json

if (-not $datos.content) { throw "El JSON no trae el campo 'content'" }

$bytes = [System.Convert]::FromBase64String($datos.content)

$carpeta = Split-Path -Parent $Destino
if ($carpeta -and -not (Test-Path $carpeta)) {
  New-Item -ItemType Directory $carpeta -Force | Out-Null
}

[System.IO.File]::WriteAllBytes($Destino, $bytes)

'  {0}' -f $datos.title
'  -> {0}   ({1:N0} KB, {2})' -f $Destino, ($bytes.Length / 1KB), $datos.mimeType
