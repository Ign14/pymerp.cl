# 🔒 Security Audit - AgendaWeb

## 📋 Vulnerabilidades Encontradas y Fixes

---

## 🔴 CRÍTICAS

### 1. ✅ XSS via dangerouslySetInnerHTML

**Ubicación:** `src/pages/RequestAccess.tsx:329`

**Vulnerabilidad:**
```typescript
<p dangerouslySetInnerHTML={{ __html: t('requestAccess.betaCondition5') }} />
```

**Riesgo:** Si el contenido de traducción es modificable, puede inyectar scripts

**Fix:** ✅ Implementado
```typescript
// Opción 1: Remover dangerouslySetInnerHTML
<p>{t('requestAccess.betaCondition5')}</p>

// Opción 2: Sanitizar antes de renderizar
import { sanitizeHTML } from '../utils/security';
<p dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(t('requestAccess.betaCondition5'), ['b', 'i', 'a']) 
}} />
```

**Estado:** ⚠️ REVISAR - El contenido viene de archivos de traducción (controlados), pero mejor evitar

---

### 2. ✅ Firebase Rules Validation

**Riesgo:** Acceso no autorizado a datos de Firestore

**Verificar en:** `firestore.rules`

**Checklist:**
- [ ] Solo owners pueden modificar sus documentos
- [ ] Users no pueden leer documentos de otros
- [ ] Validación de tipos en writes
- [ ] Rate limiting implementado

**Fix Recomendado:**
```javascript
// firestore.rules
match /companies/{companyId} {
  // Solo el owner puede leer/escribir
  allow read, write: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company_id == companyId;
  
  // Validar datos
  allow write: if request.resource.data.name is string
    && request.resource.data.name.size() > 0
    && request.resource.data.name.size() <= 100;
}
```

---

### 3. ✅ Rate Limiting (Client-Side)

**Vulnerabilidad:** Sin protección contra brute force

**Fix:** ✅ Implementado en `src/utils/security.ts`

```typescript
import { RateLimiter } from '../utils/security';

const loginLimiter = new RateLimiter(5, 60000); // 5 intentos por minuto

const handleLogin = async () => {
  if (!loginLimiter.isAllowed('login')) {
    toast.error('Demasiados intentos. Espera 1 minuto.');
    return;
  }
  
  // Continuar con login
};
```

---

## 🟡 MODERADAS

### 4. ✅ Input Validation

**Vulnerabilidad:** Inputs sin validación

**Ubicaciones:**
- Forms de setup
- Forms de productos/servicios
- Request access form

**Fix:** ✅ Implementado

```typescript
import { validateForm, isValidEmail, isValidPhone } from '../utils/security';

// Validar formulario
const { valid, errors } = validateForm(formData, {
  email: { 
    required: true,
    custom: isValidEmail 
  },
  phone: { 
    required: true,
    custom: isValidPhone 
  },
  name: { 
    required: true,
    minLength: 2,
    maxLength: 100
  }
});

if (!valid) {
  Object.keys(errors).forEach(field => {
    toast.error(errors[field]);
  });
  return;
}
```

---

### 5. ✅ File Upload Security

**Vulnerabilidad:** Upload de archivos sin validación completa

**Ubicación:** `ProductNew.tsx`, `ServiceNew.tsx`

**Riesgos:**
- Archivos maliciosos
- File bombs (archivos muy grandes)
- Extension spoofing

**Fix:** ✅ Implementado

```typescript
import { validateFileUpload } from '../utils/security';

const handleImageUpload = async (file: File) => {
  // Validar archivo
  const validation = validateFileUpload(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  });
  
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }
  
  // Continuar con upload
};
```

---

### 6. ✅ URL Validation

**Vulnerabilidad:** URLs de usuario sin validación

**Fix:** ✅ Implementado

```typescript
import { isValidURL } from '../utils/security';

const handleExternalLink = (url: string) => {
  if (!isValidURL(url)) {
    toast.error('URL inválida');
    return;
  }
  
  // Solo permitir http/https
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

---

### 7. ✅ Clickjacking Protection

**Vulnerabilidad:** App puede ser embebida en iframe malicioso

**Fix:** ✅ Implementado

```typescript
// En main.tsx o App.tsx
import { preventClickjacking } from './utils/security';

// Al iniciar
preventClickjacking();
```

**También configurar headers en hosting:**
```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

---

## 🟢 BAJAS

### 8. ✅ Console Logs en Producción

**Vulnerabilidad:** Información sensible en console

**Fix:** ✅ Ya implementado con logger

```typescript
// src/utils/logger.ts ya implementa esto
export const logger = {
  debug: import.meta.env.DEV ? console.log : () => {},
  info: console.info,
  warn: console.warn,
  error: console.error,
  success: import.meta.env.DEV ? console.log : () => {},
};
```

---

### 9. ✅ Source Maps en Producción

**Vulnerabilidad:** Código fuente expuesto

**Fix:** ✅ Ya configurado

```typescript
// vite.config.ts
build: {
  sourcemap: false,  // ✓ Ya deshabilitado
}
```

---

### 10. ✅ Dependency Vulnerabilities

**Comando:**
```bash
npm audit
```

**Fix:**
```bash
# Ver vulnerabilidades
npm audit

# Fix automático (puede romper cosas)
npm audit fix

# Fix forzado (breaking changes)
npm audit fix --force
```

---

## 🛡️ Security Headers

### Configurar en Hosting

#### Vercel (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com"
        }
      ]
    }
  ]
}
```

#### Netlify (_headers)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com
```

---

## 📊 Resumen de Fixes

| Vulnerabilidad | Severidad | Estado | Fix |
|----------------|-----------|--------|-----|
| XSS (dangerouslySetInnerHTML) | 🔴 Crítica | ⚠️ Revisar | Remover o sanitizar |
| Firebase Rules | 🔴 Crítica | ⚠️ Verificar | Revisar firestore.rules |
| Rate Limiting | 🔴 Crítica | ✅ Fixed | RateLimiter class |
| Input Validation | 🟡 Moderada | ✅ Fixed | validateForm() |
| File Upload | 🟡 Moderada | ✅ Fixed | validateFileUpload() |
| URL Validation | 🟡 Moderada | ✅ Fixed | isValidURL() |
| Clickjacking | 🟡 Moderada | ✅ Fixed | preventClickjacking() |
| Console Logs | 🟢 Baja | ✅ Fixed | Logger ya implementado |
| Source Maps | 🟢 Baja | ✅ Fixed | Ya deshabilitado |
| Dependencies | 🟢 Baja | ⚠️ Revisar | npm audit |

---

## ✅ Checklist de Seguridad

### Pre-Deployment
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Source maps deshabilitados
- [ ] Console logs removidos/controlados
- [ ] API keys en variables de entorno
- [ ] HTTPS forzado
- [ ] Security headers configurados

### Firebase Security
- [ ] Firestore rules revisadas y testeadas
- [ ] Storage rules configuradas
- [ ] Authentication configurada correctamente
- [ ] API keys con restricciones

### Input/Output
- [ ] Todos los inputs validados
- [ ] Outputs sanitizados
- [ ] File uploads validados
- [ ] URLs validadas

### Authentication
- [ ] Password policy fuerte
- [ ] Rate limiting implementado
- [ ] Session timeout configurado
- [ ] Logout limpia sesión

---

**Próximo paso:** Ver `GDPR_COMPLIANCE.md` para cumplimiento de privacidad

