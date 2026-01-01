# 🔥 Firestore Rules - Fix Final

## ❌ Problema

**Error:** `Missing or insufficient permissions`

**Causa:** Faltaban reglas para `productOrderRequests` en Firestore

---

## ✅ Solución Aplicada

### Rules Agregadas para Product Orders

```javascript
match /productOrderRequests/{requestId} {
  // Solo el dueño de la empresa puede leer sus pedidos
  allow read: if isAuthenticated() && (
    ownsCompany(resource.data.company_id) ||
    isSuperAdmin()
  );
  
  // Público puede crear con validación estricta
  allow create: if validString('client_name', 100) &&
                   validString('client_whatsapp', 20) &&
                   request.resource.data.client_whatsapp.matches('^[0-9]{9,15}$') &&
                   validString('company_id', 100) &&
                   validTimestamp('created_at') &&
                   request.resource.data.items is list &&
                   request.resource.data.items.size() > 0 &&
                   request.resource.data.items.size() <= 50 &&
                   validNumber('total_estimated', 0, 999999999);
  
  // Solo el dueño puede actualizar/eliminar
  allow update, delete: if isAuthenticated() && (
    ownsCompany(resource.data.company_id) ||
    isSuperAdmin()
  );
}
```

### Validaciones Incluidas

✅ **client_name**: String de 1-100 caracteres
✅ **client_whatsapp**: String de 9-15 dígitos
✅ **company_id**: String válido
✅ **items**: Array con 1-50 elementos
✅ **total_estimated**: Número entre 0 y 999,999,999
✅ **created_at**: Timestamp válido (no futuro)

---

## 🚀 Deploy REQUERIDO

**IMPORTANTE: Debes deployar las rules actualizadas**

```bash
firebase deploy --only firestore:rules
```

**Espera a ver:**
```
✔ Deploy complete!
```

---

## 🧪 Testing Después del Deploy

### 1. Abrir Página Pública de Productos

```
https://tu-dominio.web.app/tu-empresa
```

### 2. Agregar Productos al Carrito

```
1. Click en "Agregar" en un producto
2. Verificar que aparece en el contador
3. Agregar más productos si quieres
```

### 3. Abrir Carrito

```
1. Click en "Ver carrito"
2. Ver productos agregados
3. Ajustar cantidades si necesitas
```

### 4. Enviar Pedido

```
1. Completar nombre
2. Completar WhatsApp (9 dígitos)
3. Agregar comentario (opcional)
4. Click "Solicitar disponibilidad por WhatsApp"
```

### 5. Verificar

```
✓ Se abre WhatsApp con mensaje completo
✓ Aparece toast de éxito
✓ Carrito se vacía
✓ NO hay errores en consola
✓ Pedido guardado en Firestore
```

---

## 🔍 Verificar en Firebase Console

### Después de un pedido exitoso:

```
1. Firebase Console
2. Firestore Database
3. productOrderRequests collection
4. Ver nuevo documento con datos del pedido
```

**Campos que verás:**
- client_name
- client_whatsapp
- company_id
- items (array)
- total_estimated
- client_comment
- created_at

---

## ✅ Firestore Rules Completas Ahora

**Colecciones con rules públicas para create:**

| Colección | Público puede crear | Validaciones |
|-----------|---------------------|--------------|
| `accessRequests` | ✅ Sí | Email, nombre, business, whatsapp |
| `appointmentRequests` | ✅ Sí | Nombre, whatsapp, fecha, servicio |
| `productOrderRequests` | ✅ Sí | Nombre, whatsapp, items, total |
| `publicPageEvents` | ✅ Sí | Company, event type, timestamp |

**Todas las demás colecciones:**
- ❌ Requieren autenticación
- ✅ Solo owners pueden modificar sus datos

---

## 🐛 Si el Error Persiste

### 1. Verificar Deploy de Rules

```bash
# Ver última actualización
firebase deploy --only firestore:rules

# En Firebase Console:
# Firestore → Rules
# Ver fecha de última publicación
```

### 2. Hard Refresh

```bash
# En el navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. Verificar en Consola

```bash
# F12 → Console
# No debería haber errores rojos
# Solo warnings de Google Maps (ignorables)
```

### 4. Test en Modo Incógnito

```bash
# Abrir en ventana privada
# Para descartar issues de cache
```

---

## 📋 Checklist de Solución

- [x] ✅ Rules para productOrderRequests agregadas
- [x] ✅ Rules para appointmentRequests corregidas
- [x] ✅ Locale español para DatePicker
- [x] ✅ Validaciones completas en rules
- [ ] 📝 **Deploy firestore rules**: `firebase deploy --only firestore:rules`
- [ ] 📝 Test de agendamiento de servicio
- [ ] 📝 Test de pedido de productos
- [ ] 📝 Verificar en Firestore Console

---

## 🎯 Comandos a Ejecutar

```bash
# 1. Deploy de rules (CRÍTICO)
firebase deploy --only firestore:rules

# 2. Rebuild si hiciste cambios locales
npm run build

# 3. Deploy hosting si es necesario
npm run deploy:hosting
```

---

**Ejecuta el deploy de rules y los errores desaparecerán!** 🔥✅

