# 📡 API Documentation

## Tabla de Contenidos

- [Authentication API](#authentication-api)
- [Firestore API](#firestore-api)
- [Firebase Functions API](#firebase-functions-api)
- [Storage API](#storage-api)
- [Admin API](#admin-api)
- [Types](#types)
- [Error Handling](#error-handling)

## Authentication API

### `signIn(email, password)`

Autentica un usuario con email y contraseña.

```typescript
import { signIn } from './services/auth';

await signIn('user@example.com', 'password123');
```

**Parámetros:**
- `email` (string): Email del usuario
- `password` (string): Contraseña del usuario

**Retorna:** `Promise<UserCredential>`

**Errores:**
- `auth/user-not-found`: Usuario no existe
- `auth/wrong-password`: Contraseña incorrecta
- `auth/too-many-requests`: Demasiados intentos fallidos

---

### `logOut()`

Cierra la sesión del usuario actual.

```typescript
import { logOut } from './services/auth';

await logOut();
```

**Retorna:** `Promise<void>`

---

### `getCurrentFirestoreUser()`

Obtiene los datos Firestore del usuario autenticado.

```typescript
import { getCurrentFirestoreUser } from './services/auth';

const user = await getCurrentFirestoreUser();
console.log(user.role); // 'ENTREPRENEUR' | 'SUPERADMIN'
```

**Retorna:** `Promise<User | null>`

---

### `changeUserPassword(oldPassword, newPassword)`

Cambia la contraseña del usuario actual.

```typescript
import { changeUserPassword } from './services/auth';

await changeUserPassword('oldPass123', 'newPass456');
```

**Parámetros:**
- `oldPassword` (string): Contraseña actual
- `newPassword` (string): Nueva contraseña

**Retorna:** `Promise<void>`

**Validaciones:**
- Nueva contraseña debe tener mínimo 8 caracteres
- Debe contener mayúsculas, minúsculas y números
- No puede ser igual a la anterior

---

## Firestore API

### Companies

#### `getCompany(id)`

Obtiene una empresa por ID.

```typescript
import { getCompany } from './services/firestore';

const company = await getCompany('company-123');
console.log(company.name);
```

**Parámetros:**
- `id` (string): ID del documento

**Retorna:** `Promise<Company | null>`

---

#### `getCompanyBySlug(slug)`

Obtiene una empresa por su slug único.

```typescript
import { getCompanyBySlug } from './services/firestore';

const company = await getCompanyBySlug('mi-negocio');
```

**Parámetros:**
- `slug` (string): Slug único de la empresa

**Retorna:** `Promise<Company | null>`

---

#### `createCompany(data)`

Crea una nueva empresa.

```typescript
import { createCompany } from './services/firestore';

const newCompany = await createCompany({
  name: 'Mi Negocio',
  slug: 'mi-negocio',
  owner_user_id: 'user-123',
  business_type: 'SERVICES',
  whatsapp: '+56912345678',
  address: 'Calle Principal 123',
  setup_completed: false
});
```

**Parámetros:**
- `data` (Partial<Company>): Datos de la empresa

**Retorna:** `Promise<string>` (ID del documento creado)

**Validaciones:**
- `slug` debe ser único
- `owner_user_id` debe existir
- `business_type` debe ser 'SERVICES' o 'PRODUCTS'

---

#### `updateCompany(id, data)`

Actualiza una empresa existente.

```typescript
import { updateCompany } from './services/firestore';

await updateCompany('company-123', {
  name: 'Nuevo Nombre',
  setup_completed: true
});
```

**Parámetros:**
- `id` (string): ID de la empresa
- `data` (Partial<Company>): Campos a actualizar

**Retorna:** `Promise<void>`

---

#### `deleteCompany(id)`

Elimina una empresa.

```typescript
import { deleteCompany } from './services/firestore';

await deleteCompany('company-123');
```

**Parámetros:**
- `id` (string): ID de la empresa

**Retorna:** `Promise<void>`

**Nota:** También elimina servicios/productos asociados.

---

### Services

#### `getServices(companyId, options?)`

Obtiene servicios de una empresa.

```typescript
import { getServices } from './services/firestore';

// Todos los servicios
const services = await getServices('company-123');

// Solo activos
const activeServices = await getServices('company-123', {
  active: true
});

// Ordenados por precio
const sortedServices = await getServices('company-123', {
  orderBy: 'price',
  orderDirection: 'desc'
});
```

**Parámetros:**
- `companyId` (string): ID de la empresa
- `options` (object, opcional):
  - `active` (boolean): Filtrar por activos
  - `orderBy` (string): Campo para ordenar
  - `orderDirection` ('asc' | 'desc'): Dirección del ordenamiento

**Retorna:** `Promise<Service[]>`

---

#### `createService(data)`

Crea un nuevo servicio.

```typescript
import { createService } from './services/firestore';

const service = await createService({
  company_id: 'company-123',
  name: 'Corte de Cabello',
  description: 'Corte clásico con estilo',
  price: 15000,
  duration_minutes: 30,
  active: true
});
```

**Parámetros:**
- `data` (Partial<Service>): Datos del servicio

**Retorna:** `Promise<string>` (ID del servicio)

**Validaciones:**
- `price` debe ser > 0
- `duration_minutes` debe ser > 0
- `name` no puede estar vacío

---

#### `updateService(id, data)`

Actualiza un servicio.

```typescript
import { updateService } from './services/firestore';

await updateService('service-123', {
  price: 18000,
  active: false
});
```

**Parámetros:**
- `id` (string): ID del servicio
- `data` (Partial<Service>): Campos a actualizar

**Retorna:** `Promise<void>`

---

### Products

#### `getProducts(companyId, options?)`

Obtiene productos de una empresa.

```typescript
import { getProducts } from './services/firestore';

const products = await getProducts('company-123', {
  category: 'electronics',
  inStock: true
});
```

**Parámetros:**
- `companyId` (string): ID de la empresa
- `options` (object, opcional):
  - `category` (string): Filtrar por categoría
  - `inStock` (boolean): Solo con stock
  - `orderBy` (string): Campo para ordenar

**Retorna:** `Promise<Product[]>`

---

#### `createProduct(data)`

Crea un nuevo producto.

```typescript
import { createProduct } from './services/firestore';

const product = await createProduct({
  company_id: 'company-123',
  name: 'Laptop HP',
  description: 'Laptop 15" Intel i5',
  price: 650000,
  stock: 5,
  category: 'electronics',
  image_url: 'https://...',
  active: true
});
```

**Parámetros:**
- `data` (Partial<Product>): Datos del producto

**Retorna:** `Promise<string>` (ID del producto)

---

### Access Requests

#### `createAccessRequest(data)`

Crea una solicitud de acceso.

```typescript
import { createAccessRequest } from './services/firestore';

await createAccessRequest({
  full_name: 'Juan Pérez',
  email: 'juan@example.com',
  business_name: 'Peluquería JP',
  whatsapp: '+56912345678',
  plan: 'STANDARD'
});
```

**Parámetros:**
- `data` (Partial<AccessRequest>): Datos de la solicitud

**Retorna:** `Promise<string>` (ID de la solicitud)

**Validaciones:**
- Email no debe existir en users ni access_requests
- Whatsapp debe tener formato válido

---

#### `updateAccessRequestStatus(id, status, processedByUserId)`

Actualiza el estado de una solicitud.

```typescript
import { updateAccessRequestStatus } from './services/firestore';

await updateAccessRequestStatus(
  'request-123',
  'APPROVED',
  'admin-user-id'
);
```

**Parámetros:**
- `id` (string): ID de la solicitud
- `status` ('PENDING' | 'APPROVED' | 'REJECTED'): Nuevo estado
- `processedByUserId` (string): ID del usuario que procesa

**Retorna:** `Promise<void>`

---

### Events (Analytics)

#### `createEvent(data)`

Registra un evento de analytics.

```typescript
import { createEvent } from './services/firestore';

await createEvent({
  company_id: 'company-123',
  event_type: 'WHATSAPP_CLICK',
  metadata: {
    source: 'service_card',
    service_id: 'service-456'
  }
});
```

**Parámetros:**
- `data` (Partial<Event>): Datos del evento

**Retorna:** `Promise<string>` (ID del evento)

**Event Types:**
- `PAGE_VIEW`: Vista de página pública
- `WHATSAPP_CLICK`: Click en botón WhatsApp
- `SERVICE_BOOK_CLICK`: Click en agendar servicio
- `PRODUCT_ORDER_CLICK`: Click en ordenar producto

---

## Firebase Functions API

### Email Functions

#### `sendAccessRequestEmail(data)`

Envía email de notificación de nueva solicitud al admin.

```typescript
import { sendAccessRequestEmail } from './services/email';

await sendAccessRequestEmail({
  full_name: 'Juan Pérez',
  email: 'juan@example.com',
  business_name: 'Peluquería JP',
  whatsapp: '+56912345678',
  plan: 'STANDARD',
  created_at: new Date(),
  language: 'es'
});
```

**Parámetros:**
- `data` (object):
  - `full_name` (string): Nombre completo
  - `email` (string): Email del solicitante
  - `business_name` (string): Nombre del negocio
  - `whatsapp` (string): WhatsApp
  - `plan` (string, opcional): Plan solicitado
  - `created_at` (Date): Fecha de solicitud
  - `language` ('es' | 'en', opcional): Idioma del email

**Retorna:** `Promise<void>`

**HTTP Endpoint:** `POST /sendAccessRequestEmailHttp`

---

#### `sendUserCreationEmail(email, password, loginUrl, language?)`

Envía email de bienvenida con credenciales temporales.

```typescript
import { sendUserCreationEmail } from './services/email';

await sendUserCreationEmail(
  'user@example.com',
  'TempPass123!',
  'https://pymerp.cl/login',
  'es'
);
```

**Parámetros:**
- `email` (string): Email del nuevo usuario
- `password` (string): Contraseña temporal
- `loginUrl` (string): URL para login
- `language` ('es' | 'en', opcional): Idioma del email

**Retorna:** `Promise<void>`

**HTTP Endpoint:** `POST /sendUserCreationEmailHttp`

---

### Admin Functions

#### `setUserPassword(email, password)`

Establece la contraseña de un usuario (Admin SDK).

```typescript
// Solo desde Cloud Functions
await admin.auth().updateUser(uid, {
  password: newPassword
});
```

**HTTP Endpoint:** `POST /setUserPassword`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "NewPass123!"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Storage API

### `uploadFile(file, path)`

Sube un archivo a Firebase Storage.

```typescript
import { uploadFile } from './services/storage';

const file = document.querySelector('input[type="file"]').files[0];
const url = await uploadFile(file, 'logos/company-123/logo.png');
```

**Parámetros:**
- `file` (File): Archivo a subir
- `path` (string): Ruta en Storage

**Retorna:** `Promise<string>` (URL pública del archivo)

**Límites:**
- Tamaño máximo: 5MB (imágenes)
- Formatos permitidos: jpg, jpeg, png, webp

---

### `deleteFile(path)`

Elimina un archivo de Storage.

```typescript
import { deleteFile } from './services/storage';

await deleteFile('logos/company-123/logo.png');
```

**Parámetros:**
- `path` (string): Ruta del archivo

**Retorna:** `Promise<void>`

---

### `getDownloadURL(path)`

Obtiene la URL pública de un archivo.

```typescript
import { getDownloadURL } from './services/storage';

const url = await getDownloadURL('logos/company-123/logo.png');
```

**Parámetros:**
- `path` (string): Ruta del archivo

**Retorna:** `Promise<string>` (URL pública)

---

## Admin API

### `createUserWithEmailPassword(email, password)`

Crea un usuario en Firebase Auth (Admin).

```typescript
import { createUserWithEmailPassword } from './services/admin';

await createUserWithEmailPassword(
  'newuser@example.com',
  'TempPass123!'
);
```

**Parámetros:**
- `email` (string): Email del usuario
- `password` (string): Contraseña temporal

**Retorna:** `Promise<void>`

**Permisos:** Solo SUPERADMIN

---

### `setCompanyClaim(uid, companyId)`

Establece custom claim de company_id en token.

```typescript
import { setCompanyClaim } from './services/admin';

await setCompanyClaim('user-123', 'company-456');
```

**Parámetros:**
- `uid` (string): UID del usuario en Firebase Auth
- `companyId` (string): ID de la empresa

**Retorna:** `Promise<void>`

**Nota:** Usuario debe hacer logout/login para que tome efecto.

---

### `resetUserPassword(email, newPassword)`

Resetea la contraseña de un usuario.

```typescript
import { resetUserPassword } from './services/admin';

await resetUserPassword('user@example.com', 'NewPass123!');
```

**Parámetros:**
- `email` (string): Email del usuario
- `newPassword` (string): Nueva contraseña

**Retorna:** `Promise<void>`

---

## Types

### User

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

### Company

```typescript
interface Company {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  rut: string;
  industry: string;
  whatsapp: string;
  address: string;
  latitude?: number;
  longitude?: number;
  business_type: 'SERVICES' | 'PRODUCTS';
  subscription_plan?: 'BASIC' | 'STANDARD' | 'PRO';
  setup_completed: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Service

```typescript
interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  order?: number;
  created_at: Date;
}
```

### Product

```typescript
interface Product {
  id: string;
  company_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  active: boolean;
  created_at: Date;
}
```

### AccessRequest

```typescript
interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  whatsapp: string;
  plan?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  processed_at?: Date;
  processed_by_user_id?: string;
}
```

### Event

```typescript
interface Event {
  id: string;
  company_id: string;
  event_type: 'PAGE_VIEW' | 'WHATSAPP_CLICK' | 
               'SERVICE_BOOK_CLICK' | 'PRODUCT_ORDER_CLICK';
  metadata?: Record<string, any>;
  created_at: Date;
}
```

## Error Handling

### Firebase Auth Errors

```typescript
// Mapeo de errores comunes
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Email ya está en uso',
  'auth/weak-password': 'Contraseña muy débil',
  'auth/too-many-requests': 'Demasiados intentos, intenta más tarde',
  'auth/network-request-failed': 'Error de conexión'
};

// Uso con hook
import { useErrorHandler } from './hooks/useErrorHandler';

const { handleAuthError } = useErrorHandler();

try {
  await signIn(email, password);
} catch (error) {
  handleAuthError(error as FirebaseError);
}
```

### Firestore Errors

```typescript
try {
  await getCompany('invalid-id');
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('No tienes permisos');
  }
}
```

### HTTP Function Errors

```typescript
// Response format
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}

// Manejo
const response = await fetch(functionUrl, options);
const data = await response.json();

if (!data.success) {
  throw new Error(data.error);
}
```

---

**Última actualización:** Diciembre 2025
