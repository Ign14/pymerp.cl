# 🎭 Playwright Testing - Configuración Completa

## ✅ Estado de Implementación

**Playwright completamente configurado para AgendaWeb**

---

## 📋 Características Implementadas

### 1. ✅ Configuración Completa
- **Retry automático**: Tests flaky se reintentan 1-2 veces
- **Screenshots en failures**: Automáticos en fullPage
- **Trace on first retry**: Debugging detallado
- **Múltiples browsers**: Chrome, Firefox, Safari, Mobile
- **Parallel execution**: Tests en paralelo para velocidad
- **Global setup**: Preparación antes de tests

### 2. ✅ Debugging para Tests Flaky
- **Detector de flakiness**: Script para ejecutar tests múltiples veces
- **Retry con backoff**: Reintentos inteligentes
- **Helper functions**: Utilidades para tests estables
- **Trace viewer**: Análisis detallado de failures
- **Video recording**: Solo en failures

### 3. ✅ Screenshots Automáticos
- **On failure**: Screenshot automático fullPage
- **Debug screenshots**: Con timestamp y metadata
- **Organizados por test**: En carpetas por spec file
- **Limpieza automática**: Screenshots antiguos (> 7 días)

---

## 🚀 Setup Rápido

### 1. Instalar Browsers

```bash
npx playwright install --with-deps
```

Esto instala:
- Chromium
- Firefox
- WebKit (Safari)
- Dependencias del sistema

### 2. Ejecutar Tests

```bash
# Modo UI (RECOMENDADO para desarrollo)
npm run test:e2e:ui

# Modo normal
npm run test:e2e

# Modo debug
npm run test:e2e:debug

# Ver report
npm run test:e2e:report
```

### 3. Verificar Setup

```bash
# Test de verificación
npx playwright test tests/e2e/example.spec.ts --headed
```

---

## 📁 Estructura de Archivos

```
tests/
├── e2e/
│   ├── example.spec.ts          # Tests básicos
│   ├── public-page.spec.ts      # Tests de página pública
│   ├── accessibility.spec.ts    # Tests de accesibilidad
│   └── animations.spec.ts       # Tests de animaciones
├── fixtures/
│   └── auth.fixture.ts          # Fixtures de autenticación
├── utils/
│   └── test-helpers.ts          # Utilidades para tests
├── global-setup.ts              # Setup global
└── flaky-test-detector.ts       # Detector de flaky tests

playwright.config.ts             # Configuración principal
playwright-report/               # Reports HTML
test-results/                    # Screenshots, videos, traces
└── screenshots/                 # Screenshots automáticos
    ├── landing-success.png
    ├── login-error.png
    └── debug/                   # Debug screenshots
```

---

## 🎯 Configuración de playwright.config.ts

### Retry Strategy (Anti-Flaky)

```typescript
{
  // Retry automático
  retries: process.env.CI ? 2 : 1,
  
  // Timeout por test
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: { timeout: 5000 },
  
  // Workers paralelos
  workers: process.env.CI ? 1 : undefined,
}
```

### Screenshots y Traces

```typescript
use: {
  // Screenshot solo en failures
  screenshot: {
    mode: 'only-on-failure',
    fullPage: true,
  },
  
  // Video solo cuando falla y reintenta
  video: 'retain-on-failure',
  
  // Trace en primer retry (debugging)
  trace: 'on-first-retry',
}
```

### Browsers Configurados

| Browser | Uso | Resolución |
|---------|-----|------------|
| Chromium | Desktop Chrome | 1280x720 |
| Firefox | Desktop Firefox | 1280x720 |
| WebKit | Desktop Safari | 1280x720 |
| Mobile Chrome | Pixel 5 | 393x851 |
| Mobile Safari | iPhone 12 | 390x844 |
| iPad | iPad Pro | 1024x1366 |

### Cache Strategies

```typescript
runtimeCaching: [
  // Google Fonts - CacheFirst
  { urlPattern: /fonts\.googleapis\.com/, handler: 'CacheFirst' },
  
  // Firebase Storage - StaleWhileRevalidate
  { urlPattern: /firebasestorage/, handler: 'StaleWhileRevalidate' },
  
  // Images - CacheFirst
  { urlPattern: /\.(png|jpg|jpeg|svg)$/, handler: 'CacheFirst' },
  
  // API - NetworkFirst
  { urlPattern: /\/api\//, handler: 'NetworkFirst' },
]
```

---

## 🐛 Debugging de Tests Flaky

### Método 1: Repeat Each

```bash
# Ejecutar cada test 10 veces para detectar flakiness
npm run test:e2e:flaky

# Output:
# ✓ test-name (10/10 passed)
# ❌ flaky-test (7/10 passed) ← FLAKY DETECTED
```

### Método 2: Flaky Detector

```typescript
import { detectFlaky } from './tests/flaky-test-detector';

detectFlaky('nombre del test', async () => {
  // Test code
  await page.goto('/');
  // ...
});
```

**Output:**
```
⚠️ FLAKY TEST DETECTED: nombre del test (30% failure rate)

📊 FLAKY TESTS REPORT
━━━━━━━━━━━━━━━━━━━━
❌ nombre del test
   Runs: 10
   Failures: 3
   Flaky Rate: 30.0%
   Reasons:
     1. Timeout waiting for element
     2. Element not visible
     3. Navigation failed
```

### Método 3: Trace Viewer

```bash
# Ejecutar test con trace
npx playwright test --trace on

# Ver trace de failure
npx playwright show-trace test-results/trace.zip
```

**Trace Viewer muestra:**
- Timeline de acciones
- Screenshots de cada paso
- Network requests
- Console logs
- DOM snapshots

### Método 4: Test Helpers

```typescript
import { 
  waitForCondition,
  waitForClickable,
  retryWithBackoff,
  debugScreenshot 
} from './tests/utils/test-helpers';

// Esperar condición con retry
await waitForCondition(
  async () => await element.isVisible(),
  { timeout: 10000, errorMessage: 'Element never visible' }
);

// Retry con backoff exponencial
await retryWithBackoff(
  async () => await page.click('button'),
  { maxRetries: 3, initialDelay: 100 }
);

// Screenshot para debugging
await debugScreenshot(page, 'before-click', {
  step: 'setup',
  url: page.url(),
});
```

---

## 📸 Screenshots en Failures

### Configuración Automática

```typescript
// playwright.config.ts
use: {
  screenshot: {
    mode: 'only-on-failure',  // Solo cuando falla
    fullPage: true,            // Página completa
  },
}
```

### Screenshots Manuales

```typescript
// En cualquier test
await page.screenshot({
  path: 'test-results/screenshots/custom-name.png',
  fullPage: true,
});

// Con helper
import { debugScreenshot } from './tests/utils/test-helpers';

await debugScreenshot(page, 'step-name', {
  action: 'before-click',
  element: 'submit-button',
});
```

### Ubicación de Screenshots

```
test-results/
├── screenshots/
│   ├── landing-success.png
│   ├── login-error.png
│   ├── modal-animation.png
│   └── debug/
│       ├── debug-step-1-2024-12-03.png
│       ├── debug-step-2-2024-12-03.png
│       └── ...
├── videos/
│   └── example-spec-ts-login-test-chromium.webm
└── traces/
    └── trace-12345.zip
```

---

## 🧪 Tests de Ejemplo

### 1. Basic Navigation

```typescript
test('debería navegar correctamente', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
```

### 2. Form Interaction

```typescript
test('debería enviar formulario', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /submit/i }).click();
  
  // Esperar navegación o mensaje
  await expect(page.locator('text=/success|bienvenido/i')).toBeVisible();
});
```

### 3. Modal Interaction

```typescript
test('debería abrir y cerrar modal', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /forgot password/i }).click();
  
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
```

### 4. Shopping Cart

```typescript
test('debería agregar producto al carrito', async ({ page }) => {
  await page.goto('/products');
  
  // Agregar producto
  await page.getByRole('button', { name: /agregar/i }).first().click();
  
  // Verificar toast
  await expect(page.locator('text=/agregado/i')).toBeVisible();
  
  // Abrir carrito
  await page.getByRole('button', { name: /carrito/i }).click();
  
  // Verificar producto en carrito
  const cart = page.getByRole('dialog', { name: /carrito/i });
  await expect(cart).toBeVisible();
});
```

### 5. Accessibility Test

```typescript
import AxeBuilder from '@axe-core/playwright';

test('debería pasar audit de accesibilidad', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});
```

---

## 🔍 Herramientas de Debugging

### 1. Playwright UI Mode (RECOMENDADO)

```bash
npm run test:e2e:ui
```

**Características:**
- ✅ Ver tests ejecutándose en tiempo real
- ✅ Time travel debugging
- ✅ Inspect DOM en cualquier momento
- ✅ Ver network requests
- ✅ Ver console logs
- ✅ Pick locator tool

### 2. Debug Mode

```bash
npm run test:e2e:debug
```

**Características:**
- Pausa antes de cada acción
- Inspector de Playwright
- Ejecutar comandos manualmente
- Step through tests

### 3. Codegen (Grabar Tests)

```bash
npm run test:e2e:codegen
```

**Características:**
- Graba tus acciones
- Genera código de test automáticamente
- Pick locators inteligentes
- Genera assertions

### 4. Trace Viewer

```bash
# Ver trace de un test
npx playwright show-trace test-results/traces/trace.zip
```

**Características:**
- Timeline visual
- Screenshots de cada paso
- Network waterfall
- Console logs
- DOM snapshots

### 5. Headed Mode

```bash
npm run test:e2e:headed
```

Ver los tests ejecutándose en el navegador visible

---

## 🎯 Estrategias Anti-Flaky

### 1. Esperas Inteligentes

```typescript
// ❌ MAL - Hardcoded timeout
await page.waitForTimeout(5000);

// ✅ BIEN - Esperar condición específica
await page.waitForSelector('[data-testid="loaded"]');
await page.waitForLoadState('networkidle');
```

### 2. Auto-waiting de Playwright

```typescript
// Playwright espera automáticamente a que el elemento:
// - Esté attached al DOM
// - Sea visible
// - Sea estable (no animándose)
// - Sea enabled
// - No esté obscurecido

await page.click('button'); // ✅ Auto-waits!
```

### 3. Retry con Helper

```typescript
import { retryWithBackoff } from './tests/utils/test-helpers';

await retryWithBackoff(
  async () => await page.click('button'),
  { maxRetries: 3, initialDelay: 100 }
);
```

### 4. Network Idle

```typescript
import { waitForNetworkIdle } from './tests/utils/test-helpers';

await page.goto('/');
await waitForNetworkIdle(page);
// Ahora es seguro interactuar
```

### 5. Reduced Motion

```typescript
// En playwright.config.ts
contextOptions: {
  reducedMotion: 'reduce',  // Deshabilita animaciones
}
```

---

## 📸 Screenshots Strategy

### Automáticos (Failures)

```typescript
// Configurado en playwright.config.ts
screenshot: {
  mode: 'only-on-failure',
  fullPage: true,
}
```

**Ubicación**: `test-results/screenshots/test-name-retry0-chromium.png`

### Manuales (Debugging)

```typescript
// Screenshot simple
await page.screenshot({ path: 'screenshot.png' });

// Screenshot con metadata
import { debugScreenshot } from './tests/utils/test-helpers';

await debugScreenshot(page, 'step-1', {
  action: 'after-login',
  url: page.url(),
});
```

**Ubicación**: `test-results/screenshots/debug-step-1-2024-12-03T15-30-45.png`

### Por Paso del Test

```typescript
test('flujo completo', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'step-1-landing.png' });
  
  await page.click('button');
  await page.screenshot({ path: 'step-2-after-click.png' });
  
  await page.fill('input', 'text');
  await page.screenshot({ path: 'step-3-filled.png' });
});
```

---

## 🎬 Videos en Failures

Configurado automáticamente:

```typescript
video: 'retain-on-failure'
```

**Ubicación**: `test-results/videos/test-name-chromium.webm`

**Ver video**:
```bash
# Abrir carpeta
open test-results/videos/

# O ver en Playwright report
npm run test:e2e:report
```

---

## 📊 Reports

### HTML Report

```bash
# Generar y ver
npm run test:e2e:report
```

**Incluye:**
- Summary de tests passed/failed
- Screenshots de failures
- Videos de failures
- Traces
- Tiempo de ejecución
- Retry history

### JSON Report

```bash
# Ubicación
playwright-report/results.json
```

Útil para:
- Integración con CI/CD
- Análisis programático
- Dashboards custom

### JUnit Report

```bash
# Ubicación
playwright-report/junit.xml
```

Para integración con:
- Jenkins
- GitLab CI
- GitHub Actions
- CircleCI

---

## 🧪 Tests de Ejemplo Incluidos

### 1. `example.spec.ts`
Tests básicos de navegación y formularios

### 2. `public-page.spec.ts`
Tests de página pública:
- Carga de datos
- WhatsApp click
- Preview de imágenes
- Carrito de compras

### 3. `accessibility.spec.ts`
Tests de accesibilidad WCAG 2.1:
- Audit con axe-core
- Navegación por teclado
- Skip links
- Focus trap en modales
- Alt text en imágenes

### 4. `animations.spec.ts`
Tests de animaciones Framer Motion:
- Animaciones de modales
- Micro-interacciones en botones
- Animaciones de cards
- Drawer del carrito

---

## 🔧 Utilidades Incluidas

### test-helpers.ts

```typescript
// Esperar condición con retry
await waitForCondition(async () => await element.isVisible());

// Screenshot con metadata
await debugScreenshot(page, 'step-name', { action: 'click' });

// Esperar que desaparezca loading
await waitForNoLoadingSpinner(page);

// Esperar animación de Framer Motion
await waitForAnimation(page);

// Retry con exponential backoff
await retryWithBackoff(async () => await action());

// Esperar elemento clickeable
await waitForClickable(page, 'button#submit');

// Limpiar estado entre tests
await clearAppState(page);

// Capturar info completa para debugging
await captureDebugInfo(page, 'test-name', true);
```

### auth.fixture.ts

```typescript
import { test } from './tests/fixtures/auth.fixture';

// Test con usuario autenticado
test('dashboard test', async ({ authenticatedPage }) => {
  // Ya está logueado!
  await expect(authenticatedPage).toHaveURL(/\/dashboard/);
});

// Test con admin
test('admin test', async ({ adminPage }) => {
  // Ya está logueado como admin!
  await expect(adminPage).toHaveURL(/\/admin/);
});
```

---

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: npm run test:e2e:ci
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm ci
    - npx playwright install
    - npm run test:e2e:ci
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
```

---

## 🎓 Best Practices

### 1. Locators

```typescript
// ✅ BIEN - Usar roles y labels
await page.getByRole('button', { name: /submit/i });
await page.getByLabel('Email');
await page.getByText('Welcome');

// ❌ MAL - CSS selectores frágiles
await page.locator('.btn-primary');
await page.locator('#submit-btn');
```

### 2. Waits

```typescript
// ✅ BIEN - Auto-waiting
await page.click('button');
await expect(element).toBeVisible();

// ❌ MAL - Hardcoded timeouts
await page.waitForTimeout(5000);
```

### 3. Assertions

```typescript
// ✅ BIEN - Assertions con auto-retry
await expect(page).toHaveURL(/\/dashboard/);
await expect(element).toBeVisible();
await expect(element).toHaveText('Success');

// ❌ MAL - Assertions sin retry
expect(await element.isVisible()).toBe(true);
```

### 4. Cleanup

```typescript
test.beforeEach(async ({ page }) => {
  // Limpiar estado antes de cada test
  await clearAppState(page);
  await page.goto('/');
});

test.afterEach(async ({ page }, testInfo) => {
  // Screenshot si falló
  if (testInfo.status !== 'passed') {
    await page.screenshot({
      path: `test-results/failures/${testInfo.title}.png`,
      fullPage: true,
    });
  }
});
```

---

## 🐛 Troubleshooting

### Tests muy lentos

**Solución:**
```typescript
// playwright.config.ts
workers: 4,  // Aumentar workers
fullyParallel: true,
```

### Tests fallan en CI pero no localmente

**Causas comunes:**
- Timeouts muy cortos
- Diferentes resoluciones
- Network más lento

**Solución:**
```typescript
// Aumentar timeouts en CI
timeout: process.env.CI ? 60000 : 30000,

// Deshabilitar animaciones
contextOptions: {
  reducedMotion: 'reduce',
}
```

### Element not found

**Solución:**
```typescript
// Usar auto-waiting
await page.waitForSelector('button', { state: 'visible' });

// O helper
await waitForClickable(page, 'button');
```

### Screenshots no se guardan

**Verificar:**
```typescript
// playwright.config.ts
screenshot: {
  mode: 'only-on-failure',  // ¿Está configurado?
}

// Directorio existe
fs.mkdirSync('test-results/screenshots', { recursive: true });
```

---

## 📚 Recursos

### Documentación
- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

### Tools
- [Trace Viewer](https://trace.playwright.dev/)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Test Generator](https://playwright.dev/docs/codegen)

---

## ✅ Checklist

- [x] Playwright instalado
- [x] Browsers instalados
- [x] Config creado (playwright.config.ts)
- [x] Tests de ejemplo creados
- [x] Retry configurado (anti-flaky)
- [x] Screenshots en failures
- [x] Video en failures
- [x] Trace on first retry
- [x] Global setup
- [x] Test helpers
- [x] Auth fixtures
- [x] Flaky detector
- [x] Scripts NPM configurados
- [x] Documentación completa

---

## 🎉 ¡Playwright Listo!

**Configuración completa:**
- ✅ Retry automático para tests flaky
- ✅ Screenshots automáticos en failures
- ✅ Trace viewer para debugging
- ✅ Múltiples browsers y dispositivos
- ✅ Helpers para tests estables
- ✅ Fixtures de autenticación
- ✅ Global setup
- ✅ Reports en múltiples formatos

**Ejecutar tests:**
```bash
npm run test:e2e:ui
```

**Ver últimos resultados:**
```bash
npm run test:e2e:report
```

🚀 **¡Happy Testing!**

