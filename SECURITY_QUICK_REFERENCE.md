# 🔒 Security & GDPR - Quick Reference

## ⚡ Guía Rápida

---

## 🛡️ Security Utilities

### Import

```typescript
import {
  sanitizeInput,
  sanitizeHTML,
  isValidEmail,
  isValidPhone,
  isValidURL,
  validateForm,
  validateFileUpload,
  RateLimiter,
  preventClickjacking
} from './utils/security';
```

### Uso Común

```typescript
// Sanitizar input
const safe = sanitizeInput(userInput);

// Validar email
if (!isValidEmail(email)) {
  toast.error('Email inválido');
  return;
}

// Validar formulario
const { valid, errors } = validateForm(data, {
  email: { required: true, custom: isValidEmail },
  name: { required: true, minLength: 2, maxLength: 100 },
  phone: { custom: isValidPhone }
});

// Rate limiting
const limiter = new RateLimiter(5, 60000);
if (!limiter.isAllowed('action')) {
  toast.error('Demasiados intentos');
  return;
}

// Validar file
const validation = validateFileUpload(file, {
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png']
});
```

---

## 🍪 GDPR Components

### Cookie Consent

```typescript
import CookieConsent from './components/CookieConsent';
import { useConsent } from './components/CookieConsent';

// En App.tsx (ya incluido)
<CookieConsent />

// Verificar consentimiento
const { hasConsent } = useConsent();

if (hasConsent('analytics')) {
  initGA();
}
```

### Data Export

```typescript
import DataExport from './components/DataExport';

// En dashboard o settings
<DataExport />

// Usuario click → Descarga JSON con todos sus datos
```

### Data Deletion

```typescript
import DataDeletionRequest from './components/DataDeletionRequest';

const [showDelete, setShowDelete] = useState(false);

<DataDeletionRequest 
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
/>
```

---

## 📋 Checklists

### Security Pre-Deploy

```bash
# 1. Audit de dependencias
npm audit

# 2. Build sin source maps
npm run build
# Verificar: dist/assets/*.js.map NO existe

# 3. Variables de entorno
# Verificar que NO hay secrets en código

# 4. Firestore rules
# Revisar y testear firestore.rules

# 5. Security headers
# Configurar en vercel.json o _headers
```

### GDPR Pre-Deploy

```bash
# 1. Cookie consent
npm run dev
# → Esperar 2s, ver banner

# 2. Política de privacidad
# → Abrir /privacidad
# → Verificar información actualizada

# 3. Data export
# → Login → Dashboard
# → Click "Exportar Datos"
# → Verificar JSON descarga

# 4. Data deletion
# → Abrir modal de eliminación
# → Verificar proceso de 2 pasos
```

---

## 🚨 Vulnerabilidades Críticas

### 1. XSS via dangerouslySetInnerHTML

**Ubicación:** `src/pages/RequestAccess.tsx:329`

**Fix:**
```typescript
// Opción 1: Remover (RECOMENDADO)
<p>{t('requestAccess.betaCondition5')}</p>

// Opción 2: Sanitizar
<p dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(t('...'), ['b', 'i']) 
}} />
```

### 2. Firestore Rules

**Verificar:** `firestore.rules`

```javascript
// Ejemplo de regla segura
match /companies/{companyId} {
  allow read: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company_id == companyId;
  
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company_id == companyId
    && request.resource.data.name is string
    && request.resource.data.name.size() > 0;
}
```

---

## 🔧 Security Headers

### vercel.json

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000" }
      ]
    }
  ]
}
```

### Netlify (_headers)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
```

---

## 📊 Testing

### Security Testing

```bash
# DevTools Security Tab
F12 → Security → Ver certificado, headers

# Network Tab
F12 → Network → Ver headers de response

# Console
F12 → Console → No debería haber errores

# Application
F12 → Application → Ver cookies, localStorage
```

### GDPR Testing

```bash
# 1. Cookie Banner
- Aparece después de 2 segundos
- Botones funcionan
- Preferencias se guardan

# 2. Data Export
- Descarga JSON completo
- Include todos los datos
- Formato machine-readable

# 3. Data Deletion
- Modal de confirmación
- Require escribir "ELIMINAR"
- Proceso claro
```

---

## 🎓 Best Practices

### Security

```typescript
// ✅ DO
- Validar TODOS los inputs
- Sanitizar antes de renderizar
- Usar HTTPS siempre
- Rate limiting en acciones críticas
- Security headers configurados

// ❌ DON'T
- Usar eval() o Function()
- Confiar en input del usuario
- Exponer API keys
- Deshabilitar CORS indiscriminadamente
- Ignorar npm audit
```

### GDPR

```typescript
// ✅ DO
- Pedir consentimiento ANTES de cookies
- Permitir rechazar sin consecuencias
- Facilitar exportación de datos
- Proceso claro de eliminación
- Transparencia total

// ❌ DON'T
- Pre-check de checkboxes
- Cookies antes de consentimiento
- Dificultar ejercicio de derechos
- Ocultar información en políticas
- Transferir datos sin base legal
```

---

## 📚 Documentación

### Completa:
- **PENETRATION_TESTING_GUIDE.md** - Pen testing paso a paso
- **SECURITY_AUDIT.md** - Vulnerabilidades y soluciones
- **GDPR_COMPLIANCE.md** - Checklist GDPR completo
- **SECURITY_AND_PRIVACY_SUMMARY.md** - Resumen ejecutivo

### Código:
- **src/utils/security.ts** - Utilidades de seguridad
- **src/components/CookieConsent.tsx** - Banner GDPR
- **src/components/DataExport.tsx** - Exportar datos
- **src/components/DataDeletionRequest.tsx** - Eliminar cuenta

---

## ✅ Estado Final

- ✅ Security framework completo
- ✅ GDPR compliance implementado
- ✅ Vulnerabilidades documentadas
- ✅ Fixes implementados
- ✅ Components funcionales
- ✅ Sin errores de linting

**¡Aplicación segura y compliant!** 🔒✅

```bash
npm run build
npm run deploy
```

