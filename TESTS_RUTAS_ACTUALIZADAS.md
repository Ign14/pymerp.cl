# Tests Actualizados con Rutas Reales

## ✅ Cambios Realizados

### Tests de Restaurantes (`tests/e2e/restaurantes.spec.ts`)
✅ **Actualizado:** Todas las referencias de `/productos-demo` cambiadas a `/micarritodecomida`
- 9 tests actualizados

### Tests de Barberías (`tests/e2e/barberias.spec.ts`)
✅ **Actualizado:** Todas las referencias de `/servicios-demo` cambiadas a `/demo10`
- 8 tests actualizados

## Rutas Reales Utilizadas

- **Restaurantes:** `/micarritodecomida` (pymerp.cl/micarritodecomida)
- **Barberías:** `/demo10` (pymerp.cl/demo10)

## Comandos para Ejecutar

```bash
# Tests de restaurantes
npx playwright test restaurantes

# Tests de barberías
npx playwright test barberias

# Ambos
npx playwright test restaurantes barberias
```

## Nota Importante

Los tests ahora apuntan a las rutas reales de producción. Si los tests se ejecutan contra datos reales de Firebase, estos deben funcionar directamente con las empresas existentes.

Si se ejecutan con mocks (usando `setupFirebaseMocks`), los slugs en `e2e/fixtures/mockFirebase.ts` deberían coincidir con las rutas reales para consistencia, aunque los mocks actualmente usan slugs diferentes (`productos-demo`, `servicios-demo`).
