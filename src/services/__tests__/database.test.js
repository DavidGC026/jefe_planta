import databaseService from '@/services/database';
import { APPROVAL_MIN, APPROVAL_MAX, MAX_TRAP_ERRORS } from '@/config/evaluation';

// Mock fetch for API calls in tests
global.fetch = jest.fn();

const createTestSections = (numSections = 4, questionsPerSection = 4) => {
  const sections = [];
  for (let i = 0; i < numSections; i++) {
    const section = {
      nombre: `Sección ${i + 1}`,
      ponderacion: 100 / numSections, // Equal weighting
      preguntas: []
    };
    
    for (let j = 0; j < questionsPerSection; j++) {
      section.preguntas.push({
        tipo: 'seleccion_multiple',
        es_trampa: j === questionsPerSection - 1, // Last question in each section is trap
        respuesta_correcta: j === questionsPerSection - 1 ? 'no' : 'si'
      });
    }
    
    sections.push(section);
  }
  return sections;
};

const createPerfectAnswers = (sections) => {
  const answers = {};
  sections.forEach((section, sectionIndex) => {
    section.preguntas.forEach((question, questionIndex) => {
      const key = `jefe_planta-${sectionIndex}-${questionIndex}`;
      answers[key] = question.es_trampa ? 'no' : 'si'; // Correct answers
    });
  });
  return answers;
};

describe('calculateScore - Comprehensive Threshold Testing', () => {
  let testSections;
  
  beforeEach(() => {
    testSections = createTestSections();
    fetch.mockClear();
  });

  describe('Threshold Boundary Tests', () => {
    test('passes at exactly APPROVAL_MIN (85%) with no trap errors', () => {
      const answers = createPerfectAnswers(testSections);
      // Make some answers incorrect to get exactly 85%
      answers['jefe_planta-0-0'] = 'no'; // Wrong answer to reduce score
      answers['jefe_planta-1-0'] = 'no'; // Wrong answer to reduce score
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBeCloseTo(85, 0);
      expect(result.trapIncorrect).toBe(0);
      expect(result.pass).toBe(true);
    });
    
    test('fails at exactly APPROVAL_MIN - 1 (84%)', () => {
      const answers = createPerfectAnswers(testSections);
      // Make enough answers incorrect to get 84%
      answers['jefe_planta-0-0'] = 'no';
      answers['jefe_planta-1-0'] = 'no';
      answers['jefe_planta-2-0'] = 'no'; // One more wrong answer
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBeLessThan(APPROVAL_MIN);
      expect(result.pass).toBe(false);
    });
    
    test('passes at exactly APPROVAL_MAX (95%)', () => {
      const answers = createPerfectAnswers(testSections);
      // Make minimal incorrect answers to get exactly 95%
      answers['jefe_planta-0-0'] = 'no'; // One wrong answer
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBeCloseTo(95, 1);
      expect(result.trapIncorrect).toBe(0);
      expect(result.pass).toBe(true);
    });
    
    test('fails above APPROVAL_MAX (>95%)', () => {
      const answers = createPerfectAnswers(testSections);
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBe(100);
      expect(result.pass).toBe(false); // Should fail for being too high
    });
  });

  describe('Trap Error Threshold Tests', () => {
    test('passes with exactly MAX_TRAP_ERRORS', () => {
      const answers = createPerfectAnswers(testSections);
      // Make exactly MAX_TRAP_ERRORS trap answers incorrect
      for (let i = 0; i < MAX_TRAP_ERRORS; i++) {
        answers[`jefe_planta-${i}-3`] = 'si'; // Wrong trap answer
      }
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.trapIncorrect).toBe(MAX_TRAP_ERRORS);
      expect(result.totalScore).toBeGreaterThanOrEqual(APPROVAL_MIN);
      expect(result.totalScore).toBeLessThanOrEqual(APPROVAL_MAX);
      expect(result.pass).toBe(true);
    });
    
    test('fails with MAX_TRAP_ERRORS + 1', () => {
      const answers = createPerfectAnswers(testSections);
      // Make MAX_TRAP_ERRORS + 1 trap answers incorrect
      for (let i = 0; i <= MAX_TRAP_ERRORS; i++) {
        if (i < testSections.length) {
          answers[`jefe_planta-${i}-3`] = 'si'; // Wrong trap answer
        }
      }
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.trapIncorrect).toBe(MAX_TRAP_ERRORS + 1);
      expect(result.pass).toBe(false);
    });
    
    test('fails with perfect score but too many trap errors', () => {
      const answers = createPerfectAnswers(testSections);
      // Make all trap questions wrong
      testSections.forEach((section, sectionIndex) => {
        section.preguntas.forEach((question, questionIndex) => {
          if (question.es_trampa) {
            answers[`jefe_planta-${sectionIndex}-${questionIndex}`] = 'si';
          }
        });
      });
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBeGreaterThanOrEqual(APPROVAL_MIN);
      expect(result.trapIncorrect).toBeGreaterThan(MAX_TRAP_ERRORS);
      expect(result.pass).toBe(false);
    });
  });

  describe('Edge Case Combinations', () => {
    test('barely passes with score at minimum and maximum allowed trap errors', () => {
      // Create scenario where score is exactly at minimum and trap errors at maximum
      const answers = {};
      let correctAnswers = 0;
      let totalNormalQuestions = 0;
      
      testSections.forEach((section, sectionIndex) => {
        section.preguntas.forEach((question, questionIndex) => {
          const key = `jefe_planta-${sectionIndex}-${questionIndex}`;
          
          if (question.es_trampa) {
            // Make MAX_TRAP_ERRORS trap questions wrong, rest correct
            answers[key] = sectionIndex < MAX_TRAP_ERRORS ? 'si' : 'no';
          } else {
            totalNormalQuestions++;
            // Calculate how many we need correct to get exactly APPROVAL_MIN
            const targetCorrect = Math.ceil((APPROVAL_MIN / 100) * totalNormalQuestions);
            answers[key] = correctAnswers < targetCorrect ? 'si' : 'no';
            if (correctAnswers < targetCorrect) correctAnswers++;
          }
        });
      });
      
      const result = databaseService.calculateScore(testSections, answers);
      
      expect(result.totalScore).toBeGreaterThanOrEqual(APPROVAL_MIN - 1); // Allow for rounding
      expect(result.trapIncorrect).toBe(MAX_TRAP_ERRORS);
      expect(result.pass).toBe(true);
    });
    
    test('handles empty answers gracefully', () => {
      const result = databaseService.calculateScore(testSections, {});
      
      expect(result.totalScore).toBe(0);
      expect(result.trapIncorrect).toBe(0);
      expect(result.trapQuestions).toBe(0);
      expect(result.pass).toBe(false);
    });
    
    test('handles sections with different weightings correctly', () => {
      const weightedSections = [
        {
          nombre: 'Critical Section',
          ponderacion: 60,
          preguntas: [
            { tipo: 'seleccion_multiple', es_trampa: false, respuesta_correcta: 'si' },
            { tipo: 'seleccion_multiple', es_trampa: false, respuesta_correcta: 'si' }
          ]
        },
        {
          nombre: 'Minor Section',
          ponderacion: 40,
          preguntas: [
            { tipo: 'seleccion_multiple', es_trampa: false, respuesta_correcta: 'si' },
            { tipo: 'seleccion_multiple', es_trampa: true, respuesta_correcta: 'no' }
          ]
        }
      ];
      
      const answers = {
        'jefe_planta-0-0': 'si',   // Correct (critical section)
        'jefe_planta-0-1': 'no',   // Incorrect (critical section)
        'jefe_planta-1-0': 'si',   // Correct (minor section)
        'jefe_planta-1-1': 'no'    // Correct (trap question)
      };
      
      const result = databaseService.calculateScore(weightedSections, answers);
      
      // Should be 50% * 60% + 100% * 40% = 30 + 40 = 70%
      expect(result.totalScore).toBe(70);
      expect(result.trapIncorrect).toBe(0);
      expect(result.pass).toBe(false); // Below 85%
    });
  });

  describe('Question Type Handling', () => {
    test('handles different question types correctly', () => {
      const mixedSections = [
        {
          nombre: 'Mixed Section',
          ponderacion: 100,
          preguntas: [
            { tipo: 'seleccion_multiple', es_trampa: false, respuesta_correcta: 'si' },
            { tipo: 'abierta', es_trampa: false }, // Open question (defaults to 'si' correct)
            { tipo: 'seleccion_multiple', es_trampa: true, respuesta_correcta: 'no' },
            { tipo: 'abierta', es_trampa: true } // Open trap question (defaults to 'no' correct)
          ]
        }
      ];
      
      const answers = {
        'jefe_planta-0-0': 'si',  // Correct multiple choice
        'jefe_planta-0-1': 'si',  // Correct open question
        'jefe_planta-0-2': 'no',  // Correct trap multiple choice
        'jefe_planta-0-3': 'no'   // Correct trap open question
      };
      
      const result = databaseService.calculateScore(mixedSections, answers);
      
      expect(result.totalScore).toBe(100);
      expect(result.trapIncorrect).toBe(0);
      expect(result.correctNormalAnswers).toBe(2);
      expect(result.trapQuestions).toBe(2);
    });
  });
});

