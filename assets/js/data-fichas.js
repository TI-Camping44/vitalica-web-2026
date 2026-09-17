/* ============================================================================
   VITALICA — FICHA TÉCNICA AMPLIADA  (assets/js/data-fichas.js)
   ----------------------------------------------------------------------------
   Complementa —NO reemplaza— a VITALICA_FICHAS de data.js.

     data.js  → VITALICA_FICHAS           : stats, sabores, paginaCatalogo, porcion
     este     → VITALICA_FICHAS_TECNICAS  : presentación, formato, tabla
                                            nutricional y galería de fotos

   Se cargan los dos. El nombre es distinto a propósito para no pisar nada.

   ----------------------------------------------------------------------------
   DE DÓNDE SALEN LOS DATOS
   ----------------------------------------------------------------------------
   · La tabla nutricional está armada con los MISMOS valores que ya tenías en
     el campo `porcion` de data.js. No hay números inventados.
   · Los campos marcados  // ⚠️ COMPLETAR  están vacíos porque esa información
     no estaba en data.js. Mientras estén vacíos, esa fila no se muestra
     (no queda ningún hueco ni guion suelto). Cargalos cuando los tengas.

   ----------------------------------------------------------------------------
   GALERÍA DE FOTOS
   ----------------------------------------------------------------------------
   No hace falta editar nada: producto.js busca solo las fotos extra al lado
   de la principal, siguiendo el nombre del archivo.

     assets/img/products/whey-protein-complex.webp      ← principal (ya existe)
     assets/img/products/whey-protein-complex-2.webp    ← se detecta sola
     assets/img/products/whey-protein-complex-3.webp    ← se detecta sola
     assets/img/products/whey-protein-complex-4.webp
     assets/img/products/whey-protein-complex-5.webp

   Dejás el archivo en la carpeta y aparece la miniatura. Si no hay ninguno,
   la página queda exactamente como está hoy.
   Tamaño ideal: 1000 × 1000 px, fondo blanco o transparente, .webp.
   Orden sugerido: 2 = dorso con la tabla nutricional · 3 = producto en uso ·
   4 = detalle de la etiqueta · 5 = escala / tamaño real.

   Si preferís nombres distintos, usá el campo `galeria` de abajo (si tiene
   contenido, manda ese y se apaga la detección automática).
   ========================================================================== */

const VITALICA_FICHAS_TECNICAS = {

  /* ---------------------------------------------------------------- 01 */
  'whey-protein-complex': {
    formato: 'Polvo',
    presentacion: 'Bolsa de 700 g y de 2.270 g',
    porcionesPorEnvase: '20 medidas (700 g) · 67 medidas (2.270 g)',
    codigo: '',   // varias variantes: el EAN de cada una está en VITALICA_VARIANTES (data.js)
    /* Diferenciales del catálogo oficial (p05 y p06).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Tecnología CFM superior (no química)',
        texto: 'Filtrado de Flujo Cruzado que garantiza la máxima pureza y preserva las fracciones de crecimiento muscular, ofreciendo la más alta eficiencia.' },
      { titulo: 'Estándar farmacéutico europeo',
        texto: 'Fabricado bajo los controles rigurosos de Olimp Labs; producto libre de aspartamo, pureza y seguridad garantizadas.' },
      { titulo: 'Textura gourmet',
        texto: 'Consistencia cremosa y satisfactoria (tipo batido real), que mejora la experiencia de consumo frente a fórmulas acuosas.' },
      { titulo: 'Fórmula doble (WPC + WPI)',
        texto: 'Mezcla inteligente que optimiza la absorción para la recuperación y el crecimiento muscular magro.' }
    ],
    galeria: [
      'assets/img/products/variantes/5901330063985.png',
      'assets/img/products/variantes/5901330037986.png',
      'assets/img/products/variantes/5901330038006.png',
      'assets/img/products/variantes/5901330088261.png',
      'assets/img/products/variantes/5901330081705.jpg',
      'assets/img/products/variantes/5901330064029.png'
    ],
    nutricional: {
      porcion: '35 g (1 medidor) en 250–300 ml de agua o leche',
      columnas: ['Por porción (35 g)'],
      filas: [
        ['Energía',                                  '566 kJ / 134 kcal'],
        ['Grasas (de las cuales saturadas)',         '1,5 g (menos de 0,5 g)'],
        ['Carbohidratos (de los cuales azúcares)',   '3,9 g (1,4 g)'],
        ['Proteínas',                                '26 g'],
        ['Sal',                                      '0,30 g']
      ]
    }
  },

  /* ---------------------------------------------------------------- 02 */
  'creatine-monohydrate': {
    formato: 'Polvo micronizado 200 mesh',
    presentacion: 'Pote de 250 g y de 550 g',
    porcionesPorEnvase: '73 medidas (250 g) · 161 medidas (550 g)',
    codigo: '',   // varias variantes: ver VITALICA_VARIANTES en data.js
    /* Diferenciales del catálogo oficial (p13).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Estándar farmacéutico europeo',
        texto: 'La diferencia clave: Olimp trata su creatina con los mismos controles de calidad (GMP) que un medicamento, con análisis que superan el estándar alimenticio. Garantía de pureza y seguridad superior.' },
      { titulo: 'Micronización 200 mesh superior',
        texto: 'Malla 200, una micronización extremadamente fina que facilita la disolución y asegura una absorción intestinal máxima, minimizando cualquier malestar estomacal.' },
      { titulo: 'Fuerza y rendimiento máximo',
        texto: 'El suplemento más comprobado científicamente para aumentar la fuerza explosiva, la potencia y crear un entorno celular óptimo para la ganancia de masa muscular.' },
      { titulo: 'GLP (Good Laboratory Practice)',
        texto: 'Un estándar de seguridad superior. Mientras la industria se limita a normas de fabricación, la certificación GLP garantiza la integridad y calidad de los ensayos de laboratorio no clínicos: cada prueba de toxicidad y pureza está validada científicamente.' }
    ],
    galeria: [
      'assets/img/products/variantes/5901330026447.png',
      'assets/img/products/variantes/5901330026461.png'
    ],
    nutricional: {
      porcion: '3,4 g en 200–250 ml de agua, jugo o batido',
      columnas: ['Por porción (3,4 g)'],
      filas: [
        ['Energía',                   '0 kJ / 0 kcal'],
        ['Proteínas',                 '0 g'],
        ['Carbohidratos',             '0 g'],
        ['Grasas',                    '0 g'],
        ['Monohidrato de creatina',   '3,4 g']
      ]
    }
  },

  /* ---------------------------------------------------------------- 03 */
  'redweiler': {
    formato: 'Polvo',
    presentacion: 'Pote de 480 g',
    porcionesPorEnvase: '40 medidas',
    codigo: '',   // varias variantes: ver VITALICA_VARIANTES en data.js
    /* Diferenciales del catálogo oficial (p10).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Berserker’s Performance Blend',
        texto: 'Matriz de beta-alanina y creatina diseñada para anular la fatiga por ácido láctico. Permite mover cargas pesadas por más tiempo, retrasando el fallo muscular y aumentando la fuerza explosiva.' },
      { titulo: 'Armageddon Pump Formula',
        texto: 'Dosis masiva de citrulina y AAKG sin mezclas ocultas. Produce una vasodilatación extrema y transporte masivo de nutrientes al músculo desde la primera serie.' },
      { titulo: 'Concentrado de alta precisión',
        texto: 'Al eliminar azúcares y gasificantes innecesarios, evitás la pesadez y el malestar estomacal. Es pura potencia activa en un formato compacto que garantiza una digestión ligera y una absorción inmediata.' },
      { titulo: 'Red Fury Matrix',
        texto: 'Contiene una matriz de pimienta de cayena, piperina y capsaicina que genera una experiencia térmica real. Sentirás físicamente el calor de la activación, disparando la termogénesis y la sudoración.' }
    ],
    galeria: [
      'assets/img/products/variantes/redweiler-480g.png'
    ],
    nutricional: {
      porcion: '12 g, 15–30 min antes de entrenar',
      columnas: ['Por porción (12 g)'],
      filas: [
        ['Fórmula Armageddon Pump',                              '4702 mg'],
        ['L-arginina alfa-cetoglutarato',                        '2200 mg'],
        ['Malato de citrulina',                                  '1500 mg'],
        ['Citrato de sodio',                                     '1000 mg'],
        ['de los cuales sodio',                                  '230 mg'],
        ['Vitamina B6',                                          '1,86 mg (133 %*)'],
        ['Mezcla de rendimiento Berserker',                      '5080 mg'],
        ['Beta-alanina',                                         '2200 mg'],
        ['Monohidrato de creatina',                              '1500 mg'],
        ['Malato de creatina (malato de tricreatina TCM)',       '700 mg'],
        ['de los cuales creatina',                               '(1845 mg)'],
        ['Fosfato de calcio',                                    '646 mg'],
        ['de los cuales calcio',                                 '187,3 mg (23 %*)'],
        ['de los cuales fósforo',                                '145,3 mg (21 %*)'],
        ['Niacina (equivalente de niacina)',                     '32 mg (200 %*)'],
        ['Vitamina B1',                                          '1,84 mg (167 %*)'],
        ['Matriz Red Fury',                                      '520 mg'],
        ['L-tirosina',                                           '300 mg'],
        ['Cafeína',                                              '200 mg'],
        ['Extracto de pimienta de cayena',                       '14 mg'],
        ['de los cuales capsaicina',                             '(1,1 mg)'],
        ['Extracto de pimienta negra, de los cuales piperina',   '6 mg (5,7 mg)']
      ],
      nota: 'Contiene cafeína. No recomendado para menores de 18 años, embarazadas ni personas sensibles a la cafeína.'
    }
  },

  /* ---------------------------------------------------------------- 04 */
  'knockout-2': {
    formato: 'Polvo',
    presentacion: 'Pote de 305 g',
    porcionesPorEnvase: '50 medidas',
    codigo: '5901330056291',
    /* Diferenciales del catálogo oficial (p11).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Impacto de energía real',
        texto: 'Con 200 mg de cafeína, aporta un 33% más de potencia que los productos estándar, eliminando el cansancio al instante en usuarios avanzados con alta tolerancia.' },
      { titulo: 'Doble activación térmica',
        texto: 'Matriz de pimienta y capsaicina que eleva la temperatura corporal en 15 minutos, activando la termogénesis y la sudoración para maximizar la quema de calorías.' },
      { titulo: 'Energía "seca" y limpia',
        texto: 'Fórmula sin creatina que evita la retención de líquidos e hinchazón, ideal para definir o ganar potencia sin peso extra por agua.' },
      { titulo: 'Resistencia y enfoque mental',
        texto: 'Con 2.100 mg de beta-alanina para retrasar la fatiga muscular, sumado a L-tirosina y taurina que aseguran enfoque mental sin taquicardias ni bajones de energía.' }
    ],
    galeria: [
      'assets/img/products/variantes/5901330056291.png'
    ],
    nutricional: {
      porcion: '6,1 g, 15–30 min antes de entrenar',
      columnas: ['Por porción (6,1 g de polvo)'],
      filas: [
        ['Beta-alanina',                                          '2100 mg'],
        ['L-arginina',                                            '1100 mg'],
        ['L-citrulina',                                           '600 mg'],
        ['Taurina',                                               '600 mg'],
        ['Cafeína',                                               '200 mg'],
        ['Extracto de pimienta de cayena (Capsicum annuum L.)',   '25 mg'],
        ['de la cual capsaicina 8%',                              '(2,0 mg)'],
        ['Extracto de pimienta negra (Piper nigrum L.)',          '7,5 mg'],
        ['de la cual piperina 95%',                               '(7,1 mg)']
      ],
      nota: 'Contiene cafeína. No recomendado para menores de 18 años, embarazadas ni personas sensibles a la cafeína.'
    }
  },

  /* ---------------------------------------------------------------- 05 */
  'beta-alanina-xplode': {
    formato: 'Polvo',
    presentacion: 'Pote de 250 g',
    porcionesPorEnvase: '50 medidas',
    codigo: '5901330077739',
    /* Diferenciales del catálogo oficial (p15).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Sistema de transporte de ácido intracelular',
        texto: 'Defensa interna. Suministramos beta-alanina junto con L-histidina para asegurar la creación de carnosina dentro de la fibra muscular. Actúa como una esponja que absorbe el ácido láctico justo donde nace, permitiéndote entrenar más fuerte antes de sentir ardor.' },
      { titulo: 'Sistema de transporte de ácido extracelular',
        texto: 'Limpieza externa. No basta con proteger el músculo: hay que limpiar la sangre. La fórmula incluye buffers especiales (como el bicarbonato) que ayudan a expulsar y neutralizar el ácido que sale del músculo hacia el torrente sanguíneo, retrasando la fatiga general.' },
      { titulo: 'Brand New Approach',
        texto: 'Guerra en dos frentes. Mientras otras marcas solo dan ingredientes sueltos, Olimp usa una estrategia dual: protege el músculo por dentro y limpia la sangre por fuera.' },
      { titulo: 'Fórmula "Beta-Rush" completa',
        texto: 'El motor de la absorción. La mezcla se potencia con vitamina B6, clave para el metabolismo energético, lo que asegura que el transporte de los aminoácidos sea inmediato y eficiente.' }
    ],
    galeria: [
      'assets/img/products/variantes/5901330077739.png'
    ],
    nutricional: {
      porcion: '9,6 g en 300 ml de agua',
      columnas: ['Por porción (9,6 g)'],
      filas: [
        ['Fórmula de entrenamiento Beta-RUSH',                       ''],
        ['Beta-alanina',                                             '1600 mg'],
        ['Vitamina B6',                                              '0,98 mg (70 %*)'],
        ['Sistema de transporte de ácido intracelular',              ''],
        ['Sales de potasio de ácido ortofosfórico',                  '220 mg'],
        ['de los cuales potasio',                                    '96,3 mg'],
        ['de los cuales fósforo',                                    '35 mg (5 %*)'],
        ['Clorhidrato de L-histidina (de los cuales L-histidina)',   '80 mg (64,8 mg)'],
        ['Sistema de transporte de ácido extracelular',              ''],
        ['Bicarbonato de sodio (de los cuales sodio)',               '400 mg (109,5 mg)']
      ]
    }
  },

  /* ---------------------------------------------------------------- 06 */
  'iso-plus-powder': {
    formato: 'Polvo',
    presentacion: 'Pote de 700 g y bolsa de 1.505 g',
    porcionesPorEnvase: '40 medidas (700 g) · 86 medidas (1.505 g)',
    codigo: '',   // varias variantes: ver VITALICA_VARIANTES en data.js
    /* Diferenciales del catálogo oficial (p08).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Vitamin Complex',
        texto: 'Te brinda una sensación de energía limpia y vitalidad constante. Evita esa pesadez y "niebla mental" que aparece a mitad de la rutina, permitiéndote sentirte fresco, lúcido y con capacidad de respuesta hasta la última repetición.' },
      { titulo: 'Matriz isotónica real y completa',
        texto: 'Una fórmula científicamente balanceada que repone simultáneamente electrolitos y evita los calambres y el bajo rendimiento.' },
      { titulo: 'Máximo rendimiento y economía',
        texto: 'Proporciona un producto de calidad superior a un costo por litro significativamente más económico que las alternativas comerciales embotelladas.' },
      { titulo: 'Fórmula inteligente de doble acción',
        texto: 'Va más allá de la reposición de sales: está enriquecido con L-Carnitina para optimizar la quema de grasa mientras entrenás, y L-Glutamina para una recuperación muscular más rápida y eficiente.' }
    ],
    galeria: [
      'assets/img/products/variantes/5901330024214.webp',
      'assets/img/products/variantes/5901330024207.webp',
      'assets/img/products/variantes/5901330024221.png',
      'assets/img/products/variantes/5901330037726.jpg',
      'assets/img/products/variantes/5901330037924.jpg'
    ],
    nutricional: {
      // Decía 500 ml justo arriba de una columna que dice 250 ml. El dato
      // nutricional del catálogo (p08) está medido con 250 ml, así que manda
      // ese. La guía de uso sigue explicando que en calor o entrenos largos
      // se puede llevar a 500 ml — eso es dosificación, no la tabla.
      porcion: '17,5 g en 250 ml de agua',
      columnas: ['Por porción (17,5 g) + 250 ml de agua'],
      filas: [
        ['Energía',                                  '255 kJ / 60 kcal'],
        ['Grasas (de las cuales saturadas)',         '0 g (0 g)'],
        ['Carbohidratos (de los cuales azúcares)',   '15 g (12 g)'],
        ['Proteínas',                                '0 g'],
        ['Sal',                                      '0,29 g']
      ]
    }
  },

  /* ---------------------------------------------------------------- 07 */
  'vitamin-multiple-sport': {
    formato: 'Cápsulas',
    presentacion: 'Caja de 60 cápsulas',
    porcionesPorEnvase: '30 tomas',
    codigo: '5901330043628',
    /* Diferenciales del catálogo oficial (p17).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Tecnología Vita-Plex®',
        texto: 'Vitaminas de nueva generación. No son vitaminas genéricas: es una matriz compleja de vitaminas esenciales (incluyendo espectro B completo) diseñada para cubrir el déficit energético que se produce tras entrenamientos intensos.' },
      { titulo: 'Tecnología Chela-Min®',
        texto: 'Minerales con patente mundial. Contiene exclusivamente minerales quelados Albion® (Gold Medallion). Esto garantiza que el zinc, el magnesio y el hierro sean absorbidos realmente por tu cuerpo y no desechados como ocurre con las marcas baratas.' },
      { titulo: 'Sistema "químicamente estable"',
        texto: 'Separados para funcionar mejor. Al tener las vitaminas y los minerales en cápsulas distintas, se evitan las interferencias químicas negativas que ocurren en los multivitamínicos "todo en uno". Cada nutriente mantiene su potencia intacta.' },
      { titulo: 'Complejo Hepa-Prost Detox',
        texto: 'Limpieza y definición. Dentro de la cápsula Vita-Plex se añaden extractos naturales de alcachofa, ortiga y té verde. Ayuda a limpiar el hígado y a eliminar la retención de líquidos mientras te nutre.' }
    ],
    galeria: [
      'assets/img/products/nutricional/vitamin-multiple-sport.jpg'
    ],
    nutricional: {
      porcion: '1 cápsula por día, con una comida',
      columnas: ['Por porción (1 cápsula)'],
      filas: [
        ['Vitamina A',                            '800 µg (100 %*)'],
        ['Vitamina D',                            '10 µg (200 %*)'],
        ['Vitamina E',                            '24 mg (200 %*)'],
        ['Vitamina C (PureWay-C)',                '290 mg (362 %*)'],
        ['Vitamina B1',                           '19,4 mg (1764 %*)'],
        ['Vitamina B2',                           '19,6 mg (1400 %*)'],
        ['Niacina',                               '31 mg (194 %*)'],
        ['Vitamina B6',                           '18,8 mg (1286 %*)'],
        ['Folacina',                              '400 µg (200 %*)'],
        ['Vitamina B12',                          '23 µg (920 %*)'],
        ['Biotina',                               '100 µg (200 %*)'],
        ['Ácido pantoténico',                     '12 mg (200 %*)'],
        ['Bioflavonoides cítricos 40%',           '100 mg'],
        ['Extracto de alcachofa 5% cinarinas',    '80 mg'],
        ['Extracto de semilla de calabaza 5:1',   '60 mg'],
        ['Extracto de ortiga',                    '60 mg'],
        ['Extracto de té verde 55% EGCG',         '60 mg'],
        ['de los cuales epigalocatequina',        '33 mg'],
        ['ALA (ácido alfa lipoico)',              '10 mg'],
        ['Extracto de pimienta negra (95%)',      '1 mg']
      ]
    }
  },

  /* ---------------------------------------------------------------- 08 */
  'vitamin-multiple-sport-40': {
    formato: 'Cápsulas',
    presentacion: 'Caja de 60 cápsulas',
    porcionesPorEnvase: '30 tomas',
    codigo: '5901330054853',
    /* Diferenciales del catálogo oficial (p18).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Fórmula específica "Master 40+"',
        texto: 'Ingeniería para el hombre maduro. A los 40, el metabolismo cambia. Esta fórmula no es genérica: está calibrada exactamente para las necesidades metabólicas, hormonales y energéticas de un atleta que supera las cuatro décadas.' },
      { titulo: 'Potenciador KSM-66® (ashwagandha)',
        texto: 'Control de estrés y hormonas. Incluye el extracto de raíz de ashwagandha más puro del mundo (KSM-66). Actúa como un adaptógeno potente que reduce el estrés (cortisol) y favorece un entorno hormonal saludable.' },
      { titulo: 'Escudo prostático (saw palmetto)',
        texto: 'Mantenimiento preventivo. Pensando en la salud a largo plazo, se añade extracto de saw palmetto (palmito americano), ingrediente clave para cuidar la salud de la próstata.' },
      { titulo: 'Minerales quelados Albion®',
        texto: 'Absorción premium. Se usan minerales con patente Albion®, que garantizan que el cuerpo absorba el 100% de los nutrientes sin causar pesadez estomacal, algo crucial cuando el sistema digestivo se vuelve más sensible con los años.' }
    ],
    galeria: [
      'assets/img/products/nutricional/vitamin-multiple-sport-40.jpg'
    ],
    nutricional: {
      porcion: '2 cápsulas por día, con una comida',
      columnas: ['Por porción (2 cápsulas)'],
      filas: [
        ['Vitamina A',                          '800 µg (100 %*)'],
        ['Vitamina D',                          '10 µg (200 %*)'],
        ['Vitamina E',                          '24 mg (200 %*)'],
        ['Vitamina K',                          '75 µg (100 %*)'],
        ['Vitamina C (PureWay-C)',              '290 mg (363 %*)'],
        ['Tiamina (vitamina B1)',               '19,4 mg (1764 %*)'],
        ['Riboflavina (vitamina B2)',           '19,6 mg (1400 %*)'],
        ['Niacina',                             '31 mg (194 %*)'],
        ['Vitamina B6',                         '18,8 mg (1286 %*)'],
        ['Ácido fólico',                        '400 µg (200 %*)'],
        ['Vitamina B12',                        '23 µg (920 %*)'],
        ['Biotina',                             '100 µg (200 %*)'],
        ['Ácido pantoténico',                   '12 mg (200 %*)'],
        ['Extracto de fruto de saw palmetto',   '100 mg'],
        ['Extracto de ashwagandha KSM-66',      '50 mg'],
        ['de los cuales withanólidos (5%)',     '2,5 mg']
      ]
    }
  },

  /* ---------------------------------------------------------------- 09 */
  'gold-omega-3-sport': {
    formato: 'Cápsulas blandas',
    presentacion: 'Caja de 120 cápsulas',
    porcionesPorEnvase: '120 tomas',
    codigo: '5901330030581',
    /* Diferenciales del catálogo oficial (p19).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Concentración Gold',
        texto: 'Mientras el estándar del mercado solo ofrece un 30% de pureza, Olimp garantiza un 65% real de ácidos grasos. Cada cápsula entrega más del doble de principios activos que las marcas masivas de supermercado.' },
      { titulo: 'Protección blíster',
        texto: 'El aceite de pescado se oxida en los botes comunes. La tecnología de blíster individual asegura que cada cápsula se mantenga fresca, potente y libre de rancidez hasta el momento exacto de la toma.' },
      { titulo: 'Matriz EPA anti-inflamatoria',
        texto: 'Con una concentración potente del 30% de EPA, se encarga de apagar la inflamación sistémica tras el entrenamiento duro, reduciendo el dolor muscular y protegiendo el desgaste de rodillas y hombros.' },
      { titulo: 'Matriz DHA para el cerebro',
        texto: 'Aporta un 22% de DHA puro, combustible esencial para el sistema nervioso. Maximiza la concentración y la nitidez mental, tanto para una rutina laboral exigente como para la conexión mente-músculo al entrenar.' }
    ],
    galeria: [
      'assets/img/products/nutricional/gold-omega-3-sport.jpg'
    ],
    nutricional: {
      porcion: '1 cápsula por día, con una comida',
      columnas: ['Por porción (1 cápsula)'],
      filas: [
        ['Grasas (aceite de pescado), de las cuales:',   '1000 mg'],
        ['Ácido eicosapentaenoico 33% EPA',              '330 mg'],
        ['Ácido docosahexaenoico 22% DHA',               '220 mg'],
        ['Otros ácidos grasos omega-3 10%',              '100 mg'],
        ['Vitamina E',                                   '12 mg (100 %*)']
      ],
      nota: 'Contiene pescado.'
    }
  },

  /* ---------------------------------------------------------------- 10 */
  'arthroblock-forte': {
    formato: 'Cápsulas',
    presentacion: 'Caja de 60 cápsulas',
    porcionesPorEnvase: '30 tomas',
    codigo: '5901330055270',
    /* Diferenciales del catálogo oficial (p20).
       Texto aprobado por marketing: no reescribir. */
    diferenciales: [
      { titulo: 'Dúo regenerador',
        texto: 'Aporta los verdaderos "ladrillos del cartílago" usando exclusivamente glucosamina y condroitina en forma de sulfatos. Esta estructura química superior, a diferencia del HCl barato, es la única validada médicamente para detener el desgaste y reconstruir el tejido dañado.' },
      { titulo: 'Lubricación hidráulica',
        texto: 'Provee el "aceite para tus engranajes" mediante una dosis alta de ácido hialurónico diseñada para densificar el líquido sinovial. Reduce la fricción "hueso con hueso" en rodillas y codos.' },
      { titulo: 'Complejo anti-dolor natural',
        texto: 'Apaga el fuego de la inflamación sin fármacos mediante una matriz de Boswellia serrata y jengibre. Estos extractos reducen el dolor y la hinchazón post-entrenamiento, permitiendo movilidad inmediata.' },
      { titulo: 'Tecnología Albion® y PureWay-C®',
        texto: 'Garantiza una estructura sólida gracias al manganeso quelado (Albion®) y a la vitamina C patentada. Estimulan al cuerpo a fabricar su propio colágeno fuerte y tendones resistentes.' }
    ],
    galeria: [
      'assets/img/products/nutricional/arthroblock-forte.jpg'
    ],
    nutricional: {
      porcion: 'Según indicación del envase, con una comida',
      columnas: ['Por porción (2 cápsulas)'],
      filas: [
        ['Sulfato de glucosamina 2KCl (del cual sulfato de glucosamina)',   '1000 mg (750 mg)'],
        ['Sulfato de condroitina',                                          '200 mg'],
        ['Ácido hialurónico',                                               '50 mg'],
        ['Extracto de Boswellia serrata (60 % de ácido boswélico)',         '100 mg'],
        ['Extracto de jengibre (5 % de gingeroles)',                        '100 mg'],
        ['Vitamina C',                                                      '60 mg (75 %*)'],
        ['Manganeso (Albion)',                                              '1,8 mg (90 %*)']
      ]
    }
  }

};
