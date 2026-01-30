# Fase 2.1 Gestión de Productos Gastro — Cierre definitivo

**Estado:** DONE  
**Fecha de cierre:** Enero 2026  
**Rol:** Tech Lead Backend + Frontend senior (PymERP Gastro)

---

## Alcance declarado completado

El módulo Gastro implementa:

- Productos **SIMPLE** / **CONFIGURABLE** / **COMBO**
- **Modifier Groups** e **Items**
- **ProductModifierStep** con reglas min/max/required y scope producto/variante
- **Previsualización UX** realista (MVP2)
- **Publicación por catálogo** con política 1.2 (MVP3)
- Semántica clara: **Publicado ≠ Disponible**
- Multi-tenant estricto por `company_id`
- Soft-delete, outbox events, errores 400/403/404/409/422
- Sin integraciones externas activas

El wizard de productos es **autosuficiente** para crear, editar, configurar, previsualizar y publicar productos gastronómicos. Las reglas de negocio críticas están validadas en backend y reflejadas en UX. No queda deuda técnica funcional antes de avanzar a pedidos.

---

## Checklist de cierre (verificado)

| Ítem | Estado | Nota |
|------|--------|------|
| Tab **Publicación** solo en modo edición | ✅ | `canShowPublication = Boolean(productId)`; tab visible solo cuando existe `productId`. |
| **Publicado** determinado solo por existencia de `catalog_product` | ✅ | Texto "No publicado" / "Sí" según `row.state` (catalog_product). |
| **Disponible** controlado únicamente vía `is_available` | ✅ | Toggle PATCH `/gastro/catalog-products/{id}/availability`; sin flujo de despublicar. |
| No existe flujo "Despublicar" en UI | ✅ | Sin botón ni texto "Despublicar"; solo "No disponible" (toggle). |
| **Policy 1.2** | ✅ | Backend: `validatePricingPolicy`. CONFIGURABLE con variant prices → `base_price = null`; sin variant prices → `base_price > 0`. |
| **Previsualización** | ✅ | Respeta min/max/required (`previewRules`); bloquea selección al máximo (`canSelectMore`, `disabledByMax`); no persiste (estado local `previewSelectionsByScope`). |
| `gastro_api_contracts.md` actualizado y consistente | ✅ | Contratos de catalogs, catalog-products, variant-prices, policy 1.2, semántica Publicado/Disponible, variantPrices=[] (soft-delete). |
| Tests verdes (unitarios + integración gastro) | ✅ | `GastroValidationIntegrationTest` (incl. variant prices bulk, policy 1.2). |

---

## Resultado esperado

- **Fase 2.1** marcada como **DONE**.
- Base sólida para avanzar a **órdenes** sin modificar el flujo de productos.

---

## Referencias rápidas

- Backend contratos: `backend/docs/gastro_api_contracts.md`
- Wizard: `src/pages/dashboard/products/ProductWizard.tsx`
- Tab Publicación: `src/pages/dashboard/products/wizard/PublicationPanel.tsx`
- Previsualización: `src/pages/dashboard/products/wizard/PreviewRenderer.tsx`, `previewRules.ts`
- Policy 1.2: `CatalogProductService.validatePricingPolicy`, `VariantService.bulkUpsertVariantPrices` + `ensureBasePriceNull`
