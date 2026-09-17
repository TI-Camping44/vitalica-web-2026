# -*- coding: utf-8 -*-
"""
Convierte las fichas de uso del Drive en assets/js/fichas-uso.js

POR QUÉ UN CONVERSOR Y NO COPIAR A MANO
---------------------------------------
Las nueve fichas las redactó marketing y están aprobadas (Drive:
FICHA TÉCNICA DE USO > FICHAS DE USO). Copiarlas a mano a un .js sería lento
y, peor, invitaría a "mejorar" el texto de paso. Este script las pasa tal
cual: respeta los títulos, el orden y las palabras de los autores.

Si marketing edita un documento, se vuelven a bajar los .txt y se corre esto
otra vez. No se edita assets/js/fichas-uso.js a mano.

OJO CON EL NOMBRE
-----------------
La constante es VITALICA_FICHAS_USO y NO VITALICA_GUIAS. VITALICA_GUIAS ya
existe en data.js y es otra cosa: guías cortas escritas para la web (cómo
tomarlo, sí/no sirve, preguntas frecuentes). Declarar dos veces la misma
constante con const revienta la página entera.

CÓMO SE BAJAN LOS .txt
----------------------
    curl -sL -o _drive/guias/<nombre>.txt \
      "https://docs.google.com/document/d/<ID>/export?format=txt"

USO
---
    python herramientas/guias-a-datos.py
"""
import io, os, re, json, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, '_drive', 'guias')
SALIDA = os.path.join(RAIZ, 'assets', 'js', 'fichas-uso.js')

# Cada ficha con el id de producto de data.js. Los nombres de archivo son
# nuestros; los ids tienen que coincidir EXACTO con VITALICA_PRODUCTOS.
PRODUCTOS = {
    'whey-protein-complex': ['whey-protein-complex'],
    'creatina':             ['creatine-monohydrate'],
    'redweiler':            ['redweiler'],
    'knockout':             ['knockout-2'],
    'beta-alanina':         ['beta-alanina-xplode'],
    'iso-plus':             ['iso-plus-powder'],
    # La misma ficha aplica a la versión normal y a la 40+
    'multi-vitamin-sport':  ['vitamin-multiple-sport', 'vitamin-multiple-sport-40'],
    'gold-omega-3':         ['gold-omega-3-sport'],
    'arthroblock-forte':    ['arthroblock-forte'],
}

# Encabezado de sección: "3. MEJORES PRÁCTICAS (Aprovechalo al 100%)"
RE_SECCION = re.compile(r'^(\d+)\.\s+(.{4,})$')
# Viñeta: "* texto"  ·  "   * texto" (anidada)
RE_VINETA = re.compile(r'^(\s*)\*\s+(.*)$')


def limpiar(t):
    """Saca el BOM, los CR de Windows y los emojis decorativos del título."""
    return t.replace('﻿', '').replace('\r', '').replace('\U0001F4C4', '').strip()


def parsear(ruta):
    lineas = [limpiar(l) for l in io.open(ruta, encoding='utf-8').read().split('\n')]
    lineas = [l for l in lineas if l != '']
    if not lineas:
        return None

    # Línea 1: "FICHA DE USO: KNOCKOUT 2.0" → nos quedamos con lo de después
    # de los dos puntos, que es el nombre del producto.
    titulo = lineas[0]
    if ':' in titulo:
        titulo = titulo.split(':', 1)[1].strip()

    # Línea 2: "VITALICA | Ingeniería de Ignición y Enfoque Explosivo".
    # Nos quedamos con la parte de la derecha, que es la bajada real.
    bajada = ''
    cuerpo_desde = 1
    if len(lineas) > 1 and not RE_SECCION.match(lineas[1]):
        bajada = lineas[1]
        if '|' in bajada:
            bajada = bajada.split('|', 1)[1].strip()
        cuerpo_desde = 2

    secciones, actual = [], None
    for linea in lineas[cuerpo_desde:]:
        m = RE_SECCION.match(linea)
        if m:
            actual = {'titulo': m.group(2).strip(), 'bloques': []}
            secciones.append(actual)
            continue
        if actual is None:
            # Texto antes de la primera sección numerada (pasa en whey y en
            # creatina): abrimos una sección sin título para no perderlo.
            actual = {'titulo': '', 'bloques': []}
            secciones.append(actual)

        mv = RE_VINETA.match(linea)
        if mv:
            texto = mv.group(2).strip()
            nivel = 1 if len(mv.group(1)) >= 2 else 0
            # "❌ No lo tomes de noche: ..." → marcamos las advertencias para
            # poder pintarlas distinto sin depender del emoji.
            aviso = texto.startswith('❌')
            if aviso:
                texto = texto.lstrip('❌').strip()
            bloque = {'tipo': 'vineta', 'texto': texto, 'nivel': nivel}
            if aviso:
                bloque['aviso'] = True
            actual['bloques'].append(bloque)
        else:
            actual['bloques'].append({'tipo': 'parrafo', 'texto': linea})

    return {'titulo': titulo, 'bajada': bajada, 'secciones': secciones}


def main():
    guias = {}
    for ruta in sorted(glob.glob(os.path.join(ENTRADA, '*.txt'))):
        clave = os.path.splitext(os.path.basename(ruta))[0]
        ids = PRODUCTOS.get(clave)
        if not ids:
            print('  (sin producto asociado, se omite): %s' % clave)
            continue
        datos = parsear(ruta)
        if not datos:
            print('  VACIO: %s' % clave)
            continue
        for pid in ids:
            guias[pid] = datos
        print('  %-22s -> %-28s %d secciones' % (clave, ', '.join(ids), len(datos['secciones'])))

    cuerpo = json.dumps(guias, ensure_ascii=False, indent=2)
    js = (
        '/* ==========================================================================\n'
        '   VITALICA — fichas-uso.js  ·  FICHAS DE USO POR PRODUCTO\n'
        '   --------------------------------------------------------------------------\n'
        '   NO EDITAR A MANO. Este archivo lo genera herramientas/guias-a-datos.py\n'
        '   a partir de los documentos de marketing (Drive: FICHA TÉCNICA DE USO >\n'
        '   FICHAS DE USO), bajados a _drive/guias/*.txt.\n'
        '\n'
        '   Si marketing cambia una ficha: volvé a bajar el .txt y corré\n'
        '       python herramientas/guias-a-datos.py\n'
        '\n'
        '   Las claves son ids de VITALICA_PRODUCTOS (data.js). La ficha de\n'
        '   Vita-min Multiple Sport se usa para la versión normal y la 40+.\n'
        '   ========================================================================== */\n'
        'const VITALICA_FICHAS_USO = ' + cuerpo + ';\n'
    )
    io.open(SALIDA, 'w', encoding='utf-8').write(js)
    print('\n%s  (%d productos, %.1f KB)' % (
        os.path.relpath(SALIDA, RAIZ), len(guias), os.path.getsize(SALIDA) / 1024.0))


if __name__ == '__main__':
    main()
