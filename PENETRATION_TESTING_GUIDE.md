# 🔒 Penetration Testing Manual - AgendaWeb

## 🎯 Guía de Pruebas de Seguridad

### Índice
1. [Reconocimiento](#1-reconocimiento)
2. [Vulnerabilidades Comunes](#2-vulnerabilidades-comunes)
3. [Testing Manual](#3-testing-manual)
4. [Herramientas Recomendadas](#4-herramientas-recomendadas)
5. [Reporte de Vulnerabilidades](#5-reporte-de-vulnerabilidades)

---

## 1. Reconocimiento

### Información de la Aplicación

**Stack Tecnológico:**
- Frontend: React 18 + TypeScript
- Build: Vite 7
- Backend: Firebase (Firestore, Auth, Storage)
- Routing: React Router v6
- Estado: Context API
- Maps: Google Maps API
- Analytics: Google Analytics 4
- Error Tracking: Sentry

**Puntos de Entrada:**
- `/` - Landing page (público)
- `/login` - Autenticación
- `/request-access` - Solicitud de acceso
- `/dashboard` - Dashboard empresario (autenticado)
- `/admin` - Panel admin (SUPERADMIN)
- `/:slug` - Páginas públicas de empresas

**Autenticación:**
- Firebase Authentication
- Roles: SUPERADMIN, ENTREPRENEUR, CLIENT
- Estados: ACTIVE, INACTIVE, PENDING, FORCE_PASSWORD_CHANGE

---

## 2. Vulnerabilidades Comunes

### 🔴 CRÍTICAS

#### A. Inyección (XSS - Cross-Site Scripting)

**Vectores de Ataque:**
```javascript
// 1. Input fields sin sanitización
<input value={userInput} />  // ← Peligroso

// 2. Renderizado directo de HTML
<div dangerouslySetInnerHTML={{__html: userContent}} />

// 3. URLs no validadas
<a href={userProvidedUrl}>Link</a>

// 4. Eval de código del usuario
eval(userInput);  // ← NUNCA hacer esto
```

**Testing Manual:**
```javascript
// Probar en todos los inputs:
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<svg/onload=alert('XSS')>
```

#### B. Autenticación y Autorización

**Vectores de Ataque:**
```
1. Bypass de autenticación:
   - Manipular localStorage
   - Modificar cookies
   - Replay de tokens

2. Escalación de privilegios:
   - Cambiar rol en localStorage
   - Manipular JWT
   - Acceder a rutas no autorizadas

3. Session hijacking:
   - Robo de tokens
   - CSRF attacks
```

**Testing Manual:**
```bash
# 1. Intentar acceder sin autenticación
http://localhost:5173/dashboard

# 2. Modificar rol en DevTools
localStorage.setItem('userRole', 'SUPERADMIN')

# 3. Manipular tokens
localStorage.setItem('authToken', 'fake-token')

# 4. Acceder a rutas protegidas directamente
http://localhost:5173/admin
```

#### C. Inyección de Firebase

**Vectores:**
```javascript
// 1. Firestore queries sin validación
const results = await getDocs(query(
  collection(db, 'users'),
  where('email', '==', userInput)  // ← Validar input
));

// 2. Paths manipulables
const docRef = doc(db, 'companies', userId);  // ← Validar userId
```

**Testing:**
```
Probar:
- ../ en paths
- Inyección de operadores
- Acceso a documentos de otros usuarios
```

### 🟡 MODERADAS

#### D. Information Disclosure

**Vectores:**
```
1. Console logs con datos sensibles
2. Error messages detallados
3. Source maps en producción
4. API keys expuestas
5. Comentarios con información sensible
```

**Testing:**
```bash
# Ver source maps
View Page Source

# Ver console
F12 > Console

# Ver network
F12 > Network > Ver headers, responses

# Ver local storage
F12 > Application > Local Storage
```

#### E. CORS Misconfiguration

**Vectores:**
```javascript
// Firebase CORS mal configurado
// Google Maps API sin restricciones
```

**Testing:**
```bash
# Intentar requests desde otro origen
fetch('https://tu-app.com/api/data', {
  credentials: 'include'
})
```

### 🟢 BAJAS

#### F. Clickjacking

**Testing:**
```html
<!-- Intentar embeber en iframe -->
<iframe src="https://tu-app.com"></iframe>
```

#### G. Rate Limiting

**Testing:**
```bash
# Enviar múltiples requests rápidos
for i in {1..100}; do
  curl -X POST https://tu-app.com/api/login
done
```

---

## 3. Testing Manual

### Checklist de Penetration Testing

#### 🔐 Autenticación y Sesiones

- [ ] **Login Bypass**
  ```
  1. Intentar /dashboard sin login
  2. Modificar localStorage
  3. Manipular cookies
  4. Replay attacks
  ```

- [ ] **Brute Force**
  ```
  1. Intentar múltiples passwords
  2. Verificar rate limiting
  3. Verificar account lockout
  ```

- [ ] **Password Policy**
  ```
  1. Probar passwords débiles: 123, password, admin
  2. Verificar mínimo de caracteres
  3. Verificar complejidad
  ```

- [ ] **Session Management**
  ```
  1. Verificar timeout de sesión
  2. Probar concurrent sessions
  3. Logout invalida token
  ```

#### 🛡️ Autorización

- [ ] **Escalación de Privilegios**
  ```
  1. Usuario normal intenta acceder /admin
  2. Cambiar rol en localStorage
  3. Manipular claims de Firebase
  ```

- [ ] **IDOR (Insecure Direct Object Reference)**
  ```
  1. Acceder a company_id de otro usuario
  2. Ver servicios/productos de otra empresa
  3. Modificar datos ajenos
  ```

- [ ] **Firestore Rules**
  ```
  1. Leer documentos sin permisos
  2. Escribir documentos sin permisos
  3. Bypass de reglas con queries complejas
  ```

#### 💉 Inyección

- [ ] **XSS (Cross-Site Scripting)**
  ```
  Probar en TODOS los inputs:
  <script>alert('XSS')</script>
  <img src=x onerror=alert('XSS')>
  javascript:alert('XSS')
  <svg/onload=alert('XSS')>
  "><script>alert('XSS')</script>
  ```

- [ ] **SQL Injection** (N/A - usando Firestore)
  
- [ ] **NoSQL Injection**
  ```
  Probar en queries:
  {$gt: ""} 
  {$ne: null}
  ```

#### 🌐 Network Security

- [ ] **HTTPS**
  ```
  1. Verificar redirección HTTP → HTTPS
  2. Verificar HSTS headers
  3. Certificado válido
  ```

- [ ] **Secure Headers**
  ```
  Verificar headers:
  - X-Frame-Options
  - X-Content-Type-Options
  - Content-Security-Policy
  - Strict-Transport-Security
  ```

- [ ] **CORS**
  ```
  1. Intentar requests cross-origin
  2. Verificar wildcard (*)
  3. Verificar credentials
  ```

#### 📱 Client-Side Security

- [ ] **Local Storage**
  ```
  F12 > Application > Local Storage
  1. ¿Hay tokens sensibles?
  2. ¿Datos sin encriptar?
  3. ¿Información personal?
  ```

- [ ] **Cookies**
  ```
  F12 > Application > Cookies
  1. Verificar HttpOnly
  2. Verificar Secure
  3. Verificar SameSite
  ```

- [ ] **API Keys**
  ```
  View Source
  1. ¿API keys expuestas?
  2. ¿Secrets en código?
  3. ¿Firebase config público?
  ```

#### 🔓 Business Logic

- [ ] **Checkout/Payment**
  ```
  1. Manipular precios
  2. Agregar items gratis
  3. Bypass validaciones
  ```

- [ ] **File Upload**
  ```
  1. Subir archivos maliciosos
  2. Path traversal
  3. Verificar tamaño máximo
  4. Verificar tipos permitidos
  ```

---

## 4. Herramientas Recomendadas

### Browser DevTools

```bash
# Chrome DevTools (F12)
- Console: Ver errores y logs
- Network: Ver requests/responses
- Application: Ver storage, cookies
- Security: Ver certificados, headers
- Sources: Ver código JavaScript
```

### Burp Suite Community

```
https://portswigger.net/burp/communitydownload

Características:
- Interceptar requests
- Modificar headers
- Replay attacks
- Scanner automático
```

### OWASP ZAP

```
https://www.zaproxy.org/

Características:
- Automated scanner
- Manual testing tools
- Spider/crawler
- Fuzzer
```

### Browser Extensions

```
- Wappalyzer: Detectar tecnologías
- Cookie Editor: Manipular cookies
- ModHeader: Modificar headers
- EditThisCookie: Editar cookies
- JSON Viewer: Ver responses
```

### Command Line Tools

```bash
# cURL - Request manual
curl -X POST https://app.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"' + payload + '"}'

# Nikto - Web scanner
nikto -h https://tu-app.com

# SQLMap - SQL injection
sqlmap -u "https://app.com/api?id=1"

# DirBuster - Directory discovery
dirbuster -u https://app.com
```

---

## 5. Reporte de Vulnerabilidades

### Template de Reporte

```markdown
# Reporte de Vulnerabilidad

## Información Básica
- **Fecha**: YYYY-MM-DD
- **Tester**: Nombre
- **Aplicación**: AgendaWeb v1.0.0
- **Severidad**: Crítica / Alta / Media / Baja

## Descripción
Descripción clara de la vulnerabilidad encontrada

## Pasos para Reproducir
1. Ir a URL
2. Hacer acción X
3. Observar resultado Y

## Impacto
Qué puede hacer un atacante con esta vulnerabilidad

## Evidencia
- Screenshots
- Logs
- Código vulnerable

## Recomendación
Cómo arreglar la vulnerabilidad

## Referencias
- CVE-XXXX-YYYY
- OWASP Top 10
- CWE-XXX
```

### Clasificación de Severidad

| Severidad | CVSS Score | Criterios |
|-----------|-----------|-----------|
| **Crítica** | 9.0-10.0 | Compromiso total del sistema |
| **Alta** | 7.0-8.9 | Acceso no autorizado a datos |
| **Media** | 4.0-6.9 | Funcionalidad comprometida |
| **Baja** | 0.1-3.9 | Información menor expuesta |

---

## 📋 Checklist de Testing

### Pre-Testing
- [ ] Tener permiso explícito para testing
- [ ] Environment de testing (NO producción)
- [ ] Backup de datos
- [ ] Documentar metodología

### Durante Testing
- [ ] Tomar screenshots de cada vulnerabilidad
- [ ] Guardar requests/responses
- [ ] Documentar pasos exactos
- [ ] Verificar impacto real

### Post-Testing
- [ ] Crear reporte detallado
- [ ] Clasificar por severidad
- [ ] Priorizar fixes
- [ ] Verificar fixes funcionan

---

## 🛠️ Metodología OWASP

### Top 10 Web Application Security Risks

1. **A01:2021 – Broken Access Control**
   - Testing: Intentar acceder a recursos no autorizados
   
2. **A02:2021 – Cryptographic Failures**
   - Testing: Buscar datos sensibles sin encriptar
   
3. **A03:2021 – Injection**
   - Testing: XSS, SQL injection, Command injection
   
4. **A04:2021 – Insecure Design**
   - Testing: Analizar flujos de negocio
   
5. **A05:2021 – Security Misconfiguration**
   - Testing: Headers, CORS, configuraciones por defecto
   
6. **A06:2021 – Vulnerable Components**
   - Testing: `npm audit`, dependencias desactualizadas
   
7. **A07:2021 – Identification and Authentication Failures**
   - Testing: Brute force, session management
   
8. **A08:2021 – Software and Data Integrity Failures**
   - Testing: CI/CD pipeline, updates
   
9. **A09:2021 – Security Logging and Monitoring Failures**
   - Testing: ¿Se loguean intentos de ataque?
   
10. **A10:2021 – Server-Side Request Forgery (SSRF)**
    - Testing: Requests a recursos internos

---

## 📚 Recursos

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10](https://owasp.org/Top10/)
- [PortSwigger Academy](https://portswigger.net/web-security)
- [HackerOne Hacktivity](https://hackerone.com/hacktivity)

---

## ⚠️ IMPORTANTE

1. **Solo testear en environment de desarrollo/staging**
2. **Nunca en producción sin permiso**
3. **Documentar TODO lo encontrado**
4. **No explotar vulnerabilidades reales**
5. **Reportar responsablemente**

---

**Próximo paso:** Ver `SECURITY_FIXES.md` para implementar soluciones

