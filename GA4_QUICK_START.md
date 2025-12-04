# 🚀 Google Analytics 4 - Quick Start

## Setup en 3 Pasos

### 1️⃣ Obtener Measurement ID

```
📍 https://analytics.google.com/
   ↓
   Admin > Property > Data Streams
   ↓
   Copiar: G-XXXXXXXXXX
```

### 2️⃣ Configurar .env

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_VERSION=1.0.0
VITE_GA_DEBUG=true
```

### 3️⃣ Iniciar y Verificar

```bash
npm run dev
```

**Verificar en consola:**
```
✓ Google Analytics 4 inicializado: G-XXXXXXXXXX
✓ GA4 Debugger inicializado
```

**Ver debugger:**
- Click en botón flotante verde `📊 GA4` (esquina inferior derecha)
- Interactuar con la app
- Ver eventos en tiempo real

---

## ✨ Características Activadas

✅ **Tracking Automático**
- Page views
- Scroll depth (25%, 50%, 75%, 100%)
- Time on page
- JavaScript errors

✅ **Custom Dimensions**
- App version
- Environment
- User role
- Company ID
- Business type

✅ **Conversion Events**
- WhatsApp clicks
- Service bookings
- Product orders
- Form submissions

✅ **Visual Debugger**
- Eventos en tiempo real
- Parámetros detallados
- Historial de eventos

---

## 📊 Ver en Google Analytics

**Realtime Report:**
```
Analytics > Reports > Realtime
```

**DebugView (Recomendado):**
```
Analytics > Admin > DebugView
```

**Events Report:**
```
Analytics > Reports > Events
```

---

## 🎯 Tracking Manual

```typescript
import { useAnalytics } from './hooks/useAnalytics';

function MyComponent() {
  const { trackClick, trackConversion } = useAnalytics();
  
  // Track click
  trackClick('button_name')({
    location: 'header',
    action: 'signup',
  });
  
  // Track conversion
  trackConversion()(GAEventAction.WHATSAPP_CLICK, price, {
    company_id: '123',
  });
}
```

---

## 📚 Documentación Completa

Ver: `GOOGLE_ANALYTICS_SETUP.md`

---

## 🐛 Troubleshooting

**No aparece el debugger:**
- Verificar `VITE_GA_DEBUG=true` en `.env`
- Reiniciar servidor: `npm run dev`

**No se trackean eventos:**
- Verificar `VITE_GA_MEASUREMENT_ID` en `.env`
- Ver consola del navegador
- Revisar DebugView en GA4

**Eventos no aparecen en GA4:**
- Esperar 24-48h para reportes
- Usar Realtime Report para ver inmediato
- Verificar DebugView está habilitado

---

**¡Todo listo!** 🎉

