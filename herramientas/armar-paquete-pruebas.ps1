param(
  # -Completo copia assets/img entero (444 MB) en vez de solo las
  # imagenes que el sitio referencia (17 MB). Util cuando el entorno
  # es privado y se prefiere no arriesgarse a que falte una foto.
  [switch]$Completo
)

# ============================================================================
#  Arma el paquete para subir a pruebas.vitalica.com.py
# ----------------------------------------------------------------------------
#  Existe porque el paquete anterior se armó a mano y quedó viejo sin que nadie
#  se diera cuenta: le faltaban archivos nuevos enteros. Con un script, el
#  paquete siempre refleja lo que hay en el proyecto.
#
#      powershell -ExecutionPolicy Bypass -File herramientas/armar-paquete-pruebas.ps1
#
#  QUÉ DEJA AFUERA Y POR QUÉ
#  -------------------------
#    odoo-credenciales.ini   la clave del ERP. Nunca sube a un servidor.
#    sync-odoo-precios.py    corre en tu compu, no en el hosting.
#    _drive/                 material original: cientos de MB que nadie sirve.
#    _respaldo-*, _descartado, _previsualizacion, _subir-a-pruebas
#    herramientas/           scripts de trabajo
#    servidor-local.ps1      solo para tu computadora
#    *.webp, *.jpg sueltos de la raíz   fotos de origen, no las usa el sitio
#
#  QUÉ CAMBIA PARA QUE SEA UN ENTORNO SEGURO
#  -----------------------------------------
#    robots.txt   pasa a bloquear TODO (que Google no lo indexe)
#    sitemap.xml  se borra
#    api/config.php  no se copia el tuyo: va el de ejemplo, para que la
#                    configuración de pruebas se cargue allá y no se
#                    arrastren claves desde acá.
# ============================================================================

$raiz    = Split-Path -Parent $PSScriptRoot
$destino = Join-Path $raiz '_subir-a-pruebas'

# Se vacía el contenido en vez de borrar la carpeta: si el Explorador de
# Windows la tiene abierta, borrar la carpeta falla y el paquete queda mezclado
# con el anterior. Vaciarla funciona igual.
if (Test-Path $destino) {
  Get-ChildItem $destino -Force | Remove-Item -Recurse -Force -ErrorAction Stop
} else {
  New-Item -ItemType Directory $destino | Out-Null
}

# --- api y las partes livianas de assets ---
Copy-Item (Join-Path $raiz 'api') -Destination $destino -Recurse -Force

# La carpeta destino se crea ANTES de copiar. Si no existe, Copy-Item no copia
# 'css' ADENTRO de 'assets': lo copia COMO 'assets'. Resultado: styles.css
# terminaba suelto en assets/ y el sitio se veía sin ningún estilo, con las
# letras negras y los links azules subrayados. Pasó exactamente eso.
$assetsDestino = Join-Path $destino 'assets'
New-Item -ItemType Directory $assetsDestino -Force | Out-Null
foreach ($c in 'css', 'js', 'fonts') {
  Copy-Item (Join-Path $raiz "assets\$c") -Destination $assetsDestino -Recurse -Force
}

# --- Imágenes -----------------------------------------------------------------
# Por defecto van SOLO las que el sitio referencia.
#
# assets/img pesa 444 MB, pero 427 son fotos originales de Olimp de 10 a 20 MB
# cada una que el sitio NO usa: material de origen que quedó guardado en la
# carpeta que se sirve. Las subcarpetas (products, hero, aliados, pilares,
# embajadores) sí son del sitio y pesan 17 MB en total.
#
# Con -Completo se copia assets/img entero. Sirve cuando el entorno es privado
# y se prefiere no arriesgarse a que falte una foto, a costa de subir 444 MB.
$imgDestino = Join-Path $destino 'assets\img'

if ($Completo) {
  Copy-Item (Join-Path $raiz 'assets\img') -Destination $assetsDestino -Recurse -Force
} else {
  New-Item -ItemType Directory $imgDestino -Force | Out-Null

  foreach ($sub in 'products', 'hero', 'aliados', 'pilares', 'embajadores') {
    $origen = Join-Path $raiz "assets\img\$sub"
    if (Test-Path $origen) { Copy-Item $origen -Destination $imgDestino -Recurse -Force }
  }

  # Si algún día se usa una foto suelta más, hay que agregarla a esta lista.
  $sueltasQueSeUsan = @(
    'logo-vitalica.png', 'logo-olimp.png', 'og-portada.webp', 'olimp-laboratorio.jpg'
  )
  foreach ($f in $sueltasQueSeUsan) {
    $origen = Join-Path $raiz "assets\img\$f"
    if (Test-Path $origen) { Copy-Item $origen -Destination $imgDestino -Force }
    else { "  AVISO: falta assets/img/$f" }
  }
}

# --- Archivos sueltos de la raíz ---
$sueltos = @(
  '*.html', '*.php', 'htaccess', 'robots.txt', 'sitemap.xml', 'odoo-mapeo.json'
)
foreach ($p in $sueltos) {
  Get-ChildItem $raiz -Filter $p -File -ErrorAction SilentlyContinue |
    ForEach-Object { Copy-Item $_.FullName -Destination $destino -Force }
}

# --- Sacar lo que nunca debe viajar ---
$prohibidos = @(
  'odoo-credenciales.ini', 'odoo-credenciales.ejemplo.ini',
  'sync-odoo-precios.py', 'servidor-local.ps1',
  'vista-previa-ficha.html', 'muestra.html', 'prueba.php',
  'vista-previa-marca.html'   # comparación interna, no es parte del sitio
)
foreach ($f in $prohibidos) {
  $r = Join-Path $destino $f
  if (Test-Path $r) { Remove-Item $r -Force }
}

# El config.php real no se copia: puede tener claves y la configuración de
# pruebas es distinta a propósito.
$cfg = Join-Path $destino 'api\config.php'
if (Test-Path $cfg) { Remove-Item $cfg -Force }

# Los pedidos guardados en tu compu no son del entorno de pruebas
$almacen = Join-Path $destino 'api\almacen'
if (Test-Path $almacen) { Remove-Item $almacen -Recurse -Force }

# --- Modo pruebas: que Google no lo encuentre ---
$robots = @"
# ENTORNO DE PRUEBAS - no debe indexarse.
# Si esto se indexa, Google muestra dos versiones del mismo contenido y las dos
# pierden posicion. Peor: alguien puede llegar aca buscando "vitalica proteina"
# y hacer un pedido que nadie va a atender.
User-agent: *
Disallow: /
"@
# Sin BOM y en ASCII: un robots.txt que arranca con BOM puede hacer que el
# rastreador se saltee la primera linea. Set-Content -Encoding UTF8 en
# PowerShell 5.1 escribe CON BOM, por eso se usa WriteAllText.
[System.IO.File]::WriteAllText((Join-Path $destino 'robots.txt'), $robots, [System.Text.Encoding]::ASCII)

$sm = Join-Path $destino 'sitemap.xml'
if (Test-Path $sm) { Remove-Item $sm -Force }

# --- Resumen ---
$archivos = Get-ChildItem $destino -Recurse -File
$mb = [math]::Round(($archivos | Measure-Object Length -Sum).Sum / 1MB, 1)
''
"Paquete armado: $destino"
"  $($archivos.Count) archivos · $mb MB"
''
'Comprobaciones:'
# styles.css va PRIMERO en la lista a propósito: fue justo lo que se rompió una
# vez, y como el sitio lo arma JavaScript, las secciones y los productos seguían
# apareciendo. Se veía todo, pero sin un solo estilo aplicado.
foreach ($f in 'assets\css\styles.css','assets\css\producto-ficha.css','assets\js\analitica.js','assets\js\fichas-uso.js','api\sync-precios.php','odoo-mapeo.json') {
  $ok = Test-Path (Join-Path $destino $f)
  "  {0} {1}" -f $(if ($ok) {'OK  '} else {'FALTA'}), $f
}
foreach ($f in 'odoo-credenciales.ini','api\config.php','sitemap.xml') {
  $hay = Test-Path (Join-Path $destino $f)
  "  {0} {1} {2}" -f $(if ($hay) {'OJO '} else {'OK  '}), $f, $(if ($hay) {'(NO debería estar)'} else {'(no está, correcto)'})
}
