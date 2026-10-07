<?php
/* ============================================================================
   VITALICA — api/stands/esquema.php  ·  CREA LAS TABLAS DE LOS STANDS
   ----------------------------------------------------------------------------
   Crea las que falten y no toca las que ya están. Se puede correr las veces
   que haga falta.

     Consola:    php api/stands/esquema.php
     Navegador:  https://vitalica.com.py/api/stands/esquema.php
                 (detrás de la sesión de ADMINISTRADOR del área interna)

   Las tablas empiezan todas con  stands  para que, si se usa la misma base
   de la web, no haya forma de que choquen con clientes, sesiones o pedidos.

   TABLAS
     stands            un renglón por stand: cupón del QR, almacén, gimnasio...
     stands_horarios   las franjas de apertura de cada stand (ver base.php)
     stands_cache      la última respuesta de n8n por stand

   Además carga el STAND DE PRUEBA (RMLAM2026) si todavía no existe. Su
   horario NO se carga: no lo tenemos, y uno inventado haría creer que el
   stand abre cuando no. Hasta que se cargue, stand.php lo muestra cerrado.
   ============================================================================ */

declare(strict_types=1);
require_once __DIR__ . '/base.php';

function stands_esquema_sql(string $motor): array
{
    $sqlite = $motor === 'sqlite';
    $id     = $sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $ref    = $sqlite ? 'INTEGER' : 'INT UNSIGNED';
    $fin    = $sqlite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    $largo  = $sqlite ? 'TEXT' : 'MEDIUMTEXT';

    return [
        'stands' => "CREATE TABLE IF NOT EXISTS stands (
            id                 $id,
            cupon              VARCHAR(32)  NOT NULL UNIQUE,
            activo             INTEGER      NOT NULL DEFAULT 1,
            almacen_id         INTEGER      NOT NULL,   -- stock.warehouse
            ubicacion_id       INTEGER      NOT NULL,   -- stock.location del stand
            gimnasio_id        INTEGER      NOT NULL,   -- x_gimnasios
            nombre             VARCHAR(120) NOT NULL,   -- el que ve el socio
            direccion          VARCHAR(200) NOT NULL DEFAULT '',
            ciudad_id          INTEGER      NOT NULL DEFAULT 0, -- reference_geo_id
            ciudad             VARCHAR(80)  NOT NULL DEFAULT '',
            whatsapp_recepcion VARCHAR(20)  NOT NULL DEFAULT '', -- NUNCA sale al navegador
            creado             VARCHAR(19)  NOT NULL
        )$fin",

        'stands_horarios' => "CREATE TABLE IF NOT EXISTS stands_horarios (
            id       $id,
            stand_id $ref       NOT NULL,
            dia      INTEGER    NOT NULL,   -- 1 lunes ... 7 domingo
            abre     VARCHAR(5) NOT NULL,   -- 'HH:MM'
            cierra   VARCHAR(5) NOT NULL,   -- 'HH:MM'; <= abre = pasa la medianoche
            FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE
        )$fin",

        'stands_cache' => "CREATE TABLE IF NOT EXISTS stands_cache (
            stand_id $ref       NOT NULL PRIMARY KEY,
            datos    $largo     NOT NULL,
            guardado VARCHAR(19) NOT NULL,
            FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE
        )$fin",
    ];
}

/** Crea lo que falte y carga el stand de prueba. Devuelve qué hizo. */
function stands_esquema_crear(): array
{
    $hecho = [];
    foreach (stands_esquema_sql(stands_motor()) as $tabla => $sql) {
        // Sin comentarios SQL: MySQL los acepta, pero así el texto es igual en los dos.
        stands_db()->exec(preg_replace('/--[^\n]*/', '', $sql));
        $hecho[$tabla] = 'lista';
    }

    if (!stands_fila('SELECT id FROM stands WHERE cupon = ?', ['RMLAM2026'])) {
        stands_consulta(
            'INSERT INTO stands (cupon, activo, almacen_id, ubicacion_id, gimnasio_id, nombre, ciudad_id, ciudad, creado)
             VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)',
            ['RMLAM2026', 18, 5328, 10, 'Gimnasio RM - Lambaré', 4787, 'Lambaré', stands_ahora_utc()]
        );
        $hecho['stand de prueba'] = 'RMLAM2026 cargado (sin horario)';
    } else {
        $hecho['stand de prueba'] = 'ya estaba';
    }

    return $hecho;
}

/* --- Consola --------------------------------------------------------------- */
if (PHP_SAPI === 'cli') {
    foreach (stands_esquema_crear() as $k => $v) echo str_pad($k, 18), $v, "\n";
    exit;
}

/* --- Navegador: solo administradores del área interna ----------------------
   Se usa la sesión de la web tal como está, sin cambiarla: así no hay una
   segunda contraseña que cuidar para algo que se abre una vez. */
require_once __DIR__ . '/../sesion.php';
/* No se usa sesion_exigir_admin(): redirige a un acceso.php relativo, que
   desde esta subcarpeta sería /api/stands/acceso.php y no existe. */
if (!sesion_activa()) {
    header('Location: ../acceso.php');
    exit;
}
if (!sesion_es_admin()) {
    http_response_code(403);
    exit('Solo administradores.');
}

header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');
try {
    foreach (stands_esquema_crear() as $k => $v) echo str_pad($k, 18), $v, "\n";
} catch (Throwable $e) {
    stands_log('esquema', $e->getMessage());
    http_response_code(500);
    echo "No se pudo crear: ", $e->getMessage(), "\n";
}
