<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$servername = "localhost";
$username = "admin"; // Se puede cambiar según las credenciales
$password = "Imc590923cz4#"; // Se puede cambiar según las credenciales
$dbname = "plantas_concreto2";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Consulta para obtener secciones, preguntas y sus ponderaciones
    $sql = "SELECT 
                se.id as seccion_id,
                se.nombre as seccion_nombre,
                se.ponderacion as seccion_ponderacion,
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
            ORDER BY se.id, p.id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Organizar los datos por secciones
    $secciones = [];
    foreach ($rows as $row) {
        $seccionId = $row['seccion_id'];
        
        if (!isset($secciones[$seccionId])) {
            $secciones[$seccionId] = [
                'id' => $seccionId,
                'name' => $row['seccion_nombre'],
                'ponderacion' => (float)$row['seccion_ponderacion'],
                'preguntas' => []
            ];
        }
        
        $pregunta = [
            'id' => $row['pregunta_id'],
            'pregunta' => $row['pregunta_texto'],
            'tipo' => $row['pregunta_tipo']
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
        
        $secciones[$seccionId]['preguntas'][] = $pregunta;
    }

    // Convertir a array indexado
    $resultado = array_values($secciones);

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
