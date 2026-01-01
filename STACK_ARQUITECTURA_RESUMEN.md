# 📋 Resumen Completo: Stack y Arquitectura - PYM-ERP/AgendaWeb

> **Documento para ChatGPT**: Este documento proporciona una visión completa del proyecto, su stack tecnológico, arquitectura, patrones de diseño y convenciones para facilitar la comprensión del sistema.

---

## 🎯 Visión General del Proyecto

**PYM-ERP (AgendaWeb)** es una plataforma SaaS multi-tenant para emprendedores que permite:

- **Gestionar servicios profesionales** (con sistema de citas/reservas)
- **Gestionar catálogos de productos** (con sistema de pedidos)
- **Tener presencia web** con páginas públicas personalizadas (`/:companyId`)
- **Integración con WhatsApp** para recibir consultas, reservas y pedidos
- **Personalización visual completa** (logo, banner, colores, fuentes)
- **Sistema de solicitud de acceso** para nuevos emprendedores

### Roles de Usuario
- **SUPERADMIN**: Administra solicitudes de acceso y gestiona usuarios
- **ENTREPRENEUR**: Propietarios de emprendimientos (1 usuario = 1 empresa)

---

## 🛠 Stack Tecnológico Completo

### **Frontend Core**
```
React 18.3              → UI Library (Hooks, Suspense)
TypeScript 5.5          → Type safety en todo el código
Vite 5.x                → Build tool ultra-rápido + HMR
```

### **Routing & State Management**
```
React Router 6.28       → Routing con loader/action patterns
Context API             → Estado global (AuthContext, LanguageContext, ThemeContext)
Custom Hooks            → useAuth(), useErrorHandler(), useAnalytics(), usePWA()
```

### **Styling & UI**
```
Tailwind CSS 3.x        → Utility-first CSS framework
Framer Motion 12.x      → Animaciones y transiciones de página
react-hot-toast 2.4     → Notificaciones toast
react-datepicker 7.5    → Date picker para citas
```

### **Backend as a Service (Firebase 12.6)**
```
Firebase Auth           → Autenticación email/password
Firestore               → Base de datos NoSQL con reglas de seguridad
Firebase Storage        → Almacenamiento de imágenes (logos, banners)
Cloud Functions         → Backend serverless (Node.js) para emails
Firebase Hosting        → Hosting estático para la SPA
```

### **Internacionalización**
```
i18next 25.7            → Framework i18n
react-i18next 16.3      → Integración con React
i18next-http-backend    → Carga asíncrona de traducciones
Language Detector       → Detección automática del idioma del navegador
```

**Idiomas soportados**: Español (es), Inglés (en)

### **Analytics & Monitoring**
```
Google Analytics 4      → Tracking de eventos y conversiones
react-ga4 2.1           → Integración GA4 con React
Web Vitals 5.1          → Core Web Vitals (LCP, FID, CLS)
Sentry 10.27            → Error tracking y performance monitoring
```

### **Maps & Geolocation**
```
@react-google-maps/api 2.20  → Google Maps integration
```

### **PWA (Progressive Web App)**
```
vite-plugin-pwa 1.2     → Plugin PWA para Vite
Workbox 7.4             → Service Worker para caching
workbox-window          → Comunicación con SW
```

### **Utilities**
```
date-fns 4.1            → Manipulación de fechas
validator               → Validación de inputs (email, URL, phone)
DOMPurify               → Sanitización XSS (en proceso)
```

### **Testing**
```
Vitest 3.2              → Unit testing (compatible con Jest)
@testing-library/react  → Testing de componentes
@testing-library/user-event → Simulación de eventos de usuario
jest-axe                → Testing de accesibilidad
Playwright 1.50         → E2E testing (multi-browser)
```

### **Email Service**
```
SendGrid                → Emails transaccionales vía Firebase Functions
```

### **DevOps & Deployment**
```
Vercel                  → Hosting principal (recomendado)
Firebase Hosting        → Hosting alternativo
GitHub Actions          → CI/CD (tests + deploy automático)
```

---

## 🏗 Arquitectura del Sistema

### **Tipo de Aplicación**
- **SPA (Single Page Application)** con React
- **Multi-tenant**: cada emprendedor tiene su propia "empresa" (`company_id`)
- **Rutas públicas**: `/:companyId` (páginas de emprendimientos)
- **Rutas protegidas**: `/dashboard/*`, `/admin/*`, `/setup/*`

### **Modelo de Autenticación Dual**

```
┌─────────────────────────────────────┐
│  Firebase Auth (Authentication)     │
│  - uid, email, emailVerified        │
└──────────────┬──────────────────────┘
               │
               ├─ custom claims: { company_id }
               │
               ▼
┌─────────────────────────────────────┐
│  Firestore User Profile             │
│  - role, status, company_id         │
│  - firstName, lastName, phone       │
└─────────────────────────────────────┘
```

**Hook centralizado**: `useAuth()` retorna `{ firebaseUser, firestoreUser, loading }`

### **Arquitectura en Capas**

```
┌─────────────────────────────────────────────┐
│          PRESENTATION LAYER                 │
│  (Pages, Components, Hooks)                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          SERVICE LAYER                      │
│  (src/services/*.ts)                        │
│  - auth.ts, firestore.ts, storage.ts        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          FIREBASE SDK                       │
│  (Auth, Firestore, Storage, Functions)     │
└─────────────────────────────────────────────┘
```

**Regla importante**: Los componentes **NUNCA** importan Firebase SDK directamente, siempre usan la capa de servicios.

### **Estructura de Base de Datos (Firestore)**

```
firestore
├── users/{userId}
│   ├── email, role, status, company_id
│   ├── firstName, lastName, phone
│   └── createdAt, updatedAt
│
├── access_requests/{requestId}
│   ├── email, firstName, lastName
│   ├── status: PENDING | APPROVED | REJECTED
│   └── timestamps
│
├── companies/{companyId}
│   ├── name, slug, description
│   ├── businessType: SERVICES | PRODUCTS
│   ├── branding: { primaryColor, logo, banner }
│   ├── contact: { phone, email, address, maps }
│   └── owner: userId
│
├── services/{serviceId}
│   ├── company_id (owner)
│   ├── name, description, price
│   ├── duration, schedule
│   └── imageUrl
│
├── products/{productId}
│   ├── company_id (owner)
│   ├── name, description, price
│   ├── stock, category
│   └── imageUrl
│
├── appointments/{appointmentId}
│   ├── company_id, service_id
│   ├── clientName, clientPhone
│   ├── dateTime, status
│   └── whatsappMessageSent
│
├── orders/{orderId}
│   ├── company_id
│   ├── items: [{ product_id, quantity, price }]
│   ├── clientName, clientPhone
│   ├── total, status
│   └── whatsappMessageSent
│
└── analytics_events/{eventId}
    ├── company_id, event_type
    ├── metadata: { page, action }
    └── timestamp
```

### **Reglas de Seguridad Firestore**

```javascript
// Patrón principal: ownership validation
function ownsCompany(companyId) {
  return request.auth.uid != null &&
         request.auth.token.company_id == companyId;
}

// Usuarios solo pueden leer/escribir sus propios datos
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}

// Empresas: solo el propietario puede editar
match /companies/{companyId} {
  allow read: if true;  // Públicas
  allow write: if ownsCompany(companyId);
}

// Servicios/Productos: solo el dueño de la empresa
match /services/{serviceId} {
  allow read: if true;
  allow create, update, delete: if ownsCompany(resource.data.company_id);
}
```

**Deterministic IDs**: Los usuarios se almacenan con su `userId` (no auto-generados) para que coincida con `request.auth.uid` en las reglas.

---

## 🔐 Flujos de Autenticación y Autorización

### **Flujo de Registro (Nuevos Emprendedores)**

```
1. Usuario visita /request-access
2. Completa formulario (email, nombre, apellido)
3. Se crea documento en collection `access_requests`
4. Status: PENDING
5. Email de confirmación al usuario
6. Email de notificación al admin

ADMIN:
7. Admin ve solicitud en /admin/dashboard
8. Admin aprueba o rechaza
9. Si aprueba:
   - Se crea cuenta en Firebase Auth
   - Se crea perfil en Firestore (role: ENTREPRENEUR)
   - Se envía email con contraseña temporal
   - Usuario tiene status: FORCE_PASSWORD_CHANGE

USUARIO:
10. Usuario hace login con contraseña temporal
11. Se fuerza cambio de contraseña
12. Status cambia a ACTIVE
13. Redirige a /setup (wizard de configuración)
```

### **Flujo de Setup (Wizard de Primera Configuración)**

```
/setup/company-info     → Información básica de la empresa
/setup/branding         → Logo, banner, colores
/setup/business-type    → SERVICES o PRODUCTS
/setup/services         → (Si SERVICES) Agregar servicios
/setup/products         → (Si PRODUCTS) Agregar productos
/setup/complete         → Resumen y finalización
```

### **Roles y Permisos**

```typescript
enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ENTREPRENEUR = 'ENTREPRENEUR'
}

enum UserStatus {
  PENDING = 'PENDING',              // Esperando aprobación
  FORCE_PASSWORD_CHANGE = 'FORCE_PASSWORD_CHANGE',  // Debe cambiar password
  ACTIVE = 'ACTIVE',                // Activo
  INACTIVE = 'INACTIVE'             // Desactivado
}
```

**Rutas Protegidas**:
```tsx
<ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>
  <DashboardLayout />
</ProtectedRoute>

<ProtectedRoute requiredRole={UserRole.SUPERADMIN}>
  <AdminDashboard />
</ProtectedRoute>

<ProtectedRoute requireActive={false}>
  // Permite acceso incluso con FORCE_PASSWORD_CHANGE
  <ChangePassword />
</ProtectedRoute>
```

---

## 🎨 Patrones de Diseño y Convenciones

### **1. Service Layer Pattern**

Toda la lógica de Firebase está abstraída en servicios:

```typescript
// ❌ MAL - Nunca en componentes
import { collection, addDoc } from 'firebase/firestore';

// ✅ BIEN - Usar servicio
import { createService } from '@/services/firestore';

const newService = await createService(serviceData);
```

### **2. Custom Hooks Pattern**

```typescript
// useAuth() - Autenticación
const { firebaseUser, firestoreUser, loading } = useAuth();

// useErrorHandler() - Manejo de errores
const { handleError, handleAsyncError } = useErrorHandler();

// useAnalytics() - Tracking
const { trackClick, trackConversion } = useAnalytics();

// usePWA() - Progressive Web App
const { needRefresh, offlineReady, updateServiceWorker } = usePWA();
```

### **3. Protected Routes Pattern**

```typescript
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  
  <Route element={<ProtectedRoute requiredRole={UserRole.ENTREPRENEUR} />}>
    <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<Overview />} />
      <Route path="services" element={<Services />} />
      <Route path="products" element={<Products />} />
    </Route>
  </Route>
  
  <Route path="/:companyId" element={<PublicPage />} />
</Routes>
```

### **4. Configuration Centralization**

```typescript
// ❌ MAL
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// ✅ BIEN
import { env } from '@/config/env';
const apiKey = env.firebase.apiKey;
```

### **5. Error Handling Pattern**

```typescript
// Sincrónico
try {
  await someOperation();
} catch (error) {
  handleError(error, {
    context: 'Crear servicio',
    showToast: true,
    logToSentry: true
  });
}

// Asíncrono con wrapper
const result = await handleAsyncError(
  () => createService(data),
  { context: 'Crear servicio' }
);
```

### **6. i18n Pattern**

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('dashboard'); // namespace
  
  return (
    <h1>{t('welcome', { name: user.firstName })}</h1>
  );
}
```

**Namespaces disponibles**: `common`, `auth`, `dashboard`, `admin`, `errors`, `setup`

---

## 📱 Características PWA

### **Service Worker (Workbox)**

Cache strategies:
```javascript
// Imágenes de Firebase Storage
networkFirst({ maxAge: 7 days })

// Assets estáticos (JS, CSS)
cacheFirst({ maxAge: 30 days })

// Fonts de Google
cacheFirst({ maxAge: 365 days })

// API calls de Firestore
networkFirst({ fallback: cache })
```

### **Instalación de la PWA**

```typescript
// Detectar si la app es instalable
const [deferredPrompt, setDeferredPrompt] = useState(null);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setDeferredPrompt(e);
});

// Mostrar botón de instalación
<button onClick={async () => {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    trackEvent('pwa_installed');
  }
}}>
  Instalar App
</button>
```

---

## 🔄 Flujos Principales del Negocio

### **Flujo de Reserva de Servicio (WhatsApp)**

```
1. Cliente visita página pública: /:companyId
2. Ve listado de servicios disponibles
3. Click en "Reservar por WhatsApp"
4. Se genera mensaje pre-formateado con:
   - Nombre del servicio
   - Precio
   - Duración
   - Link a la página del servicio
5. Abre WhatsApp Web/App con el mensaje
6. Cliente envía mensaje al emprendedor
7. Se registra evento en Analytics: SERVICE_BOOK_CLICK
```

### **Flujo de Pedido de Producto (WhatsApp)**

```
1. Cliente visita página pública: /:companyId
2. Agrega productos al carrito (localStorage)
3. Revisa carrito con totales
4. Click en "Hacer pedido por WhatsApp"
5. Se genera mensaje con:
   - Lista de productos y cantidades
   - Total del pedido
   - Datos de contacto ingresados
6. Abre WhatsApp con el mensaje pre-formateado
7. Se registra evento en Analytics: PRODUCT_ORDER_CLICK
```

### **Flujo de Personalización de Marca**

```
1. Emprendedor va a /dashboard/settings/branding
2. Sube logo (Firebase Storage)
3. Sube banner (Firebase Storage)
4. Selecciona colores primarios/secundarios
5. Selecciona fuentes (Google Fonts)
6. Preview en tiempo real
7. Guarda cambios en Firestore (companies/{companyId})
8. Los cambios se reflejan instantáneamente en /:companyId
```

---

## 📊 Analytics y Eventos

### **Eventos Rastreados**

```typescript
enum EventType {
  PAGE_VIEW = 'page_view',
  WHATSAPP_CLICK = 'whatsapp_click',
  SERVICE_BOOK_CLICK = 'service_book_click',
  PRODUCT_ORDER_CLICK = 'product_order_click',
  FORM_SUBMIT = 'form_submit',
  ERROR_OCCURRED = 'error_occurred'
}
```

### **Custom Hooks de Analytics**

```typescript
// Auto-tracking de page views
usePageTracking(); // En cada página

// Tracking manual
const { trackClick, trackConversion } = useAnalytics();

trackClick('whatsapp_contact');
trackConversion('service_booking', { serviceId, price });

// Time on page
useTimeOnPage('dashboard/services');
```

---

## 🧪 Testing Strategy

### **Unit Tests (Vitest)**

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # Con cobertura
```

**Convenciones**:
- Tests en `*.test.tsx` junto al componente
- Mock de Firebase en `src/test/setupTests.ts`
- Testing Library para componentes
- jest-axe para accesibilidad

### **E2E Tests (Playwright)**

```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # Con browser visible
npm run test:e2e:debug    # Debug mode
```

**Convenciones**:
- Tests en `e2e/*.spec.ts`
- Fixtures en `e2e/fixtures/`
- Mock de Firebase con `setupFirebaseMocks(page)`
- Mock de autenticación: `localStorage.setItem('e2e:user', 'founder')`

**Mock Users**:
```typescript
'founder'  → Entrepreneur con services
'seller'   → Entrepreneur con products
'admin'    → Superadmin
'force'    → Usuario con FORCE_PASSWORD_CHANGE
```

---

## 🚀 Deployment

### **Vercel (Recomendado)**

```bash
# Setup inicial
npm run setup:vercel

# Preview deploy
npm run deploy:vercel:preview

# Production deploy
npm run deploy:vercel:prod
```

**Variables de entorno requeridas en Vercel**:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GOOGLE_MAPS_API_KEY
VITE_GA4_MEASUREMENT_ID
VITE_SENTRY_DSN
```

### **Firebase Hosting (Alternativo)**

```bash
npm run deploy                # Full deploy
npm run deploy:hosting        # Solo hosting
npm run deploy:firestore      # Solo Firestore rules
npm run deploy:storage        # Solo Storage rules
```

### **CI/CD con GitHub Actions**

Workflows automáticos:
- `.github/workflows/test.yml` → Tests en cada push
- `.github/workflows/e2e.yml` → E2E tests en cada PR
- `.github/workflows/deploy-vercel.yml` → Deploy automático a Vercel en merge a main

---

## 📁 Estructura de Archivos Clave

```
AGENDAWEB/
├── src/
│   ├── components/
│   │   ├── animations/          # Animaciones Framer Motion
│   │   ├── DashboardLayout.tsx  # Layout principal del dashboard
│   │   ├── ProtectedRoute.tsx   # HOC para rutas protegidas
│   │   └── PWAInstallPrompt.tsx # Prompt de instalación PWA
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Estado global de autenticación
│   │   ├── LanguageContext.tsx  # i18n state
│   │   └── ThemeContext.tsx     # Dark/light mode
│   │
│   ├── pages/
│   │   ├── admin/               # Panel de administración
│   │   ├── dashboard/           # Dashboard emprendedor
│   │   ├── public/              # Páginas públicas (/:companyId)
│   │   ├── setup/               # Wizard de configuración
│   │   ├── Landing.tsx          # Página de inicio
│   │   └── Login.tsx            # Login page
│   │
│   ├── services/
│   │   ├── auth.ts              # Firebase Auth operations
│   │   ├── firestore.ts         # Firestore CRUD
│   │   ├── storage.ts           # Firebase Storage
│   │   ├── email.ts             # SendGrid via Functions
│   │   └── admin.ts             # Admin operations
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           # Re-exporta AuthContext
│   │   ├── useErrorHandler.ts   # Error handling hook
│   │   ├── useAnalytics.ts      # Analytics tracking
│   │   └── usePWA.ts            # PWA features
│   │
│   ├── config/
│   │   ├── env.ts               # Environment variables wrapper
│   │   ├── firebase.ts          # Firebase initialization
│   │   ├── sentry.ts            # Sentry initialization
│   │   └── analytics.ts         # GA4 initialization
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript types centralizados
│   │
│   ├── utils/
│   │   ├── logger.ts            # Console replacement
│   │   ├── security.ts          # Input sanitization
│   │   ├── password.ts          # Password validation
│   │   └── slug.ts              # URL slug generation
│   │
│   ├── App.tsx                  # Router principal
│   ├── main.tsx                 # Entry point
│   └── i18n.ts                  # i18next configuration
│
├── public/
│   ├── locales/                 # Traducciones
│   │   ├── es/                  # Español
│   │   └── en/                  # Inglés
│   ├── _headers                 # Security headers (Vercel)
│   ├── robots.txt               # SEO
│   └── sitemap.xml              # SEO
│
├── functions/                   # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts             # SendGrid email proxy
│   ├── package.json
│   └── tsconfig.json
│
├── e2e/                         # Playwright tests
│   ├── fixtures/                # Test fixtures
│   ├── admin.spec.ts
│   ├── auth.spec.ts
│   └── products.spec.ts
│
├── docs/                        # Documentación técnica
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY_AUDIT.md
│   └── TROUBLESHOOTING.md
│
├── .github/
│   ├── workflows/               # GitHub Actions
│   └── SECRETS.md               # Guía de secrets
│
├── firestore.rules              # Reglas de seguridad Firestore
├── storage.rules                # Reglas de seguridad Storage
├── firebase.json                # Firebase config
├── playwright.config.ts         # Playwright config
├── vite.config.ts               # Vite config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

## 🔧 Variables de Entorno

### **Archivos de Configuración**

```
.env.local              # Development (gitignored)
.env.production         # Production (gitignored)
.env.example            # Template (commiteado)
```

### **Variables Requeridas**

```bash
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google Services
VITE_GOOGLE_MAPS_API_KEY=
VITE_GA4_MEASUREMENT_ID=

# Monitoring
VITE_SENTRY_DSN=

# Environment
VITE_APP_ENV=development|production
```

**Verificación**:
```bash
npm run verify:secrets
```

---

## 🔒 Seguridad

### **Content Security Policy**

En `public/_headers`:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://firebasestorage.googleapis.com https://maps.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://sentry.io
```

### **Input Sanitization**

```typescript
import { sanitizeInput, sanitizePhone, isValidEmail } from '@/utils/security';

const cleanInput = sanitizeInput(userInput);  // XSS prevention
const phone = sanitizePhone(phoneInput);      // Solo dígitos
const isValid = isValidEmail(email);          // Validación
```

### **Rate Limiting**

En Firebase Functions:
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
});
```

---

## 🎯 Próximos Pasos y Roadmap

### **En Progreso**
- [ ] Finalizar sanitización DOMPurify
- [ ] Implementar rate limiting en todas las Functions
- [ ] Agregar más tests E2E
- [ ] Optimizar performance (code splitting, lazy loading)

### **Planificado**
- [ ] Social auth (Google, Facebook)
- [ ] Sistema de notificaciones push
- [ ] Dashboard de analytics mejorado
- [ ] Modo offline completo (PWA)
- [ ] Exportación de datos (CSV, PDF)
- [ ] Multi-idioma (más de 2 idiomas)

---

## 📚 Documentación Adicional

- **[ENV_VARIABLES_GUIDE.md](ENV_VARIABLES_GUIDE.md)** → Guía completa de variables de entorno
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** → Arquitectura detallada
- **[docs/API.md](docs/API.md)** → Referencia de API/servicios
- **[docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)** → Auditoría de seguridad
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** → Solución de problemas comunes
- **[copilot-instructions.md](copilot-instructions.md)** → Instrucciones para AI agents

---

## 💡 Convenciones de Código

### **Naming Conventions**

```typescript
// Componentes: PascalCase
export const DashboardLayout = () => {}

// Hooks: camelCase con prefijo 'use'
export const useAuth = () => {}

// Servicios: camelCase
export const createService = async () => {}

// Constantes: UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Types/Interfaces: PascalCase
export interface User {}
export type UserStatus = 'ACTIVE' | 'INACTIVE';
```

### **Imports Order**

```typescript
// 1. React & third-party
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal imports (absolute paths con @/)
import { useAuth } from '@/contexts/AuthContext';
import { createService } from '@/services/firestore';

// 3. Types
import type { Service } from '@/types';

// 4. Styles
import './styles.css';
```

### **Component Structure**

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title }) => {
  // 3.1. Hooks
  const [state, setState] = useState();
  
  // 3.2. Effects
  useEffect(() => {}, []);
  
  // 3.3. Handlers
  const handleClick = () => {};
  
  // 3.4. Render helpers
  const renderContent = () => {};
  
  // 3.5. Return
  return <div>{title}</div>;
};
```

---

## 🤝 Contribución

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar nueva funcionalidad
fix: corregir un bug
docs: cambios en documentación
style: formateo, punto y coma, etc
refactor: refactorización de código
test: agregar tests
chore: actualizar dependencias, configs
```

---

**Última actualización**: 22 de diciembre de 2025
**Versión del documento**: 1.0.0
