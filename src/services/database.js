// Servicio de base de datos - Conexión con API MySQL
import { MAX_TRAP_ERRORS, APPROVAL_MIN, APPROVAL_MAX } from '@/config/evaluation';

class DatabaseService {
  constructor() {
    this.apiBaseUrl = '/jefedeplanta/api';
  }

  // Obtener todos los resultados desde la API
  async getResults() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/save-result.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Error al obtener resultados');
      }
    } catch (error) {
      console.error('Error al obtener resultados:', error);
      return [];
    }
  }

  // Guardar nuevo resultado en la base de datos MySQL
  async saveResult(evaluationData) {
    try {
      // Prepare data with new metadata fields
      const dataToSend = {
        ...evaluationData,
        pass: evaluationData.pass,
        trapIncorrect: evaluationData.trapIncorrect,
        trapQuestions: evaluationData.trapQuestions
      };

      const response = await fetch(`${this.apiBaseUrl}/save-result.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('Resultado guardado en base de datos MySQL:', result);
        return {
          id: result.id,
          nombre: evaluationData.nombre || 'usuario1',
          fecha: new Date().toISOString(),
          fecha_formateada: new Date().toLocaleDateString('es-MX'),
          hora: new Date().toLocaleTimeString('es-MX'),
          tipo_evaluacion: 'personal',
          calificaciones_secciones: evaluationData.calificaciones_secciones || {},
          total_obtenido: evaluationData.total_obtenido || 0,
          respuestas: evaluationData.respuestas || {},
          observaciones: evaluationData.observaciones || '',
          pass: evaluationData.pass,
          trapIncorrect: evaluationData.trapIncorrect,
          trapQuestions: evaluationData.trapQuestions,
          created_at: new Date().toISOString()
        };
      } else {
        throw new Error(result.error || 'Error al guardar en la base de datos');
      }
    } catch (error) {
      console.error('Error al guardar resultado:', error);
      throw new Error('No se pudo guardar el resultado en la base de datos: ' + error.message);
    }
  }

  // Obtener resultado por ID
  async getResultById(id) {
    try {
      const results = await this.getResults();
      return results.find(result => result.id === parseInt(id));
    } catch (error) {
      console.error('Error al obtener resultado:', error);
      return null;
    }
  }

  // Exportar datos como JSON
  async exportData() {
    return await this.getResults();
  }

  // Verificar respuesta correcta
  checkAnswer(question, selectedAnswer) {
    // Para preguntas de selección múltiple, verificar contra respuesta_correcta de la BD
    if (question.tipo === 'seleccion_multiple' && question.respuesta_correcta) {
      return selectedAnswer === question.respuesta_correcta;
    }

    // Para preguntas abiertas (sí/no), "sí" es generalmente la respuesta correcta
    // a menos que sea una pregunta trampa
    if (question.tipo === 'abierta' || !question.opciones) {
      // Si es pregunta trampa, la lógica puede ser diferente
      if (question.es_trampa) {
        // Para preguntas trampa, "no" podría ser la respuesta correcta
        return selectedAnswer === 'no';
      }
      return selectedAnswer === 'si';
    }

    return false;
  }

  // Validar errores en preguntas trampa
  validateTrapQuestions(sections, answers) {
    let trapErrors = 0;

    sections.forEach((seccion, sectionIndex) => {
      seccion.preguntas.forEach((question, qIndex) => {
        const key = `jefe_planta-${sectionIndex}-${qIndex}`;
        const selectedAnswer = answers[key];

        // Si es pregunta trampa y la respuesta es incorrecta
        if (question.es_trampa && selectedAnswer) {
          const isCorrect = this.checkAnswer(question, selectedAnswer);
          if (!isCorrect) {
            trapErrors++;
          }
        }
      });
    });

    return {
      trapErrors,
      exceedsMaxErrors: trapErrors > MAX_TRAP_ERRORS,
      maxAllowed: MAX_TRAP_ERRORS
    };
  }

  // Calcular puntuación considerando respuestas correctas
  calculateScore(sections, answers) {
    let totalScore = 0;
    let totalNormalQuestions = 0;
    let correctNormalAnswers = 0;
    let trapQuestions = 0;
    let trapIncorrect = 0;
    const calificacionesSecciones = {};

    sections.forEach((seccion, sectionIndex) => {
      let seccionScore = 0;
      let seccionQuestions = 0;
      let seccionCorrect = 0;

      seccion.preguntas.forEach((question, qIndex) => {
        const key = `jefe_planta-${sectionIndex}-${qIndex}`;
        const selectedAnswer = answers[key];

        if (selectedAnswer) {
          // If question is trap, increment trapQuestions and check if answered incorrectly
          if (question.es_trampa) {
            trapQuestions++;
            const isCorrect = this.checkAnswer(question, selectedAnswer);
            if (!isCorrect) {
              trapIncorrect++;
            }
          } else {
            // Only count normal questions (not trap) for scoring
            seccionQuestions++;
            totalNormalQuestions++;

            // Verificar si la respuesta es correcta
            const isCorrect = this.checkAnswer(question, selectedAnswer);

            if (isCorrect) {
              seccionScore += 10;
              seccionCorrect++;
              correctNormalAnswers++;
            }
          }
        }
      });

      const seccionPercentage = seccionQuestions > 0 ? (seccionCorrect / seccionQuestions) * 100 : 0;
      calificacionesSecciones[seccion.nombre || seccion.name] = {
        porcentaje: seccionPercentage,
        ponderacion: seccion.ponderacion,
        contribucion: (seccionPercentage * seccion.ponderacion) / 100
      };

      totalScore += (seccionPercentage * seccion.ponderacion) / 100;
    });

    // Round total score
    totalScore = Math.round(totalScore);

    // Evaluate pass/fail after computing totalScore
    const pass =
      totalScore >= APPROVAL_MIN &&
      totalScore <= APPROVAL_MAX &&
      trapIncorrect <= MAX_TRAP_ERRORS;

    return {
      totalScore,
      totalNormalQuestions,
      correctNormalAnswers,
      trapQuestions,
      trapIncorrect,
      pass,
      calificacionesSecciones
    };
  }
}

// Instancia singleton
const databaseService = new DatabaseService();

export default databaseService;
