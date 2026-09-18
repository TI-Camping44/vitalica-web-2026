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
#    api/config.php    el de esta computadora manda los correos a archivos y
#                      tiene un email de prueba. Lo arma, con los valores
#                      reales, herramientas/armar-config-produccion.ps1, que
#                      hay que correr DESPUÉS de este.
#    api/almacen/      los pedidos de clientes de verdad. Nombres, teléfonos
#                      y direcciones. Lo de tu computadora son pruebas.
#    .user.ini, php.ini
#
#  OJO CON LO QUE HAY HOY EN vitalica.com.py
#  -----------------------------------------
#  El sitio publicado NO es este proyecto: es otra construcción, con su
#  styles.css en la raíz, Font Awesome, Curator y el SDK de Facebook. O sea
#  que allá no existe ningún archivo nuestro todavía.
#
#  Dos consecuencias:
#
#    · Los dos .htaccess van en el paquete, ya con el punto puesto. Allá no
#      hay ninguno nuestro que respetar.
#    · Al subir encima, los archivos del sitio viejo que no coincidan de
#      nombre NO se borran: quedan sueltos y siguen siendo alcanzables.
#      Limpiar eso es una decisión aparte, y va después de bajarse una copia
#      de seguridad completa desde cPanel.
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
# El 'htaccess' sin punto se copia acá con el resto y más abajo se vuelve a
# poner con el punto delante. Ver el bloque de los .htaccess.
$sueltos = @('*.html', '*.php', 'htaccess', 'robots.txt', 'sitemap.xml', 'odoo-mapeo.json')
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

# --- Los .htaccess, ya con el punto puesto -----------------------------------
# En el proyecto se guardan sin punto para que Windows no los esconda. En el
# servidor TIENEN que llamarse .htaccess o no hacen absolutamente nada, y
# renombrarlos a mano en cPanel es justo el paso que se saltea el que va
# apurado. Si el de api/ no queda bien puesto, api/config.php --con la clave
# del panel-- se descarga escribiendo la direccion en el navegador.
#
# El sitio que hoy esta en produccion NO es este proyecto, asi que alla no hay
# ningun .htaccess nuestro: estos dos hay que subirlos si o si.
foreach ($par in @(@('htaccess', '.htaccess'), @('api\htaccess', 'api\.htaccess'))) {
  $sinPunto = Join-Path $raiz $par[0]
  $conPunto = Join-Path $destino $par[1]
  if (Test-Path $sinPunto) {
    New-Item -ItemType Directory (Split-Path $conPunto) -Force | Out-Null
    Copy-Item $sinPunto -Destination $conPunto -Force
  } else {
    "  AVISO: falta $($par[0]) en el proyecto"
  }
  # El de adentro del paquete sin punto se borra: si viajan los dos, en el
  # servidor queda uno inerte al lado del bueno y confunde a quien revise.
  $sobra = Join-Path $destino $par[0]
  if (Test-Path $sobra) { Remove-Item $sobra -Force }
}

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
               'sitemap.xml','robots.txt','assets\img\og-portada.jpg',
               '.htaccess','api\.htaccess') {
  $ok = Test-Path (Join-Path $destino $f)
  "  {0} {1}" -f $(if ($ok) {'OK   '} else {'FALTA'}), $f
}

''
'NO tiene que estar:'
foreach ($f in 'odoo-credenciales.ini','api\almacen','htaccess','api\htaccess','api\prueba.php') {
  $hay = Test-Path (Join-Path $destino $f)
  "  {0} {1}" -f $(if ($hay) {'OJO  '} else {'OK   '}), $f
}
''
