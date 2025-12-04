# 📊 Configuración de Google Analytics 4 (GA4)

## 🎯 Guía Completa de Implementación

### Índice
1. [Obtener Measurement ID](#1-obtener-measurement-id)
2. [Configurar Variables de Entorno](#2-configurar-variables-de-entorno)
3. [Custom Dimensions](#3-custom-dimensions)
4. [Tracking Events](#4-tracking-events)
5. [Analytics Debugger](#5-analytics-debugger)
6. [Testing y Verificación](#6-testing-y-verificación)
7. [Dashboard Recomendado](#7-dashboard-recomendado)

---

## 1. Obtener Measurement ID

### Paso 1: Acceder a Google Analytics
1. Ir a [Google Analytics](https://analytics.google.com/)
2. Iniciar sesión con tu cuenta de Google

### Paso 2: Crear o Seleccionar Propiedad
1. Si NO tienes una propiedad:
   - Click en **"Admin"** (⚙️ abajo a la izquierda)
   - Click en **"Create Property"**
   - Completar información:
     - **Property name**: AgendaWeb
     - **Reporting time zone**: Chile (UTC-03:00)
     - **Currency**: Chilean Peso (CLP)
   - Click **"Next"**
   - Completar información del negocio
   - Click **"Create"**

2. Si YA tienes una propiedad:
   - Click en **"Admin"** (⚙️)
   - Seleccionar tu propiedad

### Paso 3: Crear Data Stream
1. En **"Admin" > "Data Streams"**
2. Click en **"Add stream"**
3. Seleccionar **"Web"**
4. Completar:
   - **Website URL**: `https://tu-dominio.com`
   - **Stream name**: AgendaWeb Production
5. Click **"Create stream"**

### Paso 4: Copiar Measurement ID
1. En la página del Data Stream, encontrarás el **Measurement ID**
2. Tiene formato: `G-XXXXXXXXXX`
3. **Copiar este ID** - lo necesitarás en el siguiente paso

---

## 2. Configurar Variables de Entorno

### Paso 1: Crear archivo .env
En la raíz del proyecto, crear o editar el archivo `.env`:

```bash
# Copiar desde .env.example
cp .env.example .env
```

### Paso 2: Configurar Google Analytics
Editar `.env` y agregar:

```env
# ============ GOOGLE ANALYTICS 4 ============
# Reemplazar G-XXXXXXXXXX con tu Measurement ID real
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Debug mode - true en desarrollo, false en producción
VITE_GA_DEBUG=true

# ============ APPLICATION ============
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=AgendaWeb
VITE_APP_ENV=development

# ============ FEATURE FLAGS ============
VITE_ENABLE_ANALYTICS=true
```

### Paso 3: Configurar para Producción
En tu plataforma de hosting (Vercel, Netlify, etc.):

1. **Vercel**:
   - Settings > Environment Variables
   - Agregar cada variable con su valor
   - Hacer redeploy

2. **Netlify**:
   - Site settings > Environment variables
   - Agregar cada variable
   - Hacer redeploy

3. **Firebase Hosting**:
   - Usar Firebase Functions Config
   ```bash
   firebase functions:config:set analytics.measurement_id="G-XXXXXXXXXX"
   ```

---

## 3. Custom Dimensions

### Dimensiones Configuradas Automáticamente

La aplicación envía automáticamente estas dimensiones con cada evento:

| Dimension | Descripción | Ejemplo |
|-----------|-------------|---------|
| `app_version` | Versión de la aplicación | `1.0.0` |
| `environment` | Entorno de ejecución | `production` |
| `session_id` | ID único de sesión | `1234567890-abc123` |
| `user_id` | ID del usuario (si está logueado) | `user_abc123` |
| `user_role` | Rol del usuario | `ENTREPRENEUR`, `SUPERADMIN` |
| `company_id` | ID de la empresa | `company_xyz789` |
| `company_name` | Nombre de la empresa | `Mi Empresa` |
| `business_type` | Tipo de negocio | `SERVICES`, `PRODUCTS` |

### Configurar en Google Analytics

Para ver estas dimensiones en tus reportes:

1. **Admin > Data display > Custom definitions**
2. Click en **"Create custom dimensions"**
3. Crear cada una:

```
Dimension name: App Version
Scope: Event
Event parameter: app_version
```

Repetir para:
- `environment` (Entorno)
- `user_role` (Rol de Usuario)
- `company_id` (ID de Empresa)
- `business_type` (Tipo de Negocio)

### Setear Custom Dimensions en el Código

```typescript
import { setCustomDimensions } from './config/analytics';

// Al hacer login
setCustomDimensions({
  user_id: user.id,
  user_role: user.role,
  company_id: user.company_id,
  company_name: company.name,
  business_type: company.business_type,
});
```

---

## 4. Tracking Events

### Eventos Automáticos

La aplicación trackea automáticamente:

✅ **Page Views**: Cada cambio de ruta
✅ **Tiempo en Página**: Al salir de una página (> 3 segundos)
✅ **Scroll Depth**: 25%, 50%, 75%, 100%
✅ **Errores**: JavaScript errors capturados

### Eventos de Conversión

#### Ejemplo 1: WhatsApp Click
```typescript
import { trackConversion } from './config/analytics';

const handleWhatsAppClick = () => {
  trackConversion()(GAEventAction.WHATSAPP_CLICK, undefined, {
    company_id: company.id,
    company_name: company.name,
  });
};
```

#### Ejemplo 2: Service Booking
```typescript
trackConversion()(GAEventAction.SERVICE_BOOKING, service.price, {
  service_id: service.id,
  service_name: service.name,
  company_id: company.id,
});
```

#### Ejemplo 3: Product Order
```typescript
trackConversion()(GAEventAction.PRODUCT_ORDER, totalAmount, {
  product_count: cart.length,
  total_items: totalItems,
  company_id: company.id,
});
```

### Eventos con Hook useAnalytics

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackClick, trackConversion, trackForm } = useAnalytics();
  
  // Track click
  const handleButtonClick = () => {
    trackClick('my_button')({
      button_location: 'header',
      button_text: 'Sign Up',
    });
  };
  
  // Track form
  const { trackFormStart, trackFormComplete } = trackForm('contact_form');
  
  return (
    <form onSubmit={handleSubmit}>
      <input onFocus={trackFormStart} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Lista Completa de Eventos Disponibles

| Categoría | Evento | Uso |
|-----------|--------|-----|
| **User** | `sign_up` | Registro de usuario |
| | `login` | Inicio de sesión |
| | `logout` | Cierre de sesión |
| **Navigation** | `page_view` | Vista de página |
| | `search` | Búsqueda |
| | `click` | Click en elemento |
| **Engagement** | `scroll` | Scroll depth |
| | `time_on_page` | Tiempo en página |
| | `video_play` | Reproducción de video |
| **Conversion** | `whatsapp_click` | Click en WhatsApp |
| | `service_booking` | Reserva de servicio |
| | `product_order` | Pedido de producto |
| | `contact_submit` | Envío de contacto |
| **Business** | `service_create` | Creación de servicio |
| | `product_create` | Creación de producto |
| | `company_setup` | Configuración de empresa |
| **Error** | `error_occurred` | Error ocurrido |

---

## 5. Analytics Debugger

### Activar el Debugger

El debugger se activa automáticamente cuando:
```env
VITE_GA_DEBUG=true
```

### Características del Debugger

✨ **Panel Flotante**: Botón verde `📊 GA4` en la esquina inferior derecha
✨ **Eventos en Tiempo Real**: Ver todos los eventos mientras se disparan
✨ **Parámetros Detallados**: Inspeccionar todos los datos enviados
✨ **Historial**: Últimos 50 eventos
✨ **Clear**: Limpiar historial
✨ **Hide/Show**: Ocultar/mostrar panel

### Usar el Debugger

1. Abrir la aplicación en desarrollo
2. Click en el botón flotante `📊 GA4`
3. Interactuar con la aplicación
4. Ver eventos en tiempo real con todos sus parámetros

### Ejemplo de Output

```
📊 GA4 Debugger
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

whatsapp_click                    14:32:15
└─ Params ▼
   {
     "company_id": "abc123",
     "company_name": "Mi Empresa",
     "app_version": "1.0.0",
     "environment": "development",
     "timestamp": 1701234567890
   }

service_booking                   14:31:42
└─ Params ▼
   {
     "service_id": "xyz789",
     "service_name": "Corte de Pelo",
     "value": 15000,
     "currency": "CLP",
     ...
   }
```

### Debugger en Producción

⚠️ **IMPORTANTE**: El debugger NO aparece en producción si:
```env
VITE_GA_DEBUG=false
```

Para debugging en producción:
1. Usar **Google Analytics DebugView**
2. Instalar extensión: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

---

## 6. Testing y Verificación

### Verificar en Google Analytics

1. **Realtime Report**
   - Analytics > Reports > Realtime
   - Abrir tu app
   - Deberías ver usuarios en tiempo real

2. **DebugView** (Recomendado)
   - Analytics > Admin > DebugView
   - Activar con `VITE_GA_DEBUG=true`
   - Ver eventos detallados en tiempo real

3. **Events Report**
   - Analytics > Reports > Events
   - Ver todos los eventos trackeados
   - Filtrar por evento específico

### Checklist de Testing

- [ ] ✅ Pageviews se registran al navegar
- [ ] ✅ Conversiones de WhatsApp click
- [ ] ✅ Conversiones de service booking
- [ ] ✅ Conversiones de product order
- [ ] ✅ Scroll depth tracking
- [ ] ✅ Time on page tracking
- [ ] ✅ Custom dimensions aparecen
- [ ] ✅ User ID se setea al login
- [ ] ✅ Errores se trackean

### Comandos de Testing

```bash
# Desarrollo con debugger
npm run dev

# Build de producción
npm run build

# Preview de producción
npm run preview
```

---

## 7. Dashboard Recomendado

### Crear Dashboard Personalizado

1. **Analytics > Customization > Dashboards**
2. **Create Dashboard**
3. Agregar estos widgets:

#### Conversiones (Cards)
- Total WhatsApp Clicks
- Total Service Bookings
- Total Product Orders
- Conversion Rate

#### User Engagement (Line Chart)
- Active Users (Last 7 days)
- Average Session Duration
- Pages per Session

#### Top Pages (Table)
- Page views
- Average time on page
- Bounce rate

#### Events (Bar Chart)
- Top 10 Events by Count

#### Custom Dimensions (Pie Chart)
- Users by Business Type
- Users by User Role

### Reportes Importantes

1. **Acquisition Report**
   - De dónde vienen los usuarios
   - Canales de marketing efectivos

2. **Engagement Report**
   - Qué páginas son más visitadas
   - Cuánto tiempo pasan en cada página

3. **Monetization Report**
   - Valor de conversiones
   - ROI por canal

4. **Retention Report**
   - Usuarios que regresan
   - Cohort analysis

---

## 🎨 Bonus: Google Tag Manager (Opcional)

### Ventajas de usar GTM
- Sin necesidad de deployar código para agregar tags
- Triggers visuales
- Debugging más fácil
- Integración con múltiples herramientas

### Setup Básico

1. Crear cuenta en [Google Tag Manager](https://tagmanager.google.com/)
2. Crear container para Web
3. Copiar el código de instalación
4. Agregar en `index.html`:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->
```

5. Agregar en `<body>`:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [GA4 Events](https://support.google.com/analytics/answer/9322688)
- [Custom Dimensions](https://support.google.com/analytics/answer/10075209)
- [DebugView](https://support.google.com/analytics/answer/7201382)

### Tutoriales Recomendados
- [GA4 for Developers](https://developers.google.com/analytics/devguides/collection/ga4)
- [Measure Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

### Herramientas
- [GA4 Event Builder](https://ga-dev-tools.web.app/ga4/event-builder/)
- [Chrome Extension: GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

---

## 🚀 ¡Listo!

Tu Google Analytics 4 está completamente configurado con:
✅ Measurement ID
✅ Variables de entorno
✅ Custom dimensions
✅ Tracking events específicos
✅ Debugger visual
✅ Testing verificado

**Próximos pasos:**
1. Configurar alertas en GA4
2. Crear audiencias personalizadas
3. Setup de conversiones como objetivos
4. Integrar con Google Ads (si aplica)

---

**¿Preguntas?** Consultar la [documentación oficial de GA4](https://support.google.com/analytics/answer/9304153) o el código en `src/config/analytics.ts`

