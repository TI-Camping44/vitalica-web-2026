
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
VITALICA — Sincronizar precios desde Odoo Online
==============================================================================
Le pregunta a Odoo los precios de los productos y escribe el archivo
    assets/js/precios.js
que el sitio carga antes de data.js.

POR QUÉ ASÍ Y NO DESDE EL NAVEGADOR
-----------------------------------
Este script NO se ejecuta en la web: corre en tu compu (o en un cron del
servidor). Es a propósito. Si el navegador llamara a Odoo directamente:
  1) La clave de API quedaría escrita en el código que descarga cualquier
     visitante — con abrir el inspector se lee. Sería acceso a tu ERP.
  2) Odoo no manda cabeceras CORS, así que el navegador bloquearía el pedido
     igual.
Con este esquema la clave nunca sale de tu máquina y el sitio sigue siendo
archivos estáticos.

CÓMO USARLO
-----------
  1) Completá la configuración de abajo (o usá variables de entorno).
  2) python3 sync-odoo-precios.py
  3) Subí el assets/js/precios.js que genera.

Para que corra solo, un cron diario:
  0 6 * * *  cd /ruta/al/sitio && /usr/bin/python3 sync-odoo-precios.py

NO SUBAS ESTE ARCHIVO CON LA CLAVE ADENTRO a un repositorio público.
Lo mejor es dejarlo con las variables de entorno y setearlas aparte.
==============================================================================
"""

import os
import json
import sys
import re
import xmlrpc.client
from datetime import datetime

# ============================================================================
# 1) CONFIGURACIÓN
# ============================================================================
# La clave de Odoo NO va escrita en este archivo.
#
# POR QUÉ: este archivo vive en la misma carpeta que se sube al hosting. Si
# tiene la clave adentro, cualquiera puede descargarlo desde el navegador
# (https://vitalica.com.py/sync-odoo-precios.py) y quedarse con acceso completo
# al ERP: precios, costos, clientes, stock. No hace falta ser hacker, alcanza
# con escribir la dirección.
#
# CÓMO SE CONFIGURA AHORA:
#   1) Copiá 'odoo-credenciales.ejemplo.ini' como 'odoo-credenciales.ini'
#   2) Completá ese archivo con tus datos
#   3) NO subas 'odoo-credenciales.ini' al servidor (el .htaccess igual lo
#      bloquea, pero lo correcto es que ni siquiera esté ahí)
#
# También podés usar variables de entorno con los mismos nombres, que es lo
# recomendable si esto corre en un cron del servidor.

import configparser

def _leer_credenciales():
    """Lee odoo-credenciales.ini si existe. Las variables de entorno mandan."""
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'odoo-credenciales.ini')
    datos = {}
    if os.path.exists(ruta):
        cp = configparser.ConfigParser()
        cp.read(ruta, encoding='utf-8')
        if cp.has_section('odoo'):
            datos = dict(cp.items('odoo'))
    return datos

_cred = _leer_credenciales()

def _cfg(clave_env, clave_ini, por_defecto=None):
    return os.environ.get(clave_env) or _cred.get(clave_ini) or por_defecto

URL      = _cfg('ODOO_URL',     'url')
DB       = _cfg('ODOO_DB',      'db')
USUARIO  = _cfg('ODOO_USER',    'usuario')
CLAVE    = _cfg('ODOO_API_KEY', 'api_key')

if not all([URL, DB, USUARIO, CLAVE]):
    print('\n✖ Faltan las credenciales de Odoo.\n')
    print('  Copiá  odoo-credenciales.ejemplo.ini  como  odoo-credenciales.ini')
    print('  y completá url, db, usuario y api_key.\n')
    sys.exit(1)

# Vitalica es la compañía 2 dentro de tu Odoo.
COMPANY_ID = int(_cfg('ODOO_COMPANY_ID', 'company_id', '2'))

# Lista de precios de la que sale el precio publicado.
# Es la que se ve en Odoo: Ventas → Productos → Listas de precios.
PRICELIST = _cfg('ODOO_PRICELIST', 'pricelist', 'Público')

SALIDA = os.path.join('assets', 'js', 'precios.js')


# ============================================================================
# 2) MAPEO — referencia interna de Odoo  →  id del producto en el sitio
# ============================================================================
# La clave es el "Referencia interna" (default_code) del producto en Odoo.
# El valor es el id que usa assets/js/data.js.
#
# ⚠️ ESTO ES LO ÚNICO QUE TENÉS QUE COMPLETAR A MANO. Corré el script con
#    --listar para ver los códigos que realmente tenés cargados en Odoo.
# ============================================================================
# 2) MAPEO — producto del sitio  →  variantes en Odoo
# ============================================================================
# IMPORTANTE: en Odoo hay UN REGISTRO POR SABOR Y POR TAMAÑO, mientras que el
# sitio tiene un solo producto por línea. Por eso el mapeo es de uno a muchos:
# cada id del sitio lista TODOS sus EAN en Odoo.
#
# El script toma el precio MÁS BAJO de esas variantes (para mostrar
# "Desde Gs. X") y suma el stock de todas. Las variantes con precio 0 en Odoo
# se ignoran: son productos sin precio cargado, no productos gratis.
#
# La clave de cada variante es la "Referencia interna" de Odoo, que en tu base
# es el código de barras EAN-13 del envase.
# El mapeo vive en odoo-mapeo.json, en la raiz, y NO aca adentro.
#
# POR QUE: existe una segunda version de este sync en PHP
# (api/sync-precios.php) que corre en el servidor como tarea programada. Si
# cada una tuviera su copia del mapeo, al agregar un producto habria que
# acordarse de tocar las dos; el dia que alguien toque una sola, las
# versiones quedan distintas y nadie se entera hasta que un precio sale mal.
#
# Para agregar un producto: editar odoo-mapeo.json. Las dos lo leen.
_RUTA_MAPEO = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           'odoo-mapeo.json')
try:
    with open(_RUTA_MAPEO, encoding='utf-8') as _f:
        MAPEO = json.load(_f)
except FileNotFoundError:
    sys.exit('Falta ' + _RUTA_MAPEO + ' — dice que codigo de barras es cada producto del sitio.')
except json.JSONDecodeError as _e:
    sys.exit(_RUTA_MAPEO + ' esta mal formado: ' + str(_e))


def conectar():
    """Autentica contra Odoo y devuelve (uid, proxy de modelos)."""
    try:
        comun = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/common')
        uid = comun.authenticate(DB, USUARIO, CLAVE, {})
    except Exception as e:
        sys.exit(f'✗ No se pudo conectar a {URL}\n  {e}')

    if not uid:
        sys.exit('✗ Odoo rechazó las credenciales. Revisá DB, usuario y API key.\n'
                 '  La API key se crea en: Preferencias → Seguridad de la cuenta.')

    modelos = xmlrpc.client.ServerProxy(f'{URL}/xmlrpc/2/object')
    print(f'✓ Conectado a {URL} (uid {uid})')
    return uid, modelos


def leer_productos(uid, modelos):
    """Trae los productos vendibles de la compañía configurada."""
    # Los productos con company_id = False son COMPARTIDOS entre compañías.
    # Si filtráramos solo por company_id = 2 se caerían del listado, que es
    # el error clásico en bases multi-compañía.
    dominio = [
        '|', ('company_id', '=', False), ('company_id', '=', COMPANY_ID),
        ('sale_ok', '=', True),
    ]
    campos = ['name', 'default_code', 'barcode', 'list_price', 'qty_available', 'company_id']
    # (el id viene siempre, sin pedirlo)

    return modelos.execute_kw(
        DB, uid, CLAVE,
        'product.template', 'search_read',
        [dominio],
        {'fields': campos,
         'limit': 500,
         'context': {'allowed_company_ids': [COMPANY_ID]}}
    )


def leer_lista_precios(uid, modelos):
    """Devuelve {product_tmpl_id: precio} según la lista de precios configurada.

    POR QUÉ NO USAMOS list_price
    ----------------------------
    'Precio de venta' (list_price) es el precio base del producto. El precio
    que Vitalica realmente publica sale de la lista "Público", que puede
    diferir: por ejemplo el Arthroblock figura a 300.000 de base pero a
    330.000 en la lista.

    Leemos las reglas (product.pricelist.item) y aplicamos nosotros las de
    precio fijo. No usamos los métodos internos de Odoo porque los que
    empiezan con guion bajo no se pueden llamar por XML-RPC.
    """
    listas = modelos.execute_kw(
        DB, uid, CLAVE, 'product.pricelist', 'search_read',
        [[('name', '=', PRICELIST)]],
        {'fields': ['name', 'currency_id', 'company_id'], 'limit': 5}
    )
    if not listas:
        print(f'⚠ No encontré la lista de precios "{PRICELIST}". '
              'Se usará el precio de venta base de cada producto.')
        return {}, None
    if len(listas) > 1:
        print(f'⚠ Hay {len(listas)} listas llamadas "{PRICELIST}". Uso la primera.')
    lista = listas[0]

    items = modelos.execute_kw(
        DB, uid, CLAVE, 'product.pricelist.item', 'search_read',
        [[('pricelist_id', '=', lista['id'])]],
        {'fields': ['product_tmpl_id', 'product_id', 'fixed_price', 'compute_price',
                    'applied_on', 'min_quantity', 'date_start', 'date_end'],
         'limit': 2000}
    )

    hoy = datetime.now().strftime('%Y-%m-%d')
    # Se indexa por product_tmpl_id porque los productos se leen de
    # 'product.template'. Odoo completa product_tmpl_id también en las reglas
    # que apuntan a una variante puntual, así que esta única clave cubre los
    # dos casos.
    precios, ignoradas = {}, 0

    for it in items:
        # Solo reglas de PRECIO FIJO. Las de porcentaje o fórmula dependen de
        # un precio base y de la jerarquía de listas: replicarlas acá sería
        # adivinar. Si aparecen, se avisa y se cae al precio base.
        if it.get('compute_price') != 'fixed':
            ignoradas += 1
            continue
        # Reglas por cantidad mínima mayor a 1 son precios mayoristas.
        if (it.get('min_quantity') or 0) > 1:
            continue
        # Reglas vencidas o todavía no vigentes.
        if it.get('date_start') and str(it['date_start'])[:10] > hoy:
            continue
        if it.get('date_end') and str(it['date_end'])[:10] < hoy:
            continue

        tmpl = it.get('product_tmpl_id')
        if tmpl:
            precios[tmpl[0]] = it.get('fixed_price') or 0

    if ignoradas:
        print(f'⚠ {ignoradas} reglas de la lista no son de precio fijo '
              '(porcentaje o fórmula) y no se aplicaron.')

    print(f'✓ Lista "{lista["name"]}": {len(precios)} precios fijos leídos.')
    return precios, lista['name']


def listar(productos):
    """Muestra lo que hay en Odoo, para poder completar el MAPEO."""
    print(f'\n{len(productos)} productos vendibles encontrados:\n')
    print(f'{"REFERENCIA":<20} {"COD. BARRAS":<16} {"PRECIO":>12}  {"STOCK":>6}  NOMBRE')
    print('-' * 100)
    for p in sorted(productos, key=lambda x: x['name']):
        ref = p.get('default_code') or '—'
        cb = p.get('barcode') or '—'
        precio = p.get('list_price') or 0
        stock = p.get('qty_available')
        stock = f'{stock:.0f}' if stock is not None else '—'
        print(f'{ref:<20} {cb:<16} {precio:>12,.0f}  {stock:>6}  {p["name"]}')
    print('\nCompletá MAPEO con la referencia interna, o MAPEO_BARCODE con el\n'
          'código de barras (más estable: no cambia si renombran el producto).')


def generar(productos, precios_lista=None):
    """Agrupa las variantes de Odoo por producto del sitio y escribe los precios."""
    if not MAPEO:
        sys.exit('✗ El diccionario MAPEO está vacío.\n'
                 '  Corré primero:  python3 sync-odoo-precios.py --listar')

    precios_lista = precios_lista or {}
    por_ref = {str(p.get('default_code')): p for p in productos if p.get('default_code')}
    por_cb = {str(p.get('barcode')): p for p in productos if p.get('barcode')}

    def precio_de(p):
        """Precio de la lista si existe; si no, el precio de venta base.

        OJO con los ids: leemos de 'product.template', así que p['id'] ya es
        el id de la PLANTILLA. Las reglas de la lista se guardan con esa misma
        clave (ver leer_lista_precios), por eso la búsqueda es directa.
        """
        v = precios_lista.get(p.get('id'))
        if v:
            return v, True
        return (p.get('list_price') or 0), False

    precios, desde, stock, detalle, faltantes, sin_regla = {}, {}, {}, {}, [], []
    # Precio y stock por código de barras (una entrada por variante).
    precio_var, stock_var = {}, {}

    for id_web, refs in MAPEO.items():
        if isinstance(refs, str):        # tolera un string suelto
            refs = [refs]
        encontrados = []
        for ref in refs:
            p = por_ref.get(str(ref)) or por_cb.get(str(ref))
            if p:
                encontrados.append(p)
            else:
                faltantes.append((id_web, ref))
        if not encontrados:
            continue

        # Precio 0 en Odoo = sin precio cargado, NO gratis. Lo dejamos afuera.
        con_precio = [p for p in encontrados if precio_de(p)[0] > 0]
        if not con_precio:
            continue

        valores = [int(round(precio_de(p)[0])) for p in con_precio]
        if any(not precio_de(p)[1] for p in con_precio):
            sin_regla.append(id_web)
        precios[id_web] = min(valores)
        # "Desde" solo si las variantes tienen precios distintos entre sí.
        desde[id_web] = len(set(valores)) > 1
        stock[id_web] = int(sum(p.get('qty_available') or 0 for p in encontrados))
        detalle[id_web] = (len(con_precio), min(valores), max(valores))

        # --- Precio y stock de CADA variante, por código de barras ----------
        # El sitio tiene un selector de sabor y presentación: al elegir una
        # combinación muestra SU precio, no el más barato del producto.
        # La clave es el mismo código de barras que usa VITALICA_VARIANTES
        # en assets/js/data.js. Si los dos no coinciden, el selector queda
        # sin precio y cae al "Desde" del producto (no rompe, pero conviene
        # revisarlo).
        for p in encontrados:
            cb = str(p.get('barcode') or '').strip()
            if not cb:
                continue
            v, _ = precio_de(p)
            if v and v > 0:
                precio_var[cb] = int(round(v))
            stock_var[cb] = int(p.get('qty_available') or 0)

    sello = datetime.now().strftime('%d/%m/%Y %H:%M')
    cuerpo = (
        f'    /* Sincronizado desde Odoo el {sello}. NO EDITAR A MANO:\n'
        '       este bloque lo reescribe sync-odoo-precios.py y cualquier\n'
        '       cambio manual se pierde. Los precios se cambian en Odoo.\n\n'
        '       PRECIO = el más bajo entre las variantes (sabores y tamaños).\n'
        '       DESDE  = true si las variantes tienen precios distintos, para\n'
        '                que el sitio muestre "Desde Gs. X" y no mienta.\n\n'
        '       Las dos tablas _VARIANTE van por código de barras y las usa\n'
        '       el selector de sabor/presentación de la página de producto.\n'
        '       Tienen que coincidir con VITALICA_VARIANTES de data.js. */\n'
        '    window.VITALICA_PRECIOS = '
        + json.dumps(precios, indent=6, ensure_ascii=False) + ';\n'
        '    window.VITALICA_PRECIO_DESDE = '
        + json.dumps(desde, indent=6, ensure_ascii=False) + ';\n'
        '    window.VITALICA_STOCK = '
        + json.dumps(stock, indent=6, ensure_ascii=False) + ';\n'
        '    window.VITALICA_PRECIOS_VARIANTE = '
        + json.dumps(precio_var, indent=6, ensure_ascii=False) + ';\n'
        '    window.VITALICA_STOCK_VARIANTE = '
        + json.dumps(stock_var, indent=6, ensure_ascii=False) + ';'
    )

    escribir_js(cuerpo)
    tocados = escribir_html(cuerpo)

    print(f'\n✓ {len(precios)} productos del sitio con precio.\n')
    print(f'{"PRODUCTO":<30} {"PRECIO":>12}  {"VAR.":>4}  {"STOCK":>6}  RANGO')
    print('-' * 84)
    for id_web in sorted(precios):
        n, mn, mx = detalle[id_web]
        rango = '—' if mn == mx else f'{mn:,.0f} a {mx:,.0f}'.replace(',', '.')
        etiqueta = ('Desde ' if desde[id_web] else '') + f'Gs. {precios[id_web]:,.0f}'.replace(',', '.')
        print(f'{id_web:<30} {etiqueta:>12}  {n:>4}  {stock[id_web]:>6}  {rango}')

    print(f'\n  → {SALIDA}')
    for t in tocados:
        print(f'  → {t}')
    if not tocados:
        print('  (ningún HTML tenía las marcas PRECIOS:INICIO / PRECIOS:FIN)')

    sin_precio = [k for k in MAPEO if k not in precios]
    if sin_precio:
        print('\n⚠ Sin precio en Odoo (quedan como "A confirmar"):')
        for k in sin_precio:
            print(f'   {k}')
    if sin_regla:
        print('\n⚠ Sin regla en la lista de precios (se usó el precio base):')
        for k in sorted(set(sin_regla)):
            print(f'   {k}')
    if faltantes:
        print('\n⚠ Referencias que Odoo no devolvió:')
        for id_web, ref in faltantes:
            print(f'   {ref}  ({id_web})')


def escribir_js(cuerpo):
    """Versión en archivo aparte, para las páginas que lo carguen por <script src>."""
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, 'w', encoding='utf-8') as f:
        f.write('/* GENERADO POR sync-odoo-precios.py — NO EDITAR A MANO */\n')
        f.write(cuerpo.replace('\n    ', '\n') + '\n')


def escribir_html(cuerpo):
    """Reemplaza el bloque de precios embebido en cada .html que tenga las marcas.

    Busca:
        <!-- PRECIOS:INICIO ... -->  ...lo que sea...  <!-- PRECIOS:FIN -->
    y reemplaza SOLO lo del medio, dejando las dos marcas intactas.

    Usa una función de reemplazo en vez de una cadena con \\1 y \\2 a
    propósito: en una cadena, cualquier barra invertida que venga dentro de
    los datos se interpretaría como código de escape y corrompería el HTML.

    Antes de tocar nada guarda una copia .bak, por si el script se corta.
    """
    patron = re.compile(
        r'(<!-- PRECIOS:INICIO.*?-->).*?(<!-- PRECIOS:FIN -->)',
        re.DOTALL
    )

    def reemplazar(m):
        return (m.group(1)
                + '\n  <script>\n'
                + cuerpo
                + '\n  </script>\n  '
                + m.group(2))

    tocados = []
    for nombre in sorted(os.listdir('.')):
        if not nombre.endswith('.html'):
            continue
        original = open(nombre, encoding='utf-8').read()
        if 'PRECIOS:INICIO' not in original:
            continue
        nuevo_html = patron.sub(reemplazar, original, count=1)
        if nuevo_html == original:
            continue

        # Red de seguridad: si el resultado perdió alguna marca, no escribimos.
        if 'PRECIOS:INICIO' not in nuevo_html or 'PRECIOS:FIN' not in nuevo_html:
            print(f'  ⚠ {nombre}: el reemplazo salió mal, no se tocó el archivo.')
            continue

        with open(nombre + '.bak', 'w', encoding='utf-8') as f:
            f.write(original)
        with open(nombre, 'w', encoding='utf-8') as f:
            f.write(nuevo_html)
        tocados.append(nombre)
    return tocados


if __name__ == '__main__':
    uid, modelos = conectar()
    productos = leer_productos(uid, modelos)
    precios_lista, nombre_lista = leer_lista_precios(uid, modelos)
    if '--listar' in sys.argv:
        listar(productos)
    else:
        generar(productos, precios_lista)