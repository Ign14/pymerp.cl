# 🧪 Comandos para Ejecutar Tests - Barberías y Restaurantes

## 📋 Comandos Correctos para Ejecutar Manualmente

### **Tests E2E (Playwright):**

**IMPORTANTE:** Playwright está configurado para buscar tests en `./tests/e2e`.

**NOTA:** Los tests de restaurantes y barberías actualmente fallan porque las rutas `/productos-demo` y `/servicios-demo` son stubs simplificados que no implementan todas las funcionalidades. Estos tests requieren datos mockados completos o una página pública real.

#### **✅ COMANDO CORRECTO - Ejecutar Tests:**

```bash
# Tests de barberías
npx playwright test barberias

# Tests de restaurantes
npx playwright test restaurantes

# Ambos
npx playwright test barberias restaurantes

# Todos los tests E2E
npm run test:e2e

# UI interactivo (RECOMENDADO para desarrollo)
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug

# Con browser visible
npm run test:e2e:headed
```

#### **✅ COMANDO CORRECTO - Ver lista de tests:**

```bash
# Listar todos los tests disponibles
npx playwright test --list

# Listar tests de barberías
npx playwright test barberias --list

# Listar tests de restaurantes
npx playwright test restaurantes --list
```

---

### **Tests Unitarios (Vitest):**

```bash
# Todos los tests unitarios
npm run test

# Tests específicos de búsqueda
npm run test -- src/utils/__tests__/serviceSearch.test.ts
npm run test -- src/utils/__tests__/productSearch.test.ts

# Watch mode
npm run test:watch

# Con cobertura
npm run test:coverage
```

---

## 🚨 Problema Actual

**Los tests de restaurantes fallan porque:**
- La ruta `/productos-demo` apunta a `PublicProductsStub`, que es un componente stub simplificado
- Los tests esperan funcionalidades completas (búsqueda, paginación, fulfillment) que el stub no implementa
- Los tests necesitan datos mockados completos o usar una página pública real con slug

**Solución recomendada:**
1. Crear datos mockados completos en `e2e/fixtures/mockFirebase.ts` para una empresa de restaurantes
2. O modificar los tests para usar un slug real de una empresa de restaurantes existente
3. O implementar `PublicProductsStub` con todas las funcionalidades necesarias para los tests

---

## 📝 Ejemplos de Uso

### **Ejecutar tests de barberías:**
```bash
npx playwright test barberias
```

### **Ejecutar tests de restaurantes:**
```bash
npx playwright test restaurantes
```

### **Ver lista de tests sin ejecutar:**
```bash
npx playwright test barberias --list
npx playwright test restaurantes --list
```

### **Ejecutar solo en Chrome:**
```bash
npx playwright test barberias --project=chromium
```

### **Ejecutar con UI interactivo (RECOMENDADO):**
```bash
npm run test:e2e:ui
# Luego seleccionar los tests de barberías o restaurantes en la UI
```

---

## ✅ Verificación

Para verificar que los tests están correctamente ubicados:

```bash
# Listar todos los tests disponibles
npx playwright test --list

# Deberías ver:
# - barberias.spec.ts: 8 tests
# - restaurantes.spec.ts: 9 tests
```

---

## 🎯 Comandos Rápidos

**Para ejecutar AHORA:**

```bash
# Tests de barberías
npx playwright test barberias

# Tests de restaurantes  
npx playwright test restaurantes

# Ambos
npx playwright test barberias restaurantes
```
