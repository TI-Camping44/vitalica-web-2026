<?php
/* ============================================================================
   VITALICA — api/stands/base.php  ·  LO QUE COMPARTEN LOS ENDPOINTS DE STANDS
   ----------------------------------------------------------------------------
   Configuración, conexión a la base, horario, llamada a n8n, caché y log.

   POR QUÉ NO SE REUSA api/db.php
   ------------------------------
   Los stands corren en paralelo a la web. api/db.php lee api/config.php, y
   si se usara, cualquier cambio en la base de la web cambiaría también la de
   los stands, y al revés. Acá todo va con su propia configuración
   (stands/config.php) y sus funciones llevan el prefijo  stands_  para que
   nunca choquen con las de la web aunque algún día se incluyan juntas.

   La forma es la misma que api/db.php a propósito: MySQL en el servidor,
   SQLite en la compu para probar, consultas preparadas de verdad.
   ============================================================================ */

declare(strict_types=1);

/** La configuración de stands/config.php, con valores por omisión. */
function stands_config(): array
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;

    $leido = [];
    $ruta = __DIR__ . '/config.php';
    if (is_file($ruta)) {
        $r = require $ruta;
        if (is_array($r)) $leido = $r;
    }

    $cfg = $leido + [
        'db'           => [],
        'n8n'          => [],
        'cache'        => [],
        'zona_horaria' => 'America/Asuncion',
    ];

    /* Sin sección 'db': SQLite en almacen/, que el htaccess de esta carpeta
       bloquea. En producción va MySQL. */
    if (!$cfg['db']) {
        $cfg['db'] = ['motor' => 'sqlite', 'archivo' => __DIR__ . '/almacen/stands.sqlite'];
    }
    $cfg['n8n']   += ['url' => '', 'cabecera' => 'X-Vitalica-Token', 'token' => '', 'segundos' => 12];
    $cfg['cache'] += ['vigente' => 90, 'respaldo' => 900];

    return $cfg;
}

/* ---------------------------------------------------------------------------
   Base de datos
   --------------------------------------------------------------------------- */

function stands_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $c = stands_config()['db'];

    if (($c['motor'] ?? 'mysql') === 'sqlite') {
        $archivo = (string)($c['archivo'] ?? '');
        if ($archivo === '') throw new RuntimeException('Falta la ruta del archivo SQLite.');
        $dir = dirname($archivo);
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $pdo = new PDO('sqlite:' . $archivo, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $c['host'] ?? 'localhost',
        (int)($c['puerto'] ?? 3306),
        $c['base'] ?? ''
    );
    $pdo = new PDO($dsn, (string)($c['usuario'] ?? ''), (string)($c['clave'] ?? ''), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function stands_motor(): string
{
    return (string)(stands_config()['db']['motor'] ?? 'mysql');
}

function stands_consulta(string $sql, array $params = []): PDOStatement
{
    $st = stands_db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function stands_fila(string $sql, array $params = []): ?array
{
    $f = stands_consulta($sql, $params)->fetch();
    return $f === false ? null : $f;
}

function stands_filas(string $sql, array $params = []): array
{
    return stands_consulta($sql, $params)->fetchAll();
}

/** Fecha para guardar: siempre UTC, como en api/db.php. */
function stands_ahora_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

/* ---------------------------------------------------------------------------
   Log
   ---------------------------------------------------------------------------
   "Si algo falla, que no falle en silencio." Todo error va acá y al log de
   PHP del servidor, que es el que cPanel muestra en "Errores". */

function stands_log(string $donde, string $mensaje): void
{
    $linea = gmdate('Y-m-d H:i:s') . " UTC  [$donde]  " . str_replace(["\r", "\n"], ' ', $mensaje);
    error_log('VITALICA STANDS ' . $linea);
    $dir = __DIR__ . '/almacen';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @file_put_contents($dir . '/stands.log', $linea . "\n", FILE_APPEND | LOCK_EX);
}

/* ---------------------------------------------------------------------------
   Stand
   --------------------------------------------------------------------------- */

/** Normaliza lo que viene en el QR. Devuelve '' si no tiene forma de cupón. */
function stands_limpiar_cupon(string $c): string
{
    $c = strtoupper(trim($c));
    return preg_match('/^[A-Z0-9_-]{3,32}$/', $c) ? $c : '';
}

/** El stand ACTIVO con ese cupón, o null. Inexistente e inactivo dan lo mismo. */
function stands_buscar(string $cupon): ?array
{
    return stands_fila('SELECT * FROM stands WHERE cupon = ? AND activo = 1', [$cupon]);
}

/* ---------------------------------------------------------------------------
   Horario
   ---------------------------------------------------------------------------
   Un renglón de stands_horarios por franja: día (1 = lunes ... 7 = domingo,
   como la ISO), hora de abrir y de cerrar en 'HH:MM'. Un día con corte al
   mediodía son dos renglones. Un día sin renglones, el gym no abre.

   Si 'cierra' es menor o igual que 'abre', la franja pasa la medianoche:
   lunes 18:00 a 02:00 sigue abierta el martes a la 1.

   La hora se toma en la zona del gimnasio, NO en la del servidor: el
   hosting puede estar en cualquier lado. */

function stands_minutos(string $hhmm): int
{
    [$h, $m] = array_map('intval', explode(':', $hhmm) + [0, 0]);
    return $h * 60 + $m;
}

/**
 * ['abierto' => bool, 'hoy' => ['07:00–12:00', ...], 'semana' => [1 => [...], ...]]
 */
function stands_horario(int $standId, ?DateTimeImmutable $ahora = null): array
{
    $tz    = new DateTimeZone((string)stands_config()['zona_horaria']);
    $ahora = ($ahora ?? new DateTimeImmutable('now'))->setTimezone($tz);
    $dia   = (int)$ahora->format('N');
    $ayer  = $dia === 1 ? 7 : $dia - 1;
    $min   = (int)$ahora->format('G') * 60 + (int)$ahora->format('i');

    $filas = stands_filas(
        'SELECT dia, abre, cierra FROM stands_horarios WHERE stand_id = ? ORDER BY dia, abre',
        [$standId]
    );

    $semana  = array_fill(1, 7, []);
    $abierto = false;
    foreach ($filas as $f) {
        $d = (int)$f['dia'];
        $a = stands_minutos((string)$f['abre']);
        $c = stands_minutos((string)$f['cierra']);
        if ($d < 1 || $d > 7) continue;
        $semana[$d][] = substr((string)$f['abre'], 0, 5) . '–' . substr((string)$f['cierra'], 0, 5);

        $cruza = $c <= $a;
        if ($d === $dia && ($cruza ? $min >= $a : ($min >= $a && $min < $c))) $abierto = true;
        if ($d === $ayer && $cruza && $min < $c) $abierto = true;
    }

    return [
        'abierto'  => $abierto,
        'cargado'  => count($filas) > 0,
        'hoy'      => $semana[$dia],
        'semana'   => $semana,
    ];
}

/* ---------------------------------------------------------------------------
   Catálogo: n8n + caché
   --------------------------------------------------------------------------- */

/**
 * Pregunta a n8n el catálogo del almacén del stand y lo devuelve normalizado.
 * Lanza excepción si n8n no contesta o contesta algo que no se entiende:
 * un catálogo vacío por error NO es lo mismo que un stand sin stock.
 */
function stands_catalogo_n8n(array $stand): array
{
    $n = stands_config()['n8n'];
    if ((string)$n['url'] === '') throw new RuntimeException('Falta n8n.url en stands/config.php');

    $cuerpo = json_encode([
        'cupon'        => $stand['cupon'],
        'almacen_id'   => (int)$stand['almacen_id'],
        'ubicacion_id' => (int)$stand['ubicacion_id'],
        'gimnasio_id'  => (int)$stand['gimnasio_id'],
    ]);

    $cab = ['Content-Type: application/json', 'Accept: application/json'];
    if ((string)$n['token'] !== '') $cab[] = $n['cabecera'] . ': ' . $n['token'];

    $ch = curl_init((string)$n['url']);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $cuerpo,
        CURLOPT_HTTPHEADER     => $cab,
        CURLOPT_TIMEOUT        => (int)$n['segundos'],
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $resp   = curl_exec($ch);
    $codigo = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    if ($resp === false) throw new RuntimeException('Sin conexión a n8n: ' . $err);
    if ($codigo < 200 || $codigo >= 300) {
        throw new RuntimeException("n8n respondió HTTP $codigo: " . substr((string)$resp, 0, 300));
    }

    $data = json_decode((string)$resp, true);
    if (!is_array($data)) throw new RuntimeException('n8n respondió algo que no es JSON');

    /* n8n a veces envuelve: { "catalogo": [...] }, { "productos": [...] }, o
       la lista sola. Si el flujo trae su propio error, se respeta. */
    if (isset($data['error']) && $data['error']) {
        throw new RuntimeException('n8n: ' . (is_string($data['error']) ? $data['error'] : json_encode($data['error'])));
    }
    $lista = $data;
    foreach (['catalogo', 'productos', 'items', 'data'] as $k) {
        if (isset($data[$k]) && is_array($data[$k])) { $lista = $data[$k]; break; }
    }
    if ($lista !== [] && array_keys($lista) !== range(0, count($lista) - 1)) {
        throw new RuntimeException('n8n respondió un objeto sin lista de productos');
    }

    return stands_normalizar_catalogo($lista);
}

/**
 * Lleva la respuesta de n8n a la forma que ve el socio:
 *   producto_id, producto, presentacion, precio (Gs, IVA incluido), disponible
 *
 * Acepta los nombres en castellano o los de Odoo (product_id, quantity,
 * reserved_quantity...), porque el flujo puede devolver los quants casi
 * crudos. Si llegan varias filas del mismo producto (una por lote), se suman.
 * Solo quedan los que tienen disponible mayor a cero.
 */
function stands_normalizar_catalogo(array $lista): array
{
    $pick = function (array $f, array $claves) {
        foreach ($claves as $k) if (array_key_exists($k, $f) && $f[$k] !== null && $f[$k] !== false) return $f[$k];
        return null;
    };

    $por = [];
    foreach ($lista as $f) {
        if (!is_array($f)) continue;

        $id     = $pick($f, ['producto_id', 'product_id', 'id']);
        $nombre = $pick($f, ['producto', 'nombre', 'product_name', 'name']);
        // Many2one de Odoo: [id, "nombre"]
        if (is_array($id)) { $nombre = $nombre ?? ($id[1] ?? null); $id = $id[0] ?? null; }
        $id = (int)$id;

        $precio = $pick($f, ['precio', 'precio_unitario', 'price', 'list_price']);
        $disp   = $pick($f, ['disponible', 'available', 'disponible_qty']);
        if ($disp === null) {
            $cant = $pick($f, ['cantidad', 'quantity']);
            $res  = $pick($f, ['reservado', 'reserved_quantity']) ?? 0;
            $disp = $cant === null ? null : (float)$cant - (float)$res;
        }

        if ($id <= 0 || $nombre === null || !is_numeric($precio) || (float)$precio <= 0 || !is_numeric($disp)) {
            stands_log('catalogo', 'fila descartada: ' . substr((string)json_encode($f), 0, 300));
            continue;
        }

        if (!isset($por[$id])) {
            $por[$id] = [
                'producto_id'  => $id,
                'producto'     => trim((string)$nombre),
                'presentacion' => trim((string)($pick($f, ['presentacion', 'variante', 'presentation']) ?? '')),
                'precio'       => (int)round((float)$precio),
                'disponible'   => 0.0,
            ];
        }
        $por[$id]['disponible'] += (float)$disp;
    }

    $salida = [];
    foreach ($por as $p) {
        $p['disponible'] = (int)floor($p['disponible'] + 1e-9);
        if ($p['disponible'] > 0) $salida[] = $p;
    }
    usort($salida, fn($a, $b) => strcmp($a['producto'] . $a['presentacion'], $b['producto'] . $b['presentacion']));
    return $salida;
}

/**
 * El catálogo del stand, desde la caché si está fresca y si no desde n8n.
 * Devuelve ['productos' => [...], 'actualizado' => 'Y-m-d H:i:s UTC', 'desactualizado' => bool]
 * Lanza excepción solo si no hay ni n8n ni copia aceptable.
 */
function stands_catalogo(array $stand): array
{
    $c   = stands_config()['cache'];
    $id  = (int)$stand['id'];
    $fila = stands_fila('SELECT datos, guardado FROM stands_cache WHERE stand_id = ?', [$id]);
    $edad = $fila ? time() - strtotime($fila['guardado'] . ' UTC') : PHP_INT_MAX;

    if ($fila && $edad <= (int)$c['vigente']) {
        return ['productos' => json_decode($fila['datos'], true) ?: [], 'actualizado' => $fila['guardado'], 'desactualizado' => false];
    }

    try {
        $productos = stands_catalogo_n8n($stand);
    } catch (Throwable $e) {
        stands_log('n8n', "stand {$stand['cupon']}: " . $e->getMessage());
        if ($fila && $edad <= (int)$c['respaldo']) {
            return ['productos' => json_decode($fila['datos'], true) ?: [], 'actualizado' => $fila['guardado'], 'desactualizado' => true];
        }
        throw $e;
    }

    $ahora = stands_ahora_utc();
    try {
        $pdo = stands_db();
        $pdo->beginTransaction();
        stands_consulta('DELETE FROM stands_cache WHERE stand_id = ?', [$id]);
        stands_consulta('INSERT INTO stands_cache (stand_id, datos, guardado) VALUES (?, ?, ?)',
            [$id, json_encode($productos, JSON_UNESCAPED_UNICODE), $ahora]);
        $pdo->commit();
    } catch (Throwable $e) {
        // No guardar la caché no es motivo para no mostrar el catálogo.
        if (stands_db()->inTransaction()) stands_db()->rollBack();
        stands_log('cache', $e->getMessage());
    }

    return ['productos' => $productos, 'actualizado' => $ahora, 'desactualizado' => false];
}
