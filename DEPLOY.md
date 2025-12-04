# Guía de Despliegue

## Configuración Inicial

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita los siguientes servicios:
   - **Authentication**: Habilita el proveedor Email/Password
   - **Firestore Database**: Crea una base de datos en modo producción
     - **⚠️ IMPORTANTE - Elección de Ubicación:**
       - La ubicación **NO se puede cambiar** después de crear la base de datos
       - **Para usuarios en América Latina:** Elige `southamerica-east1` (São Paulo, Brasil) para mejor latencia
       - **Alternativa:** `us-east1` (Carolina del Sur, EE.UU.) si necesitas mejor disponibilidad global
       - **Para usuarios en Europa:** `europe-west1` (Bélgica) o `europe-west3` (Frankfurt)
       - **Para usuarios en Asia:** `asia-southeast1` (Singapur) o `asia-northeast1` (Tokio)
       - Si planeas usar Cloud Functions, elige la misma región para reducir latencia
   - **Storage**: Habilita Firebase Storage
   - **Hosting**: Configura Firebase Hosting

### 2. Configurar Variables de Entorno

1. Copia `.env.example` a `.env`
2. Obtén las credenciales de Firebase:
   - Ve a Configuración del proyecto > Tus apps
   - Si no tienes una app web, crea una
   - Copia los valores de configuración
3. Obtén una API Key de Google Maps:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto o selecciona uno existente
   - Habilita la API de Maps JavaScript
   - Crea una API Key y restríngela a tu dominio

### 3. Configurar Firestore Rules

1. Copia `firestore.rules.example` a `firestore.rules`
2. Ajusta las reglas según tus necesidades de seguridad
3. Despliega las reglas:
```bash
firebase deploy --only firestore:rules
```

### 4. Configurar Storage Rules

Crea un archivo `storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /companies/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Despliega las reglas:
```bash
firebase deploy --only storage
```

### 5. Crear Usuario Superadmin

Después del primer despliegue, necesitas crear un usuario superadmin manualmente:

1. Crea un usuario en Firebase Authentication
2. En Firestore, crea un documento en la colección `users` con:
   - `email`: el email del usuario
   - `role`: `SUPERADMIN`
   - `status`: `ACTIVE`
   - `created_at`: timestamp actual

### 6. Construir y Desplegar

```bash
# Instalar dependencias
npm install

# Construir para producción
npm run build

# Desplegar a Firebase Hosting
firebase deploy
```

## Configuración de Email (SendGrid + Firebase Functions)

El servicio de email está configurado usando Firebase Functions + SendGrid.

### 1. Configurar SendGrid

1. Crea una cuenta en [SendGrid](https://sendgrid.com/) (plan gratuito disponible)
2. Ve a **Settings > API Keys** en el dashboard de SendGrid
3. Crea una nueva API Key con permisos de "Mail Send"
4. Copia la API Key (solo se muestra una vez)

### 2. Configurar Variables de Entorno en Firebase

Configura las variables de entorno en Firebase Functions:

```bash
# Configurar API Key de SendGrid
firebase functions:config:set sendgrid.api_key="TU_SENDGRID_API_KEY_AQUI"

# Configurar email del administrador (opcional, por defecto usa ignacio@datakomerz.com)
firebase functions:config:set email.admin="ignacio@datakomerz.com"
```

### 3. Desplegar Firebase Functions

```bash
# Construir las funciones
cd functions
npm run build

# Volver a la raíz y desplegar
cd ..
firebase deploy --only functions
```

### 4. Verificar el Despliegue

Después del despliegue, las funciones estarán disponibles en:
- `sendAccessRequestEmail` - Se llama cuando se crea una solicitud de acceso
- `sendUserCreationEmail` - Se llama cuando se aprueba una solicitud y se crea un usuario

### 5. Verificar que Funciona

1. Crea una solicitud de acceso desde la página pública
2. Verifica en los logs de Firebase Functions que el email se envió:
   ```bash
   # Los logs pueden tardar unos minutos en estar disponibles
   firebase functions:log
   
   # O verifica en la consola de Firebase:
   # https://console.firebase.google.com/project/agendaemprende-8ac77/functions/logs
   ```
   
   **Nota**: Si ves un error al ejecutar `firebase functions:log`, espera unos minutos y vuelve a intentar, o revisa los logs directamente en la consola de Firebase.

### Notas Importantes

- **Verificación de dominio en SendGrid**: Para producción, deberás verificar tu dominio en SendGrid para evitar que los emails vayan a spam
- **Límites del plan gratuito**: SendGrid permite 100 emails/día en el plan gratuito
- **Fallback**: Si SendGrid no está configurado, la aplicación seguirá funcionando pero solo mostrará logs en consola

## Información del Proyecto

- **Project ID**: `agendaemprende-8ac77`
- **Dominio de producción**: https://agendaemprende-8ac77.web.app/
- **Dominio alternativo**: https://agendaemprende-8ac77.firebaseapp.com/

## Notas Importantes

- Asegúrate de configurar los dominios permitidos en Firebase Authentication:
  - `agendaemprende-8ac77.web.app`
  - `agendaemprende-8ac77.firebaseapp.com`
  - Tu dominio personalizado (si lo configuras)
- Configura CORS si es necesario para las APIs externas
- Revisa las reglas de seguridad de Firestore antes de producción
- Configura índices compuestos en Firestore si es necesario para consultas complejas

