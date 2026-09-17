# Cómo poner en marcha el registro de pedidos

Guía para dejar funcionando el guardado de pedidos y los avisos por email, en el
hosting que Vitalica ya tiene. **No hace falta cambiar de plataforma ni contratar nada.**

Tiempo estimado: unos 30 minutos, la primera vez.

---

## Por qué esto se puede hacer hoy

El hosting de Vitalica es **cPanel con PHP 8.2** (se ve en el archivo `htaccess` del
proyecto). Eso significa que el servidor ya sabe ejecutar código: no es solo un lugar
donde dejar archivos. Con eso alcanza para guardar pedidos y mandar correos.

Lo único que **no** se resuelve así es el cobro con tarjeta. Eso necesita Bancard, alta
comercial y certificación, y va por otro camino.

---

## Qué vas a lograr

Hoy, cuando alguien completa el checkout, se abre WhatsApp con el pedido escrito. Si el
cliente no toca "enviar", **ese pedido se pierde y nadie se entera**.

Después de esto:

| | Antes | Después |
|---|---|---|
| El pedido queda registrado | ✗ | ✓ archivo en el servidor |
| El equipo se entera | solo si el cliente manda el WhatsApp | ✓ email automático |
| El cliente recibe copia | ✗ | ✓ si dejó su email |
| Número de pedido | ✓ | ✓ |
| Cobro con tarjeta | ✗ | ✗ (eso es Bancard, va aparte) |

WhatsApp sigue funcionando igual. Esto se suma, no reemplaza nada.

---

## ⚠️ Antes que nada: la clave de Odoo

Hasta ahora, `sync-odoo-precios.py` tenía **la clave de API de Odoo escrita adentro**. Ese
archivo está en la misma carpeta que se sube al servidor. Si se subía así, cualquiera
podía escribir `vitalica.com.py/sync-odoo-precios.py` en el navegador, descargarlo y
quedarse con acceso completo al ERP: precios, costos, clientes y stock.

Ya está corregido: ahora la clave se lee de un archivo aparte. Pero **la clave vieja hay
que darla de baja**, porque estuvo expuesta en un archivo que circuló.

**Hacé esto primero:**

1. Entrá a Odoo → tu nombre arriba a la derecha → **Mi perfil**
2. Pestaña **Seguridad de la cuenta** → **Claves API**
3. **Revocá** la clave actual y **generá una nueva**
4. En la carpeta del proyecto, copiá `odoo-credenciales.ejemplo.ini` como
   `odoo-credenciales.ini` y completalo con la clave nueva
5. **Nunca subas `odoo-credenciales.ini` al servidor**

Después de eso, `sync-odoo-precios.py` sigue funcionando igual que siempre.

---

## Paso 1 · Subir los archivos

En cPanel → **Administrador de archivos** → entrá a `public_html`.

Subí la carpeta **`api`** completa. Debe quedar así:

```
public_html/
├── index.html
├── assets/
└── api/
    ├── pedido.php
    ├── odoo.php
    ├── prueba.php
    ├── config.ejemplo.php
    └── htaccess        ← hay que renombrarlo (paso 2)
```

**No subas** estos, son de trabajo interno:

```
sync-odoo-precios.py      odoo-credenciales.ini
servidor-local.ps1        README.md
INSTALAR-BACKEND.md       HANDOFF-IT.md
_respaldo-*/              _descartado/
```

> Si alguno se sube por error no es una catástrofe: el `.htaccess` los bloquea. Pero lo
> correcto es que no estén.

---

## Paso 2 · Renombrar los dos `htaccess`

Windows oculta los archivos que empiezan con punto, así que en el proyecto están
guardados sin él. **En el servidor tienen que tener el punto.**

En el Administrador de archivos de cPanel, click derecho → Cambiar nombre:

| Archivo subido | Renombrar a |
|---|---|
| `public_html/htaccess` | `.htaccess` |
| `public_html/api/htaccess` | `.htaccess` |

> Si no ves los archivos que empiezan con punto: arriba a la derecha en el Administrador
> de archivos → **Configuración** → tildá *Mostrar archivos ocultos*.

Estos archivos hacen dos cosas: bloquean el acceso web a la configuración y a los pedidos
guardados, y activan la compresión y el caché (el sitio carga más rápido).

---

## Paso 3 · Configurar

En `public_html/api/`, copiá `config.ejemplo.php` y llamá a la copia **`config.php`**.
Editalo y completá:

```php
'emails_equipo' => ['pedidos@vitalica.com.py'],   // ¿a quién le avisa?
'email_desde'   => 'no-responder@vitalica.com.py',
```

**El remitente tiene que ser del dominio propio.** Si ponés un `@gmail.com`, Gmail y
Outlook mandan los correos a spam. Si esa casilla no existe, creala en cPanel →
**Cuentas de correo**.

### Dónde se guardan los pedidos

Por defecto se guardan en `api/almacen/`, que el `.htaccess` bloquea. Funciona, pero es
más seguro guardarlos **fuera** de la carpeta web. Para eso, en `config.php`:

```php
'carpeta_pedidos' => '/home/TU_USUARIO/pedidos-vitalica',
```

Tu usuario aparece arriba a la derecha en cPanel. Creá esa carpeta un nivel arriba de
`public_html`.

---

## Paso 4 · Probar

Abrí en el navegador:

```
https://vitalica.com.py/api/prueba.php
```

Es una pantalla de diagnóstico: revisa una por una las cosas que tienen que funcionar
—versión de PHP, permisos de escritura, correo, remitente— y **si algo falla te dice qué
hacer**. Seguí lo que indique hasta que esté todo en verde.

Después hacé un pedido de prueba en el sitio y verificá que:

1. Te llegue el email al equipo
2. Aparezca el archivo `pedidos-2026-08.jsonl` en la carpeta de pedidos

**Cuando termines, borrá `api/prueba.php`.** Mientras esté, muestra información de tu
servidor a cualquiera que sepa la dirección.

---

## El panel de pedidos

Para que logística y ventas puedan trabajar los pedidos sin pedirle nada a nadie:

```
https://vitalica.com.py/api/panel.php
```

Qué permite hacer:

- **Ver todos los pedidos**, del más nuevo al más viejo, con su total
- **Filtrar por estado**: Nuevo · Contactado · Confirmado · Preparando · Enviado · Entregado · Cancelado
- **Buscar** por número de pedido, nombre o teléfono
- **Abrir cada pedido** y ver el detalle completo: productos con sabor y presentación, código de
  barras de cada variante, dirección o local de retiro, y forma de pago elegida
- **Escribirle al cliente por WhatsApp** desde un botón, con el número de pedido ya en el mensaje
- **Cambiar el estado**, **asignar un responsable** y dejar una **nota interna**

Los responsables que aparecen en la lista se cargan en `config.php`:

```php
'responsables' => ['Sin asignar', 'Logística', 'Ventas', 'Juan', 'María'],
```

### Cómo guarda los cambios

El archivo de pedidos (`pedidos-AAAA-MM.jsonl`) **no se toca nunca más** después de escribirse: es
el registro de lo que pidió el cliente y tiene que quedar tal cual entró. Los estados, responsables y
notas van a un archivo aparte, `estados.json`.

Si algo se rompiera editando estados, el pedido original sigue intacto.

### ⚠️ Protegé el panel con dos capas

El panel muestra **nombre, teléfono y dirección de tus clientes**. Quien entre ahí ve dónde vive tu
clientela. Usá las dos protecciones:

**1. La contraseña del panel.** En `config.php`:

```php
'panel' => [ 'clave' => 'poné-acá-una-clave-larga' ],
```

Al menos 10 caracteres y que no uses en ningún otro lado. Si queda vacía, el panel no abre.

**2. Privacidad de directorios de cPanel.** Esta es la protección fuerte, y son dos clics:

1. cPanel → **Privacidad de directorios** (o *Directory Privacy*)
2. Entrá a `public_html` y buscá la carpeta **`api`**
3. Tildá *Proteger este directorio con contraseña*, ponele un nombre
4. Creá un usuario con su contraseña

Con eso, el navegador pide usuario y contraseña **antes** de que el archivo siquiera se ejecute. Es
la diferencia entre una puerta con llave y una puerta con cartel.

> Si activás esta segunda capa, `api/pedido.php` deja de recibir los pedidos de la web, porque el
> servidor le pide contraseña también. Para evitarlo, protegé solamente `panel.php` en vez de toda
> la carpeta, o pedile a tu proveedor de hosting que excluya `pedido.php` de la protección.

---

## Cómo leer los pedidos sin el panel

Se guardan en archivos `pedidos-AAAA-MM.jsonl`, uno por mes. Cada línea es un pedido
completo. Se abren con cualquier editor de texto.

Se eligió este formato en vez de una base de datos porque no hay que instalar nada, se lee
a ojo y se puede pasar a Excel cuando haga falta.

---

## Lo de Odoo: por qué viene apagado

En `config.php` hay una sección `odoo` con `'activo' => false`. Si se prende, cada pedido
crea un **presupuesto** (no una venta confirmada) en Odoo.

**Está apagado a propósito, y conviene dejarlo así por ahora.**

El motivo: el carrito de la web no pregunta **sabor ni tamaño**. En Odoo, cada sabor y
cada tamaño es un producto distinto — el Whey tiene nueve variantes. Si se prende hoy, se
crean presupuestos sin saber cuál quiere el cliente, y alguien tiene que corregirlos a
mano igual. Sería más trabajo, no menos.

**Para poder prenderlo hay que hacer una de estas dos cosas:**

- **a)** Que el sitio pida sabor y tamaño antes de agregar al carrito. Es el camino
  correcto, y además mejora la experiencia de compra. Requiere desarrollo en el front.
- **b)** Aceptar que el presupuesto se cree con una variante por defecto y que un vendedor
  la ajuste al hablar con el cliente. Más rápido, pero deja datos provisorios en el ERP.

El código ya está escrito y probado en su lógica (`api/odoo.php`). Cuando se decida el
camino, se prende con un `true`.

---

## Lo que sigue después

| Qué | Requiere |
|---|---|
| Sabor y tamaño en el carrito | Desarrollo front + ajuste del mapeo de Odoo |
| Presupuestos automáticos en Odoo | Lo anterior, después `'activo' => true` |
| Cobro con tarjeta | Bancard: alta comercial, sandbox, certificación |
| Panel para ver pedidos en la web | Desarrollo, cuando el volumen lo justifique |

---

## Si algo no funciona

**Los correos no llegan.** Fijate en spam. Si están ahí, el problema es el remitente:
tiene que ser del dominio propio y conviene configurar SPF y DKIM en cPanel → *Email
Deliverability*.

**"sin_configurar" al hacer un pedido.** Falta `config.php`, o quedó con el nombre
`config.ejemplo.php`.

**Los pedidos no se guardan.** Permisos de la carpeta. `prueba.php` te lo dice y te
indica el valor correcto.

**Nada parece pasar, pero WhatsApp funciona.** Eso es lo esperado si el backend no está
instalado: el sitio está hecho para que **nunca** se caiga una venta por un problema del
servidor. Revisá `prueba.php` para ver qué falta.
