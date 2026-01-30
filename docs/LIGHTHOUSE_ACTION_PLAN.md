# 🎯 Plan de Acción - Optimización Lighthouse

**Basado en análisis de:** `http://localhost:5173/pymes-cercanas`  
**Fecha:** Enero 2025

---

## 📊 Resumen Ejecutivo

| Métrica | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| Performance | 89 | > 90 | -1 punto |
| Accessibility | 89 | > 95 | -6 puntos |
| Best Practices | 93 | > 90 | ✅ |
| SEO | 100 | > 95 | ✅ |

**Ahorro potencial:** ~8,590 KiB de JavaScript no usado

---

## 🚀 Acciones Inmediatas (Quick Wins)

### 1. ✅ Verificar `lang` attribute dinámico
**Estado:** `lang="es"` ya está en `index.html`, pero puede necesitar actualización dinámica

**Acción:**
```tsx
// En App.tsx o main.tsx
import { useTranslation } from 'react-i18next';

useEffect(() => {
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

**Impacto:** +2-3 puntos en Accessibility  
**Tiempo:** 5 minutos

---

### 2. ⚠️ Optimizar Sentry (cargar solo en producción)
**Ahorro:** 1,680 KiB

**Acción:**
```typescript
// En src/main.tsx
if (import.meta.env.PROD) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({ /* config */ });
  });
}
```

**Impacto:** +3-5 puntos en Performance  
**Tiempo:** 15 minutos

---

### 3. ⚠️ Optimizar date-fns locales
**Ahorro:** 200 KiB

**Acción:**
```typescript
// Buscar y reemplazar imports de date-fns
// Antes:
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Después:
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
```

**Impacto:** +1 punto en Performance  
**Tiempo:** 10 minutos

---

### 4. ⚠️ Agregar nombres accesibles a modales
**Impacto:** +2-3 puntos en Accessibility

**Acción:**
```tsx
// En todos los modales (UpgradeModal, BookingModal, etc.)
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Título</h2>
  <p id="modal-description">Descripción</p>
</div>
```

**Tiempo:** 30 minutos

---

## 📋 Acciones de Mediano Plazo

### 5. Verificar Tree Shaking de Vite
**Ahorro potencial:** 8,590 KiB total

**Acción:**
1. Verificar `vite.config.ts` tiene optimizaciones habilitadas
2. Revisar que `build.rollupOptions.output.manualChunks` esté configurado
3. Verificar que los imports sean tree-shakeable

**Tiempo:** 1 hora

---

### 6. Lazy load react-datepicker
**Ahorro:** 697 KiB

**Acción:**
```tsx
const DatePicker = lazy(() => import('react-datepicker'));
```

**Tiempo:** 15 minutos

---

### 7. Corregir orden de headings
**Impacto:** +1-2 puntos en Accessibility

**Acción:**
- Revisar todas las páginas
- Asegurar orden lógico: h1 → h2 → h3
- No saltar niveles

**Tiempo:** 1 hora

---

## 📝 Checklist de Implementación

### Quick Wins (30 minutos total)
- [ ] Verificar/actualizar `lang` attribute dinámicamente
- [ ] Optimizar Sentry (cargar solo en producción)
- [ ] Optimizar date-fns locales
- [ ] Agregar nombres accesibles a modales principales

### Mediano Plazo (2-3 horas)
- [ ] Verificar tree shaking de Vite
- [ ] Lazy load react-datepicker
- [ ] Corregir orden de headings
- [ ] Agregar skip links focusables

### Largo Plazo (Opcional)
- [ ] Optimizar imágenes de Firebase Storage
- [ ] Implementar service worker para cache
- [ ] Configurar CDN para assets estáticos

---

## 🎯 Resultados Esperados

Después de implementar las acciones inmediatas:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Performance | 89 | 92-94 | +3-5 puntos |
| Accessibility | 89 | 92-94 | +3-5 puntos |
| JavaScript Size | 26,231 KiB | ~24,000 KiB | -2,231 KiB |
| Unused JS | 8,590 KiB | ~6,000 KiB | -2,590 KiB |

---

## 📚 Documentación Relacionada

- `docs/LIGHTHOUSE_ANALYSIS.md` - Análisis detallado
- `docs/LIGHTHOUSE_RESULTS.md` - Resultados y recomendaciones
- `docs/DEPLOY_VERIFICATION.md` - Verificación de deploy

---

**Estado:** ✅ **PLAN LISTO PARA IMPLEMENTACIÓN**

