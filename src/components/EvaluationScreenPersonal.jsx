import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, UserCheck, Zap, Loader2, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import databaseService from '@/services/database';

const EvaluationScreenPersonal = ({ onComplete, onSkipToResults, username }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedRole, setSelectedRole] = useState('jefe_planta');
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [userName, setUserName] = useState(username || 'usuario1');

  // Ref para scroll al inicio
  const evaluationContentRef = useRef(null);

  useEffect(() => {
    if (!evaluationStarted) {
      loadEvaluationData();
    }
  }, []);

  // Scroll al inicio cuando cambia la sección
  useEffect(() => {
    if (evaluationContentRef.current) {
      evaluationContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentSection]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      
      // Obtener preguntas reales de la API
      const response = await fetch('/jefedeplanta/api/get-questions.php?tipo=personal&rol=jefe_planta');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // The API returns {success: true, data: [sections]}
      const sections = data.data || [];
      
      // Transform the API data to match frontend expectations
      const transformedSections = sections.map(section => ({
        ...section,
        nombre: section.name, // API returns 'name', frontend expects 'nombre'
        ponderacion: section.ponderacion || 10 // Ensure ponderacion exists
      }));
      
      setEvaluationData({ secciones: transformedSections });
      setEvaluationStarted(true);
    } catch (error) {
      console.error('Error loading evaluation data:', error);
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar las preguntas de evaluación: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToResults = () => {
    try {
      const simulatedResults = generateSimulatedEvaluation();

      toast({
        title: "🎯 Evaluación Simulada",
        description: "Se ha generado una evaluación con respuestas aleatorias para demostración"
      });

      onComplete(simulatedResults);
    } catch (error) {
      console.error('Error generating simulated evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar la evaluación simulada"
      });
    }
  };

  const generateSimulatedEvaluation = () => {
    const simulatedAnswers = {};
    const simulatedSections = [];
    let totalQuestions = 0;
    let correctAnswers = 0;

    evaluationData.secciones.forEach((section, sectionIndex) => {
      section.preguntas.forEach((question, qIndex) => {
        const questionId = `${selectedRole}-${sectionIndex}-${qIndex}`;
        
        // Generar respuesta aleatoria con tendencia hacia respuestas positivas
        const randomValue = Math.random();
        let answer;

        if (randomValue < 0.7) { // 70% probabilidad de respuesta correcta
          answer = 'si';
          correctAnswers++;
        } else if (randomValue < 0.9) { // 20% probabilidad de respuesta incorrecta
          answer = 'no';
        } else { // 10% probabilidad de N/A
          answer = 'na';
        }

        simulatedAnswers[questionId] = answer;
        totalQuestions++;
      });

      simulatedSections.push({
        ...section,
        preguntas: section.preguntas
      });
    });

    // Calcular puntuación simulada
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      answers: simulatedAnswers,
      score: finalScore,
      totalAnswers: totalQuestions,
      correctAnswers: correctAnswers,
      evaluationTitle: `Evaluación de Personal - Jefe de Planta`,
      sections: simulatedSections,
      isPersonalEvaluation: true,
      isSimulated: true
    };
  };

  const totalSections = evaluationData?.secciones?.length || 0;
  const currentSectionData = evaluationData?.secciones?.[currentSection];

  const progress = totalSections > 0
    ? ((currentSection + 1) / totalSections) * 100
    : 0;

  const handleAnswer = (questionIndex, selectedOption) => {
    const key = `${selectedRole}-${currentSection}-${questionIndex}`;
    setAnswers(prev => ({ ...prev, [key]: selectedOption }));
  };

  const handleNextSection = async () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      // Completar evaluación
      await completeEvaluation();
    }
  };

  const completeEvaluation = async () => {
    try {
      setLoading(true);

      // Calcular puntuación final
      let totalScore = 0;
      let totalNormalQuestions = 0;
      let correctNormalAnswers = 0;
      const calificacionesSecciones = {};

      // Calcular por secciones
      evaluationData.secciones.forEach((seccion, sectionIndex) => {
        let seccionScore = 0;
        let seccionQuestions = 0;
        let seccionCorrect = 0;

        seccion.preguntas.forEach((question, qIndex) => {
          const key = `${selectedRole}-${sectionIndex}-${qIndex}`;
          const selectedAnswer = answers[key];

          if (selectedAnswer && !question.es_trampa) {
            seccionQuestions++;
            totalNormalQuestions++;

            if (selectedAnswer === 'si') {
              seccionScore += 10;
              seccionCorrect++;
              correctNormalAnswers++;
            }
          }
        });

        const seccionPercentage = seccionQuestions > 0 ? (seccionCorrect / seccionQuestions) * 100 : 0;
        calificacionesSecciones[seccion.nombre] = {
          porcentaje: seccionPercentage,
          ponderacion: seccion.ponderacion,
          contribucion: (seccionPercentage * seccion.ponderacion) / 100
        };

        totalScore += (seccionPercentage * seccion.ponderacion) / 100;
      });

      // Preparar datos para guardar en la base de datos
      const evaluacionData = {
        nombre: userName,
        calificaciones_secciones: calificacionesSecciones,
        total_obtenido: Math.round(totalScore),
        respuestas: answers,
        observaciones: `Evaluación de personal completada - Jefe de Planta - Puntuación: ${Math.round(totalScore)}%`
      };

      // Guardar en base de datos de resultados
      const savedResult = databaseService.saveResult(evaluacionData);

      const resultsData = {
        answers,
        score: Math.round(totalScore),
        totalAnswers: totalNormalQuestions,
        correctAnswers: correctNormalAnswers,
        evaluationTitle: `Evaluación de Personal - Jefe de Planta`,
        sections: evaluationData.secciones || [],
        isPersonalEvaluation: true,
        savedResult: savedResult
      };

      onComplete(resultsData);

      toast({
        title: "✅ Evaluación completada",
        description: `Los resultados han sido guardados exitosamente. Puntuación: ${Math.round(totalScore)}%`
      });

    } catch (error) {
      console.error('Error completing evaluation:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la evaluación. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const calculateStats = () => {
    if (!evaluationData?.secciones) {
      return null;
    }

    const totalQuestions = evaluationData.secciones.reduce((total, seccion) => {
      return total + (seccion.preguntas?.length || 0);
    }, 0);

    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      sectionsInfo: evaluationData.secciones.map((seccion, index) => ({
        nombre: seccion.nombre,
        ponderacion: seccion.ponderacion,
        totalPreguntas: seccion.preguntas?.length || 0,
        isCurrentSection: index === currentSection,
        isCompleted: seccion.preguntas?.every((_, qIndex) => {
          const key = `${selectedRole}-${index}-${qIndex}`;
          return answers[key] !== undefined;
        })
      }))
    };
  };

  const stats = calculateStats();

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gray-100 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando evaluación de personal...</p>
        </div>
      </div>
    );
  }

  if (!evaluationData || !evaluationData.secciones || evaluationData.secciones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-gray-800 p-4 pt-24">
        <UserCheck size={64} className="mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold mb-2">Evaluación no disponible</h1>
        <p className="text-lg mb-6 text-center">No se encontraron preguntas para esta evaluación.</p>
      </div>
    );
  }

  // Verificar si todas las preguntas de la sección actual han sido respondidas
  const allQuestionsAnswered = currentSectionData?.preguntas?.every((_, index) => {
    const key = `${selectedRole}-${currentSection}-${index}`;
    return answers[key] !== undefined;
  });

  // Pantalla de evaluación
  return (
    <div className="min-h-screen relative bg-gray-100 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("/Fondo.png")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-24" ref={evaluationContentRef}>
        {/* Campo para nombre del usuario */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del evaluado:
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese el nombre del evaluado"
          />
        </div>


        {/* Barra de progreso */}
        <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Evaluación de Personal - Jefe de Planta
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              {Array.from({ length: totalSections }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < currentSection ? 'bg-blue-600' :
                    i === currentSection ? 'bg-blue-400' : 'bg-gray-300'}
                    ${i < totalSections - 1 ? 'mr-1' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Panel principal de evaluación */}
          <div className={`${stats ? 'w-3/5' : 'w-full'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                  {/* Header de la sección */}
                  <div className="bg-gray-50/80 px-6 py-4 rounded-t-lg border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 text-center">
                      {currentSectionData?.nombre}
                    </h2>
                    {currentSectionData?.ponderacion && (
                      <div className="text-center text-sm text-gray-600 mt-1">
                        Ponderación: {currentSectionData.ponderacion}%
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {currentSectionData?.preguntas?.map((question, index) => {
                        const key = `${selectedRole}-${currentSection}-${index}`;
                        const selectedAnswer = answers[key];

                        return (
                          <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                              {index + 1}. {question.pregunta}
                            </h3>


                            {/* Preguntas de selección múltiple */}
                            {question.tipo === 'seleccion_multiple' && question.opciones ? (
                              <div className="space-y-2">
                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="a"
                                    checked={selectedAnswer === 'a'}
                                    onChange={() => handleAnswer(index, 'a')}
                                    className="mr-3 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-blue-600 mr-3">A)</span>
                                  <span className="text-gray-700">{question.opciones.a}</span>
                                </label>

                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="b"
                                    checked={selectedAnswer === 'b'}
                                    onChange={() => handleAnswer(index, 'b')}
                                    className="mr-3 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-blue-600 mr-3">B)</span>
                                  <span className="text-gray-700">{question.opciones.b}</span>
                                </label>

                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="c"
                                    checked={selectedAnswer === 'c'}
                                    onChange={() => handleAnswer(index, 'c')}
                                    className="mr-3 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-blue-600 mr-3">C)</span>
                                  <span className="text-gray-700">{question.opciones.c}</span>
                                </label>
                              </div>
                            ) : (
                              /* Preguntas abiertas (Sí/No/NA) */
                              <div className="space-y-2">
                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="si"
                                    checked={selectedAnswer === 'si'}
                                    onChange={() => handleAnswer(index, 'si')}
                                    className="mr-3 text-green-600 focus:ring-green-500"
                                  />
                                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                  <span className="text-gray-700">Sí</span>
                                </label>

                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="no"
                                    checked={selectedAnswer === 'no'}
                                    onChange={() => handleAnswer(index, 'no')}
                                    className="mr-3 text-red-600 focus:ring-red-500"
                                  />
                                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                  <span className="text-gray-700">No</span>
                                </label>

                                <label className="flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400 hover:bg-gray-50">
                                  <input
                                    type="radio"
                                    name={`question-${currentSection}-${index}`}
                                    value="na"
                                    checked={selectedAnswer === 'na'}
                                    onChange={() => handleAnswer(index, 'na')}
                                    className="mr-3 text-gray-600 focus:ring-gray-500"
                                  />
                                  <MinusCircle className="w-5 h-5 text-gray-600 mr-2" />
                                  <span className="text-gray-700">No Aplica</span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Botón para continuar */}
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleNextSection}
                        disabled={!allQuestionsAnswered || loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>
                          {currentSection < totalSections - 1 ? 'Siguiente Sección' : 'Finalizar Evaluación'}
                        </span>
                      </Button>
                    </div>

                    {/* Contador de secciones */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                      Sección {currentSection + 1} de {totalSections}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panel de estadísticas */}
          {stats && (
            <div className="w-2/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 sticky top-8">
                <div className="bg-blue-50/80 px-4 py-3 rounded-t-lg border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Criterios de evaluación
                  </h3>
                </div>

                <div className="p-4">
                  <div className="space-y-4">
                    {/* Tabla de criterios */}
                    <div className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-2 font-medium text-gray-700">Criterios</th>
                            <th className="text-center p-2 font-medium text-gray-700">Ponderación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.sectionsInfo.map((section, index) => (
                            <tr
                              key={index}
                              className={`border-b border-gray-100 ${
                                section.isCurrentSection ? 'bg-blue-50' :
                                section.isCompleted ? 'bg-green-50' : ''
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-blue-600 mr-1">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-800 truncate" title={section.nombre}>
                                    {section.nombre.length > 25 ? section.nombre.substring(0, 25) + '...' : section.nombre}
                                  </span>
                                  {section.isCurrentSection && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-1 flex-shrink-0" />
                                  )}
                                  {section.isCompleted && (
                                    <CheckCircle className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" />
                                  )}
                                </div>
                              </td>
                              <td className="text-center p-2 text-xs font-medium">
                                {section.ponderacion}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Progreso general */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Progreso general</h4>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(stats.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {stats.answeredQuestions} de {stats.totalQuestions} preguntas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <img
        src="/Concreton.png"
        alt="Mascota Concreton"
        className="fixed bottom-0 right-0 md:right-8 z-20 w-32 h-40 drop-shadow-2xl pointer-events-none"
      />
    </div>
  );
};

export default EvaluationScreenPersonal;
