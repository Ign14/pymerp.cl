# 🔧 Fix: Errores en Agendamiento

## ❌ Problemas Identificados

### 1. Locale "es" no encontrado
```
A locale object was not found for the provided string ["es"]
```

### 2. Permisos de Firestore insuficientes
```
FirebaseError: Missing or insufficient permissions
```

---

## ✅ Soluciones Aplicadas

### 1. **Locale Español para DatePicker** ✅

**Problema:** react-datepicker no encontraba el locale "es"

**Fix Aplicado:**
```typescript
// En BookingModal.tsx
import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';

// Registrar locale
registerLocale('es', es);
```

**Paquete instalado:**
```bash
npm install date-fns  ✅ Ya instalado
```

---

### 2. **Firestore Rules Actualizadas** ✅

**Problema:** Las rules esperaban campos diferentes a los que el código envía

**Campos que el código envía:**
```typescript
{
  company_id: string,
  service_id: string,
  date: string,              // ← formato: "2024-12-10"
  schedule_slot_id: string,
  client_name: string,
  client_whatsapp: string,
  client_comment: string,
  created_at: Timestamp
}
```

**Fix en firestore.rules:**
```javascript
allow create: if validString('client_name', 100) &&
                 validString('client_whatsapp', 20) &&
                 request.resource.data.client_whatsapp.matches('^[0-9]{9,15}$') &&
                 validString('company_id', 100) &&
                 validString('service_id', 100) &&
                 validString('schedule_slot_id', 100) &&  // ← Agregado
                 validString('date', 20) &&                // ← Cambiado de requested_date
                 validTimestamp('created_at');
```

---

## 🚀 Deploy de Firestore Rules

**IMPORTANTE: Debes deployar las rules actualizadas**

```bash
firebase deploy --only firestore:rules
```

**Esto actualizará las reglas en Firebase para permitir la creación de citas**

---

## ✅ Verificación

### Después de deployar las rules:

1. **Abrir la app**
   ```
   Tu URL pública de empresa
   ```

2. **Seleccionar un servicio**
   ```
   Click en "Agendar"
   ```

3. **Completar el flujo:**
   ```
   Paso 1: Seleccionar fecha y horario
   Paso 2: Completar datos
   Click "Enviar por WhatsApp"
   ```

4. **Verificar:**
   ```
   ✅ Se abre WhatsApp con el mensaje
   ✅ Se crea el registro en Firestore
   ✅ No hay errores en consola
   ```

---

## 🐛 Si Aún Hay Errores

### Error de Permisos Persiste

**Verificar en Firebase Console:**
```
1. Firestore Database → Rules
2. Ver que las rules se actualizaron
3. Ver la fecha de última publicación
```

**Re-deployar si es necesario:**
```bash
firebase deploy --only firestore:rules --force
```

### Error de Locale Persiste

**Verificar que date-fns está instalado:**
```bash
npm list date-fns
# Debería mostrar: date-fns@4.1.0
```

**Si no está:**
```bash
npm install date-fns
npm run build
```

### Limpiar Cache

**Si los errores persisten:**
```bash
# Limpiar build
rm -rf dist

# Limpiar node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build

# Re-deploy
npm run deploy
```

---

## 📋 Checklist de Solución

- [x] ✅ date-fns instalado
- [x] ✅ Locale español registrado en BookingModal
- [x] ✅ Firestore rules actualizadas (firestore.rules)
- [ ] 📝 Deploy de firestore rules: `firebase deploy --only firestore:rules`
- [ ] 📝 Verificar en Firebase Console que rules están actualizadas
- [ ] 📝 Test de agendamiento completo
- [ ] 📝 Verificar que no hay errores en consola

---

## 🚀 Comandos para Ejecutar

```bash
# 1. Deploy de Firestore Rules (IMPORTANTE)
firebase deploy --only firestore:rules

# 2. Rebuild de la app (si hiciste cambios)
npm run build

# 3. Deploy de hosting (si es necesario)
npm run deploy:hosting

# 4. Verificar en tu URL
# → Ir a página pública
# → Probar agendamiento completo
```

---

## ✅ Después del Fix

El agendamiento debería funcionar perfectamente:

1. ✓ Calendario compacto de 5 semanas
2. ✓ Selección de fecha sin errores de locale
3. ✓ Selección de horario en cards
4. ✓ Formulario de contacto
5. ✓ Envío por WhatsApp exitoso
6. ✓ Registro en Firestore sin errores de permisos

---

**Ejecuta ahora:**
```bash
firebase deploy --only firestore:rules
```

**Y prueba el agendamiento nuevamente!** 📅✅

