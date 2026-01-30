# 🚀 Comandos de Instalación y Deploy Final

## 📋 Prerequisitos

- Node.js 20.x o superior
- npm 9.x o superior
- Firebase CLI instalado y autenticado
- Git (opcional, para versionado)

```bash
# Verificar versiones
node --version  # Debe ser 20.x o superior
npm --version   # Debe ser 9.x o superior
firebase --version  # Debe estar instalado
```

---

## 🔧 Instalación

### 1. Instalar Dependencias

```bash
# Instalación limpia (recomendado para producción)
npm ci

# O si prefieres instalar desde cero
rm -rf node_modules package-lock.json
npm install
```

### 2. Instalar Dependencias de Functions

```bash
cd functions
npm ci
cd ..
```

---

## ✅ Verificación Pre-Deploy

### 1. Verificar TypeScript

```bash
npm run typecheck
# O directamente:
npx tsc --noEmit
```

**✅ Debe completar sin errores**

### 2. Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests E2E (opcional, puede tardar)
npm run test:e2e
```

**✅ Todos los tests deben pasar**

### 3. Build de Producción

```bash
npm run build
```

**✅ Debe compilar sin errores y generar carpeta `dist/`**

### 4. Verificar Build Localmente (Opcional)

```bash
npm run preview
# Abre http://localhost:4173
```

---

## 🚀 Deploy a Firebase

### Opción 1: Deploy Completo (Recomendado)

```bash
# Build + Deploy todo (hosting, functions, firestore rules, storage)
npm run deploy
```

### Opción 2: Deploy por Componentes

```bash
# 1. Build
npm run build

# 2. Deploy Hosting (frontend)
firebase deploy --only hosting

# 3. Deploy Functions (backend)
firebase deploy --only functions

# 4. Deploy Firestore Rules (seguridad)
firebase deploy --only firestore:rules

# 5. Deploy Storage Rules (seguridad)
firebase deploy --only storage
```

### Opción 3: Deploy Solo Frontend

```bash
npm run deploy:hosting
```

---

## 🔍 Verificación Post-Deploy

### 1. Verificar Hosting

```bash
# Verificar que el sitio está en línea
firebase hosting:channel:list
```

**URLs de producción:**
- `https://agendaemprende-8ac77.web.app/`
- `https://agendaemprende-8ac77.firebaseapp.com/`

### 2. Verificar Functions

```bash
# Ver logs de functions
firebase functions:log

# Ver estado de functions
firebase functions:list
```

### 3. Verificar Firestore Rules

```bash
# Ver reglas desplegadas
firebase firestore:rules:get
```

---

## 🧪 Testing en Producción

### 1. Verificar Funcionalidad Básica

- [ ] Landing page carga correctamente
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Páginas públicas funcionan

### 2. Verificar Analytics

- [ ] Google Analytics está activo
- [ ] Eventos se trackean correctamente
- [ ] No hay errores en consola del navegador

### 3. Verificar Performance

```bash
# Lighthouse audit (desde terminal)
npm run lighthouse:prod

# O manualmente desde Chrome DevTools
# Lighthouse > Generate report
```

**Métricas objetivo:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 🔄 Rollback (Si es Necesario)

### Rollback de Hosting

```bash
# Ver releases anteriores
firebase hosting:channel:list

# Rollback a versión anterior
firebase hosting:rollback
```

### Rollback de Functions

```bash
# Ver versiones anteriores
firebase functions:list

# Desplegar versión anterior manualmente
cd functions
git checkout <commit-hash>
npm run build
cd ..
firebase deploy --only functions
```

---

## 🛠️ Comandos de Mantenimiento

### Limpiar y Reinstalar

```bash
# Limpiar todo
rm -rf node_modules package-lock.json dist
rm -rf functions/node_modules functions/package-lock.json functions/lib

# Reinstalar
npm install
cd functions && npm install && cd ..
```

### Actualizar Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias (cuidado: puede romper cosas)
npm update

# Actualizar dependencias de functions
cd functions
npm update
cd ..
```

### Verificar Seguridad

```bash
# Auditoría de seguridad
npm audit

# Fix automático (si es posible)
npm audit fix
```

---

## 📝 Checklist Final Pre-Deploy

Antes de hacer deploy a producción, verifica:

- [ ] `npm ci` ejecutado sin errores
- [ ] `npm run typecheck` sin errores TypeScript
- [ ] `npm run build` compila correctamente
- [ ] `npm run test` pasa todos los tests
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Firebase CLI autenticado (`firebase login`)
- [ ] Proyecto Firebase seleccionado (`firebase use <project-id>`)
- [ ] Firestore rules revisadas y seguras
- [ ] Storage rules revisadas y seguras
- [ ] Functions configuradas (variables de entorno si aplica)
- [ ] Google Analytics configurado (GA4_MEASUREMENT_ID)
- [ ] Google Maps API Key configurada
- [ ] Dominios autorizados en Firebase Authentication

---

## 🎯 Comandos Rápidos (Copy & Paste)

### Instalación Completa

```bash
npm ci && cd functions && npm ci && cd .. && npm run typecheck && npm run build
```

### Deploy Completo

```bash
npm run build && firebase deploy
```

### Deploy Solo Frontend

```bash
npm run deploy:hosting
```

### Verificación Completa

```bash
npm run typecheck && npm run test && npm run build
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Firebase CLI not found"

```bash
npm install -g firebase-tools
firebase login
```

### Error: "Build failed"

```bash
# Limpiar y reconstruir
rm -rf dist node_modules/.vite
npm run build
```

### Error: "Functions deploy timeout"

```bash
# Desplegar functions por separado
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Error: "Firestore rules invalid"

```bash
# Validar reglas localmente
firebase firestore:rules:validate
```

---

## 📚 Referencias

- **Documentación Firebase:** https://firebase.google.com/docs
- **Documentación Vite:** https://vitejs.dev/
- **Documentación TypeScript:** https://www.typescriptlang.org/

---

## 🎉 ¡Deploy Exitoso!

Una vez completado el deploy, verifica:

1. ✅ El sitio está accesible en la URL de producción
2. ✅ No hay errores en la consola del navegador
3. ✅ Las funciones están activas
4. ✅ Los logs no muestran errores críticos
5. ✅ Analytics está funcionando

**¡Listo para producción!** 🚀

