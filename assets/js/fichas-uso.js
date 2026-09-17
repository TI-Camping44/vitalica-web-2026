/* ==========================================================================
   VITALICA — fichas-uso.js  ·  FICHAS DE USO POR PRODUCTO
   --------------------------------------------------------------------------
   NO EDITAR A MANO. Este archivo lo genera herramientas/guias-a-datos.py
   a partir de los documentos de marketing (Drive: FICHA TÉCNICA DE USO >
   FICHAS DE USO), bajados a _drive/guias/*.txt.

   Si marketing cambia una ficha: volvé a bajar el .txt y corré
       python herramientas/guias-a-datos.py

   Las claves son ids de VITALICA_PRODUCTOS (data.js). La ficha de
   Vita-min Multiple Sport se usa para la versión normal y la 40+.
   ========================================================================== */
const VITALICA_FICHAS_USO = {
  "arthroblock-forte": {
    "titulo": "ARTHROBLOCK FORTE",
    "bajada": "Ingeniería de Reconstrucción Articular",
    "secciones": [
      {
        "titulo": "EL DIFERENCIAL \"FORTE\": 7 INGREDIENTES EN 1",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A diferencia de los protectores simples de farmacia, Arthroblock Forte combina 7 componentes activos que trabajan en sinergia. No solo \"lubrica\", sino que ayuda a reconstruir el tejido conectivo."
          },
          {
            "tipo": "vineta",
            "texto": "Ingredientes: Glucosamina, Condroitina, Ácido Hialurónico, Boswellia Serrata, Jengibre, Vitamina C y Manganeso Quelado (Albion®).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Resultado: No solo ataca la inflamación, sino que le da al cuerpo los \"ladrillos\" para reparar cartílagos, tendones y ligamentos desgastados.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN SEGÚN TU OBJETIVO",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Mantenimiento y Prevención (Atletas y Master 40+):",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis: 1 cápsula diaria en el desayuno o almuerzo. Ideal para quienes no tienen dolor agudo pero quieren proteger sus rodillas y hombros del impacto",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Recuperación e Inflamación (Dolor o Lesión):",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis: 1 cápsula, 2 veces al día.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Protocolo: Una después del almuerzo y otra después de la cena. Esto mantiene los niveles de reconstrucción activos durante las 24 horas.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Descanso Inteligente: Una vez completado el ciclo (aprox. 2 botes de Arthroblock), realizá un descanso de 30 días antes de volver a empezar. Esto permite que tu sistema procese los nutrientes y evalúes la mejora real de tu movilidad.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Consistencia de Acero: La salud articular no mejora de la noche a la mañana. Los estudios de Olimp Labs muestran que los beneficios reales se consolidan después de 2 a 3 meses de uso continuo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Siempre con Comida: Tomalo después de una comida sólida. Ingredientes como el jengibre y la boswellia son potentes y se absorben mejor con el estómago lleno, evitando cualquier sensibilidad gástrica.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "El Combo de Oro: Para resultados máximos, combinalo con tu Gold Omega 3. El aceite de pescado ayuda a reducir la inflamación sistémica, permitiendo que el Arthroblock se enfoque al 100% en reconstruir el cartílago.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores que frenan tu progreso)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No es un analgésico instantáneo: Si te duele hoy y tomás una cápsula, no se te va a pasar el dolor en 20 minutos. El Arthroblock no apaga la alarma del dolor, lo que hace es arreglar el problema de raíz reconstruyendo la articulación.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No interrumpas el ciclo: Si parás a la semana porque \"ya te sentís mejor\", la reconstrucción se detiene. Completá el ciclo de al menos 60 días para que el tejido sea realmente más fuerte.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo tomes solo con agua en ayunas: Los extractos naturales de plantas (Boswellia y Jengibre) son muy activos y pueden caer pesados si no hay alimento en el sistema.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Semanas 1-2: Notarás una leve reducción en la rigidez al despertar o al empezar a moverte.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Semana 4 en adelante: Los movimientos se sienten más \"suaves\". Ese dolor punzante tras el partido de Pádel o el entrenamiento pesado empieza a disminuir.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Mes 2: Mejora notable en la movilidad y resistencia de los tejidos.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "CONSERVACIÓN (Factor Paraguay)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Protección del Blister: Al igual que los multivitamínicos, Arthroblock utiliza la tecnología Mega Caps.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Instrucción: Mantené las cápsulas dentro de su blister de aluminio hasta el momento exacto de la toma. No las guardes sueltas en pastilleros de plástico por muchos días; el aire húmedo de Asunción puede degradar el ácido hialurónico y la vitamina C.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "beta-alanina-xplode": {
    "titulo": "BETA-ALANINA",
    "bajada": "Blindaje contra la Fatiga Muscular",
    "secciones": [
      {
        "titulo": "¿QUÉ ES Y PARA QUÉ SIRVE?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "La Beta-Alanina es un aminoácido que aumenta los niveles de carnosina en tus músculos."
          },
          {
            "tipo": "vineta",
            "texto": "En español simple: Actúa como un \"escudo\" que neutraliza el ácido láctico (ese ardor que sentís cuando tus músculos queman).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Resultado: Te permite hacer 2 o 3 repeticiones extra, aguantar un set más largo o mantener la potencia en el último esfuerzo. Te da resistencia muscular real.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL EFECTO \"PICOR\" (Parestesia): TU SEÑAL DE ACTIVACIÓN",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A los 10-15 minutos de tomarla, es muy probable que sientas un hormigueo o picazón en la cara, cuello, orejas o manos. Es normal y seguro: Se llama parestesia. No es una alergia ni un efecto secundario malo; es la señal de que la Beta-Alanina está interactuando con tus terminaciones nerviosas y empezando a trabajar."
          },
          {
            "tipo": "vineta",
            "texto": "Tip: Si la sensación te molesta mucho, podés dividir tu dosis diaria en dos tomas más pequeñas. Con el uso continuo, el cuerpo se acostumbra y el picor disminuye.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN (Estrategia VITALICA)",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Al igual que la creatina, la Beta-Alanina funciona por acumulación. Lo más importante es la constancia diaria para \"saturar\" los músculos."
          },
          {
            "tipo": "parrafo",
            "texto": "Dosis Estándar:"
          },
          {
            "tipo": "parrafo",
            "texto": "3,2g diarios, (1 scoop)."
          },
          {
            "tipo": "vineta",
            "texto": "¿Cuándo tomarla?: * Días de entrenamiento: 20-30 minutos antes de empezar.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Días de descanso: En cualquier momento del día (preferentemente con una comida) para mantener los niveles musculares altos.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "El Atleta"
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 4,8 ag a 6,4g diarios. (1,5 a 2 scoops)",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Estrategia: A mayor dosis, mayor capacidad de \"buffer\" (limpieza de acidez). Si el atleta pesa más de 85kg-90kg de masa muscular, 3,2 g se le van a quedar cortos. Para evitar que el picor sea insoportable, debe dividir la toma: antes de entrenar y en otra comida.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "El Perfil de Estética y Fuerza (Gimnasio / Hipertrofia)"
          },
          {
            "tipo": "parrafo",
            "texto": "Aquí los esfuerzos son cortos (series de 8 a 12 repeticiones). El músculo no llega a acumular tanta acidez como en un deporte de fondo."
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 3.2g diarios (1 scoop).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Estrategia: Con esta dosis es suficiente para ganar esas 2 repeticiones extra al final de una serie pesada de sentadillas.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "El Perfil de \"Carga Rápida\" (Saturación)"
          },
          {
            "tipo": "parrafo",
            "texto": "Si un cliente tiene una competencia en 2 semanas y no estaba tomando Beta-Alanina, podemos hacer una \"fase de carga\"."
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 6,4g diarios (divididos en 2 tomas de 3,2g) durante las primeras 2 semanas.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Resultado: Saturamos los depósitos de carnosina más rápido, pero hay que advertirle que va a sentir el hormigueo con más frecuencia.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (El Combo Ganador)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Sinergia con Creatina: La ciencia demuestra que la Beta-Alanina y la Creatina juntas funcionan mucho mejor que por separado. La creatina te da fuerza explosiva y la Beta-Alanina te da resistencia. Es el combo perfecto para cualquier deporte.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Consistencia: No sirve de mucho tomarla solo un día. Los beneficios reales se empiezan a notar a partir de las 2 o 3 semanas de uso diario, cuando tus niveles de carnosina muscular están a tope.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores comunes)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No te asustes por el picor: Como mencionamos, es parte del proceso. Disfrutalo como la señal de que \"el motor está arrancando\".",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No la tomes con el estómago vacío si sos sensible: Si tenés el estómago muy delicado, tomala después de una fruta o comida ligera para evitar molestias.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No esperes efectos inmediatos de fuerza: La Beta-Alanina no te hace más fuerte de un día para otro, lo que hace es que tardes más en cansarte.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Semana 1: Sentirás el hormigueo intenso y una ligera mejora en la recuperación entre series.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Semana 3 en adelante: Notarás que ese \"ardor\" muscular que te obligaba a parar, ahora aparece mucho más tarde. Tus entrenamientos serán más largos y productivos.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "creatine-monohydrate": {
    "titulo": "CREATINA MONOHIDRATO",
    "bajada": "",
    "secciones": [
      {
        "titulo": "EL DIFERENCIAL OLIMP: ¿POR QUÉ ES LIGERA?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A diferencia de otras creatinas que parecen arena, la creatina de Olimp Labs está micronizada a Malla 200 (200 Mesh). Las partículas son tan finas que se disuelven mejor y, lo más importante, se absorben más rápido en el intestino, evitando la hinchazón estomacal común en las otras marcas.."
          },
          {
            "tipo": "parrafo",
            "texto": "👤 GUÍA DE DOSIFICACIÓN SEGÚN TU PERFIL"
          }
        ]
      },
      {
        "titulo": "El Atleta de Alto Rendimiento",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Objetivo: Máxima fuerza y performance.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 5 gramos diarios",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: Un cuerpo con alta masa muscular y alto nivel de exigencia agota las reservas de ATP (energía celular) muy rápido. Los 5g aseguran que el \"tanque\" esté siempre lleno para el próximo esfuerzo",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "La Mujer Activa",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Objetivo: Definición muscular (tonificación), mejora del estado de ánimo y salud ósea.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 3 gramos diarios (1 scoop de Olimp).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: Las mujeres suelen tener menos masa muscular total que los hombres, por lo que 3g son suficientes para saturar sus depósitos. La creatina en mujeres es clave para la salud del cerebro y ayuda a compensar los cambios de energía durante el ciclo menstrual sin causar una retención de líquido notable.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "El Ejecutivo y el Master 40+",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Objetivo: Nitidez mental, protección contra la pérdida de músculo por la edad y salud ósea.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis Recomendada: 3 gramos diarios.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: Estudios recientes muestran que la creatina actúa como un nootrópico, mejorando la memoria de trabajo y reduciendo la fatiga mental tras un día largo de oficina. A partir de los 40 en adelante, ayuda a mantener la densidad mineral de los huesos.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovecha al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Hidratación Crítica: La creatina hidrata tus células. Para que funcione, debes aumentar tu consumo de agua diario (mínimo 2-3 litros). Si no te hidratas, la creatina no tiene agua que \"meter\" al músculo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "No requiere descanso: No es necesario hacer \"ciclos\" ni \"fases de carga\". Puedes consumirla de forma continua todo el año.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Combínala con carbohidratos: Tomarla junto a una comida (almuerzo) o una fruta aumenta la absorción gracias a la insulina.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Días de descanso también se toma: La creatina no es un pre-entreno de efecto inmediato; funciona por acumulación. La consistencia diaria es clave.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "¿QUÉ NO HACER? (Errores que frenan tu progreso)"
          },
          {
            "tipo": "vineta",
            "texto": "No hagas \"Fase de Carga\": Eso de tomar 20g al día la primera semana es una técnica vieja para que se te acabe el producto rápido. Con 3-5g diarios llegas al mismo nivel en 20 días sin estresar tu estómago.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No la dejes preparada en el termo: Si mezclas la creatina con agua y la dejas ahí por horas (ej. la preparas a la mañana para tomar a la tarde), se convierte en creatinina (desecho) y pierde su efecto. Mézclala y tómala en el momento.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No temas a la \"Retención de Líquidos\": La creatina retiene agua dentro del músculo, no debajo de la piel. No te verás hinchado; te verás con los músculos más densos y definidos.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No la tomes con el estómago vacío: Puede causar ligeras molestias en personas sensibles. Siempre mejor con comida.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No la mezcles con líquidos hirviendo: El calor extremo puede degradar la molécula de creatina.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "¿CUÁNDO VERÁS RESULTADOS? (Gestión de Expectativas)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Fase de Saturación (Días 1-15): La creatina está llenando tus depósitos musculares. Quizás no sientas nada aún, pero la magia ocurre por dentro.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Fase de Rendimiento (Día 20 en adelante): Empezarás a notar que esa \"última repetición\" que antes no salía, ahora sale. Notarás tus músculos con mayor tono y una recuperación más rápida entre series.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "Conservación en Clima Extremo",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Cuidado con la humedad: Como la creatina de Olimp es tan fina (Malla 200), es muy sensible a la humedad de Paraguay.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Instrucción: Mantener el bote en un lugar fresco y seco (lejos de la cocina o el baño). Asegúrate de cerrar bien la tapa inmediatamente después de usarla para evitar que el polvo se compacte.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "gold-omega-3-sport": {
    "titulo": "GOLD OMEGA 3 (65%)",
    "bajada": "Ingeniería de Protección Cardiovascular y Cerebral",
    "secciones": [
      {
        "titulo": "¿POR QUÉ EL GOLD OMEGA 3 ES SUPERIOR?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "La mayoría de los Omegas comerciales tienen solo un 30% de pureza. El Gold Omega 3 de Olimp es un concentrado al 65%."
          },
          {
            "tipo": "vineta",
            "texto": "El Diferencial: Contiene altas dosis de EPA (salud del corazón e inflamación) y DHA (cerebro y vista).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Pureza Farmacéutica: Es libre de metales pesados y toxinas que suelen encontrarse en aceites de pescado de baja calidad. Al ser ultra puro, minimiza el olor y el sabor a pescado.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN SEGÚN TU PERFIL",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Como es muy concentrado, una sola cápsula de Olimp equivale a tres de una marca común."
          },
          {
            "tipo": "vineta",
            "texto": "Salud General y Mantenimiento: 1 cápsula diaria. Ideal para prevenir el colesterol y cuidar la salud cerebral.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Atletas de Alto Rendimiento: 2 cápsulas diarias. Ayuda a reducir la inflamación articular y muscular después de entrenamientos intensos.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Perfil Ejecutivo (Alto Estrés Mental): 2 cápsulas diarias. El DHA es el principal componente graso de tu cerebro; ayuda a la concentración y claridad mental.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL MOMENTO IDEAL (Sinergia con grasas)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Con la comida principal: Tomalo siempre con el almuerzo o la cena.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Si tomás dos pastillas, podes dividirlas una en el desayuno o almuerzo y otra en la cena.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: El Omega 3 es una grasa y necesita de otras grasas de tu comida para que tu cuerpo lo absorba correctamente. Además, tomarlo con comida sólida evita cualquier posible reflujo con sabor a pescado.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Consistencia: El beneficio del Omega 3 es acumulativo. No sirve tomarlo \"de vez en cuando\". Los beneficios reales en las articulaciones y el corazón se ven tras un uso continuo de 3 a 4 semanas.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Combinación Estrella: Si tomás VITA-MIN MULTIPLE SPORT, tomalos juntos. Las vitaminas A, D, E y K del multivitamínico se absorben mucho mejor en presencia del aceite del Omega 3.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores críticos)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No lo dejes en el auto ni bajo el sol: El calor extremo de Paraguay es el peor enemigo del Omega 3. Las grasas se \"rancian\" (oxidan) con el calor, perdiendo su efecto y volviéndose pesadas para el estómago.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo tomes con café o bebidas hirviendo: El calor del líquido puede derretir la cápsula de gel antes de tiempo y el calor excesivo degrada los ácidos grasos.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo tomes con el estómago vacío: Podrías desperdiciar gran parte del producto porque tu sistema digestivo no activará las enzimas necesarias para absorber grasas.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "A corto plazo: Mejora en la hidratación de la piel y los ojos.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "A mediano plazo (1 mes): Menos rigidez en las articulaciones al despertar y mejor recuperación muscular post-entreno.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "A largo plazo: Protección arterial, control de triglicéridos y una función cognitiva más ágil.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "iso-plus-powder": {
    "titulo": "ISO PLUS",
    "bajada": "Ingeniería de Rehidratación y Energía Sostenida",
    "secciones": [
      {
        "titulo": "¿POR QUÉ ISO PLUS?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "No es una simple bebida deportiva de supermercado; es una fórmula de grado farmacéutico diseñada para dominar la Presión Osmótica (el equilibrio perfecto de sales y azúcares)."
          },
          {
            "tipo": "vineta",
            "texto": "El Diferencial: Combina carbohidratos de absorción rápida con una matriz completa de electrolitos y L-Carnitina.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "El Poder de la L-Carnitina: Este componente estimula a tu metabolismo para utilizar la grasa como fuente de energía sostenida, permitiendo que tus reservas de glucógeno duren más tiempo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Resultado: Hidratación instantánea, músculos sin calambres y energía optimizada durante todo el esfuerzo.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL FACTOR PUREZA: SOBRE EL POLVO COMPACTO",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "En Paraguay, nuestra alta humedad es el mayor desafío. Es normal que el polvo se endurezca o forme grumos."
          },
          {
            "tipo": "vineta",
            "texto": "Garantía de Calidad: Esto ocurre porque Olimp Labs no utiliza antiaglomerantes químicos pesados. El polvo es tan puro que atrae la humedad natural del aire.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Instrucción: Si esto pasa, no te preocupes; el producto mantiene el 100% de su eficacia. Solo agitá el bote o rompé los bloques con un utensilio. Se disolverá perfectamente al contacto con el agua.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "________________"
          }
        ]
      },
      {
        "titulo": "PROTOCOLO DE USO SEGÚN TU ACTIVIDAD",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Perfil / Actividad"
          },
          {
            "tipo": "parrafo",
            "texto": "Mezcla Recomendada"
          },
          {
            "tipo": "parrafo",
            "texto": "Objetivo"
          },
          {
            "tipo": "parrafo",
            "texto": "Entrenamiento Moderado (1 hora)"
          },
          {
            "tipo": "parrafo",
            "texto": "1 scoop (17.5g) en 250ml de agua."
          },
          {
            "tipo": "parrafo",
            "texto": "Mantener hidratación y evitar fatiga básica."
          },
          {
            "tipo": "parrafo",
            "texto": "Entrenamiento Intenso / Calor Extremo"
          },
          {
            "tipo": "parrafo",
            "texto": "2 scoops en 500ml de agua por hora."
          },
          {
            "tipo": "parrafo",
            "texto": "Reponer sales perdidas por sudor masivo (>1L/hora)."
          },
          {
            "tipo": "parrafo",
            "texto": "Atletas Pro (Ironman / Fondo)"
          },
          {
            "tipo": "parrafo",
            "texto": "4 scoops en 1 Litro de agua por hora."
          },
          {
            "tipo": "parrafo",
            "texto": "Carga crítica de carbohidratos (60-70g) y sales para larga duración."
          },
          {
            "tipo": "parrafo",
            "texto": "Recuperación (Post-Fiesta / Calor)"
          },
          {
            "tipo": "parrafo",
            "texto": "1 servicio en 500ml de agua bien fría."
          },
          {
            "tipo": "parrafo",
            "texto": "Recuperar minerales y rehidratar el sistema rápidamente."
          },
          {
            "tipo": "parrafo",
            "texto": "________________"
          }
        ]
      },
      {
        "titulo": "PREPARACIÓN Y MEJORES PRÁCTICAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Temperatura: Consumilo bien frío. El agua helada ayuda a bajar la temperatura interna de tu cuerpo, mejorando el rendimiento bajo el sol paraguayo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Sorbos Pequeños: La hidratación isotónica funciona mejor por goteo. No te tomes todo de una vez; tomá sorbos constantes y pequeños durante la actividad.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Higiene de Cierre: Limpiá siempre la rosca de la tapa con un paño seco. Si queda polvo acumulado, el bote no cerrará herméticamente y entrará humedad.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores que dañan tu producto)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No dejes el pote abierto: Cada segundo cuenta. Abrí, serví y cerrá herméticamente de inmediato para proteger el polvo.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo mezcles con jugos azucarados: El ISO PLUS ya tiene el balance perfecto. Si agregás más azúcar, deja de ser \"isotónico\" y tu cuerpo tardará mucho más en absorberlo, pudiendo causar pesadez.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Rendimiento Inmediato: Sentirás menos fatiga al final de tu sesión y una claridad mental superior.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Adiós a los Calambres: El aporte de magnesio y potasio quelado previene esas contracciones dolorosas post-entrenamiento.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Energía Inteligente: Gracias a la L-Carnitina, notarás que tu resistencia no decae en los últimos minutos del entrenamiento.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "knockout-2": {
    "titulo": "KNOCKOUT 2.0",
    "bajada": "Ingeniería de Ignición y Enfoque Explosivo",
    "secciones": [
      {
        "titulo": "¿QUÉ ES EL KNOCKOUT 2.0?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Es un pre-entrenamiento de alta concentración diseñado para cuando necesitás dar el 200%. A diferencia de otros que solo te dan \"nerviosismo\", el Knockout 2.0 combina L-Citrulina, Beta-Alanina y Arginina con una dosis precisa de cafeína para darte dos cosas: Foco mental y Bombeo muscular."
          },
          {
            "tipo": "vineta",
            "texto": "El Diferencial: Incluye extractos de pimienta negra y cayena que aceleran la absorción y elevan la temperatura corporal para quemar más calorías durante el entrenamiento.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN (¡Cuidado aquí!)",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Este producto es potente. No empieces con la dosis máxima si no estás acostumbrado."
          },
          {
            "tipo": "vineta",
            "texto": "Nivel Iniciación / Sensibles a la cafeína: Mezclá medio scoop (aprox. 3g) en 200ml de agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Nivel Avanzado / Atletas Pro: Mezclá 1 scoop colmado (6.1g) en 250ml de agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Importante: Tomalo entre 20 y 30 minutos antes de empezar tu actividad. Es el tiempo que tarda el producto en llegar al torrente sanguíneo.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL EFECTO \"PICOR\" (Beta-Alanina)",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Es muy probable que a los 10 minutos de tomarlo sientas un ligero hormigueo o picazón en la cara, orejas o manos. No te asustes: Se llama parestesia y es un efecto totalmente normal y seguro de la Beta-Alanina de alta pureza. Es la señal de que tu cuerpo está listo para retrasar la fatiga muscular y entrenar más duro. El efecto desaparece apenas empezás a moverte."
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Estómago \"semi-vacío\": Para un efecto explosivo, tratá de no tomarlo justo después de una comida pesada. Lo ideal es que hayan pasado al menos 90 minutos desde tu última comida sólida.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Hidratación extra: El Knockout eleva tu termogénesis (calor corporal). Vas a sudar más de lo normal. Asegurate de acompañar tu entrenamiento con ISO PLUS o mucha agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Ciclo de uso: Para que tu cuerpo no se acostumbre a la cafeína, usalo solo en tus entrenamientos más pesados o días que estés muy cansado. No es necesario usarlo todos los días.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Evitá estos errores)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No lo tomes de noche: Contiene 200mg de cafeína por scoop (el equivalente a 3 cafés expresos). Si entrenás después de las 19:00 o 20:00 hs, podrías tener dificultades para dormir.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo mezcles con otros estimulantes: Evitá tomar café, quemadores de grasa o bebidas energizantes en las 3 horas cercanas a tu toma de Knockout.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No excedas la dosis: \"Más\" no es \"mejor\". Respetá el scoop para evitar taquicardia o mareos.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "CONSERVACIÓN (Factor Paraguay)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Atención a los grumos: Al igual que el ISO PLUS, el Knockout es altamente higroscópico. Los ingredientes que causan el \"bombeo\" atraen mucha humedad.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Instrucción: Cerrá el bote al instante. Si el polvo se compacta un poco, agitá el envase con fuerza o rompé los bloques. La eficacia sigue intacta, es solo una reacción natural al clima de Paraguay.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "vitamin-multiple-sport": {
    "titulo": "VITA-MIN MULTIPLE SPORT",
    "bajada": "El Micro-Combustible de Alto Rendimiento",
    "secciones": [
      {
        "titulo": "¿CUAL ES LA DIFERENCIA ENTRE OTROS MULTIVITAMÍNICOS?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A diferencia de los multivitamínicos varios que el cuerpo elimina casi por completo, Olimp utiliza la tecnología de Dos Cápsulas Separadas:"
          },
          {
            "tipo": "vineta",
            "texto": "VITA-PLEX (Cápsula Naranja): Contiene todas las vitaminas clave más el HEPA-Complex (un protector del hígado a base de alcachofa y ácido alfa-lipoico). No solo te da energía, cuida tu salud interna.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "CHELA-MIN (Cápsula Azul): Contiene minerales de grado Albion® (Quelados). Esto significa que los minerales están \"envueltos\" en aminoácidos para que tu intestino los reconozca como comida y los absorba al 100%, sin causar pesadez ni estreñimiento.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Opción A: Protocolo Élite (Máximo Rendimiento) Ideal para quienes buscan optimizar cada miligramo y tienen una rutina constante."
          },
          {
            "tipo": "vineta",
            "texto": "DESAYUNO O ALMUERZO: 1 Cápsula Naranja (Vita-Plex). Las vitaminas B te dan soporte energético para el resto del día, y las vitaminas A, D, E y K aprovechan las grasas del almuerzo para absorberse al 100%.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "CENA: 1 Cápsula Azul (Chela-Min). Los minerales (como el Magnesio y Zinc) ayudan a la relajación muscular, mejoran la calidad del sueño y potencian la reparación de tejidos mientras dormís.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "Opción B: Protocolo Práctico Ideal para ejecutivos o personas con días muy movidos que no quieren arriesgarse a olvidar una toma."
          },
          {
            "tipo": "vineta",
            "texto": "ALMUERZO: Toma las 2 cápsulas juntas (Blanca + Azul).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: Es mucho mejor asegurar el aporte completo de micronutrientes en una sola toma que intentar separarlas y terminar olvidando la cápsula de la noche. El cuerpo absorberá la gran mayoría gracias a la presencia de comida.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL \"MISTERIO\" DE LA ORINA AMARILLA",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No te asustes: Es totalmente normal que después de tomarlo notes que tu orina tiene un color amarillo fluorescente.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "La Razón: Es el exceso de Vitamina B2 (Riboflavina) que tu cuerpo no necesitó en ese momento y lo elimina de forma natural. Es la señal de que el producto es potente y está recorriendo tu sistema.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Días de entrenamiento intenso: Si tenés un torneo o entrenamiento muy pesado, el complejo de vitaminas B ayudará a que tu sistema nervioso se recupere más rápido de la fatiga.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Consistencia: Las vitaminas son como el aceite del motor; no las sentís el primer día, pero si faltan, el motor se rompe. Tomalo todos los días, incluso los que no entrenás.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores comunes)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No lo tomes con el estómago vacío: Al ser dosis de grado farmacéutico, pueden causar una ligera sensación de náuseas o ardor si no hay comida en el estómago.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo tomes con café o té: La cafeína y los taninos del té pueden bloquear la absorción de minerales como el Calcio o el Hierro. Esperá al menos 30 minutos después de tu café para tomarlos.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No reemplaces la comida: Son \"micronutrientes\". Funcionan en conjunto con las proteínas, grasas y carbohidratos de tu dieta real.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Semana 1: Sentirás un aumento sutil en tus niveles de energía diaria y menos \"pesadez\" mental por la tarde.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Semana 3: Notarás que tu sistema inmunológico está más fuerte (menos resfríos o decaimiento) y que tus uñas y piel mejoran su aspecto.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "\"Interacciones y Seguridad\":"
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Alcohol: No se recomienda tomar las cápsulas el mismo día que consumas alcohol de forma excesiva. El alcohol compite con las vitaminas en el hígado y acelera su eliminación. Si vas a beber, retomá tu multivitamínico al día siguiente para ayudar a la recuperación (resaca).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Medicamentos: Si tomás remedios para dormir o medicación crónica para la presión o el corazón, consultá con tu médico. Regla de oro: Dejá siempre un espacio de al menos 3 a 4 horas entre tus medicamentos y el multivitamínico para evitar que interfieran en la absorción del remedio.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Estímulo: Si sos muy sensible, evitá tomar la cápsula naranja (vitaminas) de noche, ya que su complejo energético podría interferir con tu facilidad para conciliar el sueño.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "vitamin-multiple-sport-40": {
    "titulo": "VITA-MIN MULTIPLE SPORT",
    "bajada": "El Micro-Combustible de Alto Rendimiento",
    "secciones": [
      {
        "titulo": "¿CUAL ES LA DIFERENCIA ENTRE OTROS MULTIVITAMÍNICOS?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A diferencia de los multivitamínicos varios que el cuerpo elimina casi por completo, Olimp utiliza la tecnología de Dos Cápsulas Separadas:"
          },
          {
            "tipo": "vineta",
            "texto": "VITA-PLEX (Cápsula Naranja): Contiene todas las vitaminas clave más el HEPA-Complex (un protector del hígado a base de alcachofa y ácido alfa-lipoico). No solo te da energía, cuida tu salud interna.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "CHELA-MIN (Cápsula Azul): Contiene minerales de grado Albion® (Quelados). Esto significa que los minerales están \"envueltos\" en aminoácidos para que tu intestino los reconozca como comida y los absorba al 100%, sin causar pesadez ni estreñimiento.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Opción A: Protocolo Élite (Máximo Rendimiento) Ideal para quienes buscan optimizar cada miligramo y tienen una rutina constante."
          },
          {
            "tipo": "vineta",
            "texto": "DESAYUNO O ALMUERZO: 1 Cápsula Naranja (Vita-Plex). Las vitaminas B te dan soporte energético para el resto del día, y las vitaminas A, D, E y K aprovechan las grasas del almuerzo para absorberse al 100%.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "CENA: 1 Cápsula Azul (Chela-Min). Los minerales (como el Magnesio y Zinc) ayudan a la relajación muscular, mejoran la calidad del sueño y potencian la reparación de tejidos mientras dormís.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "Opción B: Protocolo Práctico Ideal para ejecutivos o personas con días muy movidos que no quieren arriesgarse a olvidar una toma."
          },
          {
            "tipo": "vineta",
            "texto": "ALMUERZO: Toma las 2 cápsulas juntas (Blanca + Azul).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Por qué: Es mucho mejor asegurar el aporte completo de micronutrientes en una sola toma que intentar separarlas y terminar olvidando la cápsula de la noche. El cuerpo absorberá la gran mayoría gracias a la presencia de comida.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL \"MISTERIO\" DE LA ORINA AMARILLA",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No te asustes: Es totalmente normal que después de tomarlo notes que tu orina tiene un color amarillo fluorescente.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "La Razón: Es el exceso de Vitamina B2 (Riboflavina) que tu cuerpo no necesitó en ese momento y lo elimina de forma natural. Es la señal de que el producto es potente y está recorriendo tu sistema.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Días de entrenamiento intenso: Si tenés un torneo o entrenamiento muy pesado, el complejo de vitaminas B ayudará a que tu sistema nervioso se recupere más rápido de la fatiga.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Consistencia: Las vitaminas son como el aceite del motor; no las sentís el primer día, pero si faltan, el motor se rompe. Tomalo todos los días, incluso los que no entrenás.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores comunes)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No lo tomes con el estómago vacío: Al ser dosis de grado farmacéutico, pueden causar una ligera sensación de náuseas o ardor si no hay comida en el estómago.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo tomes con café o té: La cafeína y los taninos del té pueden bloquear la absorción de minerales como el Calcio o el Hierro. Esperá al menos 30 minutos después de tu café para tomarlos.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No reemplaces la comida: Son \"micronutrientes\". Funcionan en conjunto con las proteínas, grasas y carbohidratos de tu dieta real.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Semana 1: Sentirás un aumento sutil en tus niveles de energía diaria y menos \"pesadez\" mental por la tarde.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Semana 3: Notarás que tu sistema inmunológico está más fuerte (menos resfríos o decaimiento) y que tus uñas y piel mejoran su aspecto.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "\"Interacciones y Seguridad\":"
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Alcohol: No se recomienda tomar las cápsulas el mismo día que consumas alcohol de forma excesiva. El alcohol compite con las vitaminas en el hígado y acelera su eliminación. Si vas a beber, retomá tu multivitamínico al día siguiente para ayudar a la recuperación (resaca).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Medicamentos: Si tomás remedios para dormir o medicación crónica para la presión o el corazón, consultá con tu médico. Regla de oro: Dejá siempre un espacio de al menos 3 a 4 horas entre tus medicamentos y el multivitamínico para evitar que interfieran en la absorción del remedio.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "⚠️ Estímulo: Si sos muy sensible, evitá tomar la cápsula naranja (vitaminas) de noche, ya que su complejo energético podría interferir con tu facilidad para conciliar el sueño.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "redweiler": {
    "titulo": "REDWEILER",
    "bajada": "El Encendido del Motor de Alto Rendimiento",
    "secciones": [
      {
        "titulo": "¿QUÉ ES EL REDWEILER?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "No es solo un estimulante; es una fórmula de combate. El Redweiler está diseñado para maximizar tres pilares: Fuerza explosiva, Vasodilatación masiva (el famoso \"bombeo\") y Enfoque mental extremo."
          },
          {
            "tipo": "vineta",
            "texto": "El Diferencial: Contiene una matriz de dos tipos de Arginina y Citrulina para que tus venas transporten más oxígeno y nutrientes al músculo, además de Creatina y Beta-Alanina para que no te detengas.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN POR PESO (Precisión Europea)",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "Redweiler es tan potente que Olimp recomienda ajustar la dosis según tu peso corporal para no saturar tu sistema:"
          },
          {
            "tipo": "vineta",
            "texto": "Hasta 75 kg: Mezclá 1 servicio (6g - medio scoop aprox.) en 100ml de agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "De 75 kg a 90 kg: Mezclá 2 servicios (12g - 1 scoop aprox.) en 200ml de agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Más de 90 kg: Mezclá 3 servicios (18g - 1 scoop y medio) en 300ml de agua.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "¿Cuándo?: Siempre 20 a 30 minutos antes de entrenar.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "EL EFECTO \"BOMPEO\" Y EL PICOR",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Venas marcadas: Vas a notar que tus músculos se ven más grandes y las venas más visibles durante el entrenamiento. Esto es la Arginina trabajando para mejorar tu flujo sanguíneo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "El Hormigueo: Al igual que con la Beta-Alanina pura, sentirás un picor en la cara y manos. Es normal, seguro y significa que el producto está activo. Desaparece cuando empezás a sudar.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "MEJORES PRÁCTICAS (Aprovechalo al 100%)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Estómago preparado: Tratá de consumirlo al menos 90 minutos después de tu última comida sólida. Con el estómago muy lleno, el efecto se diluye y tarda más en \"pegar\".",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Agitá antes de usar: Algunos ingredientes más pesados pueden irse al fondo del bote. Dale una buena sacudida al envase cerrado antes de sacar tu scoop.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Uso Estratégico: No lo uses todos los días. Reservalo para tus días de pierna, espalda o esos días donde necesitás un \"extra\" para romper tus récords.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores críticos)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No lo tomes cerca de la hora de dormir: Tiene una carga de cafeína importante. Si entrenás de noche, usalo con precaución o media dosis, de lo contrario podrías quedar \"eléctrico\" hasta la madrugada.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No ignores el agua: Al aumentar el flujo sanguíneo y la temperatura (termogénesis), vas a sudar más. Tomá agua o ISO PLUS durante el entrenamiento para no deshidratarte.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No lo mezcles con quemadores de grasa: El Redweiler ya tiene componentes para acelerar el metabolismo. Mezclarlo con otros estimulantes potentes puede causarte taquicardia.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Inmediato (20 min): Aumento de la temperatura corporal, ganas de moverte y el leve picor en la piel.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Durante el entrenamiento: Notarás que recuperás el aliento más rápido entre series y que el músculo se siente \"duro\" y lleno de sangre.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Post-entrenamiento: Al haber tenido mejor flujo sanguíneo, la recuperación de nutrientes empieza antes, reduciendo el dolor muscular al día siguiente.",
            "nivel": 0
          }
        ]
      }
    ]
  },
  "whey-protein-complex": {
    "titulo": "WHEY PROTEIN COMPLEX",
    "bajada": "Ingeniería de Reconstrucción Muscular",
    "secciones": [
      {
        "titulo": "¿POR QUÉ WHEY PROTEIN COMPLEX?",
        "bloques": [
          {
            "tipo": "parrafo",
            "texto": "A diferencia de las proteínas comunes, Whey Protein Complex combina dos fuentes de suero de leche en un solo servicio:"
          },
          {
            "tipo": "vineta",
            "texto": "WPI (Aislado): Filtración pura que llega a tus músculos de forma casi instantánea.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "WPC (Concentrado): Proporciona una liberación sostenida de aminoácidos y mantiene las fracciones bioactivas que refuerzan tus defensas.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Resultado: Un flujo constante de nutrientes para que tu cuerpo nunca deje de reparar tejido.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "EL MITO DE LA CALIDAD: ¿AISLADO O CONCENTRADO?"
          },
          {
            "tipo": "parrafo",
            "texto": "Existe la creencia de que una proteína aislada o hidrolizada es \"mejor\" que una concentrada. La realidad es que la calidad la determina el proceso de obtención, no el porcentaje de proteína."
          },
          {
            "tipo": "vineta",
            "texto": "Calidad Farmacéutica Europea: Olimp utiliza suero de leche de grado farmacéutico. El Whey Protein Complex es una mezcla inteligente que ofrece lo mejor de los dos mundos: la rapidez del Aislado (WPI) y la riqueza nutricional del Concentrado (WPC).",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": "ALERTA IMPORTANTE: Este producto contiene lactosa. No apto para personas con intolerancia a la lactosa."
          }
        ]
      },
      {
        "titulo": "GUÍA DE DOSIFICACIÓN SEGÚN TU PERFIL",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "El Atleta de Alto Rendimiento:",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Objetivo: Hipertrofia y recuperación post-esfuerzo masivo.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis: 1.5 a 2 scoops inmediatamente después de entrenar.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "La Mujer Activa / Definición:",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Objetivo: Tonificación muscular y saciedad (control de antojos).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis: 1 scoop como merienda o post-entrenamiento para proteger el músculo mientras se quema grasa.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "El Ejecutivo / \"Busy Lifestyle\":",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Objetivo: Reemplazo inteligente de snacks poco saludables.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Dosis: 1 scoop entre comidas largas para mantener el metabolismo activo y evitar la pérdida de masa muscular por ayunos prolongados.",
            "nivel": 0
          },
          {
            "tipo": "parrafo",
            "texto": ". MEJORES PRÁCTICAS (Aprovecha al 100%)"
          },
          {
            "tipo": "vineta",
            "texto": "El \"Timing\" es Clave: Aunque la puedes tomar en cualquier momento, el Post-Entrenamiento es el momento de oro. Tus fibras musculares están receptivas como esponjas.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Agua vs. Leche: * Con Agua: Absorción más rápida y menos calorías (ideal para definición). Con Leche: Absorción más lenta y más cremosa (ideal si buscas ganar volumen o como reemplazo de merienda).",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Disolución Perfecta: Primero vierte el líquido (200-250ml) y luego el polvo. Agita por 15-20 segundos. Al ser de grado farmacéutico, no deja restos.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "¿QUÉ NO HACER? (Errores que desperdician tu inversión)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "No uses agua hirviendo: El calor extremo \"desnaturaliza\" la proteína. Pierde sus propiedades biológicas y su textura se vuelve desagradable. Si quieres cocinar (panquecas), usa temperaturas medias.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No reemplaces todas tus comidas: La proteína es un suplemento, no un sustituto total. Necesitas comida real para una digestión completa.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No pienses que \"más es mejor\": El cuerpo absorbe una cantidad limitada por toma. Es más eficiente tomar un scoop dos veces al día que tres scoops de una sola vez.",
            "nivel": 0,
            "aviso": true
          },
          {
            "tipo": "vineta",
            "texto": "No la dejes preparada: Si hacés el batido, tomalo en el momento o antes de que pasen 30 minutos. Si la dejás mucho tiempo mezclada (especialmente con calor), el sabor cambia y pierde calidad.",
            "nivel": 0,
            "aviso": true
          }
        ]
      },
      {
        "titulo": "GESTIÓN DE EXPECTATIVAS",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Día 1: Digestión ligera. Al ser CFM, no genera la pesadez estomacal de las proteínas de otras marcas",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Semana 2-4: Mejor recuperación post-esfuerzo y sensación de mayor firmeza muscular.",
            "nivel": 0
          }
        ]
      },
      {
        "titulo": "CONSERVACIÓN (Factor Paraguay)",
        "bloques": [
          {
            "tipo": "vineta",
            "texto": "Cuidado con la humedad y las hormigas: Nuestros sabores son tan naturales que atraen a todos.",
            "nivel": 0
          },
          {
            "tipo": "vineta",
            "texto": "Instrucción: Cerrá el empaque hermeticamente inmediatamente después de usarlo. Asegurate de que el scoop esté seco antes de volver a meterlo. Guardalo en un lugar fresco y lejos del sol.",
            "nivel": 0
          }
        ]
      }
    ]
  }
};
