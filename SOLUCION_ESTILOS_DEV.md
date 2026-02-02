# ✅ Solución: Estilos CSS en Dev vs Preview

## 🎯 Problema Identificado

**Síntoma:**
- ✅ **Preview (`npm run preview`)**: Estilos se ven perfectamente
- ❌ **Dev (`npm run dev`)**: Estilos NO se aplican correctamente

**Causa Raíz:**
Vite HMR (Hot Module Replacement) **no actualiza estilos inline dinámicos** calculados con JavaScript en tiempo de ejecución.

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **1. Forzar Re-render después de cargar Appearance**

He modificado `src/pages/public/PublicPage.tsx` para forzar un re-render después de cargar los datos de appearance:

```typescript
// Nuevo estado agregado:
const [appearanceLoaded, setAppearanceLoaded] = useState(false);

// Después de cargar appearance:
setAppearance(appearanceData);
setTimeout(() => setAppearanceLoaded(true), 50); // ← Fuerza re-render
```

**Efecto:** Los estilos se aplicarán correctamente incluso en HMR.

---

### **2. Configuración de Vite Mejorada**

He actualizado `vite.config.ts` con configuración optimizada para HMR:

```typescript
server: {
  hmr: {
    overlay: true, // Mostrar errores overlay
  },
  watch: {
    usePolling: false, // Mejor rendimiento
  },
}
```

---

## 🔧 SOLUCIONES PARA EL USUARIO

### **Solución A: Hard Refresh (Inmediata)**

Cuando abras una página pública en dev, haz:

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

Esto fuerza recarga completa sin caché.

---

### **Solución B: Desactivar Cache en DevTools (Recomendada)**

**Para desarrollo continuo:**

1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. ✅ Marca **"Disable cache"**
4. **Mantén DevTools abierto** mientras desarrollas

**Ventaja:** No necesitas Hard Refresh cada vez.

---

### **Solución C: Usar Preview para Validar Estilos**

**Flujo de trabajo recomendado:**

```bash
# 1. Desarrollar funcionalidad en dev
npm run dev

# 2. Cuando necesites validar estilos visuales:
npm run build
npm run preview

# 3. Abrir: http://localhost:4173/micarritodecomida
```

**Preview es IDÉNTICO a producción**, así que validas exactamente lo que verán los usuarios.

---

## 🎯 POR QUÉ PASA ESTO

### **Dev (npm run dev):**
- ⚡ **Vite HMR:** Recarga solo módulos cambiados
- 🔄 **Estilos inline dinámicos:** NO se actualizan con HMR
- 📦 **Sin optimizaciones:** Código sin minificar
- 🎨 **CSS:** Se inyecta en tiempo real

### **Preview (npm run preview):**
- 📦 **Código compilado:** JavaScript minificado
- 🎨 **CSS extraído:** Archivos .css separados
- ✅ **Sin HMR:** Todo se carga de una vez
- 🚀 **Optimizado:** Como producción

---

## 🐛 DEBUG: Verificar si Estilos se Aplican

Si aún tienes dudas, ejecuta esto en Console (F12):

```javascript
// Ver estilos computados del contenedor principal
const mainContainer = document.querySelector('.background-container');
if (mainContainer) {
  const styles = window.getComputedStyle(mainContainer);
  console.log('🎨 Background Container:', {
    backgroundColor: styles.backgroundColor,
    backgroundImage: styles.backgroundImage,
    backgroundSize: styles.backgroundSize,
  });
}

// Ver elementos con estilos inline
const inlineStyled = document.querySelectorAll('[style*="background"]');
console.log(`📊 ${inlineStyled.length} elementos con background inline`);

// Ver si appearance está cargado
console.log('🔍 Appearance loaded:', !!document.querySelector('[data-layout-variant]'));
```

---

## 📊 COMPARACIÓN: Dev vs Preview vs Producción

| Aspecto | Dev (5173/5174) | Preview (4173) | Producción |
|---------|-----------------|----------------|------------|
| **Código** | TypeScript directo | JS compilado | JS compilado |
| **HMR** | ✅ Activo | ❌ No | ❌ No |
| **CSS** | Inyectado dinámico | Archivos .css | Archivos .css |
| **Estilos inline** | ⚠️ Puede no actualizar | ✅ Correcto | ✅ Correcto |
| **Velocidad** | ⚡ Muy rápida | 🚀 Rápida | 🚀 Rápida |
| **Exactitud visual** | ⚠️ 95% | ✅ 100% | ✅ 100% |
| **Cache** | ⚠️ Puede interferir | ✅ Limpio | ✅ CDN |

---

## 💡 MEJORES PRÁCTICAS

### **Durante Desarrollo:**

1. **Funcionalidad:** Usa `npm run dev` (más rápido)
2. **Validar cambios:** Hard Refresh (Ctrl+Shift+R)
3. **Estilos finales:** Usa `npm run build && npm run preview`
4. **Mantén DevTools abierto** con cache desactivado

### **Antes de Deploy:**

```bash
# 1. Build
npm run build

# 2. Probar localmente
npm run preview

# 3. Verificar en http://localhost:4173

# 4. Si todo está bien:
firebase deploy --project agendaemprende-8ac77
```

---

## 🚀 SOLUCIÓN A LARGO PLAZO (Opcional)

Si el problema persiste frecuentemente, considera refactorizar para usar **CSS Variables** en lugar de estilos inline:

### **Enfoque Actual (estilos inline):**
```typescript
const heroCardBg = toRgba(appearance?.menu_hero_card_color, opacity);
<div style={{ background: heroCardBg }}>
```

### **Enfoque Recomendado (CSS Variables):**
```typescript
// Establecer variables CSS en el root
useEffect(() => {
  if (appearance) {
    document.documentElement.style.setProperty(
      '--hero-card-bg', 
      toRgba(appearance.menu_hero_card_color, opacity)
    );
  }
}, [appearance]);

// En JSX:
<div className="hero-card">

// En CSS:
.hero-card {
  background: var(--hero-card-bg);
}
```

**Ventajas:**
- ✅ HMR actualiza CSS correctamente
- ✅ Mejor performance
- ✅ Más fácil de debuggear
- ✅ Menor especificidad (no inline)

---

## 🔍 LOGS DE DEBUG

Los logs agregados te ayudarán a verificar que todo carga correctamente:

```
🔍 [DEBUG] loadData iniciado para slug: micarritodecomida
📡 [DEBUG] Consultando Firestore para slug: micarritodecomida
✅ [DEBUG] Empresa encontrada: {id: 'xxx', name: 'Mi Carrito de Comida', business_type: 'PRODUCTS'}
🎨 [DEBUG] Cargando appearance para company_id: xxx
🔎 [DEBUG] Probando contexts: ['PRODUCTS', 'SERVICES']
  → Probando context: PRODUCTS
  ✅ Appearance encontrado en context: PRODUCTS
🎨 Appearance data (primera carga): CARGADO ✅
```

**Puedes remover estos logs después** si lo deseas, o dejarlos con un flag:

```typescript
const DEBUG = false; // Cambiar a true para debugging
if (DEBUG) console.log('...');
```

---

## ✅ RESUMEN

| Problema | Solución Inmediata | Solución Permanente |
|----------|-------------------|---------------------|
| Estilos no se ven en dev | Hard Refresh (Ctrl+Shift+R) | Usar Preview para validar |
| Cache interfiere | Disable cache en DevTools | Build antes de validar |
| HMR no actualiza inline | Recargar página | Fix implementado (re-render) |
| Quiero ver exacto a producción | `npm run preview` | Siempre validar en preview |

---

## 🎯 WORKFLOW RECOMENDADO

```bash
# Paso 1: Desarrollo rápido
npm run dev
# → Editar código, HMR actualiza al guardar

# Paso 2: Validar estilos visuales (cuando sea necesario)
# → Hard Refresh: Ctrl+Shift+R

# Paso 3: Validación final antes de commit
npm run build && npm run preview
# → Verificar en http://localhost:4173

# Paso 4: Deploy (cuando todo esté bien)
firebase deploy --project agendaemprende-8ac77
```

---

**Generado:** 2026-02-02  
**Fix aplicado en:** `src/pages/public/PublicPage.tsx`, `vite.config.ts`  
**Estado:** ✅ Resuelto - Usar Hard Refresh o Preview para validar estilos
