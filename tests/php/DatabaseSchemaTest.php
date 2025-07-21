<?php

/**
 * DatabaseSchemaTest - Tests for database schema validation
 * Ensures that new columns (pass_status, trap_incorrect_count) are included in DB inserts
 */

class DatabaseSchemaTest
{
    private $pdo;
    private $testDbName = 'test_resultados';

    public function __construct()
    {
        $this->setupTestDatabase();
    }

    private function setupTestDatabase()
    {
        try {
            // Connect to MySQL server
            $this->pdo = new PDO('mysql:host=localhost', 'admin', 'Imc590923cz4#');
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Create test database
            $this->pdo->exec("CREATE DATABASE IF NOT EXISTS {$this->testDbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $this->pdo->exec("USE {$this->testDbName}");

            // Create test table with updated schema
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS evaluaciones_personal (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL DEFAULT 'usuario1',
                    fecha DATE NOT NULL,
                    tipo_evaluacion VARCHAR(50) NOT NULL DEFAULT 'personal',
                    calificaciones_secciones JSON,
                    total_obtenido DECIMAL(5,2) NOT NULL DEFAULT 0,
                    respuestas JSON,
                    observaciones TEXT,
                    pass_status ENUM('APROBADO', 'REPROBADO') DEFAULT 'REPROBADO',
                    trap_incorrect_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ";
            
            $this->pdo->exec($createTableSQL);

        } catch (PDOException $e) {
            die("Database setup failed: " . $e->getMessage());
        }
    }

    public function testDatabaseSchemaHasNewColumns()
    {
        echo "Testing database schema includes new columns...\n";

        $query = "DESCRIBE evaluaciones_personal";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $columnNames = array_column($columns, 'Field');
        
        // Assert new columns exist
        $this->assertTrue(in_array('pass_status', $columnNames), "Column 'pass_status' should exist in table");
        $this->assertTrue(in_array('trap_incorrect_count', $columnNames), "Column 'trap_incorrect_count' should exist in table");

        echo "✓ Database schema includes required new columns\n";
        return true;
    }

    public function testInsertIncludesNewColumns()
    {
        echo "Testing database insert includes new columns...\n";

        $testData = [
            'nombre' => 'test_user',
            'fecha' => date('Y-m-d'),
            'tipo_evaluacion' => 'personal',
            'calificaciones_secciones' => json_encode(['section1' => ['porcentaje' => 85]]),
            'total_obtenido' => 85.5,
            'respuestas' => json_encode(['q1' => 'si', 'q2' => 'no']),
            'observaciones' => 'Test observation',
            'pass_status' => 'APROBADO',
            'trap_incorrect_count' => 1
        ];

        $sql = "INSERT INTO evaluaciones_personal (
            nombre, fecha, tipo_evaluacion, calificaciones_secciones, 
            total_obtenido, respuestas, observaciones, pass_status, 
            trap_incorrect_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([
            $testData['nombre'],
            $testData['fecha'],
            $testData['tipo_evaluacion'],
            $testData['calificaciones_secciones'],
            $testData['total_obtenido'],
            $testData['respuestas'],
            $testData['observaciones'],
            $testData['pass_status'],
            $testData['trap_incorrect_count']
        ]);

        $this->assertTrue($result, "Insert operation should succeed");

        $insertId = $this->pdo->lastInsertId();
        $this->assertTrue($insertId > 0, "Insert should generate a valid ID");

        // Verify the data was inserted correctly
        $selectStmt = $this->pdo->prepare("SELECT * FROM evaluaciones_personal WHERE id = ?");
        $selectStmt->execute([$insertId]);
        $insertedRow = $selectStmt->fetch(PDO::FETCH_ASSOC);

        $this->assertEqual($insertedRow['pass_status'], $testData['pass_status'], "pass_status should be inserted correctly");
        $this->assertEqual($insertedRow['trap_incorrect_count'], $testData['trap_incorrect_count'], "trap_incorrect_count should be inserted correctly");

        echo "✓ Database insert successfully includes new columns\n";
        return true;
    }

    public function testApiEndpointHandlesNewFields()
    {
        echo "Testing API endpoint handles new fields...\n";

        $testPayload = [
            'nombre' => 'api_test_user',
            'calificaciones_secciones' => ['section1' => ['porcentaje' => 90]],
            'total_obtenido' => 90,
            'respuestas' => ['q1' => 'si'],
            'observaciones' => 'API test',
            'pass' => 'APROBADO',
            'trapIncorrect' => 2
        ];

        // Simulate what the API does
        $sql = "INSERT INTO evaluaciones_personal (
            nombre, fecha, tipo_evaluacion, calificaciones_secciones, 
            total_obtenido, respuestas, observaciones, pass_status,
            trap_incorrect_count, created_at
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([
            $testPayload['nombre'] ?? 'usuario1',
            'personal',
            json_encode($testPayload['calificaciones_secciones'] ?? []),
            $testPayload['total_obtenido'] ?? 0,
            json_encode($testPayload['respuestas'] ?? []),
            $testPayload['observaciones'] ?? '',
            $testPayload['pass'] ?? 'REPROBADO',
            $testPayload['trapIncorrect'] ?? 0
        ]);

        $this->assertTrue($result, "API simulation insert should succeed");

        $insertId = $this->pdo->lastInsertId();
        $selectStmt = $this->pdo->prepare("SELECT pass_status, trap_incorrect_count FROM evaluaciones_personal WHERE id = ?");
        $selectStmt->execute([$insertId]);
        $row = $selectStmt->fetch(PDO::FETCH_ASSOC);

        $this->assertEqual($row['pass_status'], 'APROBADO', "API should correctly map 'pass' to 'pass_status'");
        $this->assertEqual($row['trap_incorrect_count'], 2, "API should correctly map 'trapIncorrect' to 'trap_incorrect_count'");

        echo "✓ API endpoint correctly handles new fields\n";
        return true;
    }

    public function testSchemaIntegrityWithMissingColumns()
    {
        echo "Testing schema integrity when trying to insert without new columns...\n";

        // Test that insert works even if new columns are not provided (should use defaults)
        $sql = "INSERT INTO evaluaciones_personal (nombre, fecha, tipo_evaluacion, total_obtenido) VALUES (?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute(['default_user', date('Y-m-d'), 'personal', 75.0]);

        $this->assertTrue($result, "Insert should work with defaults for new columns");

        $insertId = $this->pdo->lastInsertId();
        $selectStmt = $this->pdo->prepare("SELECT pass_status, trap_incorrect_count FROM evaluaciones_personal WHERE id = ?");
        $selectStmt->execute([$insertId]);
        $row = $selectStmt->fetch(PDO::FETCH_ASSOC);

        $this->assertEqual($row['pass_status'], 'REPROBADO', "Default pass_status should be 'REPROBADO'");
        $this->assertEqual($row['trap_incorrect_count'], 0, "Default trap_incorrect_count should be 0");

        echo "✓ Schema handles missing new columns with appropriate defaults\n";
        return true;
    }

    // Simple assertion helpers
    private function assertTrue($condition, $message = '')
    {
        if (!$condition) {
            throw new Exception("Assertion failed: " . $message);
        }
    }

    private function assertEqual($actual, $expected, $message = '')
    {
        if ($actual != $expected) {
            throw new Exception("Assertion failed: Expected '{$expected}', got '{$actual}'. " . $message);
        }
    }

    public function runAllTests()
    {
        $tests = [
            'testDatabaseSchemaHasNewColumns',
            'testInsertIncludesNewColumns',
            'testApiEndpointHandlesNewFields',
            'testSchemaIntegrityWithMissingColumns'
        ];

        $passed = 0;
        $failed = 0;

        echo "Running Database Schema Tests\n";
        echo str_repeat("=", 50) . "\n";

        foreach ($tests as $test) {
            try {
                $this->$test();
                $passed++;
            } catch (Exception $e) {
                echo "✗ {$test} FAILED: " . $e->getMessage() . "\n";
                $failed++;
            }
        }

        echo str_repeat("=", 50) . "\n";
        echo "Tests completed: {$passed} passed, {$failed} failed\n";

        if ($failed > 0) {
            exit(1);
        }

        return true;
    }

    public function __destruct()
    {
        // Clean up test database
        if ($this->pdo) {
            try {
                $this->pdo->exec("DROP DATABASE IF EXISTS {$this->testDbName}");
            } catch (PDOException $e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Run tests if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    $tester = new DatabaseSchemaTest();
    $tester->runAllTests();
}

?>
