# QA Checklist - Public Layouts

## Checklist General (Todos los Layouts)

### Mobile (< 768px)
- [ ] Hero section se ve correctamente (imagen, texto, CTAs)
- [ ] Navegación/scroll funciona sin problemas
- [ ] CTAs principales son accesibles (tamaño mínimo 44x44px)
- [ ] Formularios son usables (inputs no se cortan, teclado no cubre campos)
- [ ] Modales/drawers se abren y cierran correctamente
- [ ] Sticky CTAs (si existen) no cubren contenido importante
- [ ] Imágenes cargan correctamente (lazy loading funciona)
- [ ] No hay overflow horizontal (scroll horizontal no deseado)
- [ ] Texto es legible (tamaño mínimo 14px, contraste adecuado)

### Desktop (≥ 768px)
- [ ] Layout se ve balanceado (no todo amontonado)
- [ ] Grids/listas se muestran correctamente (2-4 columnas según layout)
- [ ] Hover states funcionan en elementos interactivos
- [ ] Modales/drawers se centran correctamente
- [ ] Navegación por teclado funciona (Tab, Enter, Escape)
- [ ] Focus visible en todos los elementos interactivos

### Accesibilidad
- [ ] `aria-label` en botones sin texto visible
- [ ] `role` correcto en elementos interactivos
- [ ] Navegación por teclado completa
- [ ] Escape cierra modales
- [ ] Focus trap en modales
- [ ] Contraste de texto ≥ 4.5:1 (WCAG AA)

### Performance
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] CLS < 0.1 (Cumulative Layout Shift)
- [ ] FCP < 1.8s (First Contentful Paint)
- [ ] Imágenes optimizadas (lazy loading, dimensiones correctas)

### Analytics
- [ ] Eventos de conversión se trackean en CTAs principales
- [ ] Eventos de navegación se trackean
- [ ] No hay eventos duplicados

---

## Layouts Específicos

### 1. BarberiasShowcase (`barberias`)
**Archivo:** `src/components/public/layouts/BarberiasPublicLayout.tsx`

#### Mobile
- [ ] Sticky CTA mobile visible y funcional
- [ ] Servicios se muestran en grid 1 columna
- [ ] Badges de disponibilidad visibles
- [ ] Empty states con CTAs de contacto
- [ ] Horarios próximos legibles

#### Desktop
- [ ] Servicios en grid 2 columnas
- [ ] Equipo/profesionales se muestran correctamente
- [ ] Horarios en formato legible

#### CTAs Principales
- [ ] "Agendar" en cada servicio → `SERVICE_BOOKING` event
- [ ] CTA principal hero → `SERVICE_BOOKING` o `WHATSAPP_CLICK`
- [ ] Sticky CTA mobile → mismo tracking que hero

#### Estados
- [ ] Loading: skeletons visibles
- [ ] Empty: mensajes claros con CTAs
- [ ] Error: toasts con opción de retry
- [ ] Disabled: botones con `opacity-50` y cursor `not-allowed`

---

### 2. RestaurantesComidaRapidaShowcase (`restaurantes_comida_rapida`)
**Archivo:** `src/pages/public/PublicMenu.tsx`

#### Mobile
- [ ] Tabs de categorías sticky y scroll horizontal funcional
- [ ] Productos en grid 1 columna
- [ ] Cart panel inferior sticky funcional
- [ ] Product detail modal accesible (escape, focus)
- [ ] QR block informativo visible (si está habilitado)

#### Desktop
- [ ] Tabs de categorías sticky
- [ ] Productos en grid 2-3 columnas
- [ ] Cart drawer lateral funcional
- [ ] Product detail modal centrado

#### CTAs Principales
- [ ] "Agregar" producto → `add_to_cart` click event
- [ ] "Enviar pedido" → `PRODUCT_ORDER` conversion event
- [ ] "Ver detalles" → navegación a modal

#### Estados
- [ ] Loading: `PublicMenuSkeleton`
- [ ] Empty: mensaje con CTA de contacto
- [ ] Cart vacío: mensaje claro
- [ ] Producto no disponible: botón disabled

---

### 3. MinimarketShowcase (`minimarket`)
**Archivo:** `src/components/public/layouts/MinimarketPublicLayout.tsx`

#### Mobile
- [ ] Búsqueda con debounce funcional
- [ ] Filtros (categoría, precio, tags) accesibles
- [ ] Quick-add a carrito estable (sin layout shift)
- [ ] Paginación funcional
- [ ] Sticky "Enviar pedido" CTA

#### Desktop
- [ ] Búsqueda y filtros en layout horizontal
- [ ] Productos en grid 3-4 columnas
- [ ] Paginación con navegación clara

#### CTAs Principales
- [ ] Quick-add → `add_to_cart` click event
- [ ] "Enviar pedido" → `PRODUCT_ORDER` conversion event
- [ ] Filtros → eventos de navegación

#### Estados
- [ ] Stock bajo/agotado: badges visibles
- [ ] Sin resultados: mensaje con "Limpiar filtros"
- [ ] Loading: skeletons
- [ ] Error de stock: toast con mensaje claro

---

### 4. ProductosCuidadoPersonalShowcase (`productos_cuidado_personal`)
**Archivo:** `src/components/public/layouts/ProductosCuidadoPersonalPublicLayout.tsx`

#### Mobile
- [ ] Búsqueda con debounce funcional
- [ ] Chips de categorías accesibles (scroll horizontal si es necesario)
- [ ] Cards con beneficios/variantes visibles
- [ ] Carrito con persistencia ligera (sessionStorage)

#### Desktop
- [ ] Búsqueda y categorías en layout horizontal
- [ ] Productos en grid 3 columnas
- [ ] Sección "Recomendados" visible (si hay ≥3 productos)

#### CTAs Principales
- [ ] "Agregar" → `add_to_cart` click event
- [ ] "Consultar" (si hide_price) → `WHATSAPP_CLICK`
- [ ] "Enviar pedido" → `PRODUCT_ORDER` conversion event

#### Estados
- [ ] Producto agregado: highlight temporal + toast
- [ ] Variantes: chips visibles con precios
- [ ] Sin productos: empty state con CTA
- [ ] Sin recomendados: sección oculta (no deja espacio muerto)

---

### 5. ActividadEntrenamientoFisicoShowcase (`actividad_entrenamiento_fisico`)
**Archivo:** `src/components/public/layouts/ActividadEntrenamientoFisicoPublicLayout.tsx`

#### Mobile
- [ ] Secciones: Clases/Planes, Entrenadores, Horarios claramente separadas
- [ ] Horarios legibles (día + hora + botón)
- [ ] Selección rápida de horario con confirmación
- [ ] Empty states con CTAs de contacto

#### Desktop
- [ ] Secciones en layout vertical claro
- [ ] Horarios en formato legible
- [ ] Equipo de entrenadores en grid 2 columnas

#### CTAs Principales
- [ ] "Agendar evaluación" → `SERVICE_BOOKING` conversion event
- [ ] "Agendar franja" (en horario) → `SERVICE_BOOKING`
- [ ] CTA secundario → scroll a sección

#### Estados
- [ ] Loading: spinner suave
- [ ] Horario seleccionado: highlight visual
- [ ] Booking en proceso: spinner + texto "Agendando..."
- [ ] Sin clases/entrenadores/horarios: empty states informativos

---

### 6. InmobiliariaTerrenosCasasShowcase (`inmobiliaria_terrenos_casas`)
**Archivo:** `src/components/public/layouts/InmobiliariaTerrenosCasasPublicLayout.tsx`

#### Mobile
- [ ] Filtros (tipo, precio, ubicación) accesibles
- [ ] Modal de detalle accesible (escape, focus trap)
- [ ] Formulario de lead funcional
- [ ] Rate limiting funcional (3 intentos/minuto)

#### Desktop
- [ ] Filtros en sidebar o top bar
- [ ] Modal de detalle centrado
- [ ] Formulario de lead con validación clara

#### CTAs Principales
- [ ] "Consultar" propiedad → abre modal de lead
- [ ] "Agendar visita" → abre modal de lead con intent='visit'
- [ ] "Enviar" lead → `contact.whatsappClick` o creación de lead

#### Estados
- [ ] Propiedad seleccionada: highlight en modal
- [ ] Formulario validando: disabled durante submit
- [ ] Rate limit excedido: toast con mensaje claro
- [ ] Lead enviado: confirmación + opción WhatsApp

---

### 7. ConstruccionShowcase (`construccion`)
**Archivo:** `src/components/public/layouts/ConstruccionPublicLayout.tsx`

#### Mobile
- [ ] Formulario breve accesible
- [ ] CTAs "Solicitar cotización" y "Agendar visita técnica" funcionales
- [ ] Confirmación post-envío clara

#### Desktop
- [ ] Formulario en layout centrado
- [ ] Secciones de servicios/proyectos visibles

#### CTAs Principales
- [ ] "Solicitar cotización" → scroll a formulario
- [ ] "Agendar visita técnica" → scroll + pre-fill `serviceType`
- [ ] "Enviar" → `work-orders-lite` o `leads` creation

#### Estados
- [ ] Enviando: `sending` state con disabled
- [ ] Éxito: mensaje con request ID + WhatsApp CTA
- [ ] Error: mensaje claro con opción de retry
- [ ] Rate limit: toast informativo

---

### 8. AgendaProfesionalesIndependientesShowcase (`agenda_profesionales_independientes`)
**Archivo:** `src/components/public/layouts/AgendaProfesionalesIndependientesPublicLayout.tsx`

#### Mobile
- [ ] Stepper: servicio → fecha → hora → datos funcional
- [ ] Estado persistente en sessionStorage
- [ ] Back sin perder progreso
- [ ] Datepicker accesible

#### Desktop
- [ ] Stepper en layout horizontal o vertical claro
- [ ] Datepicker con disponibilidad visible

#### CTAs Principales
- [ ] "Reservar hora" → abre `BookingModal`
- [ ] "Continuar" en stepper → avanza paso
- [ ] "Volver" en stepper → retrocede sin perder datos
- [ ] "Reservar" final → `SERVICE_BOOKING` conversion event

#### Estados
- [ ] Paso 1: servicio seleccionado
- [ ] Paso 2: fecha y hora seleccionados
- [ ] Validando: disabled durante submit
- [ ] Slot ocupado: error con opción de recargar horarios

---

## Consistencia Visual

### Espaciados
- [ ] Secciones: `space-y-4` o `space-y-6` consistente
- [ ] Cards: `p-4` o `p-6` consistente
- [ ] Gaps en grids: `gap-3` o `gap-4` consistente
- [ ] Margins entre secciones: `mb-8` o `mb-10` consistente

### Tipografías
- [ ] Títulos: `text-2xl` o `text-3xl` con `font-bold`
- [ ] Subtítulos: `text-sm` o `text-base` con `font-semibold`
- [ ] Body: `text-sm` o `text-base` con `font-normal`
- [ ] Labels: `text-xs` o `text-sm` con `font-medium`

### Botones
- [ ] Primary: `bg-{color}-500` con `text-white` y `font-semibold`
- [ ] Secondary: `border` con `bg-white` y `text-{color}-700`
- [ ] Tamaño: `px-4 py-2` o `px-5 py-2.5` consistente
- [ ] Border radius: `rounded-full` o `rounded-xl` consistente
- [ ] Focus: `focus-visible:outline focus-visible:ring-2`

### Estados Disabled/Loading
- [ ] Disabled: `opacity-50` + `cursor-not-allowed` + `disabled` attribute
- [ ] Loading: spinner (`animate-spin`) + texto "Cargando..." o "Guardando..."
- [ ] Skeleton: `animate-pulse` con `bg-gray-200`
- [ ] Error: toast con `toast.error()` + opción de retry si aplica

---

## Verificación de Analytics

### Eventos de Conversión
- [ ] `WHATSAPP_CLICK`: En todos los CTAs de WhatsApp
- [ ] `SERVICE_BOOKING`: En reservas de servicios/citas
- [ ] `PRODUCT_ORDER`: En envío de pedidos de productos

### Eventos de Navegación
- [ ] `add_to_cart`: Al agregar productos al carrito
- [ ] `event_view`: Al ver eventos
- [ ] `property_view`: Al ver propiedades

### Parámetros Requeridos
- [ ] `company_id`: En todos los eventos
- [ ] `service_id`: En eventos de servicios
- [ ] `product_id`: En eventos de productos
- [ ] `value`: En eventos de conversión con valor monetario

---

## Notas de QA

- **Testing en dispositivos reales**: iPhone, Android, tablets
- **Testing en navegadores**: Chrome, Firefox, Safari, Edge
- **Testing de accesibilidad**: Screen reader (NVDA/JAWS), navegación por teclado
- **Testing de performance**: Lighthouse, WebPageTest
- **Testing de analytics**: Google Analytics DebugView, GA4 Real-time

