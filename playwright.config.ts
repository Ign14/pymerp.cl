import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * 
 * Configuración completa para E2E testing con:
 * - Retry automático para tests flaky
 * - Screenshots en failures
 * - Trace on first retry
 * - Múltiples browsers
 * - Parallel execution
 */

export default defineConfig({
  // Directorio de tests
  testDir: './tests/e2e',
  
  // Directorio de componentes (si usas component testing)
  // testDir: './tests',
  
  // Timeout por test (30 segundos)
  timeout: 30 * 1000,
  
  // Espera máxima para expect() assertions (5 segundos)
  expect: {
    timeout: 5000,
  },
  
  // Configuración para tests flaky
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  
  // Retry automático para tests que fallan
  // En CI: 2 retries, en local: 1 retry
  retries: process.env.CI ? 2 : 1,
  
  // Workers para ejecución paralela
  // En CI: 1 worker, en local: usa todos los cores disponibles
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    // HTML report (abre automáticamente en failures)
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'on-failure' 
    }],
    
    // JSON para CI/CD
    ['json', { 
      outputFile: 'playwright-report/results.json' 
    }],
    
    // List para consola
    ['list', { 
      printSteps: true 
    }],
    
    // JUnit para integración con CI
    ['junit', { 
      outputFile: 'playwright-report/junit.xml' 
    }],
  ],
  
  // Configuración global de uso
  use: {
    // Base URL de la aplicación
    baseURL: 'http://localhost:5173',
    
    // Trace on first retry (para debugging)
    trace: 'on-first-retry',
    
    // Screenshots automáticos
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video solo en retry
    video: 'retain-on-failure',
    
    // Viewport por defecto
    viewport: { width: 1280, height: 720 },
    
    // Ignorar errores HTTPS en desarrollo
    ignoreHTTPSErrors: true,
    
    // Timeout para acciones (10 segundos)
    actionTimeout: 10 * 1000,
    
    // Timeout para navegación
    navigationTimeout: 30 * 1000,
    
    // Locale
    locale: 'es-CL',
    
    // Timezone
    timezoneId: 'America/Santiago',
    
    // User agent personalizado (opcional)
    // userAgent: 'AgendaWeb E2E Tests',
    
    // Permisos
    permissions: ['geolocation'],
    
    // Context options
    contextOptions: {
      // Reducir motion para tests más estables
      reducedMotion: 'reduce',
    },
  },

  // Proyectos (diferentes browsers y dispositivos)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configuración específica para Chrome
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'] 
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'] 
      },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'] 
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'] 
      },
    },

    // Tablet
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro']
      },
    },
  ],

  // Web Server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Output folders
  outputDir: 'test-results',
  
  // Snapshot path template
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  
  // Global setup/teardown
  globalSetup: './tests/global-setup.ts',
  
  // Metadata para reports
  metadata: {
    project: 'AgendaWeb',
    version: '1.0.0',
    environment: process.env.CI ? 'CI' : 'local',
  },
});
