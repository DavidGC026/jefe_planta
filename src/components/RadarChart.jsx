import React from 'react';

const RadarChart = ({ data, width = 400, height = 400 }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 60;

  // Calcular puntos para los datos
  const calculatePoints = (values) => {
    const angleStep = (2 * Math.PI) / values.length;
    return values.map((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (value / 100) * radius;
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle)
      };
    });
  };

  // Calcular posiciones de las etiquetas
  const calculateLabelPoints = (count) => {
    const angleStep = (2 * Math.PI) / count;
    return Array.from({ length: count }, (_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelDistance = radius + 30;
      return {
        x: centerX + labelDistance * Math.cos(angle),
        y: centerY + labelDistance * Math.sin(angle),
        angle: angle
      };
    });
  };

  const values = data.map(item => item.value);
  const labels = data.map(item => item.label);
  const points = calculatePoints(values);
  const labelPoints = calculateLabelPoints(data.length);

  // Crear el path para el área del radar
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  // Crear círculos concéntricos para la cuadrícula
  const gridCircles = [20, 40, 60, 80, 100].map(percent => (
    <circle
      key={percent}
      cx={centerX}
      cy={centerY}
      r={(percent / 100) * radius}
      fill="none"
      stroke="#e5e7eb"
      strokeWidth="1"
    />
  ));

  // Crear líneas radiales
  const gridLines = labelPoints.map((point, index) => (
    <line
      key={index}
      x1={centerX}
      y1={centerY}
      x2={centerX + radius * Math.cos(point.angle)}
      y2={centerY + radius * Math.sin(point.angle)}
      stroke="#e5e7eb"
      strokeWidth="1"
    />
  ));

  return (
    <div className="radar-chart">
      <svg width={width} height={height} className="drop-shadow-sm">
        {/* Cuadrícula */}
        <g className="grid">
          {gridCircles}
          {gridLines}
        </g>

        {/* Etiquetas de porcentaje */}
        <g className="percentage-labels">
          {[20, 40, 60, 80, 100].map(percent => (
            <text
              key={percent}
              x={centerX + 5}
              y={centerY - (percent / 100) * radius}
              fontSize="10"
              fill="#6b7280"
              textAnchor="start"
              dominantBaseline="middle"
            >
              {percent}%
            </text>
          ))}
        </g>

        {/* Área del radar */}
        <path
          d={pathData}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgba(59, 130, 246, 0.6)"
          strokeWidth="2"
        />

        {/* Puntos de datos */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {/* Etiquetas */}
        {labelPoints.map((point, index) => {
          const label = labels[index];
          const value = values[index];
          
          // Determinar la posición del texto basado en el ángulo
          let textAnchor = 'middle';
          let dominantBaseline = 'middle';
          
          if (point.angle > -Math.PI/2 && point.angle < Math.PI/2) {
            textAnchor = 'start';
          } else if (point.angle > Math.PI/2 || point.angle < -Math.PI/2) {
            textAnchor = 'end';
          }
          
          if (point.angle > 0) {
            dominantBaseline = 'hanging';
          } else if (point.angle < 0) {
            dominantBaseline = 'auto';
          }

          return (
            <g key={index}>
              <text
                x={point.x}
                y={point.y}
                fontSize="11"
                fontWeight="600"
                fill="#374151"
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
              >
                {label.length > 20 ? label.substring(0, 20) + '...' : label}
              </text>
              <text
                x={point.x}
                y={point.y + 12}
                fontSize="10"
                fill="#6b7280"
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
              >
                {value.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Título del centro */}
        <text
          x={centerX}
          y={centerY}
          fontSize="12"
          fontWeight="bold"
          fill="#1f2937"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Evaluación
        </text>
      </svg>
    </div>
  );
};

export default RadarChart;
