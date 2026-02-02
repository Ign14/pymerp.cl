# 🔍 Comparación Firebase vs Local
## Proyecto: agendaemprende-8ac77 (pymerp.cl)
**Fecha:** 2026-02-02
**Propósito:** Identificar diferencias entre código desplegado en Firebase y código local antes de hacer deploy

---

## ⚠️ RESUMEN EJECUTIVO

### 🚨 FUNCIONES FALTANTES EN LOCAL (CRÍTICO)
Hay **18+ funciones desplegadas en Firebase que NO existen o NO están exportadas en el código local**. 
**Si despliegas ahora, ELIMINARÁS estas funciones de producción.**

---

## 📊 COMPARACIÓN DETALLADA

### 1. ☁️ CLOUD FUNCTIONS

#### ✅ Funciones que SÍ existen en ambos lados

| Función | Firebase | Local | Estado |
|---------|----------|-------|--------|
| `sendAccessRequestEmailHttp` | ✅ | ✅ | OK |
| `setUserPassword` | ✅ | ✅ | OK |
| `sendUserCreationEmailHttp` | ✅ | ✅ | OK |
| `deleteUserAccountHttp` | ✅ | ✅ | OK |
| `setCompanyClaimHttp` | ✅ | ✅ | OK |
| `generateSitemap` | ✅ | ✅ | OK |
| `getNotificationSettingsSafe` | ✅ | ✅ | OK |
| `setNotificationSettingsSafe` | ✅ | ✅ | OK |
| `createProfessional` | ✅ | ✅ | OK |
| `createAppointmentRequest` | ✅ | ✅ | OK |
| `cancelAppointment` | ✅ | ✅ | OK |
| `rescheduleAppointment` | ✅ | ✅ | OK |
| `onAppointmentCreated` | ✅ | ✅ | OK (Trigger) |
| `cleanExpiredLocks` | ✅ | ✅ | OK (Scheduled) |

**Total:** 14 funciones seguras

---

#### 🚨 Funciones que están en Firebase pero NO en Local

| Función | Tipo | Uso | Riesgo |
|---------|------|-----|--------|
| **`publicWebSeo`** | HTTPS | SEO dinámico para páginas públicas | 🔴 CRÍTICO |
| **`backfillCompanies`** | Callable | Migración de datos de empresas | 🟠 ALTO |
| **`syncPublicCompanies`** | Callable | Sincronización de empresas públicas | 🔴 CRÍTICO |
| **`syncPublicCompanyBySlug`** | Callable | Sync individual por slug | 🔴 CRÍTICO |
| **`enablePublicForCompaniesWithLocation`** | Callable | Habilitar público para empresas | 🟠 ALTO |
| **`migrateMyCompanyToFoodtruck`** | Callable | Migración a foodtruck | 🟡 MEDIO |
| **`setServiceSchedules`** | Callable | Configurar horarios de servicios | 🔴 CRÍTICO |
| **`setServiceSchedulesHttp`** | HTTPS | HTTP endpoint para horarios | 🔴 CRÍTICO |
| **`syncCompanyPublicOnWrite`** | Trigger | Auto-sync al escribir company | 🔴 CRÍTICO |
| **`syncCompanyPublicSchedule`** | Callable | Sync de horarios públicos | 🔴 CRÍTICO |
| **`createAppointmentRequestHttp`** | HTTPS | HTTP endpoint para citas | 🟠 ALTO |
| **`sendContactEmailHttp`** | HTTPS | Enviar email de contacto | 🟠 ALTO |
| **`sendFirstPasswordEmailHttp`** | HTTPS | Email de primera contraseña | 🟠 ALTO |
| **`processDataDeletionRequests`** | Scheduled | GDPR - eliminar datos | 🔴 CRÍTICO |
| **`requestDataDeletion`** | Callable | GDPR - solicitar eliminación | 🔴 CRÍTICO |
| **`syncServiceSlug`** | Trigger | Auto-sync de slugs de servicios | 🟠 ALTO |

**Total:** 16 funciones EN RIESGO DE ELIMINACIÓN

---

#### 📝 ESTADO DE LAS FUNCIONES

##### ✅ Código Existe pero NO está Exportado:
Estas funciones tienen el código (handlers) pero NO están siendo exportadas en `index.ts`:

```typescript
// En backfill.ts existen los handlers pero NO se exportan en index.ts:
- backfillCompaniesHandler ❌ NO exportado
- syncPublicCompaniesHandler ❌ NO exportado
- syncPublicCompanyBySlugHandler ❌ NO exportado
- enablePublicForCompaniesWithLocationHandler ❌ NO exportado
- migrateMyCompanyToFoodtruckHandler ❌ NO exportado
```

##### 🚫 Código NO Existe en Absoluto:
Estas funciones NO tienen ningún código en el repositorio local:

```
- publicWebSeo (Rewrite en firebase.json existe, pero función NO)
- setServiceSchedules
- setServiceSchedulesHttp
- syncCompanyPublicOnWrite
- syncCompanyPublicSchedule
- createAppointmentRequestHttp
- sendContactEmailHttp
- sendFirstPasswordEmailHttp
- processDataDeletionRequests
- requestDataDeletion
- syncServiceSlug
```

---

### 2. 🗄️ FIRESTORE RULES

#### Estado: ⚠️ NO VERIFICADO
- **Local:** `firestore.rules` existe (311 líneas)
- **Firebase:** No se pudo descargar automáticamente
- **Acción Requerida:** Comparar manualmente desde Firebase Console

**Cómo verificar:**
```bash
# Ver reglas en Firebase Console:
# https://console.firebase.google.com/project/agendaemprende-8ac77/firestore/rules

# O descargar manualmente
```

---

### 3. 📑 FIRESTORE INDEXES

#### Estado: ⚠️ NO VERIFICADO
- **Local:** `firestore.indexes.json` existe
- **Firebase:** No verificado
- **Acción Requerida:** Exportar desde Firebase Console

**Cómo verificar:**
```bash
firebase firestore:indexes > firestore-deployed.indexes.json
# Comparar con firestore.indexes.json local
```

---

### 4. 📦 STORAGE RULES

#### Estado: ⚠️ NO VERIFICADO
- **Local:** `storage.rules` existe (en firebase.json)
- **Firebase:** No verificado
- **Acción Requerida:** Verificar desde Firebase Console

---

### 5. 🌐 HOSTING

#### Estado: ✅ CONFIGURACIÓN EXISTE
**Archivo:** `firebase.json`

**Rewrites Configurados:**
```json
{
  "source": "/sitemap.xml",
  "function": "generateSitemap"  ✅ Existe
},
{
  "source": "/:slug/barberias/servicios/:serviceSlug",
  "function": "publicWebSeo"  🚨 Función NO existe en local
},
{
  "source": "/:slug/barberias",
  "function": "publicWebSeo"  🚨 Función NO existe en local
}
```

**⚠️ PROBLEMA CRÍTICO:**
Los rewrites referencian la función `publicWebSeo` que NO existe en el código local. 
Si despliegas, las rutas `/slug/barberias/*` dejarán de funcionar.

---

## 🎯 RECOMENDACIONES

### ⛔ NO DESPLEGAR TODAVÍA

**Riesgos si despliegas ahora:**

1. **Pérdida de funcionalidad SEO**: 
   - Las páginas públicas de barberías perderán el SEO dinámico
   - URLs como `pymerp.cl/[slug]/barberias` dejarán de funcionar

2. **Pérdida de funciones de sincronización**:
   - No se sincronizarán datos públicos de empresas
   - Pérdida de funciones de migración de datos

3. **Pérdida de funciones GDPR**:
   - No se procesarán solicitudes de eliminación de datos
   - Incumplimiento potencial de regulaciones

4. **Pérdida de triggers automáticos**:
   - No se actualizarán slugs automáticamente
   - No se sincronizarán cambios de empresas

---

## 📋 PLAN DE ACCIÓN

### Paso 1: Recuperar Código Faltante (CRÍTICO)

#### Opción A: Recuperar desde Git History
```bash
# Buscar en el historial de Git cuando estas funciones existían
git log --all --full-history -- "functions/src/**/*.ts" | grep -i "publicWebSeo\|setServiceSchedules\|syncCompanyPublic"

# Revisar commits antiguos
git log --oneline --all | grep -i "function\|backfill\|sync"
```

#### Opción B: Recrear Funciones desde Cero
Si no están en Git, necesitarás recrear manualmente las funciones basándote en:
- Lo que está desplegado actualmente (analizar comportamiento en producción)
- Documentación interna del equipo
- Logs de Cloud Functions en Firebase Console

---

### Paso 2: Comparar Reglas y Configuración

```bash
# 1. Exportar reglas actuales de Firestore desde Console
# https://console.firebase.google.com/project/agendaemprende-8ac77/firestore/rules
# Copiar y comparar con firestore.rules local

# 2. Exportar índices
firebase firestore:indexes --project agendaemprende-8ac77

# 3. Verificar Storage rules desde Console
# https://console.firebase.google.com/project/agendaemprende-8ac77/storage/rules
```

---

### Paso 3: Verificar Variables de Entorno

```bash
# Verificar que tienes todas las variables necesarias:
# - SENDGRID_API_KEY
# - Otras API keys que usen las functions
```

#### Variables Críticas que Podrías Necesitar:
```
functions/.env:
- SENDGRID_API_KEY=
- GOOGLE_MAPS_API_KEY=
- (Otras keys que usen las functions)
```

---

### Paso 4: Testing Local ANTES de Deploy

```bash
# 1. Compilar functions
cd functions
npm run build

# 2. Iniciar emuladores
cd ..
firebase emulators:start --only functions,firestore

# 3. Probar cada función crítica en el emulador
# Especialmente: publicWebSeo, syncCompanyPublic*, setServiceSchedules
```

---

### Paso 5: Deploy Incremental

**NO hagas `firebase deploy --only functions`** hasta recuperar todo el código.

Cuando estés listo:

```bash
# Deploy solo hosting primero (más seguro)
firebase deploy --only hosting --project agendaemprende-8ac77

# Luego, deploy de reglas
firebase deploy --only firestore:rules --project agendaemprende-8ac77

# Finalmente, functions (SOLO cuando tengas TODO el código)
firebase deploy --only functions --project agendaemprende-8ac77
```

---

## 🔍 INVESTIGACIÓN ADICIONAL REQUERIDA

### 1. Revisar Logs de Producción
```
# En Firebase Console → Functions → Logs
# Filtrar por las funciones "faltantes" para entender qué hacen
```

### 2. Revisar Git History
```bash
# Buscar cuándo se eliminaron estas funciones
git log --all --full-history --source --find-renames --diff-filter=D -- "functions/**/*.ts"
```

### 3. Revisar Dependencias de las Funciones
```
# Analizar qué otras partes del sistema dependen de estas functions
# Especialmente: frontend, otros servicios, webhooks externos
```

---

## 📊 ESTADÍSTICAS

| Categoría | Firebase | Local | Estado |
|-----------|----------|-------|--------|
| Total Functions | 30 | 14 | 🚨 53% faltante |
| HTTPS Functions | 12+ | 8 | 🚨 33% faltante |
| Callable Functions | 13+ | 6 | 🚨 54% faltante |
| Triggers | 3 | 1 | 🚨 67% faltante |
| Scheduled | 2 | 1 | 🚨 50% faltante |

---

## ⚡ ACCIONES INMEDIATAS

### 🚨 ANTES DE CUALQUIER DEPLOY:

1. ✅ **COMPLETADO:** Identificar funciones faltantes
2. ⏳ **PENDIENTE:** Recuperar código de `publicWebSeo` (CRÍTICO)
3. ⏳ **PENDIENTE:** Recuperar código de funciones de sync
4. ⏳ **PENDIENTE:** Recuperar código de funciones GDPR
5. ⏳ **PENDIENTE:** Comparar Firestore rules
6. ⏳ **PENDIENTE:** Verificar variables de entorno
7. ⏳ **PENDIENTE:** Testing exhaustivo en emuladores
8. ⏳ **PENDIENTE:** Backup de Firestore data (por seguridad)

---

## 💾 BACKUP RECOMENDADO

Antes de cualquier deploy, hacer backup de:

```bash
# 1. Exportar toda la base de datos Firestore
# (Desde Firebase Console → Firestore → Importar/Exportar)

# 2. Backup de Storage
# (Usar gsutil para copiar el bucket completo)

# 3. Backup de Auth Users
# (Desde Firebase Console → Authentication → Users → Exportar)
```

---

## 📞 CONTACTO / SOPORTE

Si necesitas ayuda para recuperar las funciones faltantes:
1. Revisar con el equipo si alguien tiene el código localmente
2. Revisar backups de desarrollo
3. Contactar a Firebase Support si es necesario recuperar código deployado

---

**CONCLUSIÓN:** 
🚨 **NO DEPLOYAR hasta recuperar las 16 funciones faltantes.** 
El riesgo de pérdida de funcionalidad es CRÍTICO.
