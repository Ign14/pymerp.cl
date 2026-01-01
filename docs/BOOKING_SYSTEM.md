# Booking System (Agendamiento) - Arquitectura Backend

## Colecciones y esquema propuesto
- `companies/{companyId}`
  - `subscription`: `{ planId, maxProfessionals: number (1..60), status }`
  - `notifications`: `{ emailEnabled: boolean, toEmail: string, fromEmail?: string }`
  - `stats`: `{ professionalsCount: number }` (contador opcional, actualizado en función)
- `professionals/{professionalId}`
  - `company_id`, `name`, `cost`, `active`, `createdAt`
- `availability_templates/{templateId}`
  - `company_id`, `professional_id`, `weeklyRules` (por día, intervalos), `timezone`
- `availability_exceptions/{exceptionId}`
  - `company_id`, `professional_id`, `dateRange`, `type` (`BLOCK`/`OVERRIDE`), `notes`
- `appointments/{appointmentId}`
  - `company_id`, `professional_id`, `service_id`
  - `clientName`, `clientPhone`, `clientEmail?`, `notes?`
  - `startAt`, `endAt`, `status` (`REQUESTED` | `CONFIRMED` | `CANCELLED`)
  - `source` (`PUBLIC` | `DASHBOARD`), `createdAt`
- `locks/{lockId}` (solo backend)
  - `company_id`, `professional_id`, `startAt`, `expiresAt`, `status: HELD`, `createdAt`
- `appointmentEmailLogs/{eventId}` (deduplicación de notificaciones)

### Ejemplos JSON
`professionals/{id}`
```json
{
  "company_id": "c_123",
  "name": "María Soto",
  "cost": 25000,
  "active": true,
  "createdAt": "2024-07-01T12:00:00Z"
}
```

`appointments/{id}`
```json
{
  "company_id": "c_123",
  "professional_id": "p_1",
  "service_id": "svc_9",
  "clientName": "Cliente Demo",
  "clientPhone": "+56912345678",
  "startAt": "2024-07-01T15:00:00Z",
  "endAt": "2024-07-01T15:45:00Z",
  "status": "REQUESTED",
  "source": "PUBLIC",
  "createdAt": "2024-07-01T12:01:00Z"
}
```

## Locking anti doble reserva
- Documento determinístico: `locks/{companyId}_{professionalId}_{YYYYMMDDHHmm}`.
- Granularidad por step (default 15 min, `slotMinutes`).
- Flujo `createAppointmentRequest`:
  1) Transaction: lee lock, si existe => aborta con `SLOT_TAKEN`.
  2) Crea lock con `expiresAt` = `startAt + slotMinutes`.
  3) Crea `appointments` (REQUESTED o CONFIRMED si staff).
- Locks no son accesibles desde frontend (reglas los bloquean).

## Disponibilidad y excepciones
- `availability_templates`: reglas semanales por día (HH:mm start/end) y zona horaria en `timezone` (fallback `America/Santiago`).
- `availability_exceptions`: rangos de fechas. `type=BLOCK` rechaza; `type=OVERRIDE` permite aunque la plantilla bloquee.
- Si no hay plantilla, se permite el slot por defecto.
- Si no hay reglas para el día => `OUT_OF_SCHEDULE`.

## Estados y creación de citas
- `REQUESTED`: creación pública o desde dashboard (por defecto).
- `CONFIRMED`: permitido solo si la llamada está autenticada (staff).
- `CANCELLED`: gestionar posteriormente (no incluido en función actual).

## Límite de profesionales por plan
- `companies/{companyId}.subscription.maxProfessionals` (1..60).
- `createProfessional` (callable) hace:
  - Valida auth + pertenencia a `company_id`.
  - Lee plan y cuenta `professionals` (query limitada a `max+1`).
  - Si excede => `PRO_LIMIT_REACHED`.
  - Crea profesional y actualiza `stats.professionalsCount` (+1).

## Notificaciones por correo
- Configuración: `companies/{companyId}.notifications.emailEnabled` y `toEmail`.
- Trigger `onAppointmentCreated`:
  - Solo para `status == REQUESTED`.
  - Deduplicación vía `appointmentEmailLogs/{eventId}`.
  - Email incluye cliente, profesional, servicio, fecha/hora y link a dashboard.

## Mantenimiento
- `cleanExpiredLocks` (Pub/Sub cada 60 min) elimina locks con `expiresAt < now` (batch de 100).

## Reprogramación / cancelación
- `rescheduleAppointment` (callable): valida pertenencia, disponibilidad + lock nuevo, libera lock anterior y actualiza cita (reconfirma si estaba cancelada).
- `cancelAppointment` (callable): marca `status=CANCELLED`, `cancelledAt`, y elimina el lock del slot.
- Ambos requieren autenticación y `company_id` coincidente.

## Reglas de seguridad (resumen)
- `professionals`, `availability_*`, `appointments`: lectura/escritura solo `ownsCompany(company_id)` o SUPERADMIN. Se recomienda crear/actualizar citas solo vía Cloud Functions.
- `locks`: todo denegado (solo backend).
- `companies`: escritura dueños/SUPERADMIN; lectura pública (para páginas públicas).
- Creación pública de citas se fuerza a pasar por función callable/HTTPS.

## Índices Firestore necesarios
- `appointments`: `company_id ASC, startAt ASC`
- `appointments`: `company_id ASC, professional_id ASC, startAt ASC`
Ver `firestore.indexes.json`.

## Pendientes / siguientes pasos
- Añadir función de limpieza de locks expirados.
- Añadir manejo de rescheduling/cancelaciones y actualización de `locks`.
- Añadir validaciones cruzadas con disponibilidad (`availability_templates` + excepciones).
