<#
  Saca la misma pantalla con el diseño ACTUAL y con el PROPUESTO, para poder
  ponerlas una al lado de la otra.

      1) levantar el servidor:   php -S localhost:4323 -t .
      2) powershell -ExecutionPolicy Bypass -File herramientas/comparar-temas.ps1

  TRES DETALLES QUE HAY QUE RESOLVER
  ----------------------------------
  1. El cartel de cookies tapa el pie de la pagina en toda captura. Se entra
     por una pagina puente que deja la decision ya tomada en localStorage, asi
     el cartel no aparece. La misma puente deja elegido el tema.

  2. La web tiene pantalla de carga. Por eso va --virtual-time-budget, que
     deja correr el JavaScript un rato antes de disparar la foto, y
     --run-all-compositor-stages-before-draw, sin el cual Chrome fotografia
     antes de terminar de pintar.

  3. Chrome headless fotografia el alto de la VENTANA, no el de la pagina.
     Por eso las ventanas van muy altas: con 1440x5200 entra el home entero.

  Cada captura usa un perfil temporal nuevo, asi ninguna se contamina con la
  eleccion de tema de la anterior.
#>

param(
  [int]$Ancho = 1440
)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "No encuentro Chrome en $chrome" }

$raiz   = Split-Path -Parent $PSScriptRoot
$salida = Join-Path $raiz '_previsualizacion\temas'
$base   = 'http://localhost:4323'
$puente = Join-Path $raiz '_puente-temas.html'

New-Item -ItemType Directory $salida -Force | Out-Null

function Capturar {
  param(
    [string]$Nombre,
    [string]$Ruta,      # ej: 'index.html' o 'producto.html?id=whey-protein-complex'
    [string]$Tema,      # '2026' o 'actual'
    [int]$Alto = 5200
  )

  $destino = Join-Path $salida ("{0}-{1}.png" -f $Nombre, $Tema)
  $perfil  = Join-Path $env:TEMP ("vitalica-tema-{0}-{1}" -f $Nombre, $Tema)
  if (Test-Path $perfil) { Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue }

  # La captura anterior SE BORRA antes de empezar.
  # Sin esto, cuando Chrome no llegaba a escribir el archivo, el Test-Path de
  # abajo encontraba el de la corrida pasada y lo informaba como si fuera
  # nuevo: "home-2026.png  2.622 KB", en verde, mintiendo. Me comí una
  # revision entera mirando una captura de seis horas antes.
  if (Test-Path $destino) { Remove-Item $destino -Force }

  # Puente: deja el tema y la decision de cookies puestos, y recien ahi entra.
  $html = @"
<!doctype html><meta charset="utf-8"><title>puente</title>
<body style="background:#fff">
<script>
  try {
    localStorage.setItem('vitalica_tema', '$Tema');
    localStorage.setItem('vitalica_cookies', 'no');
  } catch (e) {}
  location.replace('/$Ruta');
</script>
"@
  [System.IO.File]::WriteAllText($puente, $html, [System.Text.UTF8Encoding]::new($false))

  # PAGINAS MUY ALTAS: se renderizan a menos resolucion.
  # ----------------------------------------------------
  # Arriba de unos 5.000 px de alto, Chrome dejaba de escribir el archivo y
  # no avisaba: la portada con el tema nuevo fallaba siempre y las demas
  # salian bien. No es el tiempo —con 45 s tampoco andaba— es la cantidad de
  # pixeles que tiene que componer de una sola vez, y el tema nuevo agrega
  # filtros (las fotos en gris) que multiplican ese trabajo.
  #
  # Con --force-device-scale-factor=0.65 la misma pagina completa sale de
  # 936 px de ancho en vez de 1440. Como despues se achica a 560 u 820 para
  # mirarla, no se pierde nada util.
  $escala = if ($Alto -gt 5000) { 0.65 } else { 1 }

  & $chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run `
            --user-data-dir="$perfil" `
            --window-size=$Ancho,$Alto `
            --force-device-scale-factor=$escala `
            --virtual-time-budget=45000 `
            --run-all-compositor-stages-before-draw `
            --screenshot="$destino" "$base/_puente-temas.html" 2>&1 | Out-Null

  Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue

  if (Test-Path $destino) {
    '  {0,-30} {1,7:N0} KB' -f (Split-Path $destino -Leaf), ((Get-Item $destino).Length / 1KB)
  } else {
    '  {0,-30} FALLO' -f (Split-Path $destino -Leaf)
  }
}

'Comparando temas...'
''

$paginas = @(
  @{ n = 'home';      r = 'index.html';                             alto = 7200 },
  @{ n = 'catalogo';  r = 'productos.html';                         alto = 3000 },
  @{ n = 'producto';  r = 'producto.html?id=whey-protein-complex';  alto = 3600 },
  @{ n = 'nosotros';  r = 'sobre.html';                             alto = 4200 }
)

foreach ($p in $paginas) {
  foreach ($t in 'actual', '2026') {
    Capturar $p.n $p.r $t $p.alto
  }
}

# La puente no queda dando vueltas en el proyecto
if (Test-Path $puente) { Remove-Item $puente -Force }

''
"Listo: $salida"
