# Sincronización de Empresas Públicas

## Descripción

Sistema de sincronización automática que expone datos públicos de empresas en la colección `companies_public` sin filtrar información sensible.

## Arquitectura

### Colecciones

- **`companies/{companyId}`**: Colección privada con todos los datos de la empresa
- **`companies_public/{companyId}`**: Colección pública con solo datos whitelisted

### Sincronización

La Cloud Function `syncPublicCompany` se ejecuta automáticamente cuando:
- Se crea una empresa (`onCreate`)
- Se actualiza una empresa (`onUpdate`)
- Se elimina una empresa (`onDelete`)

### Lógica de Sincronización

1. **Si `publicEnabled=true`**:
   - Extrae datos públicos (whitelist)
   - Escribe/actualiza en `companies_public/{companyId}`

2. **Si `publicEnabled=false`**:
   - Elimina el documento de `companies_public/{companyId}`

3. **Si la empresa se elimina**:
   - Elimina también de `companies_public/{companyId}`

## Campos Públicos (Whitelist)

Los siguientes campos se sincronizan a `companies_public`:

- `name`: Nombre de la empresa
- `publicSlug`: Slug público (alias de `slug`)
- `categoryId`: ID de categoría
- `categoryGroup`: Grupo de categoría (SALUD, BELLEZA, etc.)
- `comuna`: Comuna
- `region`: Región
- `location`: GeoPoint (latitud, longitud)
- `geohash`: Geohash para búsquedas geográficas
- `photos[]`: Array de URLs de fotos (background_url, logo_url, photos[])
- `shortDescription`: Descripción truncada (máximo 200 caracteres)
- `updatedAt`: Timestamp de última actualización
- `business_type`: Tipo de negocio (SERVICES/PRODUCTS)
- `businessMode`: Modo de negocio
- `status`: Estado de la empresa (ACTIVE/BLOCKED)

## Seguridad

### Firestore Rules

```javascript
match /companies_public/{companyId} {
  allow read: if true; // Lectura pública permitida
  allow write: if false; // Escritura denegada desde cliente (solo server)
}
```

- ✅ **Lectura pública**: Cualquiera puede leer `companies_public`
- ❌ **Escritura desde cliente**: Denegada (solo Cloud Functions pueden escribir)

## Cómo Habilitar "Publicar mi Negocio"

### Opción 1: Desde el Dashboard (Recomendado)

1. Ir a `/dashboard`
2. En la sección de configuración, buscar "Publicar mi negocio"
3. Activar el toggle `publicEnabled`
4. La sincronización se ejecuta automáticamente

### Opción 2: Desde el Setup Wizard

1. Durante el setup inicial, en el paso de datos básicos
2. Activar "Publicar mi negocio" (opcional)
3. Por defecto: `publicEnabled=false`

### Opción 3: Manualmente (Solo para desarrollo/admin)

```typescript
// Desde el dashboard o Cloud Function
await updateCompany(companyId, {
  publicEnabled: true,
});
```

## Prueba Manual

### 1. Habilitar Publicación

```bash
# Desde el dashboard o usando Firebase Console
# Actualizar companies/{companyId} con:
{
  publicEnabled: true,
  name: "Mi Empresa",
  slug: "mi-empresa",
  category_id: "barberias",
  categoryGroup: "BELLEZA",
  commune: "Santiago",
  region: "Región Metropolitana",
  location: { latitude: -33.4489, longitude: -70.6693 },
  geohash: "66j8k9m2n",
  description: "Descripción de mi empresa..."
}
```

### 2. Verificar Sincronización

```bash
# Verificar que se creó el documento en companies_public
firebase firestore:get companies_public/{companyId}
```

### 3. Verificar Lectura Pública

```javascript
// Desde el cliente (sin autenticación)
import { collection, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

const publicCompanies = await getDocs(collection(db, 'companies_public'));
publicCompanies.forEach((doc) => {
  console.log(doc.id, doc.data());
});
```

### 4. Deshabilitar Publicación

```bash
# Actualizar companies/{companyId} con:
{
  publicEnabled: false
}
```

### 5. Verificar Eliminación

```bash
# Verificar que se eliminó de companies_public
firebase firestore:get companies_public/{companyId}
# Debe retornar: Document does not exist
```

## Troubleshooting

### La empresa no aparece en companies_public

1. Verificar que `publicEnabled=true` en `companies/{companyId}`
2. Verificar que la empresa tiene `name` y `slug`
3. Revisar logs de Cloud Functions:
   ```bash
   firebase functions:log --only syncPublicCompany
   ```

### Error de permisos al leer companies_public

1. Verificar que las reglas de Firestore están desplegadas:
   ```bash
   firebase deploy --only firestore:rules
   ```

### La sincronización no se ejecuta

1. Verificar que la Cloud Function está desplegada:
   ```bash
   firebase deploy --only functions:syncPublicCompany
   ```
2. Verificar logs:
   ```bash
   firebase functions:log
   ```

## Ejemplo de Uso

### Consultar Empresas Públicas

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

// Buscar empresas por categoría
const q = query(
  collection(db, 'companies_public'),
  where('categoryGroup', '==', 'BELLEZA'),
  where('status', '==', 'ACTIVE')
);

const snapshot = await getDocs(q);
const empresas = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Búsqueda Geográfica

```typescript
// Usar geohash para búsquedas cercanas
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

const center = [latitude, longitude];
const radiusInM = 5000; // 5km

const bounds = geohashQueryBounds(center, radiusInM);
const promises = bounds.map((bound) => {
  const q = query(
    collection(db, 'companies_public'),
    orderBy('geohash'),
    startAt(bound[0]),
    endAt(bound[1])
  );
  return getDocs(q);
});

const snapshots = await Promise.all(promises);
const empresas = snapshots.flatMap(snapshot => 
  snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(empresa => {
      const empresaLocation = empresa.location;
      if (!empresaLocation) return false;
      const distancia = distanceBetween(
        [empresaLocation.latitude, empresaLocation.longitude],
        center
      );
      return distancia <= radiusInM;
    })
);
```

## Notas Importantes

1. **Datos Sensibles**: Nunca se sincronizan RUT, emails, teléfonos, datos de facturación, etc.
2. **Performance**: La sincronización es asíncrona y no bloquea actualizaciones en `companies`
3. **Idempotencia**: La función es idempotente, se puede ejecutar múltiples veces sin efectos secundarios
4. **Consistencia**: Si `publicEnabled` cambia, la sincronización se ejecuta inmediatamente

