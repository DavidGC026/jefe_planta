# Sistema de Evaluación de Personal - Jefe de Planta

## Descripción
Este es un sistema simplificado de evaluación de personal específicamente diseñado para evaluar las competencias de un Jefe de Planta. El sistema no requiere autenticación y está diseñado para ser embebido o usar de forma independiente.

## Características
- ✅ **Sin login**: Sistema directo sin autenticación
- ✅ **Evaluación específica**: Únicamente evaluación de personal para Jefe de Planta
- ✅ **Base de datos local**: Almacena resultados en localStorage (simulando base de datos "resultados")
- ✅ **Interfaz intuitiva**: Basada en las pantallas originales EvaluationScreenPersonal.jsx y ResultsScreen.jsx
- ✅ **Responsive**: Diseñado para funcionar en diferentes dispositivos

## Estructura del Proyecto
```
jefedeplanta/
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes UI reutilizables
│   │   ├── EvaluationScreenPersonal.jsx
│   │   └── ResultsScreen.jsx
│   ├── services/
│   │   └── database.js       # Servicio de base de datos local
│   ├── lib/
│   │   └── utils.js         # Utilidades
│   ├── App.jsx
│   ├── main.jsx
│   └── App.css
├── public/
│   ├── Concreton.png        # Mascota
│   └── Fondo.png           # Imagen de fondo
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Base de Datos de Resultados

El sistema guarda los resultados en una base de datos llamada "resultados" (simulada con localStorage) que incluye:

- **id**: ID único del resultado
- **nombre**: Nombre del evaluado (por defecto "usuario1")
- **fecha**: Fecha de la evaluación
- **tipo_evaluacion**: Siempre "personal"
- **calificaciones_secciones**: Objeto con las calificaciones por sección
- **total_obtenido**: Puntuación total obtenida
- **respuestas**: Todas las respuestas dadas
- **observaciones**: Comentarios adicionales

## Secciones de Evaluación

El sistema evalúa 10 secciones principales con ponderaciones específicas:

1. **Conocimiento técnico y operativo** (15%)
2. **Gestión de la producción** (20%)
3. **Mantenimiento del equipo** (10%)
4. **Gestión del personal** (10%)
5. **Seguridad y cumplimiento normativo** (10%)
6. **Control de calidad** (10%)
7. **Documentación y control administrativo** (5%)
8. **Mejora continua y enfoque a resultados** (7.5%)
9. **Coordinación con logística y clientes** (5%)
10. **Resolución de problemas** (7.5%)

**Total**: 100%

## Instalación

1. **Instalar dependencias**:
```bash
cd jefedeplanta
npm install
```

2. **Ejecutar en desarrollo**:
```bash
npm run dev
```

3. **Construir para producción**:
```bash
npm run build
```

4. **Previsualizar build**:
```bash
npm run preview
```

## Uso

1. **Iniciar evaluación**: La aplicación carga directamente en la pantalla de evaluación
2. **Ingresar nombre**: Campo para el nombre del evaluado (por defecto "usuario1")
3. **Responder preguntas**: Navegar por las secciones respondiendo Sí/No/No Aplica
4. **Ver resultados**: Al completar se muestran los resultados y se guardan en la base de datos
5. **Descargar datos**: Opción para descargar todos los resultados en formato JSON

## API de Base de Datos

El servicio `databaseService` proporciona:

```javascript
// Guardar resultado
databaseService.saveResult(evaluationData)

// Obtener todos los resultados
databaseService.getResults()

// Obtener resultado por ID
databaseService.getResultById(id)

// Exportar todos los datos
databaseService.exportData()

// Limpiar base de datos
databaseService.clearDB()
```

## Tecnologías Utilizadas

- **React 18**: Framework de interfaz de usuario
- **Vite**: Herramienta de build y desarrollo
- **Tailwind CSS**: Framework de estilos
- **Framer Motion**: Animaciones
- **Lucide React**: Iconos
- **Radix UI**: Componentes base accesibles

## Notas de Desarrollo

- El sistema usa localStorage para simular una base de datos real
- Los datos se mantienen hasta que se limpie el navegador
- En producción se puede conectar a MySQL/PostgreSQL/etc. modificando el archivo `services/database.js`
- La aplicación es completamente cliente-side y puede ser deployada como SPA

## Personalización

Para cambiar las preguntas o secciones, modificar el archivo `src/components/EvaluationScreenPersonal.jsx` en la función `loadEvaluationData()`.

## Embebido

Para embeber en otro sistema, el componente principal puede ser importado directamente:

```javascript
import EvaluationApp from './path/to/jefedeplanta/src/App.jsx'

// Usar en tu aplicación
<EvaluationApp />
```
