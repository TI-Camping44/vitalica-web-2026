# ============================================================================
#  Arma el paquete para subir a PRODUCCIÓN (vitalica.com.py)
# ----------------------------------------------------------------------------
#      powershell -ExecutionPolicy Bypass -File herramientas/armar-paquete-produccion.ps1
#
#  Es hermano de armar-paquete-pruebas.ps1, pero al revés en tres cosas:
#
#      pruebas                          producción
#      -------                          ----------
#      robots.txt bloquea TODO          robots.txt deja entrar a Google
#      sitemap.xml se borra             sitemap.xml va
#      da igual si falta una foto       si falta una foto, la ve un cliente
#
#  POR QUÉ LAS IMÁGENES SE BUSCAN Y NO SE LISTAN
#  ---------------------------------------------
#  El paquete de pruebas tiene las fotos sueltas escritas a mano. Esa lista
#  quedó vieja: nombra og-portada.webp, que ya no se usa, y le faltan cuatro
#  que sí — entre ellas la portada de la primera nota del blog y el logo negro
#  de Olimp. En pruebas eso es un cuadrito roto que nadie mira. En producción
#  lo ve el que está por comprar.
#
#  Así que acá no hay lista: se leen los .html, .js y .css y se copia
#  exactamente lo que nombran. Si mañana se agrega una foto, viaja sola.
#
#  LO QUE ESTE PAQUETE NO PISA, A PROPÓSITO
#  ----------------------------------------
#    api/config.php    el servidor tiene el suyo, con las claves reales y los
#                      usuarios del área interna. Si se sobrescribe, nadie
#                      puede entrar al panel y los pedidos dejan de llegar.
#    api/almacen/      los pedidos de clientes de verdad. Nombres, teléfonos
#                      y direcciones. Lo de tu computadora son pruebas.
#    .htaccess         el del servidor puede tener reglas que acá no están.
#    .user.ini, php.ini
#
#  Ninguno de esos archivos entra al paquete. Al subir por cPanel hay que
#  subir SOLO lo que está adentro de _subir-a-produccion, sin borrar antes lo
#  que hay: los que faltan del paquete quedan como están.
# ============================================================================

$raiz    = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz '_subir-a-produccion'

# Se vacía en vez de borrarse: si el Explorador la tiene abierta, borrar la
# carpeta falla y el paquete queda mezclado con el anterior.
if (Test-Path $destino) {
  Get-ChildItem $destino -Force | Remove-Item -Recurse -Force -ErrorAction Stop
} else {
  New-Item -ItemType Directory $destino | Out-Null
}

# --- api ---------------------------------------------------------------------
Copy-Item (Join-Path $raiz 'api') -Destination $destino -Recurse -Force

# --- assets: css, js y fuentes ------------------------------------------------
# La carpeta destino se crea ANTES de copiar. Si no existe, Copy-Item no copia
# 'css' ADENTRO de 'assets': lo copia COMO 'assets'. Resultado: styles.css
# suelto y el sitio sin un solo estilo. Pasó exactamente eso una vez.
$assetsDestino = Join-Path $destino 'assets'
New-Item -ItemType Directory $assetsDestino -Force | Out-Null
foreach ($c in 'css', 'js', 'fonts') {
  Copy-Item (Join-Path $raiz "assets\$c") -Destination $assetsDestino -Recurse -Force
}

# --- assets/img ---------------------------------------------------------------
# Las subcarpetas van enteras: son del sitio y pesan 17 MB en total.
# assets/img suelto pesa 444 MB, pero casi todo es material original de Olimp
# de 10 a 20 MB por foto que el sitio no sirve. Por eso las sueltas se eligen.
$imgDestino = Join-Path $destino 'assets\img'
New-Item -ItemType Directory $imgDestino -Force | Out-Null

foreach ($sub in 'products', 'hero', 'aliados', 'pilares', 'embajadores', 'blog') {
  $origen = Join-Path $raiz "assets\img\$sub"
  if (Test-Path $origen) { Copy-Item $origen -Destination $imgDestino -Recurse -Force }
}

# Se leen los archivos del sitio y se saca qué fotos sueltas nombran.
$fuentes = Get-ChildItem $raiz -Include *.html -File -Recurse -Depth 0
$fuentes += Get-ChildItem (Join-Path $raiz 'assets\js')  -Include *.js  -File -Recurse
$fuentes += Get-ChildItem (Join-Path $raiz 'assets\css') -Include *.css -File -Recurse

$nombradas = New-Object System.Collections.Generic.HashSet[string]
foreach ($f in $fuentes) {
  $texto = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $texto) { continue }
  foreach ($m in [regex]::Matches($texto, 'assets/img/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|svg))')) {
    [void]$nombradas.Add($m.Groups[1].Value)
  }
}

$faltan = @()
foreach ($n in ($nombradas | Sort-Object)) {
  $origen = Join-Path $raiz "assets\img\$n"
  if (Test-Path $origen) { Copy-Item $origen -Destination $imgDestino -Force }
  else { $faltan += $n }
}

# --- Archivos sueltos de la raíz ---------------------------------------------
# 'htaccess' NO se copia: el del servidor manda. Ver la nota de arriba.
$sueltos = @('*.html', '*.php', 'robots.txt', 'sitemap.xml', 'odoo-mapeo.json')
foreach ($p in $sueltos) {
  Get-ChildItem $raiz -Filter $p -File -ErrorAction SilentlyContinue |
    ForEach-Object { Copy-Item $_.FullName -Destination $destino -Force }
}

# --- Sacar lo que nunca debe viajar ------------------------------------------
$prohibidos = @(
  'odoo-credenciales.ini', 'odoo-credenciales.ejemplo.ini',
  'sync-odoo-precios.py', 'servidor-local.ps1',
  'vista-previa-ficha.html', 'vista-previa-marca.html',
  'muestra.html', 'prueba.php',
  # El diagnostico muestra rutas, version de PHP y permisos a cualquiera que
  # sepa la direccion. El propio archivo dice que hay que borrarlo despues de
  # configurar, y eso es justo lo que nadie se acuerda de hacer en un sitio
  # que ya funciona. Si algo falla al subir, se sube suelto un rato y listo.
  'api\prueba.php'
)
foreach ($f in $prohibidos) {
  $r = Join-Path $destino $f
  if (Test-Path $r) { Remove-Item $r -Force }
}

# El config.php del servidor tiene las claves reales y los usuarios del área
# interna. Pisarlo deja a todo el mundo afuera del panel.
$cfg = Join-Path $destino 'api\config.php'
if (Test-Path $cfg) { Remove-Item $cfg -Force }

# Pedidos de clientes reales. Los de tu computadora son pruebas: no viajan.
$almacen = Join-Path $destino 'api\almacen'
if (Test-Path $almacen) { Remove-Item $almacen -Recurse -Force }

# api/htaccess tampoco: en el servidor ya está puesto como .htaccess y es el
# que bloquea config.php y la carpeta de pedidos. Si se sube el archivo sin
# punto, queda uno al lado sin efecto y da la falsa impresión de que protege.
$ht = Join-Path $destino 'api\htaccess'
if (Test-Path $ht) { Remove-Item $ht -Force }

# --- Resumen ------------------------------------------------------------------
$archivos = Get-ChildItem $destino -Recurse -File
$mb = [math]::Round(($archivos | Measure-Object Length -Sum).Sum / 1MB, 1)
''
"Paquete de PRODUCCION armado: $destino"
"  $($archivos.Count) archivos - $mb MB"
"  $($nombradas.Count) fotos sueltas, encontradas leyendo el sitio"
''

if ($faltan.Count -gt 0) {
  'FALTAN FOTOS QUE EL SITIO NOMBRA:'
  foreach ($n in $faltan) { "  falta  assets/img/$n" }
  ''
}

'Tiene que estar:'
foreach ($f in 'assets\css\styles.css','assets\css\tema-2026.css','assets\js\data.js',
               'assets\js\data-noticias.js','assets\js\pdf-pedido.js',
               'api\blog.php','api\blog-datos.php','noticias.html','nota.html',
               'sitemap.xml','robots.txt','assets\img\og-portada.jpg') {
  $ok = Test-Path (Join-Path $destino $f)
  "  {0} {1}" -f $(if ($ok) {'OK   '} else {'FALTA'}), $f
}

''
'NO tiene que estar:'
foreach ($f in 'odoo-credenciales.ini','api\config.php','api\almacen','api\htaccess','api\prueba.php') {
  $hay = Test-Path (Join-Path $destino $f)
  "  {0} {1}" -f $(if ($hay) {'OJO  '} else {'OK   '}), $f
}
''
