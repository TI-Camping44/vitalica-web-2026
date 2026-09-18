# ============================================================================
#  Arma api/config.php para PRODUCCIÓN y lo deja dentro del paquete
# ----------------------------------------------------------------------------
#      powershell -ExecutionPolicy Bypass -File herramientas/armar-config-produccion.ps1
#
#  CORRELO DESPUÉS de armar-paquete-produccion.ps1, porque ese script borra
#  el config.php del paquete a propósito y este lo vuelve a poner, ya con los
#  valores del sitio real.
#
#  POR QUÉ EXISTE ESTE SCRIPT EN VEZ DE EDITAR EL ARCHIVO A MANO
#  -------------------------------------------------------------
#  El config.php que está en la carpeta del proyecto es el de la computadora:
#  manda los correos a archivos en vez de enviarlos, y el email del equipo es
#  'prueba-local@ejemplo.com'. Si ese archivo se sube tal cual, el sitio toma
#  pedidos y NADIE se entera: no llega el correo al equipo ni la confirmación
#  al cliente. El pedido queda escrito en un archivo que nadie abre.
#
#  Son tres valores los que cambian, y son justo los tres que no se notan si
#  quedan mal. Por eso se cambian solos y se verifican al final.
#
#  DE DÓNDE SALE LA CONTRASEÑA
#  ---------------------------
#  De ACCESOS.md, de la fila "Contraseña (sitio real)". No se escribe acá.
#  ACCESOS.md no está en el repositorio y no se comparte: vive solo en esta
#  computadora. Si ese archivo no está o esa fila cambió de nombre, el script
#  para y no genera nada, en vez de dejar un config a medias.
# ============================================================================

$raiz     = Split-Path -Parent $PSScriptRoot
$paquete  = Join-Path $raiz '_subir-a-produccion'
$origen   = Join-Path $raiz 'api\config.php'
$accesos  = Join-Path $raiz 'ACCESOS.md'
$destino  = Join-Path $paquete 'api\config.php'

foreach ($f in @($paquete, $origen, $accesos)) {
  if (-not (Test-Path $f)) {
    Write-Error "No encuentro: $f`nSi falta el paquete, corre primero armar-paquete-produccion.ps1"
    exit 1
  }
}

# --- La contraseña del sitio real --------------------------------------------
$fila = Select-String -Path $accesos -Pattern 'Contrase.a \(sitio real\)' |
        Select-Object -First 1
if (-not $fila) {
  Write-Error "En ACCESOS.md no encuentro la fila 'Contraseña (sitio real)'."
  exit 1
}
if ($fila.Line -notmatch '`([^`]+)`') {
  Write-Error "La fila esta pero no tiene la clave entre comillas invertidas."
  exit 1
}
$clave = $Matches[1]

if ($clave.Length -lt 10) {
  Write-Error "La clave del sitio real tiene $($clave.Length) caracteres. Muy corta para un panel publico."
  exit 1
}

# --- Los tres cambios ---------------------------------------------------------
$texto = Get-Content $origen -Raw -Encoding UTF8
$antes = $texto

# 1) A quien le llegan los pedidos. 'prueba-local@ejemplo.com' no existe.
$texto = $texto -replace "'emails_equipo' => \['prueba-local@ejemplo\.com'\],",
                         "'emails_equipo' => ['atencionalcliente@vitalica.com.py'],"

# 2) Que los correos se manden de verdad, en vez de guardarse como archivos.
$texto = $texto -replace "'correos_a_archivo' => true,",
                         "'correos_a_archivo' => false,"

# 3) La clave del primer usuario del area interna.
#    Se reemplaza solo la que esta dentro de 'usuario_inicial'.
$texto = [regex]::Replace(
  $texto,
  "(?s)('usuario_inicial'\s*=>\s*\[.*?'clave'\s*=>\s*')[^']*(')",
  { param($m) $m.Groups[1].Value + $clave + $m.Groups[2].Value },
  1)

if ($texto -eq $antes) {
  Write-Error "No cambio nada. El config.php del proyecto no tiene el formato esperado."
  exit 1
}

New-Item -ItemType Directory (Split-Path $destino) -Force | Out-Null
# Sin BOM: un BOM antes de <?php lo escupe PHP como texto suelto y rompe las
# cabeceras de todo el sitio.
[System.IO.File]::WriteAllText($destino, $texto, (New-Object System.Text.UTF8Encoding $false))

# --- Verificar lo que quedó, sin mostrar la clave -----------------------------
$final = Get-Content $destino -Raw -Encoding UTF8
''
"config.php de produccion escrito en el paquete."
''
$comprobaciones = @(
  @{ n = "los pedidos van a atencionalcliente@vitalica.com.py"
     ok = $final -match "'emails_equipo' => \['atencionalcliente@vitalica\.com\.py'\]" },
  @{ n = "los correos se ENVIAN (no se guardan como archivo)"
     ok = $final -match "'correos_a_archivo' => false" },
  @{ n = "la clave del panel es la del sitio real, no la de pruebas"
     ok = $final.Contains("'clave'   => '$clave'") },
  @{ n = "no quedo ningun 'ejemplo.com'"
     ok = -not ($final -match 'ejemplo\.com') },
  @{ n = "Odoo sigue apagado (la clave del ERP no esta rotada)"
     ok = $final -match "'activo'     => false" },
  @{ n = "el archivo arranca con <?php y sin BOM"
     ok = $final.StartsWith('<?php') }
)
foreach ($c in $comprobaciones) {
  "  {0} {1}" -f $(if ($c.ok) { 'OK   ' } else { 'FALLA' }), $c.n
}

$fallas = @($comprobaciones | Where-Object { -not $_.ok }).Count
''
if ($fallas -gt 0) {
  "$fallas comprobacion(es) fallaron. NO subas este config."
  exit 1
}
'Listo. Este config.php se sube a public_html/api/ del sitio real.'
''
