# Implementación de Analytics y Métricas

## Descripción General

Sistema completo de analytics y monitoreo para AGENDAWEB, que incluye:

- **Google Analytics 4 (GA4)**: Tracking de eventos, conversiones y comportamiento de usuarios
- **Core Web Vitals**: Monitoreo de métricas de rendimiento (LCP, CLS, INP, FCP, TTFB)
- **Sentry Avanzado**: Tracking de errores con source maps, releases y contexto enriquecido
- **Dashboard de Métricas**: Visualización de analytics en tiempo real para administradores

## 🎯 Características Implementadas

### 1. Google Analytics 4

#### Configuración
- **Archivo**: `src/config/analytics.ts`
- **Inicialización**: Automática en `src/main.tsx`
- **Modo desarrollo**: Tracking deshabilitado automáticamente

#### Eventos Disponibles

**Categorías de Eventos:**
- `USER`: Login, registro, perfil
- `NAVIGATION`: Navegación, búsquedas
- `ENGAGEMENT`: Scroll, tiempo en página, clics
- `CONVERSION`: Reservas, órdenes, contacto WhatsApp
- `ERROR`: Errores de aplicación
- `BUSINESS`: Acciones de negocio (crear servicios, productos)

**Funciones de Tracking:**
```typescript
// Page views
trackPageView(path: string, title?: string)

// Eventos genéricos
trackEvent(action: string, params?: object)

// Conversiones con valor
trackConversion(action: string, value?: number, params?: object)

// Clics
trackClick(elementId: string, params?: object)

// E-commerce
trackAddToCart(product: object)
trackPurchase(transactionId: string, value: number, items: array)

// Timing/Performance
trackTiming(name: string, value: number, category?: string)

// Errores
trackError(error: Error, context?: object)
```

#### Eventos Implementados en PublicPage

| Acción | Tipo | Valor | Contexto |
|--------|------|-------|----------|
| Clic en WhatsApp | Conversión | - | company_id, company_name |
| Reserva de servicio | Conversión | service.price | service_id, service_name, company_id |
| Agregar al carrito | Clic | - | product_id, product_name, product_price |
| Completar orden | Conversión | total | product_count, total_items, company_id |

### 2. Core Web Vitals

#### Métricas Monitoreadas

| Métrica | Descripción | Umbral Bueno | Necesita Mejora | Pobre |
|---------|-------------|--------------|-----------------|-------|
| **LCP** | Largest Contentful Paint | < 2.5s | 2.5s - 4s | > 4s |
| **CLS** | Cumulative Layout Shift | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **INP** | Interaction to Next Paint | < 200ms | 200ms - 500ms | > 500ms |
| **FCP** | First Contentful Paint | < 1.8s | 1.8s - 3s | > 3s |
| **TTFB** | Time to First Byte | < 600ms | 600ms - 1.5s | > 1.5s |

#### Almacenamiento
- **LocalStorage**: Últimas 50 métricas guardadas automáticamente
- **Key**: `web-vitals`
- **Formato**: JSON array con `{ name, value, rating, timestamp, url }`

#### Integración
```typescript
// Inicialización automática en main.tsx
initWebVitals();

// Acceso desde componentes
const { vitals, averages, loading, clearMetrics } = useWebVitals();
```

#### Envío a Servicios
- **Google Analytics**: Todos los vitals como eventos de timing
- **Sentry**: Alertas cuando el rating es "poor"
- **Console**: Logs detallados en modo desarrollo

### 3. Sentry Avanzado

#### Mejoras Implementadas

**Source Maps y Releases:**
```typescript
release: `agendaweb@${VITE_APP_VERSION}`
dist: timestamp
```

**Integrations:**
- `browserTracingIntegration`: Performance monitoring
- `replayIntegration`: Session replay visual
- `breadcrumbsIntegration`: Console, DOM, fetch, history
- `httpClientIntegration`: HTTP error tracking

**Context Enrichment:**
- User context con custom fields
- Response context en errores HTTP
- Web Vitals en errores de performance
- Tags globales: `app.version`, `app.environment`

**Sampling:**
- Producción: 10% de sesiones, 100% de errores
- Desarrollo: 100% de todo

**Filtering:**
- URLs sensibles filtradas (tokens, passwords)
- Headers sensibles eliminados
- Extra data limitado a 50 entradas
- Patrones de ignore para errores conocidos

### 4. Dashboard de Métricas

#### Ubicación
Panel de administración → Pestaña "Métricas"

#### Visualizaciones

**1. Promedios de Core Web Vitals**
- Cards con valor promedio
- Distribución de ratings (good/needs-improvement/poor)
- Barras de progreso visuales con colores semafóricos

**2. Últimas Métricas Registradas**
- Tabla con las últimas 20 métricas
- Columnas: Métrica, Valor, Rating, URL, Timestamp
- Badges de color según rating

**3. Estado de Analytics**
- GA4: Estado de inicialización
- Sentry: DSN configurado
- Web Vitals: Métricas almacenadas

**4. Acciones**
- Botón "Limpiar métricas": Elimina localStorage

## 📦 Dependencias

```json
{
  "dependencies": {
    "react-ga4": "^2.1.0",
    "web-vitals": "^4.2.4",
    "@sentry/react": "^8.44.0"
  }
}
```

## 🔧 Configuración

### Variables de Entorno

```env
# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (ya existente)
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Release tracking
VITE_APP_VERSION=1.0.0
```

### Obtener GA4 Measurement ID

1. Ir a [Google Analytics](https://analytics.google.com/)
2. Admin → Data Streams → Web
3. Copiar "Measurement ID" (formato: G-XXXXXXXXXX)
4. Añadir a `.env` como `VITE_GA_MEASUREMENT_ID`

## 🚀 Uso

### Hooks Personalizados

#### useAnalytics()
Hook todo-en-uno con auto-tracking:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackClick, trackConversion, trackSearch } = useAnalytics();
  
  // Auto-tracking activado:
  // - Page views en cambio de ruta
  // - Tiempo en página
  // - Scroll depth (25%, 50%, 75%, 100%)
  
  const handleAction = () => {
    trackClick('button_id')({ extra: 'data' });
  };
  
  const handleConversion = () => {
    trackConversion()('PURCHASE', 99.99, { product_id: '123' });
  };
}
```

#### Hooks Individuales

```typescript
// Page tracking automático
usePageTracking();

// Tiempo en página
useTimeOnPage();

// Scroll tracking
useScrollTracking();

// Clicks
const trackClick = useClickTracking();
trackClick('element_id')({ custom: 'data' });

// Conversiones
const trackConversion = useConversionTracking();
trackConversion()('ACTION', value, params);

// Búsquedas
const trackSearch = useSearchTracking();
trackSearch()('query', resultsCount);

// Formularios
const { trackFormStart, trackFormComplete, trackFormField } = useFormTracking();

// Videos
const { trackVideoPlay, trackVideoComplete, trackVideoProgress } = useVideoTracking();

// Errores
const trackError = useErrorTracking();
trackError(new Error('mensaje'), errorInfo);
```

#### useWebVitals()

```typescript
const { 
  vitals,              // Array de métricas
  averages,            // Promedios calculados
  loading,             // Estado de carga
  refresh,             // Refrescar datos
  clearMetrics         // Limpiar storage
} = useWebVitals();

// Ejemplo: Mostrar average LCP
{averages?.LCP?.average}ms
```

### API Directa

```typescript
import { 
  initGA, 
  trackPageView, 
  trackEvent, 
  trackConversion,
  GAEventAction,
  GAEventCategory 
} from '@/config/analytics';

// Inicializar (ya se hace automáticamente)
initGA();

// Page view
trackPageView('/checkout', 'Checkout');

// Evento personalizado
trackEvent(GAEventAction.BUTTON_CLICK, {
  category: GAEventCategory.ENGAGEMENT,
  button_name: 'subscribe',
  location: 'hero'
});

// Conversión
trackConversion(GAEventAction.PURCHASE, 149.99, {
  transaction_id: 'TX123',
  product_name: 'Premium Plan',
  currency: 'USD'
});
```

### Sentry Context

```typescript
import { setUserContext, addBreadcrumb, captureError } from '@/config/sentry';

// User context (llamar tras login)
setUserContext('user_id', 'user@example.com', 'John Doe', {
  company_id: 'comp_123',
  subscription: 'PRO'
});

// Breadcrumb manual
addBreadcrumb('user_action', 'Clicked export button', {
  category: 'ui.click',
  level: 'info',
  data: { format: 'PDF' }
});

// Capturar error
try {
  // ...
} catch (error) {
  captureError(error, {
    tags: { feature: 'export' },
    extra: { document_id: '123' }
  });
}
```

## 🎨 Componentes

### MetricsDashboard

**Props:** Ninguno

**Uso:**
```typescript
import MetricsDashboard from '@/components/MetricsDashboard';

<MetricsDashboard />
```

**Ubicación actual:** AdminDashboard → Pestaña "Métricas"

## 📊 Eventos a Implementar (Futuro)

### Login.tsx
```typescript
trackEvent(GAEventAction.LOGIN_ATTEMPT, { method: 'email' });
trackEvent(GAEventAction.LOGIN_SUCCESS, { user_id });
trackError(error, { context: 'login' });
```

### ServiceNew.tsx
```typescript
trackConversion(GAEventAction.SERVICE_CREATE, undefined, {
  service_type: type,
  company_id: company.id
});
```

### ProductNew.tsx
```typescript
trackConversion(GAEventAction.PRODUCT_CREATE, undefined, {
  product_category: category,
  company_id: company.id
});
```

### Setup Wizard
```typescript
// SetupCompanyBasic.tsx
trackEvent(GAEventAction.SETUP_STARTED, { step: 'basic' });

// SetupCompanyInfo.tsx
trackEvent(GAEventAction.SETUP_STEP, { step: 'info' });

// SetupCompanyLocation.tsx
trackConversion(GAEventAction.SETUP_COMPLETED, undefined, {
  company_id: id,
  total_steps: 3
});
```

## 🐛 Debugging

### Console Logs (Development)

**GA4:**
```
[Analytics] GA4 inicializado: G-XXXXXXXXXX
[Analytics] Page view tracked: /dashboard
[Analytics] Event tracked: button_click
```

**Web Vitals:**
```
[WebVitals] LCP: { value: 1234, rating: 'good', delta: 100, id: 'v4-...' }
[WebVitals] Web Vitals tracking inicializado
```

**Sentry:**
```
[Sentry] Inicializado con DSN: https://xxx...
[Sentry] User context configurado: user_id
```

### Verificación en Browser

**GA4:**
1. DevTools → Network → Filter: `google-analytics.com/g/collect`
2. Ver requests con `en=page_view`, `en=conversion`, etc.

**Web Vitals:**
1. DevTools → Application → Local Storage → `web-vitals`
2. Ver JSON array con métricas

**Sentry:**
1. Ir a [sentry.io](https://sentry.io)
2. Ver eventos en Issues
3. Verificar breadcrumbs y context

## 📈 Mejores Prácticas

### 1. No trackear datos sensibles
```typescript
// ❌ MAL
trackEvent('login', { password: '...' });

// ✅ BIEN
trackEvent('login', { method: 'email' });
```

### 2. Incluir contexto útil
```typescript
// ❌ MAL
trackClick('button');

// ✅ BIEN
trackClick('subscribe_button', {
  location: 'hero',
  plan: 'PRO',
  user_type: 'entrepreneur'
});
```

### 3. Valores en conversiones
```typescript
// ❌ MAL
trackConversion('PURCHASE');

// ✅ BIEN
trackConversion('PURCHASE', total_amount, {
  transaction_id: id,
  items_count: cart.length,
  currency: 'USD'
});
```

### 4. Errores con contexto
```typescript
// ❌ MAL
console.error(error);

// ✅ BIEN
trackError(error, {
  component: 'ServiceForm',
  action: 'submit',
  service_id: service.id
});
```

## 🔒 Privacidad

### GDPR Compliance

**Anonimización:**
```typescript
// analytics.ts
anonymize_ip: true
```

**Opt-out (futuro):**
```typescript
// Implementar banner de cookies
if (userConsent) {
  initGA();
  initWebVitals();
}
```

**Datos filtrados en Sentry:**
- Contraseñas en URLs
- Tokens de autenticación
- Headers de autorización
- Campos de formulario sensibles

## 🧪 Testing

### Manual Testing

1. **GA4:**
   - Navegar por la app
   - Verificar eventos en Network tab
   - Esperar 24h para ver en GA4 dashboard

2. **Web Vitals:**
   - Navegar varias páginas
   - Abrir AdminDashboard → Métricas
   - Ver promedios y últimas métricas

3. **Sentry:**
   - Generar un error (ej: tirar excepción)
   - Verificar en sentry.io
   - Revisar breadcrumbs y context

### Automated Testing (futuro)

```typescript
// analytics.test.ts
import { trackEvent } from '@/config/analytics';

jest.mock('@/config/analytics');

test('tracks button click', () => {
  const { getByRole } = render(<MyButton />);
  fireEvent.click(getByRole('button'));
  
  expect(trackEvent).toHaveBeenCalledWith('BUTTON_CLICK', {
    button_name: 'submit'
  });
});
```

## 📝 Checklist de Deployment

- [ ] Configurar `VITE_GA_MEASUREMENT_ID` en producción
- [ ] Verificar `VITE_SENTRY_DSN` en producción
- [ ] Configurar `VITE_APP_VERSION` para releases
- [ ] Habilitar source maps en build (`vite.config.ts`)
- [ ] Crear release en Sentry con source maps
- [ ] Verificar tracking en GA4 Real-Time
- [ ] Verificar Web Vitals en localStorage
- [ ] Probar dashboard de métricas en AdminDashboard
- [ ] Documentar para el equipo
- [ ] Implementar opt-in de cookies (GDPR)

## 🆘 Troubleshooting

### GA4 no envía eventos

**Problema:** Network tab no muestra requests a google-analytics.com

**Solución:**
1. Verificar `VITE_GA_MEASUREMENT_ID` en `.env`
2. Verificar que no estés en modo desarrollo (auto-deshabilitado)
3. Comprobar AdBlock desactivado
4. Ver console para errores

### Web Vitals no se guardan

**Problema:** LocalStorage vacío

**Solución:**
1. Verificar que `initWebVitals()` se llama en `main.tsx`
2. Navegar varias páginas para generar métricas
3. Verificar console para errores de `web-vitals`
4. Comprobar que localStorage no esté bloqueado (modo incógnito)

### Sentry no captura errores

**Problema:** Errores no aparecen en sentry.io

**Solución:**
1. Verificar `VITE_SENTRY_DSN` correcto
2. Comprobar sample rate (10% en prod, subir a 100% para testing)
3. Ver console: `[Sentry] Inicializado con DSN: ...`
4. Verificar que el error no esté en `ignoreErrors`

### MetricsDashboard vacío

**Problema:** Dashboard muestra "No hay métricas disponibles"

**Solución:**
1. Navegar por la app para generar Web Vitals
2. Esperar ~5 segundos por métrica
3. Verificar localStorage: key `web-vitals`
4. Refrescar dashboard

## 📚 Referencias

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Web Vitals](https://web.dev/vitals/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [react-ga4 Library](https://github.com/PriceRunner/react-ga4)

## 🔄 Changelog

### Version 1.0.0 (2024-01-XX)

**Agregado:**
- Integración completa de Google Analytics 4
- Tracking de Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
- Configuración avanzada de Sentry (source maps, releases, breadcrumbs)
- Dashboard de métricas en AdminDashboard
- 8 hooks personalizados para analytics
- Event tracking en PublicPage (WhatsApp, bookings, products)
- Documentación completa

**Mejorado:**
- Sentry con context enrichment
- Web Vitals con localStorage persistence
- Analytics en modo desarrollo (auto-deshabilitado)

**Notas:**
- Requiere configurar `VITE_GA_MEASUREMENT_ID` en producción
- Tests excluidos temporalmente de compilación TypeScript
