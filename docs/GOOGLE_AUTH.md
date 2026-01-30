# Google Sign-In (Firebase Auth)

Implementación de inicio de sesión con Google ya integrada en el código. Solo requiere configurar el proveedor en Firebase Console; no se necesitan variables de entorno nuevas.

## Configuración en Firebase Console
- **Auth → Sign-in method → Google → Enable**. Selecciona el **Support email** que mostrará Google.
- **Authorized domains**: agrega tus dominios productivos, vercel.app y `localhost` (si no está).
- **OAuth consent screen**: define nombre de la app, email de soporte y (opcional) logo/página de privacidad.
- No es necesario crear credenciales OAuth adicionales: Firebase Auth gestiona las claves.

## Política de provisión
- **Por defecto (Política B):** si el usuario no tiene documento en `users/{uid}`, se cierra la sesión y se muestra error “Cuenta no provisionada”. Se mantienen reglas estrictas.
- **Auto-provisión (Política A):** cambia `ALLOW_AUTO_PROVISION` a `true` en `src/services/auth.ts` para crear automáticamente `users/{uid}` con:
  - `role: ENTREPRENEUR`, `status: ACTIVE`, `auth_providers: ['google']`
  - `company_id` vacío → flujo de onboarding existente (`/setup/company-basic`)

## Comportamiento web
- Intenta **popup** primero; si el navegador lo bloquea, hace **fallback a redirect** automáticamente.
- El resultado de redirect se procesa al volver a `/login` y reutiliza el router post-login existente (roles/status/company_id).
- Se sincroniza siempre `users/{uid}`: `last_login_at`, `auth_providers` incluye `google`, se preserva `display_name`/`photo_url` si existen.

## Errores manejados
- `auth/account-exists-with-different-credential`: pide usar el método original o vincular la cuenta.
- `USER_NOT_PROVISIONED`: muestra error y hace sign-out (Política B).
- `auth/popup-blocked`: se fuerza redirect.
- `auth/popup-closed-by-user`, `auth/network-request-failed`: mensajes amigables en UI.

## Checklist de verificación
1) Usuario con doc en `users/{uid}` → login con Google → entra al dashboard/admin según rol/status → `auth_providers` incluye `google`.
2) Usuario sin doc (Política B) → login con Google → error “Cuenta no provisionada” y sesión cerrada.
3) Cuenta existente email/password → intenta Google → mensaje “cuenta con otro método” (sin duplicar doc).
4) Bloqueo de popup (Safari/Chrome con block) → se redirige a Google; al volver a `/login` entra correctamente si está provisionado.
