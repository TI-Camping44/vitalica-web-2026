<?php
/* ============================================================================
   VITALICA — api/usuarios.php  ·  USUARIOS DEL ÁREA INTERNA
   ----------------------------------------------------------------------------
   Cada persona entra con SU usuario y SU contraseña, y con los permisos que
   le correspondan. Antes había una sola clave compartida por todos: eso hace
   imposible saber quién hizo qué, y el día que alguien deja la empresa hay
   que cambiarle la clave a todo el mundo.

   LAS CONTRASEÑAS NO SE GUARDAN
   Se guarda un hash con password_hash(), que es de una sola dirección: sirve
   para verificar si la que escribieron coincide, pero no se puede volver
   atrás para leerla. Ni yo ni vos podemos ver la contraseña de nadie — si
   alguien la olvida, se le asigna una nueva.

   Esto importa porque la gente reusa contraseñas: si el archivo se filtrara
   con las claves en texto plano, se estaría regalando también el acceso al
   correo o al banco de esa persona.

   PERMISOS
     admin    → todo: pedidos, configuración del sitio y gestión del equipo
     pedidos  → solo el panel de pedidos (logística, ventas)

   DÓNDE SE GUARDA
   En usuarios.json, en la misma carpeta que los pedidos — idealmente fuera
   de la carpeta web. El .htaccess bloquea los .json por las dudas.
   ============================================================================ */

declare(strict_types=1);

const VIT_ROLES = [
    'admin'   => 'Administrador',
    'pedidos' => 'Pedidos',
];

function usuarios_archivo(array $cfg): string {
    $carpeta = ($cfg['carpeta_pedidos'] ?? '') ?: (__DIR__ . '/almacen');
    if (!is_dir($carpeta)) @mkdir($carpeta, 0750, true);
    return $carpeta . '/usuarios.json';
}

function usuarios_leer(array $cfg): array {
    $f = usuarios_archivo($cfg);
    if (!file_exists($f)) return [];
    $d = json_decode((string)@file_get_contents($f), true);
    return is_array($d) ? $d : [];
}

function usuarios_guardar(array $cfg, array $us): bool {
    return @file_put_contents(
        usuarios_archivo($cfg),
        json_encode($us, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    ) !== false;
}

/* El usuario se busca sin distinguir mayúsculas: nadie tiene que acordarse de
   si lo cargó como "Admin" o "admin" a las 7 de la mañana. */
function usuarios_normalizar(string $u): string {
    return mb_strtolower(trim($u));
}

/**
 * Crea el primer usuario si el archivo no existe todavía.
 * Sin esto, después de instalar no habría forma de entrar a crear a nadie.
 */
function usuarios_sembrar(array $cfg): void {
    $us = usuarios_leer($cfg);
    if ($us) return;

    $semilla = $cfg['panel']['usuario_inicial'] ?? null;
    if (!$semilla || empty($semilla['usuario']) || empty($semilla['clave'])) return;

    usuarios_guardar($cfg, [
        usuarios_normalizar($semilla['usuario']) => [
            'usuario'  => trim($semilla['usuario']),   // como se escribió, para mostrarlo
            'nombre'   => $semilla['nombre'] ?? trim($semilla['usuario']),
            'rol'      => 'admin',
            'hash'     => password_hash($semilla['clave'], PASSWORD_DEFAULT),
            'activo'   => true,
            'creado'   => date('c'),
            'ultimo'   => null,
        ],
    ]);
}

/**
 * Verifica usuario y contraseña.
 * Devuelve el usuario si coincide, o null.
 */
function usuarios_verificar(array $cfg, string $usuario, string $clave): ?array {
    $us = usuarios_leer($cfg);
    $k  = usuarios_normalizar($usuario);
    if (!isset($us[$k])) {
        /* Aunque el usuario no exista, igual gastamos el tiempo de un hash.
           Si respondiéramos al instante, se podría averiguar qué usuarios
           existen midiendo cuánto tarda cada intento. */
        password_verify($clave, '$2y$10$usuarioinexistenteusuarioinexistenteusuarioinexiste');
        return null;
    }

    $u = $us[$k];
    if (empty($u['activo'])) return null;
    if (!password_verify($clave, (string)($u['hash'] ?? ''))) return null;

    // Registrar el último ingreso (no es crítico si falla).
    $us[$k]['ultimo'] = date('c');
    usuarios_guardar($cfg, $us);

    $u['clave_id'] = $k;
    return $u;
}

/** Alta o edición. Devuelve '' si salió bien, o el motivo del error. */
function usuarios_grabar(array $cfg, string $usuario, string $nombre, string $rol,
                         string $claveNueva, bool $activo, ?string $editando = null): string {
    $usuario = trim($usuario);
    if ($usuario === '') return 'Falta el nombre de usuario.';
    if (!preg_match('/^[A-Za-z0-9._-]{3,30}$/', $usuario)) {
        return 'El usuario solo puede tener letras, números, punto, guion y guion bajo (3 a 30 caracteres).';
    }
    if (!isset(VIT_ROLES[$rol])) return 'Permiso no válido.';

    $us = usuarios_leer($cfg);
    $k  = usuarios_normalizar($usuario);

    // Si se renombró, no puede pisar a otro que ya exista.
    if ($editando !== null && $k !== $editando && isset($us[$k])) {
        return 'Ya existe un usuario con ese nombre.';
    }
    if ($editando === null && isset($us[$k])) {
        return 'Ya existe un usuario con ese nombre.';
    }

    $previo = ($editando !== null && isset($us[$editando])) ? $us[$editando] : [];

    if ($claveNueva !== '') {
        if (mb_strlen($claveNueva) < 8) return 'La contraseña necesita al menos 8 caracteres.';
        $hash = password_hash($claveNueva, PASSWORD_DEFAULT);
    } else {
        $hash = $previo['hash'] ?? '';
        if ($hash === '') return 'Un usuario nuevo necesita contraseña.';
    }

    if ($editando !== null && $k !== $editando) unset($us[$editando]);

    $us[$k] = [
        'usuario' => $usuario,
        'nombre'  => trim($nombre) !== '' ? trim($nombre) : $usuario,
        'rol'     => $rol,
        'hash'    => $hash,
        'activo'  => $activo,
        'creado'  => $previo['creado'] ?? date('c'),
        'ultimo'  => $previo['ultimo'] ?? null,
    ];

    return usuarios_guardar($cfg, $us) ? '' : 'No se pudo guardar. Revisá los permisos de la carpeta.';
}

/** Baja. No deja borrar al último administrador activo. */
function usuarios_borrar(array $cfg, string $clave_id): string {
    $us = usuarios_leer($cfg);
    if (!isset($us[$clave_id])) return 'Ese usuario no existe.';

    $admins = 0;
    foreach ($us as $k => $u) {
        if (($u['rol'] ?? '') === 'admin' && !empty($u['activo']) && $k !== $clave_id) $admins++;
    }
    if ($admins === 0) {
        return 'No se puede borrar: quedaría el sistema sin ningún administrador y nadie podría volver a entrar.';
    }

    unset($us[$clave_id]);
    return usuarios_guardar($cfg, $us) ? '' : 'No se pudo guardar.';
}
