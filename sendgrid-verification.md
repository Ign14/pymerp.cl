# Verificar Email en SendGrid

## Problema
El error 500 "Forbidden" probablemente se debe a que SendGrid está rechazando el email porque el remitente no está verificado.

## Solución

### 1. Verificar tu Email en SendGrid

1. Ve a [SendGrid Dashboard](https://app.sendgrid.com/)
2. Ve a **Settings > Sender Authentication**
3. Haz clic en **Verify a Single Sender**
4. Completa el formulario:
   - **From Email Address**: `ignacio@datakomerz.com`
   - **From Name**: `AgendaWeb`
   - Completa los demás campos requeridos
5. Revisa tu email y haz clic en el enlace de verificación

### 2. Alternativa: Verificar Dominio (Para Producción)

Si quieres usar `noreply@agendaemprende.com`:

1. Ve a **Settings > Sender Authentication**
2. Haz clic en **Authenticate Your Domain**
3. Sigue las instrucciones para agregar registros DNS

### 3. Después de Verificar

Una vez verificado el email, los emails deberían enviarse correctamente.

## Verificar que Funciona

Después de verificar el email en SendGrid:
1. Recarga la aplicación
2. Crea una solicitud de acceso
3. Deberías recibir el email sin errores

