# Vitalica · sitio web

Tienda de **Vitalica**, distribuidor exclusivo de **Olimp Sport Nutrition** en Paraguay.

HTML, CSS y JavaScript sin compilación: se abre y funciona. PHP aparece solo en el
panel interno y en el registro de pedidos.

---

## Para revisar el diseño

El sitio tiene **dos diseños conviviendo** y se cambia de uno a otro sin recargar nada
raro: hay un botón fijo abajo a la izquierda que dice en cuál estás parado y te lleva
al otro.

| | |
|---|---|
| **Diseño propuesto** (el nuevo, el que hay que aprobar) | es el que se ve por defecto |
| **Diseño actual** (el de antes, para comparar) | agregando `?tema=actual` a la dirección |

Se puede navegar el sitio entero en cualquiera de los dos. No es una maqueta suelta:
es la misma página con otra hoja de estilos encima.

### Qué mirar

- **Portada** — productos primero, apenas termina el hero.
- **Ficha de producto** — galería de fotos que sigue al sabor elegido, el precio del
  botón es el total, y la foto se abre en grande.
- **Buscador** (la lupa) — probá escribiendo con errores a propósito: `creatna`,
  `isotonika`, `pre entreo`. Los encuentra igual.
- **Celular** — dos productos por fila; el menú y las fichas están pensados para el
  teléfono, no adaptados a último momento.

---

## Cómo levantarlo

Hace falta PHP solo si querés probar el panel interno o el registro de pedidos. Para
mirar el diseño alcanza con cualquier servidor estático.

```bash
php -S localhost:4323 -t .
```

Y abrir <http://localhost:4323>.

Para el backend, copiar los archivos de ejemplo y completarlos:

```bash
cp api/config.ejemplo.php api/config.php
cp odoo-credenciales.ejemplo.ini odoo-credenciales.ini
```

---

## Cómo está armado

```
assets/css/styles.css       el diseño de siempre
assets/css/tema-2026.css    la propuesta: TODO encerrado en [data-tema="2026"]
assets/js/data.js           productos, precios, variantes, textos, aliados
assets/js/pages/            un archivo por página
api/                        PHP del panel interno y de los pedidos
herramientas/               scripts de imágenes y de mantenimiento
```

La propuesta vive **entera** en un archivo aparte que se carga después del principal y
lo pisa. Eso significa dos cosas: que la comparación es honesta —es el mismo sitio, no
dos ramas que se fueron separando— y que si no se aprueba, deshacerla es borrar un
archivo.

---

## Lo que no está en este repositorio

Por seguridad y por peso:

- **Credenciales** — `ACCESOS.md`, `odoo-credenciales.ini`, `api/config.php`.
  Para cada uno hay un `.ejemplo` con la misma forma y los valores vacíos.
- **Pedidos guardados** (`api/almacen/`) — tienen nombre, teléfono y dirección de
  clientes reales.
- **Material interno del Drive** — manual de marca, catálogos, contratos.
- **Fotos en crudo** — la biblioteca de Olimp son 94 archivos y 429 MB; el sitio usa
  ocho. Los recortes que sí se usan están en `assets/img/`.

---

## Nota sobre GitHub Pages

Si estás viendo esto publicado en Pages, el sitio es **estático**: no hay PHP. Funciona
todo lo que sirve para aprobar el diseño —catálogo, fichas, galería, buscador, carrito,
pedido por WhatsApp y la descarga del PDF— porque eso ocurre en el navegador.

No funcionan el panel de administrador, el guardado de pedidos en el servidor ni la
sincronización de precios con Odoo. Para probar eso hace falta el hosting con PHP.
