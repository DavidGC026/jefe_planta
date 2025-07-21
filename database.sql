-- Crear base de datos
CREATE DATABASE IF NOT EXISTS resultados CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE resultados;

-- Crear tabla para almacenar evaluaciones de personal
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
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_fecha ON evaluaciones_personal(fecha);
CREATE INDEX idx_tipo_evaluacion ON evaluaciones_personal(tipo_evaluacion);
CREATE INDEX idx_total_obtenido ON evaluaciones_personal(total_obtenido);

-- Ejemplo de inserción de datos de prueba (opcional)
-- INSERT INTO evaluaciones_personal (
--     nombre, 
--     fecha, 
--     tipo_evaluacion, 
--     calificaciones_secciones, 
--     total_obtenido, 
--     respuestas, 
--     observaciones
-- ) VALUES (
--     'usuario1',
--     CURDATE(),
--     'personal',
--     '{"Conocimiento técnico y operativo": {"porcentaje": 85, "ponderacion": 15, "contribucion": 12.75}}',
--     75.50,
--     '{"jefe_planta-0-0": "si", "jefe_planta-0-1": "no"}',
--     'Evaluación de prueba completada exitosamente'
-- );
