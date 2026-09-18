/* ==========================================================================
   VITALICA — data.js  ·  FUENTE ÚNICA DE DATOS
   --------------------------------------------------------------------------
   Este es el archivo más importante para vos. Acá vive TODO el contenido
   editable de la maqueta: configuración del negocio, categorías, las 4 metas,
   los 10 productos (con su contenido de marketing), las tiendas donde se
   vende y las guías de uso.

   👉 Para cargar precios reales, cambiar textos, WhatsApp, tiendas, etc.,
      editás ACÁ y se actualiza en todo el sitio.

   NOTA (para IT): en producción esto vendría de una base de datos / API
   (catálogo, stock, precios). La forma de los objetos sirve de referencia
   del modelo de datos.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1) CONFIGURACIÓN DEL NEGOCIO
   -------------------------------------------------------------------------- */
const VITALICA_CONFIG = {
  whatsapp: {
    numero: '595976383922',
    numeroVisible: '+595 976 383922',
    mensaje: 'Hola Vitalica, vengo de la página web. Me gustaría tener más información sobre los productos.',
    // Enlace de atención a CONSUMIDOR FINAL. Sale del brief de marketing
    // (Drive: DIGITAL > PÁGINA WEB > "AJUSTES PÁGINA WEB.pptx"), que pide
    // expresamente que el botón "Hacé tu pedido" derive acá y no al número
    // general de arriba. Es un enlace corto de WhatsApp, no un número suelto,
    // así que va tal cual y no se le arma el wa.me a mano.
    consumidorFinal: 'https://wa.me/message/ICWKDYJR3BFPF1'
  },

  // Email de atención al cliente (del sitio en producción)
  email: 'atencionalcliente@vitalica.com.py',

  /* DATOS DE LA EMPRESA
     ⚠️ COMPLETAR — son obligatorios para vender online en Paraguay y Bancard
     los pide en el alta comercial.

     Se usan en Términos y Condiciones, Política de Privacidad y el footer.
     Mientras estén vacíos, esas páginas muestran un aviso naranja en el lugar
     exacto que falta, en vez de inventar un dato o dejar un hueco mudo. */
  empresa: {
    // Datos tomados de la ficha de la compañía en Odoo (agosto 2026).
    razonSocial: 'VITALICA EAS',
    ruc: '80142159-4',                              // RUC 80142159, DV 4
    domicilio: 'Avda. Artigas 2061, San Estanislao',
    ciudad: 'Asunción, Paraguay',
    telefono: '+595 21 297240',
    // Responsable de protección de datos (si se deja vacío usa el email general)
    emailPrivacidad: ''
  },

  // Redes sociales (URLs reales de Vitalica)
  redes: {
    instagram: 'https://www.instagram.com/vitalica.py/',
    tiktok: 'https://www.tiktok.com/@vitalica.py',
    facebook: 'https://www.facebook.com/vitalica.py',
    linktree: 'https://linktr.ee/vitalica.py'
  },

  // Catálogo PDF (cada producto enlaza a su página con #page=N)
  catalogo: { archivo: 'catalogo-vitalica-ligera.pdf.pdf' },

  // Google Analytics 4 (el mismo ID que ya corre en producción)
  analytics: { ga4: 'G-TE97P39PW1' },

  /* MOSTRAR RESEÑAS Y RATINGS
     Las estrellas y el "+1.240 opiniones" de la maqueta son inventados.
     Quedan APAGADOS hasta que existan reseñas reales y verificadas.
     Poner en true recién cuando haya un sistema de reseñas de verdad. */
  mostrarRatings: false,

  /* AVISO DE STOCK BAJO
     El stock real lo trae sync-odoo-precios.py desde Odoo (window.VITALICA_STOCK)
     y data.js lo copia a p.stock. Cuando queden estas unidades o menos, el sitio
     muestra "Últimas unidades" en la tarjeta y en la ficha; con 0 muestra
     "Sin stock". Subilo o bajalo según cómo se mueva tu inventario.
     Poner en 0 apaga el aviso por completo. */
  stockBajo: 10,

  /* COSTOS DE ENVÍO (Gs.)
     Se muestran en el checkout y se suman al total del pedido.
     Poné null en cualquiera de los dos si preferís que diga "a confirmar"
     en vez de un monto. 'gratisDesde' es el subtotal a partir del cual el
     envío no se cobra: dejalo en null si no querés envío gratis. */
  envio: {
    granAsuncion: 25000,
    interior: 40000,
    gratisDesde: null
  },

  /* PUNTOS DE RETIRO
     --------------------------------------------------------------------
     Lugares donde el cliente puede ir a buscar SU pedido de la web.

     ⚠️ NO CONFUNDIR CON VITALICA_TIENDAS (más abajo). Aquella es la lista
     de aliados comerciales que venden Olimp —Fit Way, Shopping China, etc.—
     y son negocios de terceros. Ahí se puede COMPRAR, pero no se puede
     RETIRAR un pedido hecho en la web: ese local nunca se comprometió a
     guardarlo ni tiene forma de saber que existe.

     Acá van únicamente lugares propios de Vitalica, o aliados con los que
     exista un acuerdo explícito de retiro.

     Si dejás la lista vacía, la opción "Retiro en un local" desaparece del
     checkout y quedan solo los envíos. Es lo correcto si hoy no tenés dónde
     recibir gente. */
  retiro: {
    // ⚠️ CONFIRMAR: esta es la dirección fiscal que figura en Odoo.
    // Si no es un lugar preparado para recibir clientes, borrala.
    puntos: [
      {
        nombre: 'Vitalica',
        direccion: 'Avda. Artigas 2061, San Estanislao',
        ciudad: 'Asunción',
        horario: 'Lunes a viernes de 8 a 17 h'   // vacío = no se muestra
      }
    ]
  },

  /* MEDIOS DE PAGO
     El sitio NO cobra: el pedido se cierra por WhatsApp. Acá se elige CÓMO
     va a pagar el cliente, y esa elección viaja en el mensaje para que el
     asesor ya sepa con qué seguir.

     'instrucciones' es lo que se le muestra al cliente cuando elige ese
     medio. Si está vacío, no se muestra nada.

     ⚠️ Los datos bancarios están SIN COMPLETAR a propósito: cargalos vos,
     no los inventes. Mientras estén vacíos, el sitio dice que se envían
     por WhatsApp, que es verdad y no compromete nada.

     Para agregar un medio nuevo (por ejemplo una billetera), copiá un
     bloque y cambiá id, nombre y descripción. Para sacar uno, borralo.

     EL CAMPO 'entregas'
     Dice en qué tipos de entrega tiene sentido ese medio de pago. Pagar con
     tarjeta en el mostrador no aplica si el pedido se envía, y retirar en el
     local no aplica si pidió envío al interior. Los medios que no
     corresponden aparecen apagados y con el motivo, en vez de desaparecer
     sin explicación.

     Valores posibles: 'gran-asuncion', 'interior', 'retiro'.
     Si omitís el campo, el medio vale para todas. */
  pagos: {
    metodos: [
      {
        id: 'transferencia',
        nombre: 'Transferencia bancaria',
        descripcion: 'Te pasamos los datos y el pedido sale cuando se acredita',
        entregas: ['gran-asuncion', 'interior', 'retiro'],
        instrucciones: ''   // ← acá van banco, titular, cuenta y RUC
      },

      /* NO HAY PAGO CONTRA ENTREGA  ·  sacado el 18/9/2026
         ------------------------------------------------------------------
         Había una opción "Efectivo al recibir - Pagás al repartidor cuando
         te llega". No se puede hacer: el reparto no cobra.

         Ofrecer una forma de pago que después no existe es peor que no
         ofrecerla. El cliente elige, arma el pedido, y recién cuando el
         asesor le escribe se entera de que tiene que transferir igual. Eso
         es una discusión al principio de la relación y algunos se caen ahí.

         Para los envíos queda la transferencia, que se cobra ANTES de que
         el pedido salga. Para quien retira siguen el efectivo y la tarjeta
         en el mostrador: ahí el pago también pasa antes de entregar la
         mercadería, así que el problema no existe.

         SI USAN BILLETERA (Giros Tigo, Billetera Personal), descomentá este
         bloque y listo. En el interior mucha gente paga así y no tiene
         cuenta bancaria; sin esta opción, esos pedidos se pierden. */
      // {
      //   id: 'billetera',
      //   nombre: 'Giros Tigo / Billetera Personal',
      //   descripcion: 'Te pasamos el número y el pedido sale cuando llega el giro',
      //   entregas: ['gran-asuncion', 'interior', 'retiro'],
      //   instrucciones: ''   // ← acá va el número y a nombre de quién está
      // },

      {
        id: 'efectivo-local',
        nombre: 'Efectivo al retirar',
        descripcion: 'Pagás en efectivo cuando pasás a buscarlo',
        entregas: ['retiro'],
        instrucciones: ''
      },
      {
        id: 'tarjeta-local',
        nombre: 'Tarjeta al retirar',
        descripcion: 'Pagás con tarjeta en el mostrador',
        entregas: ['retiro'],
        instrucciones: ''
      }
    ]
  },

  // Mensajes que rotan en la barra superior de anuncios
  anuncios: [
    'Productos 100% originales de Olimp Sport Nutrition',
    'Envíos a todo el Paraguay',
    'Asesoramiento personalizado por WhatsApp',
    'Compra 100% segura'
  ],

  // Datos para la prueba social del home (demo)
  prueba_social: { puntaje: 4.8, cantidad: 1240 },

  // Marca: logos (editables desde el panel de administrador)
  marca: {
    logoVitalica: 'assets/img/logo-vitalica.png',
    logoOlimp: 'assets/img/logo-olimp.png',        // versión BLANCA (para el pie, que es negro)
    logoOlimpOscuro: 'assets/img/logo-olimp-negro.png'  // versión NEGRA (para el header, que es blanco)
  },

  // Menú de navegación (editable desde el panel de administrador)
  // El brief de marketing pide: OLIMP · PRODUCTOS · PUNTOS DE VENTA ·
  // HACÉ TU PEDIDO. Se respetan esos cuatro, pero NO se borran "Guía de uso"
  // ni "Contacto": el brief es de febrero y desde entonces esas secciones se
  // llenaron de contenido (las 9 guías de uso, el formulario). Sacarlas del
  // menú las dejaría escritas pero inalcanzables.
  //
  // "Hacé tu pedido" no va en esta lista: es un botón aparte del header
  // (ver components.js), porque es la acción de conversión y no una sección.
  nav: [
    { label: 'Olimp',           href: 'sobre.html' },
    { label: 'Productos',       href: 'productos.html', megamenu: true },
    { label: 'Guía de uso',     href: 'guia.html' },
    { label: 'Noticias',        href: 'noticias.html' },
    { label: 'Puntos de venta', href: 'contacto.html#donde-comprar' },
    { label: 'Contacto',        href: 'contacto.html#hablemos' }
  ],

  // Sección "Sumate a la comunidad" del home (estilo vitalica.com.py).
  // En la maqueta los posteos son imágenes simuladas que enlazan al perfil;
  // en producción se conectan al feed real de Instagram (ver HANDOFF-IT.md).
  comunidad: {
    handle: '@vitalica.py',
    // El sitio en producción ya usa Curator.io con el feed real de Instagram.
    // Si 'curatorId' tiene valor, se muestra el feed real; si lo vaciás,
    // vuelve a la grilla de imágenes de 'posts' (modo maqueta).
    curatorId: '9ab0b53d-2d01-447d-a590-c7febbcb91a2',
    posts: [
      'assets/img/products/whey-protein-complex.webp',
      'assets/img/products/redweiler.webp',
      'assets/img/products/creatine-monohydrate.webp',
      'assets/img/products/iso-plus-powder.webp',
      'assets/img/products/knockout-2.webp',
      'assets/img/products/beta-alanina-xplode.webp'
    ]
  },

  /* ALIADOS COMERCIALES — locales donde se consigue la línea Olimp.
     Traído del sitio en producción. La 'altura' está en px porque cada logo
     viene con una proporción distinta y hay que igualarlos a ojo. */
  /* EMBAJADORES DE OLIMP.
     Atletas del roster internacional de Olimp Sport Nutrition. Las fotos son
     del banco oficial que Olimp comparte con los distribuidores (Drive:
     DROPBOX OLIMP > IMÁGENES OLIMP); los nombres salen de los propios
     archivos.

     A propósito NO hay biografías ni palmarés: no tenemos esos datos
     confirmados y no se inventan. Si Olimp manda las fichas de cada atleta,
     se agrega un campo 'detalle' y se muestra debajo del nombre. */
  /* EMBAJADORES
     -----------------------------------------------------------------------
     Son los CINCO DE ACÁ, no el equipo internacional de Olimp. Salen de los
     contratos firmados que están en el Drive (INFLUENCERS).

     Antes esta sección mostraba a los atletas polacos de Olimp. No era
     mentira —son el equipo de la marca— pero acá nadie los conoce, y el
     título dice "los que compiten", en presente y en Paraguay.

     FALTAN LAS FOTOS. Ninguna está en el Drive: busqué por nombre en todo.
     Mientras tanto se dibuja una placa con las iniciales, marcada como
     pendiente. Es a propósito: un hueco visible se llena, uno disimulado no.

     El contrato (cláusula sexta) ya habilita a reusar el contenido que ellos
     publican, con su imagen, en los canales propios de Vitalica por seis
     meses. O sea que alcanza con una foto de sus propios posteos: no hace
     falta una sesión.

     Los Instagram salen de la planilla de embajadores que pasó marketing
     (Drive, 17/9/2026). `disciplina` sigue vacío: la planilla no lo trae.

     LA PLANILLA TIENE NÚMEROS DE CÉDULA. Ese dato no entra al sitio ni a
     ningún archivo del proyecto: acá solo van el nombre y la cuenta pública.

     Hay dos personas más en la planilla —Camila Jara Acha (@camilajaraacha)
     y Dhudux Vargas (@dhudhux)— que NO tienen fecha de contrato cargada. No
     se publican hasta confirmar que firmaron: subir la imagen de alguien sin
     acuerdo vigente es un problema, no un descuido.
     Lo que esté vacío simplemente no se dibuja.

     Los polacos, por si se los quiere recuperar algún día, eran:
       Elton Pinto Mota · Patrycja Słaby · Kasia Dziurska ·
       Kasia Oleśkiewicz · Wojciech Sobierajski
     Las fotos siguen en assets/img/embajadores/. */
  embajadores: {
    eyebrow: 'Equipo Vitalica',
    titulo: 'Nos eligen los que compiten',
    texto: 'Atletas y creadores paraguayos que entrenan con la línea de Olimp que traemos al país.',

    /* LOS DOS GRUPOS
       ----------------------------------------------------------------------
       Marketing pidió la sección en dos columnas: embajadores de un lado,
       nutricionistas del otro. Eso lo decide el campo `rol`, que vale
       'embajador' o 'nutricionista'.

       AHORA MISMO ESTÁN LOS CINCO COMO EMBAJADORES, y no es una decisión:
       es que la planilla de contratos no trae la profesión de nadie. Tiene
       nombre, apellido, cédula, teléfono, ciudad, fechas, productos
       entregados e Instagram — ninguna columna dice quién es nutricionista.

       Mientras no haya nadie en el otro grupo, la sección se dibuja como
       siempre, en una sola grilla: dos columnas con una vacía se ve como un
       error de maquetado, no como "todavía no cargamos a los nutricionistas".
       En cuanto una persona tenga rol 'nutricionista', las dos columnas
       aparecen solas. */
    gente: [
      { nombre: 'Ricardo Martínez',        rol: 'embajador', foto: '', disciplina: '', instagram: 'rmcoach15' },
      { nombre: 'Isabella Olcese',         rol: 'embajador', foto: '', disciplina: '', instagram: 'isaolcese' },
      { nombre: 'Marcos Ramírez',          rol: 'embajador', foto: '', disciplina: '', instagram: 'marcosreinaldi' },
      { nombre: 'Astrid Cáceres',          rol: 'embajador', foto: '', disciplina: '', instagram: 'astridcaceres_' },
      { nombre: 'Alexander De los Santos', rol: 'embajador', foto: '', disciplina: '', instagram: 'entrenador_alexander_dls_track' }
    ],

    /* Títulos de cada columna. Se editan acá y no en el JS. */
    columnas: {
      embajador:     { titulo: 'Embajadores',    texto: 'Atletas y creadores que entrenan con la línea que traemos al país.' },
      nutricionista: {
        titulo: 'Nutricionistas',
        texto: 'Profesionales que acompañan y recomiendan la línea de Olimp.',
        /* Se muestra mientras la columna no tenga a nadie. Es texto y no un
           hueco a propósito: un espacio en blanco se lee como algo roto. */
        vacio: 'Estamos sumando nutricionistas al equipo. Pronto vas a verlos acá.'
      }
    }
  },

  /* CIENCIA REAL — los tres pilares de Olimp.
     Los textos y los tres íconos salen del brief de marketing (Drive: DIGITAL >
     PÁGINA WEB > "AJUSTES PÁGINA WEB.pptx"). Los íconos ya estaban sueltos en
     la raíz del proyecto sin que nadie supiera qué eran: son exactamente estos
     tres pilares. Están en assets/img/pilares/ en versión gris y blanca.

     SHIME® no es un eslogan: es un simulador del sistema digestivo humano.
     Si se edita ese texto, no se le quite el ® ni el dato de cuantos hay en
     el mundo, que es lo que lo hace verificable.

     CORREGIDO EL 17/9/2026: decía "uno de los 9 en el mundo" y "el único en
     Polonia". La presentación oficial de Olimp de 2025 (Business Presentation
     EN OSN Quality) dice textual: "the first artificial digestive system in
     Poland, and one out of thirty in the world". O sea treinta, no nueve, y
     primero, no único. */
  ciencia: {
    eyebrow: 'Respaldo',
    titulo: 'Ciencia real. Estándares farmacéuticos europeos.',
    texto: 'Laboratorios Olimp es una empresa farmacéutica polaca con más de 35 años de experiencia produciendo suplementos dietéticos y nutrición deportiva de alta calidad. Sus productos cumplen los estándares de calidad europeos más estrictos.',
    pilares: [
      {
        icono: 'assets/img/pilares/frasco-gris.png',
        foto: 'assets/img/pilares/investigacion.jpg',
        titulo: 'Innovación y desarrollo',
        texto: 'Olimp dispone de su propio Centro de Investigación y Desarrollo, Olimp Labs, equipado con laboratorios modernos y un sistema digestivo artificial para validar científicamente cada fórmula.'
      },
      {
        icono: 'assets/img/pilares/made-in-europe-gris.png',
        foto: 'assets/img/pilares/produccion.jpg',
        titulo: 'Calidad certificada',
        texto: 'Producción farmacéutica bajo estrictos estándares europeos de pureza, seguridad y eficacia, con trazabilidad total en cada lote.'
      },
      {
        icono: 'assets/img/pilares/shime-gris.png',
        foto: 'assets/img/pilares/shime.jpg',
        titulo: 'Tecnología SHIME®',
        texto: 'Simulador del ecosistema microbiano del intestino humano. Es el primer sistema digestivo artificial de Polonia y uno de los treinta que existen en el mundo. Permite analizar con precisión científica los trastornos de la microbiota intestinal.'
      }
    ]
  },

  aliados: {
    titulo: 'Nuestros aliados comerciales',
    texto: 'Encontrá toda la línea OLIMP de Vitalica en las principales cadenas, farmacias, gimnasios y tiendas de suplementos del país.'
    // La lista está en VITALICA_TIENDAS (más abajo). Antes vivía acá y había
    // otra lista aparte con las mismas tiendas: se unificaron.
  }
};


/* --------------------------------------------------------------------------
   2) CATEGORÍAS DE OLIMP (tipo de producto). Se muestran como etiqueta en
   cada producto y se usan para mapear a las metas. NO son la navegación.
   -------------------------------------------------------------------------- */
const VITALICA_CATEGORIAS = [
  { id: 'construccion-muscular', nombre: 'Construcción Muscular' },
  { id: 'resistencia',           nombre: 'Resistencia' },
  { id: 'fuerza',                nombre: 'Fuerza' },
  { id: 'enfoque',               nombre: 'Enfoque' },
  { id: 'vitalidad',             nombre: 'Vitalidad' }
];


/* --------------------------------------------------------------------------
   3) METAS / OBJETIVOS (la navegación "¿Qué querés lograr?")
   Cada meta agrupa una o más categorías de Olimp.
   -------------------------------------------------------------------------- */
/* Las fotos salen de assets/img, donde habia 88 fotos de Olimp que el sitio
   NO usaba: sesiones de producto, atletas y gimnasio, de 10 a 20 MB cada una.
   Se eligieron con herramientas/hoja-de-contactos-fotos.ps1, que arma una
   hoja con todas las miniaturas numeradas para poder mirarlas de una vez.
   Las cuatro estan reescaladas a 900 px de ancho. */
const VITALICA_METAS = [
  {
    id: 'deporte-resistencia',
    nombre: 'Deporte de resistencia',   // nombre corto (filtros, footer, breadcrumb)
    accion: 'Aumentar la Resistencia',  // etiqueta de acción (tarjetas del home)
    descripcion: 'Energía, hidratación y resistencia para entrenamientos largos.',
    categorias: ['resistencia'],
    foto: 'assets/img/metas/resistencia.jpg'
  },
  {
    id: 'fuerza',
    nombre: 'Fuerza',
    accion: 'Incrementar la Fuerza',
    descripcion: 'Creatina y pre-entrenos para potencia y rendimiento.',
    categorias: ['fuerza', 'enfoque'],
    foto: 'assets/img/metas/fuerza.jpg'
  },
  {
    id: 'recuperacion',
    nombre: 'Recuperación',
    accion: 'Recuperación más rápida',
    descripcion: 'Proteínas e hidratación para recuperarte mejor.',
    categorias: ['construccion-muscular', 'resistencia'],
    foto: 'assets/img/metas/recuperacion.jpg'
  },
  {
    id: 'salud',
    nombre: 'Salud',
    accion: 'Mejorar la Salud',
    descripcion: 'Vitaminas, omega 3 y soporte articular para tu día a día.',
    categorias: ['vitalidad'],
    foto: 'assets/img/metas/salud.jpg'
  }
];


/* --------------------------------------------------------------------------
   4) SLIDES DEL HERO (carrusel del home).
   -------------------------------------------------------------------------- */
const VITALICA_HERO = [
  // "modo" controla cómo se usa la imagen del slide:
  //   'banner'   → la imagen cubre TODO el rectángulo, con velo oscuro para
  //                que se lea el texto. Es el modo bueno para fotos de campaña.
  //   'producto' → el envase recortado flota a la derecha sobre el degradado.
  //                Solo funciona con packshots de colores vivos; con la línea
  //                negra de Olimp queda pobre.
  //
  // Poné acá fotos de campaña (gente entrenando, ambiente de gimnasio).
  // Si por ahora tenés una sola, copiá el mismo archivo con los 3 nombres.
  {
    // Texto tomado literal del brief de marketing (Drive: DIGITAL > PÁGINA WEB
    // > "AJUSTES PÁGINA WEB.pptx"). No improvisar acá: es el mensaje aprobado
    // de la marca.
    modo: 'banner',
    eyebrow: 'Sin Atajos',
    titulo: 'El progreso no se promete.<br>Se construye.',
    texto: 'En un mercado lleno de resultados rápidos, Vitalica llega para acompañar a quienes respetan el proceso. <strong>Representantes exclusivos de OLIMP Sport Nutrition en Paraguay.</strong>',
    imagen: 'assets/img/hero/portada-1.jpg',
    cta1: { texto: 'Conocer productos', href: 'productos.html' },
    cta2: { texto: 'Conocé Olimp', href: 'sobre.html' }
  },
  {
    modo: 'banner',
    eyebrow: 'Performance de alto nivel',
    titulo: 'Más potencia<br>en cada serie.',
    texto: 'Creatina y pre-entrenos para entrenar al máximo. Energía, foco y fuerza cuando más lo necesitás.',
    imagen: 'assets/img/hero/portada-2.jpg',
    /* FOTO CAMBIADA EL 17/9/2026. La anterior era un fisicoculturista y
       marketing pidió sacarlo: los productos no son para esa persona.
       Esta es de gimnasio funcional, con la creatina en cuadro.

       El `foco` existe porque en esta foto la cara está al 63% del ancho y
       el valor general del CSS (78%) dejaba el recorte en el hombro: en
       celular se veía un torso y no una persona entrenando. */
    foco: "50% 40%",
    cta1: { texto: 'Ver productos', href: 'productos.html' },
    cta2: { texto: 'Guía de uso', href: 'guia.html' }
  },
  {
    modo: 'banner',
    eyebrow: 'Calidad europea',
    titulo: '+35 años de<br>ciencia deportiva.',
    texto: 'Olimp fabrica en Polonia con estándares europeos. Productos originales, con respaldo y resultados.',
    imagen: 'assets/img/hero/portada-3.jpg',
    cta1: { texto: 'Conocé Olimp', href: 'sobre.html' },
    cta2: { texto: 'Ver productos', href: 'productos.html' }
  }
];


/* --------------------------------------------------------------------------
   5) PRODUCTOS (10 de Olimp)
   Campos de marketing (para la página de producto, estilo BPN):
     bandaBeneficio → titular corto de beneficio
     beneficios[]   → { icono, titulo, texto }  (3 por producto)
     ingredientes[] → { nombre, texto }
   -------------------------------------------------------------------------- */
const VITALICA_PRODUCTOS = [
  {
    id: 'whey-protein-complex',
    nombre: 'Whey Protein Complex 100%',
    categoria: 'construccion-muscular',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/whey-protein-complex.webp',
    rating: 4.8, reviews: 124, tags: ['Lanzamiento'], destacado: true,
    resumen: 'Proteína de suero premium (WPI + WPC), filtrada en frío (CFM) para absorción rápida y recuperación muscular óptima.',
    descripcion: 'Whey Protein Complex 100% combina aislado y concentrado de suero filtrados en frío mediante tecnología CFM, preservando las fracciones proteicas y reduciendo grasa y lactosa. Su perfil completo de aminoácidos y su rápida absorción la hacen ideal para después de entrenar, cuando el músculo más necesita reconstruirse.',
    modoDeUso: 'Mezclá 1 medida (~30 g) con 250–300 ml de agua o leche. 1 a 2 porciones por día, idealmente una después de entrenar.',
    bandaBeneficio: 'Proteína de suero premium · filtrada en frío (CFM) · recuperación rápida',
    beneficios: [
      { icono: 'pesa',   titulo: 'Recuperación muscular', texto: 'Aporta los aminoácidos que el músculo necesita para repararse después de entrenar.' },
      { icono: 'rayo',   titulo: 'Absorción rápida',      texto: 'El filtrado en frío CFM conserva las fracciones proteicas para una asimilación veloz.' },
      { icono: 'escudo', titulo: 'Más limpia',            texto: 'Más proteína por porción, con menos grasa y lactosa que un concentrado común.' }
    ],
    ingredientes: [
      { nombre: 'WPI + WPC',        texto: 'Mezcla de aislado y concentrado de suero para calidad y rendimiento.' },
      { nombre: 'Tecnología CFM',   texto: 'Filtrado en frío que preserva las proteínas y minimiza su desnaturalización.' }
    ]
  },
  {
    id: 'creatine-monohydrate',
    nombre: 'Creatine Monohydrate',
    categoria: 'fuerza',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/creatine-monohydrate.webp',
    rating: 4.9, reviews: 210, tags: [], destacado: true,
    resumen: 'Creatina monohidrato micronizada 200 Mesh: solubilidad inmediata y máxima absorción, sin molestias estomacales.',
    descripcion: 'El suplemento más estudiado del deporte, en su forma más pura. La micronización 200 Mesh mejora la solubilidad y la tolerancia digestiva. Tomada a diario, ayuda a aumentar la fuerza, la potencia y el rendimiento en entrenamientos de alta intensidad.',
    modoDeUso: '3 a 5 g por día, todos los días, con agua o tu bebida habitual. La clave es la constancia.',
    bandaBeneficio: 'Creatina micronizada 200 Mesh · el suplemento más estudiado del deporte',
    beneficios: [
      { icono: 'rayo',   titulo: 'Más fuerza y potencia', texto: 'Ayuda a producir energía en los esfuerzos cortos e intensos.' },
      { icono: 'pesa',   titulo: 'Mejor rendimiento',     texto: 'Apoya más repeticiones y series de alta intensidad.' },
      { icono: 'escudo', titulo: 'Máxima absorción',      texto: 'La micronización 200 Mesh mejora la solubilidad y la tolerancia digestiva.' }
    ],
    ingredientes: [
      { nombre: 'Creatina monohidrato', texto: 'La forma más pura y respaldada por la ciencia.' }
    ]
  },
  {
    id: 'redweiler',
    nombre: 'Redweiler',
    categoria: 'fuerza',
    categoriasExtra: ['enfoque'],
    precio: null,
    imagen: 'assets/img/products/redweiler.webp',
    rating: 4.7, reviews: 98, tags: ['Nuevo'], destacado: true,
    resumen: 'Pre-entreno de alta intensidad con beta-alanina, creatina y citrulina para potencia y bombeo muscular.',
    descripcion: 'Redweiler es un pre-entreno de fórmula completa pensado para sesiones exigentes: combina beta-alanina, creatina, citrulina y cafeína para más energía, foco y un bombeo muscular notable. Para quienes entrenan en serio y quieren dar un paso más.',
    modoDeUso: '1 medida en 200 ml de agua, 20–30 min antes de entrenar. No superar 1 porción por día y evitar cerca de dormir.',
    bandaBeneficio: 'Pre-entreno de alta intensidad · energía, foco y bombeo',
    beneficios: [
      { icono: 'rayo',  titulo: 'Energía explosiva', texto: 'Cafeína y activos para entrenar a la máxima intensidad.' },
      { icono: 'gota',  titulo: 'Bombeo muscular',   texto: 'Citrulina para más flujo sanguíneo y congestión.' },
      { icono: 'diana', titulo: 'Resistencia',       texto: 'Beta-alanina y creatina para sostener el esfuerzo.' }
    ],
    ingredientes: [
      { nombre: 'Beta-alanina', texto: 'Retrasa la aparición de la fatiga muscular.' },
      { nombre: 'Citrulina',    texto: 'Favorece el bombeo y el flujo sanguíneo.' },
      { nombre: 'Cafeína',      texto: 'Energía y foco para el entrenamiento.' }
    ]
  },
  {
    id: 'knockout-2',
    nombre: 'Knockout 2.0',
    categoria: 'enfoque',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/knockout-2.webp',
    rating: 4.6, reviews: 64, tags: [], destacado: true,
    resumen: 'Pre-entreno con cafeína y pimienta de cayena para foco mental agudo y termogénesis.',
    descripcion: 'Knockout 2.0 está formulado para el foco: cafeína y extracto de pimienta de cayena para energía mental sostenida y un efecto termogénico. Ideal para entrenamientos donde la concentración hace la diferencia.',
    modoDeUso: '1 medida en 200 ml de agua, 15–30 min antes de entrenar. Empezá con media porción para evaluar tolerancia.',
    bandaBeneficio: 'Pre-entreno con foco mental · cafeína + pimienta de cayena',
    beneficios: [
      { icono: 'cerebro', titulo: 'Foco mental',     texto: 'Concentración aguda para tus entrenamientos más exigentes.' },
      { icono: 'rayo',    titulo: 'Energía sostenida', texto: 'Cafeína para empuje sin caídas bruscas.' },
      { icono: 'hoja',    titulo: 'Termogénesis',     texto: 'Pimienta de cayena que suma efecto termogénico.' }
    ],
    ingredientes: [
      { nombre: 'Cafeína',            texto: 'Energía y concentración.' },
      { nombre: 'Pimienta de cayena', texto: 'Aporta efecto termogénico.' }
    ]
  },
  {
    id: 'beta-alanina-xplode',
    nombre: 'Beta Alanina Xplode',
    categoria: 'resistencia',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/beta-alanina-xplode.webp',
    rating: 4.5, reviews: 41, tags: [], destacado: false,
    resumen: 'L-histidina + Vitamina B6: eleva la carnosina muscular y retrasa la aparición de la fatiga.',
    descripcion: 'La beta-alanina aumenta los niveles de carnosina en el músculo, ayudando a amortiguar la acidez del esfuerzo y a retrasar la fatiga. Sumada a L-histidina y Vitamina B6, es una aliada para series largas y entrenamientos de resistencia.',
    modoDeUso: '3 a 4 g por día. Es normal una leve sensación de hormigueo (inofensiva). Funciona por acumulación: tomala todos los días.',
    bandaBeneficio: 'Más carnosina muscular · menos fatiga en series largas',
    beneficios: [
      { icono: 'escudo', titulo: 'Retrasa la fatiga', texto: 'Amortigua la acidez del músculo durante el esfuerzo.' },
      { icono: 'pesa',   titulo: 'Series más largas', texto: 'Ideal para entrenamientos de resistencia y alto volumen.' },
      { icono: 'hoja',   titulo: 'Con Vitamina B6',   texto: 'Suma L-histidina y B6 para potenciar el efecto.' }
    ],
    ingredientes: [
      { nombre: 'Beta-alanina',      texto: 'Eleva la carnosina muscular.' },
      { nombre: 'L-histidina + B6',  texto: 'Apoyan la síntesis de carnosina.' }
    ]
  },
  {
    id: 'iso-plus-powder',
    nombre: 'Iso Plus Powder',
    categoria: 'resistencia',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/iso-plus-powder.webp',
    rating: 4.6, reviews: 58, tags: [], destacado: true,
    resumen: 'Bebida isotónica con electrolitos, vitaminas y L-carnitina para reponer energía e hidratación.',
    descripcion: 'Iso Plus repone líquidos, sales minerales y energía durante y después del esfuerzo. Con electrolitos, vitaminas y L-carnitina, ayuda a mantener la hidratación y el rendimiento en entrenamientos largos o días de calor.',
    modoDeUso: 'Disolvé 1 medida en 500 ml de agua. Tomá durante o después del entrenamiento.',
    bandaBeneficio: 'Isotónico con electrolitos · hidratación y energía',
    beneficios: [
      { icono: 'gota',  titulo: 'Hidratación', texto: 'Repone líquidos y sales minerales perdidos al entrenar.' },
      { icono: 'rayo',  titulo: 'Energía',     texto: 'Carbohidratos para sostener el rendimiento.' },
      { icono: 'hoja',  titulo: 'Con L-carnitina', texto: 'Suma vitaminas y L-carnitina a la fórmula.' }
    ],
    ingredientes: [
      { nombre: 'Electrolitos', texto: 'Sodio, potasio y magnesio para la hidratación.' },
      { nombre: 'L-carnitina',  texto: 'Apoya el metabolismo energético.' }
    ]
  },
  {
    id: 'vitamin-multiple-sport',
    nombre: 'Vita-min Multiple Sport',
    categoria: 'vitalidad',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/vitamin-multiple-sport.webp',
    rating: 4.7, reviews: 89, tags: [], destacado: false,
    resumen: 'Complejo de vitaminas y minerales Albion de alta absorción para un estilo de vida activo.',
    descripcion: 'Un multivitamínico pensado para personas activas: vitaminas y minerales en formas Albion de alta absorción, que ayudan a cubrir los requerimientos extra que impone el entrenamiento. Soporte diario para tu energía y tu sistema inmune.',
    modoDeUso: '1 cápsula por día, con una comida principal.',
    bandaBeneficio: 'Vitaminas y minerales Albion · alta absorción',
    beneficios: [
      { icono: 'escudo',  titulo: 'Cubre tus requerimientos', texto: 'Pensado para los extra que exige el entrenamiento.' },
      { icono: 'corazon', titulo: 'Energía y defensas',       texto: 'Apoya tu energía diaria y tu sistema inmune.' },
      { icono: 'hoja',    titulo: 'Alta absorción',           texto: 'Minerales en formas Albion mejor asimiladas.' }
    ],
    ingredientes: [
      { nombre: 'Minerales Albion',    texto: 'Formas queladas de alta biodisponibilidad.' },
      { nombre: 'Complejo vitamínico', texto: 'Vitaminas esenciales para personas activas.' }
    ]
  },
  {
    id: 'vitamin-multiple-sport-40',
    nombre: 'Vita-min Multiple Sport 40+',
    categoria: 'vitalidad',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/vitamin-multiple-sport-40.webp',
    rating: 4.8, reviews: 52, tags: ['Nuevo'], destacado: false,
    resumen: 'Multivitamínico +40 con Saw Palmetto y Ashwagandha KSM-66 para soporte hormonal y vitalidad.',
    descripcion: 'Formulado para quienes pasan los 40 y siguen entrenando: suma Saw Palmetto y Ashwagandha KSM-66 al complejo de vitaminas y minerales, apoyando el equilibrio hormonal, la energía y la recuperación en esta etapa.',
    modoDeUso: '1 cápsula por día, con una comida principal.',
    bandaBeneficio: 'Multivitamínico +40 · con Saw Palmetto y Ashwagandha KSM-66',
    beneficios: [
      { icono: 'balanza', titulo: 'Soporte +40',        texto: 'Formulado para quienes pasan los 40 y siguen entrenando.' },
      { icono: 'hoja',    titulo: 'Equilibrio hormonal', texto: 'Saw Palmetto y Ashwagandha KSM-66 como apoyo.' },
      { icono: 'rayo',    titulo: 'Energía',             texto: 'Ayuda en la energía y la recuperación de esta etapa.' }
    ],
    ingredientes: [
      { nombre: 'Ashwagandha KSM-66', texto: 'Adaptógeno que apoya el manejo del estrés.' },
      { nombre: 'Saw Palmetto',       texto: 'Soporte para la salud masculina.' }
    ]
  },
  {
    id: 'gold-omega-3-sport',
    nombre: 'Gold Omega 3 Sport',
    categoria: 'vitalidad',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/gold-omega-3-sport.webp',
    rating: 4.8, reviews: 76, tags: [], destacado: true,
    resumen: 'Aceite de pescado concentrado, rico en EPA y DHA para salud cardiovascular y cerebral.',
    descripcion: 'Ácidos grasos omega 3 de alta concentración (EPA y DHA) a partir de aceite de pescado purificado. Apoyan la salud cardiovascular, la función cerebral y el manejo de la inflamación propia del entrenamiento intenso.',
    modoDeUso: '1 a 2 cápsulas por día, con las comidas.',
    bandaBeneficio: 'Omega 3 concentrado · rico en EPA y DHA',
    beneficios: [
      { icono: 'corazon', titulo: 'Salud cardiovascular', texto: 'EPA y DHA que apoyan el corazón.' },
      { icono: 'cerebro', titulo: 'Función cerebral',     texto: 'Ácidos grasos esenciales para el cerebro.' },
      { icono: 'escudo',  titulo: 'Antiinflamatorio',     texto: 'Ayuda con la inflamación del entrenamiento intenso.' }
    ],
    ingredientes: [
      { nombre: 'EPA y DHA',                  texto: 'Omega 3 de alta concentración.' },
      { nombre: 'Aceite de pescado purificado', texto: 'Fuente limpia y concentrada.' }
    ]
  },
  {
    id: 'arthroblock-forte',
    nombre: 'Arthroblock Forte',
    categoria: 'vitalidad',
    categoriasExtra: [],
    precio: null,
    imagen: 'assets/img/products/arthroblock-forte.webp',
    rating: 4.6, reviews: 33, tags: [], destacado: false,
    resumen: 'Fórmula de 7 activos con condroitina y ácido hialurónico para el refuerzo de las articulaciones.',
    descripcion: 'Arthroblock Forte combina 7 ingredientes activos —entre ellos condroitina y ácido hialurónico— para cuidar y reforzar las articulaciones sometidas a carga. Pensado para uso sostenido en quienes entrenan fuerte y quieren proteger sus movimientos.',
    modoDeUso: 'Seguí la dosis indicada en el envase, junto a una comida. Pensado para uso sostenido en el tiempo.',
    bandaBeneficio: '7 activos articulares · con condroitina y ácido hialurónico',
    beneficios: [
      { icono: 'hueso',  titulo: 'Refuerzo articular', texto: 'Cuida las articulaciones sometidas a carga.' },
      { icono: 'escudo', titulo: '7 activos',          texto: 'Fórmula completa para el cuidado de tus movimientos.' },
      { icono: 'diana',  titulo: 'Uso sostenido',      texto: 'Pensado para quienes entrenan fuerte a largo plazo.' }
    ],
    ingredientes: [
      { nombre: 'Condroitina',       texto: 'Componente del cartílago articular.' },
      { nombre: 'Ácido hialurónico', texto: 'Apoya la lubricación de las articulaciones.' }
    ]
  }
];


/* --------------------------------------------------------------------------
   6) GUÍAS DE USO (la sección "Guía de uso de productos", ex "Blog")
   El contenido completo de cada guía vive en su propio archivo .html.
   -------------------------------------------------------------------------- */
const VITALICA_ARTICULOS = [
  {
    id: 'creatina',
    titulo: 'Creatina: cómo tomarla y por qué funciona (sin mitos)',
    tema: 'Fuerza',
    resumen: 'Qué dice la ciencia sobre la creatina, la dosis correcta y los mitos más comunes que conviene dejar atrás.',
    archivo: 'guia-creatina.html',
    fecha: '2026-05-20', leeMin: 5, acento: 'naranja',
    foto: 'assets/img/guias/creatina.jpg'
  },
  {
    id: 'proteina-suero',
    titulo: 'Proteína de suero: cuándo, cuánto y para qué',
    tema: 'Recuperación',
    resumen: 'Timing, cantidad y para quién tiene sentido la proteína en polvo. Lo esencial, sin vueltas.',
    archivo: 'guia-proteina-suero.html',
    fecha: '2026-05-12', leeMin: 6, acento: 'navy',
    foto: 'assets/img/guias/proteina-suero.jpg'
  },
  {
    id: 'pre-entrenos',
    titulo: 'Pre-entrenos: beta-alanina, citrulina y cafeína explicados',
    tema: 'Deporte de resistencia',
    resumen: 'Qué hace cada ingrediente de tu pre-entreno y cómo usarlo bien, sin pasarte de la raya.',
    archivo: 'guia-pre-entrenos.html',
    fecha: '2026-04-30', leeMin: 7, acento: 'mixto',
    foto: 'assets/img/guias/pre-entrenos.jpg'
  }
];


/* --------------------------------------------------------------------------
   7) TIENDAS — dónde se consigue Vitalica / Olimp (página Contacto)
   ⚠️ Direcciones PLACEHOLDER: reemplazá por las reales.
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   POP-UPS DE CAMPAÑA
   --------------------------------------------------------------------------
   Avisos que aparecen sobre la página para comunicar promociones, beneficios,
   lanzamientos o campañas puntuales.

   CÓMO USARLO
   -----------
   • Para prender uno: poné activo: true. Para apagarlo: activo: false.
     No hace falta borrarlo — apagado no molesta y queda listo para reusar.
   • Para una campaña nueva: copiá un bloque entero y cambiale el 'id'.

   EL 'id' ES IMPORTANTE
   ---------------------
   Cuando alguien cierra un pop-up, el navegador se acuerda de ese id y no se
   lo vuelve a mostrar por 'repetirDias'. Si editás el texto de una campaña que
   ya salió y querés que la vuelvan a ver, CAMBIÁ EL ID (por ejemplo de
   'promo-junio' a 'promo-junio-b'). Si dejás el mismo id, los que ya lo
   cerraron no lo van a ver de nuevo.

   REGLAS
   ------
   paginas     Lista de archivos donde aparece. Vacío [] = en todas.
               Ejemplo: ['index.html', 'productos.html']
   segundos    Cuánto espera antes de aparecer. 0 = al instante.
               Menos de 3 suele sentirse invasivo.
   repetirDias Días que espera para volver a mostrarlo a quien lo cerró.
               0 = se lo muestra en cada visita (usar con cuidado).
   soloUnaVez  true = una sola vez por persona, para siempre. Sirve para
               lanzamientos; para promos recurrentes dejalo en false.

   Si hay varios activos para la misma página, se muestra SOLO el primero de
   la lista. Es a propósito: dos pop-ups encima del otro espantan al cliente.
   -------------------------------------------------------------------------- */
const VITALICA_POPUPS = [
  {
    id: 'envio-gratis-lanzamiento',
    activo: false,
    etiqueta: 'Beneficio',
    titulo: '¿Primera compra?',
    texto: 'Escribinos por WhatsApp antes de cerrar tu pedido y un asesor te ayuda a elegir según tu objetivo. Sin costo y sin compromiso.',
    imagen: '',
    cta:  { texto: 'Hablar con un asesor', href: 'whatsapp' },
    cta2: { texto: 'Ver productos', href: 'productos.html' },
    paginas: ['index.html'],
    segundos: 8,
    repetirDias: 7,
    soloUnaVez: false
  },
  {
    id: 'ejemplo-lanzamiento',
    activo: false,
    etiqueta: 'Lanzamiento',
    titulo: 'Nuevo en Vitalica',
    texto: 'Cambiá este texto por la campaña que quieras comunicar. Para que aparezca, poné activo: true.',
    imagen: '',
    cta:  { texto: 'Ver el producto', href: 'producto.html?id=redweiler' },
    cta2: null,
    paginas: [],
    segundos: 5,
    repetirDias: 14,
    soloUnaVez: true
  }
];


/* COMERCIOS ALIADOS — la lista única.

   Antes había DOS listas de los mismos negocios: ésta (6, con dirección) y
   otra dentro de VITALICA_CONFIG.aliados (11, con logo). La de direcciones
   quedó a medias —cuatro decían "Dirección a confirmar"— y encima el panel
   admin editaba la que el sitio casi no mostraba.

   Ahora hay una sola, y se muestra igual en la home y en "Dónde comprar":
   el logo del comercio, no su dirección. Estos negocios tienen varias
   sucursales y las cambian; mantener direcciones acá sería prometer un dato
   que no podemos sostener. Quien busca un local pregunta por WhatsApp.

   'logo' es opcional: si un aliado todavía no mandó el suyo, se muestra el
   nombre en texto y no queda un hueco.

   'ancho' y 'altura' NO se inventan ni se copian entre logos: las calcula
   herramientas/recortar-logos.ps1 igualando el ÁREA de cada uno, que es lo que
   el ojo compara. Con la misma altura, un logo muy apaisado queda larguísimo
   al lado de uno compacto; con el mismo ancho, pasa al revés.

   Si se agrega o cambia un logo, correr ese script y copiar lo que imprime.
   Ver assets/img/aliados/LEEME.txt. */
const VITALICA_TIENDAS = [
  { nombre: 'Shopping China',     ciudad: 'Ciudad del Este', logo: 'assets/img/aliados/shopping-china.png',  ancho: 168,  altura: 41 },
  { nombre: 'Farmacias Energy',   ciudad: '',                logo: 'assets/img/aliados/energy.png',          ancho: 111, altura: 61 },
  { nombre: 'Bigg',               ciudad: '',                logo: 'assets/img/aliados/bigg.png',            ancho: 140, altura: 48 },
  { nombre: 'Cellshop',           ciudad: 'Ciudad del Este', logo: 'assets/img/aliados/cellshop.png',        ancho: 146, altura: 47 },
  { nombre: 'GTC',                ciudad: '',                logo: 'assets/img/aliados/gtc.png',             ancho: 148, altura: 46 },
  { nombre: 'Fit Way',            ciudad: 'Asunción',        logo: 'assets/img/aliados/fitway.png',          ancho: 152, altura: 45 },
  // 'alias' son nombres con los que el comercio figuró antes. Sirven para que
  // un cambio guardado en el panel con el nombre viejo siga encontrando su
  // logo. El Negro figuraba como 'Negros Suplementos' en la lista anterior.
  { nombre: 'El Negro',           ciudad: 'Asunción',        logo: 'assets/img/aliados/el-negro.png',        ancho: 162, altura: 42,
    alias: ['Negros Suplementos'] },
  { nombre: 'Toku',               ciudad: '',                logo: 'assets/img/aliados/toku.png',            ancho: 190, altura: 27 },
  { nombre: 'Contimarket',        ciudad: '',                logo: 'assets/img/aliados/contimarket.png',     ancho: 190, altura: 35 },
  { nombre: 'The Vitamin Shoppe', ciudad: 'Gran Asunción y Encarnación', logo: 'assets/img/aliados/vitamin-shoppe.png', ancho: 190, altura: 25 }
,

  /* ALTAS DEL 17/9/2026 (marketing). Logos cargados el mismo día.

     LAS MEDIDAS SALEN DE UNA CUENTA, NO DE OJO
     Los diez logos de arriba están todos en unos 6.800 px² de superficie, que
     es lo que hace que ninguno le gane a los demás. Se midió el recuadro real
     de cada archivo nuevo (sin el aire de alrededor) y se despejó el alto
     para llegar a esa misma superficie, con el tope de 190 px de ancho que ya
     tenían los otros.

     Los nombres de archivo van en MINÚSCULA. Llegaron como TUPI.webp y
     UNICENTRO.webp: en Windows da igual, pero el hosting es Linux y ahí
     TUPI.webp y tupi.webp son dos archivos distintos. Subido tal cual,
     el logo daba 404 solo en producción.

     DOS COSAS PARA MEJORAR CUANDO SE PUEDA
       · Tupi es cuadrado (relación 0,97) y el resto son wordmarks apaisados.
         A igual superficie quedaría muchísimo más alto que la fila, así que
         se le puso tope de alto. Es la decisión correcta para que la fila se
         vea pareja, pero si algun día mandan una versión horizontal, mejor.
       · RM Pro viene con fondo negro y gris, no transparente: en la pared de
         logos se ve como una tarjeta oscura entre logos sueltos. Es su logo
         tal cual lo mandaron; si tienen la versión sin fondo, queda mejor.
       · Unicentro mide 200x35 px en el archivo y se muestra a 190: no hay
         margen para pantallas de alta densidad y se va a ver un poco blando.
         Si aparece uno más grande, reemplazarlo. */
  { nombre: 'Tupi',               ciudad: '',                logo: 'assets/img/aliados/tupi.webp',      ancho: 72,  altura: 74 },
  { nombre: 'Unicentro',          ciudad: '',                logo: 'assets/img/aliados/unicentro.webp', ancho: 190, altura: 33 },
  { nombre: 'RM Pro Performance', ciudad: '',                logo: 'assets/img/aliados/rm-pro.png',     ancho: 135, altura: 51 }

  // NO volver a agregar 'Nutrición Total' sin preguntar antes.
  // Estaba en la lista vieja desde antes, con la dirección "a confirmar" y sin
  // logo, y no aparece en ningún material del Drive: ni en LOGOS ALIADOS, ni en
  // el catálogo, ni en ningún archivo. Se preguntó y hoy NO es aliado.
  // Si vuelve a serlo, se agrega con su logo como el resto.
];


/* --------------------------------------------------------------------------
   8) GUÍAS DE USO POR PRODUCTO (contenido real de las "Guías Esenciales")
   Se muestran INLINE en cada página de producto. Campos (todos opcionales
   salvo comoTomar): comoTomar, pasos[], siSirve[], noSirve[], queEsperar[],
   cuidados[], faqs[].
   -------------------------------------------------------------------------- */
const VITALICA_GUIAS = {
  'whey-protein-complex': {
    comoTomar: '1 medida (1 scoop ≈ 35 g) aporta ~26 g de proteína —más o menos lo que un bife mediano. 1 scoop por día es la base; si tomás 2, repartilas (una post-entreno y otra como merienda). Para tu dosis exacta según tu objetivo, consultá con un nutricionista.',
    pasos: ['150 a 200 ml de agua', 'Primero el líquido, después el polvo', 'Agitá 10 a 15 segundos', 'Nunca con agua hirviendo: el calor le saca propiedades'],
    siSirve: ['Llegar a la proteína que tu cuerpo necesita cuando la comida sola no alcanza', 'Acelerar la recuperación después de entrenar fuerte', 'Cuidar el músculo cuando bajás de peso o entrenás mucho'],
    noSirve: ['No "quema grasa" por sí sola', 'No construye músculo si no entrenás', 'No reemplaza la comida: es un complemento'],
    queEsperar: [
      { etapa: 'Semanas 1-2', texto: 'Te recuperás mejor: menos cansancio entre entrenamientos.' },
      { etapa: 'Semanas 6-12', texto: 'Cambios visibles: más músculo y mejor forma, si entrenás, comés y dormís bien.' }
    ],
    cuidados: ['Contiene lactosa: no apta para intolerantes a la lactosa', 'El horario no es clave: lo que importa es la proteína total del día', 'Consultá a tu médico si estás embarazada, amamantando, tenés problemas renales o sos alérgico a la leche'],
    faqs: [
      { q: '¿Engorda?', a: 'No por sí sola. Lo que engorda es comer de más en general.' },
      { q: '¿La tomo si no entreno?', a: 'Sí, completa la proteína del día igual.' },
      { q: '¿Sirve para mujeres?', a: 'Sí, funciona exactamente igual.' },
      { q: '¿Daña el riñón?', a: 'No, si tu riñón está sano. Con problemas renales, consultá a tu médico.' }
    ]
  },
  'creatine-monohydrate': {
    comoTomar: '0,1 g por cada kilo de tu peso, en una sola toma al día (50 kg ≈ 5 g · 70 kg ≈ 7 g · 90 kg ≈ 9 g). 1 scoop de Olimp = 3 g. No hace falta "fase de carga": con tu dosis diaria llegás al máximo en ~3 semanas.',
    pasos: ['Tomala todos los días, también los que no entrenás', 'Mejor con una comida o algo de carbohidrato', 'Mantené 2 a 3 litros de agua al día', 'Mezclala y tomala en el momento (no la dejes preparada)'],
    queEsperar: [
      { etapa: 'Días 1-15', texto: 'Saturación: tus músculos se llenan de creatina. Quizás no sientas nada todavía.' },
      { etapa: 'Día 20 en adelante', texto: 'Más fuerza y mejor recuperación: esa última repetición empieza a salir.' }
    ],
    cuidados: ['No con líquido hirviendo (el calor la degrada)', 'Si sos sensible, evitá tomarla con el estómago vacío', 'Guardala en lugar fresco y seco, bien cerrada (la humedad la afecta)', 'Sube el valor de "creatinina" en los análisis sin ser daño renal: avisá a tu médico antes de un análisis de sangre'],
    faqs: [
      { q: '¿Me va a hinchar?', a: 'No. Retiene agua DENTRO del músculo, no debajo de la piel: te ves más denso y definido, no hinchado.' },
      { q: '¿Necesito fase de carga?', a: 'No. Con tu dosis diaria llegás al máximo en ~3 semanas.' },
      { q: '¿La tomo los días que no entreno?', a: 'Sí. Funciona por acumulación: la constancia es todo.' }
    ]
  },
  'redweiler': {
    comoTomar: 'La dosis va según tu peso: hasta 75 kg → 6 g (¼ medida, 100 mg de cafeína); 75 a 90 kg → 12 g (½ medida, 200 mg); más de 90 kg → 18 g (¾ medida, 300 mg). Tomalo 30 minutos antes de entrenar. ¿Primera vez o sensible a la cafeína? Empezá por la dosis más baja.',
    pasos: ['Disolvé en 100 a 300 ml de agua según tu dosis', 'Agitá el envase antes de usar', 'Usalo en tus días pesados, no todos los días', 'Acompañá con agua o Iso Plus para reponer las sales'],
    queEsperar: [
      { etapa: 'Durante el entreno', texto: 'Más energía, foco y fuerza en las últimas series, con un bombeo notable (músculos firmes, venas marcadas).' },
      { etapa: 'A los ~10 min', texto: 'Posible hormigueo por la beta-alanina: inofensivo, se va apenas empezás a moverte.' }
    ],
    cuidados: ['No lo tomes de noche (hasta 300 mg de cafeína, como 4-5 cafés)', 'No lo mezcles con café, energizantes, quemadores ni alcohol', 'No te pases de la dosis: puede dar taquicardia o mareos', 'Evitalo si tenés problemas de corazón o presión, embarazo, lactancia o sos menor de edad']
  },
  'knockout-2': {
    comoTomar: 'Dosis normal: 6,1 g = media medida (trae 200 mg de cafeína, ~3 cafés). ¿Primera vez o sensible? Empezá con la mitad (~3 g). Nunca llenes la medida completa. Tomalo 30 minutos antes de entrenar, en ~200 ml de agua.',
    pasos: ['Mejor con el estómago liviano (no después de una comida pesada)', 'Agitá el envase antes de cada uso', 'Usalo en tus días pesados, no todos los días', 'Acompañá con Iso Plus para reponer las sales'],
    queEsperar: [
      { etapa: 'Durante el entreno', texto: 'Energía, foco y bombeo muscular para empujar en el último esfuerzo.' },
      { etapa: 'A los ~10 min', texto: 'Posible hormigueo por la beta-alanina: normal e inofensivo.' }
    ],
    cuidados: ['No lo tomes de noche (200 mg de cafeína)', 'No lo mezcles con más cafeína ni alcohol', 'No te pases de la dosis: puede dar taquicardia o mareos', 'Evitalo si tenés problemas de corazón o presión, embarazo, lactancia o sos menor de edad']
  },
  'beta-alanina-xplode': {
    comoTomar: '3,2 g (1 scoop) por día para la mayoría. 4,8 a 6,4 g si sos atleta, entrenás mucho o pesás más de 85-90 kg (partila en 2 tomas). El horario no importa: no es un pre-entreno, tomala cuando te quede cómodo.',
    pasos: ['Disolvé cada scoop en 150 a 200 ml de agua', 'Ya viene con sabor naranja: no le agregues jugo', 'Tomala todos los días, también los que no entrenás', 'Si el hormigueo molesta, partila en 2 tomas o tomala con comida'],
    queEsperar: [
      { etapa: 'Semana 1', texto: 'Arranca por dentro: vas a sentir el hormigueo, todavía sin diferencia al entrenar.' },
      { etapa: 'Semana 3-4 en adelante', texto: 'Aguantás más: ese ardor que te hacía parar aparece más tarde.' }
    ],
    cuidados: ['El hormigueo es normal e inofensivo y NO indica que funcione mejor', 'Se nota en esfuerzos fuertes y seguidos de 1 a 4 min (series largas, intervalos, funcional)', 'Va muy bien con la creatina: fuerza + aguante se complementan']
  },
  'iso-plus-powder': {
    comoTomar: 'Entreno moderado (~1 h): 1 scoop (17,5 g) en 250 ml. Entreno intenso o mucho calor: hasta 2 scoops en 500 ml por hora. Recuperación o día de calor: 1 medida en 500 ml bien fría.',
    pasos: ['Tomala bien fría (rendís mejor bajo el sol)', 'Sorbos chicos y seguidos, no todo de una vez', 'No le agregues azúcar ni jugo (deja de ser isotónica)', 'Agitá antes de usar si el polvo se compacta'],
    queEsperar: [
      { etapa: 'Durante el esfuerzo', texto: 'Hidratación más rápida que el agua sola y energía sostenida.' },
      { etapa: 'Al final', texto: 'Menos fatiga y menor probabilidad de calambres al reponer líquidos y sales.' }
    ],
    cuidados: ['Con L-carnitina: ayuda a usar la grasa como fuente de energía', 'En Paraguay la humedad endurece el polvo: es normal y no pierde efecto', 'Guardalo en lugar fresco y seco, bien cerrado']
  },
  'vitamin-multiple-sport': {
    comoTomar: '1 cápsula de cada color al día, con comida. Lo ideal: la naranja (vitaminas) en el desayuno o almuerzo, y la azul (minerales) en la cena. ¿Día caótico? Las dos juntas en el almuerzo.',
    pasos: ['Siempre con comida, no en ayunas', 'Lejos del café y el té (bloquean minerales): dejá pasar 30 min', 'Tomalas todos los días, también los que no entrenás'],
    queEsperar: [
      { etapa: 'Día a día', texto: 'Soporte de energía y defensas. Es como el aceite del motor: el efecto es acumulativo, no se siente el primer día.' }
    ],
    cuidados: ['Orina amarilla fuerte: normal e inofensivo (exceso de vitamina B2)', 'Va bien con Gold Omega 3 (las vitaminas A, D, E y K se absorben mejor con el aceite)', 'Con alcohol o medicación diaria, dejá 3-4 h de separación y consultá a tu médico']
  },
  'gold-omega-3-sport': {
    comoTomar: '1 cápsula al día para mantenimiento (ya cubre lo que tu corazón necesita). 2 al día si querés más apoyo para el cerebro o la recuperación. Siempre con la comida (es una grasa: se absorbe mejor).',
    pasos: ['Con el almuerzo o la cena (si tomás 2, una en cada comida)', 'Tomalo todos los días: el efecto es acumulativo', 'Sacá la cápsula del blister recién al tomarla (al aire se oxida)'],
    queEsperar: [
      { etapa: 'Semanas 3-4', texto: 'Los beneficios reales (corazón, cerebro, vista) se notan con uso diario sostenido.' }
    ],
    cuidados: ['No lo dejes al sol ni en el auto (el calor lo oxida)', 'No lo tomes en ayunas', 'Combo con el multivitamínico', 'Consultá a tu médico si tomás anticoagulantes o estás embarazada']
  },
  'arthroblock-forte': {
    comoTomar: 'Mantenimiento: 1 cápsula al día (con el desayuno o el almuerzo). Dolor o lesión: 1 cápsula 2 veces al día (después del almuerzo y de la cena). Siempre con comida.',
    pasos: ['Siempre con comida (la boswellia y el jengibre pueden caer pesados en ayunas)', 'Por ciclos: usalo 2-3 meses seguidos y después descansá 1-2 meses'],
    queEsperar: [
      { etapa: 'Primeras semanas', texto: 'Menos rigidez al despertar.' },
      { etapa: '2-3 meses', texto: 'Menos dolor al moverte. Trabaja lento: no es un analgésico.' }
    ],
    cuidados: ['Contiene derivados de mariscos (crustáceos): no tomar si sos alérgico', 'Guardalo en su blister (la humedad degrada la vitamina C y el ácido hialurónico)', 'Combo con Gold Omega 3 para cuidar mejor las articulaciones', 'Consultá a tu médico si tomás anticoagulantes; no recomendado en embarazo ni lactancia']
  }
};
// Vita-min 40+ usa la misma guía que Vita-min (no tiene PDF propio).
VITALICA_GUIAS['vitamin-multiple-sport-40'] = VITALICA_GUIAS['vitamin-multiple-sport'];


/* --------------------------------------------------------------------------
   9) COMBOS — productos que "van juntos" (relacionados y upsell)
   -------------------------------------------------------------------------- */
const VITALICA_COMBOS = [
  // Grupo A — recuperación / salud
  ['whey-protein-complex', 'creatine-monohydrate', 'vitamin-multiple-sport', 'vitamin-multiple-sport-40', 'gold-omega-3-sport', 'arthroblock-forte'],
  // Grupo B — rendimiento / resistencia
  ['iso-plus-powder', 'knockout-2', 'redweiler', 'beta-alanina-xplode']
];


/* --------------------------------------------------------------------------
   8-bis) FICHAS TÉCNICAS  ·  traídas del sitio en producción
   --------------------------------------------------------------------------
   Es la información que hoy vive en el modal de vitalica.com.py: los valores
   por porción, los sabores disponibles y la página del catálogo PDF.
   Se muestra en la página de producto (producto.html?id=).

   Campos:
     stats[]         → 3 valores destacados que se muestran como badges
     sabores[]       → sabores disponibles (con emoji)
     paginaCatalogo  → página del PDF a la que salta el botón "Ver catálogo"
     porcion         → texto completo de la ficha técnica
   -------------------------------------------------------------------------- */
const VITALICA_FICHAS = {
  'whey-protein-complex': {
    paginaCatalogo: 5,
    porcion: 'Por porción (35 g): 26 g de proteínas, 3,9 g de carbohidratos y 1,5 g de grasas.',
    stats: [
      { label: 'Proteínas', valor: '26 g' },
      { label: 'Carbohidratos', valor: '3,9 g' },
      { label: 'Grasas', valor: '1,5 g' }
    ],
    sabores: [
      { icono: '🍫', nombre: 'Doble Chocolate' },
      { icono: '🍓', nombre: 'Frutilla' },
      { icono: '🍦', nombre: 'Vainilla' },
      { icono: '🍪', nombre: 'Cookies' },
      { icono: '🍨', nombre: 'Vainilla Ice Cream' }
    ]
  },
  'creatine-monohydrate': {
    paginaCatalogo: 13,
    porcion: 'Por porción (3,4 g): 3,4 g de creatina monohidrato, 0 kcal.',
    stats: [
      { label: 'Creatina', valor: '3,4 g' },
      { label: 'Malla', valor: '200 mesh' },
      { label: 'Calorías', valor: '0 kcal' }
    ],
    sabores: [{ icono: '⚪', nombre: 'Sin sabor' }]
  },
  'redweiler': {
    paginaCatalogo: 10,
    porcion: 'Por porción (12 g): beta-alanina 2200 mg, creatina total 1845 mg, cafeína 200 mg.',
    stats: [
      { label: 'Beta alanina', valor: '2200 mg' },
      { label: 'Creatina', valor: '1845 mg' },
      { label: 'Cafeína', valor: '200 mg' }
    ],
    sabores: [
      { icono: '🫐', nombre: 'Blueberry' },
      { icono: '🍊', nombre: 'Naranja' },
      { icono: '🍒', nombre: 'Red Punch' }
    ]
  },
  'knockout-2': {
    paginaCatalogo: 11,
    porcion: 'Por porción (6,1 g): beta-alanina 2100 mg, L-arginina 1100 mg, L-citrulina 600 mg, taurina 600 mg, cafeína 200 mg.',
    stats: [
      { label: 'Beta alanina', valor: '2100 mg' },
      { label: 'L-arginina', valor: '1100 mg' },
      { label: 'Cafeína', valor: '200 mg' }
    ],
    sabores: [{ icono: '🍋', nombre: 'Fresh Citrus' }]
  },
  'beta-alanina-xplode': {
    paginaCatalogo: 15,
    porcion: 'Por porción (9,6 g): beta-alanina 1600 mg, L-histidina 80 mg, bicarbonato de sodio 400 mg, vitamina B6 0,98 mg.',
    stats: [
      { label: 'Beta alanina', valor: '1600 mg' },
      { label: 'L-histidina', valor: '80 mg' },
      { label: 'Vitamina B6', valor: '0,98 mg' }
    ],
    sabores: [{ icono: '🍊', nombre: 'Naranja' }]
  },
  'iso-plus-powder': {
    paginaCatalogo: 8,
    // 15 g, no 18. El badge decía 18 g mientras la tabla nutricional de más
    // abajo en la MISMA página decía 15 g. El catálogo oficial (p08) confirma
    // 15 g, de los cuales 12 g de azúcares. Corregido el 16/9/2026.
    porcion: 'Por porción (17,5 g): 60 kcal, 15 g de carbohidratos, 0,29 g de sal.',
    stats: [
      { label: 'Energía', valor: '60 kcal' },
      { label: 'Carbohidratos', valor: '15 g' },
      { label: 'Sal', valor: '0,29 g' }
    ],
    sabores: [
      { icono: '🍋', nombre: 'Limón' },
      { icono: '🍊', nombre: 'Naranja' },
      { icono: '🫐', nombre: 'Tropic Blue' }
    ]
  },
  'vitamin-multiple-sport': {
    paginaCatalogo: 17,
    porcion: 'Por porción (1 cápsula): Vit. A 800 µg, Vit. D 10 µg, Vit. E 24 mg, Vit. C 290 mg, Vit. B1 19,4 mg, Vit. B2 19,6 mg, niacina 31 mg, Vit. B6 18,8 mg, Vit. B12 23 µg.',
    stats: [
      { label: 'Vitamina C', valor: '290 mg' },
      { label: 'Vitamina B6', valor: '18,8 mg' },
      { label: 'Vitamina B12', valor: '23 µg' }
    ],
    sabores: [{ icono: '💊', nombre: 'Cápsulas (sin sabor)' }]
  },
  'vitamin-multiple-sport-40': {
    paginaCatalogo: 18,
    porcion: 'Por porción (2 cápsulas): Vit. C 290 mg, Vit. B1 19,4 mg, Vit. B6 18,8 mg, Vit. B12 23 µg, saw palmetto 100 mg, ashwagandha KSM-66 50 mg.',
    stats: [
      { label: 'Saw palmetto', valor: '100 mg' },
      { label: 'Ashwagandha', valor: '50 mg' },
      { label: 'Vitamina C', valor: '290 mg' }
    ],
    sabores: [{ icono: '💊', nombre: 'Cápsulas (sin sabor)' }]
  },
  'gold-omega-3-sport': {
    paginaCatalogo: 19,
    porcion: 'Por porción (1 cápsula): aceite de pescado 1000 mg, EPA 330 mg, DHA 220 mg, vitamina E 12 mg.',
    stats: [
      { label: 'EPA', valor: '330 mg' },
      { label: 'DHA', valor: '220 mg' },
      { label: 'Vitamina E', valor: '12 mg' }
    ],
    sabores: [{ icono: '💊', nombre: 'Cápsulas (sin sabor)' }]
  },
  'arthroblock-forte': {
    paginaCatalogo: 20,
    porcion: 'Por porción: glucosamina 1000 mg, condroitina 200 mg, ácido hialurónico 50 mg, boswellia 100 mg, jengibre 100 mg.',
    stats: [
      { label: 'Glucosamina', valor: '1000 mg' },
      { label: 'Condroitina', valor: '200 mg' },
      { label: 'Ác. hialurónico', valor: '50 mg' }
    ],
    sabores: [{ icono: '💊', nombre: 'Cápsulas (sin sabor)' }]
  }
};


/* --------------------------------------------------------------------------
   8-ter) VARIANTES  ·  qué se puede comprar realmente
   --------------------------------------------------------------------------
   Cada combinación de SABOR + PRESENTACIÓN que existe en Odoo, con su código
   de barras. El código es la identidad del producto: es lo que permite que un
   pedido de la web se convierta en una línea exacta en Odoo, sin que nadie
   tenga que adivinar cuál de los nueve Whey quería el cliente.

   ⚠️ TIENE QUE COINCIDIR CON EL MAPEO DE sync-odoo-precios.py.
   Si agregás un sabor o una presentación, agregalo en los DOS lugares. Si un
   código no existe en Odoo, ese producto queda sin precio en el sitio.

   NO ES UNA COMBINACIÓN AUTOMÁTICA. El Whey tiene 5 sabores en 700 g pero
   solo 4 en 2270 g (Cookies no viene en el envase grande). Por eso las
   combinaciones se escriben una por una: la web ofrece exactamente lo que
   existe, y no deja pedir algo que no se puede entregar.

   Si un producto no está en esta lista, se vende sin elegir nada (es lo
   correcto para las cápsulas, que vienen en una sola presentación).
   -------------------------------------------------------------------------- */
/* IMÁGENES DE RESPALDO POR TAMAÑO.

   Olimp no manda un packshot de cada sabor, pero sí uno "universal" por
   presentación. Sirven para las variantes que no tienen foto de sabor propia.

   Sin esto, una variante sin 'imagen' caía directo a la foto genérica del
   producto —que es la bolsa de 2270 g— y un sabor de 700 g terminaba
   mostrando el envase del tamaño equivocado.

   El orden de preferencia lo resuelve Datos.imagenVariante():
       foto del sabor  →  foto del tamaño  →  foto genérica del producto

   Las claves de tamaño tienen que escribirse EXACTO igual que en el campo
   'tamano' de las variantes de abajo (con el espacio: '700 g', no '700g').
   Los archivos los genera herramientas/generar-variantes-tamano.ps1 */
const VITALICA_IMAGEN_POR_TAMANO = {
  'whey-protein-complex': {
    '700 g':  'assets/img/products/variantes/whey-protein-complex-700g.png',
    '2270 g': 'assets/img/products/variantes/whey-protein-complex-2270g.png'
  },
  'redweiler': {
    '480 g': 'assets/img/products/variantes/redweiler-480g.png'
  }
  // Iso Plus 700 g queda afuera a propósito: el único archivo que hay de ese
  // tamaño es el de limón, y usarlo como genérico mostraría un envase amarillo
  // para el sabor naranja. Mejor la foto del producto que una foto equivocada.
};


const VITALICA_VARIANTES = {

  'whey-protein-complex': [
    { codigo: '5901330063985', sabor: 'Doble Chocolate',    icono: '🍫', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330063985.png' },
    { codigo: '5901330037986', sabor: 'Vainilla',           icono: '🍦', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330037986.png' },
    { codigo: '5901330038006', sabor: 'Frutilla',           icono: '🍓', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330038006.png' },
    { codigo: '5901330088261', sabor: 'Cookies',            icono: '🍪', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330088261.png' },
    // De la carpeta PROTEINA OTROS SABORES / 700 g / Vainilla Ice Cream del
    // Drive de marketing. Bajada el 16/9/2026.
    { codigo: '5901330081705', sabor: 'Vainilla Ice Cream', icono: '🍨', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330081705.jpg' },
    { codigo: '5901330064029', sabor: 'Doble Chocolate',    icono: '🍫', tamano: '2270 g', imagen: 'assets/img/products/variantes/5901330064029.png' },
    { codigo: '5901330044496', sabor: 'Frutilla',           icono: '🍓', tamano: '2270 g' },
    { codigo: '5901330044373', sabor: 'Vainilla',           icono: '🍦', tamano: '2270 g' },
    { codigo: '5901330087189', sabor: 'Vainilla Ice Cream', icono: '🍨', tamano: '2270 g' }
  ],

  'creatine-monohydrate': [
    { codigo: '5901330026447', sabor: 'Sin sabor', icono: '⚪', tamano: '250 g', imagen: 'assets/img/products/variantes/5901330026447.png' },
    { codigo: '5901330026461', sabor: 'Sin sabor', icono: '⚪', tamano: '550 g', imagen: 'assets/img/products/variantes/5901330026461.png' }
  ],

  /* Los tres sabores comparten foto, y no es un parche.
     -----------------------------------------------------------------------
     En la carpeta de marketing hay tres fotos del Redweiler de 480 g, pero
     son el frente, el dorso y el costado del MISMO envase. Mirando el frente
     en grande se ve por qué: no dice el sabor en ninguna parte. Olimp lo
     imprime solo en la etiqueta de atrás.

     O sea que el envase de Blueberry, el de Naranja y el de Red Punch se ven
     exactamente iguales de frente. Mostrar la misma foto en los tres no es
     conformarse: es lo que hay en la góndola. El sabor lo dice el nombre
     abajo del círculo. */
  'redweiler': [
    { codigo: '5901330044861', sabor: 'Blueberry', icono: '🫐', tamano: '480 g', imagen: 'assets/img/products/variantes/redweiler-480g.png' },
    { codigo: '5901330046094', sabor: 'Naranja',   icono: '🍊', tamano: '480 g', imagen: 'assets/img/products/variantes/redweiler-480g.png' },
    { codigo: '5901330046599', sabor: 'Red Punch', icono: '🍒', tamano: '480 g', imagen: 'assets/img/products/variantes/redweiler-480g.png' }
  ],

  'knockout-2': [
    { codigo: '5901330056291', sabor: 'Fresh Citrus', icono: '🍋', tamano: '305 g', imagen: 'assets/img/products/variantes/5901330056291.png' }
  ],

  'beta-alanina-xplode': [
    { codigo: '5901330077739', sabor: 'Naranja', icono: '🍊', tamano: '250 g', imagen: 'assets/img/products/variantes/5901330077739.png' }
  ],

  'iso-plus-powder': [
    // Estas dos estaban en el Drive y no en el proyecto: las bajó
    // herramientas/instalar-packshot.ps1 el 16/9/2026. Van en .webp porque es
    // el formato en que Olimp las publica y no hace falta reconvertirlas.
    { codigo: '5901330024214', sabor: 'Naranja',     icono: '🍊', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330024214.webp' },
    { codigo: '5901330024207', sabor: 'Tropic Blue', icono: '🫐', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330024207.webp' },
    { codigo: '5901330024221', sabor: 'Limón',       icono: '🍋', tamano: '700 g', imagen: 'assets/img/products/variantes/5901330024221.png' },
    { codigo: '5901330037726', sabor: 'Naranja',     icono: '🍊', tamano: '1505 g', imagen: 'assets/img/products/variantes/5901330037726.jpg' },
    { codigo: '5901330037924', sabor: 'Tropic Blue', icono: '🫐', tamano: '1505 g', imagen: 'assets/img/products/variantes/5901330037924.jpg' }
  ],

  'vitamin-multiple-sport':    [{ codigo: '5901330043628', sabor: '', icono: '💊', tamano: '60 cápsulas', imagen: 'assets/img/products/variantes/5901330043628.png' }],
  'vitamin-multiple-sport-40': [{ codigo: '5901330054853', sabor: '', icono: '💊', tamano: '60 cápsulas', imagen: 'assets/img/products/variantes/5901330054853.png' }],
  'gold-omega-3-sport':        [{ codigo: '5901330030581', sabor: '', icono: '💊', tamano: '120 cápsulas', imagen: 'assets/img/products/variantes/5901330030581.png' }],
  'arthroblock-forte':         [{ codigo: '5901330055270', sabor: '', icono: '💊', tamano: '60 cápsulas', imagen: 'assets/img/products/variantes/5901330055270.png' }]
};


/* --------------------------------------------------------------------------
   8-quinquies) GALERÍA DE FOTOS POR VARIANTE
   --------------------------------------------------------------------------
   La ficha mostraba UNA foto por producto. Diego viene pidiendo "más
   imágenes, más visual" y acá había material sin usar: la carpeta de fotos
   de producto de marketing (Drive, 17/9/2026) trae entre 2 y 7 tomas de cada
   envase — frente, dorso con la tabla nutricional, perfil, 3/4.

   LA CLAVE ES EL CÓDIGO DE BARRAS, NO EL PRODUCTO
   ----------------------------------------------
   Porque las fotos son de un envase concreto: la bolsa de Frutilla de 700 g
   no es la de Doble Chocolate de 2270 g. Si la galería colgara del producto,
   al elegir "Frutilla" se verían fotos de chocolate. Colgando del código, la
   galería cambia junto con el selector de sabor, que es lo correcto.

   CÓMO SE ARMARON
   ---------------
   herramientas/armar-galeria-productos.ps1. Recorta cada foto al envase y lo
   recentra, para que todas se vean del mismo tamaño aunque las tomas vengan
   distintas; y descarta las de canto (el envase más de 4 veces más largo que
   ancho), que se leen como un palito. De 63 fotos entraron 57.

   Para agregar más: dejar los originales en una carpeta con el nombre
   <codigo>__<n>.jpg y volver a correr el script.

   Lo que NO está acá no se dibuja: un código sin entrada muestra la ficha
   como siempre, con el packshot solo.
   -------------------------------------------------------------------------- */
const VITALICA_GALERIA = {
  '5901330024221': [                    'assets/img/products/galeria/5901330024221-1.jpg',
                    'assets/img/products/galeria/5901330024221-2.jpg'
  ],
  '5901330026447': [                    'assets/img/products/galeria/5901330026447-1.jpg',
                    'assets/img/products/galeria/5901330026447-2.jpg',
                    'assets/img/products/galeria/5901330026447-3.jpg'
  ],
  '5901330026461': [                    'assets/img/products/galeria/5901330026461-1.jpg',
                    'assets/img/products/galeria/5901330026461-2.jpg',
                    'assets/img/products/galeria/5901330026461-3.jpg'
  ],
  '5901330030581': [                    'assets/img/products/galeria/5901330030581-1.jpg',
                    'assets/img/products/galeria/5901330030581-2.jpg',
                    'assets/img/products/galeria/5901330030581-3.jpg',
                    'assets/img/products/galeria/5901330030581-4.jpg'
  ],
  '5901330037726': [                    'assets/img/products/galeria/5901330037726-1.jpg',
                    'assets/img/products/galeria/5901330037726-2.jpg'
  ],
  '5901330037986': [                    'assets/img/products/galeria/5901330037986-1.jpg',
                    'assets/img/products/galeria/5901330037986-2.jpg',
                    'assets/img/products/galeria/5901330037986-3.jpg'
  ],
  '5901330038006': [                    'assets/img/products/galeria/5901330038006-1.jpg',
                    'assets/img/products/galeria/5901330038006-2.jpg'
  ],
  '5901330043628': [                    'assets/img/products/galeria/5901330043628-1.jpg',
                    'assets/img/products/galeria/5901330043628-2.jpg',
                    'assets/img/products/galeria/5901330043628-3.jpg',
                    'assets/img/products/galeria/5901330043628-4.jpg'
  ],
  '5901330044496': [                    'assets/img/products/galeria/5901330044496-1.jpg',
                    'assets/img/products/galeria/5901330044496-2.jpg',
                    'assets/img/products/galeria/5901330044496-3.jpg',
                    'assets/img/products/galeria/5901330044496-4.jpg',
                    'assets/img/products/galeria/5901330044496-5.jpg'
  ],
  '5901330044861': [                    'assets/img/products/galeria/5901330044861-1.jpg',
                    'assets/img/products/galeria/5901330044861-2.jpg',
                    'assets/img/products/galeria/5901330044861-3.jpg'
  ],
  '5901330054853': [                    'assets/img/products/galeria/5901330054853-1.jpg',
                    'assets/img/products/galeria/5901330054853-2.jpg',
                    'assets/img/products/galeria/5901330054853-3.jpg',
                    'assets/img/products/galeria/5901330054853-4.jpg'
  ],
  '5901330055270': [                    'assets/img/products/galeria/5901330055270-1.jpg',
                    'assets/img/products/galeria/5901330055270-2.jpg',
                    'assets/img/products/galeria/5901330055270-3.jpg',
                    'assets/img/products/galeria/5901330055270-4.jpg',
                    'assets/img/products/galeria/5901330055270-5.jpg',
                    'assets/img/products/galeria/5901330055270-6.jpg',
                    'assets/img/products/galeria/5901330055270-7.jpg'
  ],
  '5901330056291': [                    'assets/img/products/galeria/5901330056291-1.jpg',
                    'assets/img/products/galeria/5901330056291-2.jpg',
                    'assets/img/products/galeria/5901330056291-3.jpg'
  ],
  '5901330063985': ['assets/img/products/galeria/5901330063985-1.jpg'],
  '5901330064029': [                    'assets/img/products/galeria/5901330064029-1.jpg',
                    'assets/img/products/galeria/5901330064029-2.jpg',
                    'assets/img/products/galeria/5901330064029-3.jpg',
                    'assets/img/products/galeria/5901330064029-4.jpg'
  ],
  '5901330077739': [                    'assets/img/products/galeria/5901330077739-1.jpg',
                    'assets/img/products/galeria/5901330077739-2.jpg',
                    'assets/img/products/galeria/5901330077739-3.jpg'
  ],
  '5901330081705': [                    'assets/img/products/galeria/5901330081705-1.jpg',
                    'assets/img/products/galeria/5901330081705-2.jpg',
                    'assets/img/products/galeria/5901330081705-3.jpg'
  ],
  '5901330088261': [                    'assets/img/products/galeria/5901330088261-1.jpg',
                    'assets/img/products/galeria/5901330088261-2.jpg'
  ]
};


/* LAS TOMAS DE GRUPO VALEN PARA TODAS LAS VARIANTES QUE SALEN EN LA FOTO
   --------------------------------------------------------------------------
   Olimp no fotografió cada sabor por separado: hay tomas donde salen los
   tres envases juntos, y el archivo se llama con los tres códigos. Esas
   fotos muestran de verdad a cada una de esas variantes, así que se apuntan
   desde todas. Las líneas de abajo no duplican archivos: reutilizan el mismo.

   El caso de Redweiler además ya estaba comprobado: los tres sabores tienen
   el frente del envase idéntico, no hay nada que los distinga de frente.
   -------------------------------------------------------------------------- */
VITALICA_GALERIA['5901330024214'] = VITALICA_GALERIA['5901330024221'];  // Iso Plus 700 g
VITALICA_GALERIA['5901330024207'] = VITALICA_GALERIA['5901330024221'];
VITALICA_GALERIA['5901330037924'] = VITALICA_GALERIA['5901330037726'];  // Iso Plus 1505 g
VITALICA_GALERIA['5901330044373'] = VITALICA_GALERIA['5901330044496'];  // Whey 2270 g
VITALICA_GALERIA['5901330087189'] = VITALICA_GALERIA['5901330044496'];
VITALICA_GALERIA['5901330046094'] = VITALICA_GALERIA['5901330044861'];  // Redweiler
VITALICA_GALERIA['5901330046599'] = VITALICA_GALERIA['5901330044861'];


/* --------------------------------------------------------------------------
   8-quater) CAMPAÑAS  ·  etiquetas y promociones por producto
   --------------------------------------------------------------------------
   Se edita desde el panel (admin.html → "Etiquetas y promociones") o acá.

   POR QUÉ ESTO NO VIENE DE ODOO
   -----------------------------
   El precio y el stock SÍ vienen de Odoo, porque son hechos del inventario y
   tienen un único dueño. "Nuevo", "Lanzamiento" o "Promo" son decisiones de
   marketing: cambian por campaña, no por movimiento de stock.

   Odoo no sabe si algo es un lanzamiento en la web. Sabe cuándo se creó el
   producto — y un producto cargado hace ocho meses puede lanzarse hoy, o una
   reposición del mismo código no es una novedad para el cliente. Por eso lo
   decide una persona, no el ERP.

   LO IMPORTANTE: LAS FECHAS
   -------------------------
   Todo tiene vencimiento. Una etiqueta "Nuevo" puesta en marzo sigue diciendo
   "Nuevo" en diciembre si nadie la saca, y eso le quita credibilidad a todas
   las demás. Acá se apagan solas: pasada la fecha, desaparecen sin que nadie
   tenga que acordarse.

   Formato de fecha: AAAA-MM-DD (ej. 2026-09-30). Vacío = sin vencimiento.

   LA PROMO ES UN PORCENTAJE, NO UN PRECIO FIJO
   --------------------------------------------
   Porque cada sabor y tamaño tiene su propio precio: un 15% se aplica bien a
   los nueve Whey, un precio fijo de Gs. 300.000 sería un regalo en el envase
   de 2270 g. El descuento se calcula sobre el precio que manda Odoo.
   -------------------------------------------------------------------------- */
const VITALICA_CAMPANAS = {

  'whey-protein-complex': {
    etiqueta: 'Lanzamiento',
    etiquetaHasta: '',              // ej. '2026-09-30'
    promo: { activa: false, descuento: 0, texto: '', desde: '', hasta: '' }
  },

  'redweiler': {
    etiqueta: 'Nuevo',
    etiquetaHasta: '',
    promo: { activa: false, descuento: 0, texto: '', desde: '', hasta: '' }
  },

  'vitamin-multiple-sport-40': {
    etiqueta: 'Nuevo',
    etiquetaHasta: '',
    promo: { activa: false, descuento: 0, texto: '', desde: '', hasta: '' }
  }

  /* Los productos que no están acá simplemente no tienen etiqueta ni promo.
     Para agregar uno, copiá un bloque y cambiá el id. O usá el panel, que
     los lista todos sin que haya que escribir nada. */
};


/* --------------------------------------------------------------------------
   Helpers de acceso a los datos
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   8-sexies) DICCIONARIO DEL BUSCADOR
   --------------------------------------------------------------------------
   POR QUÉ EXISTE

   El buscador compara lo que se escribe contra el texto del producto. Eso
   falla justo en las búsquedas más obvias, porque el cliente no busca por el
   nombre del producto — busca por lo que quiere resolver.

   Nadie escribe "Knockout 2.0": escribe "pre entreno". Nadie escribe "Iso
   Plus": escribe "isotónica" o "hidratación". Y ninguna de esas palabras
   estaba en la ficha, así que el buscador devolvía "sin resultados" teniendo
   el producto en la tienda.

   Acá cada palabra que puede escribir una persona se traduce a las palabras
   que SÍ están en los datos. Es una tabla y se edita a mano a propósito: son
   diez productos, no hace falta nada más complicado, y así queda a la vista
   qué se busca con qué.

   REGLAS PARA EDITARLA
     · Las claves van sin tildes y en minúscula: el buscador normaliza antes
       de comparar, así que "proteina" ya cubre "proteína" y "PROTEINA".
     · También compara sin espacios ni guiones, así que "preentreno" cubre
       "pre entreno" y "pre-entreno" sin cargar las tres.
     · Si se agrega un producto nuevo, agregar acá cómo lo va a buscar la
       gente. Es la parte que más se olvida.
   -------------------------------------------------------------------------- */
const VITALICA_SINONIMOS = {
  /* Por momento del entrenamiento */
  'preentreno':      ['knockout', 'redweiler', 'beta alanine', 'enfoque', 'fuerza'],
  'preworkout':      ['knockout', 'redweiler', 'beta alanine', 'enfoque', 'fuerza'],
  'postentreno':     ['whey', 'protein', 'iso plus', 'construccion muscular'],
  'intraentreno':    ['iso plus', 'resistencia'],

  /* Por lo que la persona quiere lograr */
  'masa':            ['whey', 'protein', 'construccion muscular'],
  'musculo':         ['whey', 'protein', 'construccion muscular', 'creatine'],
  'volumen':         ['whey', 'protein', 'construccion muscular'],
  'recuperacion':    ['whey', 'protein', 'iso plus'],
  'energia':         ['knockout', 'redweiler', 'iso plus', 'resistencia'],
  'cansancio':       ['vita min', 'multiple sport', 'iso plus', 'vitalidad'],
  'fuerza':          ['creatine', 'knockout', 'redweiler'],
  'potencia':        ['creatine', 'knockout', 'redweiler'],
  'resistencia':     ['iso plus', 'beta alanine'],
  'concentracion':   ['knockout', 'enfoque'],
  'foco':            ['knockout', 'enfoque'],
  'defensas':        ['vita min', 'multiple sport', 'gold omega', 'vitalidad'],
  'inmunidad':       ['vita min', 'multiple sport', 'vitalidad'],

  /* Por el tipo de producto */
  'proteina':        ['whey', 'protein'],
  'protein':         ['whey'],
  'suero':           ['whey', 'protein'],
  'creatina':        ['creatine', 'monohydrate'],
  'isotonica':       ['iso plus', 'resistencia'],
  'isotonico':       ['iso plus', 'resistencia'],
  'hidratacion':     ['iso plus'],
  'electrolitos':    ['iso plus'],
  'sales':           ['iso plus'],
  'vitaminas':       ['vita min', 'multiple sport', 'vitalidad'],
  'multivitaminico': ['vita min', 'multiple sport'],
  'omega':           ['gold omega', 'omega 3'],
  'aceite':          ['gold omega', 'omega 3'],
  'pescado':         ['gold omega', 'omega 3'],
  'colageno':        ['arthroblock'],
  'articulaciones':  ['arthroblock'],
  'articular':       ['arthroblock'],
  'rodilla':         ['arthroblock'],
  'rodillas':        ['arthroblock'],
  'cafeina':         ['knockout', 'redweiler'],
  'oxido':           ['redweiler'],
  'bombeo':          ['redweiler'],
  'pump':            ['redweiler'],
  'betaalanina':     ['beta alanine', 'xplode'],
  'aminoacidos':     ['whey', 'protein', 'beta alanine'],

  /* Por formato */
  'capsulas':        ['capsulas'],
  'pastillas':       ['capsulas'],
  'comprimidos':     ['capsulas'],
  'polvo':           ['powder', 'g'],
  'bolsa':           ['whey', 'protein'],

  /* Por la persona */
  'mayores':         ['40'],
  'adultos':         ['40'],
  'cuarenta':        ['40'],
  'mujer':           ['vita min', 'multiple sport', 'whey'],
  'hombre':          ['vita min', 'multiple sport', 'whey'],

  /* Marca: mucha gente busca por la marca, no por el producto */
  'olimp':           ['whey', 'creatine', 'iso plus', 'knockout', 'redweiler',
                      'gold omega', 'vita min', 'arthroblock', 'beta alanine']
};


const Datos = {
  producto: function (id) {
    return VITALICA_PRODUCTOS.find(function (p) { return p.id === id; });
  },
  categoria: function (id) {
    return VITALICA_CATEGORIAS.find(function (c) { return c.id === id; });
  },
  porCategoria: function (idCategoria) {
    return VITALICA_PRODUCTOS.filter(function (p) {
      return p.categoria === idCategoria || (p.categoriasExtra || []).indexOf(idCategoria) !== -1;
    });
  },
  destacados: function () {
    return VITALICA_PRODUCTOS.filter(function (p) { return p.destacado; });
  },
  meta: function (id) {
    return VITALICA_METAS.find(function (m) { return m.id === id; });
  },
  // Productos de una meta (unión de sus categorías, sin repetir)
  porMeta: function (idMeta) {
    var m = this.meta(idMeta);
    if (!m) return [];
    var vistos = {}, res = [];
    VITALICA_PRODUCTOS.forEach(function (p) {
      var cats = [p.categoria].concat(p.categoriasExtra || []);
      var coincide = cats.some(function (c) { return m.categorias.indexOf(c) !== -1; });
      if (coincide && !vistos[p.id]) { vistos[p.id] = 1; res.push(p); }
    });
    return res;
  },
  // Guía de uso de un producto (objeto de VITALICA_GUIAS)
  guia: function (id) {
    return (typeof VITALICA_GUIAS !== 'undefined') ? VITALICA_GUIAS[id] : null;
  },
  // Ficha técnica de un producto (stats, sabores, página del catálogo PDF)
  ficha: function (id) {
    return (typeof VITALICA_FICHAS !== 'undefined') ? VITALICA_FICHAS[id] : null;
  },

  /* ---- VARIANTES (sabor + presentación) --------------------------------- */

  // Todas las variantes de un producto. [] si no tiene (se vende una sola).
  variantes: function (id) {
    return (typeof VITALICA_VARIANTES !== 'undefined' && VITALICA_VARIANTES[id]) || [];
  },

  // Una variante por su código de barras.
  variante: function (id, codigo) {
    return this.variantes(id).find(function (v) { return v.codigo === codigo; }) || null;
  },

  // ¿Hay algo que elegir? Con una sola variante no tiene sentido preguntar.
  tieneOpciones: function (id) {
    return this.variantes(id).length > 1;
  },

  /* Fotos extra de una variante, por código de barras. Vacío si no hay: la
     ficha lo trata como "esta variante todavía no tiene galería". */
  galeria: function (codigo) {
    return (typeof VITALICA_GALERIA !== 'undefined' && VITALICA_GALERIA[codigo]) || [];
  },


  /* ------------------------------------------------------------------------
     BUSCADOR
     ------------------------------------------------------------------------
     Antes era un indexOf() contra el texto del producto. Fallaba en lo más
     común por tres motivos, y los tres se arreglan acá:

       1. "preentreno" no encontraba "pre-entreno", porque el guión cuenta
          como carácter. Ahora se compara también la versión sin espacios ni
          signos, así que las tres formas de escribirlo caen en el mismo lado.
       2. "isotónica" no encontraba nada, porque esa palabra no está en la
          ficha del Iso Plus. Para eso está VITALICA_SINONIMOS.
       3. "proteina chocolate" no encontraba nada, porque buscaba la frase
          entera. Ahora cada palabra se busca por separado y tienen que estar
          todas — pero cada una puede estar por sí misma o por un sinónimo.

     Además ordena: lo que coincide en el nombre va antes que lo que coincide
     en un párrafo del medio de la descripción. Sin eso, buscar "chocolate"
     podía devolver primero un producto que menciona el chocolate de pasada.
     ------------------------------------------------------------------------ */

  /* Deja el texto comparable: minúscula, sin tildes y sin signos. */
  clave: function (t) {
    return String(t || '').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /* Todo el texto por el que se puede encontrar un producto, separado en
     tres canastas según cuánto significa una coincidencia ahí. */
  textoDeBusqueda: function (p) {
    var cat = this.categoria(p.categoria);
    var variantes = this.variantes(p.id);
    var metas = VITALICA_METAS.filter(function (m) {
      return m.categorias.indexOf(p.categoria) !== -1;
    }).map(function (m) { return m.nombre + ' ' + m.accion; }).join(' ');

    return {
      // El nombre del producto. Coincidir acá es lo que más vale.
      nombre: this.clave(p.nombre + ' olimp'),
      // Sabor, tamaño, categoría, meta y etiquetas: lo que la gente filtra.
      atributos: this.clave(
        (cat ? cat.nombre : '') + ' ' + metas + ' ' + (p.tags || []).join(' ') + ' ' +
        variantes.map(function (v) { return v.sabor + ' ' + v.tamano; }).join(' ')),
      // El texto largo. Vale, pero menos.
      cuerpo: this.clave(
        (p.resumen || '') + ' ' + (p.descripcion || '') + ' ' +
        (p.bandaBeneficio || '') + ' ' +
        (p.beneficios || []).map(function (b) { return b.titulo + ' ' + b.texto; }).join(' ') + ' ' +
        (p.ingredientes || []).map(function (i) { return i.nombre + ' ' + i.texto; }).join(' '))
    };
  },

  /* ¿Aparece `aguja` en `pajar`? Por palabra, aceptando el principio de una
     palabra ("creat" encuentra "creatine") y también la versión pegada, que
     es lo que hace que "preentreno" encuentre "pre entreno". */
  hayCoincidencia: function (pajar, aguja) {
    if (!aguja) return false;
    if ((' ' + pajar).indexOf(' ' + aguja) !== -1) return true;
    return pajar.replace(/ /g, '').indexOf(aguja.replace(/ /g, '')) !== -1;
  },

  /* Una palabra escrita por la persona y todo lo que puede querer decir.

     EL DICCIONARIO TAMBIÉN PERDONA DEDAZOS, y esto importa más de lo que
     parece. "creatna" no se parece a nada de la ficha del producto, que dice
     "Creatine Monohydrate" en inglés — está a dos letras. Pero sí se parece
     a la clave 'creatina' del diccionario, que está a UNA. Buscando primero
     la clave y expandiendo desde ahí, "creatna" llega al producto igual.

     Lo mismo con "isotonika" → 'isotonica' → Iso Plus, o "protena" →
     'proteina' → Whey. Sin este paso, las tres daban cero resultados.

     El orden es a propósito: primero la palabra tal cual, después sus
     sinónimos, y recién al final los del término corregido. Lo escrito bien
     siempre gana. */
  expansiones: function (palabra) {
    var lista = [palabra];
    var yo = this;

    function sumar(clave) {
      var sin = VITALICA_SINONIMOS[clave] || [];
      sin.forEach(function (t) { lista.push(yo.clave(t)); });
    }

    if (typeof VITALICA_SINONIMOS === 'undefined') return lista;

    if (VITALICA_SINONIMOS[palabra]) {
      sumar(palabra);
      return lista;   // escrita bien: no hace falta buscar parecidos
    }

    // Mal escrita: se busca la clave más cercana y se expande por ahí.
    var tolerancia = this.erroresPermitidos(palabra);
    if (!tolerancia) return lista;

    var mejorClave = null;
    var mejorDist = tolerancia + 1;
    Object.keys(VITALICA_SINONIMOS).forEach(function (k) {
      if (Math.abs(k.length - palabra.length) > tolerancia) return;
      var d = yo.distancia(k, palabra);
      if (d < mejorDist) { mejorDist = d; mejorClave = k; }
    });
    if (mejorClave) { lista.push(mejorClave); sumar(mejorClave); }
    return lista;
  },


  /* ------------------------------------------------------------------------
     TOLERANCIA A ERRORES DE TIPEO
     ------------------------------------------------------------------------
     "creatna", "protena", "artroblock". La gente escribe rápido, y sobre todo
     desde el teléfono. Sin esto, cada dedazo devuelve "sin resultados" con el
     producto ahí, en una tienda de diez.

     Se mide la distancia de edición: cuántas letras hay que cambiar, agregar
     o sacar para pasar de una palabra a la otra. Es el algoritmo clásico de
     Levenshtein, implementado con una sola fila en vez de la matriz entera
     porque para comparar palabras sueltas no hace falta más.

     CUÁNTO SE PERDONA, Y POR QUÉ NO MÁS
       hasta 4 letras  → nada. "iso" y "oso" están a una letra y no son lo
                         mismo; perdonar acá llenaría todo de ruido.
       5 a 7 letras    → 1 error.
       8 o más         → 2 errores.

     El corte no es caprichoso: cuanto más larga la palabra, menos probable es
     que dos distintas se parezcan tanto por casualidad.
     ------------------------------------------------------------------------ */
  distancia: function (a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    // Atajo barato: si difieren mucho de largo, ya se pasaron del límite.
    if (Math.abs(a.length - b.length) > 2) return 99;

    var fila = [];
    for (var j = 0; j <= b.length; j++) fila[j] = j;

    for (var i = 1; i <= a.length; i++) {
      var anterior = fila[0];
      fila[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var guardado = fila[k];
        fila[k] = (a.charAt(i - 1) === b.charAt(k - 1))
          ? anterior
          : Math.min(anterior + 1, fila[k] + 1, fila[k - 1] + 1);
        anterior = guardado;
      }
    }
    return fila[b.length];
  },

  erroresPermitidos: function (palabra) {
    if (palabra.length <= 4) return 0;
    if (palabra.length <= 7) return 1;
    return 2;
  },

  /* ¿Alguna palabra del pajar se parece a la aguja, aunque esté mal escrita? */
  seParece: function (pajar, aguja) {
    var tolerancia = this.erroresPermitidos(aguja);
    if (!tolerancia) return false;
    var palabras = pajar.split(' ');
    for (var i = 0; i < palabras.length; i++) {
      var w = palabras[i];
      // Solo contra palabras de largo parecido: comparar "creatna" contra
      // "de" no aporta nada y cuesta.
      if (Math.abs(w.length - aguja.length) > tolerancia) continue;
      if (this.distancia(w, aguja) <= tolerancia) return true;
    }
    return false;
  },

  /* ------------------------------------------------------------------------
     LAS GUÍAS TAMBIÉN SE BUSCAN
     ------------------------------------------------------------------------
     Media tienda de suplementos se busca con preguntas, no con nombres:
     "cómo tomar creatina", "para qué sirve la proteína". Esas respuestas
     están escritas en las guías de uso, pero el buscador solo miraba los
     productos y devolvía el envase, que no contesta la pregunta.

     Van después de los productos y marcadas como guía, para que nadie
     confunda un artículo con algo que se compra.
     ------------------------------------------------------------------------ */
  buscarGuias: function (consulta, limite) {
    if (typeof VITALICA_ARTICULOS === 'undefined') return [];
    var q = this.clave(consulta);
    if (!q) return [];
    var palabras = q.split(' ');
    var yo = this;

    var puntuados = VITALICA_ARTICULOS.map(function (a) {
      var titulo = yo.clave(a.titulo + ' ' + (a.tema || ''));
      var cuerpo = yo.clave(a.resumen || '');
      var puntos = 0;

      var todas = palabras.every(function (palabra) {
        var mejor = 0;
        yo.expansiones(palabra).forEach(function (alt, i) {
          var descuento = i === 0 ? 1 : 0.6;
          if (yo.hayCoincidencia(titulo, alt)) mejor = Math.max(mejor, 6 * descuento);
          if (yo.hayCoincidencia(cuerpo, alt)) mejor = Math.max(mejor, 2 * descuento);
        });
        if (!mejor && yo.seParece(titulo + ' ' + cuerpo, palabra)) mejor = 1;
        puntos += mejor;
        return mejor > 0;
      });

      return todas ? { articulo: a, puntos: puntos } : null;
    }).filter(Boolean);

    puntuados.sort(function (a, b) { return b.puntos - a.puntos; });
    return puntuados.slice(0, limite || 2).map(function (r) { return r.articulo; });
  },

  /* Lo que se ofrece cuando el campo está vacío. No es decoración: en una
     tienda de diez productos, la mayoría no sabe qué escribir, y una lista
     de atajos convierte mejor que un campo en blanco. Son las búsquedas que
     tienen sentido para este catálogo, no un top inventado. */
  busquedasSugeridas: function () {
    return ['Pre-entreno', 'Proteína', 'Creatina', 'Isotónica', 'Vitaminas', 'Omega 3'];
  },

  buscar: function (consulta, limite) {
    var q = this.clave(consulta);
    if (!q) return [];
    var yo = this;

    /* "pre entreo" son dos palabras, y ninguna de las dos por separado llega
       a nada. Pegadas son "preentreo", que está a una letra de la clave
       'preentreno'. Por eso la consulta entera se prueba también como un
       solo término: si el diccionario la reconoce, se busca por eso y se
       dejan de lado las palabras sueltas. */
    var pegada = q.replace(/ /g, '');
    var palabras = q.split(' ');
    if (palabras.length > 1) {
      var comoUna = this.expansiones(pegada);
      if (comoUna.length > 1) palabras = [pegada];
    }

    var puntuados = VITALICA_PRODUCTOS.map(function (p) {
      var t = yo.textoDeBusqueda(p);
      var puntos = 0;

      // TODAS las palabras tienen que encontrarse en algún lado. Si una sola
      // no aparece, el producto no es lo que se está buscando.
      var todas = palabras.every(function (palabra) {
        var mejor = 0;
        yo.expansiones(palabra).forEach(function (alt, i) {
          // Un sinónimo vale menos que la palabra tal cual se escribió.
          var descuento = i === 0 ? 1 : 0.6;
          if (yo.hayCoincidencia(t.nombre, alt))    mejor = Math.max(mejor, 10 * descuento);
          if (yo.hayCoincidencia(t.atributos, alt)) mejor = Math.max(mejor, 5 * descuento);
          if (yo.hayCoincidencia(t.cuerpo, alt))    mejor = Math.max(mejor, 1 * descuento);
        });

        /* Último recurso: la palabra escrita con un dedazo. Vale poco (2)
           para que un producto que coincide de verdad siempre gane a uno que
           coincide por parecido. Se prueba solo si no coincidió nada antes,
           porque es la comparación más cara de las tres. */
        if (!mejor && yo.seParece(t.nombre + ' ' + t.atributos, palabra)) mejor = 2;

        puntos += mejor;
        return mejor > 0;
      });

      // Un empujón a los destacados, para desempatar entre dos que valen igual.
      if (p.destacado) puntos += 0.5;
      return todas ? { producto: p, puntos: puntos } : null;
    }).filter(Boolean);

    puntuados.sort(function (a, b) { return b.puntos - a.puntos; });
    return puntuados.slice(0, limite || 6).map(function (r) { return r.producto; });
  },

  // Sabores distintos, en el orden en que están cargados y sin repetir.
  sabores: function (id) {
    var vistos = {}, res = [];
    this.variantes(id).forEach(function (v) {
      if (!v.sabor) return;

      // La foto del envase EN ESE SABOR, que es como lo muestra BPN: en vez
      // de una pastilla que dice "Doble Chocolate", el frasco de chocolate.
      // Se toma la del primer tamaño que tenga foto — el envase de 700 g y el
      // de 2.270 g del mismo sabor son la misma etiqueta.
      if (!vistos[v.sabor]) {
        vistos[v.sabor] = res.length + 1;
        res.push({ nombre: v.sabor, icono: v.icono, imagen: v.imagen || '' });
      } else if (v.imagen && !res[vistos[v.sabor] - 1].imagen) {
        res[vistos[v.sabor] - 1].imagen = v.imagen;
      }
    });
    return res;
  },

  // Presentaciones distintas.
  tamanos: function (id) {
    var vistos = {}, res = [];
    this.variantes(id).forEach(function (v) {
      if (v.tamano && !vistos[v.tamano]) { vistos[v.tamano] = 1; res.push(v.tamano); }
    });
    return res;
  },

  /* Presentaciones en las que EXISTE un sabor dado.
     Sirve para no ofrecer combinaciones imposibles: el Whey sabor Cookies
     no viene en 2270 g, así que al elegirlo esa presentación se apaga. */
  tamanosDe: function (id, sabor) {
    return this.variantes(id)
      .filter(function (v) { return !sabor || v.sabor === sabor; })
      .map(function (v) { return v.tamano; });
  },

  /* Precio de una variante puntual.
     Lo publica sync-odoo-precios.py en window.VITALICA_PRECIOS_VARIANTE.
     Si todavía no está (el sync viejo no lo generaba), devolvemos null y el
     sitio sigue mostrando el precio "desde" del producto — nunca un precio
     inventado. */
  precioVariante: function (codigo) {
    var tabla = (typeof window !== 'undefined' && window.VITALICA_PRECIOS_VARIANTE) || null;
    if (!tabla || codigo == null) return null;
    var v = tabla[codigo];
    return (v == null || v === '') ? null : Number(v);
  },

  // Stock de una variante puntual (misma lógica que el precio).
  stockVariante: function (codigo) {
    var tabla = (typeof window !== 'undefined' && window.VITALICA_STOCK_VARIANTE) || null;
    if (!tabla || codigo == null) return null;
    var v = tabla[codigo];
    return (v == null || v === '') ? null : Number(v);
  },

  /* Qué foto mostrar para una variante, en orden de preferencia:
       1) la del sabor      (v.imagen)
       2) la del tamaño     (VITALICA_IMAGEN_POR_TAMANO)
       3) la del producto   (p.imagen)
     El paso 2 existe porque sin él un sabor sin foto propia mostraba el
     envase de otro tamaño. Ver el comentario de la tabla más arriba. */
  imagenVariante: function (idProducto, v, imagenProducto) {
    if (v && v.imagen) return v.imagen;

    /* 2º) El MISMO SABOR en otro tamaño.
       -------------------------------------------------------------------
       Iso Plus tiene foto de Tropic Blue en 1.505 g pero no en 700 g. Sin
       este paso, elegir Tropic Blue en 700 g caía en la foto por tamaño, que
       es la del envase naranja: la persona tocaba "Tropic Blue" y le aparecía
       un envase naranja. Se lee como que el sitio está roto.

       Entre el sabor correcto en otro tamaño y el tamaño correcto en otro
       sabor, gana el sabor: es lo que la persona acaba de elegir y es lo que
       cambia el color del envase.

       PERO el envase lleva el peso impreso en la etiqueta. La foto de Tropic
       Blue dice "1505 g" bien grande, y arriba el selector dice 700 g: sin
       avisar nada, alguien puede creer que compra el grande. Por eso este
       caso viene acompañado de notaFotoVariante(), que lo dice en palabras
       abajo de la foto. */
    var otroTamano = this._fotoDeOtroTamano(idProducto, v);
    if (otroTamano) return otroTamano.imagen;

    /* 3º) La foto que corresponde al tamaño, aunque sea de otro sabor. */
    if (v && v.tamano && typeof VITALICA_IMAGEN_POR_TAMANO !== 'undefined') {
      var porProducto = VITALICA_IMAGEN_POR_TAMANO[idProducto];
      if (porProducto && porProducto[v.tamano]) return porProducto[v.tamano];
    }

    /* 4º) La foto general del producto. Nunca queda un hueco. */
    return imagenProducto;
  },

  /* La foto de ESE sabor en OTRO tamaño, si existe. Devuelve la variante
     entera (no solo la ruta) para poder decir de qué presentación es. */
  _fotoDeOtroTamano: function (idProducto, v) {
    if (!v || !v.sabor) return null;
    var otras = this.variantes(idProducto).filter(function (x) {
      return x.sabor === v.sabor && x.imagen && x.tamano !== v.tamano;
    });
    return otras.length ? otras[0] : null;
  },

  /* Aviso para poner abajo de la foto cuando lo que se ve NO es el envase
     que se está por comprar.

     Solo pasa en el caso 2º de imagenVariante(): sabor correcto, presentación
     distinta. Es preferible decirlo a que alguien vea "1505 g" impreso en la
     bolsa y crea que eso es lo que lleva.

     Devuelve '' cuando la foto sí corresponde a la variante elegida, que es
     lo normal y no necesita ninguna aclaración. */
  notaFotoVariante: function (idProducto, v) {
    if (!v || v.imagen) return '';
    var otra = this._fotoDeOtroTamano(idProducto, v);
    if (!otra) return '';
    return 'Foto de la presentación de ' + otra.tamano +
           '. Estás eligiendo ' + v.tamano + '.';
  },

  /* Texto corto de una variante, para mostrar debajo del nombre en el
     carrito y en el pedido. Ej: "Doble Chocolate · 700 g" */
  etiquetaVariante: function (v) {
    if (!v) return '';
    return [v.sabor, v.tamano].filter(Boolean).join(' · ');
  },

  /* ---- CAMPAÑAS: etiquetas y promociones -------------------------------- */

  // Fecha de hoy como 'AAAA-MM-DD', para comparar con las de las campañas.
  // Se usa la fecha LOCAL (no UTC): una promo que vence el 30 tiene que durar
  // todo el día 30 en Paraguay, no cortarse a las 21 h del 29.
  hoyISO: function () {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  },

  /* Campaña vigente de un producto, con las fechas ya aplicadas.
     Devuelve siempre un objeto: { etiqueta: '', promo: null } si no hay nada.

     Las fechas vacías significan "sin límite", que es lo cómodo para cargar
     algo rápido. Pero una etiqueta sin vencimiento es la que después queda
     mintiendo seis meses, así que el panel avisa cuando falta. */
  campana: function (id) {
    var vacio = { etiqueta: '', promo: null };
    if (typeof VITALICA_CAMPANAS === 'undefined') return vacio;
    var c = VITALICA_CAMPANAS[id];
    if (!c) return vacio;

    var hoy = this.hoyISO();
    var res = { etiqueta: '', promo: null };

    // Etiqueta: se apaga sola pasada la fecha.
    if (c.etiqueta && (!c.etiquetaHasta || c.etiquetaHasta >= hoy)) {
      res.etiqueta = c.etiqueta;
    }

    // Promo: tiene que estar activa, con descuento real y dentro de fecha.
    var pr = c.promo;
    if (pr && pr.activa && pr.descuento > 0) {
      var arrancó = !pr.desde || pr.desde <= hoy;
      var sigue   = !pr.hasta || pr.hasta >= hoy;
      if (arrancó && sigue) res.promo = pr;
    }
    return res;
  },

  /* Aplica la promo vigente a un precio.
     Devuelve { precio, precioAntes, descuento, texto }.
     Si no hay promo, precioAntes queda en null y el sitio muestra un solo
     precio, sin tachados innecesarios.

     El descuento es un PORCENTAJE a propósito: cada sabor y tamaño tiene su
     precio, y un 15% se aplica bien a los nueve Whey. Un precio fijo sería un
     regalo en el envase de 2270 g. */
  conPromo: function (precio, id) {
    var sinPromo = { precio: precio, precioAntes: null, descuento: 0, texto: '' };
    if (precio == null) return sinPromo;
    var c = this.campana(id);
    if (!c.promo) return sinPromo;

    var d = Number(c.promo.descuento) || 0;
    if (d <= 0 || d >= 100) return sinPromo;

    // Redondeamos a la centena: en guaraníes un precio con unidades sueltas
    // se ve a medio hacer.
    var nuevo = Math.round((precio * (100 - d) / 100) / 100) * 100;
    if (nuevo >= precio) return sinPromo;

    return { precio: nuevo, precioAntes: precio, descuento: d, texto: c.promo.texto || '' };
  },
  // Link al catálogo PDF, saltando a la página del producto si la conocemos
  linkCatalogo: function (id) {
    var cat = (VITALICA_CONFIG.catalogo && VITALICA_CONFIG.catalogo.archivo) || '';
    var f = this.ficha(id);
    return (f && f.paginaCatalogo) ? cat + '#page=' + f.paginaCatalogo : cat;
  },
  // Productos que "van juntos" (mismo combo de VITALICA_COMBOS), sin el actual
  relacionados: function (id) {
    var combo = VITALICA_COMBOS.find(function (g) { return g.indexOf(id) !== -1; });
    if (!combo) return [];
    return combo.filter(function (x) { return x !== id; })
                .map(function (x) { return Datos.producto(x); })
                .filter(Boolean);
  }
};


/* --------------------------------------------------------------------------
   PRECIOS DESDE ODOO
   --------------------------------------------------------------------------
   El script sync-odoo-precios.py genera assets/js/precios.js, que define
   window.VITALICA_PRECIOS = { 'whey-protein-complex': 375000, ... }.
   Ese archivo se carga ANTES que data.js, así que acá ya está disponible.

   Es sincrónico a propósito: sin fetch y sin CORS, y funciona incluso
   abriendo el sitio con doble clic (file://). Si precios.js no existe, no
   pasa nada: los precios quedan en null y el sitio muestra "A confirmar".

   Va ANTES de los overrides del panel admin, para que un precio cargado a
   mano en el panel pueda pisar al de Odoo (útil para una promo puntual).
   -------------------------------------------------------------------------- */
(function aplicarPreciosOdoo() {
  if (typeof window === 'undefined' || !window.VITALICA_PRECIOS) return;
  var desde = window.VITALICA_PRECIO_DESDE || {};
  var stock = window.VITALICA_STOCK || {};
  VITALICA_PRODUCTOS.forEach(function (p) {
    var precio = window.VITALICA_PRECIOS[p.id];
    if (precio == null || precio === '') return;
    var dig = String(precio).replace(/[^\d]/g, '');
    if (dig === '') return;
    p.precio = Number(dig);
    // En Odoo hay una variante por sabor y tamaño. Si tienen precios
    // distintos, mostramos "Desde Gs. X" en vez de un precio único que
    // sería mentira para las presentaciones más grandes.
    p.precioDesde = !!desde[p.id];
    if (stock[p.id] != null) p.stock = Number(stock[p.id]);
  });
})();


/* --------------------------------------------------------------------------
   10) CAPA DE CAMBIOS DEL PANEL DE ADMINISTRADOR (overrides)
   Aplica lo guardado por el panel (localStorage) SOBRE los valores por defecto
   de arriba. Así TODAS las páginas reflejan los cambios sin tocar el resto.
   Objeto en localStorage['vitalica_overrides']:
     { config:{whatsapp,redes,marca,nav,anuncios,envio},
       hero:[ {eyebrow,titulo,texto,imagen,cta1:{texto,href},cta2:{texto,href}} ],
       productos:{ <id>:{nombre,precio,imagen,resumen} },
       tiendas:[ {nombre,ciudad,direccion} ] }
   -------------------------------------------------------------------------- */
(function aplicarOverrides() {
  var ov;
  try { ov = JSON.parse(localStorage.getItem('vitalica_overrides')); }
  catch (e) { ov = null; }
  if (!ov || typeof ov !== 'object') return;


  // Config
  if (ov.config) {
    ['whatsapp', 'redes', 'marca', 'envio'].forEach(function (k) {
      if (ov.config[k]) {
        VITALICA_CONFIG[k] = VITALICA_CONFIG[k] || {};
        Object.assign(VITALICA_CONFIG[k], ov.config[k]);
      }
    });
    if (Array.isArray(ov.config.anuncios)) VITALICA_CONFIG.anuncios = ov.config.anuncios;
    if (Array.isArray(ov.config.nav))      VITALICA_CONFIG.nav = ov.config.nav;
    // Normaliza los costos de envío a entero (acepta "25.000" o "25000").
    if (VITALICA_CONFIG.envio) {
      ['granAsuncion', 'interior'].forEach(function (k) {
        if (VITALICA_CONFIG.envio[k] != null) {
          var de = String(VITALICA_CONFIG.envio[k]).replace(/[^\d]/g, '');
          if (de !== '') VITALICA_CONFIG.envio[k] = Number(de);
        }
      });
    }
    // Comunidad / Instagram: handle + posts (solo pisa los slots con imagen nueva).
    if (ov.config.comunidad) {
      VITALICA_CONFIG.comunidad = VITALICA_CONFIG.comunidad || { handle: '@vitalica.py', posts: [] };
      if (ov.config.comunidad.handle) VITALICA_CONFIG.comunidad.handle = ov.config.comunidad.handle;
      if (Array.isArray(ov.config.comunidad.posts)) {
        ov.config.comunidad.posts.forEach(function (img, i) {
          if (img) VITALICA_CONFIG.comunidad.posts[i] = img;
        });
      }
    }
  }

  // Hero (por índice)
  if (Array.isArray(ov.hero)) {
    ov.hero.forEach(function (o, i) {
      var s = VITALICA_HERO[i];
      if (!o || !s) return;
      // Guardamos la imagen original ANTES de pisarla. Si el override apunta a
      // un archivo que ya no existe (pasó: quedó un .webp guardado de una
      // versión anterior de las portadas), el hero se rompía en silencio y no
      // había forma de darse cuenta desde la web. home.js usa esto para
      // volver a la de fábrica cuando la del override no carga.
      s.imagenPorDefecto = s.imagen;
      ['eyebrow', 'titulo', 'texto', 'imagen', 'modo'].forEach(function (k) {
        if (o[k] != null && o[k] !== '') s[k] = o[k];
      });
      ['cta1', 'cta2'].forEach(function (c) {
        if (o[c]) {
          s[c] = s[c] || {};
          if (o[c].texto != null) s[c].texto = o[c].texto;
          if (o[c].href != null)  s[c].href = o[c].href;
        }
      });
    });
  }

  // Productos (por id)
  if (ov.productos) {
    VITALICA_PRODUCTOS.forEach(function (p) {
      var o = ov.productos[p.id];
      if (!o) return;
      ['nombre', 'imagen', 'resumen'].forEach(function (k) {
        if (o[k] != null && o[k] !== '') p[k] = o[k];
      });
      if (o.precio != null && o.precio !== '') {
        // Aceptamos número o texto ("375.000", "Gs. 375.000"): solo los dígitos.
        var dig = String(o.precio).replace(/[^\d]/g, '');
        if (dig !== '') p.precio = Number(dig);
      }
    });
  }

  /* Comercios aliados.

     El panel admin guarda solo nombre y ciudad: el logo es un archivo, no un
     texto que se tipee. Antes esta parte reemplazaba la lista ENTERA por lo
     guardado, así que todos los comercios perdían su logo y la fila quedaba
     como una hilera de nombres sueltos. Pasó de verdad.

     Ahora se hace una fusión: se respeta el orden y los nombres que dejó el
     panel, pero si una entrada no trae logo se recupera el de la lista de
     fábrica buscando por nombre. */
  /* Antes de aplicar nada: ¿este cambio guardado es del modelo VIEJO?

     Las tiendas se guardaban con 'direccion', un campo que ya no existe: el
     sitio muestra el logo del comercio, no dónde queda. Si aparece, el
     override se grabó antes de ese cambio y describe una lista que quedó
     obsoleta —tenía 6 comercios y la actual tiene 12—.

     En ese caso se descarta y se usa la lista de fábrica. Si no, alguien que
     guardó una vez en el panel hace meses se queda para siempre con la lista
     vieja, sin ningún aviso de por qué le faltan comercios. Pasó de verdad,
     tres veces.

     No se descartan los demás cambios guardados: solo el de tiendas. */
  if (Array.isArray(ov.tiendas) &&
      ov.tiendas.some(function (t) { return t && typeof t.direccion !== 'undefined'; })) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Tiendas: el cambio guardado en admin.html es de una versión ' +
                   'anterior (guardaba direcciones). Se ignora y se usan los ' +
                   'comercios actuales. Para limpiarlo: admin.php → Restablecer.');
    }
    ov.tiendas = null;
  }

  if (Array.isArray(ov.tiendas)) {
    // 'the vitamin shoppe' y 'Vitamin Shop' son el mismo negocio escrito
    // distinto. Se compara sin mayúsculas, sin tildes y sin espacios.
    var normalizar = function (n) {
      return String(n || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '');
    };
    var deFabrica = VITALICA_TIENDAS.slice();
    var buscarOriginal = function (nombre) {
      var n = normalizar(nombre);
      if (!n) return null;
      var exacta = deFabrica.filter(function (x) {
        if (normalizar(x.nombre) === n) return true;
        // Nombres con los que el comercio figuró antes (campo 'alias')
        return (x.alias || []).some(function (a) { return normalizar(a) === n; });
      })[0];
      if (exacta) return exacta;
      // Si no hay coincidencia exacta, alcanza con que uno contenga al otro
      return deFabrica.filter(function (x) {
        var o = normalizar(x.nombre);
        return o && (o.indexOf(n) >= 0 || n.indexOf(o) >= 0);
      })[0] || null;
    };

    VITALICA_TIENDAS.length = 0;
    ov.tiendas.forEach(function (t) {
      var orig = t.logo ? null : buscarOriginal(t.nombre);
      VITALICA_TIENDAS.push({
        nombre: t.nombre,
        ciudad: t.ciudad || (orig ? orig.ciudad : ''),
        logo:   t.logo   || (orig ? orig.logo   : ''),
        ancho:  t.ancho  || (orig ? orig.ancho  : undefined),
        altura: t.altura || (orig ? orig.altura : undefined)
      });
    });
  }

  /* Campañas: etiquetas y promociones cargadas desde el panel.
     A diferencia del resto, acá SÍ pisamos con valores vacíos: sacar una
     etiqueta o apagar una promo es una acción tan legítima como ponerla, y
     si el vacío se ignorara no habría forma de quitarla desde el panel. */
  if (ov.campanas && typeof ov.campanas === 'object') {
    if (typeof VITALICA_CAMPANAS === 'undefined') { window.VITALICA_CAMPANAS = {}; }
    Object.keys(ov.campanas).forEach(function (id) {
      var o = ov.campanas[id];
      if (!o) return;
      var c = VITALICA_CAMPANAS[id] || (VITALICA_CAMPANAS[id] = {
        etiqueta: '', etiquetaHasta: '',
        promo: { activa: false, descuento: 0, texto: '', desde: '', hasta: '' }
      });
      if (o.etiqueta != null)      c.etiqueta = o.etiqueta;
      if (o.etiquetaHasta != null) c.etiquetaHasta = o.etiquetaHasta;

      if (o.promo) {
        c.promo = c.promo || {};
        // El select manda '1' o ''; el resto de las fuentes puede mandar booleano.
        if (o.promo.activa != null) c.promo.activa = (o.promo.activa === '1' || o.promo.activa === true);
        if (o.promo.descuento != null) {
          var d = String(o.promo.descuento).replace(/[^\d.]/g, '');
          c.promo.descuento = d === '' ? 0 : Number(d);
        }
        if (o.promo.texto != null) c.promo.texto = o.promo.texto;
        if (o.promo.desde != null) c.promo.desde = o.promo.desde;
        if (o.promo.hasta != null) c.promo.hasta = o.promo.hasta;
      }
    });
  }
})();
