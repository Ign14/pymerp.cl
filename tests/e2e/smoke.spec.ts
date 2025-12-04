import { test, expect } from '@playwright/test';
import { closeOverlays } from '../utils/test-helpers';

/**
 * Smoke Tests - Tests rápidos de funcionalidad crítica
 * 
 * Estos tests deberían pasar siempre y ejecutarse rápido
 */

test.describe('Smoke Tests', () => {
  test('app debería cargar sin errores', async ({ page }) => {
    // Capturar errores de consola
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Cargar app
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Verificar que cargó
    await expect(page).toHaveTitle(/.+/);
    
    // No debería haber errores críticos de JavaScript
    // (permitir algunos warnings de desarrollo)
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('DevTools') &&
      !e.includes('Extension')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('navegación básica debería funcionar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await closeOverlays(page);
    
    // Debería tener links navegables
    const links = await page.locator('a[href]').count();
    expect(links).toBeGreaterThan(0);
    
    // Debería poder navegar
    const firstLink = page.locator('a[href^="/"]').first();
    const href = await firstLink.getAttribute('href');
    
    if (href && href !== '/') {
      await firstLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      
      // Verificar que navegó
      expect(page.url()).toContain(href);
    }
  });

  test('login page debería estar accesible', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Verificar status 200
    expect(response?.status()).toBe(200);
    
    // Verificar que hay formulario
    const form = page.locator('form').first();
    const hasForm = await form.isVisible({ timeout: 5000 }).catch(() => false);
    
    // O al menos inputs de email y password
    const emailInput = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasForm || (emailInput && passwordInput)).toBeTruthy();
  });

  test('assets estáticos deberían cargar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Verificar que hay imágenes
    const images = await page.locator('img').count();
    expect(images).toBeGreaterThan(0);
    
    // Verificar que al menos una imagen cargó
    const firstImage = page.locator('img').first();
    const loaded = await firstImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalHeight > 0;
    }).catch(() => false);
    
    // Si hay imágenes, al menos una debería cargar
    if (images > 0) {
      expect(loaded).toBeTruthy();
    }
  });

  test('no debería haber links rotos en landing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Obtener todos los links internos
    const links = await page.locator('a[href^="/"]').all();
    const brokenLinks: string[] = [];
    
    // Verificar máximo 10 links para no demorar mucho
    const linksToCheck = links.slice(0, 10);
    
    for (const link of linksToCheck) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      
      try {
        const response = await page.request.get(href);
        if (response.status() >= 400) {
          brokenLinks.push(`${href} (${response.status()})`);
        }
      } catch (e) {
        // Ignorar errores de request (pueden ser externos)
      }
    }
    
    expect(brokenLinks).toHaveLength(0);
  });
});

