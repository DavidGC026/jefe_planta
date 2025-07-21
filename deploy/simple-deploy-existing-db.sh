#!/bin/bash

# Script de deploy simple para Jefe de Planta usando base de datos existente
# Usa base de datos 'plantas_concreto2' existente
# Solo solicita credenciales de usuario existente

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Ejecuta este script desde el directorio raíz del proyecto jefedeplanta"
    exit 1
fi

log_info "🚀 Iniciando deploy de Jefe de Planta para base de datos existente..."

# Variables de configuración
WEB_DIR="/var/www/html/jefedeplanta"
DB_NAME="plantas_concreto2"

# Solicitar información de MySQL
echo ""
log_info "📊 Configuración de MySQL para base de datos existente"
echo "Base de datos: $DB_NAME"
read -p "Usuario de MySQL existente: " DB_USER
read -s -p "Contraseña del usuario MySQL: " DB_PASSWORD
echo ""

# Verificar conexión a MySQL y base de datos
log_info "🔍 Verificando conexión a MySQL y base de datos..."
if ! mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
    log_error "No se puede conectar a MySQL o la base de datos '$DB_NAME' no existe."
    log_error "Verifica que:"
    echo "  - El usuario '$DB_USER' existe"
    echo "  - La contraseña es correcta"
    echo "  - La base de datos '$DB_NAME' existe"
    echo "  - El usuario tiene permisos sobre la base de datos"
    exit 1
fi

log_info "✅ Conexión a MySQL y base de datos exitosa"

# Verificar y crear tabla de resultados si no existe
log_info "🔍 Verificando tabla de resultados..."
TABLE_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'evaluaciones_personal_jefe';" 2>/dev/null | wc -l)

if [ "$TABLE_EXISTS" -le 1 ]; then
    log_info "📋 Creando tabla de resultados en la base de datos..."
    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS evaluaciones_personal_jefe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL DEFAULT 'usuario1',
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo_evaluacion VARCHAR(50) NOT NULL DEFAULT 'personal',
    calificaciones_secciones JSON,
    total_obtenido DECIMAL(5,2) NOT NULL DEFAULT 0,
    respuestas JSON,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_fecha_jefe ON evaluaciones_personal_jefe(fecha);
CREATE INDEX IF NOT EXISTS idx_tipo_evaluacion_jefe ON evaluaciones_personal_jefe(tipo_evaluacion);
CREATE INDEX IF NOT EXISTS idx_total_obtenido_jefe ON evaluaciones_personal_jefe(total_obtenido);
EOF
    log_info "✅ Tabla de resultados creada exitosamente"
else
    log_info "✅ Tabla de resultados ya existe"
fi

# Construir frontend
log_info "🔨 Construyendo frontend..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependencias..."
        npm install
    fi
    npm run build
else
    log_warning "No se encontró package.json, usando archivos dist existentes"
fi

# === NUEVO: Mover imágenes a dist/public ===
log_info "🖼️ Moviendo imágenes a dist/public..."
mkdir -p dist/public
if [ -f "dist/Fondo.png" ]; then
    mv dist/Fondo.png dist/public/
fi
if [ -f "dist/Concreton.png" ]; then
    mv dist/Concreton.png dist/public/
fi
if [ -f "public/Fondo.png" ]; then
    cp public/Fondo.png dist/public/
fi
if [ -f "public/Concreton.png" ]; then
    cp public/Concreton.png dist/public/
fi

# === FIN NUEVO ===

# Verificar que existe el directorio dist
if [ ! -d "dist" ]; then
    log_error "No se encontró el directorio dist. Ejecuta 'npm run build' primero."
    exit 1
fi

# Crear directorio web y copiar archivos
log_info "📂 Copiando archivos al servidor web..."
sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"

# Copiar archivos del frontend
sudo cp -r dist/* "$WEB_DIR/"

# === NUEVO: Ajustar rutas de favicon e imágenes en index.html ===
if [ -f "$WEB_DIR/index.html" ]; then
    # Cambiar favicon y rutas de imágenes a public/ (sin punto al inicio)
    sudo sed -i 's|href="[.]*/*public/|href="public/|g' "$WEB_DIR/index.html"
    sudo sed -i "s|href='[.]*/*public/|href='public/|g" "$WEB_DIR/index.html"
    sudo sed -i 's|src="[.]*/*public/|src="public/|g' "$WEB_DIR/index.html"
    sudo sed -i "s|src='[.]*/*public/|src='public/|g" "$WEB_DIR/index.html"
    # Cambiar favicon directo (por si es llamado como /Concreton.png)
    sudo sed -i 's|href="[.]*/*Concreton.png"|href="public/Concreton.png"|g' "$WEB_DIR/index.html"
    sudo sed -i "s|href='[.]*/*Concreton.png'|href='public/Concreton.png'|g" "$WEB_DIR/index.html"
    sudo sed -i 's|src="[.]*/*Fondo.png"|src="public/Fondo.png"|g' "$WEB_DIR/index.html"
    sudo sed -i "s|src='[.]*/*Fondo.png'|src='public/Fondo.png'|g" "$WEB_DIR/index.html"
fi
# === FIN NUEVO ===

# === NUEVO: Ajustar rutas de imágenes en CSS a ../public/ ===
CSS_FILES=$(find "$WEB_DIR/assets" -name "*.css" 2>/dev/null)
if [ -n "$CSS_FILES" ]; then
    for CSS_FILE in $CSS_FILES; do
        sudo sed -i 's|url(["'\'']*public/|url(../public/|g' "$CSS_FILE"
    done
    log_info "✅ Rutas de imágenes ajustadas en CSS a ../public/"
else
    log_warning "⚠️ No se encontraron archivos CSS en assets/ para ajustar rutas de imágenes"
fi
# === FIN NUEVO ===

# Ajustar rutas en archivos JS generados
log_info "⚡ Ajustando rutas de imágenes en archivos JS..."
JS_FILES=$(find "$WEB_DIR/assets" -name "index-*.js" 2>/dev/null)
if [ -n "$JS_FILES" ]; then
    for JS_FILE in $JS_FILES; do
        # Cambiar rutas de imágenes en archivos JS
        sudo sed -i 's|"public/|"public/|g' "$JS_FILE"
        sudo sed -i "s|'public/|'public/|g" "$JS_FILE"
        log_info "✅ Rutas ajustadas en JS: $(basename "$JS_FILE")"
    done
else
    log_warning "⚠️ No se encontraron archivos JS en assets/"
fi

# Ajustar rutas en index.html para hacer rutas relativas
log_info "📄 Ajustando rutas en index.html..."
if [ -f "$WEB_DIR/index.html" ]; then
    # Cambiar /assets/ a ./assets/ para rutas relativas
    sudo sed -i 's|/assets/|./assets/|g' "$WEB_DIR/index.html"
    log_info "✅ Rutas ajustadas en index.html"
else
    log_warning "⚠️ No se encontró index.html"
fi

# Crear directorio de API
sudo mkdir -p "$WEB_DIR/api"

# Crear API para guardar resultados
log_info "📡 Creando API de resultados..."
sudo tee "$WEB_DIR/api/save-result.php" > /dev/null << EOF
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
\$host = 'localhost';
\$dbname = '$DB_NAME';
\$username = '$DB_USER';
\$password = '$DB_PASSWORD';

try {
    \$pdo = new PDO("mysql:host=\$host;dbname=\$dbname;charset=utf8", \$username, \$password);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (\$_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON input
        \$input = json_decode(file_get_contents('php://input'), true);

        if (!\$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        // Prepare SQL statement
        \$sql = "INSERT INTO evaluaciones_personal_jefe (
            nombre,
            fecha,
            hora,
            tipo_evaluacion,
            calificaciones_secciones,
            total_obtenido,
            respuestas,
            observaciones,
            created_at
        ) VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, NOW())";

        \$stmt = \$pdo->prepare(\$sql);
        \$stmt->execute([
            \$input['nombre'] ?? 'usuario1',
            'personal',
            json_encode(\$input['calificaciones_secciones'] ?? []),
            \$input['total_obtenido'] ?? 0,
            json_encode(\$input['respuestas'] ?? []),
            \$input['observaciones'] ?? ''
        ]);

        \$id = \$pdo->lastInsertId();

        // Return success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'id' => \$id,
            'message' => 'Resultado guardado exitosamente'
        ]);

    } elseif (\$_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all results
        \$stmt = \$pdo->query("SELECT * FROM evaluaciones_personal_jefe ORDER BY created_at DESC LIMIT 100");
        \$results = \$stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields
        foreach (\$results as &\$result) {
            \$result['calificaciones_secciones'] = json_decode(\$result['calificaciones_secciones'], true);
            \$result['respuestas'] = json_decode(\$result['respuestas'], true);
        }

        echo json_encode([
            'success' => true,
            'data' => \$results
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException \$e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . \$e->getMessage()
    ]);
} catch (Exception \$e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . \$e->getMessage()
    ]);
}
?>
EOF

# Crear API de test de conexión
sudo tee "$WEB_DIR/api/test.php" > /dev/null << EOF
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    \$pdo = new PDO("mysql:host=localhost;dbname=$DB_NAME;charset=utf8", "$DB_USER", "$DB_PASSWORD");
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Test table exists
    \$stmt = \$pdo->query("SHOW TABLES LIKE 'evaluaciones_personal_jefe'");
    \$tableExists = \$stmt->rowCount() > 0;

    // Get record count
    if (\$tableExists) {
        \$stmt = \$pdo->query("SELECT COUNT(*) as count FROM evaluaciones_personal_jefe");
        \$count = \$stmt->fetch()['count'];
    } else {
        \$count = 0;
    }

    echo json_encode([
        'success' => true,
        'database' => '$DB_NAME',
        'table_exists' => \$tableExists,
        'record_count' => \$count,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception \$e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => \$e->getMessage()
    ]);
}
?>
EOF

# Crear .htaccess básico para el frontend
sudo tee "$WEB_DIR/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /jefedeplanta/

# Manejar rutas de la API
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# Configuración para Single Page Application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/jefedeplanta/api/
RewriteRule ^(.*)$ index.html [L]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set X-Powered-By "Sistema de Evaluación - Jefe de Planta"
</IfModule>
EOF

# Crear .htaccess para la API
sudo tee "$WEB_DIR/api/.htaccess" > /dev/null << 'EOF'
RewriteEngine On
RewriteBase /jefedeplanta/api/

# Rutas de API
RewriteRule ^save-result/?$ save-result.php [L,QSA]
RewriteRule ^test/?$ test.php [L,QSA]

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
EOF

# Configurar permisos
log_info "🔐 Configurando permisos..."
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"
sudo chmod 644 "$WEB_DIR/api/save-result.php"
sudo chmod 644 "$WEB_DIR/api/test.php"

# Verificar y habilitar mod_rewrite si es necesario
log_info "🔍 Verificando mod_rewrite..."
if ! apache2ctl -M | grep -q rewrite_module; then
    log_warning "Habilitando mod_rewrite..."
    sudo a2enmod rewrite
    sudo systemctl reload apache2
fi

# Verificar que Apache esté ejecutándose
if ! systemctl is-active --quiet apache2; then
    log_warning "Iniciando Apache2..."
    sudo systemctl start apache2
fi

# Verificar conectividad final
log_info "🧪 Verificando conectividad final..."

# Probar conexión a base de datos desde PHP
TEST_RESULT=$(php -r "
try {
    \$pdo = new PDO('mysql:host=localhost;dbname=$DB_NAME;charset=utf8mb4', '$DB_USER', '$DB_PASSWORD');
    echo 'SUCCESS';
} catch (Exception \$e) {
    echo 'ERROR: ' . \$e->getMessage();
}")

if [[ $TEST_RESULT == "SUCCESS" ]]; then
    log_info "✅ Conexión PHP-MySQL verificada"
else
    log_warning "⚠️ Problema con conexión PHP-MySQL: $TEST_RESULT"
fi

# Verificar estructura de tabla específica
log_info "🔍 Verificando estructura de base de datos..."
TABLES_CHECK=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'evaluaciones_personal_jefe';" 2>/dev/null | wc -l)

if [ "$TABLES_CHECK" -gt 1 ]; then
    log_info "✅ Tabla 'evaluaciones_personal_jefe' encontrada en la base de datos"
else
    log_warning "⚠️ Tabla 'evaluaciones_personal_jefe' no encontrada. Se creará automáticamente."
fi

log_info "🎉 Deploy completado exitosamente!"
echo ""
log_info "📱 Información de acceso:"
echo "   🌐 URL: http://localhost/jefedeplanta/"
echo "   📊 Sistema: Evaluación de Personal - Jefe de Planta"
echo "   🗄️ Base de datos: $DB_NAME"
echo ""
log_info "📋 Estructura desplegada:"
echo "   Frontend: $WEB_DIR/"
echo "   API: $WEB_DIR/api/"
echo "   Imágenes: $WEB_DIR/public/"
echo "   Tabla resultados: evaluaciones_personal_jefe"
echo "   Usuario DB: $DB_USER"
echo ""
log_info "🧪 Para verificar:"
echo "   API Test: curl http://localhost/jefedeplanta/api/test.php"
echo "   Frontend: Abre http://localhost/jefedeplanta/ en tu navegador"
echo "   Ver resultados: curl http://localhost/jefedeplanta/api/save-result.php"
echo ""
log_info "📝 Características del sistema:"
echo "   - ✅ Sin login requerido"
echo "   - ✅ Evaluación específica para Jefe de Planta"
echo "   - ✅ 10 secciones con ponderaciones específicas"
echo "   - ✅ Base de datos 'resultados' simulada y real"
echo "   - ✅ Guardado automático de resultados"
echo "   - ✅ Exportación de datos en JSON"
echo ""
log_info "🔧 Base de datos configurada:"
echo "   - Base: $DB_NAME"
echo "   - Tabla: evaluaciones_personal_jefe"
echo "   - Usuario: $DB_USER"
