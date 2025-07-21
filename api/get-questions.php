<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$servername = "localhost";
$username = ""; // Se puede cambiar según las credenciales
$password = ""; // Se puede cambiar según las credenciales
$dbname = "plantas_concreto2";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Consulta para obtener secciones (excluyendo preguntas trampa)
    $sqlSecciones = "SELECT DISTINCT
                se.id as seccion_id,
                se.nombre as seccion_nombre,
                se.ponderacion as seccion_ponderacion
            FROM secciones_evaluacion se
            INNER JOIN roles_personal rp ON se.rol_personal_id = rp.id
            INNER JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
            WHERE rp.codigo = 'jefe_planta'
            AND te.codigo = 'personal'
            AND se.ponderacion > 0
            ORDER BY se.id";

    // Consulta para obtener preguntas trampa
    $sqlTrampa = "SELECT
                p.id as pregunta_id,
                p.pregunta as pregunta_texto,
                p.tipo_pregunta as pregunta_tipo,
                p.opcion_a,
                p.opcion_b,
                p.opcion_c,
                p.respuesta_correcta
            FROM secciones_evaluacion se
            INNER JOIN preguntas p ON se.id = p.seccion_id
            INNER JOIN roles_personal rp ON se.rol_personal_id = rp.id
            INNER JOIN tipos_evaluacion te ON se.tipo_evaluacion_id = te.id
            WHERE rp.codigo = 'jefe_planta'
            AND te.codigo = 'personal'
            AND se.ponderacion = 0
            ORDER BY RAND()
            LIMIT 100";

    // Obtener secciones
    $stmtSecciones = $pdo->prepare($sqlSecciones);
    $stmtSecciones->execute();
    $secciones = $stmtSecciones->fetchAll(PDO::FETCH_ASSOC);

    // Obtener preguntas trampa
    $stmtTrampa = $pdo->prepare($sqlTrampa);
    $stmtTrampa->execute();
    $preguntasTrampa = $stmtTrampa->fetchAll(PDO::FETCH_ASSOC);

    $resultado = [];
    $indiceTrampa = 0;

    foreach ($secciones as $seccion) {
        $seccionId = $seccion['seccion_id'];

        // Consulta para obtener preguntas de esta sección específica
        $sqlPreguntasSeccion = "SELECT
                    p.id as pregunta_id,
                    p.pregunta as pregunta_texto,
                    p.tipo_pregunta as pregunta_tipo,
                    p.opcion_a,
                    p.opcion_b,
                    p.opcion_c,
                    p.respuesta_correcta
                FROM preguntas p
                WHERE p.seccion_id = :seccion_id
                AND p.activo = 1
                ORDER BY RAND()
                LIMIT 5";

        $stmtPreguntas = $pdo->prepare($sqlPreguntasSeccion);
        $stmtPreguntas->bindParam(':seccion_id', $seccionId, PDO::PARAM_INT);
        $stmtPreguntas->execute();
        $preguntasSeccion = $stmtPreguntas->fetchAll(PDO::FETCH_ASSOC);

        $preguntasFormateadas = [];

        // Formatear preguntas normales
        foreach ($preguntasSeccion as $row) {
            $pregunta = [
                'id' => $row['pregunta_id'],
                'pregunta' => $row['pregunta_texto'],
                'tipo' => $row['pregunta_tipo'],
                'es_trampa' => false
            ];

            // Si es una pregunta de selección múltiple, agregar las opciones
            if ($row['pregunta_tipo'] === 'seleccion_multiple') {
                $pregunta['opciones'] = [
                    'a' => $row['opcion_a'],
                    'b' => $row['opcion_b'],
                    'c' => $row['opcion_c']
                ];
                $pregunta['respuesta_correcta'] = $row['respuesta_correcta'];
            }

            $preguntasFormateadas[] = $pregunta;
        }

        // Agregar una pregunta trampa si hay disponibles
        if ($indiceTrampa < count($preguntasTrampa)) {
            $trampa = $preguntasTrampa[$indiceTrampa];
            $preguntaTrampa = [
                'id' => $trampa['pregunta_id'],
                'pregunta' => $trampa['pregunta_texto'],
                'tipo' => $trampa['pregunta_tipo'],
                'es_trampa' => true
            ];

            // Si es una pregunta de selección múltiple, agregar las opciones
            if ($trampa['pregunta_tipo'] === 'seleccion_multiple') {
                $preguntaTrampa['opciones'] = [
                    'a' => $trampa['opcion_a'],
                    'b' => $trampa['opcion_b'],
                    'c' => $trampa['opcion_c']
                ];
                $preguntaTrampa['respuesta_correcta'] = $trampa['respuesta_correcta'];
            }

            $preguntasFormateadas[] = $preguntaTrampa;
            $indiceTrampa++;
        }

        // Mezclar las preguntas para que la trampa no esté siempre al final
        shuffle($preguntasFormateadas);

        $resultado[] = [
            'id' => $seccionId,
            'name' => $seccion['seccion_nombre'],
            'ponderacion' => (float)$seccion['seccion_ponderacion'],
            'preguntas' => $preguntasFormateadas
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $resultado
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión: ' . $e->getMessage()
    ]);
}
?>
