<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuración de la base de datos
$servername = "localhost";
$username = ""; // Se puede cambiar según las credenciales
$password = ""; // Se puede cambiar según las credenciales
$dbname = "plantas_concreto2"; // Usando la misma base de datos que tu aplicación

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Obtener información del usuario por ID, email o username
        $userId = $_GET['user_id'] ?? null;
        $email = $_GET['email'] ?? null;
        $username = $_GET['username'] ?? null;

        if ($userId) {
            // Buscar por ID de usuario
            $sql = "SELECT id, username, nombre_completo as nombre, email, rol, fecha_creacion, activo
                    FROM usuarios
                    WHERE id = ? AND activo = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);

        } elseif ($email) {
            // Buscar por email
            $sql = "SELECT id, username, nombre_completo as nombre, email, rol, fecha_creacion, activo
                    FROM usuarios
                    WHERE email = ? AND activo = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$email]);

        } elseif ($username) {
            // Buscar por username
            $sql = "SELECT id, username, nombre_completo as nombre, email, rol, fecha_creacion, activo
                    FROM usuarios
                    WHERE username = ? AND activo = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$username]);

        } else {
            // Si no se especifica ningún parámetro, devolver error
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Se requiere user_id, email o username como parámetro'
            ]);
            exit;
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Usuario encontrado
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'nombre' => $user['nombre'],
                    'email' => $user['email'],
                    'rol' => $user['rol'],
                    'fecha_creacion' => $user['fecha_creacion'],
                    'activo' => (bool)$user['activo']
                ]
            ]);
        } else {
            // Usuario no encontrado
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Usuario no encontrado'
            ]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Crear o actualizar información del usuario
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['email']) || !isset($input['nombre'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Se requieren los campos: nombre y email'
            ]);
            exit;
        }

        // Verificar si el usuario ya existe
        $checkSql = "SELECT id FROM usuarios WHERE email = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$input['email']]);
        $existingUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            // Actualizar usuario existente
            $updateSql = "UPDATE usuarios
                         SET nombre_completo = ?, rol = ?, activo = 1
                         WHERE email = ?";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([
                $input['nombre'],
                $input['rol'] ?? 'jefe_planta',
                $input['email']
            ]);

            $userId = $existingUser['id'];
            $message = 'Usuario actualizado exitosamente';

        } else {
            // Crear nuevo usuario
            $insertSql = "INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol, fecha_creacion, activo)
                         VALUES (?, ?, ?, ?, ?, NOW(), 1)";
            $insertStmt = $pdo->prepare($insertSql);
            // Generar username basado en el nombre
            $username = strtolower(str_replace(' ', '', $input['nombre']));
            // Generar password por defecto (se puede cambiar después)
            $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
            $insertStmt->execute([
                $input['nombre'],
                $username,
                $input['email'],
                $defaultPassword,
                $input['rol'] ?? 'admin'
            ]);

            $userId = $pdo->lastInsertId();
            $message = 'Usuario creado exitosamente';
        }

        // Devolver la información del usuario
        $selectSql = "SELECT id, username, nombre_completo as nombre, email, rol, fecha_creacion, activo
                     FROM usuarios WHERE id = ?";
        $selectStmt = $pdo->prepare($selectSql);
        $selectStmt->execute([$userId]);
        $userData = $selectStmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => [
                'id' => $userData['id'],
                'username' => $userData['username'],
                'nombre' => $userData['nombre'],
                'email' => $userData['email'],
                'rol' => $userData['rol'],
                'fecha_creacion' => $userData['fecha_creacion'],
                'activo' => (bool)$userData['activo']
            ]
        ]);

    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Método no permitido'
        ]);
    }

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>
