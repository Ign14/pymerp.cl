## DEMOS – Seed de datos y assets

Scripts para generar imágenes `.webp` locales y sembrar cuentas/empresas demo por categoría de manera idempotente y multi-tenant.

### Prerrequisitos
- Node 20+
- Dependencias ya instaladas (`firebase-admin`, `sharp`, `tsx`)
- Emuladores de Firebase corriendo en `127.0.0.1:8080` (Firestore) y `127.0.0.1:9099` (Auth) por defecto.

### 1) Generar imágenes demo
```
node scripts/generate-demo-webp.ts
```
Opcional: solo una categoría `--category barberias`. Se generan `public/demo-images/<category_id>/hero.webp` + `item-1.webp...item-7.webp`.

### 2) Sembrar demos
```
# Emulador (default)
node scripts/seed-demos.ts --emulator --from 2

# Producción (requiere confirmación explícita)
node scripts/seed-demos.ts --project <gcp-project-id> --confirm-prod --from 2
```
Reglas:
- Crea/actualiza una empresa demo por cada categoría sin demos previos (`is_demo=true` o slug `demoN`).
- Asigna slugs y correos `demoN@pymerp.cl` con password `Pymerp.cl1234`.
- Upsert en Auth + Firestore, setea custom claim `company_id`, marca `is_demo`, `setup_completed` y `public_layout_variant=classic`.
- Limpia y recrea datos con `created_by_demo_seed=true` para: professionals, services, scheduleSlots, serviceSchedules, appointmentRequests, appointments, menu_categories, products, productOrderRequests, properties, property_bookings, leads, work-orders-lite.
- Inserta datos coherentes por módulo (citas, catálogo, pedidos, leads, propiedades) y referencia las imágenes webp locales.

### Flags
- `--emulator`: usa emulador (por defecto).
- `--project <id>`: apunta a proyecto; requiere `--confirm-prod`.
- `--confirm-prod`: desbloquea escritura en producción.
- `--from <n>`: número inicial para slugs demo (default 2).

### Salida esperada
- Empresas demo con slug `demoN`, `is_demo=true`, `publicEnabled=true`, categoría correcta y datos de contacto/horarios.
- Usuario `demoN@pymerp.cl` (password `Pymerp.cl1234`) con claim y `company_id`.
- Datos visibles en público (`/:slug`) y dashboard: servicios + agenda (citas y solicitudes), productos + pedidos, menú/QR, propiedades + reservas/leads, work-orders-lite según módulos habilitados.

> Seguridad: el script se niega a tocar producción sin `--confirm-prod`. Re-ejecutarlo no duplica datos gracias a upsert por slug/email y limpieza por `created_by_demo_seed`.
