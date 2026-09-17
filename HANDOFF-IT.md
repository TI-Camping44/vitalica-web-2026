# Vitalica — Documento de entrega para IT (HANDOFF)

> **Qué es este documento:** la guía para el equipo de desarrollo que va a construir la
> tienda **de verdad**, tomando esta maqueta como referencia de diseño y experiencia.
> Explica qué es la maqueta, cómo está hecha, y **qué falta construir para producción**
> (pagos con Bancard, backend, etc.), con una **recomendación de plataforma** razonada.
>
> Fecha: junio 2026 · Autor: maqueta generada con Claude Code junto al equipo de Marketing.

---

## 1. Qué es (y qué NO es) esta maqueta

**Es** un **prototipo de front-end navegable** (HTML + CSS + JavaScript puro, sin frameworks)
que muestra el diseño, la estructura y el flujo de compra deseados para el e-commerce de Vitalica
(representante exclusivo de Olimp Sport Nutrition en Paraguay). Sirve para alinear a Marketing,
dirección e IT antes de desarrollar.

**NO es** un sitio de producción. Concretamente, **todo lo siguiente está simulado en el navegador**:

- **No hay backend ni base de datos.** Los 10 productos, categorías, tiendas y textos viven en un
  archivo (`assets/js/data.js`).
- **No hay cobros reales ni pasarela de pago.** El checkout termina en una pantalla de
  "pedido confirmado" sin mover dinero.
- **No hay stock real, ni cuentas de usuario reales, ni envío de emails reales.**
- **Los precios son provisorios** (se muestran como "Gs. ——" / "Precio a confirmar").
- **El panel de administrador** (`admin.html`) guarda los cambios **solo en el navegador**
  (localStorage), no para todos los visitantes. Es una demo de lo que en producción será un CMS.

---

## 2. Cómo ver la maqueta

- **Opción simple:** abrir `index.html` con doble clic en el navegador.
- **Opción recomendada** (para que el carrito y las imágenes funcionen igual que en la web):
  levantar un servidor estático en la carpeta del proyecto. Ejemplos:
  - `python3 -m http.server 4321`  → abrir `http://localhost:4321`
  - o cualquier servidor estático (Live Server de VS Code, `npx serve`, etc.).

Ver `README.md` para más detalle.

---

## 3. Mapa del sitio

| Página | Archivo | Qué hace |
|---|---|---|
| Home | `index.html` | Hero (carrusel), grilla de 10 productos, "¿Qué querés lograr?" (4 metas), value props, banda "Sin Atajos", reseñas, teaser de guías, newsletter. |
| Productos | `productos.html` | Grilla de los 10 productos + filtro por objetivo (chips). `?meta=` preselecciona. |
| Producto | `producto.html?id=` | Plantilla única (lee el `id` de la URL): foto, precio, agregar al carrito, beneficios, ingredientes, "Lo que sí / lo que no", cómo tomarla, qué esperar, FAQ, relacionados. |
| Carrito | `carrito.html` | Vista de carrito a página completa. |
| Checkout | `checkout.html` | Compra como invitado → pantalla de confirmación (sin cobro). |
| Quiénes somos | `sobre.html` | Historia, misión "Sin Atajos", pilares, respaldo Olimp. |
| Contacto | `contacto.html` | Dónde comprar (locales), Envíos y entregas, Cambios y devoluciones, formulario. |
| Guía de uso | `guia.html` + `guia-*.html` | Índice + 3 guías largas (creatina, proteína, pre-entrenos). |
| Admin (oculta) | `admin.html` | Mini-CMS de demostración (ver sección 7). |
| Muestra | `muestra.html` | Referencia interna del sistema de diseño. |

**Carrito tipo BPN (drawer):** agregar un producto abre un **panel lateral** (no manda a otra
página), con líneas editables, *upsell* por combo y subtotal. Es la modalidad de compra elegida.

---

## 4. Cómo está construida (arquitectura del front-end)

- **Vanilla HTML/CSS/JS, sin dependencias.** Código comentado en español.
- **Una sola fuente de datos:** `assets/js/data.js` contiene toda la configuración del negocio y el
  contenido: `VITALICA_CONFIG` (WhatsApp, redes, costos de envío, anuncios, marca/logos, menú),
  `VITALICA_METAS` (4 objetivos), `VITALICA_PRODUCTOS` (10), `VITALICA_HERO`, `VITALICA_ARTICULOS`,
  `VITALICA_TIENDAS`, `VITALICA_GUIAS`, `VITALICA_COMBOS`.
- **Componentes por JS (patrón DRY):** el header (con mega-menú), el footer, la barra de anuncios y
  el botón de WhatsApp se generan una sola vez en `components.js` y se inyectan en todas las páginas.
  En producción esto se traduce a *includes/partials* o componentes del framework elegido.
- **Carrito:** `cart.js` usa `localStorage` (`vitalica_carrito`) y un evento `carrito:cambio` para
  actualizar el badge y el drawer en vivo.
- **Sistema de diseño con tokens:** `styles.css` define variables CSS (colores de marca, tipografía,
  espaciado, sombras) al inicio; todo lo visual sale de ahí. Cambiar el naranja se hace en un solo lugar.
- **Capa de overrides (para el admin):** `data.js` aplica, al final, los cambios guardados en
  `localStorage['vitalica_overrides']` sobre los valores por defecto. Así el panel admin cambia el
  sitio sin tocar el código.

### Identidad de marca (tokens principales)
- Naranja primario `#EF7D2A` (y `#D2651A` oscuro). Naranja para **texto sobre claro**: `#A85410`.
- Navy `#0B55A3` (y `#083F7A`). Tinta/texto `#16191D`; texto apagado `#565C66`.
- Tipografía: **Montserrat** (títulos) + **Inter** (texto).
- **Regla de marca:** paleta = naranja + navy + grises. Evitar introducir otros colores.

---

## 5. Qué hay que construir para producción

Lo que la maqueta simula y en producción debe ser real:

### 5.1 Pagos — Bancard (lo más importante)
- **Bancard** es la procesadora de tarjetas estándar de Paraguay. Su producto para web es
  **vPOS 2.0** (cumple **PCI DSS** y **3D Secure**; acepta Visa, Mastercard, Amex y tarjetas locales).
- **Flujo típico de vPOS 2.0:** el backend crea una operación (`single_buy`) contra la API de Bancard
  y recibe un `process_id` → se redirige/embebe el checkout de Bancard → el cliente paga en el entorno
  seguro de Bancard → Bancard llama a una **URL de confirmación (webhook)** del backend → el backend
  valida y marca el pedido como pagado.
- **Regla de oro de seguridad:** los **datos de tarjeta NUNCA tocan nuestro servidor ni el front-end**;
  los maneja Bancard. Nosotros guardamos solo el resultado de la transacción.
- **Cobertura de medios de pago más amplia (opcional):** **Pagopar** es un agregador paraguayo que
  además de Bancard suma billeteras (Tigo Money, Zimple, Wally), bocas de cobro (Aquí Pago, Pago
  Express, WEPA), transferencia y PIX. Tiene plugins/integraciones listas. Recomendado evaluarlo para
  maximizar conversión.

### 5.2 Backend de catálogo e inventario
- Productos, categorías, precios y **stock reales** en base de datos (hoy están en `data.js`).
- Estados de "agotado", control de stock al comprar, alta/baja de productos sin tocar código.

### 5.3 Gestión de pedidos
- Registro de pedidos, estados (pendiente/pagado/preparando/enviado/entregado), panel para el equipo,
  notificaciones.

### 5.4 Cuentas de usuario (opcional)
- Hoy la compra es **como invitado** (bien para empezar). Si se quiere historial/seguimiento, agregar
  registro/login. **Nunca** implementar login casero para datos sensibles sin las debidas prácticas.

### 5.5 Envíos
- Cálculo real de costo por zona (**Gran Asunción** vs **interior**), integración con el operador
  logístico, seguimiento. La maqueta ya distingue las dos zonas como referencia.

### 5.6 Reseñas reales
- Las opiniones actuales están marcadas como "demostración". En producción: reseñas verificadas con
  moderación.

### 5.7 Email / CRM / Newsletter
- Emails transaccionales (confirmación de pedido, envío), newsletter con **doble opt-in**, y CRM.
- **Feed de Instagram:** la sección "Sumate a la comunidad" del home muestra posteos **simulados**
  (imágenes cargadas desde el panel admin que enlazan al perfil). En producción se conecta el feed
  real con la **Instagram Graph API** (token de la cuenta) o un widget de embed (Elfsight, Behold,
  etc.), o simplemente se actualizan las 6 imágenes desde el CMS.

### 5.8 SEO, analítica y legales
- Metadatos/SEO, sitemap, analítica (GA4 u otra). **Legales de Paraguay:** Términos y Condiciones,
  Política de Privacidad/datos personales, políticas de envío y de cambios/devoluciones (la maqueta ya
  tiene secciones base en `contacto.html`), y datos de la empresa (RUC, contacto).

### 5.9 Seguridad e infraestructura
- HTTPS obligatorio, backups, ambiente de pruebas (sandbox de Bancard) separado del de producción.

---

## 6. Recomendación de plataforma (razonada)

El objetivo: una tienda mantenible, con **Bancard** funcionando bien en Paraguay, fiel a este diseño.

| Opción | Pros | Contras | Bancard en PY |
|---|---|---|---|
| **WooCommerce** (WordPress) | Open-source, costo bajo, control total, enorme ecosistema, fácil de mantener por Marketing | Requiere hosting y mantenimiento propio | ✅ **Plugins de Bancard vPOS 2.0** y de **Pagopar** disponibles |
| **Custom / Headless** (reutilizar ESTE front + un backend + API de Bancard) | Conserva exactamente este diseño y experiencia; máxima flexibilidad | Mayor esfuerzo de desarrollo inicial | ✅ Integración directa con la **API vPOS 2.0** |
| **Shopify** (la referencia, Invictus) | Mejor experiencia "llave en mano", ecosistema y velocidad | Costos mensuales + comisiones; **Bancard no es nativo en PY** | ⚠️ Requiere puente de terceros (CartDNA/Pagopar) → fricción y dependencia |
| **Tiendanube/Nuvemshop** | Popular en LATAM, fácil | Sus pagos (Pago Nube/Mercado Pago) operan sobre todo en AR/MX/BR; **Bancard en PY no es claro** | ⚠️ A verificar caso por caso |

**Recomendación:**
1. **Primera opción — WooCommerce.** Es el mejor equilibrio para Paraguay: tiene integración con
   **Bancard vPOS 2.0** y con **Pagopar**, costo de licencia bajo, y el equipo de Marketing puede
   cargar productos/precios sin programar. Este diseño se puede replicar fielmente con un tema a medida.
2. **Segunda opción — Custom/Headless reutilizando esta maqueta.** Si se quiere conservar exactamente
   esta experiencia (incluido el drawer estilo BPN), se construye un backend + se conecta la **API de
   Bancard** directamente. Más trabajo, máximo control.
3. **Pasarela de pago (con cualquier plataforma):** evaluar **Pagopar** además de Bancard, para cubrir
   tarjetas + billeteras + bocas de cobro + transferencia en un solo lugar y subir la conversión.
4. **Shopify**: viable por experiencia, pero **el costo total y la integración indirecta de Bancard en
   Paraguay** la dejan por debajo de WooCommerce para este caso. Considerar solo si se prioriza
   "llave en mano" por sobre el control y el costo.

> Decisión final: la toma IT según su stack y capacidades. Esta es una recomendación, no un mandato.

---

## 7. El panel de administrador (`admin.html`)

- **Qué es hoy:** un **mini-CMS de demostración, solo front-end**. Permite cambiar logos, imágenes de
  producto/hero, textos, precios, enlaces (texto + destino), anuncios, WhatsApp, redes, costos de envío
  y tiendas. Indica el **tamaño ideal** de cada imagen y, en cada enlace, qué dice y a dónde va.
- **Cómo guarda:** los cambios van a `localStorage['vitalica_overrides']` (vista previa **solo en ese
  navegador**) y se pueden **Exportar/Importar** como JSON. La clave (`vitalica2026`) es **demostrativa,
  no es seguridad real**.
- **Cómo se vuelve "de verdad" en producción:** este panel es el prototipo de lo que será el **panel de
  administración del CMS/plataforma** (WooCommerce/Shopify ya traen el suyo) o un admin a medida
  conectado al backend, con usuarios, permisos y persistencia para todos los visitantes.

---

## 8. Skills de Claude Code incluidas (`.claude/skills/`)

El proyecto incluye dos *skills* (instructivos reutilizables para Claude Code) que viajan con la carpeta
y el equipo hereda:

- **`revision-diseno`** — auditoría de UX/diseño: cómo ver el sitio renderizado, checklist priorizado
  (jerarquía, espaciado, tipografía, consistencia de marca, CTAs, estados, responsive, conversión) y los
  hallazgos ya resueltos/pendientes.
- **`accesibilidad`** — auditoría WCAG: fórmula de contraste, umbrales, snippets de medición y los
  hallazgos. Útil para mantener accesibilidad y contraste en el sistema de diseño de producción.

Se invocan diciendo, por ejemplo, "revisá el diseño" o "revisá accesibilidad/contraste".

---

## 9. Estado de UX / Accesibilidad (auditoría jun-2026)

Se hizo una auditoría visual y de accesibilidad y se **corrigió** lo de mayor impacto:
- **Contraste:** botones naranjas pasaron a **texto oscuro** (6.4:1); naranja como texto sobre claro usa
  `#A85410` (5.3:1); eyebrows de sección en gris (6.7:1). Todo aprueba **WCAG AA**.
- **Marca:** se quitaron colores fuera de paleta (teal/verde/violeta); metas y guías en naranja+navy.
- **Layout:** grilla de productos en 5 columnas (sin "fila huérfana"); botones del carrito ≥44px (táctil).
- **Contenido:** secciones reales de Envíos y Cambios; footer enlazando a ellas.

**Pendiente menor** (documentado en las skills): chips de filtro como `<a href="#">` → `<button>`;
estados *hover* que viran a naranja; buscador real para el ícono de lupa; revisar el crossfade de la
barra de anuncios. **Confirmado OK:** todas las imágenes con `alt`, redes con `aria-label`, tamaños en `rem`.

---

## 10. Checklist de lanzamiento (resumen)

- [ ] Elegir plataforma (ver sección 6) y hosting con HTTPS.
- [ ] Integrar **Bancard vPOS 2.0** (y evaluar **Pagopar**) — primero en **sandbox**.
- [ ] Cargar catálogo real con **precios y stock**.
- [ ] Gestión de pedidos + emails transaccionales.
- [ ] Costos de envío reales (Gran Asunción / interior) + logística.
- [ ] Legales PY (Términos, Privacidad, Envíos, Cambios) + datos de empresa.
- [ ] SEO + analítica.
- [ ] Reseñas reales con moderación.
- [ ] Reemplazar el panel demo por el admin real del CMS/backend.
- [ ] Revisión final de accesibilidad y responsive (usar las skills incluidas).

---

## Fuentes consultadas (jun-2026)

- Bancard vPOS (oficial): https://www.bancard.com.py/vpos
- Bancard vPOS 2.0 para WooCommerce/PrestaShop (referencia de integración): https://www.pasarelasdepagos.com/shop/ecommerce-paraguay/woocommerce-paraguay/bancard-woocommerce/
- Cómo cobrar online en Paraguay (Pagopar, Bancard, QR), 2026: https://www.shoperly.app/blog/cobrar-online-paraguay-metodos-pago
- Pagopar — integración de medios de pago: https://soporte.pagopar.com/portal/es/kb/articles/api-integracion-medios-pagos
- Shopify + Bancard en Paraguay (puente de terceros): https://www.cartdna.com/es_MX/metodos-de-pago-de-shopify/Bancard
- Alternativas de plataformas e-commerce en Paraguay: https://girolabs.com/ecommerce-paraguay/
