# 🔐 Guía Rápida de Variables de Entorno

## Variables Necesarias para Iniciar

Crear archivo `.env` en la raíz del proyecto con estas variables:

```env
# ============ REQUERIDO PARA INICIAR ============

# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Versión de la app
VITE_APP_VERSION=1.0.0

# ============ FIREBASE (Ya configurado) ============
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# ============ GOOGLE MAPS ============
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# ============ OPCIONALES ============

# Habilitar debug de Analytics (true/false)
VITE_GA_DEBUG=true

# Nombre de la aplicación
VITE_APP_NAME=AgendaWeb

# Entorno
VITE_APP_ENV=development

# Habilitar analytics
VITE_ENABLE_ANALYTICS=true

# URL base canónica para páginas públicas (Firebase agendaemprende)
# Si no se define, usa https://agendaemprende-8ac77.web.app
# VITE_PUBLIC_BASE_URL=https://agendaemprende-8ac77.web.app

# Sentry DSN
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 📋 Obtener las Credenciales

### Google Analytics (GA4)
1. Ir a: https://analytics.google.com/
2. Admin > Property > Data Streams
3. Copiar el **Measurement ID** (formato: G-XXXXXXXXXX)

### Firebase
1. Ir a: https://console.firebase.google.com/
2. Project Settings > General
3. Scroll down a "Your apps"
4. Copiar las credenciales

### Google Maps
1. Ir a: https://console.cloud.google.com/
2. APIs & Services > Credentials
3. Create credentials > API key
4. Habilitar: Maps JavaScript API, Places API

### Sentry (Opcional)
1. Ir a: https://sentry.io/
2. Create new project
3. Copiar el DSN

## 🚀 Configurar en Producción

### Vercel
```bash
# Dashboard > Project > Settings > Environment Variables
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_VERSION=1.0.0
VITE_GA_DEBUG=false
# ... resto de variables
```

### Netlify
```bash
# Site settings > Environment variables > Add a variable
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_VERSION=1.0.0
VITE_GA_DEBUG=false
# ... resto de variables
```

## ⚠️ IMPORTANTE

1. **NUNCA** commitear el archivo `.env` al repositorio
2. El archivo `.env` ya está en `.gitignore`
3. Usar `.env.example` como referencia
4. En producción, `VITE_GA_DEBUG` debe ser `false`

## ✅ Verificar Configuración

```bash
# Verificar que las variables están cargadas
npm run dev

# En la consola del navegador, debería aparecer:
# ✓ Google Analytics 4 inicializado: G-XXXXXXXXXX
# ✓ GA4 Debugger inicializado
```

## 📊 Ver Analytics en Acción

1. Abrir la app: `http://localhost:5173`
2. Click en el botón flotante verde `📊 GA4`
3. Navegar por la app
4. Ver eventos en tiempo real en el debugger

