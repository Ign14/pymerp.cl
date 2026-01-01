# Templates de Email - PyM-ERP

Este documento describe los templates de email personalizados para PyM-ERP.

## Templates Implementados

### 1. Email de Nueva Solicitud de Acceso
**Función:** `sendAccessRequestEmailHttp`  
**Destinatario:** Administrador  
**Template:** `getAccessRequestEmailTemplate`

Este email se envía cuando un nuevo usuario solicita acceso a la plataforma. Incluye:
- Información del solicitante (nombre, email, negocio, WhatsApp, plan)
- Fecha de solicitud
- Diseño profesional con branding de PyM-ERP

### 2. Email de Creación de Usuario/Aprobación
**Función:** `sendUserCreationEmailHttp`  
**Destinatario:** Usuario nuevo  
**Template:** `getUserCreationEmailTemplate`

Este email se envía cuando se aprueba el acceso de un usuario. Incluye:
- Credenciales de acceso (email y contraseña temporal)
- Botón para acceder a la plataforma
- Instrucciones de seguridad
- Diseño profesional con branding de PyM-ERP

### 3. Email de Recuperación de Contraseña
**Función:** Firebase Auth (nativo)  
**Destinatario:** Usuario que solicita recuperación  
**Template:** Personalizado en Firebase Console

**Nota:** El email de recuperación de contraseña es manejado directamente por Firebase Authentication. Para personalizarlo:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Templates**
4. Selecciona **Password reset**
5. Personaliza el template con el branding de PyM-ERP

**Template HTML disponible:** `getPasswordResetEmailTemplate` (para uso futuro si se implementa un trigger personalizado)

**📋 Ver documentación completa:** [FIREBASE_AUTH_EMAIL_TEMPLATE.md](./FIREBASE_AUTH_EMAIL_TEMPLATE.md)

El template recomendado incluye:
- Botón estilizado en lugar del link completo
- Branding profesional de PyM-ERP
- Advertencia de seguridad
- Información de expiración del enlace

## Características de los Templates

- ✅ Diseño responsive (funciona en móviles y desktop)
- ✅ Branding consistente de PyM-ERP
- ✅ Colores corporativos (#2563eb - azul)
- ✅ Soporte para español e inglés
- ✅ Versión HTML y texto plano
- ✅ Compatible con clientes de email (incluyendo Outlook)

## Estructura de Archivos

```
functions/src/
  ├── emailTemplates.ts    # Templates HTML profesionales
  └── index.ts             # Funciones Cloud Functions que usan los templates
```

## Personalización

Para modificar los templates, edita `functions/src/emailTemplates.ts`. Los templates usan:
- HTML inline (sin CSS externo)
- Tablas para layout (compatible con Outlook)
- Colores de marca: #2563eb (azul principal)

## Próximos Pasos

1. Personalizar el template de recuperación de contraseña en Firebase Console
2. Considerar implementar un trigger de Cloud Function para interceptar eventos de recuperación de contraseña y usar el template personalizado
3. Agregar más templates según necesidades (confirmación de citas, notificaciones, etc.)

