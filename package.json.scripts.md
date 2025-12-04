# 📜 Scripts NPM - AgendaWeb

## Scripts de Testing con Playwright

Agregar estos scripts a tu `package.json`:

```json
{
  "scripts": {
    // ... scripts existentes ...
    
    // ============ PLAYWRIGHT E2E TESTING ============
    
    // Ejecutar todos los tests
    "test:e2e": "playwright test",
    
    // Tests en modo headless (CI)
    "test:e2e:ci": "playwright test --reporter=html,json,junit",
    
    // Tests con UI (debugging visual)
    "test:e2e:ui": "playwright test --ui",
    
    // Tests en modo debug
    "test:e2e:debug": "playwright test --debug",
    
    // Tests solo en Chrome
    "test:e2e:chrome": "playwright test --project=chromium",
    
    // Tests solo en Firefox
    "test:e2e:firefox": "playwright test --project=firefox",
    
    // Tests solo en Safari (webkit)
    "test:e2e:safari": "playwright test --project=webkit",
    
    // Tests en móviles
    "test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",
    
    // Detector de tests flaky (ejecutar cada test 10 veces)
    "test:e2e:flaky": "playwright test --repeat-each=10 --retries=0",
    
    // Generar report HTML
    "test:e2e:report": "playwright show-report",
    
    // Actualizar snapshots
    "test:e2e:update-snapshots": "playwright test --update-snapshots",
    
    // Instalar browsers de Playwright
    "test:e2e:install": "playwright install --with-deps",
    
    // Codegen - Grabar tests automáticamente
    "test:e2e:codegen": "playwright codegen http://localhost:5173",
    
    // Trace viewer
    "test:e2e:trace": "playwright show-trace",
    
    // ============ COMBINED ============
    
    // Ejecutar unit tests + e2e tests
    "test:all": "npm run test && npm run test:e2e",
    
    // CI pipeline completo
    "test:ci": "npm run test && npm run test:e2e:ci"
  }
}
```

## 🎯 Uso de Scripts

### Desarrollo Local

```bash
# Tests con UI visual (RECOMENDADO para desarrollo)
npm run test:e2e:ui

# Tests en modo debug (paso a paso)
npm run test:e2e:debug

# Tests normales
npm run test:e2e

# Ver último report
npm run test:e2e:report
```

### Debugging

```bash
# Grabar tests automáticamente
npm run test:e2e:codegen

# Ver trace de un test
npm run test:e2e:trace test-results/trace.zip

# Detectar tests flaky (ejecutar 10 veces)
npm run test:e2e:flaky
```

### CI/CD

```bash
# Pipeline de integración continua
npm run test:ci

# Solo E2E en CI
npm run test:e2e:ci
```

### Browsers Específicos

```bash
# Solo Chrome
npm run test:e2e:chrome

# Solo Firefox
npm run test:e2e:firefox

# Solo Safari
npm run test:e2e:safari

# Solo móviles
npm run test:e2e:mobile
```

## 📝 Scripts Adicionales Recomendados

```json
{
  "scripts": {
    // Limpiar resultados de tests
    "test:clean": "rm -rf test-results playwright-report",
    
    // Tests de accesibilidad
    "test:a11y": "playwright test tests/e2e/accessibility.spec.ts",
    
    // Tests de animaciones
    "test:animations": "playwright test tests/e2e/animations.spec.ts",
    
    // Tests de un archivo específico
    "test:file": "playwright test",
    
    // Tests con headed mode (ver navegador)
    "test:headed": "playwright test --headed",
    
    // Tests con slow-mo para ver paso a paso
    "test:slow": "playwright test --headed --slow-mo=1000"
  }
}
```

## 🔧 Variables de Entorno para Tests

Crear `.env.test`:

```env
# Credenciales de usuario de prueba
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test123456

# Credenciales de admin de prueba
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=Admin123456

# Base URL (override)
PLAYWRIGHT_BASE_URL=http://localhost:5173

# Timeout general
PLAYWRIGHT_TIMEOUT=30000
```

## 📊 Outputs de Reports

| Script | Output | Ubicación |
|--------|--------|-----------|
| `test:e2e` | HTML Report | `playwright-report/index.html` |
| | JSON Results | `playwright-report/results.json` |
| | JUnit XML | `playwright-report/junit.xml` |
| | Screenshots | `test-results/screenshots/` |
| | Videos | `test-results/videos/` |
| | Traces | `test-results/traces/` |

## 🚀 Workflow Recomendado

### Durante Desarrollo:
```bash
1. npm run test:e2e:ui        # Desarrollar tests
2. npm run test:e2e:debug     # Debugging
3. npm run test:e2e           # Verificar
```

### Antes de Commit:
```bash
npm run test:all              # Unit + E2E
```

### En CI/CD:
```bash
npm run test:ci               # Pipeline completo
```

### Detectar Problemas:
```bash
npm run test:e2e:flaky        # Buscar tests inestables
npm run test:e2e:trace        # Analizar failures
```

