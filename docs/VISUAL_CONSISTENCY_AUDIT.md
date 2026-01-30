# Visual Consistency Audit - Public Layouts

## Resumen

Auditoría de consistencia visual en espaciados, tipografías, botones y estados disabled/loading en todos los layouts públicos.

## Espaciados

### Secciones
**Estándar:** `space-y-4` o `space-y-6`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `space-y-4` en secciones
- ✅ `RestaurantesComidaRapidaShowcase`: `space-y-3` en categorías, `space-y-4` en productos
- ✅ `MinimarketPublicLayout`: `space-y-2` en slots, `space-y-3` en productos
- ✅ `ProductosCuidadoPersonalPublicLayout`: `space-y-3` en cards
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `space-y-3` en secciones
- ✅ `InmobiliariaTerrenosCasasPublicLayout`: `space-y-4` en propiedades
- ✅ `ConstruccionPublicLayout`: `space-y-4` en secciones

**Recomendación:** Unificar a `space-y-4` para secciones principales, `space-y-3` para sub-secciones.

---

### Cards
**Estándar:** `p-4` o `p-6`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `p-4` en service cards
- ✅ `RestaurantesComidaRapidaShowcase`: `p-4` en product cards
- ✅ `MinimarketPublicLayout`: `p-3` en product cards
- ✅ `ProductosCuidadoPersonalPublicLayout`: `p-4` en product cards
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `p-4` en service cards

**Recomendación:** Unificar a `p-4` para cards estándar, `p-6` para cards destacadas.

---

### Gaps en Grids
**Estándar:** `gap-3` o `gap-4`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `gap-3` en grid de servicios
- ✅ `RestaurantesComidaRapidaShowcase`: `gap-4` en grid de productos
- ✅ `MinimarketPublicLayout`: `gap-3` en grid de productos
- ✅ `ProductosCuidadoPersonalPublicLayout`: `gap-4` en grid de productos
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `gap-3` en grid de servicios

**Recomendación:** Unificar a `gap-4` para grids de productos, `gap-3` para grids de servicios.

---

### Margins entre Secciones
**Estándar:** `mb-8` o `mb-10`

**Verificación:**
- ✅ `BarberiasPublicLayout`: Secciones sin margin explícito (usa `space-y-4` en contenedor)
- ✅ `RestaurantesComidaRapidaShowcase`: `mb-10` en secciones principales
- ✅ `MinimarketPublicLayout`: Secciones sin margin explícito
- ✅ `ProductosCuidadoPersonalPublicLayout`: Secciones sin margin explícito

**Recomendación:** Agregar `mb-8` o `mb-10` consistente entre secciones principales.

---

## Tipografías

### Títulos Principales (H1)
**Estándar:** `text-3xl` o `text-4xl` con `font-bold`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `text-3xl sm:text-4xl` con `font-black`
- ✅ `RestaurantesComidaRapidaShowcase`: `text-3xl font-bold`
- ✅ `MinimarketPublicLayout`: `text-3xl font-bold`
- ✅ `ProductosCuidadoPersonalPublicLayout`: `text-3xl font-bold`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `text-3xl font-black`

**Recomendación:** Unificar a `text-3xl sm:text-4xl` con `font-bold` (o `font-black` si se requiere más énfasis).

---

### Títulos de Sección (H2)
**Estándar:** `text-xl` o `text-2xl` con `font-bold`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `text-xl sm:text-2xl` con `font-bold`
- ✅ `RestaurantesComidaRapidaShowcase`: `text-2xl` con `font-bold`
- ✅ `MinimarketPublicLayout`: `text-xl sm:text-2xl` con `font-bold`
- ✅ `ProductosCuidadoPersonalPublicLayout`: `text-2xl` con `font-bold`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `text-xl sm:text-2xl` con `font-bold`

**Recomendación:** Unificar a `text-xl sm:text-2xl` con `font-bold`.

---

### Subtítulos
**Estándar:** `text-sm` o `text-base` con `font-semibold`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `text-sm` con `font-semibold`
- ✅ `RestaurantesComidaRapidaShowcase`: `text-sm` con `font-medium`
- ✅ `MinimarketPublicLayout`: `text-sm` con `font-semibold`
- ✅ `ProductosCuidadoPersonalPublicLayout`: `text-sm` con `font-semibold`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `text-sm` con `font-semibold`

**Recomendación:** Unificar a `text-sm` con `font-semibold` para subtítulos.

---

### Body Text
**Estándar:** `text-sm` o `text-base` con `font-normal`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `text-sm` con `font-normal`
- ✅ `RestaurantesComidaRapidaShowcase`: `text-sm` con `font-normal`
- ✅ `MinimarketPublicLayout`: `text-sm` con `font-normal`
- ✅ `ProductosCuidadoPersonalPublicLayout`: `text-sm` con `font-normal`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `text-sm` con `font-normal`

**Recomendación:** ✅ Consistente - `text-sm` con `font-normal`.

---

### Labels
**Estándar:** `text-xs` o `text-sm` con `font-medium`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `text-xs` con `font-semibold` (kickers)
- ✅ `RestaurantesComidaRapidaShowcase`: `text-xs` con `font-medium`
- ✅ `MinimarketPublicLayout`: `text-xs` con `font-semibold` (kickers)
- ✅ `ProductosCuidadoPersonalPublicLayout`: `text-xs` con `font-semibold` (kickers)
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `text-xs` con `font-semibold` (kickers)

**Recomendación:** ✅ Consistente - `text-xs` con `font-semibold` para kickers, `text-xs` con `font-medium` para labels.

---

## Botones

### Primary Buttons
**Estándar:** `bg-{color}-500` con `text-white` y `font-semibold`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `bg-emerald-500` con `text-white` y `font-semibold`
- ✅ `RestaurantesComidaRapidaShowcase`: Usa `theme.buttonColor` con `theme.buttonTextColor`
- ✅ `MinimarketPublicLayout`: `bg-emerald-500` con `text-white` y `font-semibold`
- ✅ `ProductosCuidadoPersonalPublicLayout`: Usa `theme.buttonColor` con `theme.buttonTextColor`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `bg-emerald-500` con `text-white` y `font-semibold`

**Recomendación:** ✅ Consistente - Usa `theme.buttonColor` cuando está disponible, colores hardcodeados solo cuando es necesario.

---

### Tamaño de Botones
**Estándar:** `px-4 py-2` o `px-5 py-2.5`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `px-4 py-2` o `px-5 py-2.5` (variado)
- ✅ `RestaurantesComidaRapidaShowcase`: `px-4 py-2` o `px-5 py-2.5` (variado)
- ✅ `MinimarketPublicLayout`: `px-4 py-2` o `px-5 py-2.5` (variado)
- ✅ `ProductosCuidadoPersonalPublicLayout`: `px-4 py-2` con `text-sm`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `px-4 py-2` o `px-5 py-2.5` (variado)

**Recomendación:** Unificar a `px-4 py-2` para botones estándar, `px-5 py-2.5` para botones destacados.

---

### Border Radius
**Estándar:** `rounded-full` o `rounded-xl`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `rounded-full` en CTAs principales, `rounded-xl` en botones de servicio
- ✅ `RestaurantesComidaRapidaShowcase`: `rounded-xl` en botones de producto
- ✅ `MinimarketPublicLayout`: `rounded-full` en CTAs, `rounded-xl` en botones de producto
- ✅ `ProductosCuidadoPersonalPublicLayout`: `rounded-xl` en botones
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `rounded-full` en CTAs principales, `rounded-xl` en botones

**Recomendación:** ✅ Consistente - `rounded-full` para CTAs principales, `rounded-xl` para botones secundarios.

---

### Focus States
**Estándar:** `focus-visible:outline focus-visible:ring-2`

**Verificación:**
- ✅ `BarberiasPublicLayout`: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`
- ✅ `RestaurantesComidaRapidaShowcase`: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`
- ✅ `MinimarketPublicLayout`: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`
- ✅ `ProductosCuidadoPersonalPublicLayout`: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`

**Recomendación:** ✅ Consistente - `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`.

---

## Estados Disabled/Loading

### Disabled State
**Estándar:** `opacity-50` + `cursor-not-allowed` + `disabled` attribute

**Verificación:**
- ✅ `BarberiasPublicLayout`: `disabled:opacity-50` + `disabled` attribute
- ✅ `RestaurantesComidaRapidaShowcase`: `disabled:opacity-50` + `disabled` attribute
- ✅ `MinimarketPublicLayout`: `disabled:opacity-50 disabled:cursor-not-allowed` + `disabled` attribute
- ✅ `ProductosCuidadoPersonalPublicLayout`: `disabled:opacity-50` + `disabled` attribute
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `disabled:opacity-50` + `disabled` attribute

**Recomendación:** ✅ Consistente - Agregar `disabled:cursor-not-allowed` a todos los botones disabled.

---

### Loading State
**Estándar:** Spinner (`animate-spin`) + texto "Cargando..." o "Guardando..."

**Verificación:**
- ✅ `BarberiasPublicLayout`: No tiene loading state explícito en botones
- ✅ `RestaurantesComidaRapidaShowcase`: No tiene loading state explícito en botones
- ✅ `MinimarketPublicLayout`: No tiene loading state explícito en botones
- ✅ `ProductosCuidadoPersonalPublicLayout`: No tiene loading state explícito en botones
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `animate-spin` spinner + texto "Agendando..." en botones de horario

**Recomendación:** Agregar loading state con spinner y texto en botones que realizan acciones asíncronas.

---

### Skeleton Loading
**Estándar:** `animate-pulse` con `bg-gray-200`

**Verificación:**
- ✅ `BarberiasPublicLayout`: No tiene skeletons
- ✅ `RestaurantesComidaRapidaShowcase`: `PublicMenuSkeleton` con `animate-pulse`
- ✅ `MinimarketPublicLayout`: No tiene skeletons
- ✅ `ProductosCuidadoPersonalPublicLayout`: No tiene skeletons
- ✅ `ActividadEntrenamientoFisicoPublicLayout`: `EventCardSkeleton` con `animate-pulse`

**Recomendación:** Agregar skeletons a todos los layouts que cargan datos asíncronos.

---

## Resumen de Inconsistencias Encontradas

### Menores
1. **Espaciados**: Variación en `space-y-{n}` entre layouts (3, 4, 6)
2. **Padding de cards**: Variación entre `p-3`, `p-4`, `p-6`
3. **Tamaño de botones**: Variación entre `px-4 py-2` y `px-5 py-2.5`
4. **Loading states**: Faltan en algunos botones que realizan acciones asíncronas
5. **Skeletons**: Faltan en algunos layouts

### Recomendaciones

1. **Unificar espaciados:**
   - Secciones principales: `space-y-4`
   - Sub-secciones: `space-y-3`
   - Cards: `p-4` estándar, `p-6` destacadas
   - Gaps en grids: `gap-4` productos, `gap-3` servicios

2. **Unificar tipografías:**
   - H1: `text-3xl sm:text-4xl font-bold`
   - H2: `text-xl sm:text-2xl font-bold`
   - Subtítulos: `text-sm font-semibold`
   - Body: `text-sm font-normal`
   - Labels: `text-xs font-medium`

3. **Unificar botones:**
   - Primary: `px-4 py-2 text-sm font-semibold rounded-full`
   - Secondary: `px-4 py-2 text-sm font-semibold rounded-xl border`
   - Focus: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`

4. **Agregar estados faltantes:**
   - Loading: Spinner + texto en botones asíncronos
   - Skeletons: En todos los layouts que cargan datos
   - Disabled: `disabled:cursor-not-allowed` en todos los botones

---

## Checklist de Consistencia

- [x] Espaciados entre secciones verificados
- [x] Tipografías verificadas
- [x] Botones verificados
- [x] Estados disabled verificados
- [ ] Loading states agregados donde faltan
- [ ] Skeletons agregados donde faltan
- [ ] Unificaciones aplicadas

