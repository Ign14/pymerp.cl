# 🎯 Plan de Implementación - Restaurantes y Comida Rápida
## Features Críticas: Búsqueda, Delivery/Takeaway, Paginación

**Fecha:** ${new Date().toISOString().split('T')[0]}  
**Objetivo:** Cerrar categoría restaurantes implementando 3 features críticas manteniendo estabilidad, multi-tenancy e i18n.

---

## 📋 DIAGNÓSTICO TÉCNICO

### 1. Rutas Públicas Implicadas

#### Rutas Principales:
- **`/:slug`** → `PublicPage` → Usa `RestaurantesComidaRapidaPublicLayout` si `category_id === 'restaurantes_comida_rapida'`
- **`/:companyId/menu`** → `PublicMenu` (página standalone de menú, menos usado)
- **QR Menu:** `/menu` (ruta relativa desde PublicPage)

#### Flujo Actual:
```
/:slug (PublicPage)
  └─> loadData(slug)
      └─> getCompanyBySlug(slug)
      └─> getProducts(companyId) // SIN paginación
      └─> getMenuCategories(companyId)
      └─> getCompanyAppearance(companyId, BusinessType.PRODUCTS)
  └─> Renderiza RestaurantesComidaRapidaPublicLayout
      └─> products[] (todos en memoria)
      └─> cart (estado local, NO localStorage)
      └─> WhatsApp integration
```

### 2. Componentes y Páginas Involucradas

#### Componentes Principales:
- **`src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`**
  - Layout específico para restaurantes
  - Muestra productos por categoría
  - Carrito flotante
  - Navegación sticky de categorías
  - **NO tiene búsqueda ni paginación**

- **`src/pages/public/PublicPage.tsx`**
  - Orquesta carga de datos
  - Maneja estado del carrito (useState)
  - Maneja orden/checkout (createProductOrderRequest)
  - Pasa props a layout específico

- **`src/pages/public/components/CartModal.tsx`**
  - Modal de carrito
  - Formulario de orden (orderForm)
  - Soporta `deliveryEnabled` (boolean)
  - **NO soporta fulfillment_config completo**

#### Componente de Referencia:
- **`src/components/public/layouts/MinimarketPublicLayout.tsx`**
  - ✅ Tiene búsqueda (useDebounce, buildSearchText)
  - ✅ Tiene paginación (ITEMS_PER_PAGE = 24, currentPage)
  - ✅ Tiene filtros (tags, categorías)
  - ✅ Tiene fulfillment_config (delivery/pickup)
  - ✅ Sorting (relevance, priceAsc, priceDesc)

### 3. Servicios Actuales

#### Productos (`src/services/firestore.ts`):
```typescript
// ACTUAL: Query simple, sin paginación
export const getProducts = async (companyId: string): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'), 
    where('company_id', '==', companyId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
};
```

**Problemas:**
- ❌ Carga TODOS los productos de una vez
- ❌ Sin paginación (startAfter/limit)
- ❌ Sin filtros (status, menuCategoryId)
- ❌ Sin ordenamiento (orderBy)
- ❌ Sin índices compuestos definidos

#### Menú (`src/services/menu.ts`):
```typescript
export const getMenuCategories = async (companyId: string): Promise<MenuCategory[]> => {
  const q = query(
    collection(db, 'menu_categories'), 
    where('company_id', '==', companyId)
  );
  // Sin orderBy, se ordena en cliente
};
```

#### Carrito y WhatsApp:
- Carrito: Estado local (useState) en PublicPage, NO localStorage
- WhatsApp: `handleSubmitOrder` → `createProductOrderRequest` → mensaje WhatsApp
- **NO hay backend de checkout**, solo creación de request y WhatsApp

### 4. Diferencias con Minimarket (Referencia)

| Feature | Minimarket | Restaurantes (Actual) |
|---------|-----------|----------------------|
| Búsqueda | ✅ useDebounce + buildSearchText | ❌ No existe |
| Paginación | ✅ 24 items/página, currentPage | ❌ Todos en memoria |
| Filtros | ✅ Tags, categorías, disponibilidad | ❌ Solo categorías (menú) |
| Fulfillment | ✅ fulfillment_config (DELIVERY/PICKUP) | ❌ Solo delivery_enabled (boolean) |
| Sorting | ✅ relevance, priceAsc, priceDesc | ❌ Solo menuOrder (cliente) |
| Queries Firestore | ❌ También carga todo | ❌ Carga todo |

### 5. Estructura Firestore Actual

#### Colección `products/{id}`:
```typescript
{
  id: string;
  company_id: string; // ✅ Multi-tenant
  name: string;
  description: string;
  price: number;
  image_url: string;
  tags?: string[]; // ✅ Existe pero poco usado
  menuCategoryId?: string; // ✅ Para restaurantes
  menuOrder?: number; // ✅ Ordenamiento
  status: 'ACTIVE' | 'INACTIVE';
  isAvailable?: boolean;
  stock?: number; // Para inventario
  hide_price?: boolean;
  weight?: number;
  kcal?: number;
}
```

#### Colección `companies/{id}`:
```typescript
{
  id: string;
  company_id: string;
  delivery_enabled?: boolean; // ✅ Existe (boolean simple)
  // ❌ fulfillment_config NO existe (Minimarket lo usa pero es any)
  weekday_days?: string[];
  weekday_open_time?: string;
  weekday_close_time?: string;
  // ...
}
```

#### Colección `menu_categories/{id}`:
```typescript
{
  id: string;
  company_id: string;
  name: string;
  order?: number;
  active?: boolean;
}
```

#### Colección `productOrderRequests/{id}`:
```typescript
{
  id: string;
  company_id: string;
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  order_type?: 'TABLE' | 'PICKUP' | 'DELIVERY'; // ✅ Existe
  delivery_address?: string;
  status?: 'REQUESTED' | 'CONFIRMED' | ...;
  created_at: Timestamp;
}
```

### 6. Multi-Tenancy y Resolución de company_id

#### Resolución de Tenant:
```typescript
// PublicPage.tsx
const { slug } = useParams();
const companyData = await getCompanyBySlug(slug);
const companyId = companyData.id;

// Todas las queries usan companyId:
getProducts(companyId);
getMenuCategories(companyId);
getCompanyAppearance(companyId, BusinessType.PRODUCTS);
```

#### Resolución de Categoría (Layout):
```typescript
// PublicPage.tsx
const categoryId = resolveCategoryId(company); // 'restaurantes_comida_rapida'
const layoutKey = getLayoutKey(categoryId, variant); // 'restaurantesComidaRapidaShowcase'
```

#### Validación Multi-Tenant:
- ✅ Queries Firestore filtran por `company_id`
- ✅ Security rules validan `company_id` (firestore.rules)
- ⚠️ **NO hay validación explícita en servicios** (solo en rules)
- ⚠️ **NO hay assertCompanyScope en getProducts** (sí existe en menu.ts)

---

## 🏗️ PLAN DE IMPLEMENTACIÓN

### FASE 1: Arquitectura de Datos

#### 1.1 Campos a Agregar

##### En `Company` (`src/types/index.ts`):
```typescript
interface Company {
  // ... campos existentes
  delivery_enabled?: boolean; // ✅ Ya existe
  
  // ✅ NUEVO: Reemplazar delivery_enabled con fulfillment_config
  fulfillment_config?: {
    enabled?: boolean; // Si está habilitado fulfillment
    modes?: Array<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>; // Métodos disponibles
    delivery_fee?: number; // Costo de delivery (opcional)
    minimum_order?: number; // Pedido mínimo (opcional)
    delivery_time_minutes?: number; // Tiempo estimado delivery
    preparation_time_minutes?: number; // Tiempo estimado preparación
    title?: string; // Título personalizado (opcional)
    description?: string; // Descripción (opcional)
    note?: string; // Nota adicional (opcional)
  };
}
```

**Migración:**
- Si `delivery_enabled === true` → `fulfillment_config.enabled = true, modes = ['DELIVERY', 'TAKEAWAY']`
- Mantener compatibilidad: `delivery_enabled` como fallback si `fulfillment_config` no existe

##### En `Product` (NO requiere cambios):
- ✅ Campos suficientes para búsqueda: `name`, `description`, `tags`
- ✅ Campos suficientes para filtrado: `status`, `menuCategoryId`, `isAvailable`

#### 1.2 Índices Firestore Requeridos

##### Índice para Paginación de Productos:
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

**Archivo:** `firestore.indexes.json`

**Uso:** Query con `where('company_id', '==', companyId)`, `where('status', '==', 'ACTIVE')`, `orderBy('menuOrder')`, `limit(24)`, `startAfter(lastDoc)`

##### Índice para Búsqueda por Categoría (Opcional):
```json
{
  "collectionGroup": "products",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "company_id", "order": "ASCENDING" },
    { "fieldPath": "menuCategoryId", "order": "ASCENDING" },
    { "fieldPath": "menuOrder", "order": "ASCENDING" }
  ]
}
```

**Nota:** Búsqueda de texto es en cliente (buildSearchText), no requiere índice Firestore.

### FASE 2: Servicios (Backend Layer)

#### 2.1 Nuevo Servicio: `getProductsPaginated`

**Archivo:** `src/services/firestore.ts`

```typescript
export interface GetProductsOptions {
  companyId: string;
  limit?: number; // Default: 24
  startAfter?: any; // DocumentSnapshot para paginación
  menuCategoryId?: string; // Filtro por categoría (opcional)
  status?: 'ACTIVE' | 'INACTIVE'; // Default: 'ACTIVE'
  orderBy?: 'menuOrder' | 'price' | 'name'; // Default: 'menuOrder'
  orderDirection?: 'asc' | 'desc'; // Default: 'asc'
}

export interface GetProductsResult {
  products: Product[];
  lastDoc: any | null; // Para startAfter en siguiente página
  hasMore: boolean; // Si hay más páginas
  total?: number; // Opcional: total de documentos (requiere count query separado)
}

export const getProductsPaginated = async (
  options: GetProductsOptions
): Promise<GetProductsResult> => {
  const {
    companyId,
    limit = 24,
    startAfter,
    menuCategoryId,
    status = 'ACTIVE',
    orderBy: orderByField = 'menuOrder',
    orderDirection = 'asc',
  } = options;

  let q = query(
    collection(db, 'products'),
    where('company_id', '==', companyId),
    where('status', '==', status)
  );

  if (menuCategoryId) {
    q = query(q, where('menuCategoryId', '==', menuCategoryId));
  }

  q = query(q, orderBy(orderByField, orderDirection));
  q = query(q, limit(limit + 1)); // +1 para detectar hasMore

  if (startAfter) {
    q = query(q, startAt(startAfter));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const hasMore = docs.length > limit;
  const products = (hasMore ? docs.slice(0, limit) : docs).map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  return {
    products,
    lastDoc: hasMore ? docs[limit - 1] : null,
    hasMore,
  };
};
```

**Compatibilidad:**
- ✅ Mantener `getProducts()` existente para compatibilidad
- ✅ Layout puede elegir: paginado o no paginado

#### 2.2 Helper: `buildSearchText` (Reutilizar de Minimarket)

**Archivo:** `src/utils/productSearch.ts` (NUEVO)

```typescript
import { Product } from '../types';

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

#### 2.3 Actualizar `updateCompany` para `fulfillment_config`

**Archivo:** `src/services/firestore.ts`

- ✅ Ya existe `updateCompany`
- ✅ Solo necesitamos pasar `fulfillment_config` en el objeto

### FASE 3: Componentes UI

#### 3.1 `RestaurantesComidaRapidaPublicLayout.tsx`

**Cambios Principales:**

1. **Estado de Búsqueda:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

2. **Estado de Paginación:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [lastDoc, setLastDoc] = useState<any | null>(null);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const ITEMS_PER_PAGE = 24;
```

3. **Filtrado y Búsqueda (Cliente):**
```typescript
// Si usa paginación Firestore: NO filtra en cliente (filtra en query)
// Si NO usa paginación: filtra en cliente (compatibilidad)
const filteredProducts = useMemo(() => {
  if (usePagination) {
    return products; // Ya vienen filtrados de Firestore
  }
  // Búsqueda en cliente (compatibilidad)
  return filterProductsBySearch(products, debouncedSearchTerm);
}, [products, debouncedSearchTerm, usePagination]);
```

4. **UI de Búsqueda:**
```tsx
{/* Barra de búsqueda antes del menú */}
<div className="mb-4">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder={t('publicPage.restaurantsLayout.searchPlaceholder')}
    className="w-full px-4 py-2 border rounded-lg"
  />
</div>
```

5. **UI de Paginación:**
```tsx
{/* Paginación al final */}
{hasMore && (
  <button
    onClick={loadMore}
    disabled={loadingMore}
    className="..."
  >
    {loadingMore ? t('common.loading') : t('publicPage.restaurantsLayout.loadMore')}
  </button>
)}
```

6. **Fulfillment Config:**
```typescript
const fulfillmentConfig = useMemo(() => {
  const raw = (company as any)?.fulfillment_config;
  if (!raw) {
    // Fallback a delivery_enabled (compatibilidad)
    if (company.delivery_enabled) {
      return {
        enabled: true,
        modes: ['DELIVERY', 'TAKEAWAY'],
      };
    }
    return { enabled: false, modes: [] };
  }
  return {
    enabled: raw.enabled ?? false,
    modes: raw.modes ?? [],
    delivery_fee: raw.delivery_fee,
    minimum_order: raw.minimum_order,
    // ...
  };
}, [company]);
```

#### 3.2 `PublicPage.tsx`

**Cambios:**

1. **Pasar fulfillment_config al layout:**
```typescript
// Ya pasa company, layout lee fulfillment_config
// NO requiere cambios si layout lee de company
```

2. **Carrito (NO cambiar):**
- ✅ Mantener estado local (useState)
- ✅ NO localStorage (correcto para multi-tenant)

#### 3.3 `CartModal.tsx`

**Cambios:**

1. **Soporte para fulfillment_config:**
```typescript
interface CartModalProps {
  // ... props existentes
  fulfillmentConfig?: {
    enabled: boolean;
    modes: Array<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>;
    delivery_fee?: number;
    minimum_order?: number;
    // ...
  };
}

// UI: Radio buttons o tabs para seleccionar modo
{fulfillmentConfig?.modes.includes('DELIVERY') && (
  <label>
    <input type="radio" value="DELIVERY" />
    Delivery {fulfillmentConfig.delivery_fee && `(+$${fulfillmentConfig.delivery_fee})`}
  </label>
)}
```

#### 3.4 `ProductsSettings.tsx` (Dashboard)

**Cambios:**

1. **Agregar sección de Fulfillment:**
```typescript
const [fulfillmentConfig, setFulfillmentConfig] = useState({
  enabled: false,
  modes: [] as Array<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>,
  delivery_fee: undefined as number | undefined,
  minimum_order: undefined as number | undefined,
  // ...
});

// En handleSubmit:
await updateCompany(companyId, {
  // ... campos existentes
  fulfillment_config: fulfillmentConfig,
  // Mantener delivery_enabled para compatibilidad
  delivery_enabled: fulfillmentConfig.enabled && fulfillmentConfig.modes.includes('DELIVERY'),
});
```

### FASE 4: i18n (Traducciones)

#### Archivos a Modificar:

1. **`public/locales/es/translation.json`** (y `en/translation.json`):
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
        "deliveryFee": "Costo de delivery: ${fee}",
        "minimumOrder": "Pedido mínimo: ${amount}"
      }
    }
  }
}
```

### FASE 5: Archivos a Modificar (Checklist)

#### Backend/Servicios:
- [ ] `src/services/firestore.ts`
  - [ ] Agregar `getProductsPaginated` (nuevo)
  - [ ] Mantener `getProducts` (compatibilidad)
- [ ] `src/utils/productSearch.ts` (NUEVO)
  - [ ] `buildSearchText`
  - [ ] `filterProductsBySearch`
- [ ] `firestore.indexes.json`
  - [ ] Agregar índice para paginación productos

#### Tipos:
- [ ] `src/types/index.ts`
  - [ ] Agregar `fulfillment_config` a `Company`
  - [ ] Exportar tipos de `GetProductsOptions`, `GetProductsResult`

#### Componentes Públicos:
- [ ] `src/components/public/layouts/RestaurantesComidaRapidaPublicLayout.tsx`
  - [ ] Estado búsqueda
  - [ ] Estado paginación
  - [ ] UI búsqueda
  - [ ] UI paginación
  - [ ] Integración fulfillment_config
  - [ ] Lógica carga paginada (opcional, puede empezar con cliente)
- [ ] `src/pages/public/components/CartModal.tsx`
  - [ ] Props fulfillment_config
  - [ ] UI selección modo (DELIVERY/TAKEAWAY/DINE_IN)
  - [ ] Validación mínimo pedido
  - [ ] Cálculo fee delivery

#### Dashboard:
- [ ] `src/pages/dashboard/products/ProductsSettings.tsx`
  - [ ] Estado fulfillment_config
  - [ ] UI configuración fulfillment
  - [ ] Guardar fulfillment_config

#### i18n:
- [ ] `public/locales/es/translation.json`
- [ ] `public/locales/en/translation.json`

#### Hooks (Opcional):
- [ ] `src/hooks/useDebounce.ts` (ya existe, verificar)

### FASE 6: Riesgos y Mitigación

#### 🔴 Riesgo 1: Índices Firestore No Creados
**Problema:** Query con `orderBy` + `where` múltiples requiere índice compuesto.  
**Síntoma:** Error en consola: "The query requires an index..."  
**Mitigación:**
1. ✅ Agregar índices a `firestore.indexes.json`
2. ✅ Desplegar índices: `firebase deploy --only firestore:indexes`
3. ✅ Esperar creación (puede tardar minutos)
4. ⚠️ **Fallback:** Si falla, usar ordenamiento en cliente (menos eficiente pero funcional)

#### 🟡 Riesgo 2: Performance con Muchos Productos
**Problema:** Si no usamos paginación Firestore, cargar todos los productos puede ser lento.  
**Mitigación:**
1. ✅ Implementar paginación Firestore (recomendado)
2. ⚠️ **Alternativa:** Paginación en cliente (carga todos, muestra 24 por página)
3. ✅ Debounce en búsqueda (300ms)
4. ✅ Lazy loading de imágenes

#### 🟡 Riesgo 3: Compatibilidad con `delivery_enabled`
**Problema:** Empresas existentes tienen `delivery_enabled: boolean`, no `fulfillment_config`.  
**Mitigación:**
1. ✅ Leer `fulfillment_config` primero, fallback a `delivery_enabled`
2. ✅ Migración gradual: no forzar actualización inmediata
3. ✅ Dashboard permite configurar nuevo formato

#### 🟢 Riesgo 4: Búsqueda en Cliente vs Servidor
**Decisión:** Búsqueda en cliente (filtrado después de cargar)  
**Razón:**
- ✅ Más simple (no requiere índices complejos)
- ✅ Funciona con paginación cliente
- ✅ Adecuado para < 1000 productos por empresa
- ⚠️ Si hay > 1000 productos, considerar búsqueda servidor (Algolia, etc.)

#### 🟢 Riesgo 5: Cambios Breaking en Layout
**Problema:** Cambios en `RestaurantesComidaRapidaPublicLayout` pueden romper otras categorías.  
**Mitigación:**
1. ✅ Layout es específico de restaurantes (no compartido)
2. ✅ Testing en desarrollo
3. ✅ Verificar que `PublicPage` sigue funcionando

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

#### Delivery/Takeaway:
- [ ] `fulfillment_config` se guarda en `companies/{id}`
- [ ] Dashboard permite configurar fulfillment
- [ ] Layout público muestra opciones (DELIVERY/TAKEAWAY/DINE_IN)
- [ ] CartModal muestra selección de modo
- [ ] Validación de pedido mínimo funciona
- [ ] Cálculo de fee delivery funciona
- [ ] Compatibilidad con `delivery_enabled` (fallback)
- [ ] `order_type` se guarda en `productOrderRequests`

#### Paginación:
- [ ] Paginación muestra 24 productos por página (o configurable)
- [ ] Botón "Cargar más" funciona
- [ ] Loading state durante carga
- [ ] "No hay más productos" cuando termina
- [ ] Paginación funciona con búsqueda activa
- [ ] Paginación funciona con categoría activa
- [ ] Índices Firestore desplegados (sin errores en consola)

### Calidad:

#### Multi-Tenancy:
- [ ] Todas las queries filtran por `company_id`
- [ ] No hay leak de datos entre empresas
- [ ] Security rules validan `company_id`
- [ ] Carrito no persiste entre empresas (correcto)

#### i18n:
- [ ] Todas las strings están traducidas (es, en)
- [ ] No hay strings hardcode
- [ ] Traducciones cargan correctamente

#### Performance:
- [ ] Carga inicial < 3s (con paginación)
- [ ] Búsqueda no bloquea UI (debounce)
- [ ] Paginación carga rápidamente (< 1s)
- [ ] No hay memory leaks (cleanup useEffect)

#### Compatibilidad:
- [ ] Layout sigue funcionando sin fulfillment_config (fallback)
- [ ] Layout sigue funcionando sin paginación (carga todos)
- [ ] No rompe otras categorías
- [ ] No rompe PublicMenu.tsx

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

## 📝 NOTAS FINALES

### Estrategia de Implementación:

1. **Fase Incremental:**
   - Paso 1: Búsqueda (solo cliente, sin cambios Firestore)
   - Paso 2: Paginación (cliente primero, luego Firestore si necesario)
   - Paso 3: Fulfillment (dashboard + layout + cart)

2. **Compatibilidad:**
   - Mantener `getProducts()` sin cambios (otros layouts lo usan)
   - Mantener `delivery_enabled` como fallback
   - Layout puede funcionar sin paginación (carga todos)

3. **Testing:**
   - Probar en desarrollo local
   - Probar con datos reales (empresas existentes)
   - Verificar índices Firestore antes de producción

### Próximos Pasos:

1. ✅ Revisar y aprobar plan
2. ⏳ Implementar FASE 1 (tipos, índices)
3. ⏳ Implementar FASE 2 (servicios)
4. ⏳ Implementar FASE 3 (componentes)
5. ⏳ Implementar FASE 4 (i18n)
6. ⏳ Testing completo
7. ⏳ Deploy a producción

---

**Estado:** 📋 Plan listo para implementación  
**Próxima acción:** Aprobar plan → Iniciar FASE 1
