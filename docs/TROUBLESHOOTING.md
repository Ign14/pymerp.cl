# 🔧 Troubleshooting Guide

Guía de solución de problemas comunes en PYM-ERP.

## Tabla de Contenidos

- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Despliegue](#despliegue)
- [Firebase](#firebase)
- [Producción](#producción)

---

## Configuración

### ❌ Error: Variables de entorno no cargadas

**Problema:**
```
Cannot find module '@env' or variables are undefined
```

**Causas:**
- Archivo `.env.local` no existe
- Variables sin prefijo `VITE_`
- Servidor de desarrollo no reiniciado después de cambios

**Soluciones:**

1. **Crear `.env.local` en la raíz del proyecto:**
   ```bash
   cp .env.example .env.local
   ```

2. **Verificar que todas las variables tengan prefijo `VITE_`:**
   ```env
   VITE_FIREBASE_API_KEY=your-key
   VITE_FIREBASE_PROJECT_ID=your-project
   ```

3. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Verificar en código:**
   ```typescript
   console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
   ```

---

### ❌ Error: Firebase configuration invalid

**Problema:**
```
Firebase: Error (auth/invalid-api-key)
```

**Causas:**
- API key incorrecta o inválida
- Proyecto de Firebase no configurado correctamente
- Restricciones de API key en Google Cloud Console

**Soluciones:**

1. **Verificar Firebase Console:**
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Proyecto > Configuración del proyecto > Tus apps
   - Copia las credenciales correctas

2. **Verificar restricciones de API:**
   - Google Cloud Console > APIs & Services > Credentials
   - Busca tu API key de Firebase
   - Verifica que los dominios autorizados incluyan `localhost`

3. **Regenerar API key si es necesario:**
   - Crea una nueva Web App en Firebase Console
   - Actualiza todas las variables en `.env.local`

---

### ❌ TypeScript errors después de actualizar dependencias

**Problema:**
```
Type 'X' is not assignable to type 'Y'
```

**Soluciones:**

1. **Limpiar cache de TypeScript:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Verificar versiones compatibles:**
   ```bash
   npm list firebase react react-router-dom
   ```

3. **Reinstalar dependencias:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Desarrollo

### ❌ Hot Module Replacement (HMR) no funciona

**Problema:**
El navegador no actualiza al guardar cambios en archivos.

**Causas:**
- Demasiados archivos abiertos (límite de sistema)
- Ruta absoluta mal configurada
- Problema con websocket del servidor Vite

**Soluciones:**

1. **Aumentar límite de archivos en Linux/Mac:**
   ```bash
   # Temporal
   ulimit -n 4096
   
   # Permanente (editar ~/.bashrc o ~/.zshrc)
   echo "ulimit -n 4096" >> ~/.bashrc
   ```

2. **Verificar configuración de Vite:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       watch: {
         usePolling: true, // Para sistemas de archivos problemáticos
       },
       hmr: {
         overlay: true,
       },
     },
   });
   ```

3. **Reiniciar servidor con cache limpio:**
   ```bash
   npm run dev -- --force
   ```

---

### ❌ Puerto 5173 ya en uso

**Problema:**
```
Error: Port 5173 is already in use
```

**Soluciones:**

1. **Matar proceso existente (Linux/Mac):**
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. **Matar proceso existente (Windows):**
   ```cmd
   netstat -ano | findstr :5173
   taskkill /PID [PID_NUMBER] /F
   ```

3. **Usar puerto diferente:**
   ```bash
   npm run dev -- --port 3000
   ```

---

### ❌ Errores de ESLint molestos

**Problema:**
Demasiados warnings o errores de linting que bloquean desarrollo.

**Soluciones:**

1. **Deshabilitar temporalmente:**
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const data: any = ...
   ```

2. **Configurar reglas en `.eslintrc.cjs`:**
   ```javascript
   rules: {
     '@typescript-eslint/no-explicit-any': 'warn', // cambiar a warn
     'react/prop-types': 'off', // desactivar
   }
   ```

3. **Ejecutar autofix:**
   ```bash
   npm run lint -- --fix
   ```

---

## Testing

### ❌ Tests E2E fallan con timeout

**Problema:**
```
Test timeout of 30000ms exceeded
```

**Causas:**
- Servidor de desarrollo no iniciado
- Firebase lento o sin conexión
- Selectores incorrectos

**Soluciones:**

1. **Aumentar timeout en playwright.config.ts:**
   ```typescript
   export default defineConfig({
     timeout: 60000, // 60 segundos
     expect: {
       timeout: 10000,
     },
   });
   ```

2. **Usar modo E2E con mocks:**
   ```bash
   npm run test:e2e:mock
   ```

3. **Verificar que el servidor esté corriendo:**
   ```bash
   # Terminal 1
   npm run dev:e2e
   
   # Terminal 2
   npm run test:e2e
   ```

---

### ❌ Tests unitarios fallan con Firebase

**Problema:**
```
Firebase: No Firebase App '[DEFAULT]' has been created
```

**Solución:**

1. **Mockear Firebase en tests:**
   ```typescript
   vi.mock('../config/firebase', () => ({
     auth: {},
     db: {},
     storage: {},
   }));
   ```

2. **Usar variables de entorno de test:**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       env: {
         VITE_E2E_MODE: 'true',
       },
     },
   });
   ```

---

### ❌ Playwright no instala navegadores

**Problema:**
```
Executable doesn't exist at /path/to/browsers
```

**Soluciones:**

1. **Instalar navegadores manualmente:**
   ```bash
   npx playwright install
   ```

2. **Instalar solo Chromium (más rápido):**
   ```bash
   npx playwright install chromium
   ```

3. **Verificar instalación:**
   ```bash
   npx playwright --version
   ```

---

## Despliegue

### ❌ Error al desplegar con Firebase CLI

**Problema:**
```
Error: HTTP Error: 403, Permission denied
```

**Causas:**
- No autenticado con Firebase CLI
- Falta de permisos en el proyecto
- Proyecto incorrecto seleccionado

**Soluciones:**

1. **Verificar autenticación:**
   ```bash
   firebase login --reauth
   ```

2. **Listar proyectos disponibles:**
   ```bash
   firebase projects:list
   ```

3. **Seleccionar proyecto correcto:**
   ```bash
   firebase use <project-id>
   ```

4. **Verificar permisos en Firebase Console:**
   - IAM & Admin > Verifica que tu usuario tenga rol "Editor" o "Owner"

---

### ❌ Build falla con error de memoria

**Problema:**
```
JavaScript heap out of memory
```

**Soluciones:**

1. **Aumentar límite de memoria de Node:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. **Limpiar cache antes de build:**
   ```bash
   rm -rf node_modules/.vite dist
   npm run build
   ```

3. **Actualizar scripts en package.json:**
   ```json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
     }
   }
   ```

---

### ❌ Cloud Functions no se despliegan

**Problema:**
```
Error: Failed to deploy functions
```

**Causas:**
- Node version incorrecta
- Dependencias mal instaladas
- Permisos insuficientes

**Soluciones:**

1. **Verificar Node version:**
   ```bash
   cd functions
   node --version  # Debe ser 20.x
   ```

2. **Reinstalar dependencias de functions:**
   ```bash
   cd functions
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ```

3. **Deploy solo functions:**
   ```bash
   firebase deploy --only functions
   ```

4. **Ver logs de error:**
   ```bash
   firebase functions:log
   ```

---

## Firebase

### ❌ Firestore Permission Denied

**Problema:**
```
FirebaseError: Missing or insufficient permissions
```

**Causas:**
- Reglas de seguridad mal configuradas
- Usuario no autenticado
- Custom claims no actualizados

**Soluciones:**

1. **Verificar reglas en Firebase Console:**
   - Firestore Database > Rules
   - Copiar y comparar con `firestore.rules`

2. **Verificar autenticación:**
   ```typescript
   import { auth } from './config/firebase';
   console.log('User:', auth.currentUser);
   ```

3. **Forzar refresh de token:**
   ```typescript
   const user = auth.currentUser;
   if (user) {
     await user.getIdToken(true); // force refresh
     await user.reload();
   }
   ```

4. **Hacer logout/login para aplicar custom claims:**
   - Custom claims se aplican solo después de refrescar token

---

### ❌ Storage upload falla

**Problema:**
```
FirebaseError: storage/unauthorized
```

**Causas:**
- Reglas de storage restrictivas
- Archivo excede 5MB
- Ruta incorrecta

**Soluciones:**

1. **Verificar tamaño de archivo:**
   ```typescript
   if (file.size > 5 * 1024 * 1024) {
     throw new Error('Archivo muy grande (max 5MB)');
   }
   ```

2. **Verificar formato permitido:**
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
   if (!allowedTypes.includes(file.type)) {
     throw new Error('Formato no permitido');
   }
   ```

3. **Verificar reglas en Firebase Console:**
   - Storage > Rules
   - Copiar y comparar con `storage.rules`

---

### ❌ SendGrid emails no se envían

**Problema:**
Emails no llegan a destino.

**Causas:**
- SendGrid API key inválida
- Email no verificado
- Sender domain no autenticado
- Rate limits excedidos

**Soluciones:**

1. **Verificar API key en Firebase Functions:**
   ```bash
   firebase functions:config:get sendgrid
   ```

2. **Configurar API key:**
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_API_KEY"
   firebase deploy --only functions
   ```

3. **Verificar email en SendGrid:**
   - SendGrid > Settings > Sender Authentication
   - Verificar single sender o domain

4. **Ver logs de functions:**
   ```bash
   firebase functions:log --only sendAccessRequestEmailHttp
   ```

5. **Testing local:**
   ```typescript
   // Llamar HTTP function directamente
   const response = await fetch(functionUrl, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(data),
   });
   console.log(await response.json());
   ```

---

## Producción

### ❌ 404 al refrescar página en producción

**Problema:**
Página funciona en desarrollo pero da 404 al refrescar en producción.

**Causa:**
Firebase Hosting no configurado para SPA.

**Solución:**

Verificar que `firebase.json` tenga:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### ❌ Analytics no trackea eventos

**Problema:**
Google Analytics no muestra datos de eventos personalizados.

**Causas:**
- GA4 no configurado correctamente
- Consent mode bloqueando tracking
- Measurement ID incorrecto

**Soluciones:**

1. **Verificar Measurement ID:**
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. **Verificar en GA4:**
   - Google Analytics > Admin > Data Streams
   - Copiar Measurement ID correcto

3. **Probar en modo debug:**
   ```bash
   # Instalar Chrome Extension: Google Analytics Debugger
   # O usar:
   npm run dev
   # Abrir console y ver logs de GA
   ```

4. **Verificar consent:**
   ```typescript
   // src/config/analytics.ts
   console.log('Analytics initialized:', isAnalyticsEnabled);
   ```

---

### ❌ Slug duplicado al crear empresa

**Problema:**
```
Error creating company: Slug already exists
```

**Causa:**
Dos empresas intentan usar el mismo slug.

**Soluciones:**

1. **Verificar slug antes de crear:**
   ```typescript
   import { getCompanyBySlug } from './services/firestore';
   
   const existing = await getCompanyBySlug(slug);
   if (existing) {
     throw new Error('Slug ya está en uso');
   }
   ```

2. **Agregar sufijo numérico automático:**
   ```typescript
   let finalSlug = slug;
   let counter = 1;
   while (await getCompanyBySlug(finalSlug)) {
     finalSlug = `${slug}-${counter}`;
     counter++;
   }
   ```

3. **Validación en Firestore rules:**
   ```javascript
   // firestore.rules
   match /companies/{companyId} {
     allow create: if !exists(/databases/$(database)/documents/companies/$(request.resource.data.slug));
   }
   ```

---

### ❌ Custom claims no aplican inmediatamente

**Problema:**
Usuario no puede acceder a recursos después de aprobación.

**Causa:**
Custom claims solo aplican después de refrescar token.

**Soluciones:**

1. **Forzar logout/login después de setCustomUserClaims:**
   ```typescript
   // En AdminDashboard después de aprobar
   await setCompanyClaim(userId, companyId);
   
   // Mostrar mensaje
   toast.info('Por favor, vuelve a iniciar sesión para aplicar cambios');
   
   // Opcional: logout automático
   await logOut();
   ```

2. **Refresh token manualmente (menos confiable):**
   ```typescript
   const user = auth.currentUser;
   if (user) {
     await user.getIdToken(true);
     await user.reload();
     window.location.reload();
   }
   ```

---

### ❌ Map no carga en producción

**Problema:**
Google Maps no funciona en dominio de producción.

**Causa:**
API key de Maps tiene restricciones de dominio.

**Solución:**

1. **Google Cloud Console:**
   - APIs & Services > Credentials
   - Editar API key de Maps
   - Application restrictions > HTTP referrers
   - Agregar dominios:
     - `localhost:*` (desarrollo)
     - `*.web.app` (Firebase Hosting)
     - `tu-dominio.com` (producción)

2. **Verificar en código:**
   ```typescript
   console.log('Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
   ```

---

## Contacto y Soporte

Si ninguna solución funciona:

1. **Revisar logs:**
   ```bash
   # Logs de functions
   firebase functions:log
   
   # Logs de hosting
   firebase hosting:logs
   ```

2. **Buscar en Issues de GitHub:**
   - [GitHub Issues](https://github.com/tu-repo/issues)
   - Filtrar por etiqueta `bug` o `help wanted`

3. **Crear nuevo Issue:**
   - Incluir mensaje de error completo
   - Pasos para reproducir
   - Versión de Node, npm, y dependencias
   - Screenshots si aplica

4. **Revisar documentación oficial:**
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Vite Docs](https://vitejs.dev/)
   - [React Router Docs](https://reactrouter.com/)

---

**Última actualización:** Diciembre 2025
