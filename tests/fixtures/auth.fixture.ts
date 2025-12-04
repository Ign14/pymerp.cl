import { test as base } from '@playwright/test';

/**
 * Fixtures personalizados para tests
 * 
 * Uso:
 * import { test } from './fixtures/auth.fixture';
 */

type AuthFixtures = {
  authenticatedPage: any;
  adminPage: any;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Página con usuario autenticado
   */
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login automático
    await page.goto('/login');
    
    // Llenar credenciales (usar variables de entorno)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Test123456';
    
    await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar redirección
    await page.waitForURL(/\/(dashboard|admin|setup)/, { timeout: 10000 }).catch(() => {
      console.log('⚠️ Login falló o redirigió a otra página');
    });
    
    await use(page);
    
    // Teardown: Logout
    // await page.getByRole('button', { name: /cerrar sesión/i }).click();
  },

  /**
   * Página con usuario admin
   */
  adminPage: async ({ page }, use) => {
    // Setup: Login como admin
    await page.goto('/login');
    
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin123456';
    
    await page.getByRole('textbox', { name: /email/i }).fill(adminEmail);
    await page.getByLabel(/contraseña|password/i).fill(adminPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar dashboard de admin
    await page.waitForURL('**/admin', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Admin login falló');
    });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

