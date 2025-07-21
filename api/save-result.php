<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
$host = 'localhost';
$dbname = 'resultados';
$username = 'admin';
$password = 'Imc590923cz4#';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }
        
        // Prepare SQL statement
        $sql = "INSERT INTO evaluaciones_personal (
            nombre, 
            fecha, 
            tipo_evaluacion, 
            calificaciones_secciones, 
            total_obtenido, 
            respuestas, 
            observaciones,
            pass_status,
            trap_incorrect_count,
            created_at
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $pdo->prepare($sql);
        // Map boolean pass to enum value
        $passStatus = ($input['pass'] ?? false) ? 'APROBADO' : 'REPROBADO';
        
        $stmt->execute([
            $input['nombre'] ?? 'usuario1',
            'personal',
            json_encode($input['calificaciones_secciones'] ?? []),
            $input['total_obtenido'] ?? 0,
            json_encode($input['respuestas'] ?? []),
            $input['observaciones'] ?? '',
            $passStatus,
            $input['trapIncorrect'] ?? 0
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Try to save JSON file (optional - don't break if it fails)
        $filename = null;
        try {
            $respuestasDir = '../respuestas/';
            if (!file_exists($respuestasDir)) {
                mkdir($respuestasDir, 0755, true);
            }
            
            $filename = 'evaluacion_' . $id . '_' . date('Y-m-d_H-i-s') . '.json';
            $filepath = $respuestasDir . $filename;
            
            $jsonData = [
                'id' => $id,
                'nombre' => $input['nombre'] ?? 'usuario1',
                'fecha' => date('Y-m-d H:i:s'),
                'tipo_evaluacion' => 'personal',
                'calificaciones_secciones' => $input['calificaciones_secciones'] ?? [],
                'total_obtenido' => $input['total_obtenido'] ?? 0,
                'respuestas' => $input['respuestas'] ?? [],
                'observaciones' => $input['observaciones'] ?? '',
                'pass_status' => $passStatus,
                'trap_incorrect_count' => $input['trapIncorrect'] ?? 0,
                'timestamp' => time()
            ];
            
            file_put_contents($filepath, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } catch (Exception $fileError) {
            // Log the error but don't fail the request
            error_log('Warning: Could not save JSON file: ' . $fileError->getMessage());
            $filename = null;
        }
        
        // Return success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'id' => $id,
            'filename' => $filename,
            'message' => 'Resultado guardado exitosamente en base de datos y archivo JSON'
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all results
        $stmt = $pdo->query("SELECT * FROM evaluaciones_personal ORDER BY created_at DESC");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        foreach ($results as &$result) {
            $result['calificaciones_secciones'] = json_decode($result['calificaciones_secciones'], true);
            $result['respuestas'] = json_decode($result['respuestas'], true);
        }

        echo json_encode([
            'success' => true,
            'data' => $results
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
