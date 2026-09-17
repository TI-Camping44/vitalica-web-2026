# -*- coding: utf-8 -*-
"""
Carga las tablas nutricionales oficiales de Olimp en assets/js/data-fichas.js

DE DÓNDE SALEN
--------------
Drive > PRESENTACIONES > PPT > "<PRODUCTO> VALOR.png"
Copia local para verificar: _drive/nutricional/*.png

Los valores están transcritos de esas imágenes. Antes de esto, la ficha de
producto solo mostraba tres filas (proteínas, carbohidratos, grasas) sacadas
del campo `porcion` de data.js; el resto de la tabla no existía en el sitio.

POR QUÉ TEXTO Y NO LA IMAGEN
----------------------------
Se podría haber puesto el PNG oficial y listo, sin riesgo de error de tipeo.
Va como texto porque una tabla de nutrición es justo lo que la gente busca y
lo que un lector de pantalla tiene que poder leer; una imagen no sirve para
ninguna de las dos cosas. La contrapartida es que hay que verificar contra el
PNG cuando se toque algo.

Se corre una sola vez. Si Olimp actualiza una fórmula, se edita el diccionario
de acá y se vuelve a correr.

    python herramientas/cargar-tablas-nutricionales.py
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(RAIZ, 'assets', 'js', 'data-fichas.js')

TABLAS = {
 'whey-protein-complex': ('Por porcion (35 g)', [
    ('Energia', '566 kJ / 134 kcal'),
    ('Grasas (de las cuales saturadas)', '1,5 g (menos de 0,5 g)'),
    ('Carbohidratos (de los cuales azucares)', '3,9 g (1,4 g)'),
    ('Proteinas', '26 g'),
    ('Sal', '0,30 g')]),

 'creatine-monohydrate': ('Por porcion (3,4 g)', [
    ('Energia', '0 kJ / 0 kcal'),
    ('Proteinas', '0 g'),
    ('Carbohidratos', '0 g'),
    ('Grasas', '0 g'),
    ('Monohidrato de creatina', '3,4 g')]),

 'iso-plus-powder': ('Por porcion (17,5 g) + 250 ml de agua', [
    ('Energia', '255 kJ / 60 kcal'),
    ('Grasas (de las cuales saturadas)', '0 g (0 g)'),
    ('Carbohidratos (de los cuales azucares)', '15 g (12 g)'),
    ('Proteinas', '0 g'),
    ('Sal', '0,29 g')]),

 'gold-omega-3-sport': ('Por porcion (1 capsula)', [
    ('Grasas (aceite de pescado), de las cuales:', '1000 mg'),
    ('Acido eicosapentaenoico 33% EPA', '330 mg'),
    ('Acido docosahexaenoico 22% DHA', '220 mg'),
    ('Otros acidos grasos omega-3 10%', '100 mg'),
    ('Vitamina E', '12 mg (100 %*)')]),

 'knockout-2': ('Por porcion (6,1 g de polvo)', [
    ('Beta-alanina', '2100 mg'),
    ('L-arginina', '1100 mg'),
    ('L-citrulina', '600 mg'),
    ('Taurina', '600 mg'),
    ('Cafeina', '200 mg'),
    ('Extracto de pimienta de cayena (Capsicum annuum L.)', '25 mg'),
    ('de la cual capsaicina 8%', '(2,0 mg)'),
    ('Extracto de pimienta negra (Piper nigrum L.)', '7,5 mg'),
    ('de la cual piperina 95%', '(7,1 mg)')]),

 'beta-alanina-xplode': ('Por porcion (9,6 g)', [
    ('Formula de entrenamiento Beta-RUSH', ''),
    ('Beta-alanina', '1600 mg'),
    ('Vitamina B6', '0,98 mg (70 %*)'),
    ('Sistema de transporte de acido intracelular', ''),
    ('Sales de potasio de acido ortofosforico', '220 mg'),
    ('de los cuales potasio', '96,3 mg'),
    ('de los cuales fosforo', '35 mg (5 %*)'),
    ('Clorhidrato de L-histidina (de los cuales L-histidina)', '80 mg (64,8 mg)'),
    ('Sistema de transporte de acido extracelular', ''),
    ('Bicarbonato de sodio (de los cuales sodio)', '400 mg (109,5 mg)')]),

 'arthroblock-forte': ('Por porcion (2 capsulas)', [
    ('Sulfato de glucosamina 2KCl (del cual sulfato de glucosamina)', '1000 mg (750 mg)'),
    ('Sulfato de condroitina', '200 mg'),
    ('Acido hialuronico', '50 mg'),
    ('Extracto de Boswellia serrata (60 % de acido boswelico)', '100 mg'),
    ('Extracto de jengibre (5 % de gingeroles)', '100 mg'),
    ('Vitamina C', '60 mg (75 %*)'),
    ('Manganeso (Albion)', '1,8 mg (90 %*)')]),

 'redweiler': ('Por porcion (12 g)', [
    ('Formula Armageddon Pump', '4702 mg'),
    ('L-arginina alfa-cetoglutarato', '2200 mg'),
    ('Malato de citrulina', '1500 mg'),
    ('Citrato de sodio', '1000 mg'),
    ('de los cuales sodio', '230 mg'),
    ('Vitamina B6', '1,86 mg (133 %*)'),
    ('Mezcla de rendimiento Berserker', '5080 mg'),
    ('Beta-alanina', '2200 mg'),
    ('Monohidrato de creatina', '1500 mg'),
    ('Malato de creatina (malato de tricreatina TCM)', '700 mg'),
    ('de los cuales creatina', '(1845 mg)'),
    ('Fosfato de calcio', '646 mg'),
    ('de los cuales calcio', '187,3 mg (23 %*)'),
    ('de los cuales fosforo', '145,3 mg (21 %*)'),
    ('Niacina (equivalente de niacina)', '32 mg (200 %*)'),
    ('Vitamina B1', '1,84 mg (167 %*)'),
    ('Matriz Red Fury', '520 mg'),
    ('L-tirosina', '300 mg'),
    ('Cafeina', '200 mg'),
    ('Extracto de pimienta de cayena', '14 mg'),
    ('de los cuales capsaicina', '(1,1 mg)'),
    ('Extracto de pimienta negra, de los cuales piperina', '6 mg (5,7 mg)')]),

 'vitamin-multiple-sport': ('Por porcion (1 capsula)', [
    ('Vitamina A', '800 ug (100 %*)'),
    ('Vitamina D', '10 ug (200 %*)'),
    ('Vitamina E', '24 mg (200 %*)'),
    ('Vitamina C (PureWay-C)', '290 mg (362 %*)'),
    ('Vitamina B1', '19,4 mg (1764 %*)'),
    ('Vitamina B2', '19,6 mg (1400 %*)'),
    ('Niacina', '31 mg (194 %*)'),
    ('Vitamina B6', '18,8 mg (1286 %*)'),
    ('Folacina', '400 ug (200 %*)'),
    ('Vitamina B12', '23 ug (920 %*)'),
    ('Biotina', '100 ug (200 %*)'),
    ('Acido pantotenico', '12 mg (200 %*)'),
    ('Bioflavonoides citricos 40%', '100 mg'),
    ('Extracto de alcachofa 5% cinarinas', '80 mg'),
    ('Extracto de semilla de calabaza 5:1', '60 mg'),
    ('Extracto de ortiga', '60 mg'),
    ('Extracto de te verde 55% EGCG', '60 mg'),
    ('de los cuales epigalocatequina', '33 mg'),
    ('ALA (acido alfa lipoico)', '10 mg'),
    ('Extracto de pimienta negra (95%)', '1 mg')]),

 'vitamin-multiple-sport-40': ('Por porcion (2 capsulas)', [
    ('Vitamina A', '800 ug (100 %*)'),
    ('Vitamina D', '10 ug (200 %*)'),
    ('Vitamina E', '24 mg (200 %*)'),
    ('Vitamina K', '75 ug (100 %*)'),
    ('Vitamina C (PureWay-C)', '290 mg (363 %*)'),
    ('Tiamina (vitamina B1)', '19,4 mg (1764 %*)'),
    ('Riboflavina (vitamina B2)', '19,6 mg (1400 %*)'),
    ('Niacina', '31 mg (194 %*)'),
    ('Vitamina B6', '18,8 mg (1286 %*)'),
    ('Acido folico', '400 ug (200 %*)'),
    ('Vitamina B12', '23 ug (920 %*)'),
    ('Biotina', '100 ug (200 %*)'),
    ('Acido pantotenico', '12 mg (200 %*)'),
    ('Extracto de fruto de saw palmetto', '100 mg'),
    ('Extracto de ashwagandha KSM-66', '50 mg'),
    ('de los cuales withanolidos (5%)', '2,5 mg')]),
}

# Los textos de arriba van sin tildes para que este archivo no dependa de la
# codificacion de la consola. Se les reponen aca, que es donde importa.
ACENTOS = [
    ('Energia', 'Energía'), ('Proteinas', 'Proteínas'), ('azucares', 'azúcares'),
    ('porcion', 'porción'), ('capsulas', 'cápsulas'), ('capsula', 'cápsula'),
    ('Acido ', 'Ácido '), ('acidos', 'ácidos'), ('acido', 'ácido'),
    ('Cafeina', 'Cafeína'), ('Formula', 'Fórmula'), ('formula', 'fórmula'),
    ('ortofosforico', 'ortofosfórico'), ('fosforo', 'fósforo'),
    ('hialuronico', 'hialurónico'), ('boswelico', 'boswélico'),
    ('citricos', 'cítricos'), ('te verde', 'té verde'),
    ('pantotenico', 'pantoténico'), ('folico', 'fólico'),
    ('withanolidos', 'withanólidos'), ('ug', 'µg'),
]


def con_acentos(t):
    for viejo, nuevo in ACENTOS:
        t = t.replace(viejo, nuevo)
    return t


def escapar(t):
    return t.replace('\\', '\\\\').replace("'", "\\'")


def bloque_de(texto, pid):
    """Devuelve (inicio, fin) del bloque de UN solo producto.

    Se recorta primero el bloque y recién después se busca adentro.

    El primer intento usaba un único regex con .*? que iba desde el id del
    producto hasta 'filas'. Como el punto también cruza saltos de línea, en
    tres productos se pasó de largo hasta el 'nutricional' del producto
    SIGUIENTE y se llevó puestos los del medio: el archivo pasó de 10
    productos a 7 sin avisar. Acotando primero, un error solo puede estropear
    el bloque en el que está trabajando.
    """
    ini = texto.find("\n  '" + pid + "': {")
    if ini < 0:
        return None
    fin = texto.find('\n  },', ini + 1)
    if fin < 0:
        # El ÚLTIMO producto del archivo cierra con '\n  }' y sin coma.
        fin = texto.find('\n  }', ini + 1)
    if fin < 0:
        return None
    return (ini, fin)


def filas_js(filas):
    """Las filas como texto JS, con los valores alineados en columna."""
    anchura = max(len(con_acentos(f[0])) for f in filas) + 3
    lineas = []
    for nombre, valor in filas:
        n = escapar(con_acentos(nombre))
        v = escapar(con_acentos(valor))
        relleno = ' ' * max(1, anchura - len(n))
        lineas.append("        ['%s',%s'%s']" % (n, relleno, v))
    return ',\n'.join(lineas)


def cuantos_productos(texto):
    return len(re.findall(r"\n  '[a-z0-9-]+': \{", texto))


def main():
    original = io.open(ARCHIVO, encoding='utf-8').read()
    s = original
    cambiados, fallados = 0, []

    for pid, (columna, filas) in TABLAS.items():
        limites = bloque_de(s, pid)
        if not limites:
            fallados.append(pid + ' (no está en el archivo)')
            continue

        ini, fin = limites
        bloque = s[ini:fin]

        # El cierre puede ser '],' o ']': los productos que llevan un campo
        # 'nota' después de las filas cierran con coma, y los que no, sin ella.
        m = re.search(r"\n      columnas: \[[^\]]*\],\n      filas: \[\n"
                      r".*?\n      \](,?)\n", bloque, re.S)
        if not m:
            fallados.append(pid + ' (no encontré columnas/filas)')
            continue

        reemplazo = ("\n      columnas: ['%s'],\n      filas: [\n%s\n      ]%s\n"
                     % (escapar(con_acentos(columna)), filas_js(filas), m.group(1)))
        s = s[:ini] + bloque[:m.start()] + reemplazo + bloque[m.end():] + s[fin:]
        cambiados += 1
        print('  %-28s %2d filas' % (pid, len(filas)))

    # Red de seguridad: si por lo que sea se perdió un producto, no se escribe.
    antes, despues = cuantos_productos(original), cuantos_productos(s)
    if antes != despues:
        raise SystemExit('ABORTADO: había %d productos y quedaron %d. '
                         'No se escribe nada.' % (antes, despues))

    io.open(ARCHIVO, 'w', encoding='utf-8').write(s)
    print('\nproductos actualizados: %d de %d (el archivo sigue con %d)'
          % (cambiados, len(TABLAS), despues))
    if fallados:
        print('sin tocar: ' + ', '.join(fallados))


if __name__ == '__main__':
    main()
