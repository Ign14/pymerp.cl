# Sistema de Agendamiento con Profesionales - PyM-ERP

## 📋 Resumen de la Implementación

Se ha implementado un sistema completo de agendamiento de citas con profesionales para PyM-ERP, siguiendo las mejores prácticas de arquitectura frontend y manteniendo la separación de responsabilidades.

---

## 📁 Archivos Creados/Modificados

### **1. Tipos TypeScript**
- **`src/types/index.ts`** - Agregados nuevos tipos:
  - `AppointmentStatus` (enum)
  - `Professional` (interface)
  - `Appointment` (interface)
  - `ProfessionalAvailability` (interface)
  - `NotificationSettings` (interface)

### **2. Servicios (Sin Firebase SDK directo)**
- **`src/services/appointments.ts`** - Servicio completo con:
  - **Professionals**: CRUD completo
  - **Availability**: Gestión de disponibilidad
  - **Appointments**: CRUD + listeners en tiempo real
  - **Notifications**: Configuración de notificaciones por email
  - **Validación**: `isTimeSlotAvailable()` para evitar conflictos

### **3. Componentes Reutilizables**
- **`src/components/appointments/QuickActionButton.tsx`**
  - Botón animado con Framer Motion
  - Props: icon, label, description, onClick, variant, disabled
  - Accesible con aria-label

- **`src/components/appointments/AppointmentCard.tsx`**
  - Tarjeta de cita con información completa
  - Estados visuales por color
  - Acciones: Confirmar, Editar, Cancelar
  - Format de fecha con date-fns (español)

- **`src/components/appointments/PendingList.tsx`**
  - Lista de citas pendientes
  - Loading state
  - Empty state

- **`src/components/appointments/index.ts`** - Exports centralizados

### **4. Vistas Principales**

#### **Nueva Cita Manual**
- **`src/pages/dashboard/appointments/NewAppointment.tsx`**
  - Formulario completo con validación
  - Secciones: Cliente, Detalles de cita
  - Auto-cálculo de hora fin según duración del servicio
  - Validación de slot disponible antes de crear
  - Race condition handling
  - Estados: servicios/profesionales no disponibles
  - Analytics tracking con `useAnalytics()`

#### **Horarios y Calendario**
- **`src/pages/dashboard/appointments/Schedule.tsx`**
  - Vistas: Día / Semana
  - Navegación temporal (anterior/siguiente/hoy)
  - Filtro por profesional
  - Panel de citas pendientes (collapsible)
  - Real-time updates con `listenAppointmentsByRange()`
  - Grid responsive de semana
  - Acciones: Confirmar, Cancelar citas

#### **Configuración de Notificaciones**
- **`src/pages/dashboard/settings/NotificationSettings.tsx`**
  - Toggle para notificaciones por email
  - Email de destino (solo lectura)
  - Info box con casos de uso
  - Placeholder para futuras opciones (push, SMS)

### **5. Integración en Dashboard**
- **`src/pages/dashboard/DashboardOverview.tsx`** (modificado)
  - Sección "Acciones rápidas - Citas" (solo para SERVICES)
  - 2 botones: "Agenda manual" y "Horarios y pendientes"
  - Tracking de clicks con `useAnalytics()`

### **6. Rutas**
- **`src/App.tsx`** (modificado)
  - `/dashboard/appointments` → Schedule
  - `/dashboard/appointments/new` → NewAppointment
  - `/dashboard/settings/notifications` → NotificationSettings
  - Todas protegidas con `ProtectedRoute` (UserRole.ENTREPRENEUR)

### **7. Traducciones i18n**
- **`src/locales/es-419/translation.json`** (modificado)
  - Namespace `appointments` completo
  - Namespace `notifications` completo
  - Namespace `dashboard` extendido
  - Namespace `common` extendido

---

## 🎨 Características UI/UX

### **Mobile-First**
- Grid responsive (1 col mobile, 2+ desktop)
- Botones touch-friendly
- Scroll horizontal para semana en móvil

### **Accesibilidad**
- Todas las labels con `htmlFor`
- Aria-labels en botones
- Headings jerárquicos (h1, h2, h3)
- Focus states visibles
- Toggle de notificaciones con `role="switch"` y `aria-checked`

### **Animaciones Sutiles**
- Framer Motion en:
  - QuickActionButton (hover, tap)
  - AppointmentCard (entrada)
  - Panel de pendientes (expand/collapse)
  - Transiciones de página (PageTransition)

### **Estados Visuales**
- Loading spinners
- Empty states con mensajes amigables
- Estados de error (slot ocupado, sin servicios/profesionales)
- Color coding por estado de cita
- Badges para citas pendientes

---

## 🔄 Flujo de Usuario

### **1. Dashboard → Quick Actions**
```
1. Usuario entra a /dashboard
2. Ve sección "Acciones rápidas - Citas" (solo SERVICES)
3. Hace clic en "Agenda manual" o "Horarios y pendientes"
4. trackClick() registra el evento
```

### **2. Crear Cita Manual**
```
1. /dashboard/appointments/new
2. Completa formulario:
   - Cliente (nombre, teléfono, email opcional)
   - Servicio (auto-calcula duración)
   - Profesional
   - Fecha (min: hoy)
   - Hora inicio (auto-calcula hora fin)
3. Submit → Valida slot disponible
4. Si ocupado → Error amigable
5. Si disponible → Crea cita CONFIRMED
6. Redirect a /dashboard/appointments
```

### **3. Ver Horarios**
```
1. /dashboard/appointments
2. Vista por defecto: Día (hoy)
3. Real-time listener activo
4. Opciones:
   - Cambiar a vista Semana
   - Navegar fechas (←/→/Hoy)
   - Filtrar por profesional
   - Ver pendientes (badge si hay)
5. Acciones en citas:
   - Confirmar (REQUESTED → CONFIRMED)
   - Cancelar (→ CANCELLED)
```

### **4. Configurar Notificaciones**
```
1. /dashboard/settings/notifications
2. Toggle de email notifications
3. Guarda preferencia en Firestore
4. Muestra email de cuenta (read-only)
```

---

## 🔒 Validaciones y Seguridad

### **Validaciones Frontend**
- Campos obligatorios: nombre, teléfono, servicio, profesional, fecha, horas
- Fecha mínima: hoy
- Hora fin > hora inicio
- Slot disponibilidad antes de crear

### **Race Condition Handling**
- `isTimeSlotAvailable()` verifica justo antes de crear
- Mensaje claro si slot fue tomado entre validación y creación

### **Seguridad**
- Todas las rutas protegidas con `ProtectedRoute`
- Servicios usan `company_id` del usuario autenticado
- No se expone Firebase SDK a componentes

---

## 📊 Analytics Tracking

### **Eventos Implementados**
```typescript
trackClick('quick_action_new_appointment')
trackClick('quick_action_view_schedule')
trackClick('manual_appointment_created')
```

---

## 🧪 Testing Recomendado

### **Unit Tests**
- [ ] `isTimeSlotAvailable()` con diferentes escenarios
- [ ] Cálculo automático de hora fin
- [ ] Filtros de profesional

### **Integration Tests**
- [ ] Flujo completo: Dashboard → Nueva cita → Ver horarios
- [ ] Real-time updates al confirmar/cancelar
- [ ] Toggle de notificaciones guarda correctamente

### **E2E Tests (Playwright)**
- [ ] Usuario crea cita manual
- [ ] Usuario navega calendario
- [ ] Usuario confirma cita pendiente

---

## 📦 Colecciones Firestore Requeridas

### **Collections a crear:**

```
/professionals
  - company_id (string, indexed)
  - name (string)
  - email (string, optional)
  - phone (string, optional)
  - avatar_url (string, optional)
  - specialties (array<string>, optional)
  - status ('ACTIVE' | 'INACTIVE')
  - created_at (timestamp)
  - updated_at (timestamp)

/professional_availability
  - professional_id (string, indexed)
  - company_id (string, indexed)
  - day_of_week (number, 0-6)
  - start_time (string, HH:mm)
  - end_time (string, HH:mm)
  - is_available (boolean)
  - created_at (timestamp)

/appointments
  - company_id (string, indexed)
  - service_id (string)
  - professional_id (string, indexed)
  - client_name (string)
  - client_phone (string)
  - client_email (string, optional)
  - appointment_date (timestamp, indexed)
  - start_time (string, HH:mm)
  - end_time (string, HH:mm)
  - status ('REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW')
  - notes (string, optional)
  - created_by_user_id (string, optional)
  - created_at (timestamp)
  - updated_at (timestamp)

/notification_settings
  - user_id (string, indexed)
  - company_id (string, indexed)
  - email_notifications_enabled (boolean)
  - notification_email (string)
  - created_at (timestamp)
  - updated_at (timestamp)
```

### **Firestore Rules Recomendadas:**

```javascript
// professionals
match /professionals/{professionalId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company_id == resource.data.company_id;
}

// appointments
match /appointments/{appointmentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company_id == resource.data.company_id;
}

// notification_settings
match /notification_settings/{settingId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.user_id;
}
```

---

## 🚀 Próximos Pasos (Opcional)

### **Funcionalidades Futuras**
1. **Gestión de Profesionales**
   - CRUD de profesionales desde `/dashboard/professionals`
   - Asignar especialidades
   - Configurar disponibilidad semanal

2. **Notificaciones Avanzadas**
   - Email automático al crear/confirmar/cancelar
   - SMS con Twilio
   - Push notifications (PWA)
   - Recordatorios 24h antes

3. **Calendario Público**
   - Widget de booking en página pública `/:companyId`
   - Cliente selecciona servicio, profesional, horario disponible
   - Crea cita con status REQUESTED
   - Email de notificación al dueño

4. **Reportes**
   - Métricas de citas (completadas, canceladas, no-show)
   - Profesionales más solicitados
   - Horarios peak
   - Export a CSV

5. **Mejoras UX**
   - Drag & drop para mover citas
   - Vista mensual
   - Búsqueda de citas
   - Historial de cliente

---

## 🛠️ Comandos de Desarrollo

```bash
# Instalar dependencias (si aún no lo hiciste)
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Tests
npm run test
npm run test:e2e
```

---

## 📝 Notas Importantes

1. **No Firebase SDK en componentes**: Todos los componentes importan de `src/services/*`, nunca directamente de `firebase/firestore`.

2. **date-fns**: Ya instalado, usado para formateo de fechas en español.

3. **Real-time**: El Schedule usa `listenAppointmentsByRange()` para updates automáticos.

4. **Race conditions**: Validación de slot justo antes de crear para evitar conflictos.

5. **Business type**: Quick Actions solo aparecen para `company.business_type === 'SERVICES'`.

6. **i18n ready**: Todos los textos usan `useLanguage()` con keys en `es-419/translation.json`.

---

## ✅ Checklist de Implementación

- [x] Tipos TypeScript
- [x] Servicio appointments.ts
- [x] Componentes reutilizables
- [x] Vista Nueva Cita Manual
- [x] Vista Schedule/Horarios
- [x] Settings de Notificaciones
- [x] Quick Actions en Dashboard
- [x] Rutas en App.tsx
- [x] Traducciones i18n
- [ ] Crear colecciones en Firestore
- [ ] Configurar Firestore Rules
- [ ] Testing
- [ ] Gestión de Profesionales (UI)

---

## 📞 Soporte

Si tienes dudas sobre la implementación o necesitas extender funcionalidades, revisa:
- `src/services/appointments.ts` para toda la lógica de negocio
- `src/components/appointments/` para componentes reutilizables
- `APPOINTMENTS_SYSTEM.md` (este archivo) para arquitectura general

---

**Implementado con ❤️ para PyM-ERP**

