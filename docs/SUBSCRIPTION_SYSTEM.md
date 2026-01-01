# Sistema de Gestión de Suscripciones

Este documento describe el sistema de gestión de planes de suscripción implementado en PYM-ERP.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Planes Disponibles](#planes-disponibles)
- [Arquitectura](#arquitectura)
- [Componentes](#componentes)
- [Servicios](#servicios)
- [Flujo de Uso](#flujo-de-uso)
- [Integración con Cloud Functions](#integración-con-cloud-functions)

## Descripción General

El sistema de suscripciones permite:

- **Gestión de límites por plan**: Cada plan tiene límites específicos para profesionales, servicios, productos y horarios
- **Actualización de planes**: Los SUPERADMIN pueden cambiar el plan de cualquier empresa
- **Visualización de plan actual**: Los usuarios pueden ver su plan y límites
- **Prompts de actualización**: Cuando se alcanza un límite, se muestra un modal para contactar soporte

## Planes Disponibles

### BASIC (Gratis)
- **Profesionales**: 1
- **Servicios**: 3
- **Productos**: 3
- **Horarios**: 5
- **Ideal para**: Emprendedores individuales

### STANDARD ($9.990/mes)
- **Profesionales**: 5
- **Servicios**: 10
- **Productos**: 15
- **Horarios**: 15
- **Ideal para**: Pequeños equipos en crecimiento

### PRO ($29.990/mes)
- **Profesionales**: 60
- **Servicios**: ∞ (Ilimitados)
- **Productos**: ∞ (Ilimitados)
- **Horarios**: ∞ (Ilimitados)
- **Ideal para**: Empresas establecidas

### APPROVED25 (Personalizado)
- **Profesionales**: 10
- **Servicios**: 25
- **Productos**: 25
- **Horarios**: ∞ (Ilimitados)
- **Ideal para**: Usuarios con plan especial

## Arquitectura

### Estructura de Datos en Firestore

```typescript
// Colección: companies/{companyId}
{
  subscription_plan: 'BASIC' | 'STANDARD' | 'PRO' | 'APPROVED25',
  subscription: {
    maxProfessionals: number,
    currentProfessionals?: number
  }
}
```

### Constantes y Tipos

**Archivo**: `src/utils/constants.ts`

```typescript
export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PRO' | 'APPROVED25';

export const SUBSCRIPTION_PLAN_LIMITS = {
  professionals: { BASIC: 1, STANDARD: 5, PRO: 60, APPROVED25: 10 },
  services: { BASIC: 3, STANDARD: 10, PRO: Infinity, APPROVED25: 25 },
  products: { BASIC: 3, STANDARD: 15, PRO: Infinity, APPROVED25: 25 },
  serviceSchedules: { BASIC: 5, STANDARD: 15, PRO: Infinity, APPROVED25: Infinity }
};
```

## Componentes

### 1. CurrentPlanCard
**Ubicación**: `src/components/subscription/CurrentPlanCard.tsx`

Muestra el plan actual del usuario con:
- Nombre y descripción del plan
- Precio
- Características incluidas
- Límites de recursos
- Botón de actualización (si aplica)

**Props**:
```typescript
interface CurrentPlanCardProps {
  companyId: string;
  onUpgradeClick?: () => void;
}
```

### 2. UpgradePrompt
**Ubicación**: `src/components/subscription/UpgradePrompt.tsx`

Modal que se muestra cuando el usuario alcanza un límite:
- Comparación entre plan actual y recomendado
- Lista de beneficios del nuevo plan
- Botón para contactar soporte vía WhatsApp

**Props**:
```typescript
interface UpgradePromptProps {
  currentPlan: SubscriptionPlan;
  recommendedPlan: SubscriptionPlan;
  reason?: string;
  onClose?: () => void;
  onContactSupport?: () => void;
}
```

### 3. SubscriptionManager (Admin)
**Ubicación**: `src/components/admin/SubscriptionManager.tsx`

Panel de administración para que SUPERADMIN gestione planes:
- Selección visual de planes
- Información de límites por plan
- Actualización inmediata del plan
- Advertencias sobre cambios de plan

**Props**:
```typescript
interface SubscriptionManagerProps {
  companyId: string;
  companyName: string;
  currentPlan: SubscriptionPlan;
  onPlanUpdated?: () => void;
}
```

## Servicios

### Subscription Service
**Ubicación**: `src/services/subscriptions.ts`

#### Funciones principales:

**`getCompanySubscription(companyId: string)`**
- Obtiene información completa de la suscripción
- Retorna plan actual, detalles y límites

**`updateCompanySubscriptionPlan(companyId: string, newPlan: SubscriptionPlan)`**
- Actualiza el plan de una empresa
- Solo para SUPERADMIN
- Actualiza automáticamente los límites

**`checkResourceLimit(companyId: string, resource: string, currentCount: number)`**
- Verifica si se puede agregar más de un recurso
- Retorna información sobre límites y disponibilidad

**`getRecommendedUpgrade(currentPlan: SubscriptionPlan)`**
- Sugiere el siguiente plan en la jerarquía
- Retorna null si ya está en el plan más alto

## Flujo de Uso

### Para Usuarios (Entrepreneurs)

1. **Ver plan actual**:
   ```
   Dashboard → Configuración → Mi Suscripción
   /dashboard/settings/subscription
   ```

2. **Alcanzar límite**:
   - Al intentar crear un profesional/servicio/producto
   - Se muestra `UpgradePrompt` automáticamente
   - Usuario puede contactar soporte

3. **Solicitar actualización**:
   - Click en "Actualizar Plan"
   - Se abre WhatsApp con mensaje pre-llenado
   - Equipo de soporte procesa la solicitud

### Para Administradores (SUPERADMIN)

1. **Gestionar planes**:
   ```
   Admin Dashboard → Gestionar Plan (en cada empresa)
   /admin/subscriptions/{companyId}
   ```

2. **Cambiar plan**:
   - Seleccionar nuevo plan
   - Click en "Actualizar Plan"
   - Cambio es inmediato

3. **Verificar cambios**:
   - Los límites se actualizan automáticamente
   - Usuario puede usar nuevos límites inmediatamente

## Integración con Cloud Functions

### createProfessional Function
**Ubicación**: `functions/src/booking.ts`

La Cloud Function valida límites antes de crear profesionales:

```typescript
// 1. Lee el plan de la empresa
const subscriptionPlan = companySnap.get('subscription_plan') || 'BASIC';

// 2. Obtiene límites según el plan
const planLimits = {
  BASIC: 1,
  STANDARD: 5,
  PRO: 60,
  APPROVED25: 10,
};

const maxProfessionals = subscription.maxProfessionals ?? planLimits[subscriptionPlan] ?? 1;

// 3. Verifica cantidad actual
const current = await tx.get(
  professionalsCol
    .where('company_id', '==', companyId)
    .where('status', '==', 'ACTIVE')
    .limit(maxProfessionals + 1)
);

// 4. Lanza error si excede límite
if (current.size >= maxProfessionals) {
  throw new functions.https.HttpsError('failed-precondition', 'PRO_LIMIT_REACHED');
}
```

### Manejo de Errores en Frontend

```typescript
try {
  await createProfessional(data);
} catch (error: any) {
  if (error.code === 'PRO_LIMIT_REACHED') {
    setShowUpgradePrompt(true); // Muestra modal de actualización
  }
}
```

## Páginas

### 1. SubscriptionPage (Usuario)
**Ruta**: `/dashboard/settings/subscription`
**Archivo**: `src/pages/dashboard/settings/SubscriptionPage.tsx`

Página donde los usuarios ven y gestionan su suscripción.

### 2. ManageSubscriptions (Admin)
**Ruta**: `/admin/subscriptions/:companyId`
**Archivo**: `src/pages/admin/ManageSubscriptions.tsx`

Página donde los SUPERADMIN cambian planes de empresas.

### 3. ProfessionalsList (Integrado)
**Ruta**: `/dashboard/professionals`
**Archivo**: `src/pages/dashboard/professionals/ProfessionalsList.tsx`

Muestra:
- Contador de profesionales activos vs límite
- Botón para agregar (deshabilitado si se alcanza límite)
- `UpgradePrompt` cuando se intenta exceder límite

## Mejoras Futuras

- [ ] Integración con pasarela de pagos (Stripe/MercadoPago)
- [ ] Renovación automática de suscripciones
- [ ] Historial de cambios de plan
- [ ] Facturación automática
- [ ] Pruebas gratuitas (trials)
- [ ] Descuentos por pago anual
- [ ] Métricas de uso por empresa
- [ ] Notificaciones cuando se acerca al límite

## Testing

### Probar límites:

1. Crear empresa con plan BASIC
2. Intentar crear 2 profesionales
3. Verificar que aparece error PRO_LIMIT_REACHED
4. Verificar que aparece UpgradePrompt

### Probar actualización (Admin):

1. Login como SUPERADMIN
2. Ir a `/admin`
3. Click en "Gestionar Plan" de una empresa
4. Cambiar plan a STANDARD
5. Verificar que límites se actualizan

## Soporte

Para consultas sobre el sistema de suscripciones:
- WhatsApp: +56 9 1234 5678
- Email: soporte@pymerp.cl

