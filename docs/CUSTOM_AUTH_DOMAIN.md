# Configurar Dominio Personalizado para Firebase Auth

Esta guía explica cómo cambiar las URLs de Firebase Auth de `agendaemprende-8ac77.firebaseapp.com` a `pymerp.cl`.

## Pasos para Configurar

### 1. Configurar Dominio Autorizado en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `agendaemprende-8ac77`
3. Ve a **Authentication** > **Settings** > **Authorized domains**
4. Haz clic en **Add domain**
5. Agrega los siguientes dominios:
   - `pymerp.cl`
   - `www.pymerp.cl`
   - `agendaemprende-8ac77.web.app` (ya debería estar)
   - `agendaemprende-8ac77.firebaseapp.com` (ya debería estar)
   - `localhost` (para desarrollo)

### 1.1. Configurar Action URL (Opcional pero Recomendado)

Para que Firebase Auth use automáticamente tu dominio personalizado en los emails:

1. Ve a **Authentication** > **Settings** > **Action URL**
2. Si hay una opción para "Custom domain" o "Action URL", configura:
   - `https://www.pymerp.cl/auth/action`
3. Esto hará que Firebase genere URLs con tu dominio en lugar de `firebaseapp.com`

### 2. Verificar Configuración de Firebase Hosting

Asegúrate de que `pymerp.cl` esté configurado en Firebase Hosting:

1. Ve a **Hosting** en Firebase Console
2. Verifica que `pymerp.cl` esté listado como dominio personalizado
3. Si no está, agrega el dominio siguiendo las instrucciones de Firebase

### 3. Configurar DNS (si aún no está configurado)

Si `pymerp.cl` no está apuntando a Firebase Hosting, configura los registros DNS:

```
Tipo A:
@ → 151.101.1.195
@ → 151.101.65.195

Tipo CNAME:
www → pymerp-cl.web.app
```

### 4. Página de Manejo de Acciones de Auth

✅ **Ya implementado**: Hemos creado la página `/auth/action` que maneja las acciones de Firebase Auth. Esta página:
- Procesa los códigos de verificación de email (`mode=verifyEmail`)
- Procesa los códigos de recuperación de contraseña (`mode=resetPassword`)
- Maneja recuperación de email (`mode=recoverEmail`)
- Redirige a las páginas apropiadas después de completar la acción
- Muestra mensajes de éxito/error apropiados

**Archivo:** `src/pages/AuthAction.tsx`

### 5. Verificar Configuración de actionCodeSettings

El código ya está configurado para usar `pymerp.cl`:

**Archivo:** `src/utils/actionCodeSettings.ts`

```typescript
const DEFAULT_APP_HOST = 'https://www.pymerp.cl';

export const getResetPasswordActionCodeSettings = () => {
  const origin = getAppOrigin();
  return {
    url: `${origin}/login`,
    handleCodeInApp: false,
  } as const;
};
```

### 6. Actualizar Configuración de Firebase (si es necesario)

Si aún ves URLs con `firebaseapp.com`, verifica:

1. **Firebase Console** > **Authentication** > **Settings** > **Action URL**
   - Asegúrate de que esté configurado para usar tu dominio personalizado
   - Si hay una opción para "Custom domain", selecciona `pymerp.cl`

2. **Firebase Console** > **Project Settings** > **General**
   - Verifica que el dominio personalizado esté listado

## Resultado Esperado

Después de configurar, los emails de Firebase Auth deberían contener URLs como:

**Antes:**
```
https://agendaemprende-8ac77.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=...
```

**Después:**
```
https://www.pymerp.cl/auth/action?mode=resetPassword&oobCode=...
```

O si Firebase aún genera URLs con `firebaseapp.com`, el `actionCodeSettings` en el código redirigirá automáticamente a `pymerp.cl/auth/action`.

## Flujo Completo

### Recuperación de Contraseña:
1. Usuario solicita recuperación en `/login`
2. Firebase envía email con link (puede ser `firebaseapp.com` o `pymerp.cl` dependiendo de la configuración)
3. Usuario hace clic en el link
4. Si el link es `firebaseapp.com`, Firebase redirige a `pymerp.cl/auth/action` (gracias a `actionCodeSettings`)
5. `/auth/action` verifica el código y redirige a `/change-password?oobCode=...&mode=resetPassword`
6. Usuario ingresa nueva contraseña
7. Se confirma el reset y redirige a `/login`

### Verificación de Email:
1. Usuario solicita verificación de email
2. Firebase envía email con link
3. Usuario hace clic en el link
4. `/auth/action` procesa el código y verifica el email
5. Redirige a `/login?verified=true`

## Verificación

1. Solicita un email de recuperación de contraseña
2. Verifica que el link en el email use `pymerp.cl` en lugar de `firebaseapp.com`
3. Haz clic en el link y verifica que redirija correctamente

## Notas Importantes

- ⚠️ **Cambios pueden tardar**: Los cambios en dominios autorizados pueden tardar unos minutos en propagarse
- ⚠️ **SSL requerido**: Asegúrate de que `pymerp.cl` tenga certificado SSL válido
- ⚠️ **Templates de email**: Los templates de email en Firebase Console seguirán usando `%LINK%`, que ahora apuntará a `pymerp.cl`

## Troubleshooting

### Si las URLs siguen usando firebaseapp.com:

1. Verifica que el dominio esté en la lista de dominios autorizados
2. Verifica que `actionCodeSettings` esté usando el dominio correcto
3. Limpia la caché del navegador y prueba de nuevo
4. Espera unos minutos para que los cambios se propaguen

### Si el link no funciona:

1. Verifica que la página `/auth/action` esté desplegada
2. Verifica que el dominio esté correctamente configurado en Firebase Hosting
3. Revisa la consola del navegador para errores

