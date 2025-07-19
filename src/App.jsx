import React, { useState } from 'react';
import EvaluationScreenPersonal from './components/EvaluationScreenPersonal';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('evaluation');
  const [evaluationResults, setEvaluationResults] = useState(null);

  const handleEvaluationComplete = (results) => {
    setEvaluationResults(results);
    setCurrentScreen('results');
  };

  const handleNewEvaluation = () => {
    setEvaluationResults(null);
    setCurrentScreen('evaluation');
  };

  return (
    <div className="App">
      {currentScreen === 'evaluation' && (
        <EvaluationScreenPersonal
          onComplete={handleEvaluationComplete}
          username="usuario1"
        />
      )}
      
      {currentScreen === 'results' && evaluationResults && (
        <ResultsScreen
          results={evaluationResults}
          onNewEvaluation={handleNewEvaluation}
        />
      )}
    </div>
  );
}

export default App;
