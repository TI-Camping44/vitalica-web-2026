<#
  Saca una foto del carrito con el medidor de envio gratis, en sus dos estados.

      1) php -S localhost:4323 -t .
      2) powershell -ExecutionPolicy Bypass -File herramientas/capturar-carrito.ps1

  COMO SE FOTOGRAFIA UN CARRITO
  -----------------------------
  El carrito no tiene direccion propia: hay que dejar productos adentro y
  abrir el panel. No alcanza con una pagina puente que redirija, porque el
  guion tiene que correr DENTRO del home ya armado.

  Por eso se arma una copia temporal de index.html con el guion pegado antes
  de </body>. Vive en la raiz del proyecto para que todas las rutas relativas
  (assets/...) sigan funcionando igual, y se borra al terminar.

  El umbral de envio gratis se pone SOLO para la captura, en memoria. Hoy
  VITALICA_CONFIG.envio.gratisDesde es null y el medidor no se dibuja: el
  numero lo tiene que decidir Vitalica segun el margen.
#>

param(
  [int]$Umbral = 500000
)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "No encuentro Chrome en $chrome" }

$raiz    = Split-Path -Parent $PSScriptRoot
$salida  = Join-Path $raiz '_previsualizacion\temas'
$copia   = Join-Path $raiz '_puente-carrito.html'
$base    = 'http://localhost:4323'
$indice  = [System.IO.File]::ReadAllText((Join-Path $raiz 'index.html'))

New-Item -ItemType Directory $salida -Force | Out-Null

function Capturar {
  param([string]$Nombre, [string]$Tema, [string]$Items)

  $destino = Join-Path $salida "$Nombre.png"
  $perfil  = Join-Path $env:TEMP "vitalica-carrito-$Nombre"
  if (Test-Path $perfil) { Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue }

  # El tema y la decision de cookies se dejan puestos ANTES de que corra
  # tema.js, asi la pagina ya pinta el primer cuadro con el tema correcto y
  # el cartel de cookies no aparece tapando el pie.
  $previo = @"
<script>
  try {
    localStorage.setItem('vitalica_tema', '$Tema');
    localStorage.setItem('vitalica_cookies', 'no');
    localStorage.removeItem('vitalica_carrito');
  } catch (e) {}
</script>
"@

  $posterior = @"
<script>
(function esperar() {
  // Se espera a que el sitio este armado: el drawer lo crea components.js y
  // los precios los completa data.js. Si se corriera antes, el carrito se
  // abriria vacio o con los precios todavia en null.
  if (typeof Vitalica === 'undefined' || !Vitalica.abrirCarrito ||
      typeof Carrito === 'undefined' || !document.getElementById('drawer-carrito')) {
    return setTimeout(esperar, 120);
  }
  VITALICA_CONFIG.envio.gratisDesde = $Umbral;
  $Items
  var flot = document.querySelector('.whatsapp-flotante'); if (flot) { flot.remove(); }
  var sel = document.querySelector('[data-selector-tema]'); if (sel) { sel.remove(); }
  Vitalica.abrirCarrito();
})();
</script>
"@

  # El bloque previo va ANTES del <script> de tema.js, no despues de <body>.
  # tema.js vive en el <head> y decide el tema al instante: si la eleccion se
  # guardara mas abajo, la captura salia con el diseno actual. Paso.
  $marca = '<script src="assets/js/tema.js'
  if ($indice.IndexOf($marca) -lt 0) { throw "No encuentro el <script> de tema.js en index.html" }
  $html = $indice.Replace($marca, $previo + $marca).Replace('</body>', $posterior + '</body>')
  [System.IO.File]::WriteAllText($copia, $html, [System.Text.UTF8Encoding]::new($false))

  & $chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run `
            --user-data-dir="$perfil" `
            --window-size=1440,1000 `
            --virtual-time-budget=25000 `
            --run-all-compositor-stages-before-draw `
            --screenshot="$destino" "$base/_puente-carrito.html" 2>&1 | Out-Null

  Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue

  if (Test-Path $destino) {
    '  {0,-30} {1,7:N0} KB' -f "$Nombre.png", ((Get-Item $destino).Length / 1KB)
  } else {
    '  {0,-30} FALLO' -f "$Nombre.png"
  }
}

'Capturando el carrito...'
''
Capturar 'carrito-falta'   '2026' "Carrito.agregar('whey-protein-complex',1,'5901330063985');"
Capturar 'carrito-logrado' '2026' "Carrito.agregar('whey-protein-complex',2,'5901330063985');Carrito.agregar('creatine-monohydrate',1,'5901330026447');"

# La copia no queda dando vueltas en el proyecto
if (Test-Path $copia) { Remove-Item $copia -Force }

''
"Listo: $salida"
