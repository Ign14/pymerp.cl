# 🎯 Plan Final de Implementación - Restaurantes y Comida Rápida
## Features Críticas: Búsqueda, Delivery/Takeaway, Paginación

**Fecha:** 2024-12-19  
**Objetivo:** Cerrar categoría restaurantes implementando 3 features críticas manteniendo estabilidad, multi-tenancy e i18n.

---

## 📊 RESUMEN EJECUTIVO DEL DIAGNÓSTICO

### Estado Actual (Basado en Análisis de Código)

#### ✅ Lo que YA funciona:
1. **Layout específico** `RestaurantesComidaRapidaPublicLayout` con categorías de menú y navegación sticky
2. **Carrito funcional** con estado local (no localStorage, correcto para multi-tenant)
3. **WhatsApp integration** vía `createProductOrderRequest`
4. **Sistema de categorías** (`menu_categories`) con ordenamiento
5. **Multi-tenancy** implementado: todas las queries filtran por `company_id`
6. **i18n** básico funcionando

#### ❌ Lo que FALTA (3 features críticas):

1. **Búsqueda de Productos**
   - No existe barra de búsqueda
   - Minimarket tiene: `useDebounce` + `buildSearchText` (cliente)
   - Requiere: Input de búsqueda + filtrado en cliente

2. **Delivery/Takeaway Configuration**
   - Solo existe `delivery_enabled: boolean` en `Company`
   - Minimarket tiene `fulfillment_config` (DELIVERY/PICKUP)
   - Requiere: `fulfillment_config` en `Company` + UI en CartModal + Dashboard

3. **Paginación**
   - Carga TODOS los productos de una vez (`getProducts` sin límites)
   - Minimarket tiene paginación cliente (24 items/página)
   - Requiere: Paginación cliente (inicial) o Firestore (óptimo)

---

## 🗺️ RUTAS Y COMPONENTES IMPLICADOS

### Rutas Públicas:
- **`/:slug`** → `PublicPage.tsx` → `RestaurantesComidaRapidaPublicLayout.tsx`
- **`/:companyId/menu`** → `PublicMenu.tsx` (menos usado, no requiere cambios)

### Componentes Principales:
1. **`src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`**
   - **Cambios:** Búsqueda UI, estado paginación, fulfillment config
   
2. **`src/pages/public/PublicPage.tsx`**
   - **Cambios:** Mínimos (pasa props al layout)

3. **`src/pages/public/components/CartModal.tsx`**
   - **Cambios:** UI fulfillment (DELIVERY/TAKEAWAY/DINE_IN), validación pedido mínimo

4. **`src/pages/dashboard/products/ProductsSettings.tsx`**
   - **Cambios:** Sección configuración fulfillment

### Servicios:
- **`src/services/firestore.ts`**: `getProducts()` (mantener compatibilidad), agregar `getProductsPaginated()` (opcional)
- **`src/utils/productSearch.ts`**: Nuevo (reutilizar de Minimarket)

---

## 🏗️ ARQUITECTURA DE DATOS

### 1. Campos a Agregar

#### En `Company` (`src/types/index.ts`):
```typescript
interface Company {
  // ✅ Ya existe
  delivery_enabled?: boolean;
  
  // ✅ NUEVO: Fulfillment config
  fulfillment_config?: {
    enabled?: boolean;
    modes?: Array<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>;
    delivery_fee?: number;
    minimum_order?: number;
    delivery_time_minutes?: number;
    preparation_time_minutes?: number;
    title?: string;
    description?: string;
    note?: string;
  };
}
```

**Migración/Compatibilidad:**
- Si `fulfillment_config` existe → usar
- Si NO existe pero `delivery_enabled === true` → fallback: `{ enabled: true, modes: ['DELIVERY', 'TAKEAWAY'] }`
- Si NO existe y `delivery_enabled === false/undefined` → fallback: `{ enabled: false, modes: [] }`

#### En `Product` (`src/types/index.ts`):
- ✅ **NO requiere cambios**
- Campos suficientes: `name`, `description`, `tags`, `menuCategoryId`, `status`, `isAvailable`

### 2. Estructura Firestore Actual

#### Colección `products/{id}`:
```typescript
{
  company_id: string;        // ✅ Multi-tenant
  name: string;
  description: string;
  tags?: string[];           // ✅ Para búsqueda
  menuCategoryId?: string;   // ✅ Para filtrado
  status: 'ACTIVE' | 'INACTIVE';
  menuOrder?: number;        // ✅ Para ordenamiento
  isAvailable?: boolean;
  price: number;
  image_url: string;
}
```

#### Colección `companies/{id}`:
```typescript
{
  delivery_enabled?: boolean;      // ✅ Existente (mantener)
  fulfillment_config?: { ... };    // ✅ NUEVO
  // ... otros campos
}
```

#### Colección `productOrderRequests/{id}`:
```typescript
{
  company_id: string;
  order_type?: 'TABLE' | 'PICKUP' | 'DELIVERY';  // ✅ Ya existe
  items: Array<{ product_id, quantity, unit_price }>;
  // ... otros campos
}
```

### 3. Índices Firestore

#### ❌ **NO REQUERIDOS INICIALMENTE**
- Búsqueda es en cliente (no requiere índices)
- Paginación inicial es en cliente (no requiere índices)
- **Si luego implementamos paginación Firestore:**
  ```json
  {
    "collectionGroup": "products",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "company_id", "order": "ASCENDING" },
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "menuOrder", "order": "ASCENDING" }
    ]
  }
  ```

---

## 🔧 PLAN DE IMPLEMENTACIÓN DETALLADO

### FASE 1: Tipos y Utilidades (Backend)

#### 1.1 Actualizar `src/types/index.ts`
- [ ] Agregar `fulfillment_config` a `Company`
- [ ] Exportar tipos: `FulfillmentConfig`, `FulfillmentMode`

#### 1.2 Crear `src/utils/productSearch.ts` (NUEVO)
```typescript
export function buildSearchText(product: Product): string {
  const tags = (product.tags || []).join(' ');
  return `${product.name} ${product.description || ''} ${tags}`.toLowerCase();
}

export function filterProductsBySearch(
  products: Product[],
  searchTerm: string
): Product[] {
  if (!searchTerm.trim()) return products;
  const normalized = searchTerm.trim().toLowerCase();
  return products.filter((product) =>
    buildSearchText(product).includes(normalized)
  );
}
```

**Archivos:**
- [ ] Crear `src/utils/productSearch.ts`

---

### FASE 2: Búsqueda (Cliente-Side)

#### 2.1 `RestaurantesComidaRapidaPublicLayout.tsx`

**Estado:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

**Filtrado:**
```typescript
const filteredProducts = useMemo(() => {
  const normalized = debouncedSearchTerm.trim().toLowerCase();
  if (!normalized) {
    return productsByCategory[activeCategory] || [];
  }
  const allProducts = productsByCategory[activeCategory] || [];
  return filterProductsBySearch(allProducts, normalized);
}, [productsByCategory, activeCategory, debouncedSearchTerm]);
```

**UI:**
- [ ] Agregar barra de búsqueda antes de `categoryNavigation`
- [ ] Placeholder: `t('publicPage.restaurantsLayout.searchPlaceholder')`
- [ ] Icono de búsqueda (opcional)

**Archivos:**
- [ ] Modificar `src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`

---

### FASE 3: Paginación (Cliente-Side)

#### 3.1 `RestaurantesComidaRapidaPublicLayout.tsx`

**Estado:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 24;
```

**Paginación:**
```typescript
const paginatedProducts = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}, [filteredProducts, currentPage]);

const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
```

**UI:**
- [ ] Botón "Cargar más" al final de productos
- [ ] Mostrar "No hay más productos" cuando `currentPage >= totalPages`
- [ ] Resetear `currentPage` a 1 cuando cambia `activeCategory` o `debouncedSearchTerm`

**Archivos:**
- [ ] Modificar `src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`

---

### FASE 4: Fulfillment Config

#### 4.1 Helper: `getFulfillmentConfig` (en layout)

```typescript
function getFulfillmentConfig(company: Company): FulfillmentConfig {
  const raw = company.fulfillment_config;
  if (raw) {
    return {
      enabled: raw.enabled ?? false,
      modes: raw.modes ?? [],
      delivery_fee: raw.delivery_fee,
      minimum_order: raw.minimum_order,
      // ...
    };
  }
  // Fallback a delivery_enabled
  if (company.delivery_enabled) {
    return {
      enabled: true,
      modes: ['DELIVERY', 'TAKEAWAY'],
    };
  }
  return { enabled: false, modes: [] };
}
```

#### 4.2 `CartModal.tsx`

**Props:**
```typescript
interface CartModalProps {
  // ... props existentes
  fulfillmentConfig?: FulfillmentConfig;
}
```

**UI:**
- [ ] Radio buttons o tabs para seleccionar modo (DELIVERY/TAKEAWAY/DINE_IN)
- [ ] Campo dirección si `DELIVERY` seleccionado
- [ ] Mostrar `delivery_fee` si existe
- [ ] Validar `minimum_order` antes de enviar
- [ ] Actualizar `orderForm.delivery_type` (usar valor del modal)

**Archivos:**
- [ ] Modificar `src/pages/public/components/CartModal.tsx`
- [ ] Modificar `src/pages/public/PublicPage.tsx` (pasar `fulfillmentConfig` al modal)

#### 4.3 `ProductsSettings.tsx` (Dashboard)

**Estado:**
```typescript
const [fulfillmentConfig, setFulfillmentConfig] = useState<FulfillmentConfig>({
  enabled: company.fulfillment_config?.enabled ?? company.delivery_enabled ?? false,
  modes: company.fulfillment_config?.modes ?? 
    (company.delivery_enabled ? ['DELIVERY', 'TAKEAWAY'] : []),
  delivery_fee: company.fulfillment_config?.delivery_fee,
  minimum_order: company.fulfillment_config?.minimum_order,
  // ...
});
```

**UI:**
- [ ] Toggle "Habilitar fulfillment"
- [ ] Checkboxes: DELIVERY, TAKEAWAY, DINE_IN
- [ ] Inputs: `delivery_fee`, `minimum_order`, `delivery_time_minutes`, `preparation_time_minutes`
- [ ] Textareas: `title`, `description`, `note`

**Guardado:**
```typescript
await updateCompany(companyId, {
  fulfillment_config: fulfillmentConfig,
  // Mantener compatibilidad
  delivery_enabled: fulfillmentConfig.enabled && fulfillmentConfig.modes.includes('DELIVERY'),
});
```

**Archivos:**
- [ ] Modificar `src/pages/dashboard/products/ProductsSettings.tsx`

---

### FASE 5: i18n (Traducciones)

#### 5.1 Archivos de traducción

**`public/locales/es/translation.json`:**
```json
{
  "publicPage": {
    "restaurantsLayout": {
      "searchPlaceholder": "Buscar productos...",
      "loadMore": "Cargar más productos",
      "noMoreProducts": "No hay más productos",
      "fulfillment": {
        "delivery": "Delivery",
        "takeaway": "Retiro en local",
        "dineIn": "Consumo en local",
        "deliveryFee": "Costo de delivery: ${{fee}}",
        "minimumOrder": "Pedido mínimo: ${{amount}}",
        "selectMode": "Selecciona método de entrega",
        "deliveryAddress": "Dirección de entrega",
        "deliveryAddressPlaceholder": "Ingresa tu dirección",
        "minimumOrderError": "El pedido mínimo es ${{amount}}"
      }
    }
  }
}
```

**`public/locales/en/translation.json`:**
- [ ] Traducciones equivalentes en inglés

**Archivos:**
- [ ] Modificar `public/locales/es/translation.json`
- [ ] Modificar `public/locales/en/translation.json`

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend/Tipos:
- [ ] `src/types/index.ts`: Agregar `fulfillment_config` a `Company`
- [ ] `src/utils/productSearch.ts`: Crear archivo con `buildSearchText` y `filterProductsBySearch`

### Layout Público:
- [ ] `src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`:
  - [ ] Estado búsqueda (`searchTerm`, `debouncedSearchTerm`)
  - [ ] Estado paginación (`currentPage`, `ITEMS_PER_PAGE`)
  - [ ] Filtrado productos (búsqueda + categoría)
  - [ ] Paginación productos
  - [ ] UI barra de búsqueda
  - [ ] UI botón "Cargar más"
  - [ ] Helper `getFulfillmentConfig` (preparar para pasar a CartModal)

### Cart Modal:
- [ ] `src/pages/public/components/CartModal.tsx`:
  - [ ] Props `fulfillmentConfig`
  - [ ] UI selección modo (DELIVERY/TAKEAWAY/DINE_IN)
  - [ ] Campo dirección (si DELIVERY)
  - [ ] Validación pedido mínimo
  - [ ] Cálculo fee delivery
  - [ ] Actualizar `orderForm.delivery_type`

- [ ] `src/pages/public/PublicPage.tsx`:
  - [ ] Pasar `fulfillmentConfig` a `CartModal`
  - [ ] Helper `getFulfillmentConfig` (si no está en layout)

### Dashboard:
- [ ] `src/pages/dashboard/products/ProductsSettings.tsx`:
  - [ ] Estado `fulfillmentConfig`
  - [ ] UI configuración fulfillment
  - [ ] Guardar `fulfillment_config` en `updateCompany`

### i18n:
- [ ] `public/locales/es/translation.json`: Agregar traducciones
- [ ] `public/locales/en/translation.json`: Agregar traducciones

---

## ⚠️ RIESGOS Y MITIGACIÓN

### 🔴 Riesgo 1: Compatibilidad con `delivery_enabled`
**Problema:** Empresas existentes tienen `delivery_enabled: boolean`, no `fulfillment_config`.  
**Mitigación:**
- ✅ Leer `fulfillment_config` primero, fallback a `delivery_enabled`
- ✅ Dashboard permite migrar a nuevo formato
- ✅ No forzar migración inmediata

### 🟡 Riesgo 2: Performance con muchos productos
**Problema:** Paginación cliente carga todos los productos en memoria.  
**Mitigación:**
- ✅ Paginación cliente es aceptable para < 500 productos
- ✅ Si hay > 500 productos, considerar paginación Firestore (futuro)
- ✅ Debounce en búsqueda (300ms) previene re-renders excesivos

### 🟢 Riesgo 3: Búsqueda case-sensitive
**Problema:** Usuario busca "Pizza" pero producto es "pizza".  
**Mitigación:**
- ✅ `buildSearchText` convierte a lowercase
- ✅ Búsqueda normalizada antes de comparar

### 🟢 Riesgo 4: Cambios breaking en otros layouts
**Problema:** Cambios en tipos o servicios pueden romper otras categorías.  
**Mitigación:**
- ✅ `fulfillment_config` es opcional
- ✅ `getProducts()` se mantiene sin cambios
- ✅ Layout es específico de restaurantes (no compartido)

---

## ✅ CHECKLIST DE ACEPTACIÓN

### Funcionalidad:

#### Búsqueda:
- [ ] Barra de búsqueda visible en layout restaurantes
- [ ] Búsqueda funciona en nombre, descripción, tags
- [ ] Debounce de 300ms funciona
- [ ] Búsqueda case-insensitive
- [ ] Búsqueda actualiza resultados en tiempo real
- [ ] Búsqueda vacía muestra todos los productos
- [ ] Búsqueda funciona con categorías activas

#### Paginación:
- [ ] Paginación muestra 24 productos por página
- [ ] Botón "Cargar más" funciona
- [ ] "No hay más productos" cuando termina
- [ ] Paginación funciona con búsqueda activa
- [ ] Paginación funciona con categoría activa
- [ ] Resetear página al cambiar categoría/búsqueda

#### Delivery/Takeaway:
- [ ] `fulfillment_config` se guarda en `companies/{id}`
- [ ] Dashboard permite configurar fulfillment
- [ ] CartModal muestra selección de modo (DELIVERY/TAKEAWAY/DINE_IN)
- [ ] Validación de pedido mínimo funciona
- [ ] Cálculo de fee delivery funciona
- [ ] Compatibilidad con `delivery_enabled` (fallback)
- [ ] `order_type` se guarda correctamente en `productOrderRequests`

### Calidad:

#### Multi-Tenancy:
- [ ] Todas las queries filtran por `company_id`
- [ ] No hay leak de datos entre empresas
- [ ] Carrito no persiste entre empresas (correcto)

#### i18n:
- [ ] Todas las strings están traducidas (es, en)
- [ ] No hay strings hardcodeadas
- [ ] Traducciones cargan correctamente

#### Performance:
- [ ] Carga inicial < 3s
- [ ] Búsqueda no bloquea UI (debounce)
- [ ] Paginación funciona fluidamente

#### Compatibilidad:
- [ ] Layout funciona sin `fulfillment_config` (fallback)
- [ ] No rompe otras categorías
- [ ] No rompe `PublicMenu.tsx`

#### Testing:
- [ ] Probar con 0 productos
- [ ] Probar con 10 productos
- [ ] Probar con 100+ productos
- [ ] Probar con búsqueda sin resultados
- [ ] Probar con categorías vacías
- [ ] Probar en mobile (responsive)
- [ ] Probar en desktop
- [ ] Probar con fulfillment deshabilitado
- [ ] Probar con fulfillment habilitado (todos los modos)

---

## 📝 ESTRATEGIA DE IMPLEMENTACIÓN

### Orden Recomendado:
1. **FASE 1:** Tipos y utilidades (backend)
2. **FASE 5:** i18n (para tener strings listas)
3. **FASE 2:** Búsqueda (más simple, impacto inmediato)
4. **FASE 3:** Paginación (complementa búsqueda)
5. **FASE 4:** Fulfillment (más complejo, requiere dashboard + modal)

### Testing Incremental:
- Probar cada fase antes de continuar
- Verificar que no rompe funcionalidad existente
- Probar en desarrollo local antes de deploy

---

**Estado:** 📋 Plan listo para implementación  
**Próxima acción:** Aprobar plan → Iniciar FASE 1
