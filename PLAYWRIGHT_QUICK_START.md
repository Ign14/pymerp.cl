# 🎭 Playwright Quick Start

## ⚡ Setup en 3 Pasos

### 1️⃣ Instalar Browsers

```bash
npx playwright install --with-deps
```

O solo Chromium (más rápido):
```bash
npx playwright install chromium
```

### 2️⃣ Ejecutar Tests

```bash
# UI Mode (RECOMENDADO - ver tests en tiempo real)
npm run test:e2e:ui

# Modo normal
npm run test:e2e

# Modo debug (paso a paso)
npm run test:e2e:debug
```

### 3️⃣ Ver Resultados

```bash
# Ver report HTML
npm run test:e2e:report
```

---

## 🎯 Tests Incluidos

### ✅ Tests Básicos
- ✓ Landing page carga correctamente
- ✓ Navegación al login
- ✓ Formularios funcionan
- ✓ Modales abren y cierran

### ✅ Tests de Página Pública
- ✓ Información de empresa se muestra
- ✓ Click en WhatsApp funciona
- ✓ Preview de imágenes
- ✓ Carrito de compras

### ✅ Tests de Accesibilidad
- ✓ Audit WCAG 2.1 AA con axe-core
- ✓ Navegación por teclado
- ✓ Skip links funcionales
- ✓ Focus trap en modales
- ✓ Alt text en imágenes

### ✅ Tests de Animaciones
- ✓ Modales con fade + scale
- ✓ Micro-interacciones en botones
- ✓ Cards animados
- ✓ Drawer del carrito

---

## 🐛 Debugging de Tests Flaky

### Detectar Tests Flaky

```bash
# Ejecutar cada test 10 veces
npm run test:e2e:flaky
```

**Output:**
```
✓ test-estable (10/10 passed)
❌ test-flaky (7/10 passed) ← FLAKY!

⚠️ FLAKY TEST DETECTED: test-flaky (30% failure rate)
```

### Ver Trace de Failure

```bash
# Ejecutar con trace
npx playwright test --trace on

# Ver trace
npx playwright show-trace test-results/trace.zip
```

### Debugging Step-by-Step

```bash
# Modo debug (pausa en cada paso)
npm run test:e2e:debug
```

---

## 📸 Screenshots

### Automáticos (en Failures)

Configurado automáticamente:
- Se guardan en: `test-results/screenshots/`
- Full page screenshots
- Con nombre del test y browser

### Manuales

```typescript
// En tu test
await page.screenshot({ 
  path: 'test-results/screenshots/custom.png',
  fullPage: true 
});
```

---

## 🎬 Grabar Tests Automáticamente

```bash
# Codegen - graba tus acciones y genera código
npm run test:e2e:codegen
```

1. Se abre navegador
2. Haz tus acciones (click, fill, etc.)
3. El código se genera automáticamente
4. Copia y pega en tu test

---

## 🔍 Comandos Útiles

```bash
# Tests con navegador visible
npm run test:e2e:headed

# Solo Chrome
npm run test:e2e:chrome

# Ver todos los comandos
npm run
```

---

## 📊 Ver Resultados

### HTML Report
```bash
npm run test:e2e:report
```

Incluye:
- ✅ Summary de tests
- ✅ Screenshots de failures
- ✅ Videos (si fallan)
- ✅ Traces
- ✅ Duración de cada test

### Screenshots
```
test-results/screenshots/
├── test-name-chromium.png
├── login-error-firefox.png
└── debug/
    └── debug-*.png
```

### Videos
```
test-results/videos/
└── test-name-chromium.webm
```

---

## ⚙️ Configuración

### playwright.config.ts

**Features activadas:**
- ✅ Retry: 1-2 intentos automáticos
- ✅ Screenshots: Solo en failures
- ✅ Video: Solo en failures
- ✅ Trace: En primer retry
- ✅ Parallel: Ejecución paralela
- ✅ Multiple browsers: Chrome, Firefox, Safari, Mobile

### Scripts NPM

Ver archivo completo: `package.json.scripts.md`

Principales:
- `test:e2e` - Ejecutar tests
- `test:e2e:ui` - UI mode
- `test:e2e:debug` - Debug mode
- `test:e2e:flaky` - Detector flaky
- `test:e2e:report` - Ver report

---

## 🚀 Workflow Recomendado

### Durante Desarrollo

```bash
1. Crear test: npm run test:e2e:codegen
2. Ejecutar: npm run test:e2e:ui
3. Debug: npm run test:e2e:debug
4. Verificar: npm run test:e2e
```

### Antes de Commit

```bash
# Tests completos
npm run test:all

# O solo E2E
npm run test:e2e
```

### Buscar Problemas

```bash
# Detectar flaky tests
npm run test:e2e:flaky

# Ver traces
npx playwright show-trace test-results/trace.zip

# Ver screenshots
open test-results/screenshots/
```

---

## 📚 Documentación Completa

Ver: `PLAYWRIGHT_SETUP.md`

---

## ✅ Estado

- ✅ Playwright instalado
- ✅ Config completa
- ✅ Tests de ejemplo
- ✅ Debugging configurado
- ✅ Screenshots automáticos
- ✅ Flaky detector
- ✅ Helpers utilities
- ✅ Auth fixtures

**¡Listo para testing!** 🎉

```bash
npm run test:e2e:ui
```

