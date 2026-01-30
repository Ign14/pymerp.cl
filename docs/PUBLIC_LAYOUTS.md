# Public Layouts - Guía de Referencia

## Resumen

El sistema de layouts públicos permite que cada empresa tenga una página pública personalizada basada en su categoría y variante de diseño. El layout se resuelve automáticamente usando `category_id` y `public_layout_variant`, **nunca** depende del `slug`.

## Resolver de Layouts

### Función Principal

```typescript
resolvePublicLayout(company: Company | null | undefined): ResolvedPublicLayout
```

**Ubicación:** `src/services/publicPage.ts`

### Lógica de Resolución

1. **Fallback robusto**: Si `company` es `null` o `undefined`, retorna `{ key: 'default', variant: 'classic' }`
2. **Resolución de category_id**: Usa `resolveCategoryId(company)` de forma segura con try/catch
3. **Variant override**: Prioridad:
   - `company.public_layout_variant` (si es válido)
   - `CATEGORY_VARIANT_MAP[categoryId]` (variant por defecto de la categoría)
   - `'classic'` (fallback final)
4. **Layout key**: Prioridad:
   - `company.public_layout_key` (override explícito)
   - `CATEGORY_PUBLIC_LAYOUT_MAP[categoryId]` (layout por categoría)
   - `business_type === PRODUCTS ? 'productsShowcase' : 'default'` (fallback por tipo de negocio)

### Validaciones

- **Variant inválido**: Si el variant no está en `['classic', 'modern', 'compact', 'immersive', 'minimal']`, se usa fallback
- **Variant vacío/null**: Se trata como no configurado y se usa el variant de la categoría
- **Category_id inválido**: Se usa fallback por `business_type` o `'default'`

## Variants Disponibles

| Variant | Descripción | Uso Recomendado |
|---------|-------------|-----------------|
| `classic` | Equilibrado, tradicional | Restaurantes, productos generales |
| `modern` | Vitrina con brillo, CTAs destacados | Barberías, belleza, servicios modernos |
| `compact` | Contenido concentrado | Propiedades, catálogos densos |
| `immersive` | Legacy, experiencia inmersiva | Eventos, turismo |
| `minimal` | Legacy, diseño minimalista | Profesionales independientes |

## Layouts por Categoría

### Mapeo de Categorías a Layouts

```typescript
const CATEGORY_PUBLIC_LAYOUT_MAP = {
  barberias: 'barberiasShowcase',
  restaurantes_comida_rapida: 'restaurantesComidaRapidaShowcase',
  minimarket: 'minimarketShowcase',
  productos_cuidado_personal: 'productosCuidadoPersonalShowcase',
  inmobiliaria_terrenos_casas: 'inmobiliariaTerrenosCasasShowcase',
  construccion: 'construccionShowcase',
  actividad_entrenamiento_fisico: 'actividadEntrenamientoFisicoShowcase',
  agenda_profesionales_independientes: 'agendaProfesionalesIndependientesShowcase',
  // ... más categorías
};
```

### Variants por Defecto por Categoría

```typescript
const CATEGORY_VARIANT_MAP = {
  barberias: 'modern',
  restaurantes_comida_rapida: 'classic',
  arriendo_cabanas_casas: 'compact',
  actividad_entrenamiento_fisico: 'modern',
  // ... más categorías
};
```

## Módulos por Categoría

Los layouts pueden activar módulos específicos según la categoría:

- `menu-categories`: Categorías de menú (restaurantes)
- `menu-qr`: QR del menú (restaurantes)
- `professionals`: Profesionales (barberías, servicios)
- `schedule`: Horarios (servicios)
- `inventory`: Inventario (minimarket, productos)
- `work-orders-lite`: Órdenes de trabajo ligeras (construcción)
- `appointments-lite`: Citas ligeras (profesionales independientes)

**Verificación:** `isModuleEnabled(categoryId, moduleName)`

## Fallbacks

### Jerarquía de Fallbacks

1. **Company override** → `public_layout_key` o `public_layout_variant`
2. **Category layout** → `CATEGORY_PUBLIC_LAYOUT_MAP[categoryId]`
3. **Business type** → `business_type === PRODUCTS ? 'productsShowcase' : 'default'`
4. **Default final** → `{ key: 'default', variant: 'classic' }`

### Casos Edge

- **Company null**: `{ key: 'default', variant: 'classic', source: 'fallback' }`
- **Category_id null**: Usa `business_type` como fallback
- **Category_id inválido**: Usa `'default'` layout
- **Variant inválido**: Usa variant de categoría o `'classic'`
- **Error en resolución**: Try/catch retorna default sin crash

## Independencia del Slug

**IMPORTANTE**: El layout **nunca** depende del `slug`. El slug solo se usa para:
- Resolver la `company` desde Firestore
- Generar la URL pública

El layout se determina exclusivamente por:
- `company.category_id`
- `company.public_layout_variant`
- `company.business_type`

## Configuración en Dashboard

### Ubicación

- **Servicios**: `src/pages/dashboard/services/ServicesSettings.tsx`
- **Productos**: `src/pages/dashboard/products/ProductsSettings.tsx`

### Selector

```tsx
<select
  value={publicLayoutVariant}
  onChange={(e) => {
    const newVariant = e.target.value as PublicLayoutVariantChoice;
    if (PUBLIC_LAYOUT_VARIANTS.includes(newVariant)) {
      setPublicLayoutVariant(newVariant);
    } else {
      setPublicLayoutVariant('classic'); // Fallback
    }
  }}
>
  {PUBLIC_LAYOUT_VARIANTS.map((variant) => (
    <option key={variant} value={variant}>
      {t(`dashboard.appearance.publicLayoutVariant.options.${variant}`)}
    </option>
  ))}
</select>
```

### Guardado

```typescript
await updateCompany(companyId, {
  public_layout_variant: publicLayoutVariant || 'classic',
});
```

## Tests

**Ubicación:** `src/services/__tests__/publicPage.test.ts`

**Cobertura:**
- ✅ Independencia del slug
- ✅ Variants inválidos/vacíos
- ✅ Fallbacks robustos
- ✅ Consistencia: mismo `category_id` + mismo `variant` = mismo layout

## Referencias

- **Resolver**: `src/services/publicPage.ts`
- **Layouts**: `src/components/public/layouts/`
- **Registry**: `src/pages/public/layouts/layoutRegistry.tsx`
- **Categorías**: `src/config/categories.ts`

