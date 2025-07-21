import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import RadarChart from './RadarChart';
import { APPROVAL_MIN, APPROVAL_MAX, MAX_TRAP_ERRORS } from '@/config/evaluation';

const ResultsScreen = ({ results, onBack, onNewEvaluation, onHome }) => {
  const { score, totalAnswers, correctAnswers, evaluationTitle, calificaciones_secciones, pass, trapQuestions = 2, trapIncorrect = 0 } = results;
  
  // Use the pass property from results which considers both score and trap questions
  const isPass = results.pass;
  
  // Prepare radar chart data from section scores
  const prepareRadarData = () => {
    if (!calificaciones_secciones) return null;
    
    return Object.keys(calificaciones_secciones).map(key => ({
      label: key,
      value: calificaciones_secciones[key]?.porcentaje || 0
    }));
  };
  
  const radarData = prepareRadarData();

  return (
    <div className="min-h-screen custom-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-700/20"></div>

      {/* Results Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="glass-card border-0 rounded-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
                {evaluationTitle}
              </CardTitle>

              <div className="flex items-center justify-center space-x-4 mb-4">
                {isPass ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="text-4xl font-bold text-green-600">APROBADO</div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div className="text-4xl font-bold text-red-600">REPROBADO</div>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {/* Trap Questions Panel */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2 text-center">Criterios de Aprobación</h3>
                <div className="text-center space-y-1">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">Preguntas trampa incorrectas:</span> {trapIncorrect} / {MAX_TRAP_ERRORS}
                  </div>
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">Criterio de aprobación:</span> {APPROVAL_MIN}-{APPROVAL_MAX}% y ≤{MAX_TRAP_ERRORS} preguntas trampa incorrectas
                  </div>
                </div>
              </div>

              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Escala de Evaluación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-red-800">Rojo (0-{APPROVAL_MIN - 1}%)</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-800">Verde ({APPROVAL_MIN}-{APPROVAL_MAX}%)</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-yellow-800">Amarillo ({APPROVAL_MAX + 1}-100%)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{score}%</div>
                  <div className="text-sm text-gray-600">Puntuación Final</div>
                  <div className="text-xs text-gray-500 mt-1">{correctAnswers} correctas de {totalAnswers} respondidas</div>
                </div>
              </div>

              {/* Radar Chart Section */}
              {radarData && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Resultados por Sección</h3>
                  <div className="bg-white p-6 rounded-lg">
                    <RadarChart data={radarData} />
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button onClick={onNewEvaluation} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Comenzar Nueva Evaluación</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Character */}
      <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="fixed bottom-0 right-0 md:right-8 z-20">
        <img alt="Mascota IMCYC trabajador de construcción" className="w-32 h-40 drop-shadow-2xl" src="/Concreton.png" />
      </motion.div>
    </div>
  );
};

export default ResultsScreen;
