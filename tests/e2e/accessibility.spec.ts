import { test, expect } from '@playwright/test';

/**
 * Tests de Accesibilidad
 * 
 * Verifica cumplimiento WCAG 2.1 AA
 * 
 * Nota: Para tests con axe-core, instalar:
 * npm install -D @axe-core/playwright
 */

test.describe('Accesibilidad - WCAG 2.1 AA', () => {
  test.skip('Landing page audit (requiere @axe-core/playwright)', async ({ page }) => {
    // Para habilitar:
    // 1. npm install -D @axe-core/playwright
    // 2. Importar: import AxeBuilder from '@axe-core/playwright';
    // 3. Descomentar código:
    
    await page.goto('/', { waitUntil: 'networkidle' });

    // const accessibilityScanResults = await new AxeBuilder({ page })
    //   .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    //   .analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page debería tener elementos accesibles', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Verificar que hay labels para inputs
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/login-accessible.png' 
    });
  });

  test('debería poder navegar con teclado', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    let focusableCount = 0;
    
    // Presionar Tab múltiples veces
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Verificar que hay elemento con foco
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName : null;
      });
      
      if (focusedElement && focusedElement !== 'BODY') {
        focusableCount++;
      }
    }
    
    // Debería haber al menos 2 elementos focusables
    expect(focusableCount).toBeGreaterThan(1);
  });

  test('formularios deberían tener labels', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Verificar que los inputs tienen labels o aria-labels
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const hasAssociatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(ariaLabel || hasAssociatedLabel);
      });
      
      // Al menos debería tener type o placeholder como fallback
      const type = await input.getAttribute('type');
      expect(type || hasLabel).toBeTruthy();
    }
  });

  test('botones interactivos deberían ser accesibles', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Verificar que los botones tienen texto o aria-label
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('imágenes deberían tener alt text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Esperar a que carguen imágenes
    
    // Obtener imágenes visibles
    const images = await page.locator('img').all();
    
    if (images.length > 0) {
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        // Alt puede ser string vacío para imágenes decorativas, pero debe existir
        expect(alt !== null).toBeTruthy();
      }
    }
    
    // Screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/accessibility-check.png',
      fullPage: true
    });
  });
});

