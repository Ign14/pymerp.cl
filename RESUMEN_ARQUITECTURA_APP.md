# 📐 Resumen y Arquitectura - PYM-ERP AgendaWeb

## 🎯 Descripción General

**PYM-ERP (AgendaWeb)** es una plataforma SaaS multi-tenant diseñada para emprendedores que permite gestionar sus negocios de forma integral. La plataforma ofrece presencia web, gestión de servicios/productos, sistema de citas, y conectividad directa con clientes mediante WhatsApp.

### 🎨 Tipos de Negocio Soportados

1. **Servicios Profesionales** (Barberías, Salones de Belleza, Consultorios)
   - Sistema de citas con profesionales
   - Gestión de horarios y disponibilidad
   - Recordatorios automáticos vía email

2. **Restaurantes y Alimentos**
   - Menú digital con categorías
   - Sistema de pedidos vía WhatsApp
   - Visualización por categorías con fotos

3. **Tiendas y Productos**
   - Catálogo de productos
   - Carrito de compras
   - Pedidos vía WhatsApp

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE / NAVEGADOR                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Landing Page    │  │  Páginas Públicas│  │  Dashboard       │ │
│  │  /               │  │  /:companyId     │  │  /dashboard/*    │ │
│  │                  │  │                  │  │                  │ │
│  │ - Hero           │  │ - Servicios      │  │ - Home           │ │
│  │ - Features       │  │ - Productos      │  │ - Appointments   │ │
│  │ - Pricing        │  │ - Menú           │  │ - Services       │ │
│  │ - Contact        │  │ - Booking Widget │  │ - Products       │ │
│  │ - Request Access │  │ - WhatsApp CTA   │  │ - Professionals  │ │
│  └──────────────────┘  └──────────────────┘  │ - Analytics      │ │
│                                               │ - Settings       │ │
│                                               └──────────────────┘ │
│                                                                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                   ┌───────────────▼────────────────┐
                   │     React 18.3 + TypeScript    │
                   │     Vite 5.x Build System      │
                   │     React Router 6.28          │
                   │     Tailwind CSS 3.x           │
                   │     Framer Motion 12.x         │
                   └───────────────┬────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼───────┐        ┌─────────▼──────────┐     ┌────────▼────────┐
│   Context API │        │   Custom Hooks     │     │   Services      │
├───────────────┤        ├────────────────────┤     ├─────────────────┤
│ - AuthContext │        │ - useAuth()        │     │ - auth.ts       │
│ - ThemeCtx    │        │ - useErrorHandler()│     │ - companies.ts  │
│ - LanguageCtx │        │ - useAnalytics()   │     │ - services.ts   │
│               │        │ - usePWA()         │     │ - products.ts   │
│               │        │                    │     │ - appointments  │
└───────────────┘        └────────────────────┘     │ - professionals │
                                                     │ - emails.ts     │
                                                     └────────┬────────┘
                                                              │
                ┌─────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────┐
│                        FIREBASE BACKEND                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Firebase     │  │  Firestore   │  │   Storage    │           │
│  │ Auth         │  │  Database    │  │   (Bucket)   │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ - Email/Pass │  │ - users      │  │ - logos/     │           │
│  │ - Roles      │  │ - companies  │  │ - banners/   │           │
│  │ - Custom     │  │ - services   │  │ - products/  │           │
│  │   Claims     │  │ - products   │  │              │           │
│  │ - Sessions   │  │ - appointments│ │              │           │
│  └──────────────┘  │ - professionals│ │             │           │
│                    │ - access_req │  │              │           │
│                    └──────────────┘  └──────────────┘           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐         │
│  │          Cloud Functions (Node.js)                   │         │
│  ├──────────────────────────────────────────────────────┤         │
│  │ - sendAppointmentEmail (onCreate trigger)            │         │
│  │ - sendReminders (scheduled 9 AM daily)               │         │
│  │ - handleAppointmentRequest (callable)                │         │
│  │ - handleAccessRequest (onCreate trigger)             │         │
│  │ - processApproval (callable)                         │         │
│  │ - processRejection (callable)                        │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐         │
│  │          Security Rules                               │         │
│  ├──────────────────────────────────────────────────────┤         │
│  │ Firestore Rules:                                      │         │
│  │ - Multi-tenant isolation (companyId)                  │         │
│  │ - Role-based access (SUPERADMIN, ENTREPRENEUR)        │         │
│  │ - Read permissions for public pages                   │         │
│  │                                                        │         │
│  │ Storage Rules:                                         │         │
│  │ - Authentication required for uploads                 │         │
│  │ - Path-based authorization (companyId)                │         │
│  │ - File size limits (5MB images)                       │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌─────────▼─────────┐   ┌──────▼──────┐
│   SendGrid    │   │  Google Maps API  │   │  Analytics  │
├───────────────┤   ├───────────────────┤   ├─────────────┤
│ - Transactional│  │ - Geocoding       │   │ - GA4       │
│   emails      │   │ - Map display     │   │ - Sentry    │
│ - Templates   │   │ - Location search │   │ - Web Vitals│
└───────────────┘   └───────────────────┘   └─────────────┘
```

---

## 📦 Estructura del Proyecto

```
AGENDAWEB/
│
├── 📁 src/                          # Código fuente frontend
│   ├── 📁 components/               # Componentes React reutilizables
│   │   ├── appointments/            # Componentes de citas
│   │   ├── marketing/               # Landing page components
│   │   ├── professionals/           # Componentes de profesionales
│   │   ├── services/                # Componentes de servicios
│   │   ├── products/                # Componentes de productos
│   │   ├── layout/                  # Layout y navegación
│   │   └── ui/                      # Componentes UI genéricos
│   │
│   ├── 📁 pages/                    # Páginas de la aplicación
│   │   ├── dashboard/               # Dashboard privado
│   │   │   ├── appointments/        # Sistema de citas
│   │   │   ├── professionals/       # Gestión de profesionales
│   │   │   ├── services/            # Gestión de servicios
│   │   │   ├── products/            # Gestión de productos
│   │   │   ├── reports/             # Analytics y reportes
│   │   │   └── settings/            # Configuración
│   │   │
│   │   ├── public/                  # Páginas públicas
│   │   │   └── [companyId]/         # Presencia web por empresa
│   │   │
│   │   ├── admin/                   # Panel superadmin
│   │   ├── auth/                    # Login/Register/Recovery
│   │   └── marketing/               # Landing page
│   │
│   ├── 📁 services/                 # Lógica de negocio
│   │   ├── auth.ts                  # Autenticación
│   │   ├── companies.ts             # Gestión de empresas
│   │   ├── services.ts              # CRUD servicios
│   │   ├── products.ts              # CRUD productos
│   │   ├── appointments.ts          # Sistema de citas
│   │   ├── professionals.ts         # Gestión de profesionales
│   │   ├── appointmentEmails.ts     # Notificaciones email
│   │   └── storage.ts               # Uploads de archivos
│   │
│   ├── 📁 contexts/                 # Context API
│   │   ├── AuthContext.tsx          # Estado de autenticación
│   │   ├── LanguageContext.tsx      # i18n state
│   │   └── ThemeContext.tsx         # Theme state
│   │
│   ├── 📁 hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts               # Hook de autenticación
│   │   ├── useErrorHandler.ts       # Error boundary logic
│   │   ├── useAnalytics.ts          # GA4 tracking
│   │   └── usePWA.ts                # PWA lifecycle
│   │
│   ├── 📁 types/                    # TypeScript definitions
│   │   ├── company.ts               # Tipos de empresa
│   │   ├── service.ts               # Tipos de servicio
│   │   ├── product.ts               # Tipos de producto
│   │   ├── appointment.ts           # Tipos de cita
│   │   └── user.ts                  # Tipos de usuario
│   │
│   ├── 📁 utils/                    # Utilidades
│   │   ├── validation.ts            # Validadores
│   │   ├── formatting.ts            # Formatters
│   │   └── constants.ts             # Constantes
│   │
│   ├── 📁 locales/                  # Traducciones i18n
│   │   ├── en/                      # Inglés
│   │   └── es/                      # Español
│   │
│   ├── App.tsx                      # Componente raíz
│   ├── main.tsx                     # Entry point
│   └── i18n.ts                      # Configuración i18next
│
├── 📁 functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── appointments/
│   │   │   ├── sendReminders.ts     # Recordatorios diarios
│   │   │   └── handleRequest.ts     # Procesar reservas
│   │   ├── access/
│   │   │   ├── handleRequest.ts     # Procesar solicitudes
│   │   │   └── processApproval.ts   # Aprobar usuarios
│   │   └── index.ts                 # Export de todas las functions
│   ├── package.json
│   └── tsconfig.json
│
├── 📁 e2e/                          # Tests E2E con Playwright
│   ├── auth.spec.ts                 # Tests de autenticación
│   ├── dashboard.spec.ts            # Tests de dashboard
│   ├── booking.spec.ts              # Tests de reservas
│   └── public-pages.spec.ts         # Tests de páginas públicas
│
├── 📁 tests/                        # Tests unitarios
│   ├── components/
│   ├── services/
│   └── utils/
│
├── 📁 public/                       # Assets estáticos
│   ├── favicon.ico
│   ├── manifest.json                # PWA manifest
│   └── locales/                     # JSON de traducciones
│
├── 📁 docs/                         # Documentación
│   └── architecture/
│
├── .env.local                       # Variables de entorno (local)
├── .env.production                  # Variables de entorno (prod)
├── firebase.json                    # Configuración Firebase
├── firestore.rules                  # Reglas de seguridad Firestore
├── storage.rules                    # Reglas de seguridad Storage
├── package.json                     # Dependencias npm
├── vite.config.ts                   # Configuración Vite
├── tailwind.config.js               # Configuración Tailwind
├── tsconfig.json                    # Configuración TypeScript
└── playwright.config.ts             # Configuración Playwright
```

---

## 🔄 Flujos Principales de la Aplicación

### 1️⃣ Flujo de Registro y Onboarding

```
Usuario nuevo
    │
    ├─► Landing Page (/)
    │   └─► "Request Access" button
    │
    ├─► Formulario de solicitud
    │   ├─► Email
    │   ├─► Nombre del negocio
    │   └─► Tipo de negocio (servicios/productos/restaurante)
    │
    ├─► Firebase Function: handleAccessRequest()
    │   ├─► Crea documento en Firestore: accessRequests/{requestId}
    │   └─► Envía email a SUPERADMIN
    │
    ├─► SUPERADMIN revisa en /admin/access-requests
    │   ├─► Aprueba → processApproval()
    │   │   ├─► Crea usuario en Firebase Auth
    │   │   ├─► Envía email con credenciales
    │   │   └─► Asigna rol ENTREPRENEUR
    │   │
    │   └─► Rechaza → processRejection()
    │       └─► Envía email de rechazo
    │
    └─► Usuario recibe credenciales → Login
        │
        └─► Wizard de configuración (obligatorio first-time)
            ├─► Paso 1: Información básica (nombre, categoría)
            ├─► Paso 2: Personalización (logo, colores, banner)
            ├─► Paso 3: Integración WhatsApp
            └─► Paso 4: Configurar servicios o productos
```

### 2️⃣ Flujo de Gestión de Servicios (Barberías)

```
Emprendedor (ENTREPRENEUR)
    │
    ├─► Dashboard → Services
    │   └─► "New Service" button
    │
    ├─► Formulario de servicio
    │   ├─► Nombre (ej: "Corte de cabello")
    │   ├─► Descripción
    │   ├─► Precio
    │   ├─► Duración (30, 45, 60 min)
    │   ├─► Imagen (opcional)
    │   └─► Profesionales asignados (multi-select)
    │
    ├─► Guardar → services.ts → createService()
    │   └─► Firestore: companies/{companyId}/services/{serviceId}
    │
    └─► Página pública actualizada automáticamente
        └─► Visible en: /{companyId}/services
```

### 3️⃣ Flujo de Sistema de Citas (Booking)

```
Cliente visita página pública
    │
    ├─► /{companyId}/services → Selecciona servicio
    │
    ├─► Booking Widget público
    │   ├─► Selecciona profesional (dropdown)
    │   ├─► Calendario (react-datepicker)
    │   │   └─► Muestra solo horarios disponibles
    │   ├─► Horario disponible (calculado por getAvailableTimeSlots)
    │   ├─► Datos del cliente:
    │   │   ├─► Nombre
    │   │   ├─► Email
    │   │   └─► Teléfono
    │   └─► "Book Appointment" button
    │
    ├─► Cloud Function: handleAppointmentRequest()
    │   ├─► Valida disponibilidad en tiempo real
    │   ├─► Crea appointment con status: 'pending'
    │   ├─► Envía email a cliente (confirmación)
    │   └─► Envía email a emprendedor (nueva reserva)
    │
    ├─► Emprendedor ve en Dashboard → Appointments
    │   ├─► Lista de pending appointments
    │   ├─► "Confirm" → status: 'confirmed'
    │   │   └─► Envía email de confirmación
    │   ├─► "Reject" → status: 'cancelled'
    │   │   └─► Envía email de cancelación
    │   └─► "Complete" → status: 'completed'
    │
    └─► Recordatorios automáticos
        └─► Cloud Function scheduled (9 AM diaria)
            └─► Envía emails 24h antes de citas confirmadas
```

### 4️⃣ Flujo de Productos y Pedidos (Tiendas)

```
Cliente visita página pública
    │
    ├─► /{companyId}/products
    │   └─► Grid de productos (con filtros por categoría)
    │
    ├─► Selecciona producto → Click "Add to Cart"
    │   └─► State local con React Context
    │
    ├─► Carrito → "Checkout via WhatsApp"
    │   └─► Genera mensaje pre-formateado:
    │       "Hola! Quiero hacer un pedido:
    │        - [Producto 1] x2 - $XX
    │        - [Producto 2] x1 - $YY
    │        Total: $ZZ"
    │
    └─► Abre WhatsApp Web/App
        └─► Cliente envía mensaje directo al emprendedor
```

### 5️⃣ Flujo de Analytics y Reportes

```
Emprendedor
    │
    ├─► Dashboard → Reports
    │   └─► AppointmentsReport.tsx
    │
    ├─► Métricas mostradas:
    │   ├─► Total de citas (pending, confirmed, completed, cancelled)
    │   ├─► Gráfico de líneas (tendencias por día)
    │   ├─► Top 3 servicios más solicitados
    │   ├─► Tasa de confirmación (confirmed / total)
    │   └─► Ingresos estimados (completed appointments)
    │
    └─► Google Analytics 4 (automático)
        ├─► Page views
        ├─► Eventos custom (booking_start, booking_complete)
        ├─► Conversion tracking
        └─► Web Vitals (LCP, FID, CLS)
```

---

## 🔐 Seguridad y Autenticación

### Sistema de Roles

```typescript
// Roles disponibles
type UserRole = 'SUPERADMIN' | 'ENTREPRENEUR';

// Custom claims en Firebase Auth
user.customClaims = {
  role: 'ENTREPRENEUR',
  companyId: 'barberia-xyz-123'
}
```

### Firestore Security Rules (Resumen)

```javascript
// Multi-tenant isolation
match /companies/{companyId} {
  // Solo el dueño de la empresa puede escribir
  allow write: if request.auth.token.companyId == companyId;
  
  // Lectura pública para páginas públicas
  allow read: if true;
}

match /companies/{companyId}/services/{serviceId} {
  allow write: if request.auth.token.companyId == companyId;
  allow read: if true; // Público
}

match /companies/{companyId}/appointments/{appointmentId} {
  // Solo el dueño o el profesional pueden ver
  allow read: if request.auth.token.companyId == companyId;
  allow write: if request.auth.token.companyId == companyId;
}

// SUPERADMIN tiene acceso total
match /{document=**} {
  allow read, write: if request.auth.token.role == 'SUPERADMIN';
}
```

---

## 🌐 Sistema de Internacionalización (i18n)

### Estructura de Traducciones

```
src/locales/
  ├── en/
  │   ├── common.json           # Textos comunes (botones, labels)
  │   ├── auth.json             # Login, register, recovery
  │   ├── dashboard.json        # Dashboard y navegación
  │   ├── services.json         # Gestión de servicios
  │   ├── products.json         # Gestión de productos
  │   ├── appointments.json     # Sistema de citas
  │   └── marketing.json        # Landing page
  │
  └── es/
      ├── common.json
      ├── auth.json
      ├── dashboard.json
      ├── services.json
      ├── products.json
      ├── appointments.json
      └── marketing.json
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <button>{t('common:save')}</button>
  );
}
```

---

## 📊 Stack de Testing

### Tests Unitarios (Vitest)

```bash
# Ejecutar todos los tests
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Cobertura actual**: ~70% de código crítico

### Tests E2E (Playwright)

```bash
# Ejecutar E2E tests
npm run test:e2e

# UI mode (debugging)
npm run test:e2e:ui

# Solo Chrome
npm run test:e2e:chrome

# Ver reporte
npm run test:e2e:report
```

**Tests implementados**:
- ✅ Autenticación (login, logout, recovery)
- ✅ Dashboard navigation
- ✅ Booking widget público
- ✅ CRUD de servicios
- ✅ CRUD de productos
- ✅ Gestión de citas

---

## 🚀 Despliegue (Deployment)

### Opciones de Deploy

1. **Firebase Hosting** (recomendado para producción)
```bash
npm run build
firebase deploy --only hosting
```

2. **Vercel** (alternativa)
```bash
vercel --prod
```

### Variables de Entorno Requeridas

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_FUNCTIONS_REGION=us-central1

# Google Maps (solo si usas mapas)
VITE_GOOGLE_MAPS_API_KEY=

# Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Monitoring
VITE_SENTRY_DSN=

# SendGrid (en Firebase Functions)
SENDGRID_API_KEY=
```

### Pre-Deploy Checklist

- [ ] Tests unitarios pasan (`npm test`)
- [ ] Tests E2E pasan (`npm run test:e2e`)
- [ ] Build sin errores (`npm run build`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Cloud Functions deployed (`firebase deploy --only functions`)
- [ ] Variables de entorno configuradas
- [ ] Analytics configurado

---

## 📈 Características Técnicas Destacadas

### ⚡ Performance
- **Vite** para build ultra-rápido
- **Code splitting** automático por rutas
- **Lazy loading** de componentes pesados
- **PWA** con Service Worker para cache offline
- **Image optimization** en uploads

### 🔒 Seguridad
- **Firestore Security Rules** estrictas
- **Multi-tenant isolation** por companyId
- **Rate limiting** en Cloud Functions
- **Input validation** con Validator.js
- **XSS protection** con DOMPurify
- **CORS** configurado correctamente

### ♿ Accesibilidad
- **WCAG 2.1 Level AA** compliance
- Tests automáticos con **jest-axe**
- Navegación por teclado completa
- ARIA labels en todos los elementos interactivos
- Contraste de colores validado

### 🌍 SEO
- **React Helmet Async** para meta tags dinámicos
- **Sitemap.xml** generado automáticamente
- **robots.txt** configurado
- **Open Graph** tags para redes sociales
- **Structured data** (JSON-LD) para páginas públicas

### 📱 Mobile-First
- **Responsive design** con Tailwind
- **Touch-friendly** UI components
- **PWA** installable en móviles
- **Optimizado para pantallas táctiles**

---

## 🎨 Personalización Visual

Los emprendedores pueden personalizar:

1. **Logo** (upload PNG/JPG, max 5MB)
2. **Banner** principal (upload PNG/JPG)
3. **Colores** (primary, secondary, accent)
4. **Fuentes** (Google Fonts integration)
5. **Información de contacto** (teléfono, WhatsApp, email, dirección)
6. **Redes sociales** (Instagram, Facebook, Twitter)

Todas las personalizaciones se aplican en tiempo real a la página pública.

---

## 📚 Documentación Adicional

- [README.md](./README.md) - Instalación y quick start
- [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) - Configuración de variables
- [FIRESTORE_RULES_FINAL.md](./FIRESTORE_RULES_FINAL.md) - Seguridad Firestore
- [APPOINTMENTS_SYSTEM.md](./APPOINTMENTS_SYSTEM.md) - Sistema de citas completo
- [I18N_GUIDE.md](./I18N_GUIDE.md) - Guía de internacionalización
- [PLAYWRIGHT_SETUP.md](./PLAYWRIGHT_SETUP.md) - Testing E2E
- [DEPLOY_FINAL.md](./DEPLOY_FINAL.md) - Guía de despliegue

---

## 🎯 Roadmap Futuro

### Corto Plazo
- [ ] Integración con pasarelas de pago (Stripe, Mercado Pago)
- [ ] Sistema de membresías/suscripciones para emprendedores
- [ ] App móvil nativa (React Native)
- [ ] Notificaciones push

### Mediano Plazo
- [ ] Marketplace de servicios (conectar emprendedores con clientes)
- [ ] Sistema de reviews y ratings
- [ ] Programa de referidos
- [ ] Dashboard de inventarios para tiendas

### Largo Plazo
- [ ] IA para recomendaciones personalizadas
- [ ] Chatbot de atención al cliente
- [ ] Integración con redes sociales (Facebook Shop, Instagram Shop)

---

## 👥 Contacto y Contribución

Para contribuir al proyecto, consulta [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0.0  
**Licencia**: MIT
