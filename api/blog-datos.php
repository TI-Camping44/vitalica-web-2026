<?php
/* ============================================================================
   VITALICA — api/blog-datos.php  ·  LA LÓGICA DEL BLOG, SIN PANTALLA
   ----------------------------------------------------------------------------
   Guardado, armado del id, conversión del cuerpo y subida de imágenes.

   Está separado de blog.php por un motivo concreto: blog.php exige sesión en
   la primera línea, así que no se puede ejecutar para probarlo sin la clave
   de alguien. Acá no hay sesión ni salida: son funciones puras que se pueden
   correr desde la consola y comprobar una por una.

       php api/blog-datos.php --probar

   Quien las usa es api/blog.php.
   ============================================================================ */

declare(strict_types=1);

/* ---------------------------------------------------------------------------
   Guardado
   --------------------------------------------------------------------------- */
function notas_leer(string $archivo): array {
    if (!file_exists($archivo)) return [];
    $d = json_decode((string)file_get_contents($archivo), true);
    return is_array($d) ? $d : [];
}

/** Ordena de la más nueva a la más vieja. */
function notas_ordenar(array $notas): array {
    usort($notas, fn($a, $b) => strcmp((string)($b['fecha'] ?? ''), (string)($a['fecha'] ?? '')));
    return $notas;
}

/**
 * Escribe el JSON y regenera el .js que lee el sitio.
 *
 * El .js se arma con json_encode y no a mano: así los acentos, las comillas y
 * los saltos de línea quedan escapados como corresponde. Un apóstrofo en un
 * título alcanzaría para romper la página entera si esto se armara pegando
 * texto.
 */
function notas_guardar(array $notas, string $archivo, string $publicado): string {
    $notas = notas_ordenar($notas);

    $dir = dirname($archivo);
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) return 'No pude crear la carpeta de guardado.';

    $json = json_encode($notas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (@file_put_contents($archivo, $json, LOCK_EX) === false) {
        return 'No pude escribir ' . basename($archivo) . '. Revisá los permisos de la carpeta.';
    }

    $cab = "/* ==========================================================================\n"
         . "   VITALICA — data-noticias.js  ·  LAS NOTAS DEL BLOG\n"
         . "   --------------------------------------------------------------------------\n"
         . "   GENERADO POR api/blog.php. No editar a mano: se sobrescribe entero cada\n"
         . "   vez que se guarda una nota desde el panel.\n"
         . "   El original está en api/almacen/blog.json.\n"
         . "   Última escritura: " . date('d/m/Y H:i') . "\n"
         . "   ========================================================================== */\n"
         . "const VITALICA_NOTICIAS = ";

    $cuerpo = json_encode($notas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (@file_put_contents($publicado, $cab . $cuerpo . ";\n", LOCK_EX) === false) {
        return 'Guardé la nota pero no pude publicar el archivo del sitio. Revisá los permisos de assets/js.';
    }
    return '';
}

/* ---------------------------------------------------------------------------
   El id que va en la dirección
   ---------------------------------------------------------------------------
   Sale del título: minúsculas, sin tildes, sin signos y con guiones. Se mira
   que no choque con otro, porque el id es lo que identifica a la nota.
   --------------------------------------------------------------------------- */
function id_desde(string $titulo, array $notas, string $exceptuando = ''): string {
    /* NO se usa iconv con ASCII//TRANSLIT.
       Parece la forma obvia de sacar las tildes, pero el resultado depende de
       la biblioteca del sistema: en este Windows convierte "é" en "'e", y el
       id de "¿Qué significa...?" salía "qu-e-significa". En un Linux con glibc
       da otra cosa. O sea que el mismo título generaría direcciones distintas
       según dónde corra, y las direcciones no pueden cambiar.

       Con una tabla explícita el resultado es el mismo en todos lados. */
    $t = strtr($titulo, [
        'á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n',
        'Á'=>'A','É'=>'E','Í'=>'I','Ó'=>'O','Ú'=>'U','Ü'=>'U','Ñ'=>'N',
        'à'=>'a','è'=>'e','ì'=>'i','ò'=>'o','ù'=>'u',
        'â'=>'a','ê'=>'e','î'=>'i','ô'=>'o','û'=>'u',
        'ç'=>'c','Ç'=>'C',
    ]);
    $t = mb_strtolower($t, 'UTF-8');
    $t = preg_replace('/[^a-z0-9]+/', '-', $t) ?? '';
    $t = trim((string)$t, '-');
    if ($t === '') $t = 'nota';
    $t = substr($t, 0, 70);

    $usados = [];
    foreach ($notas as $n) {
        if (($n['id'] ?? '') !== $exceptuando) $usados[] = (string)($n['id'] ?? '');
    }
    $base = $t; $i = 2;
    while (in_array($t, $usados, true)) { $t = $base . '-' . $i; $i++; }
    return $t;
}

/* ---------------------------------------------------------------------------
   El cuerpo de la nota
   ---------------------------------------------------------------------------
   Se escribe en un cuadro de texto con cuatro convenciones que se aprenden en
   medio minuto. Se eligió esto y no un armador de bloques con botones porque
   quien carga las notas escribe de corrido, y un formulario que obliga a
   elegir "agregar párrafo" cada dos renglones cansa a la tercera nota.

       ## Un subtítulo
       - un renglón de lista
       > una cita             (o  > una cita | quién la dijo)
       [el texto](la-direccion)
       !assets/img/blog/foto.jpg | pie de foto
       cualquier otra cosa    → párrafo

   Los renglones vacíos separan; no generan nada.
   --------------------------------------------------------------------------- */
function cuerpo_desde_texto(string $texto): array {
    $bloques = [];
    $lista   = [];

    $cerrar_lista = function () use (&$bloques, &$lista) {
        if ($lista) { $bloques[] = ['tipo' => 'lista', 'items' => $lista]; $lista = []; }
    };

    foreach (preg_split('/\r\n|\r|\n/', $texto) ?: [] as $cruda) {
        $l = trim($cruda);
        if ($l === '') { $cerrar_lista(); continue; }

        if (str_starts_with($l, '## ')) {
            $cerrar_lista();
            $bloques[] = ['tipo' => 'titulo', 'texto' => trim(substr($l, 3))];

        } elseif (str_starts_with($l, '- ')) {
            $lista[] = trim(substr($l, 2));

        } elseif (str_starts_with($l, '> ')) {
            $cerrar_lista();
            $c = trim(substr($l, 2));
            $autor = '';
            if (str_contains($c, '|')) {
                [$c, $autor] = array_map('trim', explode('|', $c, 2));
            }
            $b = ['tipo' => 'cita', 'texto' => $c];
            if ($autor !== '') $b['autor'] = $autor;
            $bloques[] = $b;

        } elseif (str_starts_with($l, '!')) {
            $cerrar_lista();
            $c = trim(substr($l, 1));
            $pie = '';
            if (str_contains($c, '|')) {
                [$c, $pie] = array_map('trim', explode('|', $c, 2));
            }
            if ($c !== '') {
                $b = ['tipo' => 'imagen', 'src' => $c];
                if ($pie !== '') $b['pie'] = $pie;
                $bloques[] = $b;
            }

        } elseif (preg_match('/^\[(.+?)\]\((.+?)\)$/', $l, $m)) {
            $cerrar_lista();
            $bloques[] = ['tipo' => 'enlace', 'texto' => trim($m[1]), 'href' => trim($m[2])];

        } else {
            $cerrar_lista();
            $bloques[] = ['tipo' => 'parrafo', 'texto' => $l];
        }
    }
    $cerrar_lista();
    return $bloques;
}

/** El camino de vuelta: de los bloques al texto, para poder editar. */
function texto_desde_cuerpo(array $cuerpo): string {
    $out = [];
    foreach ($cuerpo as $b) {
        switch ($b['tipo'] ?? '') {
            case 'titulo':  $out[] = '## ' . ($b['texto'] ?? ''); break;
            case 'parrafo': $out[] = $b['texto'] ?? ''; break;
            case 'lista':
                foreach (($b['items'] ?? []) as $i) $out[] = '- ' . $i;
                break;
            case 'cita':
                $out[] = '> ' . ($b['texto'] ?? '') .
                         (!empty($b['autor']) ? ' | ' . $b['autor'] : '');
                break;
            case 'imagen':
                $out[] = '!' . ($b['src'] ?? '') .
                         (!empty($b['pie']) ? ' | ' . $b['pie'] : '');
                break;
            case 'enlace':
                $out[] = '[' . ($b['texto'] ?? '') . '](' . ($b['href'] ?? '') . ')';
                break;
        }
        $out[] = '';
    }
    return trim(implode("\n", $out));
}

/* ---------------------------------------------------------------------------
   Subida de imágenes
   --------------------------------------------------------------------------- */
function subir_imagen(array $f, string $destino, int $max): array {
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return ['', ''];
    if (($f['error'] ?? 1) !== UPLOAD_ERR_OK)  return ['', 'La imagen no llegó completa. Probá de nuevo.'];
    if (($f['size'] ?? 0) > $max)              return ['', 'La imagen pesa más de 4 MB. Achicala y volvé a subirla.'];
    if (!is_uploaded_file($f['tmp_name'] ?? '')) return ['', 'Archivo inválido.'];

    // getimagesize() abre el archivo de verdad: si no es una imagen, falla.
    // No se mira $f['type'], que lo dice el navegador y se puede inventar.
    $info = @getimagesize($f['tmp_name']);
    if ($info === false) return ['', 'Ese archivo no es una imagen.'];

    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2]] ?? '';
    if ($ext === '') return ['', 'Solo se aceptan JPG, PNG o WEBP.'];

    if (!is_dir($destino) && !@mkdir($destino, 0775, true)) {
        return ['', 'No pude crear assets/img/blog.'];
    }
    // Un .htaccess que impide ejecutar nada de esta carpeta, por si algún día
    // se cuela algo que no sea una imagen.
    $guardia = $destino . '/.htaccess';
    if (!file_exists($guardia)) {
        @file_put_contents($guardia,
            "# Esta carpeta guarda imágenes subidas desde el panel.\n" .
            "# Nada de acá se ejecuta: solo se sirve como archivo.\n" .
            "php_flag engine off\n" .
            "RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps\n" .
            "RemoveType .php .phtml .php3 .php4 .php5 .php7 .phps\n");
    }

    // El nombre lo pone el servidor. El del archivo original no se usa nunca.
    $nombre = date('Ymd') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!@move_uploaded_file($f['tmp_name'], $destino . '/' . $nombre)) {
        return ['', 'No pude guardar la imagen. Revisá los permisos de assets/img/blog.'];
    }
    return ['assets/img/blog/' . $nombre, ''];
}


/* ---------------------------------------------------------------------------
   Comprobaciones
   ---------------------------------------------------------------------------
   Se corren con:  php api/blog-datos.php --probar
   Prueban lo que se puede romper sin darse cuenta: que el cuerpo escrito a
   mano se convierta bien en bloques, que la vuelta devuelva lo mismo, y que
   los id no choquen.
   --------------------------------------------------------------------------- */
if (PHP_SAPI === 'cli' && in_array('--probar', $argv ?? [], true)) {
    $fallos = 0;
    $comprobar = function (string $que, $esperado, $obtenido) use (&$fallos) {
        $ok = json_encode($esperado) === json_encode($obtenido);
        if (!$ok) $fallos++;
        printf("  %s %s
", $ok ? 'ok  ' : 'FALLA', $que);
        if (!$ok) {
            printf("      esperaba: %s
", json_encode($esperado, JSON_UNESCAPED_UNICODE));
            printf("      obtuvo:   %s
", json_encode($obtenido, JSON_UNESCAPED_UNICODE));
        }
    };

    echo "
CUERPO: de texto a bloques
";

    $comprobar('un párrafo suelto',
        [['tipo' => 'parrafo', 'texto' => 'Hola.']],
        cuerpo_desde_texto('Hola.'));

    $comprobar('subtítulo',
        [['tipo' => 'titulo', 'texto' => 'Un título']],
        cuerpo_desde_texto('## Un título'));

    $comprobar('dos renglones de lista se juntan en UNA lista',
        [['tipo' => 'lista', 'items' => ['uno', 'dos']]],
        cuerpo_desde_texto("- uno
- dos"));

    $comprobar('la lista se cierra al llegar un párrafo',
        [['tipo' => 'lista', 'items' => ['uno']], ['tipo' => 'parrafo', 'texto' => 'Después.']],
        cuerpo_desde_texto("- uno
Después."));

    $comprobar('cita con autor',
        [['tipo' => 'cita', 'texto' => 'Frase', 'autor' => 'Olimp']],
        cuerpo_desde_texto('> Frase | Olimp'));

    $comprobar('cita sin autor no inventa el campo',
        [['tipo' => 'cita', 'texto' => 'Frase']],
        cuerpo_desde_texto('> Frase'));

    $comprobar('imagen con pie',
        [['tipo' => 'imagen', 'src' => 'assets/img/blog/a.jpg', 'pie' => 'El pie']],
        cuerpo_desde_texto('!assets/img/blog/a.jpg | El pie'));

    $comprobar('enlace',
        [['tipo' => 'enlace', 'texto' => 'Ir', 'href' => 'contacto.html']],
        cuerpo_desde_texto('[Ir](contacto.html)'));

    $comprobar('los renglones vacíos no generan bloques',
        [['tipo' => 'parrafo', 'texto' => 'A'], ['tipo' => 'parrafo', 'texto' => 'B']],
        cuerpo_desde_texto("A


B"));

    echo "
CUERPO: ida y vuelta
";
    $texto = "## Título

Un párrafo.

- uno
- dos

> Cita | Autor

[Ir](a.html)";
    $comprobar('el texto sobrevive el viaje de ida y vuelta',
        cuerpo_desde_texto($texto),
        cuerpo_desde_texto(texto_desde_cuerpo(cuerpo_desde_texto($texto))));

    echo "
ID
";
    $comprobar('saca tildes, signos y mayúsculas',
        'que-significa-la-certificacion-gmp',
        id_desde('¿Qué significa la certificación GMP?', []));

    $comprobar('no repite un id que ya existe',
        'una-nota-2',
        id_desde('Una nota', [['id' => 'una-nota']]));

    $comprobar('al editar, puede quedarse con el suyo',
        'una-nota',
        id_desde('Una nota', [['id' => 'una-nota']], 'una-nota'));

    $comprobar('un título sin letras no deja el id vacío',
        'nota',
        id_desde('¡¿!¿', []));

    echo "
ORDEN
";
    $comprobar('de la más nueva a la más vieja',
        ['b', 'a'],
        array_column(notas_ordenar([
            ['id' => 'a', 'fecha' => '2026-01-01'],
            ['id' => 'b', 'fecha' => '2026-09-01'],
        ]), 'id'));

    echo "
" . ($fallos === 0 ? "Todo bien.

" : "$fallos comprobaciones fallaron.

");
    exit($fallos === 0 ? 0 : 1);
}
