# 🚀 Deploy de Jefe de Planta

Script de deploy automatizado para el sistema de evaluación de personal específico para Jefe de Planta.

## 📋 Prerrequisitos

- ✅ **Apache2** instalado y funcionando
- ✅ **PHP** con extensión MySQL/PDO
- ✅ **MySQL/MariaDB** con base de datos `plantas_concreto2` existente
- ✅ **Node.js** y **npm** para construir el frontend
- ✅ **Permisos sudo** para configurar Apache

## 🎯 Características del Deploy

### 🗄️ **Base de Datos**
- **Base**: `plantas_concreto2` (existente)
- **Tabla**: `evaluaciones_personal_jefe` (se crea automáticamente)
- **Campos guardados**:
  - `nombre` (por defecto: "usuario1")
  - `fecha` y `hora` de evaluación
  - `calificaciones_secciones` (JSON con puntuaciones)
  - `total_obtenido` (calificación final)
  - `respuestas` (JSON con todas las respuestas)
  - `observaciones` (comentarios adicionales)

### 🌐 **Web Deploy**
- **URL**: `http://localhost/jefedeplanta/`
- **Frontend**: Single Page Application (SPA)
- **API**: Endpoints PHP para guardar/consultar resultados
- **Imágenes**: Configuradas para rutas correctas

### 📡 **API Endpoints**
- `POST /api/save-result.php` - Guardar resultado de evaluación
- `GET /api/save-result.php` - Obtener últimos 100 resultados
- `GET /api/test.php` - Probar conexión y estado del sistema

## 🚀 Instrucciones de Deploy

### 1. **Preparar el Entorno**
```bash
cd /home/david/Documentos/Plantas/jefedeplanta
```

### 2. **Ejecutar Deploy**
```bash
./deploy/simple-deploy-existing-db.sh
```

### 3. **Seguir las Instrucciones**
- Ingresar usuario de MySQL existente
- Ingresar contraseña del usuario
- El script verificará automáticamente la conexión

## 📊 **Lo que hace el Script**

### ✅ **Verificaciones**
1. Verifica conexión a MySQL con `plantas_concreto2`
2. Crea tabla `evaluaciones_personal_jefe` si no existe
3. Verifica que Apache esté funcionando
4. Habilita mod_rewrite si es necesario

### 🔨 **Construcción**
1. Instala dependencias (`npm install`)
2. Construye el frontend (`npm run build`)
3. Ajusta rutas de imágenes en CSS/JS
4. Configura rutas relativas

### 📂 **Despliegue**
1. Copia archivos a `/var/www/html/jefedeplanta/`
2. Crea APIs PHP con credenciales de BD
3. Configura `.htaccess` para SPA y API
4. Establece permisos correctos

### 🧪 **Verificaciones Finales**
1. Prueba conexión PHP-MySQL
2. Verifica existencia de tabla
3. Muestra información de acceso

## 🌐 **Acceso Post-Deploy**

### **Frontend**
```
http://localhost/jefedeplanta/
```

### **API Test**
```bash
curl http://localhost/jefedeplanta/api/test.php
```

### **Ver Resultados**
```bash
curl http://localhost/jefedeplanta/api/save-result.php
```

## 🗂️ **Estructura Desplegada**

```
/var/www/html/jefedeplanta/
├── index.html              # SPA principal
├── assets/                 # CSS, JS compilados
├── public/                 # Imágenes (Fondo.png, Concreton.png)
├── api/
│   ├── save-result.php     # API principal
│   ├── test.php           # API de prueba
│   └── .htaccess          # Configuración API
└── .htaccess              # Configuración SPA
```

## 🔧 **Base de Datos Configurada**

### **Tabla: `evaluaciones_personal_jefe`**
```sql
CREATE TABLE evaluaciones_personal_jefe (
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
```

### **Índices**
- `idx_fecha_jefe` en `fecha`
- `idx_tipo_evaluacion_jefe` en `tipo_evaluacion`
- `idx_total_obtenido_jefe` en `total_obtenido`

## 📱 **Funcionalidades del Sistema**

### ✅ **Características**
- **Sin login**: Acceso directo sin autenticación
- **Evaluación específica**: Solo Jefe de Planta
- **10 secciones**: Con ponderaciones definidas
- **Guardado automático**: En base de datos real
- **Exportación JSON**: Descarga de todos los resultados
- **Responsive**: Funciona en móviles y desktop

### 🎯 **Secciones de Evaluación**
1. Conocimiento técnico y operativo (15%)
2. Gestión de la producción (20%)
3. Mantenimiento del equipo (10%)
4. Gestión del personal (10%)
5. Seguridad y cumplimiento normativo (10%)
6. Control de calidad (10%)
7. Documentación y control administrativo (5%)
8. Mejora continua y enfoque a resultados (7.5%)
9. Coordinación con logística y clientes (5%)
10. Resolución de problemas (7.5%)

## 🐛 **Solución de Problemas**

### **Error de Conexión MySQL**
```bash
# Verificar servicio MySQL
sudo systemctl status mysql

# Verificar permisos de usuario
mysql -u [usuario] -p -e "SHOW GRANTS;"
```

### **Error de Apache**
```bash
# Verificar servicio Apache
sudo systemctl status apache2

# Verificar mod_rewrite
apache2ctl -M | grep rewrite
```

### **Error de Permisos**
```bash
# Reconfigurar permisos
sudo chown -R www-data:www-data /var/www/html/jefedeplanta/
sudo chmod -R 755 /var/www/html/jefedeplanta/
```

## 📞 **Soporte**

Para problemas específicos:
1. Revisar logs de Apache: `/var/log/apache2/error.log`
2. Verificar logs de MySQL: `/var/log/mysql/error.log`
3. Probar API directamente: `curl -X POST http://localhost/jefedeplanta/api/test.php`
