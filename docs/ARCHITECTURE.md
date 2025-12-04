# 🏗 Arquitectura del Sistema

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Base de Datos](#base-de-datos)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Patrones de Diseño](#patrones-de-diseño)
- [Flujos Principales](#flujos-principales)
- [Decisiones Técnicas](#decisiones-técnicas)

## Visión General

PYM-ERP es una aplicación SPA (Single Page Application) construida con React y TypeScript, usando Firebase como Backend-as-a-Service (BaaS). La arquitectura sigue principios de:

- **Component-Based**: UI dividida en componentes reutilizables
- **State Management**: Context API para estado global
- **Service Layer**: Abstracción de lógica de negocio
- **Type Safety**: TypeScript en toda la aplicación
- **Progressive Enhancement**: Funciona sin JavaScript (SSR futuro)

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE HOSTING                         │
│                   (Static Site - React)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
        ▼            ▼            ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Firebase  │  │Firestore │  │Storage   │  │Functions │
│Auth      │  │Database  │  │(Images)  │  │(Node.js) │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
                                                │
                                                ▼
                                         ┌──────────┐
                                         │SendGrid  │
                                         │(Emails)  │
                                         └──────────┘
```

### Servicios Externos

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT APPLICATION                        │
└────────────────────┬───────────────────────┬────────────────┘
                     │                       │
        ┌────────────┼──────────┐           │
        │            │          │           │
        ▼            ▼          ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Google    │  │Google    │  │Sentry    │  │Analytics │
│Maps API  │  │Analytics │  │(Errors)  │  │Web Vitals│
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Frontend Architecture

### Estructura de Carpetas

```
src/
├── components/           # Componentes reutilizables
│   ├── animations/      # Componentes con animaciones
│   │   ├── AnimatedButton.tsx
│   │   ├── AnimatedModal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── DashboardLayout.tsx
│   ├── LanguageSelector.tsx
│   ├── ProtectedRoute.tsx
│   └── ThemeToggle.tsx
│
├── contexts/            # React Contexts (Estado Global)
│   ├── AuthContext.tsx       # Usuario y autenticación
│   ├── LanguageContext.tsx   # i18n
│   └── ThemeContext.tsx      # Tema claro/oscuro
│
├── pages/               # Componentes de página (Routes)
│   ├── admin/          # Panel administrador
│   │   └── AdminDashboard.tsx
│   ├── dashboard/      # Dashboard emprendedor
│   │   ├── DashboardOverview.tsx
│   │   ├── products/
│   │   └── services/
│   ├── info/           # Páginas informativas
│   ├── public/         # Páginas públicas
│   │   └── PublicPage.tsx
│   ├── setup/          # Wizard configuración
│   ├── ChangePassword.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   └── RequestAccess.tsx
│
├── services/            # Lógica de negocio & API calls
│   ├── admin.ts        # Funciones admin
│   ├── auth.ts         # Autenticación
│   ├── email.ts        # Envío emails
│   ├── firestore.ts    # CRUD Firestore
│   └── storage.ts      # Firebase Storage
│
├── hooks/              # Custom React Hooks
│   ├── useErrorHandler.ts
│   └── usePageTracking.ts
│
├── config/             # Configuraciones
│   ├── analytics.ts    # Google Analytics
│   ├── env.ts         # Variables entorno
│   ├── firebase.ts    # Firebase config
│   ├── i18n.ts        # Internacionalización
│   └── sentry.ts      # Sentry config
│
├── types/              # TypeScript Types
│   └── index.ts
│
└── utils/              # Funciones utilidad
    ├── logger.ts
    ├── password.ts
    ├── slug.ts
    └── usePageMeta.ts
```

### Component Hierarchy

```
App
├── AuthProvider
│   ├── LanguageProvider
│   │   ├── ThemeProvider
│   │   │   ├── Router
│   │   │   │   ├── Landing
│   │   │   │   ├── Login
│   │   │   │   ├── RequestAccess
│   │   │   │   └── ProtectedRoute
│   │   │   │       ├── DashboardLayout
│   │   │   │       │   ├── Dashboard
│   │   │   │       │   ├── Services
│   │   │   │       │   └── Products
│   │   │   │       └── AdminDashboard
```

### State Management

**Context API** para estado global:

1. **AuthContext**: 
   - Usuario Firebase autenticado
   - Usuario Firestore (datos adicionales)
   - Estado de carga
   
2. **LanguageContext**:
   - Idioma actual
   - Función de cambio de idioma
   - Función de traducción
   
3. **ThemeContext**:
   - Tema actual (light/dark)
   - Función toggle

**Local State** con useState/useReducer para estado de componentes.

### Routing

React Router 6 con:
- **Public Routes**: Landing, Login, RequestAccess, PublicPage
- **Protected Routes**: Dashboard, Services, Products
- **Admin Routes**: AdminDashboard (solo SUPERADMIN)
- **Setup Routes**: Wizard de configuración (si setup incompleto)

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/request-access" element={<RequestAccess />} />
  <Route path="/:slug" element={<PublicPage />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/services" element={<ServicesList />} />
    <Route path="/dashboard/products" element={<ProductsList />} />
  </Route>
  
  <Route element={<ProtectedRoute requireAdmin />}>
    <Route path="/admin" element={<AdminDashboard />} />
  </Route>
</Routes>
```

## Backend Architecture

### Firebase Services

#### 1. Authentication
- Email/Password authentication
- Custom claims para roles (SUPERADMIN, ENTREPRENEUR)
- Session management

#### 2. Firestore Database
Colecciones principales:

```
firestore/
├── users/                    # Usuarios del sistema
│   └── {userId}
│       ├── email: string
│       ├── role: UserRole
│       ├── status: UserStatus
│       ├── company_id?: string
│       └── created_at: Timestamp
│
├── access_requests/          # Solicitudes de acceso
│   └── {requestId}
│       ├── full_name: string
│       ├── email: string
│       ├── business_name: string
│       ├── whatsapp: string
│       ├── status: AccessRequestStatus
│       └── created_at: Timestamp
│
├── companies/                # Empresas/Emprendimientos
│   └── {companyId}
│       ├── name: string
│       ├── slug: string (unique)
│       ├── owner_user_id: string
│       ├── business_type: BusinessType
│       ├── setup_completed: boolean
│       └── ...
│
├── services/                 # Servicios (si business_type = SERVICES)
│   └── {serviceId}
│       ├── company_id: string
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── duration_minutes: number
│       └── ...
│
├── products/                 # Productos (si business_type = PRODUCTS)
│   └── {productId}
│       ├── company_id: string
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── stock: number
│       └── ...
│
├── events/                   # Eventos de analytics
│   └── {eventId}
│       ├── company_id: string
│       ├── event_type: EventType
│       ├── metadata: object
│       └── created_at: Timestamp
│
└── company_appearance/       # Apariencia visual por empresa
    └── {appearanceId}
        ├── company_id: string
        ├── logo_url?: string
        ├── banner_url?: string
        ├── colors: object
        └── fonts: object
```

#### 3. Cloud Functions

```typescript
functions/
└── src/
    └── index.ts
        ├── sendAccessRequestEmailHttp()    # Email solicitud acceso
        ├── sendUserCreationEmailHttp()     # Email bienvenida usuario
        └── setUserPassword()               # Establecer contraseña
```

**Funciones HTTP:**
- CORS habilitado
- Validación de inputs
- Manejo de errores
- Logging estructurado

#### 4. Storage

```
storage/
├── logos/
│   └── {companyId}/
│       └── logo.{ext}
│
├── banners/
│   └── {companyId}/
│       └── banner.{ext}
│
└── products/
    └── {productId}/
        └── {imageId}.{ext}
```

### Security Rules

#### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isSuperAdmin() {
      return request.auth.token.role == 'SUPERADMIN';
    }
    
    function isCompanyOwner(companyId) {
      return request.auth.token.company_id == companyId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && 
                     (request.auth.uid == userId || isSuperAdmin());
      allow write: if isSuperAdmin();
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if true; // Públicas
      allow write: if isAuthenticated() && 
                      (isCompanyOwner(companyId) || isSuperAdmin());
    }
    
    // Services/Products
    match /services/{serviceId} {
      allow read: if true;
      allow write: if isAuthenticated() && 
                      isCompanyOwner(resource.data.company_id);
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{companyId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.company_id == companyId;
    }
  }
}
```

## Base de Datos

### Modelo de Datos

#### Users
```typescript
interface User {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ENTREPRENEUR';
  status: 'ACTIVE' | 'INACTIVE' | 'FORCE_PASSWORD_CHANGE';
  company_id?: string;
  created_at: Date;
}
```

#### Companies
```typescript
interface Company {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  business_type: 'SERVICES' | 'PRODUCTS';
  setup_completed: boolean;
  whatsapp: string;
  address: string;
  latitude?: number;
  longitude?: number;
  // ... más campos
}
```

### Índices Firestore

```javascript
// Compound indexes
companies: [
  { fields: ['slug'], unique: true },
  { fields: ['owner_user_id', 'created_at'] }
]

services: [
  { fields: ['company_id', 'created_at'] },
  { fields: ['company_id', 'active'] }
]

products: [
  { fields: ['company_id', 'created_at'] },
  { fields: ['company_id', 'category', 'active'] }
]

events: [
  { fields: ['company_id', 'event_type', 'created_at'] }
]
```

## Autenticación y Autorización

### Flujo de Autenticación

```
1. Usuario ingresa email/password
        ↓
2. signInWithEmailAndPassword (Firebase Auth)
        ↓
3. onAuthStateChanged detecta cambio
        ↓
4. Obtener usuario Firestore (rol, company_id, etc.)
        ↓
5. Verificar status (FORCE_PASSWORD_CHANGE?)
        ↓
6. Redirigir según rol y estado
```

### Custom Claims

```typescript
// Admin SDK (Functions)
await admin.auth().setCustomUserClaims(userId, {
  role: 'SUPERADMIN',
  company_id: 'company-123'
});

// Cliente
const token = await user.getIdTokenResult();
const role = token.claims.role;
const companyId = token.claims.company_id;
```

### Protected Routes

```typescript
// ProtectedRoute.tsx
export default function ProtectedRoute({ 
  requireAdmin = false 
}: Props) {
  const { firestoreUser, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!firestoreUser) return <Navigate to="/login" />;
  if (requireAdmin && firestoreUser.role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
}
```

## Patrones de Diseño

### 1. Service Layer Pattern

Abstracción de lógica de Firebase en servicios:

```typescript
// services/firestore.ts
export async function getCompany(id: string): Promise<Company> {
  const docRef = doc(db, 'companies', id);
  const docSnap = await getDoc(docRef);
  return docSnap.data() as Company;
}
```

### 2. Custom Hooks Pattern

Encapsular lógica reutilizable:

```typescript
// hooks/useErrorHandler.ts
export function useErrorHandler() {
  const handleAuthError = (error: FirebaseError) => {
    // Lógica de manejo de errores
    toast.error(getErrorMessage(error));
  };
  
  return { handleAuthError };
}
```

### 3. Context + Provider Pattern

Estado global sin prop drilling:

```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 4. Compound Components

Componentes flexibles y componibles:

```typescript
// components/ServiceCard/index.tsx
export const ServiceCard = ({ children }) => { ... };
ServiceCard.Image = ({ src }) => { ... };
ServiceCard.Title = ({ children }) => { ... };
ServiceCard.Price = ({ amount }) => { ... };

// Uso
<ServiceCard>
  <ServiceCard.Image src={service.image} />
  <ServiceCard.Title>{service.name}</ServiceCard.Title>
  <ServiceCard.Price amount={service.price} />
</ServiceCard>
```

## Flujos Principales

### 1. Solicitud de Acceso

```
Usuario → RequestAccess Form
    ↓
Validar email no existe
    ↓
Crear documento en access_requests (Firestore)
    ↓
Llamar sendAccessRequestEmail (Cloud Function)
    ↓
Enviar email a admin via SendGrid
    ↓
Mostrar mensaje de éxito
```

### 2. Aprobación de Solicitud

```
Admin → Ver solicitud pendiente
    ↓
Aprobar solicitud
    ↓
Crear usuario en Firebase Auth
    ↓
Crear documento en users (Firestore)
    ↓
Llamar sendUserCreationEmail (Cloud Function)
    ↓
Enviar credenciales temporales por email
    ↓
Actualizar status de solicitud
```

### 3. Primera Configuración

```
Usuario login con contraseña temporal
    ↓
Forzar cambio de contraseña
    ↓
Wizard Setup: Tipo de Negocio
    ↓
Wizard Setup: Info Básica
    ↓
Wizard Setup: Ubicación
    ↓
Marcar setup_completed = true
    ↓
Redirigir a Dashboard
```

### 4. Página Pública

```
Visitante → pymerp.cl/mi-negocio
    ↓
Obtener company por slug
    ↓
Obtener apariencia personalizada
    ↓
Obtener servicios/productos activos
    ↓
Renderizar página pública
    ↓
Click WhatsApp → Registrar evento
    ↓
Abrir WhatsApp con mensaje predefinido
```

## Decisiones Técnicas

### ¿Por qué Firebase?

**Pros:**
- Backend listo sin servidor
- Autenticación robusta
- Firestore escalable y en tiempo real
- Hosting CDN global
- Cloud Functions serverless
- Buena documentación

**Contras:**
- Vendor lock-in
- Costo puede escalar
- Limitaciones en queries complejas

### ¿Por qué React?

- Ecosistema maduro
- Excelente para SPAs
- TypeScript first-class support
- Gran comunidad
- Performance con Virtual DOM

### ¿Por qué Vite?

- Build ultra rápido
- HMR instantáneo
- ES modules nativos
- Mejor DX que Webpack

### ¿Por qué Tailwind CSS?

- Utility-first approach
- No CSS custom necesario
- Purge automático (bundle pequeño)
- Diseño responsive fácil
- Consistencia visual

### ¿Por qué Vitest + Playwright?

- **Vitest**: Compatible con Vite, rápido, API similar a Jest
- **Playwright**: Multi-browser, reliable, excelente DevX

---

**Última actualización:** Diciembre 2025
