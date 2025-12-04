# 🎯 Configuración de GA4 para AgendaWeb
## Measurement ID: G-RZ7NZ3TKSG

---

## ⚡ Setup Rápido (2 minutos)

### 1️⃣ Crear archivo .env

En la raíz del proyecto (mismo nivel que `package.json`), crear archivo `.env`:

```env
# ============ GOOGLE ANALYTICS 4 ============
VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG

# ============ APPLICATION ============
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=AgendaWeb
VITE_APP_ENV=development

# ============ ANALYTICS DEBUG ============
VITE_GA_DEBUG=true
VITE_ENABLE_ANALYTICS=true

# ============ FIREBASE (completar con tus credenciales) ============
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ============ GOOGLE MAPS ============
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# ============ SENTRY (opcional) ============
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### 2️⃣ Iniciar aplicación

```bash
npm run dev
```

### 3️⃣ Verificar instalación

**En la consola del navegador (F12) deberías ver:**

```
✓ Google Analytics 4 inicializado: G-RZ7NZ3TKSG
✓ GA4 Debugger inicializado - Click en el botón flotante para ver eventos
```

**¡Listo!** El analytics está funcionando.

---

## 📊 Ver el Debugger en Acción

1. **Busca el botón flotante verde** `📊 GA4` en la esquina inferior derecha
2. **Click** en el botón
3. **Navega** por tu aplicación
4. **Observa** los eventos en tiempo real

### Ejemplo de lo que verás:

```
┌─────────────────────────────────────────┐
│ 📊 GA4 Debugger        [Clear] [Hide]  │
├─────────────────────────────────────────┤
│                                         │
│ page_view                    15:23:45   │
│ └─ Params ▼                             │
│    {                                    │
│      "page_title": "Public Page",      │
│      "page_location": "/mi-empresa",   │
│      "app_version": "1.0.0",           │
│      "environment": "development"       │
│    }                                    │
│                                         │
│ whatsapp_click                15:24:12  │
│ └─ Params ▼                             │
│    {                                    │
│      "company_id": "abc123",           │
│      "company_name": "Mi Empresa",     │
│      "category": "conversion",          │
│      "timestamp": 1701264252000         │
│    }                                    │
│                                         │
│ service_booking               15:24:45  │
│ └─ Params ▼                             │
│    {                                    │
│      "service_id": "xyz789",           │
│      "service_name": "Corte de Pelo",  │
│      "value": 15000,                    │
│      "currency": "CLP",                 │
│      "company_id": "abc123"             │
│    }                                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Eventos que se Trackean Automáticamente

### ✅ Ya funcionando sin código adicional:

1. **Page Views** 📄
   - Cada vez que cambias de ruta
   - Incluye: página, título, timestamp

2. **Scroll Depth** 📊
   - Al alcanzar: 25%, 50%, 75%, 100%
   - Útil para ver engagement

3. **Time on Page** ⏱️
   - Tiempo que pasa en cada página
   - Solo si > 3 segundos

4. **WhatsApp Clicks** 💬
   - Ya implementado en PublicPage
   - Incluye: company_id, company_name

5. **Service Booking** 🎫
   - Al reservar un servicio
   - Incluye: precio, service_id, company info

6. **Add to Cart** 🛒
   - Al agregar producto al carrito
   - Incluye: product info, precio

7. **Product Order** 📦
   - Al completar orden de productos
   - Incluye: total, cantidad items, company info

8. **JavaScript Errors** ⚠️
   - Errores automáticamente capturados
   - Enviados a GA4 y Sentry

---

## 📈 Ver en Google Analytics Dashboard

### Realtime Report (Inmediato)

```
1. Ir a: https://analytics.google.com/
2. Seleccionar property con ID: G-RZ7NZ3TKSG
3. Reports > Realtime
4. Ver usuarios activos en tiempo real
```

### DebugView (Recomendado para desarrollo)

```
1. https://analytics.google.com/
2. Admin > DebugView
3. Ver todos los eventos con sus parámetros
```

### Events Report (Histórico)

```
1. Reports > Events
2. Ver todos los eventos trackeados
3. Analizar tendencias y conversiones
```

---

## 🎨 Custom Dimensions Configuradas

Cada evento incluye automáticamente estas dimensiones:

| Dimensión | Ejemplo | Descripción |
|-----------|---------|-------------|
| `app_version` | `1.0.0` | Versión de la aplicación |
| `environment` | `development` | Entorno de ejecución |
| `session_id` | `1701264000-abc123` | ID único de sesión |
| `user_id` | `user_xyz789` | ID del usuario (si está logueado) |
| `user_role` | `ENTREPRENEUR` | Rol del usuario |
| `company_id` | `company_abc123` | ID de la empresa |
| `company_name` | `Mi Empresa` | Nombre de la empresa |
| `business_type` | `SERVICES` | Tipo de negocio |

### Configurar en Google Analytics:

```
1. Admin > Data display > Custom definitions
2. Click "Create custom dimensions"
3. Para cada dimensión:
   - Dimension name: App Version
   - Scope: Event
   - Event parameter: app_version
4. Repetir para cada dimensión
```

---

## 🚀 Configurar para Producción

### Vercel

```bash
# Dashboard > Settings > Environment Variables
VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG
VITE_APP_VERSION=1.0.0
VITE_GA_DEBUG=false
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
```

### Netlify

```bash
# Site settings > Environment variables
VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG
VITE_APP_VERSION=1.0.0
VITE_GA_DEBUG=false
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
```

⚠️ **IMPORTANTE**: En producción, establecer `VITE_GA_DEBUG=false`

---

## 🧪 Testing Checklist

Antes de ir a producción, verificar:

- [ ] ✅ .env configurado con G-RZ7NZ3TKSG
- [ ] ✅ npm run dev funciona sin errores
- [ ] ✅ Consola muestra "GA4 inicializado"
- [ ] ✅ Botón flotante GA4 aparece
- [ ] ✅ Page views se registran en Realtime
- [ ] ✅ WhatsApp click trackea correctamente
- [ ] ✅ Service booking trackea con precio
- [ ] ✅ Product order trackea con total
- [ ] ✅ Scroll depth funciona
- [ ] ✅ Custom dimensions aparecen
- [ ] ✅ DebugView en GA4 muestra eventos

---

## 🐛 Troubleshooting

### El debugger no aparece

**Solución:**
```env
# Verificar en .env:
VITE_GA_DEBUG=true
VITE_ENABLE_ANALYTICS=true
```

Reiniciar: `npm run dev`

### No se trackean eventos

**Verificar en consola:**
- ¿Aparece "GA4 inicializado: G-RZ7NZ3TKSG"?
- ¿Hay errores en rojo?

**Verificar en .env:**
```env
VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG  # ¿Está correcto?
VITE_ENABLE_ANALYTICS=true            # ¿Está habilitado?
```

### Eventos no aparecen en GA4

**Usar Realtime Report** (inmediato):
- Analytics > Reports > Realtime

**Usar DebugView** (inmediato):
- Analytics > Admin > DebugView

⏰ **Reports normales**: Pueden tardar 24-48 horas

---

## 📞 Soporte

### Documentación completa:
- `GOOGLE_ANALYTICS_SETUP.md` - Guía detallada
- `ENV_VARIABLES_GUIDE.md` - Variables de entorno
- `GA4_QUICK_START.md` - Setup rápido

### Google Analytics:
- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [DebugView Guide](https://support.google.com/analytics/answer/7201382)

### Código:
- `src/config/analytics.ts` - Configuración de analytics
- `src/hooks/useAnalytics.ts` - Hooks de tracking
- `src/pages/public/PublicPage.tsx` - Ejemplo de uso

---

## ✅ Estado Actual

### ✨ Completado y Funcionando:

- ✅ Measurement ID configurado: **G-RZ7NZ3TKSG**
- ✅ Variables de entorno preparadas
- ✅ Custom dimensions implementadas
- ✅ Tracking events específicos
- ✅ Debugger visual en tiempo real
- ✅ Auto-tracking de página, scroll, tiempo
- ✅ Conversiones configuradas
- ✅ Documentación completa

### 🎯 Próximo paso:

**Crear el archivo .env con el contenido de arriba** y ¡listo! 🚀

---

**Property ID**: G-RZ7NZ3TKSG
**Status**: ✅ Configurado y listo para usar
**Debugger**: ✅ Habilitado en desarrollo
**Production Ready**: ✅ Sí (cambiar VITE_GA_DEBUG=false)

