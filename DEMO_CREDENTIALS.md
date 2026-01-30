# 🔐 Credenciales de Cuentas Demo

## 📋 Información General

Todas las cuentas demo comparten la misma contraseña y siguen un patrón de email predecible.

### 🔑 Contraseña Universal
```
Pymerp.cl1234
```

### 📧 Formato de Email
```
demo{N}@pymerp.cl
```
Donde `{N}` es el número de demo asignado a cada categoría.

---

## 🎯 Cómo Obtener las Credenciales Completas

### Opción 1: Consultar en Firestore (Recomendado)

Si ya ejecutaste el script `seed-demos.ts`, puedes consultar las credenciales directamente:

```bash
# En Firebase Console o usando Firebase CLI
# Buscar en la colección 'companies' donde is_demo == true
# El slug te dará el número de demo
```

### Opción 2: Ejecutar Script de Consulta

Puedes crear un script rápido para listar todas las credenciales:

```typescript
// scripts/list-demo-credentials.ts
import { initFirebaseAdmin } from './lib/firebaseAdmin';

async function listDemoCredentials() {
  const { db } = initFirebaseAdmin({ useEmulator: true });
  const companies = await db.collection('companies')
    .where('is_demo', '==', true)
    .get();
  
  console.log('\n📋 Credenciales Demo:\n');
  companies.docs.forEach((doc) => {
    const data = doc.data();
    const slug = data.slug || '';
    const match = slug.match(/^demo(\d+)/i);
    if (match) {
      const num = match[1];
      console.log(`Email: demo${num}@pymerp.cl`);
      console.log(`Password: Pymerp.cl1234`);
      console.log(`Categoría: ${data.category_id || 'N/A'}`);
      console.log(`Slug: ${slug}`);
      console.log('---');
    }
  });
}

listDemoCredentials();
```

---

## 📊 Categorías Disponibles

El sistema tiene **47 categorías** diferentes. Cada una puede tener una cuenta demo asociada.

### Lista de Categorías

#### Salud (8 categorías)
- `clinicas_odontologicas`
- `clinicas_kinesiologicas`
- `centros_entrenamiento`
- `actividad_entrenamiento_fisico`
- `centros_terapia`
- `psicologia`
- `nutricion`
- `masajes_spa`

#### Belleza (5 categorías)
- `barberias`
- `peluquerias`
- `centros_estetica`
- `unas`
- `tatuajes_piercing`

#### Hogar (5 categorías)
- `aseo_ornato`
- `chef_personal`
- `asesoria_hogar`
- `construccion_mantencion`
- `construccion`

#### Automotriz (1 categoría)
- `taller_vehiculos`

#### Educación (1 categoría)
- `cursos_capacitaciones`

#### Retail (9 categorías)
- `minimarket`
- `articulos_aseo`
- `productos_cuidado_personal`
- `ferreteria`
- `floreria`
- `ropa_accesorios`
- `libreria_papeleria`
- `tecnologia`
- `botillerias`

#### Alimentos (2 categorías)
- `restaurantes_comida_rapida`
- `panaderia_pasteleria`

#### Turismo y Eventos (6 categorías)
- `centros_eventos`
- `deporte_aventura`
- `turismo`
- `fotografia`
- `arriendo_cabanas_casas`
- `inmobiliaria_terrenos_casas`

#### Mascotas (1 categoría)
- `mascotas_veterinarias`

#### Artes y Oficios (3 categorías)
- `artesania`
- `talabarteria`
- `taller_artes`

#### Servicios (6 categorías)
- `agenda_profesionales_independientes`
- `servicios_legales`
- `contabilidad`
- `bodegas_logistica`
- `agricultura_productores`
- `otros`

---

## 🔍 Cómo Encontrar el Número de Demo de una Categoría

### Método 1: Consultar Firestore

```bash
# Usando Firebase CLI
firebase firestore:get companies --where is_demo==true

# O en Firebase Console:
# Firestore Database → companies → Filtrar por is_demo == true
# Buscar el documento con category_id que coincida
# El slug te dirá el número (ej: demo2, demo3, etc.)
```

### Método 2: Verificar en la URL Pública

Si la empresa demo tiene página pública habilitada:
```
https://tu-dominio.com/demo{N}
```
El número en la URL es el número de demo.

---

## 📝 Ejemplo de Credenciales

Basado en el script `seed-demos.ts`, las primeras cuentas demo serían:

### Demo 2 (Primera categoría sin demo)
```
Email: demo2@pymerp.cl
Password: Pymerp.cl1234
```

### Demo 3 (Segunda categoría sin demo)
```
Email: demo3@pymerp.cl
Password: Pymerp.cl1234
```

### Demo 4 (Tercera categoría sin demo)
```
Email: demo4@pymerp.cl
Password: Pymerp.cl1234
```

...y así sucesivamente hasta cubrir las 47 categorías.

---

## 🚀 Generar Nuevas Cuentas Demo

Para crear o actualizar cuentas demo:

```bash
# En emulador (desarrollo)
npx tsx scripts/seed-demos.ts --emulator

# En producción (requiere confirmación)
npx tsx scripts/seed-demos.ts --project tu-project-id --confirm-prod

# Empezar desde un número específico
npx tsx scripts/seed-demos.ts --emulator --from 10
```

---

## ⚠️ Notas Importantes

1. **Contraseña Universal**: Todas las cuentas demo usan la misma contraseña: `Pymerp.cl1234`

2. **Números de Demo**: Los números empiezan desde 2 por defecto (demo1 podría estar reservado)

3. **Emails Únicos**: Cada categoría tiene un email único basado en su número de demo

4. **Slugs**: El slug de la empresa coincide con el email (sin el dominio): `demo{N}`

5. **Actualización**: Si ejecutas el script múltiples veces, actualizará las cuentas existentes en lugar de crear duplicados

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Estas credenciales son solo para desarrollo y testing. **NUNCA** uses estas contraseñas en producción.

Para producción:
- Cambia las contraseñas después del primer login
- Usa contraseñas únicas y seguras
- Implementa políticas de contraseñas fuertes

---

## 📞 Soporte

Si necesitas ayuda para:
- Listar todas las credenciales existentes
- Generar nuevas cuentas demo
- Encontrar el número de demo de una categoría específica

Ejecuta el script de consulta o revisa la colección `companies` en Firestore con el filtro `is_demo == true`.

