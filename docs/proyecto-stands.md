# Proyecto Stands Vitálica — contexto para el trabajo en la web

> Guardar en el repo como `docs/proyecto-stands.md` y leerlo antes de tocar código.
> Última actualización: 7 de octubre de 2026.

## Qué es esto

Vitálica (compañía 2 en Odoo) pone stands con productos Olimp en gimnasios.
El socio del gym escanea un QR pegado en el stand, entra a un apartado de la web de
Vitálica, se identifica, elige productos, paga con Bancard y retira en recepción.
Odoo descuenta el stock de ese gimnasio y emite la factura electrónica.

Nadie de Vitálica carga nada a mano. El recepcionista del gym solo entrega el producto
cuando le llega el aviso.

## Reparto de responsabilidades

| Parte | Dónde vive | Estado |
| --- | --- | --- |
| Página del stand, cuenta del socio, carrito | Web de Vitálica, carpeta `api` en PHP | **a construir** |
| Crear el pedido en Odoo | n8n (ya construido) o PHP, a decidir | hecho en n8n |
| Pago con Bancard | iframe en la web + webhook en n8n | pendiente de habilitación |
| Confirmar pedido, entrega, factura, avisos | n8n | hecho y probado |

Regla: lo que el socio ve y usa va en PHP. Lo que pasa después del pago va en n8n,
porque ahí están los reintentos, las alertas y la conciliación.

## Endpoints a construir en `api`

### `stand.php` — abrir el stand

Entrada: el cupón que viene en el QR, por ejemplo `?c=RMLAM2026`.

Devuelve: nombre del gimnasio, si está abierto según su horario, y el catálogo con
producto, presentación, precio y disponible.

Reglas:
- Si el cupón no existe o está inactivo, no devuelve catálogo.
- Fuera del horario del gym, devuelve el catálogo pero marcado como cerrado.
- Solo productos con disponible mayor a cero en el almacén de ese gym.
- El disponible es cantidad menos reservado.

### `cuenta.php` — identificar al socio

Ingreso por código al WhatsApp, sin contraseña:

1. El socio escribe su número. Se genera un código de 6 dígitos con vencimiento corto.
2. Confirma el código y queda con sesión.
3. Si es su primera compra, pide nombre, documento y correo, y se crea el contacto en Odoo.
4. Si ya existe, se reutiliza el contacto.

El documento se pide **completo, con guion y dígito verificador**: `4567890-1`.
También hay que ofrecer comprar sin factura a su nombre, que usa el contacto innominado.

### `pedido.php` — crear el pedido

Entrada: cupón, sesión del socio y carrito.

Hace: vuelve a verificar stock, crea el pedido en borrador en Odoo y devuelve el
id numérico del pedido y el monto. Ese id es el `shop_process_id` de Bancard.

Si no hay stock, cancela y avisa, sin llamar a Bancard.

## Tabla de stands

Un registro por stand, con: cupón, id de almacén, id de gimnasio, nombre visible,
dirección, ciudad, horario de apertura y número de WhatsApp del recepcionista.

Ejemplo del stand de prueba:

| Campo | Valor |
| --- | --- |
| almacén | 18 (Gimnasio RM - Lambaré) |
| ubicación de stock | 5328 |
| gimnasio (`x_gimnasios`) | 10 (Rrmproperformance lambare) |
| ciudad | 4787 (LAMBARE) |

## Datos de Odoo ya verificados

Conexión por JSON-RPC a `/jsonrpc`. Odoo devuelve HTTP 200 aunque falle: **hay que
revisar `body.error` siempre**, no el código HTTP.

- Compañía Vitálica: **2**. Mandar siempre `context.allowed_company_ids = [2]`.
- Lista de precios Público (PYG): **54**. El precio unitario **ya incluye IVA**.
- Equipo de ventas Gimnasios: **37**.
- País Paraguay: **185**.
- Contacto innominado SIN NOMBRE: **1914** (RUC 44444401, dv 7, tipo de identificación 5).
- Tipos de identificación: 1 = RUC, 2 = CI, 5 = Sin nombre.

### Cómo se carga un contacto que pueda facturar

Los contactos reales tienen el documento repartido en cuatro campos:

| Campo | Valor para `4567890-1` |
| --- | --- |
| `ruc` | `4567890` |
| `dv` | `1` |
| `rucdv` | `4567890-1` |
| `vat` | `4567890-1` |
| `tipo_identificacion` | 1 |
| `situacion` | `CONTRIBUYENTE` |
| `naturaleza_receptor` | `1` |
| `tipo_operacion` | `2` |

Además son obligatorios para facturar: `street`, `reference_geo_id` (ciudad) y
`country_id`. Se cargan con la dirección del gimnasio, no se le piden al socio.

Y hay una automatización de Odoo que **exige `x_studio_gimnasio` en todo contacto de
Vitálica**: si falta, el alta falla.

### Pedido

Campos al crear: `partner_id`, `warehouse_id`, `pricelist_id` 54, `team_id` 37,
`user_id`, `company_id` 2, `picking_policy` `direct`, `x_studio_venta_de_gimnasio` en
verdadero, `origin` con el nombre del stand y `order_line`.

El pedido queda en borrador y **no tiene validación de crédito**, así que se puede
confirmar automático.

## Lo que ya funciona en n8n

Tres flujos probados contra la base de pruebas:

1. **Catálogo del gym**: stock, lotes y precios por almacén.
2. **Crear pedido**: contacto, verificación de stock y pedido en borrador.
3. **Procesar la venta**: verifica el pago, confirma el pedido, reserva con lote,
   valida la entrega (descuenta stock), crea la factura y alerta si no se publica.

Probado de punta a punta: pedido S00962, entrega RMLAM/OUT/00006 validada, lotes
asignados solos, factura por 860.000 Gs generada.

## Bancard, lo que importa para la web

- El pago se hace con un iframe embebido: se incluye `bancard-checkout.js` y se levanta
  con el identificador de proceso que devuelve el servidor. Los datos de tarjeta nunca
  pasan por la web de Vitálica.
- El identificador de compra es **numérico**, hasta 15 dígitos: el id del pedido de Odoo.
- El monto va como texto con dos decimales y punto, también en guaraníes.
- La descripción admite 20 caracteres.
- La confirmación la manda Bancard a un webhook de n8n, que **debe responder 200 en
  menos de 30 segundos**.
- Comisión: 3% en crédito, 2% en débito y Zimple, más IVA sobre la comisión.
- Todavía no está habilitado: el trámite del vPOS está pendiente.

## Bloqueantes conocidos

- **La factura no se puede publicar en la base de pruebas.** Falla al armar el CDC con
  `local variable 'cdc_suc' referenced before assignment`. Pasa también con una factura
  creada a mano, así que es de esa base, no del flujo. Pendiente de consultar al proveedor.
- Falta el punto de expedición de stands, ya pedido a Contabilidad.
- FEFO no está activo en la ubicación del stand.
- No existe el diario de cobro para vPOS.

## Reglas que no se negocian

- Ninguna credencial de Odoo o Bancard en el navegador del cliente. Todo por el servidor.
- El pedido se crea **antes** de cobrar, para validar stock y tener trazabilidad.
- Nunca dar un pago por bueno solo porque llegó un aviso: hay que verificar el token y
  consultar el estado a Bancard.
- Si algo falla, que no falle en silencio. El caso grave es cobrar y no facturar.
