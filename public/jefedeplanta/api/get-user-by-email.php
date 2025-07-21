<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Database connection parameters
$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "jefe_planta";

try {
    // Create connection
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get email parameter from URL
    $email = isset($_GET['email']) ? trim($_GET['email']) : '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Email parameter is required'
        ]);
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email format'
        ]);
        exit;
    }
    
    // Prepare and execute query to find user by email
    // Note: Adjust table name and column names based on your actual database schema
    $stmt = $conn->prepare("SELECT id, nombre, email, created_at FROM usuarios WHERE email = :email LIMIT 1");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // User found, return user data
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'name' => $user['nombre'], // Alternative field name for compatibility
                'email' => $user['email'],
                'created_at' => $user['created_at']
            ]
        ]);
    } else {
        // User not found
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'User not found with the provided email',
            'data' => null
        ]);
    }
    
} catch(PDOException $e) {
    // Database error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    // General error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}

// Close connection
$conn = null;
?>
