# Probar todo el sistema — paso a paso

Guía para dejar funcionando **todo** —pedidos, correos, panel y Odoo— primero en tu
computadora y después en el hosting.

**Probá siempre primero en tu compu.** Es la diferencia entre descubrir un problema vos, o
descubrirlo cuando un cliente real no recibe su pedido.

---

## Qué vas a poder probar en tu compu

| | Local | Hosting |
|---|---|---|
| El sitio completo | ✅ | ✅ |
| Hacer un pedido y que se guarde | ✅ | ✅ |
| El correo de confirmación (ver cómo queda) | ✅ como archivo | ✅ enviado de verdad |
| Panel de pedidos | ✅ | ✅ |
| Presupuesto automático en Odoo | ✅ | ✅ |
| Envío real de correos | ❌ Windows no tiene servidor de correo | ✅ |

Lo único que no se puede probar localmente es el **envío** del correo. Sí se puede ver
exactamente cómo queda: se guarda como archivo y lo abrís con doble clic.

---

# PARTE A · Probar en tu computadora

## A1 · Instalar PHP

Tu hosting usa **PHP 8.2**. Instalamos la misma versión, para que lo que funcione acá
funcione allá.

Abrí PowerShell y pegá:

```powershell
winget install -e --id PHP.PHP.8.2
```

Cerrá PowerShell y abrí una ventana **nueva** (para que tome el PATH). Comprobá:

```powershell
php --version
```

Tiene que responder `PHP 8.2.x`. Si dice que no reconoce el comando, reiniciá la sesión de
Windows y volvé a probar.

### Activar las extensiones que hacen falta

PHP viene con casi todo apagado. Buscá el archivo `php.ini` (lo dice `php --ini`) y
destildá —sacándole el `;` del principio— estas dos líneas:

```ini
extension=curl
extension=openssl
```

`curl` solo hace falta para conectar con Odoo. Sin él, todo lo demás funciona igual.

---

## A2 · Levantar el sitio con PHP

Desde la carpeta del proyecto:

```powershell
php -S localhost:4321
```

Abrí `http://localhost:4321`. Se corta con Ctrl+C.

> **Este reemplaza a `servidor-local.ps1` para probar.** Aquel sirve archivos pero no
> ejecuta PHP, así que el registro de pedidos y el panel no funcionarían.

---

## A3 · Configurar

Copiá `api/config.ejemplo.php` y llamá a la copia **`api/config.php`**. Abrila y cambiá
solo estas líneas para la prueba local:

```php
'emails_equipo'      => ['tu-email-personal@gmail.com'],  // para la prueba, el tuyo
'correos_a_archivo'  => true,                             // ← IMPORTANTE en local
'panel' => [
  'clave' => 'unaclavelargaparaprobar',
],
```

Dejá `'odoo' => ['activo' => false]` por ahora. Lo prendemos en el paso A6.

> `correos_a_archivo => true` hace que los correos se guarden como archivos `.html` en
> `api/almacen/` en vez de enviarse. **En el hosting tiene que quedar en `false`.**

---

## A4 · Verificar la instalación

Abrí:

```
http://localhost:4321/api/prueba.php
```

Te muestra una lista con todo lo que tiene que funcionar y, si algo falla, **qué hacer**.
Seguí lo que indique hasta tener todo en verde.

Es esperable que **"Función de correo"** aparezca en rojo en local: Windows no tiene
servidor de correo. No importa, porque estamos guardando los correos como archivo.

---

## A5 · Hacer un pedido de prueba

1. Entrá a `http://localhost:4321`
2. Elegí un producto, **elegí sabor y presentación**, agregalo al carrito
3. Agregá otro con **distinto sabor** — tiene que aparecer como una línea separada
4. Completá el checkout con datos inventados, **poné un email**
5. Enviar pedido

Ahora verificá las tres cosas:

**El pedido se guardó.** En `api/almacen/` tiene que haber un archivo
`pedidos-2026-08.jsonl`. Abrilo con el Bloc de notas: cada línea es un pedido completo.

**El correo se generó.** En la misma carpeta va a haber un `correo-...html`. Doble clic y
se abre en el navegador: así lo va a ver el cliente.

**El panel funciona.** Entrá a:

```
http://localhost:4321/api/panel.php
```

Poné la clave que cargaste. Tenés que ver tu pedido de prueba. Probá cambiarle el estado,
asignarle un responsable y dejar una nota; después recargá y confirmá que se guardó.

---

## A6 · Probar la conexión con Odoo (opcional)

En `api/config.php`:

```php
'odoo' => [
  'activo'  => true,
  'url'     => 'https://camping44.odoo.com',
  'db'      => 'gcaceres93-camping-main-15845610',
  'usuario' => 'facundocolman@camping44.com.py',
  'api_key' => 'la-misma-que-está-en-odoo-credenciales.ini',
],
```

Volvé a abrir `api/prueba.php`: tiene que decir **"Conexión con Odoo: Conectado"**.

Hacé otro pedido de prueba y fijate en Odoo → **Ventas → Presupuestos**. Tiene que
aparecer uno nuevo, con el número de pedido de la web en el campo *Origen*.

> Se crea como **presupuesto**, no como venta confirmada. La confirmación la hace una
> persona después de hablar con el cliente. La web no sabe si hay stock de ese sabor ni si
> el cliente va a pagar.

**Borrá los presupuestos de prueba de Odoo cuando termines.**

---

# PARTE B · Subir al hosting

Recién cuando la Parte A esté funcionando.

## B1 · Qué subir

En cPanel → **Administrador de archivos** → `public_html`:

| Subir | No subir |
|---|---|
| Todos los `.html` | `sync-odoo-precios.py` |
| `robots.txt`, `sitemap.xml` | `odoo-credenciales.ini` |
| La carpeta `assets/` completa | `servidor-local.ps1` |
| La carpeta `api/` completa | `*.md` (las guías) |
| `htaccess` (se renombra) | `_respaldo-*/` y `_descartado/` |
| | `api/config.php` (se crea allá) |

> Si algo se sube por error no es una catástrofe: el `.htaccess` lo bloquea. Pero lo
> correcto es que no esté.

## B2 · Renombrar los htaccess

Windows oculta los archivos que empiezan con punto, por eso están guardados sin él.
**En el servidor tienen que tener el punto.** Click derecho → Cambiar nombre:

| Archivo | Renombrar a |
|---|---|
| `public_html/htaccess` | `.htaccess` |
| `public_html/api/htaccess` | `.htaccess` |

> Si no los ves: Administrador de archivos → **Configuración** → tildá *Mostrar archivos
> ocultos*.

## B3 · Configurar en el servidor

Copiá `api/config.ejemplo.php` como `api/config.php` y ajustá:

```php
'emails_equipo'      => ['pedidos@vitalica.com.py'],   // a quién le avisa
'email_desde'        => 'atencionalcliente@vitalica.com.py',
'correos_a_archivo'  => false,                          // ← AHORA SÍ en false
'carpeta_pedidos'    => '/home/TU_USUARIO/pedidos-vitalica',
'panel' => [ 'clave' => 'una-clave-larga-distinta-a-la-de-prueba' ],
```

Tu usuario aparece arriba a la derecha en cPanel. Creá esa carpeta **un nivel arriba** de
`public_html`, para que los pedidos ni siquiera tengan una dirección web.

## B4 · Verificar

```
https://vitalica.com.py/api/prueba.php
```

Todo en verde. Hacé un pedido de prueba real y confirmá que llega el correo.

**Después borrá `api/prueba.php`.** Mientras esté, muestra información de tu servidor a
cualquiera que sepa la dirección.

## B5 · Proteger el panel

El panel muestra **teléfonos y direcciones de tus clientes**. Además de la contraseña:

1. cPanel → **Privacidad de directorios**
2. Entrá a `public_html/api` y protegé **solo el archivo `panel.php`**
3. Creá un usuario con contraseña

> ⚠️ **No protejas la carpeta `/api` entera.** Si lo hacés, `pedido.php` también queda
> detrás de la contraseña y la web deja de poder registrar pedidos.

## B6 · Que los precios se actualicen solos

cPanel → **Cron Jobs** → una vez por día:

```
0 6 * * *  cd /home/TU_USUARIO/sync && /usr/bin/python3 sync-odoo-precios.py
```

Subí `sync-odoo-precios.py` y `odoo-credenciales.ini` a esa carpeta `sync`, **fuera de
`public_html`**. Antes comprobá que el servidor tenga Python: cPanel → Terminal →
`python3 --version`.

Con eso, cambiás un precio en Odoo y al día siguiente está en la web.

---

# Checklist final

- [ ] PHP 8.2 instalado y `php --version` responde
- [ ] `php -S localhost:4321` levanta el sitio
- [ ] `api/config.php` creado con `correos_a_archivo => true`
- [ ] `api/prueba.php` todo en verde (menos correo, esperable en local)
- [ ] Pedido de prueba guardado en `pedidos-2026-08.jsonl`
- [ ] Correo de confirmación generado y revisado
- [ ] Panel abre y guarda estados
- [ ] Odoo conecta y crea el presupuesto
- [ ] **Rotar la clave de API de Odoo** (la actual estuvo expuesta)
- [ ] Todo subido al hosting y los dos `.htaccess` renombrados
- [ ] `correos_a_archivo => false` en el servidor
- [ ] `api/prueba.php` borrado del servidor
- [ ] `panel.php` protegido con Privacidad de directorios
- [ ] Cron del sync configurado

---

# Si algo no funciona

**`php` no se reconoce.** Cerraste y abriste PowerShell de nuevo. Si sigue, reiniciá
Windows.

**"sin_configurar" al hacer un pedido.** Falta `api/config.php`, o quedó con el nombre
`config.ejemplo.php`.

**Los pedidos no se guardan.** Permisos de la carpeta. `prueba.php` te dice el valor
correcto.

**El panel dice que no tiene contraseña.** Falta `'panel' => ['clave' => '...']` en
`config.php`.

**Odoo no conecta.** Revisá que `curl` esté activado en `php.ini`, y que la `api_key` sea
la vigente (no una revocada).

**Los correos llegan a spam.** El remitente tiene que ser del dominio propio, y conviene
configurar SPF y DKIM en cPanel → *Email Deliverability*.

**Nada parece pasar, pero WhatsApp funciona.** Eso es lo esperado si el backend no está
instalado. El sitio está hecho para que **nunca** se caiga una venta por un problema del
servidor.
