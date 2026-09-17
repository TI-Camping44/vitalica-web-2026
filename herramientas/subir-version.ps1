<#
  Sube de golpe el numero de version de todos los archivos que carga el sitio
  (?v=N en los <link> y <script> de los HTML).

      powershell -ExecutionPolicy Bypass -File herramientas/subir-version.ps1

  POR QUE HACE FALTA
  ------------------
  El navegador guarda en cache los .js y .css y no vuelve a pedirlos si la
  direccion no cambio. Editar data.js no cambia la direccion: sigue siendo
  data.js?v=3. Resultado: uno edita, recarga y no ve NADA nuevo, ni en la
  compu de uno ni en la de marketing.

  Paso de verdad: los sabores nuevos no aparecian hasta hacer Ctrl+F5.

  Correr esto despues de cada tanda de cambios y antes de armar el paquete
  para pruebas. Un solo numero para todos: no hace falta acordarse de cual
  archivo se toco.
#>

$raiz = Split-Path -Parent $PSScriptRoot
$paginas = Get-ChildItem $raiz -Filter *.html -File

# Se busca el numero mas alto que haya hoy y se suma uno.
$maximo = 0
foreach ($p in $paginas) {
  foreach ($m in [regex]::Matches([System.IO.File]::ReadAllText($p.FullName), '\?v=(\d+)')) {
    $n = [int]$m.Groups[1].Value
    if ($n -gt $maximo) { $maximo = $n }
  }
}
$nueva = $maximo + 1

$tocados = 0
foreach ($p in $paginas) {
  $texto = [System.IO.File]::ReadAllText($p.FullName)
  $nuevo = [regex]::Replace($texto, '\?v=\d+', "?v=$nueva")
  if ($nuevo -ne $texto) {
    # Sin BOM: los HTML del proyecto no lo tienen y agregarlo ensucia el diff.
    [System.IO.File]::WriteAllText($p.FullName, $nuevo, (New-Object System.Text.UTF8Encoding $false))
    $tocados++
  }
}

"Version $maximo -> $nueva   ($tocados archivos)"
