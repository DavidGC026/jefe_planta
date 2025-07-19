<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$servername = "localhost";
$username = "root"; // Se puede cambiar según las credenciales
$password = ""; // Se puede cambiar según las credenciales
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
                p.tipo as pregunta_tipo
            FROM secciones_evaluacion se
            INNER JOIN preguntas p ON se.id = p.seccion_id
            INNER JOIN roles_personal rp ON se.rol_id = rp.id
            WHERE rp.nombre = 'jefe_planta' 
            AND se.tipo = 'personal'
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
        
        $secciones[$seccionId]['preguntas'][] = [
            'id' => $row['pregunta_id'],
            'pregunta' => $row['pregunta_texto'],
            'tipo' => $row['pregunta_tipo']
        ];
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
