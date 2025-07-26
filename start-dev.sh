#!/bin/bash

# Script para inicializar el entorno de desarrollo
# Uso: ./start-dev.sh

echo "🚀 Iniciando entorno de desarrollo para Jefe de Planta..."

# Verificar si PHP está instalado
if ! command -v php &> /dev/null; then
    echo "❌ Error: PHP no está instalado"
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ Verificaciones completadas"

# Iniciar servidor PHP en background
echo "🐘 Iniciando servidor PHP en puerto 8080..."
php -S localhost:8080 -t . > php_server.log 2>&1 &
PHP_PID=$!
echo "PHP Server PID: $PHP_PID"

# Esperar un momento para que el servidor PHP se inicie
sleep 2

# Verificar que el servidor PHP esté funcionando
if curl -s http://localhost:8080/api/save-result.php > /dev/null; then
    echo "✅ Servidor PHP funcionando correctamente"
else
    echo "❌ Error: No se pudo conectar al servidor PHP"
    kill $PHP_PID 2>/dev/null
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
fi

echo "⚛️  Iniciando servidor de desarrollo React..."
echo ""
echo "🌐 URLs disponibles:"
echo "   - React App: http://localhost:5173"
echo "   - PHP APIs: http://localhost:8080/api/"
echo ""
echo "📝 Para detener los servidores:"
echo "   - Presiona Ctrl+C para detener React"
echo "   - El servidor PHP se detendrá automáticamente"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $PHP_PID 2>/dev/null
    echo "✅ Servidores detenidos"
    exit 0
}

# Capturar señales de salida
trap cleanup SIGINT SIGTERM

# Iniciar servidor de desarrollo de React
npm run dev

# Si llegamos aquí, significa que el servidor de React se detuvo
cleanup
