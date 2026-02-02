# Layout Público para Categoría "Alimentos y Bebidas"

## Resumen
Este documento describe el diseño del layout público para empresas de la categoría **Alimentos y Bebidas** (restaurantes, comida rápida, bares, foodtrucks, panaderías), basado en el ejemplo de producción `pymerp.cl/micarritodecomida`.

---

## 1. Categorías Incluidas

Las siguientes categorías usan el layout `restaurantesComidaRapidaShowcase`:

- `restaurantes_comida_rapida`
- `restaurantes`
- `bares`
- `foodtruck`
- `panaderia_pasteleria`

**Archivo:** `src/services/publicPage.ts` (líneas 53-57)

---

## 2. Estructura del Layout

### 2.1 Hero Section (Encabezado)
**Componente:** Hero personalizado dentro de `RestaurantesComidaRapidaPublicLayout`

**Elementos:**
- **Kicker** (opcional): Texto pequeño en mayúsculas sobre el título
  - Ejemplo: "ESPECIALISTAS EN EL COMPLETO MÁS RÁPIDO DE CHILE"
  - Estilo: `text-xs uppercase tracking-[0.35em]`
  - Color: `theme.subtitleColor`

- **Título Principal**: Nombre del negocio
  - Ejemplo: "Mi Carrito de Comida"
  - Estilo: `text-3xl sm:text-4xl font-bold`
  - Color: `theme.titleColor`
  - Fuente: `theme.fontTitle`

- **Descripción**: Descripción del negocio
  - Ejemplo: "Bienvenidos a nuestra página web"
  - Estilo: `text-sm sm:text-base max-w-2xl`
  - Color: `theme.subtitleColor`
  - Fuente: `theme.fontBody`

- **Logo/Banner** (opcional): Imagen del negocio
  - Posición: Derecha en desktop, centrado en mobile
  - Tamaño: `max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px]`
  - Se puede ocultar en mobile con `hideHeroLogoOnMobile`

**Personalización:**
- Fondo de tarjeta hero: `appearance.menu_hero_card_color` + `appearance.menu_hero_card_opacity`
- Fondo de tarjeta logo: `appearance.menu_hero_logo_card_color` + `appearance.menu_hero_logo_card_opacity`
- En iOS, los fondos son siempre transparentes

---

### 2.2 Sección de Menú/Productos
**Título:** "Productos" (configurable via i18n)

**Características:**

#### A. Barra de Búsqueda
- Input con icono de lupa
- Placeholder: "Buscar productos..."
- Botón de limpiar (X) cuando hay texto
- Estilo: `rounded-xl border px-4 py-3`
- Color de fondo: `theme.cardColor` con opacidad
- Focus ring: `theme.buttonColor`

#### B. Navegación por Categorías
- Botones pill (redondeados) horizontales
- Categoría "Todos" + categorías del menú
- Scroll horizontal en mobile
- Estilo activo:
  - Fondo: `theme.buttonColor`
  - Texto: `theme.buttonTextColor` (con contraste asegurado)
- Estilo inactivo:
  - Fondo: `theme.cardColor` o `theme.bgColor`
  - Texto: `theme.textColor` (con contraste asegurado)

#### C. Grid de Productos
**Layout:** Responsive grid
- Mobile: 2 columnas (`grid-cols-2`)
- Tablet: 2 columnas (`sm:grid-cols-2`)
- Desktop: 3 columnas (`md:grid-cols-3`)
- Desktop grande: 3-4 columnas (`lg:grid-cols-3 xl:grid-cols-4`)
- Gap: `gap-3 sm:gap-4 lg:gap-5`

**Alternativa:** Layout de lista (`grid-cols-1`) si `appearance.layout === 'LIST'`

**Tarjetas de Producto:**
- Componente dinámico según `theme.cardLayout` (1-4)
- Imagen del producto (si existe)
- Nombre del producto
- Descripción (truncada)
- Precio (o "Consultar" si está oculto)
- Botones de cantidad (+/-)
- Badge "No disponible" si `isAvailable === false`

#### D. Agrupación por Categorías
Los productos se agrupan por categoría:
- Cada categoría tiene su propio `<h3>` con el nombre
- Los productos se ordenan por `menuOrder`
- Scroll suave al hacer clic en la navegación de categorías

#### E. Paginación
- Solo se muestra cuando hay búsqueda activa
- 24 productos por página
- Botón "Cargar más" para la siguiente página
- Mensaje "No hay más productos" al final

---

### 2.3 Sección QR del Menú
**Condición:** Solo si `isModuleEnabled(categoryId, 'menu-qr')` es true

**Elementos:**
- Kicker: "MENÚ DIGITAL"
- Título: "Escanea el código QR"
- Descripción: Instrucciones para acceder al menú digital
- Código QR: Generado con `QRCodeSVG` apuntando a `{baseUrl}/{slug}/menu`
- Botones:
  - "Ver menú" (abre en nueva pestaña)
  - "Copiar URL" (copia al portapapeles)

**Estilo:**
- Card con borde redondeado (`rounded-2xl`)
- Padding: `p-4 sm:p-5`
- Fondo: `theme.cardColor` con opacidad alta
- Border: `borderColor` (derivado de `theme.cardColor`)

---

### 2.4 Carrito de Compras (Floating)

#### Mobile (< sm)
- Posición: Fixed bottom (`bottom-20`)
- Ancho: Full width con margen (`inset-x-4`)
- Contenido:
  - Total del carrito
  - Cantidad de items
  - Botón "Ver carrito (N)"
- Estilo: Card con `backdrop-blur` y sombra

#### Desktop (>= lg)
- Posición: Fixed top-right (`right-6 top-28`)
- Ancho: `w-72`
- Contenido:
  - Label "CARRITO"
  - Total formateado
  - Hint: "N artículos"
  - Botón "Ver carrito (N)"
- Estilo: Card con `backdrop-blur` y sombra fuerte

**Comportamiento:**
- Solo se muestra si `cartItems > 0`
- El contenido principal tiene `lg:pr-80` para evitar superposición

---

### 2.5 Tabs Productos/Servicios
**Condición:** Solo si hay productos Y servicios

- Toggle entre "Productos" y "Servicios"
- Estilo: Pills dentro de un contenedor redondeado
- Activo: Fondo `theme.cardColor`, texto `theme.titleColor`
- Inactivo: Fondo transparente, texto `theme.textColor`

---

### 2.6 Otras Secciones (Heredadas de PublicLayoutShell)

El layout usa `PublicLayoutShell` para renderizar:
- **Descripción** (`sections.missionVision`)
- **Horario de atención** (`sections.hours`)
- **Ubicación** (`sections.location`)
- **Video** (`sections.media`)
- **Acciones de contacto** (`contactActions`)
- **FAQs** (`sections.faqs`)
- **Reseñas** (`sections.reviews`)

---

## 3. Temas y Personalización

### 3.1 Colores del Tema (`AppearanceTheme`)
```typescript
{
  bgColor: string;           // Fondo general
  bgOpacity: number;         // Opacidad del fondo
  cardColor: string;         // Fondo de tarjetas
  cardOpacity: number;       // Opacidad de tarjetas
  buttonColor: string;       // Color de botones
  buttonTextColor: string;   // Texto de botones
  titleColor: string;        // Títulos principales
  subtitleColor: string;     // Subtítulos y labels
  textColor: string;         // Texto general
  descriptionColor: string;  // Descripciones
  fontTitle: string;         // Fuente para títulos
  fontBody: string;          // Fuente para cuerpo
  fontButton: string;        // Fuente para botones
  cardLayout: number;        // Layout de tarjetas (1-4)
}
```

### 3.2 Configuración de Apariencia (`CompanyAppearance`)
```typescript
{
  logo_url?: string;                    // URL del logo
  banner_url?: string;                  // URL del banner
  background_url?: string;              // Imagen de fondo
  background_enabled?: boolean;         // Habilitar fondo
  background_fit?: string;              // 'cover' | 'contain'
  background_orientation?: string;      // 'VERTICAL' | 'HORIZONTAL'
  background_opacity?: number;          // 0-100
  background_color?: string;            // Color de fondo fallback
  hero_kicker?: string;                 // Texto sobre el título
  hero_title?: string;                  // Título hero (default: company.name)
  hero_description?: string;            // Descripción hero
  menu_hero_card_color?: string;        // Color de tarjeta hero
  menu_hero_card_opacity?: number;      // Opacidad tarjeta hero
  menu_hero_logo_card_color?: string;   // Color de tarjeta logo
  menu_hero_logo_card_opacity?: number; // Opacidad tarjeta logo
  layout?: 'GRID' | 'LIST';             // Layout de productos
  show_whatsapp_fab?: boolean;          // Mostrar botón WhatsApp flotante
}
```

---

## 4. Funcionalidades Especiales

### 4.1 Búsqueda de Productos
- Debounce de 300ms
- Busca en: nombre, descripción, tags
- Filtra productos en todas las categorías
- Muestra mensaje "Sin resultados" si no hay coincidencias

### 4.2 Filtrado por Categoría
- Categoría "Todos" muestra todos los productos
- Al seleccionar una categoría, scroll automático a esa sección
- Solo se muestran categorías con productos

### 4.3 Gestión de Carrito
- Agregar producto: `onAddToCart(product, quantity)`
- Actualizar cantidad: `onUpdateQuantity(productId, quantity)`
- Ver detalles: `onProductClick(product)`
- Abrir carrito: `onOpenCart()`

### 4.4 Productos No Disponibles
- Badge rojo "No disponible" en la esquina superior izquierda
- No se puede agregar al carrito
- Se muestra en gris o con opacidad reducida

### 4.5 Precios Ocultos
- Si `hasHiddenPrices === true`, muestra "Consultar" en lugar del precio
- El total del carrito muestra "Consultar total"

---

## 5. Responsive Design

### Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 768px (sm-md)
- **Desktop:** 768px - 1024px (md-lg)
- **Desktop grande:** >= 1024px (lg+)

### Adaptaciones Mobile
- Hero: Logo se puede ocultar con `hideHeroLogoOnMobile`
- Grid: 2 columnas en mobile, 3-4 en desktop
- Categorías: Scroll horizontal
- Carrito: Fixed bottom en mobile, fixed right en desktop
- Padding: Reducido en mobile (`p-4` vs `sm:p-5`)

---

## 6. Accesibilidad

- Todos los botones tienen `aria-label` descriptivos
- Los botones de categoría tienen `aria-pressed` para indicar estado activo
- Las imágenes decorativas tienen `aria-hidden="true"`
- Focus visible con `focus-visible:outline-none focus-visible:ring-2`
- Contraste de texto asegurado con `ensureButtonContrast()`

---

## 7. Optimizaciones de Performance

### Code Splitting
- El layout se carga con `React.lazy()` y `Suspense`
- Fallback: `<LoadingSpinner size="lg" />`

### Lazy Loading de Imágenes
- Todas las imágenes de productos usan `loading="lazy"`
- Imagen de fondo usa `loading="eager"` para evitar FOUC

### Debouncing
- Búsqueda: 300ms debounce
- Evita renders innecesarios durante la escritura

### Memoization
- `useMemo` para cálculos pesados:
  - `resolvedCategories`
  - `productsByCategory`
  - `filteredProductsByCategory`
  - `displayProductsByCategory`
  - `menuUrl`

---

## 8. Internacionalización (i18n)

Todas las cadenas de texto están en archivos de traducción:

```typescript
// Claves principales
'publicPage.restaurantsLayout.heroDescription'
'publicPage.restaurantsLayout.menuFilterAll'
'publicPage.restaurantsLayout.uncategorized'
'publicPage.restaurantsLayout.allCategory'
'publicPage.restaurantsLayout.searchPlaceholder'
'publicPage.restaurantsLayout.unavailable'
'publicPage.restaurantsLayout.loadMore'
'publicPage.restaurantsLayout.noMoreProducts'
'publicPage.restaurantsLayout.emptyMenu'
'publicPage.restaurantsLayout.qrKicker'
'publicPage.restaurantsLayout.qrTitle'
'publicPage.restaurantsLayout.qrDescription'
'publicPage.restaurantsLayout.qrView'
'publicPage.restaurantsLayout.qrCopy'
'publicPage.restaurantsLayout.productsTab'
'publicPage.restaurantsLayout.servicesTab'
'publicPage.restaurantsLayout.productsSectionTitle'
'publicPage.restaurantsLayout.cartLabel'
'publicPage.restaurantsLayout.cartTotal'
'publicPage.restaurantsLayout.cartTotalHidden'
'publicPage.restaurantsLayout.cartCta'
'publicPage.restaurantsLayout.cartHint'
```

---

## 9. Ejemplo de Uso

### En Firestore (company document)
```json
{
  "id": "company123",
  "name": "Mi Carrito de Comida",
  "slug": "micarritodecomida",
  "category_id": "restaurantes_comida_rapida",
  "business_type": "PRODUCTS",
  "description": "Bienvenidos a nuestra página web",
  "whatsapp": "+56912345678",
  "address": "Romeral, Maule, Chile"
}
```

### En Firestore (appearance document)
```json
{
  "company_id": "company123",
  "background_enabled": true,
  "background_url": "https://...",
  "background_fit": "cover",
  "background_orientation": "HORIZONTAL",
  "background_opacity": 80,
  "background_color": "#ffffff",
  "hero_kicker": "ESPECIALISTAS EN EL COMPLETO MÁS RÁPIDO DE CHILE",
  "hero_title": "Mi Carrito de Comida",
  "hero_description": "Bienvenidos a nuestra página web",
  "menu_hero_card_color": "#000000",
  "menu_hero_card_opacity": 0,
  "menu_hero_logo_card_color": "#ffffff",
  "menu_hero_logo_card_opacity": 90,
  "layout": "GRID",
  "show_whatsapp_fab": true
}
```

### Resultado
- URL pública: `https://pymerp.cl/micarritodecomida`
- Layout: `restaurantesComidaRapidaShowcase`
- Variant: `classic` (default para restaurantes)
- Módulos habilitados: Catálogo, Pedidos, Inventario, Menú QR

---

## 10. Archivos Relacionados

### Layout Principal
- `src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`

### Configuración
- `src/services/publicPage.ts` (mapeo de categorías a layouts)
- `src/config/categories.ts` (definición de categorías y módulos)

### Componentes Reutilizables
- `src/pages/public/layouts/PublicLayoutShell.tsx` (shell base)
- `src/pages/public/components/cardLayouts/ProductCardLayouts.tsx` (tarjetas de productos)
- `src/components/animations/AnimatedButton.tsx` (botones animados)

### Utilidades
- `src/utils/colorContrast.ts` (asegurar contraste de texto)
- `src/utils/productSearch.ts` (búsqueda de productos)
- `src/hooks/useDebounce.ts` (debouncing)

### Tipos
- `src/pages/public/layouts/types.ts` (tipos de layouts y props)
- `src/types/index.ts` (tipos generales: Company, Product, etc.)

---

## 11. Próximos Pasos

Para replicar este diseño en localhost:

1. ✅ Asegurar que las reglas de dark mode NO interfieran con páginas públicas
2. ✅ Configurar URLs dinámicas según el entorno (localhost vs producción)
3. ✅ Agregar clase `public-page-mode` al body para deshabilitar dark mode
4. ✅ Verificar que los estilos inline de la DB tengan prioridad
5. 🔄 Probar en localhost y comparar con producción
6. 🔄 Ajustar cualquier diferencia visual

---

## 12. Notas Importantes

- **iOS Safari:** Los fondos de tarjetas hero son siempre transparentes en iOS para evitar problemas de rendering
- **Dark Mode:** Las páginas públicas NO usan dark mode; los temas personalizados de la DB tienen prioridad absoluta
- **Fallbacks:** Todos los valores tienen fallbacks seguros para evitar crashes
- **Validación:** Los layouts y variants se validan antes de usar; si son inválidos, se usa 'default' y 'classic'
- **Slug vs Category:** El layout se determina SOLO por `category_id`, NO por el slug de la URL

---

**Última actualización:** 2026-02-01
**Autor:** Sistema de Documentación AgendaWeb
**Versión:** 1.0.0
