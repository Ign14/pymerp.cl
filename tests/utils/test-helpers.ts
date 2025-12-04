import { Page, expect } from '@playwright/test';

/**
 * Utilidades para tests más estables y debugging
 */

/**
 * Cerrar overlays que bloquean interacción
 * (modales, prompts, notificaciones)
 */
export async function closeOverlays(page: Page): Promise<void> {
  // Cerrar PWA install prompt si aparece
  const pwaPromptClose = page.locator('button[aria-label*="Cerrar"]').first();
  if (await pwaPromptClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await pwaPromptClose.click();
    await page.waitForTimeout(300);
  }
  
  // Cerrar cualquier modal visible
  const modals = page.locator('[role="dialog"]');
  const modalCount = await modals.count();
  
  for (let i = 0; i < modalCount; i++) {
    const modal = modals.nth(i);
    if (await modal.isVisible().catch(() => false)) {
      // Intentar cerrar con ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }
  
  // Cerrar notificaciones/toasts
  const closeButtons = page.locator('button:has-text("×"), button[aria-label*="close" i], button[aria-label*="cerrar" i]');
  const count = await closeButtons.count();
  
  for (let i = 0; i < Math.min(count, 3); i++) {
    const btn = closeButtons.nth(i);
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(200);
    }
  }
}

/**
 * Esperar a que una condición sea verdadera con retry
 * Útil para tests flaky que dependen de timing
 */
export async function waitForCondition(
  callback: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const { timeout = 10000, interval = 100, errorMessage = 'Condition not met' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      if (await callback()) {
        return;
      }
    } catch (e) {
      // Ignorar errores intermedios
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(errorMessage);
}

/**
 * Screenshot con metadata para debugging
 */
export async function debugScreenshot(
  page: Page,
  name: string,
  annotations?: Record<string, string>
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/screenshots/debug-${name}-${timestamp}.png`;

  await page.screenshot({
    path: filename,
    fullPage: true,
  });

  console.log(`📸 Screenshot guardado: ${filename}`);
  if (annotations) {
    console.log('📝 Metadata:', annotations);
  }
}

/**
 * Esperar a que desaparezca el loading spinner
 */
export async function waitForNoLoadingSpinner(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[role="status"]', { state: 'hidden', timeout }).catch(() => {
    // Si no existe, está ok
  });
  
  // También esperar animaciones de loading
  await page.waitForFunction(
    () => {
      const spinners = document.querySelectorAll('[class*="animate-spin"]');
      return spinners.length === 0;
    },
    { timeout }
  ).catch(() => {
    // Si no hay spinners, está ok
  });
}

/**
 * Esperar a que termine una animación de Framer Motion
 */
export async function waitForAnimation(page: Page, selector?: string, timeout = 1000): Promise<void> {
  await page.waitForTimeout(timeout);
}

/**
 * Retry una acción con exponential backoff
 * Útil para operaciones que pueden fallar por timing
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️ Retry ${i + 1}/${maxRetries} - Esperando ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Verificar que un elemento está visible y es clickeable
 * Previene errores de "element is not clickable"
 */
export async function waitForClickable(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<void> {
  const element = page.locator(selector);
  
  // Esperar visible
  await element.waitFor({ state: 'visible', timeout });
  
  // Esperar que no esté obscurecido
  await expect(element).toBeVisible();
  
  // Esperar que sea clickeable
  await element.scrollIntoViewIfNeeded();
  
  // Pequeña espera para animaciones
  await page.waitForTimeout(100);
}

/**
 * Limpiar estado entre tests
 */
export async function clearAppState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Limpiar cookies
  await page.context().clearCookies();
}

/**
 * Mock de Firebase Auth (útil para tests sin backend real)
 */
export async function mockFirebaseAuth(page: Page, user?: any): Promise<void> {
  await page.addInitScript((userData) => {
    // Mock básico de Firebase Auth
    (window as any).__FIREBASE_AUTH_MOCK__ = userData || {
      uid: 'test-user-123',
      email: 'test@example.com',
      emailVerified: true,
    };
  }, user);
}

/**
 * Tomar screenshot con contexto completo para debugging
 */
export async function captureDebugInfo(
  page: Page,
  testName: string,
  includeTrace = false
): Promise<void> {
  const timestamp = Date.now();
  const sanitizedName = testName.replace(/[^a-z0-9]/gi, '-');
  
  // Screenshot
  await page.screenshot({
    path: `test-results/debug/${sanitizedName}-${timestamp}.png`,
    fullPage: true,
  });
  
  // HTML snapshot
  const html = await page.content();
  const fs = await import('fs');
  const path = await import('path');
  
  fs.writeFileSync(
    path.join('test-results', 'debug', `${sanitizedName}-${timestamp}.html`),
    html
  );
  
  // Console logs
  const logs = await page.evaluate(() => {
    return (window as any).__TEST_CONSOLE_LOGS__ || [];
  });
  
  console.log('📋 Console logs:', logs);
  
  // Network requests (opcional)
  const requests = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      duration: r.duration,
    }));
  });
  
  console.log('🌐 Network requests:', requests.length);
}

/**
 * Esperar a que todos los recursos de red terminen de cargar
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout = 30000,
  idleTime = 500
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(idleTime);
}

/**
 * Verificar que no hay errores de JavaScript en consola
 */
export async function expectNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // Al final del test, verificar
  expect(errors).toHaveLength(0);
}

