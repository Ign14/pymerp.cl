# 🔍 Diagnóstico: Estilos CSS no se aplican en URLs Públicas (npm run dev)

## 📊 Problema Reportado

**Síntoma:** Al ejecutar `npm run dev`, las URLs públicas (como `http://localhost:5174/micarritodecomida`) **no toman los estilos CSS** correctamente.

---

## 🔎 Análisis Realizado

### 1. **Servidor de Desarrollo**
✅ **Estado:** Corriendo en `http://localhost:5174/` (puerto 5173 estaba ocupado)
✅ **Vite:** Funcionando correctamente

### 2. **Importación de CSS**
✅ **Verificado en `src/main.tsx`:**
```typescript
import './index.css'
import './styles/marquee.css'
import './styles/background-optimization.css'
import './styles/horizontal-carousel.css'
```

✅ **Tailwind CSS** configurado en `index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. **Clase `public-page-mode`**
✅ **Aplicada correctamente** en `PublicPage.tsx`:
```typescript
useEffect(() => {
  document.body.classList.add('public-page-mode');
  return () => {
    document.body.classList.remove('public-page-mode');
  };
}, []);
```

### 4. **Estilos Personalizados vs Tailwind**

⚠️ **PROBLEMA IDENTIFICADO:**

Los layouts públicos personalizados (como `RestaurantesComidaRapidaPublicLayout`) usan **estilos inline extensivos** que tienen **mayor prioridad** que las clases de Tailwind CSS.

**Ejemplo en `RestaurantesComidaRapidaPublicLayout.tsx`:**
```typescript
const heroCardBg = toRgba(appearance?.menu_hero_card_color, appearance?.menu_hero_card_opacity);
const heroLogoCardBg = toRgba(appearance?.menu_hero_logo_card_color, appearance?.menu_hero_logo_card_opacity);

// Luego se aplica como:
<div style={{ background: heroCardBg }}>
```

---

## 🎯 Posibles Causas del Problema

### **Causa #1: Datos de Appearance no cargados**

Si los datos de `appearance` no se cargan desde Firestore, los colores personalizados serán `undefined` y los estilos no se aplicarán.

**Verificación:**
```typescript
// En PublicPage.tsx
useEffect(() => {
  const loadAppearance = async () => {
    const appearanceData = await getCompanyAppearance(company.id);
    // Si esto falla o retorna null, los estilos no se aplican
  }
}, [company.id]);
```

---

### **Causa #2: Hot Module Replacement (HMR) no actualiza estilos inline**

Los **estilos inline** calculados dinámicamente pueden no actualizarse correctamente en HMR durante el desarrollo.

**Diferencia:**
- **Tailwind/CSS puro:** ✅ HMR funciona perfectamente
- **Estilos inline dinámicos:** ⚠️ Pueden no actualizarse hasta reload completo

---

### **Causa #3: Async rendering y FOUC (Flash of Unstyled Content)**

Los datos de appearance se cargan **asíncronamente** desde Firestore:

```typescript
// Secuencia de carga:
1. Componente monta → Sin appearance data
2. Muestra contenido sin estilos (FOUC)
3. Appearance data carga → Actualiza
4. Re-render con estilos ← Puede ser imperceptible o causar parpadeo
```

---

### **Causa #4: Conflicto entre estilos inline y Tailwind**

Los estilos inline **sobrescriben** las clases de Tailwind:

```html
<!-- Esto NO funcionará como esperado: -->
<div class="bg-blue-500" style="background-color: rgba(0,0,0,0)">
  <!-- style inline gana sobre clase Tailwind -->
</div>
```

---

## ✅ SOLUCIONES

### **Solución #1: Verificar que los datos se están cargando**

**Agregar logging temporal para debug:**

```typescript
// En PublicPage.tsx, después de cargar appearance
useEffect(() => {
  if (appearance) {
    console.log('🎨 Appearance loaded:', {
      menu_hero_card_color: appearance.menu_hero_card_color,
      menu_hero_card_opacity: appearance.menu_hero_card_opacity,
      card_color: appearance.card_color,
      text_color: appearance.text_color,
    });
  } else {
    console.warn('⚠️ Appearance is null or undefined');
  }
}, [appearance]);
```

**Cómo usar:**
1. Abre DevTools Console (F12)
2. Navega a la URL pública
3. Verifica si ves el log con los datos

---

### **Solución #2: Forzar re-render después de cargar appearance**

Si los estilos no se actualizan, puede ser necesario forzar un re-render:

```typescript
// En PublicPage.tsx
const [appearanceLoaded, setAppearanceLoaded] = useState(false);

useEffect(() => {
  const loadData = async () => {
    const appearanceData = await getCompanyAppearance(company.id);
    setAppearance(appearanceData);
    // Forzar re-render después de un pequeño delay
    setTimeout(() => setAppearanceLoaded(true), 100);
  };
  loadData();
}, [company.id]);
```

---

### **Solución #3: Usar valores por defecto mientras carga**

Evitar FOUC proporcionando valores por defecto:

```typescript
// En RestaurantesComidaRapidaPublicLayout.tsx
const heroCardBg =
  isIOS || !appearance?.menu_hero_card_opacity
    ? 'rgba(0, 0, 0, 0)'
    : toRgba(
        appearance?.menu_hero_card_color || '#000000', // ← Default
        appearance?.menu_hero_card_opacity ?? 0.8       // ← Default
      );
```

---

### **Solución #4: Hard Refresh en Desarrollo**

Durante el desarrollo, el HMR puede no actualizar estilos inline:

**Solución inmediata:**
1. **Ctrl + Shift + R** (Windows/Linux)
2. **Cmd + Shift + R** (Mac)
3. O hacer click derecho → "Empty Cache and Hard Reload"

---

### **Solución #5: Mostrar Loading State**

Mostrar un loading state mientras se cargan los datos:

```typescript
// En PublicPage.tsx
if (loading || !appearance) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
```

---

## 🔧 SOLUCIÓN RÁPIDA RECOMENDADA

### **Paso 1: Verificar datos en Console**

```typescript
// Agregar en PublicPage.tsx línea ~200, después de cargar appearance
useEffect(() => {
  console.group('🎨 Public Page Styles Debug');
  console.log('Company:', company?.name);
  console.log('Appearance loaded:', !!appearance);
  console.log('Theme:', theme);
  if (appearance) {
    console.log('Colors:', {
      card: appearance.card_color,
      text: appearance.text_color,
      button: appearance.button_color,
      hero_card: appearance.menu_hero_card_color,
    });
  }
  console.groupEnd();
}, [company, appearance, theme]);
```

---

### **Paso 2: Verificar Firestore Rules**

Asegurar que las reglas de Firestore permiten leer `company_appearance`:

```javascript
// firestore.rules
match /company_appearance/{appearanceId} {
  allow read: if true; // Lectura pública necesaria para páginas públicas
  // ... resto de reglas
}
```

---

### **Paso 3: Verificar Network Tab**

1. Abrir DevTools → Network Tab
2. Navegar a URL pública
3. Verificar requests a Firestore
4. Buscar error 403 (permisos) o 404 (no existe)

---

### **Paso 4: Comparar Dev vs Preview**

```bash
# Terminal 1: Dev server
npm run dev
# → http://localhost:5174/micarritodecomida

# Terminal 2: Build y Preview
npm run build
npm run preview
# → http://localhost:4173/micarritodecomida
```

**Si funciona en Preview pero NO en Dev:**
- Problema con HMR
- Solución: Hard refresh (Ctrl+Shift+R)

**Si NO funciona en ninguno:**
- Problema con datos de Firestore
- Verificar que `appearance` se carga correctamente

---

## 🐛 DEBUG SCRIPT

Agrega esto **temporalmente** en `PublicPage.tsx` para debug:

```typescript
// Después de los useEffect existentes (~línea 200)
useEffect(() => {
  const debugTimeout = setTimeout(() => {
    console.group('🐛 DEBUG: Public Page Styles');
    
    // 1. Verificar body classes
    console.log('Body classes:', document.body.className);
    console.log('Has public-page-mode:', document.body.classList.contains('public-page-mode'));
    
    // 2. Verificar appearance data
    console.log('Appearance data:', appearance);
    console.log('Appearance loaded:', !!appearance);
    
    // 3. Verificar theme
    console.log('Theme:', theme);
    
    // 4. Verificar si hay elementos con estilos inline
    const elementsWithInlineStyles = document.querySelectorAll('[style]');
    console.log('Elements with inline styles:', elementsWithInlineStyles.length);
    
    // 5. Verificar computed styles de un elemento
    const mainContainer = document.querySelector('.background-container');
    if (mainContainer) {
      const computed = window.getComputedStyle(mainContainer);
      console.log('Main container computed styles:', {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
      });
    }
    
    console.groupEnd();
  }, 1000); // Esperar 1 segundo después de mount
  
  return () => clearTimeout(debugTimeout);
}, [appearance, theme]);
```

---

## 📝 CHECKLIST DE VERIFICACIÓN

Cuando los estilos no se aplican, verificar:

- [ ] **Dev server corriendo:** `npm run dev` sin errores
- [ ] **Console sin errores:** Abrir DevTools, verificar Console
- [ ] **Datos de appearance cargados:** Ver log en console
- [ ] **Reglas de Firestore correctas:** Permitir lectura pública
- [ ] **Hard refresh realizado:** Ctrl+Shift+R
- [ ] **Network Tab sin errores 403/404:** Firestore requests OK
- [ ] **Comparar con preview:** `npm run build && npm run preview`

---

## 🎯 SOLUCIÓN DEFINITIVA

Si el problema persiste después de verificar todo lo anterior, puede ser necesario **refactorizar** los layouts para usar **CSS Modules o styled-components** en lugar de estilos inline dinámicos.

**Alternativa:**
Usar **CSS Custom Properties (variables CSS)** que se actualizan reactivamente:

```typescript
// Establecer variables CSS en el root
useEffect(() => {
  if (appearance) {
    document.documentElement.style.setProperty('--hero-card-bg', heroCardBg);
    document.documentElement.style.setProperty('--card-color', appearance.card_color);
    // ... más variables
  }
}, [appearance]);
```

```css
/* En CSS */
.hero-card {
  background-color: var(--hero-card-bg);
}
```

---

## 🚀 PRÓXIMOS PASOS

1. **Ejecutar debug script** (ver arriba)
2. **Verificar console logs** para identificar el problema exacto
3. **Reportar hallazgos:**
   - ¿Appearance se carga? (ver console)
   - ¿Hay errores en Network Tab?
   - ¿Funciona en preview pero no en dev?

Con esta información, podemos aplicar la solución específica correcta.

---

**Generado:** 2026-02-02  
**Contexto:** Problema de estilos CSS en páginas públicas durante desarrollo
