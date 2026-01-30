# Analytics Events - Public Layouts

## Resumen

Este documento lista todos los eventos de analytics trackeados en los layouts públicos y verifica su implementación.

## Eventos de Conversión

### 1. WhatsApp Click
**Evento:** `WHATSAPP_CLICK`  
**Tipo:** Conversion  
**Ubicación:** Todos los layouts con CTAs de WhatsApp

**Implementación:**
```typescript
trackConversion()(GAEventAction.WHATSAPP_CLICK, undefined, {
  company_id: company.id,
  company_name: company.name,
});
```

**Parámetros:**
- `company_id` (requerido)
- `company_name` (requerido)

**Layouts que lo usan:**
- ✅ `BarberiasPublicLayout` - CTA principal y sticky mobile
- ✅ `RestaurantesComidaRapidaShowcase` - "Enviar pedido" (si hide_price)
- ✅ `MinimarketPublicLayout` - "Enviar pedido"
- ✅ `ProductosCuidadoPersonalPublicLayout` - "Consultar" (si hide_price)
- ✅ `ActividadEntrenamientoFisicoPublicLayout` - CTA principal
- ✅ `InmobiliariaTerrenosCasasPublicLayout` - "Consultar" y "Agendar visita"
- ✅ `ConstruccionPublicLayout` - "Solicitar cotización"
- ✅ `AgendaProfesionalesIndependientesPublicLayout` - CTA principal

**Verificación:**
- [x] Todos los layouts principales tienen tracking
- [x] Parámetros `company_id` y `company_name` presentes
- [x] Evento se dispara antes de abrir WhatsApp

---

### 2. Service Booking
**Evento:** `SERVICE_BOOKING`  
**Tipo:** Conversion  
**Valor:** `service.price`  
**Ubicación:** Layouts de servicios

**Implementación:**
```typescript
trackConversion()(GAEventAction.SERVICE_BOOKING, selectedService.price, {
  service_id: selectedService.id,
  service_name: selectedService.name,
  company_id: company.id,
  company_name: company.name,
});
```

**Parámetros:**
- `service_id` (requerido)
- `service_name` (requerido)
- `company_id` (requerido)
- `company_name` (requerido)
- `value`: `service.price` (si está disponible)

**Layouts que lo usan:**
- ✅ `BarberiasPublicLayout` - "Agendar" en cada servicio
- ✅ `ActividadEntrenamientoFisicoPublicLayout` - "Agendar evaluación" y "Agendar franja"
- ✅ `AgendaProfesionalesIndependientesPublicLayout` - "Reservar hora"

**Verificación:**
- [x] Tracking en `handleSubmitBooking` de `PublicPage.tsx`
- [x] Valor monetario incluido cuando está disponible
- [x] Parámetros requeridos presentes

---

### 3. Product Order
**Evento:** `PRODUCT_ORDER`  
**Tipo:** Conversion  
**Valor:** `total` (total del pedido)  
**Ubicación:** Layouts de productos

**Implementación:**
```typescript
trackConversion()(GAEventAction.PRODUCT_ORDER, total, {
  product_count: cart.length,
  total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
  company_id: company.id,
  company_name: company.name,
});
```

**Parámetros:**
- `product_count` (requerido)
- `total_items` (requerido)
- `company_id` (requerido)
- `company_name` (requerido)
- `value`: `total` (si no hay precios ocultos)

**Layouts que lo usan:**
- ✅ `RestaurantesComidaRapidaShowcase` - "Enviar pedido"
- ✅ `MinimarketPublicLayout` - "Enviar pedido"
- ✅ `ProductosCuidadoPersonalPublicLayout` - "Enviar pedido"

**Verificación:**
- [x] Tracking en `handleSubmitOrder` de `PublicPage.tsx`
- [x] Valor monetario incluido solo si no hay precios ocultos
- [x] Parámetros requeridos presentes

---

## Eventos de Navegación

### 4. Add to Cart
**Evento:** `add_to_cart`  
**Tipo:** Click  
**Ubicación:** Layouts de productos

**Implementación:**
```typescript
trackClick('add_to_cart')({
  product_id: product.id,
  product_name: product.name,
  product_price: product.price,
  company_id: company.id,
});
```

**Parámetros:**
- `product_id` (requerido)
- `product_name` (requerido)
- `product_price` (opcional, si no está oculto)
- `company_id` (requerido)

**Layouts que lo usan:**
- ✅ `RestaurantesComidaRapidaShowcase` - "Agregar" producto
- ✅ `MinimarketPublicLayout` - Quick-add a carrito
- ✅ `ProductosCuidadoPersonalPublicLayout` - "Agregar" producto

**Verificación:**
- [x] Tracking en `onAddToCart` de `PublicPage.tsx`
- [x] Parámetros básicos presentes
- [x] No duplica eventos en quick-add

---

### 5. Event View
**Evento:** `event_view`  
**Tipo:** Navigation  
**Ubicación:** `PublicEvents.tsx`

**Implementación:**
```typescript
trackNamedEvent('events.view', {
  company_id: companyId,
  event_id: event.id,
});
```

**Parámetros:**
- `company_id` (requerido)
- `event_id` (requerido)

**Verificación:**
- [x] Tracking en `PublicEvents.tsx`
- [x] Parámetros requeridos presentes

---

### 6. Property View
**Evento:** `property_view`  
**Tipo:** Navigation  
**Ubicación:** `InmobiliariaTerrenosCasasPublicLayout`

**Implementación:**
```typescript
trackNamedEvent('properties.view', {
  company_id: company.id,
  property_id: property.id,
});
```

**Parámetros:**
- `company_id` (requerido)
- `property_id` (requerido)

**Verificación:**
- [x] Tracking al abrir modal de detalle
- [x] Parámetros requeridos presentes

---

## Eventos de Negocio

### 7. Appointment Requested
**Evento:** `appointments.publicRequested`  
**Tipo:** Business  
**Ubicación:** `PublicPage.tsx` (handleSubmitBooking)

**Implementación:**
```typescript
trackNamedEvent('appointments.publicRequested', {
  service_id: selectedService.id,
  professional_id: professionalId,
  company_id: company.id,
});
```

**Parámetros:**
- `service_id` (requerido)
- `professional_id` (requerido, puede ser 'unassigned')
- `company_id` (requerido)

**Verificación:**
- [x] Tracking después de crear appointment
- [x] Parámetros requeridos presentes

---

### 8. Product Order Submitted
**Evento:** `products.orderSubmitted`  
**Tipo:** Business  
**Ubicación:** `PublicPage.tsx` (handleSubmitOrder)

**Implementación:**
```typescript
trackNamedEvent('products.orderSubmitted', {
  product_count: cart.length,
  total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
  company_id: company.id,
  company_name: company.name,
  total_estimated: total,
});
```

**Parámetros:**
- `product_count` (requerido)
- `total_items` (requerido)
- `company_id` (requerido)
- `company_name` (requerido)
- `total_estimated` (opcional, si no hay precios ocultos)

**Verificación:**
- [x] Tracking después de persistir pedido
- [x] Parámetros requeridos presentes

---

## Checklist de Verificación

### Eventos de Conversión
- [x] `WHATSAPP_CLICK` - Implementado en todos los layouts principales
- [x] `SERVICE_BOOKING` - Implementado en layouts de servicios
- [x] `PRODUCT_ORDER` - Implementado en layouts de productos

### Eventos de Navegación
- [x] `add_to_cart` - Implementado en layouts de productos
- [x] `event_view` - Implementado en `PublicEvents.tsx`
- [x] `property_view` - Implementado en `InmobiliariaTerrenosCasasPublicLayout`

### Eventos de Negocio
- [x] `appointments.publicRequested` - Implementado en `PublicPage.tsx`
- [x] `products.orderSubmitted` - Implementado en `PublicPage.tsx`

### Parámetros Requeridos
- [x] `company_id` presente en todos los eventos
- [x] IDs de recursos (`service_id`, `product_id`, etc.) presentes cuando aplica
- [x] Valores monetarios incluidos cuando están disponibles

### Prevención de Duplicados
- [x] `lastTrackedService` en `BarberiasPublicLayout` previene duplicados
- [x] Flags de `isSubmittingBooking` previenen doble envío
- [x] Flags de `isBookingSlot` previenen múltiples clicks en horarios

---

## Notas

- **Modo desarrollo**: Analytics deshabilitado automáticamente
- **Fallback seguro**: Si GA4 no está configurado, eventos no causan errores
- **Privacy-first**: `anonymize_ip: true` en todas las llamadas

