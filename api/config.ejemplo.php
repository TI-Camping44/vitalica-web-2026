<?php
/* ============================================================================
   VITALICA — Configuración del backend de pedidos
   ----------------------------------------------------------------------------
   CÓMO USAR:
     1) Copiá este archivo como  config.php  (en esta misma carpeta)
     2) Completá los valores
     3) config.php NUNCA se comparte ni se sube a un repositorio

   El .htaccess de esta carpeta bloquea el acceso web a config.php, pero la
   regla es la misma de siempre: no poner claves en archivos que viajan.
   ============================================================================ */

return [

  /* --- A dónde llegan los pedidos ---------------------------------------- */

  // Email del equipo que atiende los pedidos. Puede ser más de uno.
  'emails_equipo' => ['pedidos@vitalica.com.py'],

  /* Desde qué dirección salen los correos.
     TIENE que ser del dominio propio: si ponés un @gmail acá, Gmail y Outlook
     lo mandan a spam.

     Es la casilla real de atención al cliente, así que cuando alguien responda
     el correo de confirmación, la respuesta llega a donde tiene que llegar.

     (La dirección 'notifications@vitalica.com.py' que figura en Odoo como
     remitente predeterminado NO está operativa: no usarla.) */
  'email_desde'   => 'atencionalcliente@vitalica.com.py',
  'nombre_desde'  => 'Vitalica',

  /* Mandarle al cliente un correo de confirmación (si dejó email).
     Sale con el diseño de la marca y el detalle del pedido, y en texto plano
     a la vez para los programas que no muestran HTML. */
  'avisar_cliente' => true,

  /* MODO PRUEBA DE CORREOS
     En true, los correos NO se envían: se guardan como archivos .html en la
     carpeta de pedidos, y se abren con doble clic para ver cómo quedaron.

     Sirve para probar en tu compu, donde Windows no tiene servidor de correo
     y los envíos fallarían siempre. También sirve en el servidor para revisar
     el diseño sin molestar a nadie.

     ⚠️ EN PRODUCCIÓN TIENE QUE ESTAR EN false, o los clientes nunca reciben
     su confirmación. */
  'correos_a_archivo' => false,

  // Número de WhatsApp para el botón del correo (solo dígitos, con el 595).
  'whatsapp' => '595976383922',


  /* --- Dónde se guardan los pedidos --------------------------------------
     Ruta de la carpeta donde se escriben los archivos de pedidos.
     Lo IDEAL es que esté FUERA de public_html, por ejemplo:
        /home/TU_USUARIO/pedidos-vitalica
     Así ni siquiera existe una dirección web que los alcance.
     Si la dejás vacía, usa ./almacen (que el .htaccess bloquea). */
  'carpeta_pedidos' => '',


  /* --- Seguridad ---------------------------------------------------------- */

  // Solo se aceptan pedidos que vengan de estas direcciones.
  // Evita que alguien use tu endpoint desde otro sitio.
  'origenes_permitidos' => [
    'https://vitalica.com.py',
    'https://www.vitalica.com.py',
  ],

  // Máximo de pedidos por IP por hora. Freno simple contra el spam.
  'limite_por_hora' => 20,


  /* --- Panel de pedidos ----------------------------------------------------
     El panel (api/panel.php) muestra los pedidos con NOMBRE, TELÉFONO Y
     DIRECCIÓN de los clientes. Es información personal: quien entre ahí ve
     dónde vive tu clientela.

     Por eso hay dos capas de protección y conviene usar las dos:

     1) Esta contraseña.
     2) "Privacidad de directorios" de cPanel sobre la carpeta /api. Eso hace
        que el navegador pida usuario y contraseña ANTES de que el archivo
        siquiera se ejecute. Es la protección más fuerte y son dos clics.

     Elegí una contraseña larga y que no uses en ningún otro lado. Si queda
     vacía, el panel no abre. */
  'panel' => [

    /* PRIMER USUARIO
       Se crea solo la primera vez que alguien intenta entrar, y nunca más:
       una vez que existe el archivo de usuarios, esto se ignora por completo.
       Sin esto no habría forma de entrar la primera vez a crear a nadie.

       ⚠️ Cambiá esta contraseña desde el panel apenas entres. Mientras esté
       acá escrita, cualquiera que pueda leer este archivo la conoce. */
    'usuario_inicial' => [
      'usuario' => 'Admin',
      'nombre'  => 'Administrador',
      'clave'   => '!Vitalica26',
    ],

    // Minutos de inactividad antes de pedir la contraseña de nuevo.
    'minutos_sesion' => 120,

    // Vendedores o responsables a los que se puede asignar un pedido.
    // Se cargan acá y aparecen en la lista desplegable del panel.
    'responsables' => ['Sin asignar', 'Logística', 'Ventas'],
  ],


  /* --- Odoo ----------------------------------------------------------------
     Cuando esté en true, cada pedido crea un PRESUPUESTO (no una venta
     confirmada) en Odoo, con el sabor y la presentación exactos que eligió
     el cliente.

     Se crea como presupuesto a propósito: la web no sabe si hay stock de esa
     variante ni si el cliente va a pagar. Un vendedor confirma por WhatsApp
     y recién ahí lo pasa a pedido de venta.

     Viene apagado solo porque necesita credenciales. Para prenderlo:
       1) Completá db, usuario y api_key acá abajo
       2) Poné 'activo' => true
       3) Abrí api/prueba.php para verificar la conexión

     La clave se genera en Odoo: tu nombre arriba a la derecha → Mi perfil →
     Seguridad de la cuenta → Claves API. NO es tu contraseña. */
  'odoo' => [
    'activo'     => false,
    'url'        => 'https://camping44.odoo.com',
    'db'         => '',
    'usuario'    => '',
    'api_key'    => '',
    'company_id' => 2,
  ],


  /* --- CUENTAS DE CLIENTES: la base de datos --------------------------------
     Esto lo usan las cuentas de clientes. El resto del sitio sigue guardando
     en archivos y no necesita nada de aca.

     COMO SE CREA EN cPANEL
     ----------------------
       1. cPanel -> Bases de datos MySQL
       2. "Crear base de datos nueva": poner  vitalica_web
          Queda con el prefijo de la cuenta, algo como  vitalica_vitalica_web.
          Copiar el nombre COMPLETO, con prefijo, que es el que va abajo.
       3. "Usuarios de MySQL" -> crear uno. Usar el generador de contrasenas
          de cPanel y guardarla en el gestor de contrasenas, no en un papel.
       4. "Agregar usuario a la base de datos" -> marcar TODOS LOS PRIVILEGIOS.
          Sin eso, el sitio no puede crear las tablas la primera vez.
       5. Completar los cuatro valores de aca abajo.
       6. Abrir una vez  https://vitalica.com.py/api/esquema.php  desde el
          navegador, o correrlo por consola. Crea las tablas que falten y no
          toca las que ya estan.

     'host' casi siempre es localhost: la base vive en el mismo servidor que
     el sitio. Si cPanel muestra otra cosa, va esa.

     SI ESTA SECCION NO EXISTE, el sitio usa un archivo SQLite en
     api/almacen/. Sirve para probar, pero en produccion va MySQL: SQLite
     bloquea la base entera mientras escribe, y con varias personas comprando
     a la vez eso se nota. */
  'db' => [
    'motor'   => 'mysql',
    'host'    => 'localhost',
    'puerto'  => 3306,
    'base'    => '',   // el nombre COMPLETO, con el prefijo de la cuenta
    'usuario' => '',
    'clave'   => '',
  ],


  /* --- ENTRAR CON GOOGLE ------------------------------------------------
     El identificador que da Google Cloud al crear un "ID de cliente de
     OAuth" de tipo Aplicacion web.

     NO ES UN SECRETO. Viaja en el HTML de la pagina, a la vista de
     cualquiera, y asi tiene que ser: es como Google sabe de que sitio
     viene el pedido. El "secreto del cliente" que Google muestra al lado
     NO se usa en este flujo y no hay que ponerlo en ningun lado.

     Vacio = el boton no aparece y el sitio funciona igual.

     En Google Cloud, en ese mismo cliente, los "Origenes autorizados de
     JavaScript" tienen que decir exactamente:
         https://vitalica.com.py
         https://www.vitalica.com.py
     Sin barra al final. Google compara el texto exacto. */
  'google' => [
    'client_id' => '',
  ],

];
