import { test, expect } from '@playwright/test';

/**
 * Tests para la página pública de empresas
 */

test.describe('Public Page Tests', () => {
  test.skip('requiere configuración de empresa de prueba', async ({ page }) => {
    // Estos tests requieren:
    // 1. Una empresa de prueba en Firestore
    // 2. Slug conocido
    // 3. Datos de prueba
    
    // Para habilitar:
    // 1. Crear empresa de prueba en Firebase
    // 2. Actualizar TEST_SLUG con el slug real
    // 3. Descomentar tests
    
    await page.goto('/test-slug', { waitUntil: 'networkidle' });
  });
});

