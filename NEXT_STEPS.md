# Guía de Próximos Pasos - AgendaWeb

## ✅ Completado
- [x] Configuración de Firebase (Auth, Firestore, Storage, Hosting)
- [x] Variables de entorno configuradas
- [x] Firestore Rules desplegadas
- [x] SendGrid configurado y funcionando
- [x] Función `sendAccessRequestEmailHttp` funcionando correctamente

## 📋 Pasos Pendientes

### Paso 1: Verificar y Desplegar `sendUserCreationEmail`

Esta función envía el email cuando se aprueba una solicitud. Actualmente es una **callable function**, lo que significa que necesita permisos especiales.

**Opción A: Convertir a HTTP Function (Recomendado)**
- Más fácil de usar públicamente
- No requiere configuración de permisos IAM

**Opción B: Mantener como Callable y Configurar Permisos**
- Requiere configurar permisos en Google Cloud Console

**¿Qué prefieres?** Te recomiendo la Opción A para mantener consistencia con `sendAccessRequestEmailHttp`.

---

### Paso 2: Crear y Desplegar Storage Rules

La aplicación usa Firebase Storage para subir imágenes de productos. Necesitas crear las reglas de seguridad.

**Archivo a crear:** `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura pública de imágenes de productos
    match /companies/{companyId}/products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.token.email_verified == true;
    }
    
    // Permitir lectura pública de imágenes de servicios
    match /companies/{companyId}/services/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.token.email_verified == true;
    }
    
    // Permitir lectura pública de logos de empresas
    match /companies/{companyId}/logo/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.token.email_verified == true;
    }
  }
}
```

**Actualizar `firebase.json`** para incluir storage:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Desplegar:**
```bash
firebase deploy --only storage
```

---

### Paso 3: Verificar Usuario SUPERADMIN

Necesitas crear un usuario SUPERADMIN para acceder al panel de administración.

**Pasos:**

1. **Crear usuario en Firebase Authentication:**
   - Ve a [Firebase Console > Authentication](https://console.firebase.google.com/project/agendaemprende-8ac77/authentication/users)
   - Haz clic en "Add user"
   - Ingresa tu email y una contraseña temporal
   - Guarda las credenciales

2. **Crear documento en Firestore:**
   - Ve a [Firestore Database](https://console.firebase.google.com/project/agendaemprende-8ac77/firestore)
   - Crea una nueva colección llamada `users` (si no existe)
   - Crea un documento con ID = tu email o un ID único
   - Agrega estos campos:
     ```json
     {
       "email": "tu-email@ejemplo.com",
       "role": "SUPERADMIN",
       "status": "ACTIVE",
       "created_at": [timestamp actual]
     }
     ```

**Nota:** El campo `role` debe ser exactamente `"SUPERADMIN"` (en mayúsculas).

---

### Paso 4: Despliegue Completo a Producción

Una vez completados los pasos anteriores, haz un despliegue completo:

```bash
# Construir la aplicación
npm run build

# Desplegar todo (hosting + functions + rules)
firebase deploy

# O desplegar por partes:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

**Verificar despliegue:**
- Hosting: https://agendaemprende-8ac77.web.app/
- Functions: https://console.firebase.google.com/project/agendaemprende-8ac77/functions

---

### Paso 5: Probar el Flujo Completo

1. **Solicitud de Acceso:**
   - Ve a `/request-access`
   - Completa el formulario
   - Verifica que recibas el email de notificación

2. **Aprobar Solicitud:**
   - Inicia sesión como SUPERADMIN
   - Ve al panel de administración
   - Aprueba la solicitud
   - Verifica que el usuario reciba el email con sus credenciales

3. **Login del Usuario:**
   - El usuario debe poder iniciar sesión con las credenciales recibidas
   - Debe ser redirigido a cambiar su contraseña (si está configurado)

4. **Subir Imagen:**
   - Crea un producto o servicio
   - Sube una imagen
   - Verifica que se suba correctamente a Storage

---

## 🔍 Verificación Final

### Checklist de Configuración

- [ ] `sendUserCreationEmail` desplegada y funcionando
- [ ] Storage Rules creadas y desplegadas
- [ ] Usuario SUPERADMIN creado en Auth y Firestore
- [ ] Aplicación desplegada a producción
- [ ] Flujo completo probado (solicitud → aprobación → email → login)
- [ ] Subida de imágenes funcionando

### URLs Importantes

- **Aplicación en producción:** https://agendaemprende-8ac77.web.app/
- **Firebase Console:** https://console.firebase.google.com/project/agendaemprende-8ac77/overview
- **SendGrid Dashboard:** https://app.sendgrid.com/
- **Google Cloud Console:** https://console.cloud.google.com/

---

## 🆘 Si Algo No Funciona

### Email no se envía al aprobar solicitud
- Verifica que `sendUserCreationEmail` esté desplegada
- Revisa los logs: `firebase functions:log --only sendUserCreationEmail`
- Verifica permisos en Google Cloud Console

### No puedo acceder al panel de administración
- Verifica que el usuario tenga `role: "SUPERADMIN"` en Firestore
- Verifica que el usuario esté en Firebase Authentication
- Verifica que el status sea `"ACTIVE"`

### Error al subir imágenes
- Verifica que Storage Rules estén desplegadas
- Verifica que el usuario esté autenticado
- Revisa los logs de la consola del navegador

---

## 📝 Notas Adicionales

- **Límites de SendGrid:** El plan gratuito permite 100 emails/día
- **Firestore Location:** `southamerica-east1` (São Paulo) - ya configurado
- **Functions Region:** `us-central1` - ya configurado
- **Migración de functions.config():** Después de marzo 2026, necesitarás migrar a variables de entorno

