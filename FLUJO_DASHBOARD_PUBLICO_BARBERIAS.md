# Flujo Dashboard → Página Pública: Barberías

## 📋 Flujo Completo de Datos

### 1. **Dashboard: Configuración** (`/dashboard/services/settings`)

**Archivo:** `src/pages/dashboard/services/ServicesSettings.tsx`

#### Datos que se configuran:
- **Logo**: URL y posición (left/center/right)
- **Colores**:
  - Fondo (`background_color`, `background_opacity`)
  - Tarjetas (`card_color`, `card_opacity`)
  - Botones (`button_color`, `button_text_color`)
  - Textos (`title_color`, `subtitle_color`, `text_color`)
- **Fuentes**: Títulos, cuerpo, botones
- **Layout**: Variante pública (`public_layout_variant`)
- **Calendario** (específico para barberías):
  - `calendar_card_color`, `calendar_card_opacity`
  - `calendar_text_color`, `calendar_title_color`
  - `calendar_button_color`, `calendar_button_text_color`
  - `calendar_available_day_color`, `calendar_low_slots_color`
  - `calendar_no_slots_color`, `calendar_selected_day_color`
- **Otros**: `card_layout`, `show_whatsapp_fab`

#### Cómo se guarda:
```typescript
// ServicesSettings.tsx - handleSubmit
await setCompanyAppearance(
  firestoreUser.company_id,
  BusinessType.SERVICES,
  appearanceData
);
await updateCompany(firestoreUser.company_id, {
  public_layout_variant: publicLayoutVariant
});
```

#### Estructura en Firestore:
- **Colección:** `company_appearances`
- **Documento ID:** `{company_id}_{context}` (ej: `{company_id}_SERVICES`)
- **Campos:** Todos los campos de `CompanyAppearance`

---

### 2. **Página Pública: Carga de Datos** (`/demo10`)

**Archivo:** `src/pages/public/PublicPage.tsx`

#### Cómo se carga:
```typescript
// PublicPage.tsx - loadData
const companyData = await getCompanyBySlug('demo10');
const appearanceData = await getCompanyAppearance(
  companyData.id,
  BusinessType.SERVICES
);
```

#### Resolución del layout:
1. `company.category_id` → determina categoría (ej: `'barberias'`)
2. `company.public_layout_variant` → determina variante del layout
3. Se carga el layout correspondiente: `BarberiasPublicLayout`

---

### 3. **Layout Público: Aplicación** (`BarberiasPublicLayout`)

**Archivo:** `src/components/public/layouts/BarberiasPublicLayout.tsx`

#### Cómo se aplican los datos:
- `appearance` → se pasa como prop desde `PublicPage`
- `theme` → se calcula desde `appearance` con fallbacks a `defaultTheme`
- Se aplica en:
  - Hero section (logo, colores)
  - Cards de servicios (colores, fuentes)
  - Calendario (colores específicos del calendario)
  - Botones (colores, fuentes)

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────┐
│  Dashboard: ServicesSettings            │
│  /dashboard/services/settings           │
│                                         │
│  1. Usuario edita configuración        │
│  2. handleSubmit() se ejecuta          │
│  3. setCompanyAppearance() guarda      │
│     → Firestore: company_appearances   │
│     → Documento: {company_id}_SERVICES │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Firestore: company_appearances         │
│                                         │
│  {company_id}_SERVICES: {              │
│    logo_url: "...",                    │
│    background_color: "#ffffff",        │
│    calendar_card_color: "#ffffff",     │
│    ...                                 │
│  }                                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Página Pública: PublicPage             │
│  /demo10                                │
│                                         │
│  1. getCompanyBySlug('demo10')         │
│  2. getCompanyAppearance(              │
│       company_id, SERVICES)            │
│  3. Resuelve layout:                   │
│     - category_id = 'barberias'        │
│     - → BarberiasPublicLayout          │
│  4. Pasa appearance como prop          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Layout: BarberiasPublicLayout          │
│                                         │
│  1. Recibe appearance como prop        │
│  2. Calcula theme desde appearance     │
│  3. Aplica colores/fuentes:            │
│     - Hero section                     │
│     - Service cards                    │
│     - Calendar (colores específicos)   │
│     - Botones                          │
└─────────────────────────────────────────┘
```

---

## ✅ Estado Actual

### Funcionalidades Implementadas:
- ✅ Guardado de configuración en dashboard
- ✅ Carga de configuración en página pública
- ✅ Aplicación de colores y fuentes
- ✅ Soporte para colores del calendario
- ✅ Layout específico para barberías

### Pendiente de Verificar:
- ⏳ Que todos los campos de configuración se reflejen correctamente
- ⏳ Que el flujo funcione end-to-end sin errores
- ⏳ Que los cambios se vean inmediatamente en la página pública

---

## 🧪 Testing

Para verificar el flujo completo:

1. **Dashboard:**
   - Ir a `/dashboard/services/settings`
   - Cambiar colores/fuentes
   - Guardar

2. **Página Pública:**
   - Ir a `/demo10`
   - Verificar que los cambios se reflejan

3. **Verificar:**
   - Logo se muestra correctamente
   - Colores aplicados
   - Fuentes aplicadas
   - Calendario con colores correctos
