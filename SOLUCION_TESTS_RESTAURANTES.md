# Solución para Tests de Restaurantes

## Problema Identificado

Los tests de restaurantes fallaban porque:
1. La ruta `/productos-demo` apuntaba a `PublicProductsStub` (stub simplificado)
2. Los tests esperaban funcionalidades completas (búsqueda, paginación, fulfillment)
3. Los mocks no tenían datos completos para restaurantes

## Solución Implementada

### 1. Actualización de Mocks (`e2e/fixtures/mockFirebase.ts`)

✅ **Completado:**
- Actualizado `company-products` con:
  - `category_id: 'restaurantes_comida_rapida'`
  - `public_layout_variant: 'restaurants'`
  - `fulfillment_config` completo (DELIVERY, TAKEAWAY, fees, minimum_order)
- Agregado `companyAppearances` para la empresa

⏳ **Pendiente:**
- Agregar múltiples productos (25+) para paginación
- Agregar `menu_categories` (colección `menu_categories` en Firestore)

### 2. Ruta `/productos-demo`

✅ **Completado:**
- Comentada la ruta específica `/productos-demo` que usaba `PublicProductsStub`
- Ahora `/productos-demo` usa `PublicPage` a través de la ruta dinámica `/:slug`

### 3. Próximos Pasos

Para completar la solución, necesitas:

1. **Agregar productos mockados múltiples** en `e2e/fixtures/mockFirebase.ts`:
   - Al menos 25 productos para probar paginación
   - Variedad de nombres, precios, categorías

2. **Agregar `menu_categories` mockados**:
   - Colección: `menu_categories` (con guión bajo)
   - Al menos 4 categorías (Entradas, Platos Principales, Postres, Bebidas)

3. **Verificar que los tests funcionen**:
   ```bash
   npx playwright test restaurantes
   ```

## Notas Técnicas

- La colección de categorías de menú se llama `menu_categories` (con guión bajo) en Firestore
- Los mocks deben usar el mismo nombre de colección que Firestore
- `getCompanyBySlug` busca en la colección `companies` con `where('slug', '==', slug)`
- Los mocks ya tienen soporte para queries con `handleRunQuery`
