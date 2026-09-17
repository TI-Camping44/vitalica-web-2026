# Precios y stock: cómo se actualizan solos

## El problema que esto resuelve

El sitio no le pregunta nada a Odoo cuando alguien entra. Lee un archivo,
`assets/js/precios.js`, que alguien tuvo que generar antes.

Hasta ahora ese archivo se generaba **a mano** desde una computadora y se subía
al hosting. Resultado: el 21/08/2026 el sitio mostraba stock del día anterior a
las 14:40. En esas 21 horas se habían vendido unidades de 5 variantes distintas
y la web seguía mostrando los números viejos.

Ahora hay una versión que corre **en el servidor**, sola, sin que nadie tenga
que acordarse.

---

## Las dos versiones

Hacen exactamente lo mismo. Se verificó comparando sus salidas: producen datos
idénticos.

| | `api/sync-precios.php` | `sync-odoo-precios.py` |
|---|---|---|
| Dónde corre | En el servidor (cPanel) | En tu computadora |
| Cuándo | Sola, por tarea programada | Cuando la corrés vos |
| Para qué sirve | Mantener el sitio al día | Probar, y el modo `--listar` |

**Las dos leen el mismo `odoo-mapeo.json`.** Ese archivo dice qué código de
barras de Odoo corresponde a cada producto del sitio. Está afuera de los dos
scripts a propósito: si cada uno tuviera su copia, al agregar un producto habría
que acordarse de tocar las dos, y el día que alguien toque una sola las
versiones quedan distintas sin que nadie se entere hasta que un precio sale mal.

**Para agregar un producto nuevo: editar `odoo-mapeo.json`.** Nada más.

---

## Programarlo en cPanel (una sola vez)

### 1. Cargar las credenciales de Odoo en el servidor

Editar `api/config.php`, sección `'odoo'`:

```php
'odoo' => [
  'activo'     => false,                      // esto es para los presupuestos, no toca el sync
  'url'        => 'https://camping44.odoo.com',
  'db'         => 'gcaceres93-camping-main-15845610',
  'usuario'    => 'facundocolman@camping44.com.py',
  'api_key'    => 'LA CLAVE NUEVA',
  'company_id' => 2,
  'pricelist'  => 'Público',
],
```

`'activo' => false` se puede dejar así: eso controla si se crean presupuestos
en Odoo al recibir un pedido, y no tiene nada que ver con el sync de precios.

Ese archivo no se puede descargar desde el navegador: `api/htaccess` lo bloquea.

> **Antes de esto, rotá la clave de Odoo.** La que está hoy en
> `odoo-credenciales.ini` es la que estuvo escrita dentro de un archivo que se
> subía al hosting, o sea que pudo quedar expuesta. En Odoo: tu nombre arriba a
> la derecha → Mi perfil → Seguridad de la cuenta → Claves API. Revocá la vieja
> y generá una nueva.

### 2. Crear la tarea

cPanel → **Trabajos cron** (*Cron Jobs*) → *Agregar nuevo trabajo cron*.

**Cada hora, en el minuto 5:**

```
5 * * * *
```

**Comando** (reemplazá `USUARIO` por tu usuario de cPanel, que aparece arriba a
la derecha):

```
/usr/local/bin/php /home/USUARIO/public_html/api/sync-precios.php >> /home/USUARIO/logs/sync-precios.log 2>&1
```

La ruta de PHP puede variar según el hosting. cPanel la muestra en
**Seleccionar versión de PHP**. Si `/usr/local/bin/php` no anda, probá
`/usr/bin/php` o la ruta que indique cPanel.

### 3. Comprobar que anduvo

Al rato, mirá `logs/sync-precios.log` desde el Administrador de archivos. Tiene
que decir algo así:

```
2026-08-21 15:21:36  Conectado a Odoo (uid 86).
2026-08-21 15:21:37  120 productos vendibles leídos.
2026-08-21 15:21:39  Lista "Público": 25 precios fijos.
2026-08-21 15:21:39  Listo: 10 productos, 25 variantes con stock
```

---

## ¿Cada cuánto conviene?

Cada hora está bien para empezar. Son 3 consultas a Odoo por corrida, o sea
72 por día: nada.

Si vendés mucho por WhatsApp y el stock se mueve rápido, se puede bajar a cada
15 minutos cambiando el `5 * * * *` por `*/15 * * * *`. No tiene sentido bajar
mucho más: el sitio igual no bloquea la compra cuando el stock llega a cero
(ver abajo).

---

## Qué pasa si el sync falla

- **No se rompe nada.** El archivo se escribe primero en un temporal y recién
  ahí se reemplaza. Si el proceso se corta a la mitad, el sitio se queda con el
  `precios.js` anterior —viejo pero entero— en lugar de con un archivo cortado
  que rompería toda la web.
- **Si Odoo no responde**, el script sale con error, lo anota en el log y no
  toca el archivo.
- **Si el sitio no encuentra dato de stock**, no muestra ningún cartel. Ni "hay
  stock" ni "no hay". Prefiere callarse antes que inventar.

---

## Lo que esto NO arregla

El sitio muestra "Sin stock" pero **igual deja agregar al carrito**. Está
comprobado: Redweiler Blueberry tiene 0 en Odoo, dice "Sin stock", y el botón
funciona igual.

Actualizar más seguido reduce la ventana, pero no resuelve el fondo. Hay que
decidir qué hacer cuando el stock es cero:

- **Bloquear la compra** — no te comprometés con algo que no tenés, pero perdés
  al cliente que igual quería encargarlo.
- **Permitir con aviso claro** — algo como *"Sin stock — te avisamos cuando
  llegue"*, y que el pedido entre marcado como pendiente. Como los pedidos se
  procesan por WhatsApp, esto puede funcionar bien.

Hoy no está ninguna de las dos: dice "Sin stock" y deja comprar sin advertencia,
que es la peor combinación posible.
