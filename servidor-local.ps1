# Servidor web local para previsualizar la maqueta.
# Uso:  powershell -ExecutionPolicy Bypass -File servidor-local.ps1
# Luego abrir http://localhost:4321  ·  Ctrl+C para cortar.
#
# Existe porque en esta compu no hay Python ni Node, y abrir el sitio con
# doble clic (file://) no reproduce del todo cómo se comporta en la web real.

# -SubCarpeta sirve para probar el paquete de _subir-a-pruebas antes de
# subirlo, en vez de servir el proyecto entero.
#
# Se llama así y no -Raiz porque PowerShell NO distingue mayúsculas: $Raiz y
# $raiz serían la misma variable, el parámetro pisaría la ruta del script y
# quedaría una ruta duplicada e inválida.
param([int]$Puerto = 4321, [string]$SubCarpeta = '')

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($SubCarpeta -ne '') { $raiz = Join-Path $raiz $SubCarpeta }
$tipos = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='application/javascript; charset=utf-8'; '.json'='application/json'
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'
  '.webp'='image/webp'; '.svg'='image/svg+xml'; '.ico'='image/x-icon'
  '.otf'='font/otf'; '.ttf'='font/ttf'; '.woff2'='font/woff2'
  '.pdf'='application/pdf'; '.txt'='text/plain; charset=utf-8'
}

$oyente = New-Object System.Net.HttpListener
$oyente.Prefixes.Add("http://localhost:$Puerto/")
$oyente.Start()
Write-Host "Sirviendo $raiz"
Write-Host "  -> http://localhost:$Puerto     (Ctrl+C para cortar)"

try {
  while ($oyente.IsListening) {
    $ctx = $oyente.GetContext()

    # Todo el manejo del pedido va dentro de un try: si el navegador corta la
    # descarga a mitad (pasa siempre que navegás a otra página mientras aún
    # cargan imágenes), el Write tira excepción. Sin este try se caía el
    # servidor entero por una sola conexión abortada.
    try {
      $ruta = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      if ($ruta -eq '/') { $ruta = '/index.html' }
      $archivo = Join-Path $raiz ($ruta -replace '^/','' -replace '/','\')

      # No servir nada fuera de la carpeta del proyecto.
      $completo = [System.IO.Path]::GetFullPath($archivo)
      if (-not $completo.StartsWith([System.IO.Path]::GetFullPath($raiz))) {
        $ctx.Response.StatusCode = 403
      } elseif (Test-Path $completo -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($completo).ToLower()
        $ctx.Response.ContentType = $(if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' })
        # Sin caché: esto es un servidor de trabajo y los archivos cambian todo
        # el tiempo. Una vez el navegador se guardó una imagen que había quedado
        # en 0 bytes por un script a medio arreglar, y siguió mostrándola rota
        # aunque el archivo ya estuviera bien.
        $ctx.Response.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate')
        $ctx.Response.Headers.Add('Pragma', 'no-cache')
        $bytes = [System.IO.File]::ReadAllBytes($completo)
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "200 $ruta"
      } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - no existe: $ruta")
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
        Write-Host "404 $ruta"
      }
    } catch {
      # Conexión cortada por el cliente: se ignora y se sigue atendiendo.
      Write-Host "-- cortado: $($_.Exception.Message.Split([char]10)[0])"
    } finally {
      try { $ctx.Response.Close() } catch { }
    }
  }
} finally {
  $oyente.Stop()
  $oyente.Close()
}
