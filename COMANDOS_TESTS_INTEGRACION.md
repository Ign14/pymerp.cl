# 🧪 Comandos para Ejecutar Tests de Integración

## 📋 Tests de Integración Dashboard → Página Pública

Se han creado tests E2E que verifican la integración completa entre:
- `/dashboard/services/settings` (Dashboard)
- `/demo10` (Página Pública)

---

## ✅ Tests Creados

**Archivo:** `tests/e2e/barberias-dashboard-integration.spec.ts`

### Tests Incluidos:

1. **`debe cargar la página de configuración de servicios`**
   - Verifica que `/dashboard/services/settings` carga correctamente
   - Verifica que hay campos de configuración visibles

2. **`debe poder cambiar colores en el dashboard y verlos en la página pública`**
   - Verifica que los campos de color existen y son editables
   - (Nota: Requiere mocks avanzados para guardar y leer)

3. **`debe aplicar la configuración de apariencia en la página pública`**
   - Verifica que `/demo10` aplica estilos correctamente
   - Verifica que los service cards tienen estilos aplicados

4. **`debe aplicar colores del calendario en el modal de booking`**
   - Verifica que el modal de booking se abre
   - Verifica que el calendario tiene estilos aplicados

5. **`debe mantener la configuración entre dashboard y página pública`**
   - Verifica navegación entre dashboard y página pública
   - Verifica que la configuración se mantiene consistente

---

## 🚀 Comandos para Ejecutar

### **Opción 1: Ejecutar todos los tests de integración**

```bash
npx playwright test barberias-dashboard-integration
```

### **Opción 2: Ejecutar un test específico**

```bash
# Test de carga de configuración
npx playwright test barberias-dashboard-integration -g "debe cargar la página de configuración"

# Test de aplicación de estilos
npx playwright test barberias-dashboard-integration -g "debe aplicar la configuración"
```

### **Opción 3: Ejecutar con UI interactivo (RECOMENDADO)**

```bash
npm run test:e2e:ui
# Luego seleccionar "barberias-dashboard-integration.spec.ts"
```

### **Opción 4: Ejecutar en modo debug**

```bash
npx playwright test barberias-dashboard-integration --debug
```

### **Opción 5: Ejecutar solo en Chrome**

```bash
npx playwright test barberias-dashboard-integration --project=chromium
```

### **Opción 6: Ejecutar con browser visible**

```bash
npx playwright test barberias-dashboard-integration --headed
```

---

## 📝 Ejecutar Todos los Tests de Barberías

Para ejecutar tanto los tests funcionales como los de integración:

```bash
# Tests funcionales (barberias.spec.ts)
npx playwright test barberias

# Tests de integración (barberias-dashboard-integration.spec.ts)
npx playwright test barberias-dashboard-integration

# Ambos
npx playwright test barberias barberias-dashboard-integration
```

---

## 🔍 Ver Lista de Tests

```bash
# Listar todos los tests de integración
npx playwright test barberias-dashboard-integration --list

# Listar todos los tests de barberías
npx playwright test barberias --list
```

---

## ⚠️ Notas Importantes

1. **Autenticación E2E:**
   - Los tests usan `localStorage.setItem('e2e:user', 'founder')` para autenticación
   - El usuario `'founder'` es un entrepreneur con acceso al dashboard

2. **Mocks de Firebase:**
   - Los tests usan `setupFirebaseMocks(page)` para mockear Firestore
   - Los mocks actuales incluyen datos básicos para `company-services`

3. **Limitations:**
   - Los tests actuales verifican que los campos existen y se aplican
   - Para tests completos de guardado/carga, se necesitarían mocks más avanzados
   - Los tests verifican la integración visual, no el flujo completo de guardado

4. **Servidor de Desarrollo:**
   - Los tests requieren que el servidor esté corriendo
   - Playwright configurado para usar `http://localhost:5173`

---

## 🎯 Próximos Pasos (Opcional)

Para tests más completos, se podrían agregar:

1. **Tests de guardado real:**
   - Mockear `setCompanyAppearance` para simular guardado
   - Verificar que los cambios se reflejan inmediatamente

2. **Tests de todas las configuraciones:**
   - Verificar cada campo individual (colores, fuentes, calendario)
   - Verificar combinaciones de configuraciones

3. **Tests de validación:**
   - Verificar que valores inválidos se rechazan
   - Verificar que valores por defecto se aplican correctamente
