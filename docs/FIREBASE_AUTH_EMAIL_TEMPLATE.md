# Configuración de Templates de Email de Firebase Auth

Este documento explica cómo configurar los templates de email de Firebase Authentication (recuperación de contraseña y verificación de email) en Firebase Console para usar mensajes profesionales con branding de PyM-ERP y dominio personalizado `pymerp.cl`.

## ⚠️ Importante: Dominio Personalizado

Los links en los emails ahora apuntan a `https://www.pymerp.cl/auth/action` en lugar de `agendaemprende-8ac77.firebaseapp.com`.

**Ver documentación completa:** [CUSTOM_AUTH_DOMAIN.md](./CUSTOM_AUTH_DOMAIN.md)

## Pasos para Configurar

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Templates**
4. Selecciona **Password reset**
5. Haz clic en **Edit**

## Template Recomendado (Español)

### Asunto del Email
```
Recuperar tu contraseña - PyM-ERP
```

### Cuerpo del Email (HTML)
```html
<p>Hola!:</p>

<p>Haz clic en el siguiente enlace para cambiar la contraseña de tu cuenta en PyM-ERP.</p>

<p><a href='%LINK%' style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">Recuperar contraseña</a></p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px; color: #92400e; font-size: 14px;">
  <strong>Si no has solicitado este cambio:</strong><br>
  Si no has solicitado este cambio, ignora este correo electrónico de forma segura. Tu contraseña no será modificada.
</p>

<p style="color: #6b7280; font-size: 14px; text-align: center;">
  Este enlace expirará en 1 hora por seguridad.
</p>

<p>Gracias,</p>

<p><strong>El equipo de PyM-ERP</strong></p>

<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
  © 2025 PyM-ERP. Todos los derechos reservados.<br>
  <a href="https://www.pymerp.cl" style="color: #2563eb; text-decoration: none;">www.pymerp.cl</a>
</p>
```

### Cuerpo del Email (Texto Plano)
```
Hola!:

Haz clic en el siguiente enlace para cambiar la contraseña de tu cuenta en PyM-ERP.

Recuperar contraseña: %LINK%

Si no has solicitado este cambio:
Si no has solicitado este cambio, ignora este correo electrónico de forma segura. Tu contraseña no será modificada.

Este enlace expirará en 1 hora por seguridad.

Gracias,

El equipo de PyM-ERP

© 2025 PyM-ERP. Todos los derechos reservados.
www.pymerp.cl
```

## Template Recomendado (Inglés)

### Asunto del Email
```
Reset your password - PyM-ERP
```

### Cuerpo del Email (HTML)
```html
<p>Hello!:</p>

<p>Click the following link to change the password for your PyM-ERP account.</p>

<p><a href='%LINK%' style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">Reset password</a></p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px; color: #92400e; font-size: 14px;">
  <strong>If you did not request this change:</strong><br>
  If you did not request this change, you can safely ignore this email. Your password will not be changed.
</p>

<p style="color: #6b7280; font-size: 14px; text-align: center;">
  This link will expire in 1 hour for security reasons.
</p>

<p>Thanks,</p>

<p><strong>The PyM-ERP team</strong></p>

<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
  © 2025 PyM-ERP. All rights reserved.<br>
  <a href="https://www.pymerp.cl" style="color: #2563eb; text-decoration: none;">www.pymerp.cl</a>
</p>
```

### Cuerpo del Email (Texto Plano)
```
Hello!:

Click the following link to change the password for your PyM-ERP account.

Reset password: %LINK%

If you did not request this change:
If you did not request this change, you can safely ignore this email. Your password will not be changed.

This link will expire in 1 hour for security reasons.

Thanks,

The PyM-ERP team

© 2025 PyM-ERP. All rights reserved.
www.pymerp.cl
```

## Variables Disponibles

Firebase Auth proporciona las siguientes variables que puedes usar en el template:

- `%LINK%` - El enlace de recuperación de contraseña
- `%EMAIL%` - El email del usuario
- `%APP_NAME%` - El nombre de la aplicación (configurado en Firebase Console)

## Características del Template

✅ **Enlace oculto**: El link completo no se muestra, solo un botón con texto "Recuperar contraseña"  
✅ **Branding profesional**: Colores corporativos de PyM-ERP (#2563eb)  
✅ **Diseño responsive**: Funciona en móviles y desktop  
✅ **Advertencia de seguridad**: Alerta clara si no se solicitó el cambio  
✅ **Información de expiración**: Indica que el enlace expira en 1 hora  

## Notas Importantes

1. **No mostrar el link completo**: Por seguridad y mejor UX, usa un botón en lugar de mostrar `%LINK%` directamente
2. **Personalización**: Puedes personalizar los colores, textos y estilos según tus necesidades
3. **Pruebas**: Después de configurar, prueba el template enviando un email de recuperación de contraseña
4. **Idioma**: Configura templates separados para español e inglés si tu app soporta múltiples idiomas

## Template de Verificación de Email

Para configurar el template de verificación de email:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Templates**
4. Selecciona **Email address verification**
5. Haz clic en **Edit**

### Template Recomendado (Español)

#### Asunto del Email
```
Verifica tu correo electrónico - PyM-ERP
```

#### Cuerpo del Email (HTML)
```html
<p>Hola, %DISPLAY_NAME%:</p>

<p>Haz clic en este enlace para verificar tu dirección de correo electrónico.</p>

<p><a href='%LINK%' style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">Verificar correo electrónico</a></p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px; color: #92400e; font-size: 14px;">
  <strong>Si no has emitido esta solicitud:</strong><br>
  Si no has emitido esta solicitud, ignora este mensaje de forma segura.
</p>

<p>Gracias,</p>

<p><strong>El equipo de PyM-ERP</strong></p>

<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
  © 2025 PyM-ERP. Todos los derechos reservados.<br>
  <a href="https://www.pymerp.cl" style="color: #2563eb; text-decoration: none;">www.pymerp.cl</a>
</p>
```

#### Cuerpo del Email (Texto Plano)
```
Hola, %DISPLAY_NAME%:

Haz clic en este enlace para verificar tu dirección de correo electrónico.

Verificar correo electrónico: %LINK%

Si no has emitido esta solicitud:
Si no has emitido esta solicitud, ignora este mensaje de forma segura.

Gracias,

El equipo de PyM-ERP

© 2025 PyM-ERP. Todos los derechos reservados.
www.pymerp.cl
```

### Template Recomendado (Inglés)

#### Asunto del Email
```
Verify your email address - PyM-ERP
```

#### Cuerpo del Email (HTML)
```html
<p>Hello, %DISPLAY_NAME%:</p>

<p>Click this link to verify your email address.</p>

<p><a href='%LINK%' style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">Verify email address</a></p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px; color: #92400e; font-size: 14px;">
  <strong>If you did not make this request:</strong><br>
  If you did not make this request, you can safely ignore this message.
</p>

<p>Thanks,</p>

<p><strong>The PyM-ERP team</strong></p>

<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
  © 2025 PyM-ERP. All rights reserved.<br>
  <a href="https://www.pymerp.cl" style="color: #2563eb; text-decoration: none;">www.pymerp.cl</a>
</p>
```

#### Cuerpo del Email (Texto Plano)
```
Hello, %DISPLAY_NAME%:

Click this link to verify your email address.

Verify email address: %LINK%

If you did not make this request:
If you did not make this request, you can safely ignore this message.

Thanks,

The PyM-ERP team

© 2025 PyM-ERP. All rights reserved.
www.pymerp.cl
```

## Variables Disponibles

Firebase Auth proporciona las siguientes variables que puedes usar en los templates:

### Para Password Reset:
- `%LINK%` - El enlace de recuperación de contraseña
- `%EMAIL%` - El email del usuario
- `%APP_NAME%` - El nombre de la aplicación (configurado en Firebase Console)

### Para Email Verification:
- `%LINK%` - El enlace de verificación de email
- `%DISPLAY_NAME%` - El nombre del usuario (si está disponible)
- `%EMAIL%` - El email del usuario
- `%APP_NAME%` - El nombre de la aplicación (configurado en Firebase Console)

## Verificación

Después de configurar los templates:

### Para Password Reset:
1. Ve a la página de login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email válido
4. Verifica que el email recibido tenga el diseño correcto y el botón funcione

### Para Email Verification:
1. Crea una nueva cuenta o solicita reenvío de verificación
2. Verifica que el email recibido tenga el diseño correcto y el botón funcione
3. Confirma que el enlace de verificación funcione correctamente

