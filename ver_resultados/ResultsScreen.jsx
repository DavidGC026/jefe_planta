import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import RadarChart from '../src/components/RadarChart';
import { APPROVAL_MIN, APPROVAL_MAX, MAX_TRAP_ERRORS } from '@/config/evaluation';

const ResultsScreen = ({ results, onBack, onNewEvaluation, onHome }) => {
  const { score, totalAnswers, correctAnswers, evaluationTitle, calificaciones_secciones, pass, trapQuestions = 2, trapIncorrect = 0 } = results;

  // Use the pass property from results which considers both score and trap questions
  const isPass = results.pass;

  // Prepare radar chart data f7rom section scores
  const prepareRadarData = () => {
    if (!calificaciones_secciones) return null;

    return Object.keys(calificaciones_secciones).map(key => ({
      label: key,
      value: calificaciones_secciones[key]?.porcentaje || 0
    }));
  };

  const radarData = prepareRadarData();

  return (
    <div className="min-h-screen flex items-center justify-center custom-bg">
      <div className="text-3xl md:text-5xl font-bold text-green-700 text-center">
        El examen se realizó con éxito, las respuestas fueron guardadas.
      </div>
    </div>
  );
};

export default ResultsScreen;