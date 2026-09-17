<#
  Fotografia una pagina del sitio local con Chrome headless.

      powershell -ExecutionPolicy Bypass -File herramientas/foto-pagina.ps1 `
                 -Ruta "index.html?tema=2026" -Salida _previsualizacion/home.png -Ancho 1440

  POR QUE NO SE USA EL PANEL DEL NAVEGADOR
  ----------------------------------------
  Porque emula mal el ancho: la pagina termina dibujada en una esquina y la
  captura no sirve para juzgar el diseno. Chrome headless respeta el ancho
  que se le pide.

  DOS BANDERAS QUE IMPORTAN
    --virtual-time-budget            espera a que corran los scripts y las
                                     animaciones antes de disparar. Sin esto
                                     sale la pantalla de carga del sitio.
    --run-all-compositor-stages...   obliga a pintar la pagina entera y no
                                     solo lo que entra en la ventana.

  Y SIEMPRE SE BORRA EL DESTINO ANTES. Si Chrome falla y el archivo anterior
  sigue ahi, uno cree estar mirando la captura nueva. Ya paso.
#>
param(
  [Parameter(Mandatory = $true)][string]$Ruta,
  [Parameter(Mandatory = $true)][string]$Salida,
  [int]$Ancho = 1440,
  [int]$Alto = 900,
  [int]$Espera = 6000
)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "No encuentro Chrome en $chrome" }

$raiz = Split-Path -Parent $PSScriptRoot
$destino = if ([System.IO.Path]::IsPathRooted($Salida)) { $Salida }
           else { Join-Path $raiz $Salida }
New-Item -ItemType Directory (Split-Path $destino) -Force | Out-Null
if (Test-Path $destino) { Remove-Item $destino -Force }

$url = "http://localhost:4323/$Ruta"
$perfil = Join-Path $env:TEMP ('chrome-vitalica-' + [guid]::NewGuid().ToString('N'))

& $chrome --headless=new --disable-gpu --hide-scrollbars `
  "--window-size=$Ancho,$Alto" `
  "--virtual-time-budget=$Espera" `
  --run-all-compositor-stages-before-draw `
  --force-device-scale-factor=1 `
  "--user-data-dir=$perfil" `
  "--screenshot=$destino" `
  $url 2>&1 | Out-Null

Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $destino)) { throw "Chrome no escribio $destino" }
'{0}  ({1:N0} KB)' -f $destino, ((Get-Item $destino).Length / 1KB)
