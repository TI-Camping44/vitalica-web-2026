<#
  Saca las capturas de pantalla para la guía del equipo.

  Usa Chrome en modo headless contra el servidor PHP local
  (php -S localhost:4323), no contra el sitio real.

      1) levantar el servidor:   php -S localhost:4323 -t .
      2) correr esto

  DOS DETALLES QUE HAY QUE RESOLVER
  ---------------------------------
  1. La web tiene pantalla de carga: si se captura al instante sale el "93%".
     Por eso va --virtual-time-budget, que deja correr el JavaScript un rato
     antes de disparar la foto.

  2. Sin --run-all-compositor-stages-before-draw, Chrome dispara la foto antes
     de terminar de pintar y sale la pantalla de carga a medias.

  3. Los paneles piden sesión. Chrome headless arranca sin cookies, así que
     antes de cada captura de panel se abre una página puente que hace el
     login por fetch y recién entonces redirige. Como todo pasa dentro del
     mismo perfil temporal, la cookie viaja bien.
#>

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "No encuentro Chrome en $chrome" }

$raiz    = Split-Path -Parent $PSScriptRoot
$salida  = Join-Path $raiz '_previsualizacion\guia'
$perfil  = Join-Path $env:TEMP 'vitalica-capturas'
$base    = 'http://localhost:4323'

New-Item -ItemType Directory $salida -Force | Out-Null
if (Test-Path $perfil) { Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue }

# Página puente: entra al área interna y después va a donde le pidan.
# Vive dentro del proyecto para que el navegador la vea como mismo origen.
$puente = Join-Path $raiz '_puente-capturas.html'

function Capturar {
  param(
    [string]$Nombre,
    [string]$Url,
    [int]$Ancho = 1200,
    [int]$Alto = 900,
    [switch]$ConSesion
  )

  $destino = Join-Path $salida "$Nombre.png"
  $objetivo = $Url

  if ($ConSesion) {
    # Se reescribe el puente con el destino de esta captura
    $html = @"
<!doctype html><meta charset="utf-8"><title>puente</title>
<body style="background:#fff">
<script>
(async () => {
  const d = new FormData();
  d.append('usuario', 'Admin');
  d.append('clave', 'Pruebas-Admin-2026');
  try { await fetch('/api/acceso.php', { method: 'POST', body: d, credentials: 'same-origin' }); }
  catch (e) {}
  location.replace('$Url');
})();
</script>
"@
    [System.IO.File]::WriteAllText($puente, $html, [System.Text.UTF8Encoding]::new($false))
    $objetivo = "$base/_puente-capturas.html"
  }

  & $chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run `
            --user-data-dir="$perfil" `
            --window-size=$Ancho,$Alto `
            --virtual-time-budget=20000 `
            --run-all-compositor-stages-before-draw `
            --screenshot="$destino" $objetivo 2>&1 | Out-Null

  if (Test-Path $destino) {
    '  {0,-26} {1,7:N0} bytes' -f "$Nombre.png", (Get-Item $destino).Length
  } else {
    '  {0,-26} FALLO' -f "$Nombre.png"
  }
}

'Capturando...'
''

# --- La web pública ---
Capturar 'home'            "$base/index.html"                              1280 900
Capturar 'productos'       "$base/productos.html"                          1280 900
Capturar 'producto'        "$base/producto.html?id=whey-protein-complex"   1280 950
Capturar 'quienes-somos'   "$base/sobre.html"                              1280 900
Capturar 'puntos-de-venta' "$base/contacto.html"                           1280 900
Capturar 'checkout'        "$base/checkout.html"                           1280 950

# --- El área interna ---
Capturar 'acceso'          "$base/api/acceso.php"                          1100 720
Capturar 'menu-interno'    "$base/api/acceso.php"        1100 720 -ConSesion
Capturar 'pedidos'         "$base/api/panel.php"         1280 900 -ConSesion
Capturar 'configuracion'   "$base/admin.php"             1280 950 -ConSesion
Capturar 'equipo'          "$base/api/equipo.php"        1100 800 -ConSesion

# El puente no queda dando vueltas en el proyecto
if (Test-Path $puente) { Remove-Item $puente -Force }
if (Test-Path $perfil) { Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue }

''
"Listo: $salida"
