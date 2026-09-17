# Subir a un entorno de pruebas (sin tocar el sitio real)

Guía para tener **dos sitios a la vez**: el que ven los clientes y uno de pruebas donde podés
romper cosas sin consecuencias.

---

## Por qué hace falta

Probar en tu computadora está bien, pero hay cosas que **solo se ven en un servidor real**:

- Si los correos llegan o caen en spam
- Si el hosting tiene los permisos correctos
- Cómo se ve desde el celular de otra persona, con datos móviles
- Si Odoo responde desde el servidor y no desde tu red

Y hay algo que **nunca** hay que hacer: probar eso en el sitio que están usando los clientes.

---

## La regla de oro

> **El entorno de pruebas no puede tocar nada real.**
>
> Ni mandar correos a clientes de verdad, ni crear presupuestos en el Odoo de producción, ni
> aparecer en Google. Si el de pruebas puede hacer daño, dejó de ser de pruebas.

---

## Opción recomendada · Subdominio

Queda en `pruebas.vitalica.com.py`, en una carpeta **separada** de la del sitio real. Es la
opción más limpia: los dos sitios no se tocan entre sí.

### 1 · Crear el subdominio

1. cPanel → **Subdominios** (o *Domains* → *Create A Domain*)
2. Subdominio: `pruebas`
3. Dominio: `vitalica.com.py`
4. Raíz del documento: cPanel propone `public_html/pruebas` — **cambialo** a:

```
/home/TU_USUARIO/pruebas
```

> Ese cambio importa. Si la carpeta queda **dentro** de `public_html`, el sitio de pruebas
> también es alcanzable desde `vitalica.com.py/pruebas/`, y los `.htaccess` del sitio real le
> caen encima. Afuera, son dos cosas independientes.

5. Crear. cPanel arma la carpeta y el DNS solo.

### 2 · Subir los archivos

Los mismos que subirías al sitio real (ver `PROBAR-TODO.md`, parte B), pero a
`/home/TU_USUARIO/pruebas` en vez de `public_html`.

Acordate de renombrar los dos `htaccess` a `.htaccess`.

### 3 · Configurar el de pruebas en modo seguro

En `pruebas/api/config.php`:

```php
// Los correos NO salen: se guardan como archivo y los abrís desde el panel
'correos_a_archivo' => true,

// Que nunca le llegue nada a un cliente real, ni por accidente
'emails_equipo'  => ['tu-email@vitalica.com.py'],
'avisar_cliente' => false,

// Odoo APAGADO: no queremos presupuestos de prueba en el ERP real
'odoo' => [ 'activo' => false ],

// Los pedidos de prueba, en su propia carpeta
'carpeta_pedidos' => '/home/TU_USUARIO/pedidos-PRUEBAS',

// Contraseña distinta a la del panel real
'panel' => [ 'clave' => 'otra-clave-distinta' ],

// El origen ahora es el subdominio
'origenes_permitidos' => ['https://pruebas.vitalica.com.py'],
```

> **`'avisar_cliente' => false` es la línea que más importa.** Sin eso, si alguien prueba un
> pedido con el email de un cliente real, ese cliente recibe una confirmación de algo que
> nunca compró.

### 4 · Que Google no lo encuentre

Reemplazá el `robots.txt` del entorno de pruebas por esto:

```
User-agent: *
Disallow: /
```

Y borrá `sitemap.xml` de ahí.

> Si el sitio de pruebas se indexa, Google muestra dos versiones del mismo contenido y las dos
> pierden posición. Peor: alguien puede llegar a la de pruebas buscando "vitalica proteína" y
> hacer un pedido que nadie va a atender.

### 5 · Ponerle contraseña a todo el subdominio

1. cPanel → **Privacidad de directorios**
2. Buscá la carpeta `pruebas`
3. Protegela con usuario y contraseña

Así solo entra quien tenga la clave, y no hay riesgo de que un cliente caiga ahí.

---

## Cómo queda todo

| | Sitio real | Pruebas |
|---|---|---|
| Dirección | `vitalica.com.py` | `pruebas.vitalica.com.py` |
| Carpeta | `public_html` | `/home/USUARIO/pruebas` |
| Pedidos | `/home/USUARIO/pedidos-vitalica` | `/home/USUARIO/pedidos-PRUEBAS` |
| Correos | Se envían de verdad | Se guardan como archivo |
| Odoo | Activo | Apagado |
| Google | Indexado | Bloqueado |
| Acceso | Público | Con contraseña |

---

## El circuito de trabajo

```
   Tu compu          →   Pruebas              →   Sitio real
   php -S localhost      pruebas.vitalica...      vitalica.com.py
   ─────────────         ─────────────────        ──────────────
   Cambios rápidos       Probar de verdad         Solo lo aprobado
   Rompé lo que sea      Correos, permisos        Nada sin probar
```

**Nunca edites archivos directamente en el sitio real.** Todo cambio pasa primero por pruebas.

---

## Cómo pasar de pruebas a producción

Cuando algo funciona bien en pruebas:

1. Subí **solo los archivos que cambiaron** a `public_html`
2. **No copies `api/config.php`** — cada entorno tiene el suyo, y el de pruebas tiene los
   correos apagados y Odoo desactivado. Copiarlo dejaría el sitio real sin enviar nada.
3. Si tocaste `assets/css/styles.css` o algún `.js`, subí el número de versión en los `?v=` de
   las páginas HTML. Si no, los visitantes que ya entraron siguen viendo la versión vieja
   guardada en su navegador.

### Alternativa más simple: subfolder

Si crear un subdominio te complica, `vitalica.com.py/pruebas/` también sirve. Es menos
prolijo —comparte configuración del servidor con el sitio real— pero funciona. Las mismas
precauciones aplican: robots bloqueado, contraseña, correos apagados y Odoo desactivado.

---

## Qué revisar en pruebas antes de pasar a producción

- [ ] `api/prueba.php` todo en verde
- [ ] Hacer un pedido completo y que aparezca en el panel
- [ ] Abrir el correo generado y revisar que se vea bien
- [ ] Descargar el comprobante en PDF
- [ ] Probar desde un **celular real**, con datos móviles
- [ ] Elegir sabor y presentación, y que el precio cambie
- [ ] Probar retiro y envío, y que los medios de pago se filtren
- [ ] Borrar `api/prueba.php` antes de replicar a producción
