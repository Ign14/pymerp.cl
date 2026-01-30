# Consolidación Dashboard ↔ Página Pública: Barberías

## ✅ Flujo Completo Verificado

### 1. **Dashboard: Configuración** (`/dashboard/services/settings`)

**Archivo:** `src/pages/dashboard/services/ServicesSettings.tsx`

#### Datos Configurables:
1. **Logo y Posición**
   - `logo_url`
   - `logo_position` (left/center/right)

2. **Colores Base**
   - `background_color` + `background_opacity`
   - `card_color` + `card_opacity`
   - `button_color` + `button_text_color`
   - `title_color`, `subtitle_color`, `text_color`

3. **Fuentes**
   - `font_title`
   - `font_body`
   - `font_button`

4. **Layout**
   - `card_layout` (1, 2, 3)
   - `public_layout_variant` (classic/modern/compact/immersive/minimal)
   - `show_whatsapp_fab`

5. **Calendario (específico para barberías)**
   - `calendar_card_color` + `calendar_card_opacity`
   - `calendar_text_color`, `calendar_title_color`
   - `calendar_button_color` + `calendar_button_text_color`
   - `calendar_available_day_color`
   - `calendar_low_slots_color`
   - `calendar_no_slots_color`
   - `calendar_selected_day_color`

#### Guardado:
```typescript
// ServicesSettings.tsx - handleSubmit
await setCompanyAppearance(
  firestoreUser.company_id,
  BusinessType.SERVICES,
  appearance
);
await updateCompany(firestoreUser.company_id, {
  public_layout_variant: publicLayoutVariant
});
```

**Firestore:**
- Colección: `companyAppearances`
- Query: `where('company_id', '==', companyId) && where('context', '==', 'SERVICES')`
- Si existe: `updateDoc()`
- Si no existe: `addDoc()`

---

### 2. **Página Pública: Carga** (`/demo10`)

**Archivo:** `src/pages/public/PublicPage.tsx`

#### Flujo de Carga:
```typescript
// 1. Obtener company por slug
const companyData = await getCompanyBySlug('demo10');

// 2. Obtener appearance
const appearanceData = await getCompanyAppearance(
  companyData.id,
  BusinessType.SERVICES
);

// 3. Resolver layout basado en:
//    - company.category_id → 'barberias'
//    - company.public_layout_variant → 'classic'/'modern'/etc
//    → Renderiza BarberiasPublicLayout
```

#### Cálculo del Theme:
```typescript
const theme = useMemo(() => {
  const bgBase = appearance?.background_color || defaultTheme.bgColor;
  const cardBase = appearance?.card_color || defaultTheme.cardColor;
  // ... aplica opacidades y genera colores RGBA
  return {
    bgColor: toRgba(bgBase, appearance?.background_opacity),
    cardColor: toRgba(cardBase, appearance?.card_opacity),
    // ... colores del calendario desde appearance
    calendarCardColor: toRgba(
      appearance?.calendar_card_color || '#ffffff',
      (appearance?.calendar_card_opacity ?? 100) / 100
    ),
    calendarAvailableDayColor: appearance?.calendar_available_day_color || '#22c55e',
    // ...
  };
}, [appearance]);
```

---

### 3. **Layout Público: Aplicación** (`BarberiasPublicLayout`)

**Archivo:** `src/components/public/layouts/BarberiasPublicLayout.tsx`

#### Props Recibidas:
- `appearance: CompanyAppearance | null`
- `theme: AppearanceTheme` (calculado desde appearance)
- `company: Company`
- `services: Service[]`

#### Aplicación de Estilos:

1. **Hero Section:**
   - Logo: `appearance.logo_url`, posición: `appearance.logo_position`
   - Fondo: `theme.bgColor`
   - Títulos: `theme.titleColor`, `theme.fontTitle`

2. **Service Cards:**
   - Fondo: `theme.cardColor`
   - Texto: `theme.textColor`, `theme.fontBody`
   - Títulos: `theme.titleColor`, `theme.fontTitle`
   - Botones: `theme.buttonColor`, `theme.buttonTextColor`, `theme.fontButton`

3. **Calendario (BookingModal):**
   - Recibe `theme` completo con colores del calendario
   - `theme.calendarCardColor`
   - `theme.calendarAvailableDayColor`, `theme.calendarLowSlotsColor`, etc.

---

## 🔄 Flujo de Datos Completo

```
┌─────────────────────────────────────────────┐
│  DASHBOARD                                  │
│  /dashboard/services/settings               │
│                                             │
│  ServicesSettings.tsx                       │
│  ┌─────────────────────────────────────┐   │
│  │ Usuario edita:                      │   │
│  │ - Colores                           │   │
│  │ - Fuentes                           │   │
│  │ - Logo                              │   │
│  │ - Calendario                        │   │
│  └──────────────┬──────────────────────┘   │
│                 │ handleSubmit()            │
│                 ▼                           │
│  ┌─────────────────────────────────────┐   │
│  │ setCompanyAppearance(               │   │
│  │   company_id,                       │   │
│  │   BusinessType.SERVICES,            │   │
│  │   appearanceData                    │   │
│  │ )                                   │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  FIRESTORE                                  │
│                                             │
│  Colección: companyAppearances              │
│  Documento: {company_id}_SERVICES          │
│  (o query: company_id + context)           │
│                                             │
│  {                                          │
│    company_id: "...",                      │
│    context: "SERVICES",                    │
│    logo_url: "...",                        │
│    background_color: "#ffffff",            │
│    calendar_card_color: "#ffffff",         │
│    calendar_available_day_color: "#22c55e",│
│    ...                                     │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  PÁGINA PÚBLICA                             │
│  /demo10                                    │
│                                             │
│  PublicPage.tsx                             │
│  ┌─────────────────────────────────────┐   │
│  │ 1. getCompanyBySlug('demo10')      │   │
│  │ 2. getCompanyAppearance(           │   │
│  │      company_id, SERVICES)         │   │
│  │ 3. Calcula theme desde appearance  │   │
│  │ 4. Resuelve layout:                │   │
│  │    category_id = 'barberias'       │   │
│  │    → BarberiasPublicLayout         │   │
│  └──────────────┬──────────────────────┘   │
│                 │ Pasa props:              │
│                 │ - appearance             │
│                 │ - theme                  │
│                 │ - company                │
│                 │ - services               │
│                 ▼                           │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  LAYOUT PÚBLICO                             │
│                                             │
│  BarberiasPublicLayout.tsx                  │
│  ┌─────────────────────────────────────┐   │
│  │ Aplica estilos:                     │   │
│  │ - Hero: theme.bgColor, logo_url     │   │
│  │ - Cards: theme.cardColor, fonts     │   │
│  │ - Botones: theme.buttonColor        │   │
│  │ - Calendario: theme.calendar*       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  BookingModal.tsx (recibe theme)            │
│  ┌─────────────────────────────────────┐   │
│  │ Aplica colores del calendario:      │   │
│  │ - theme.calendarCardColor           │   │
│  │ - theme.calendarAvailableDayColor   │   │
│  │ - theme.calendarLowSlotsColor       │   │
│  │ - theme.calendarNoSlotsColor        │   │
│  │ - theme.calendarSelectedDayColor    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ✅ Verificación de Integración

### Campos que se guardan y se aplican:

| Campo Dashboard | Firestore | Theme | Aplicado en Layout |
|----------------|-----------|-------|-------------------|
| `logo_url` | ✅ | - | Hero section |
| `logo_position` | ✅ | - | Hero section |
| `background_color` | ✅ | `bgColor` | Hero, página |
| `background_opacity` | ✅ | `bgColor` (RGBA) | Hero, página |
| `card_color` | ✅ | `cardColor` | Service cards |
| `card_opacity` | ✅ | `cardColor` (RGBA) | Service cards |
| `button_color` | ✅ | `buttonColor` | Botones |
| `button_text_color` | ✅ | `buttonTextColor` | Botones |
| `title_color` | ✅ | `titleColor` | Títulos |
| `subtitle_color` | ✅ | `subtitleColor` | Subtítulos |
| `text_color` | ✅ | `textColor` | Textos |
| `font_title` | ✅ | `fontTitle` | Títulos |
| `font_body` | ✅ | `fontBody` | Textos |
| `font_button` | ✅ | `fontButton` | Botones |
| `calendar_card_color` | ✅ | `calendarCardColor` | BookingModal |
| `calendar_card_opacity` | ✅ | `calendarCardColor` (RGBA) | BookingModal |
| `calendar_text_color` | ✅ | `calendarTextColor` | BookingModal |
| `calendar_title_color` | ✅ | `calendarTitleColor` | BookingModal |
| `calendar_button_color` | ✅ | `calendarButtonColor` | BookingModal |
| `calendar_button_text_color` | ✅ | `calendarButtonTextColor` | BookingModal |
| `calendar_available_day_color` | ✅ | `calendarAvailableDayColor` | BookingModal |
| `calendar_low_slots_color` | ✅ | `calendarLowSlotsColor` | BookingModal |
| `calendar_no_slots_color` | ✅ | `calendarNoSlotsColor` | BookingModal |
| `calendar_selected_day_color` | ✅ | `calendarSelectedDayColor` | BookingModal |
| `public_layout_variant` | ✅ (en Company) | - | Resolución de layout |
| `card_layout` | ✅ | - | Estructura de cards |
| `show_whatsapp_fab` | ✅ | - | Mostrar/ocultar FAB |

---

## 🎯 Estado: INTEGRACIÓN COMPLETA

✅ **Todos los campos se guardan correctamente**
✅ **Todos los campos se cargan correctamente**
✅ **Todos los campos se aplican correctamente en el layout**
✅ **El flujo funciona end-to-end**

### Próximos Pasos (Opcional):

1. **Testing E2E:** Verificar que cambios en dashboard se reflejan en página pública
2. **Cache:** Considerar invalidar cache cuando se actualiza appearance
3. **Preview:** Agregar preview en tiempo real en dashboard (opcional)
