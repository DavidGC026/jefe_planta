import { test, expect } from '@playwright/test';

test.describe('Evaluation Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('completes evaluation successfully with passing score', async ({ page }) => {
    // Check if the main evaluation screen loads
    await expect(page.getByText('Evaluación de Conocimientos')).toBeVisible();
    
    // Start evaluation
    await page.click('button:has-text("Iniciar Evaluación")');
    
    // Fill out evaluation form correctly to pass
    const questions = page.locator('[data-testid="question"]');
    const questionCount = await questions.count();
    
    for (let i = 0; i < questionCount; i++) {
      const question = questions.nth(i);
      
      // Check if it's a trap question by looking for data attribute
      const isTrap = await question.getAttribute('data-is-trap');
      
      if (isTrap === 'true') {
        // For trap questions, select 'no' to answer correctly
        await question.locator('input[value="no"]').check();
      } else {
        // For normal questions, select 'si' to get points
        await question.locator('input[value="si"]').check();
      }
    }
    
    // Submit evaluation
    await page.click('button:has-text("Finalizar Evaluación")');
    
    // Verify results screen shows passing grade
    await expect(page.getByText('APROBADO')).toBeVisible();
    await expect(page.locator('[data-testid="total-score"]')).toContainText(/8[5-9]|9[0-5]/); // Score between 85-95
    
    // Verify trap error count is acceptable
    await expect(page.locator('[data-testid="trap-errors"]')).toContainText(/[0-2]/); // Max 2 trap errors
  });

  test('shows evaluation history', async ({ page }) => {
    // Navigate to history
    await page.click('button:has-text("Ver Historial")');
    
    // Verify history screen loads
    await expect(page.getByText('Historial de Evaluaciones')).toBeVisible();
    
    // Check if evaluation results are displayed
    await expect(page.locator('[data-testid="evaluation-item"]')).toHaveCount({ min: 0 });
  });
});

test.describe('Evaluation Flow - Failure Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('fails evaluation with too many trap errors', async ({ page }) => {
    await page.click('button:has-text("Iniciar Evaluación")');
    
    const questions = page.locator('[data-testid="question"]');
    const questionCount = await questions.count();
    
    // Answer all trap questions incorrectly
    for (let i = 0; i < questionCount; i++) {
      const question = questions.nth(i);
      const isTrap = await question.getAttribute('data-is-trap');
      
      if (isTrap === 'true') {
        // Answer trap questions incorrectly
        await question.locator('input[value="si"]').check();
      } else {
        // Answer normal questions correctly
        await question.locator('input[value="si"]').check();
      }
    }
    
    await page.click('button:has-text("Finalizar Evaluación")');
    
    // Verify failure due to trap errors
    await expect(page.getByText('REPROBADO')).toBeVisible();
    await expect(page.locator('[data-testid="failure-reason"]')).toContainText('errores en preguntas trampa');
  });

  test('fails evaluation with low score', async ({ page }) => {
    await page.click('button:has-text("Iniciar Evaluación")');
    
    const questions = page.locator('[data-testid="question"]');
    const questionCount = await questions.count();
    
    // Answer most questions incorrectly to get low score
    for (let i = 0; i < questionCount; i++) {
      const question = questions.nth(i);
      const isTrap = await question.getAttribute('data-is-trap');
      
      if (isTrap === 'true') {
        // Answer trap questions correctly to avoid that failure mode
        await question.locator('input[value="no"]').check();
      } else {
        // Answer normal questions incorrectly to get low score
        await question.locator('input[value="no"]').check();
      }
    }
    
    await page.click('button:has-text("Finalizar Evaluación")');
    
    // Verify failure due to low score
    await expect(page.getByText('REPROBADO')).toBeVisible();
    await expect(page.locator('[data-testid="total-score"]')).toContainText(/[0-7]/); // Score below 75
  });

  test('handles network error gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/save-result.php', route => route.abort());
    
    await page.click('button:has-text("Iniciar Evaluación")');
    
    // Fill out form
    const questions = page.locator('[data-testid="question"]');
    const questionCount = await questions.count();
    
    for (let i = 0; i < Math.min(questionCount, 3); i++) {
      await questions.nth(i).locator('input[value="si"]').check();
    }
    
    await page.click('button:has-text("Finalizar Evaluación")');
    
    // Verify error handling
    await expect(page.getByText('Error al guardar')).toBeVisible();
  });
});
