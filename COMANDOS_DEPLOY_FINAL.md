# 🚀 Comandos de Instalación y Deploy Final

## ⚡ Comandos Rápidos (Copy & Paste)

### Instalación Completa
```bash
npm ci && cd functions && npm ci && cd ..
```

### Verificación Pre-Deploy
```bash
npm run typecheck && npm run test && npm run build
```

### Deploy Completo
```bash
npm run deploy
```

### Deploy Solo Frontend
```bash
npm run deploy:hosting
```

---

## 📋 Pasos Detallados

### 1. Instalación

```bash
# Instalar dependencias del proyecto
npm ci

# Instalar dependencias de Firebase Functions
cd functions
npm ci
cd ..
```

### 2. Verificación

```bash
# Verificar TypeScript (sin errores)
npm run typecheck

# Ejecutar tests unitarios
npm run test

# Build de producción
npm run build
```

**✅ Si todo pasa, continuar con deploy**

### 3. Deploy

#### Opción A: Deploy Completo (Recomendado)
```bash
npm run deploy
```

#### Opción B: Deploy por Componentes
```bash
# 1. Build
npm run build

# 2. Deploy Hosting
firebase deploy --only hosting

# 3. Deploy Functions
firebase deploy --only functions

# 4. Deploy Firestore Rules
firebase deploy --only firestore:rules

# 5. Deploy Storage Rules
firebase deploy --only storage
```

---

## ✅ Checklist Pre-Deploy

- [ ] `npm ci` ejecutado sin errores
- [ ] `npm run typecheck` sin errores
- [ ] `npm run build` compila correctamente
- [ ] `npm run test` pasa todos los tests
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Firebase CLI autenticado (`firebase login`)
- [ ] Proyecto Firebase seleccionado (`firebase use <project-id>`)

---

## 🔍 Verificación Post-Deploy

```bash
# Verificar hosting
firebase hosting:channel:list

# Ver logs de functions
firebase functions:log

# Verificar reglas de Firestore
firebase firestore:rules:get
```

**URLs de producción:**
- `https://agendaemprende-8ac77.web.app/`
- `https://agendaemprende-8ac77.firebaseapp.com/`

---

## 🐛 Solución de Problemas

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### Error: "Build failed"
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Limpiar y Reinstalar
```bash
rm -rf node_modules package-lock.json dist
rm -rf functions/node_modules functions/package-lock.json functions/lib
npm install
cd functions && npm install && cd ..
```

---

## 📚 Documentación Completa

- **Guía completa:** [DEPLOY_FINAL.md](./DEPLOY_FINAL.md)
- **Checklist detallado:** [DEPLOY_READY_CHECKLIST.md](./DEPLOY_READY_CHECKLIST.md)
- **Comandos de instalación:** [COMANDOS_INSTALACION.md](./COMANDOS_INSTALACION.md)

---

## 🎯 Comando Todo-en-Uno

```bash
# Instalación + Verificación + Deploy
npm ci && cd functions && npm ci && cd .. && npm run typecheck && npm run build && npm run deploy
```

**⚠️ Solo ejecutar si estás seguro de que todo está listo**

---

## ✅ Verificación Final

Después del deploy, verificar:

1. ✅ Sitio accesible en URL de producción
2. ✅ No hay errores en consola del navegador
3. ✅ Login funciona
4. ✅ Dashboard carga correctamente
5. ✅ Páginas públicas funcionan
6. ✅ Analytics está activo (GA4 Realtime)

**¡Deploy exitoso!** 🚀

