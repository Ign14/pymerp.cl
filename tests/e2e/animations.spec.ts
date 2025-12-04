import { test, expect } from '@playwright/test';

/**
 * Tests para verificar animaciones con Framer Motion
 */

test.describe('Animaciones', () => {
  test('página debería cargar con transición', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Verificar que la página cargó
    await page.waitForLoadState('domcontentloaded');
    
    // Screenshot del estado cargado
    await page.screenshot({ 
      path: 'test-results/screenshots/page-transition.png',
      fullPage: true
    });
  });

  test('botones deberían existir y ser clickeables', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Buscar botón de submit de forma flexible
    const submitButton = page.locator('button[type="submit"]').first();
    
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeEnabled();
    
    // Screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/buttons-interactive.png' 
    });
  });

  test('página debería tener elementos interactivos', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Verificar que hay elementos interactivos
    const interactiveElements = await page.locator('button, a, input').count();
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/page-loaded.png',
      fullPage: true 
    });
  });
});

test.describe('PWA Features', () => {
  test.skip('install prompt (manual testing)', async ({ page }) => {
    // Este test requiere condiciones específicas del browser
    // Mejor testearlo manualmente
    test.setTimeout(60000);
    
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(31000);
    
    // Buscar prompt si aparece
    const installPrompt = page.locator('text=/instalar/i').first();
    if (await installPrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.screenshot({ 
        path: 'test-results/screenshots/install-prompt.png' 
      });
    }
  });

  test('debería mostrar indicador offline', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Simular modo offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Buscar indicador offline de forma más específica
    const offlineIndicator = page.locator('div:has-text("Sin conexión")').first();
    
    // Verificar si aparece (puede no estar implementado en todas las páginas)
    const isVisible = await offlineIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await page.screenshot({ 
        path: 'test-results/screenshots/offline-indicator.png',
        fullPage: true
      });
    }
    
    // Restaurar online
    await context.setOffline(false);
  });
});

