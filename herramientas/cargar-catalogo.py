# -*- coding: utf-8 -*-
"""
Carga en data-fichas.js los datos del catálogo oficial de Vitalica.

DE DÓNDE SALEN
--------------
Drive > DIGITAL > PÁGINA WEB > FOTOS PARA WEB VITALICA > CATALOGO HOJA POR HOJA
Copia local: _drive/catalogo/p01.jpg … p21.jpg  (_indice.jpg tiene la miniatura
de las 21 para ubicar cuál es cuál).

Cada página de producto del catálogo trae, en español y ya aprobado:
  · cuatro diferenciales con su explicación
  · presentación y porciones por envase
  · el código EAN de cada variante

Los primeros dos rellenan campos que en data-fichas.js estaban marcados
"⚠️ COMPLETAR" desde el principio.

POR QUÉ NO SE INVENTA NADA
--------------------------
Todo lo de acá está transcrito de esas páginas. Si algo hay que corregir, se
mira el JPG correspondiente (la clave 'pagina' de cada producto dice cuál) y se
corrige acá; no se edita data-fichas.js a mano.

    python herramientas/cargar-catalogo.py
"""
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO = os.path.join(RAIZ, 'assets', 'js', 'data-fichas.js')

# pagina = número de página del catálogo, para poder verificar
CATALOGO = {
 'whey-protein-complex': {
   'pagina': 'p05 y p06',
   'presentacion': 'Bolsa de 700 g y de 2.270 g',
   'porciones': '20 medidas (700 g) · 67 medidas (2.270 g)',
   'diferenciales': [
     ('Tecnología CFM superior (no química)',
      'Filtrado de Flujo Cruzado que garantiza la máxima pureza y preserva las fracciones de crecimiento muscular, ofreciendo la más alta eficiencia.'),
     ('Estándar farmacéutico europeo',
      'Fabricado bajo los controles rigurosos de Olimp Labs; producto libre de aspartamo, pureza y seguridad garantizadas.'),
     ('Textura gourmet',
      'Consistencia cremosa y satisfactoria (tipo batido real), que mejora la experiencia de consumo frente a fórmulas acuosas.'),
     ('Fórmula doble (WPC + WPI)',
      'Mezcla inteligente que optimiza la absorción para la recuperación y el crecimiento muscular magro.'),
   ]},

 'creatine-monohydrate': {
   'pagina': 'p13',
   'presentacion': 'Pote de 250 g y de 550 g',
   'porciones': '73 medidas (250 g) · 161 medidas (550 g)',
   'diferenciales': [
     ('Estándar farmacéutico europeo',
      'La diferencia clave: Olimp trata su creatina con los mismos controles de calidad (GMP) que un medicamento, con análisis que superan el estándar alimenticio. Garantía de pureza y seguridad superior.'),
     ('Micronización 200 mesh superior',
      'Malla 200, una micronización extremadamente fina que facilita la disolución y asegura una absorción intestinal máxima, minimizando cualquier malestar estomacal.'),
     ('Fuerza y rendimiento máximo',
      'El suplemento más comprobado científicamente para aumentar la fuerza explosiva, la potencia y crear un entorno celular óptimo para la ganancia de masa muscular.'),
     ('GLP (Good Laboratory Practice)',
      'Un estándar de seguridad superior. Mientras la industria se limita a normas de fabricación, la certificación GLP garantiza la integridad y calidad de los ensayos de laboratorio no clínicos: cada prueba de toxicidad y pureza está validada científicamente.'),
   ]},

 'iso-plus-powder': {
   'pagina': 'p08',
   'presentacion': 'Pote de 700 g y bolsa de 1.505 g',
   'porciones': '40 medidas (700 g) · 86 medidas (1.505 g)',
   'diferenciales': [
     ('Vitamin Complex',
      'Te brinda una sensación de energía limpia y vitalidad constante. Evita esa pesadez y "niebla mental" que aparece a mitad de la rutina, permitiéndote sentirte fresco, lúcido y con capacidad de respuesta hasta la última repetición.'),
     ('Matriz isotónica real y completa',
      'Una fórmula científicamente balanceada que repone simultáneamente electrolitos y evita los calambres y el bajo rendimiento.'),
     ('Máximo rendimiento y economía',
      'Proporciona un producto de calidad superior a un costo por litro significativamente más económico que las alternativas comerciales embotelladas.'),
     ('Fórmula inteligente de doble acción',
      'Va más allá de la reposición de sales: está enriquecido con L-Carnitina para optimizar la quema de grasa mientras entrenás, y L-Glutamina para una recuperación muscular más rápida y eficiente.'),
   ]},

 'redweiler': {
   'pagina': 'p10',
   'presentacion': 'Pote de 480 g',
   'porciones': '40 medidas',
   'diferenciales': [
     ('Berserker’s Performance Blend',
      'Matriz de beta-alanina y creatina diseñada para anular la fatiga por ácido láctico. Permite mover cargas pesadas por más tiempo, retrasando el fallo muscular y aumentando la fuerza explosiva.'),
     ('Armageddon Pump Formula',
      'Dosis masiva de citrulina y AAKG sin mezclas ocultas. Produce una vasodilatación extrema y transporte masivo de nutrientes al músculo desde la primera serie.'),
     ('Concentrado de alta precisión',
      'Al eliminar azúcares y gasificantes innecesarios, evitás la pesadez y el malestar estomacal. Es pura potencia activa en un formato compacto que garantiza una digestión ligera y una absorción inmediata.'),
     ('Red Fury Matrix',
      'Contiene una matriz de pimienta de cayena, piperina y capsaicina que genera una experiencia térmica real. Sentirás físicamente el calor de la activación, disparando la termogénesis y la sudoración.'),
   ]},

 'knockout-2': {
   'pagina': 'p11',
   'presentacion': 'Pote de 305 g',
   'porciones': '50 medidas',
   'codigo': '5901330056291',
   'diferenciales': [
     ('Impacto de energía real',
      'Con 200 mg de cafeína, aporta un 33% más de potencia que los productos estándar, eliminando el cansancio al instante en usuarios avanzados con alta tolerancia.'),
     ('Doble activación térmica',
      'Matriz de pimienta y capsaicina que eleva la temperatura corporal en 15 minutos, activando la termogénesis y la sudoración para maximizar la quema de calorías.'),
     ('Energía "seca" y limpia',
      'Fórmula sin creatina que evita la retención de líquidos e hinchazón, ideal para definir o ganar potencia sin peso extra por agua.'),
     ('Resistencia y enfoque mental',
      'Con 2.100 mg de beta-alanina para retrasar la fatiga muscular, sumado a L-tirosina y taurina que aseguran enfoque mental sin taquicardias ni bajones de energía.'),
   ]},

 'beta-alanina-xplode': {
   'pagina': 'p15',
   'presentacion': 'Pote de 250 g',
   'porciones': '50 medidas',
   'codigo': '5901330077739',
   'diferenciales': [
     ('Sistema de transporte de ácido intracelular',
      'Defensa interna. Suministramos beta-alanina junto con L-histidina para asegurar la creación de carnosina dentro de la fibra muscular. Actúa como una esponja que absorbe el ácido láctico justo donde nace, permitiéndote entrenar más fuerte antes de sentir ardor.'),
     ('Sistema de transporte de ácido extracelular',
      'Limpieza externa. No basta con proteger el músculo: hay que limpiar la sangre. La fórmula incluye buffers especiales (como el bicarbonato) que ayudan a expulsar y neutralizar el ácido que sale del músculo hacia el torrente sanguíneo, retrasando la fatiga general.'),
     ('Brand New Approach',
      'Guerra en dos frentes. Mientras otras marcas solo dan ingredientes sueltos, Olimp usa una estrategia dual: protege el músculo por dentro y limpia la sangre por fuera.'),
     ('Fórmula "Beta-Rush" completa',
      'El motor de la absorción. La mezcla se potencia con vitamina B6, clave para el metabolismo energético, lo que asegura que el transporte de los aminoácidos sea inmediato y eficiente.'),
   ]},

 'vitamin-multiple-sport': {
   'pagina': 'p17',
   'presentacion': 'Caja de 60 cápsulas',
   'porciones': '30 tomas',
   'codigo': '5901330043628',
   'diferenciales': [
     ('Tecnología Vita-Plex®',
      'Vitaminas de nueva generación. No son vitaminas genéricas: es una matriz compleja de vitaminas esenciales (incluyendo espectro B completo) diseñada para cubrir el déficit energético que se produce tras entrenamientos intensos.'),
     ('Tecnología Chela-Min®',
      'Minerales con patente mundial. Contiene exclusivamente minerales quelados Albion® (Gold Medallion). Esto garantiza que el zinc, el magnesio y el hierro sean absorbidos realmente por tu cuerpo y no desechados como ocurre con las marcas baratas.'),
     ('Sistema "químicamente estable"',
      'Separados para funcionar mejor. Al tener las vitaminas y los minerales en cápsulas distintas, se evitan las interferencias químicas negativas que ocurren en los multivitamínicos "todo en uno". Cada nutriente mantiene su potencia intacta.'),
     ('Complejo Hepa-Prost Detox',
      'Limpieza y definición. Dentro de la cápsula Vita-Plex se añaden extractos naturales de alcachofa, ortiga y té verde. Ayuda a limpiar el hígado y a eliminar la retención de líquidos mientras te nutre.'),
   ]},

 'vitamin-multiple-sport-40': {
   'pagina': 'p18',
   'presentacion': 'Caja de 60 cápsulas',
   'porciones': '30 tomas',
   'codigo': '5901330054853',
   'diferenciales': [
     ('Fórmula específica "Master 40+"',
      'Ingeniería para el hombre maduro. A los 40, el metabolismo cambia. Esta fórmula no es genérica: está calibrada exactamente para las necesidades metabólicas, hormonales y energéticas de un atleta que supera las cuatro décadas.'),
     ('Potenciador KSM-66® (ashwagandha)',
      'Control de estrés y hormonas. Incluye el extracto de raíz de ashwagandha más puro del mundo (KSM-66). Actúa como un adaptógeno potente que reduce el estrés (cortisol) y favorece un entorno hormonal saludable.'),
     ('Escudo prostático (saw palmetto)',
      'Mantenimiento preventivo. Pensando en la salud a largo plazo, se añade extracto de saw palmetto (palmito americano), ingrediente clave para cuidar la salud de la próstata.'),
     ('Minerales quelados Albion®',
      'Absorción premium. Se usan minerales con patente Albion®, que garantizan que el cuerpo absorba el 100% de los nutrientes sin causar pesadez estomacal, algo crucial cuando el sistema digestivo se vuelve más sensible con los años.'),
   ]},

 'gold-omega-3-sport': {
   'pagina': 'p19',
   'presentacion': 'Caja de 120 cápsulas',
   'porciones': '120 tomas',
   'codigo': '5901330030581',
   'diferenciales': [
     ('Concentración Gold',
      'Mientras el estándar del mercado solo ofrece un 30% de pureza, Olimp garantiza un 65% real de ácidos grasos. Cada cápsula entrega más del doble de principios activos que las marcas masivas de supermercado.'),
     ('Protección blíster',
      'El aceite de pescado se oxida en los botes comunes. La tecnología de blíster individual asegura que cada cápsula se mantenga fresca, potente y libre de rancidez hasta el momento exacto de la toma.'),
     ('Matriz EPA anti-inflamatoria',
      'Con una concentración potente del 30% de EPA, se encarga de apagar la inflamación sistémica tras el entrenamiento duro, reduciendo el dolor muscular y protegiendo el desgaste de rodillas y hombros.'),
     ('Matriz DHA para el cerebro',
      'Aporta un 22% de DHA puro, combustible esencial para el sistema nervioso. Maximiza la concentración y la nitidez mental, tanto para una rutina laboral exigente como para la conexión mente-músculo al entrenar.'),
   ]},

 'arthroblock-forte': {
   'pagina': 'p20',
   'presentacion': 'Caja de 60 cápsulas',
   'porciones': '30 tomas',
   'codigo': '5901330055270',
   'diferenciales': [
     ('Dúo regenerador',
      'Aporta los verdaderos "ladrillos del cartílago" usando exclusivamente glucosamina y condroitina en forma de sulfatos. Esta estructura química superior, a diferencia del HCl barato, es la única validada médicamente para detener el desgaste y reconstruir el tejido dañado.'),
     ('Lubricación hidráulica',
      'Provee el "aceite para tus engranajes" mediante una dosis alta de ácido hialurónico diseñada para densificar el líquido sinovial. Reduce la fricción "hueso con hueso" en rodillas y codos.'),
     ('Complejo anti-dolor natural',
      'Apaga el fuego de la inflamación sin fármacos mediante una matriz de Boswellia serrata y jengibre. Estos extractos reducen el dolor y la hinchazón post-entrenamiento, permitiendo movilidad inmediata.'),
     ('Tecnología Albion® y PureWay-C®',
      'Garantiza una estructura sólida gracias al manganeso quelado (Albion®) y a la vitamina C patentada. Estimulan al cuerpo a fabricar su propio colágeno fuerte y tendones resistentes.'),
   ]},
}


def escapar(t):
    return t.replace('\\', '\\\\').replace("'", "\\'")


def bloque_de(texto, pid):
    ini = texto.find("\n  '" + pid + "': {")
    if ini < 0:
        return None
    fin = texto.find('\n  },', ini + 1)
    if fin < 0:
        fin = texto.find('\n  }', ini + 1)     # el último producto cierra sin coma
    return (ini, fin) if fin > 0 else None


def cuantos(texto):
    return len(re.findall(r"\n  '[a-z0-9-]+': \{", texto))


def main():
    original = io.open(ARCHIVO, encoding='utf-8').read()
    s = original
    hechos, fallados = 0, []

    for pid, d in CATALOGO.items():
        lim = bloque_de(s, pid)
        if not lim:
            fallados.append(pid)
            continue
        ini, fin = lim
        bloque = s[ini:fin]

        # 1) Rellenar los campos que estaban vacíos con "⚠️ COMPLETAR"
        bloque = re.sub(r"presentacion: '',\s*//[^\n]*",
                        "presentacion: '%s'," % escapar(d['presentacion']), bloque)
        bloque = re.sub(r"porcionesPorEnvase: '',\s*//[^\n]*",
                        "porcionesPorEnvase: '%s'," % escapar(d['porciones']), bloque)
        if d.get('codigo'):
            bloque = re.sub(r"codigo: '',",
                            "codigo: '%s'," % d['codigo'], bloque)
        else:
            # Los productos con varias variantes no tienen un código único: el
            # de cada sabor/tamaño ya está en VITALICA_VARIANTES (data.js).
            bloque = re.sub(r"codigo: '',",
                            "codigo: '',   // varias variantes: ver VITALICA_VARIANTES en data.js",
                            bloque)

        # 2) Diferenciales del catálogo, si todavía no están
        if 'diferenciales:' not in bloque:
            filas = ',\n'.join(
                "      { titulo: '%s',\n        texto: '%s' }" % (escapar(t), escapar(x))
                for t, x in d['diferenciales'])
            nuevo = ("\n    /* Diferenciales del catálogo oficial (%s).\n"
                     "       Texto aprobado por marketing: no reescribir. */\n"
                     "    diferenciales: [\n%s\n    ],\n    galeria:"
                     % (d['pagina'], filas))
            bloque = bloque.replace('\n    galeria:', nuevo, 1)

        s = s[:ini] + bloque + s[fin:]
        hechos += 1
        print('  %-28s %s · %d diferenciales' % (pid, d['presentacion'], len(d['diferenciales'])))

    if cuantos(original) != cuantos(s):
        raise SystemExit('ABORTADO: cambió la cantidad de productos. No se escribe nada.')

    io.open(ARCHIVO, 'w', encoding='utf-8').write(s)
    print('\nproductos actualizados: %d de %d' % (hechos, len(CATALOGO)))
    if fallados:
        print('sin tocar: ' + ', '.join(fallados))
    quedan = original.count('COMPLETAR') - s.count('COMPLETAR')
    print('campos "COMPLETAR" resueltos: %d (quedan %d)' % (quedan, s.count('COMPLETAR')))


if __name__ == '__main__':
    main()
