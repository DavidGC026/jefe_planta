-- Table structure for storing user information
-- This table is needed for the email-based user lookup functionality

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `telefono` varchar(20) DEFAULT NULL,
  `puesto` varchar(100) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO `usuarios` (`nombre`, `email`, `telefono`, `puesto`, `departamento`, `fecha_ingreso`) VALUES
('Juan Pérez López', 'juan@plantaconcreto.com', '555-0101', 'Jefe de Planta', 'Producción', '2023-01-15'),
('María García Rodríguez', 'maria@plantaconcreto.com', '555-0102', 'Supervisor de Calidad', 'Calidad', '2023-02-10'),
('Carlos Hernández Silva', 'carlos@plantaconcreto.com', '555-0103', 'Operador de Planta', 'Producción', '2023-03-05'),
('Ana Martínez Torres', 'ana@plantaconcreto.com', '555-0104', 'Técnico de Laboratorio', 'Calidad', '2023-04-12'),
('Luis Ramírez Gómez', 'luis@plantaconcreto.com', '555-0105', 'Supervisor de Producción', 'Producción', '2023-05-20');
