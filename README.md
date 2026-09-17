# Vitalica — Maqueta de e-commerce (prototipo)

Maqueta navegable de la tienda online de **Vitalica** (representante exclusivo de **Olimp Sport
Nutrition** en Paraguay). Sirve como **referencia de diseño y experiencia** para el equipo de IT y para
mostrar cómo se vería y funcionaría la tienda.

> ⚠️ **Es una maqueta, no la tienda real.** No tiene backend ni cobros: el catálogo y los textos están
> en un archivo, y el checkout termina en una pantalla de "pedido confirmado" **sin mover dinero**.
> Para el detalle técnico y qué construir en producción, ver **`HANDOFF-IT.md`**.

---

## Cómo abrir la maqueta

**Forma fácil:** doble clic en `index.html` (se abre en el navegador).

**Forma recomendada** (el carrito y las imágenes funcionan igual que en la web real) — levantar un
servidor local en esta carpeta. En Windows, sin instalar nada:

```powershell
powershell -ExecutionPolicy Bypass -File servidor-local.ps1
```

Después abrir `http://localhost:4321`. Se corta con Ctrl+C.

> `servidor-local.ps1` está en esta carpeta y usa solo lo que Windows ya trae. Sirve como
> alternativa liviana: no hace falta configurar nada ni instalar dependencias.

En Mac o Linux, o si tenés Python instalado:

```bash
python3 -m http.server 4321
```

> También sirve la extensión "Live Server" de VS Code, o `npx serve`.

---

## Estructura de archivos

```
vitalica-maqueta/
├── index.html              Home
├── productos.html          Grilla de productos + filtro por objetivo
├── producto.html           Detalle de producto (plantilla, lee ?id= de la URL)
├── carrito.html            Carrito (página completa)
├── checkout.html           Checkout → confirmación (sin cobro)
├── sobre.html              Quiénes somos
├── contacto.html           Dónde comprar · Envíos · Cambios · Contacto
├── guia.html               Índice de "Guía de uso" + guia-*.html (3 guías)
├── admin.html              Panel de administrador (demo, oculto)
├── muestra.html            Referencia interna del sistema de diseño
├── README.md               Este archivo
├── HANDOFF-IT.md           Documento de entrega para IT
├── servidor-local.ps1      Servidor de prueba para Windows (no instala nada)
├── sync-odoo-precios.py    Trae precios y stock de Odoo → genera assets/js/precios.js
├── _respaldo-.../          Copia de seguridad antes del refactor (se puede borrar)
├── _descartado/            Diseño viejo que ya no se usa (se puede borrar)
└── assets/
    ├── css/styles.css      Sistema de diseño + componentes + páginas
    ├── fonts/              Tipografía Degular de la marca
    ├── img/                Logos y fotos de producto
    │   └── hero/           Fotos del carrusel del home (ver su LEEME.txt)
    └── js/
        ├── precios.js      ⚙️ Precios y stock de Odoo — LO GENERA EL SCRIPT, no editar
        ├── data.js         ⭐ TODO el contenido y la configuración (la fuente única)
        ├── components.js   Header, footer, barra de anuncios, cards, carrito (drawer)
        ├── cart.js         Carrito (se guarda en el navegador)
        ├── main.js         Arma el "marco" común y la lógica compartida
        └── pages/          Lógica de cada página (home, productos, producto, admin, etc.)
```

> **Todas las páginas, incluida `index.html`, cargan estos mismos archivos.** Antes el home tenía
> una copia del CSS y del catálogo escrita adentro, así que editar `assets/js/data.js` no cambiaba
> la portada y las dos versiones se desincronizaban. Eso ya está unificado: se edita en un solo
> lugar y se ve en todo el sitio.

---

## Cómo editar el contenido

Hay **dos formas**:

### 1) Editando `assets/js/data.js` (la fuente única)
Ahí está **todo**: productos, categorías/metas, tiendas, textos, WhatsApp, redes, costos de
envío, hero y logos. Está comentado en español. Cambiás un valor y se actualiza en todo el sitio.

> **Los precios y el stock NO se editan ahí.** Vienen de Odoo: corrés `sync-odoo-precios.py`, que
> genera `assets/js/precios.js`, y el sitio lo lee solo. En `data.js` los productos quedan con
> `precio: null` a propósito. Si un producto muestra "Gs. ——", es que Odoo no devolvió precio para
> esa referencia, o que la página no está cargando `precios.js`.
>
> Cuando un producto tiene variantes de distinto precio (sabores, tamaños), el sitio muestra
> **"Desde Gs. X"** con el más barato, para no prometer un precio que no aplica al envase grande.
> Y si el stock baja de `stockBajo` (10 por defecto, configurable en `data.js`), aparece
> **"Últimas unidades"**.

### 2) Con el panel de administrador (`admin.html`) — sin tocar código
- Abrí `admin.html` y entrá con la clave **`vitalica2026`** (clave **demostrativa**).
- Podés cambiar logos, imágenes (con el tamaño ideal indicado), textos, precios, enlaces (texto +
  destino), anuncios, WhatsApp, redes, envíos y tiendas.
- **Guardar** → recargás el sitio y ves los cambios. **Exportar** baja un `.json` con todo (para
  guardarlo o pasárselo a IT). **Importar** lo carga en otra compu. **Restablecer** vuelve al original.

> ⚠️ **El panel le gana a los archivos.** Lo que guardás queda en el navegador
> (`localStorage['vitalica_overrides']`) y **pisa** lo que digan `data.js` e `index.html`. Si editás
> un archivo y el sitio no cambia, es casi seguro que hay un override guardado tapándolo.
> Se limpia con **Restablecer** en el panel, o desde la consola del navegador (F12) con:
> `localStorage.removeItem('vitalica_overrides')`. Ojo: borra **todos** los cambios del panel, no
> solo el que te molesta.

> Importante: el panel guarda los cambios **solo en tu navegador** (es una demo). La persistencia para
> todos los visitantes la construye IT con un CMS/backend (ver `HANDOFF-IT.md`).

---

## Cómo se compra en el sitio

El sitio **no cobra**: no hay pasarela y no se toca ninguna tarjeta. El pedido se arma en la web y se
cierra por WhatsApp con un asesor. El recorrido completo es:

1. **Carrito** — se agrega desde cualquier producto y se abre un panel lateral.
2. **Checkout** (`checkout.html`) — cuatro pasos:
   - **Tus datos** — nombre, apellido, WhatsApp y email opcional. Sin crear cuenta.
   - **Entrega** — Gran Asunción, interior, o retiro en un local. El costo sale de
     `VITALICA_CONFIG.envio` y se suma al total en vivo. Si se elige retiro, se pide **en qué local**
     (la lista sale de `VITALICA_TIENDAS`) y desaparecen los campos de dirección.
   - **Forma de pago** — se elige cómo va a pagar. Es informativo: viaja en el mensaje para que el
     asesor tenga todo listo. "Tarjeta en el local" se habilita solo si se eligió retiro.
   - **Confirmar** — abre WhatsApp con el pedido completo ya escrito.
3. **Confirmación** — pantalla con el **número de pedido** (`VIT-AAMMDD-XXXX`) para que cliente y
   asesor hablen del mismo pedido.

### Costos de envío y medios de pago

Los dos se editan en `assets/js/data.js`:

```js
envio: { granAsuncion: 25000, interior: 40000, gratisDesde: null }
```

Poné `gratisDesde: 300000` y a partir de ese subtotal el envío deja de cobrarse solo. Poné `null` en
`granAsuncion` o `interior` si preferís que diga "a confirmar" en vez de un monto.

Los medios de pago están en `VITALICA_CONFIG.pagos.metodos`. **Los datos bancarios están vacíos a
propósito** — hay que cargarlos, no inventarlos. Mientras estén vacíos el sitio dice que se envían por
WhatsApp, que es cierto y no compromete nada.

---

## Pop-ups de campaña

Para comunicar promociones, beneficios, lanzamientos o campañas puntuales. Se cargan en
`assets/js/data.js` → `VITALICA_POPUPS`, y **vienen todos apagados**.

**Para prender uno:** buscá su bloque y poné `activo: true`. Nada más.

**Para una campaña nueva:** copiá un bloque entero, cambiale el `id` y editá el texto.

Cada campaña tiene reglas:

| Campo | Qué hace |
|---|---|
| `paginas` | Dónde aparece. `[]` = en todas. Ej: `['index.html', 'productos.html']` |
| `segundos` | Cuánto espera antes de aparecer. Menos de 3 se siente invasivo. |
| `repetirDias` | Días antes de volver a mostrárselo a quien lo cerró. |
| `soloUnaVez` | `true` = una vez por persona y nunca más. Para lanzamientos. |
| `cta` / `cta2` | Botones. En `href` podés poner `'whatsapp'` y arma el link solo. |

**Tres cosas que hace por su cuenta**, y conviene saber por qué:

- **Nunca aparece en el carrito ni en el checkout.** Interrumpir a alguien que ya está comprando es la
  forma más cara de ganar un click.
- **Si hay varias campañas activas, muestra solo la primera.** Dos pop-ups encima del otro venden menos,
  no más.
- **Se acuerda de quién lo cerró.** Por eso el `id` tiene que ser único: si editás el texto de una
  campaña que ya salió y querés que la vuelvan a ver, **cambiá el `id`**.

**Para probar sin esperar**, en la consola del navegador (F12):

```js
VitalicaPopups.probar('envio-gratis-lanzamiento')  // lo muestra ya
VitalicaPopups.olvidar()                            // "nunca vi ninguno": vuelven a salir
```

---

## Cómo funciona por dentro (resumen)

- **HTML + CSS + JavaScript puro**, sin frameworks.
- El **header, footer, barra de anuncios y botón de WhatsApp** se generan por JavaScript y se insertan
  en todas las páginas → se editan en un solo lugar (`components.js`).
- El **carrito** se guarda en el navegador (`localStorage`) y persiste entre páginas. Agregar un
  producto abre el **panel lateral (drawer)**, estilo Bare Performance Nutrition.
- El **diseño** sale de variables CSS (colores de marca, tipografía, espaciado) al inicio de
  `styles.css`: cambiar el naranja se hace en un solo lugar.

---

## Notas importantes

- **Precios:** provisorios ("Gs. ——" / "Precio a confirmar"). Cargá los reales en `data.js` o el panel.
- **Reseñas:** son de demostración (marcadas como tal).
- **Marca:** paleta = **naranja `#EF7D2A` + navy `#0B55A3` + grises**. Mantener esa paleta.
- **Sin envío gratis ni cuotas** salvo que el negocio lo confirme (la maqueta no promete eso).

---

## Para el equipo de IT

Todo lo necesario para llevar esto a producción (pasarela **Bancard**, backend, gestión de pedidos,
recomendación de plataforma, etc.) está en **`HANDOFF-IT.md`**.

## Skills de Claude Code incluidas
En `.claude/skills/` hay dos asistentes reutilizables: **`revision-diseno`** (auditoría de UX/diseño) y
**`accesibilidad`** (auditoría WCAG/contraste). Se invocan pidiéndole a Claude, por ejemplo,
"revisá el diseño" o "revisá la accesibilidad".

---

## Etiquetas y promociones

Se manejan desde `admin.html` → sección **🏷️ Etiquetas y promociones**, o editando
`VITALICA_CAMPANAS` en `assets/js/data.js`.

Por producto se define:

| Campo | Para qué sirve |
|---|---|
| **Etiqueta** | Nuevo · Lanzamiento · Oferta · sin etiqueta. Se muestra sobre la foto. |
| **La etiqueta se apaga el** | Fecha de vencimiento. Pasada esa fecha desaparece sola. |
| **¿Promo activa?** | Prende el descuento. |
| **Descuento (%)** | Solo el número: `15` = quince por ciento. |
| **Texto de la etiqueta** | Ej. "Semana de la proteína". Vacío = muestra `-15%`. |
| **Desde / Hasta** | Vigencia de la promo. Fuera de rango no se aplica, aunque esté activa. |

### Por qué esto no viene de Odoo

El **precio y el stock sí** vienen de Odoo: son hechos del inventario y tienen un único dueño.
**"Nuevo", "Lanzamiento" y "Promo" son decisiones de marketing**, y cambian por campaña, no por
movimiento de stock.

Odoo no sabe si algo es un lanzamiento *en la web*. Sabe cuándo se creó el producto — y uno cargado
hace ocho meses puede lanzarse hoy, o una reposición del mismo código no es una novedad para el
cliente. Por eso lo decide una persona.

### Tres cosas que conviene saber

- **Todo vence.** Una etiqueta "Nuevo" puesta en marzo sigue diciendo "Nuevo" en diciembre si nadie
  la saca, y eso le quita credibilidad a todas las demás. Acá se apagan solas. El panel marca en rojo
  las que ya vencieron.
- **La promo gana sobre la etiqueta.** Si un producto tiene "Nuevo" y una promo activa, se muestra la
  promo: es el mensaje más fuerte para alguien que mira una grilla de diez productos.
- **El descuento es un porcentaje, no un precio fijo.** Cada sabor y tamaño tiene su precio: un 15%
  se aplica bien a los nueve Whey, un precio fijo de Gs. 300.000 sería un regalo en el envase de
  2270 g. El porcentaje se calcula sobre el precio que manda Odoo para esa variante exacta.

El descuento se aplica en **todo el recorrido**: catálogo, ficha, carrito, checkout y el mensaje de
WhatsApp. No es solo un cartel en la vitrina.
