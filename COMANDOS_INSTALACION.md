# 🚀 Comandos de Instalación y Prueba - AGENDAWEB

## 📦 Instalación Inicial

```bash
# 1. Instalar todas las dependencias
npm ci

# O si prefieres usar npm install (recomendado para desarrollo)
npm install
```

## 🔧 Verificación de Tipos y Compilación

```bash
# Verificar tipos TypeScript (sin generar archivos)
npm run typecheck
# O directamente:
npx tsc --noEmit

# Compilar y verificar que todo esté correcto
npm run build
```

## 🧪 Testing

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar tests de un archivo específico
npx vitest run src/services/__tests__/events.test.ts
npx vitest run src/services/__tests__/menu.test.ts

# Ejecutar tests E2E (si están configurados)
npm run test:e2e
```

## 🏃 Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:5173
```

## 🏗️ Build para Producción

```bash
# Compilar para producción
npm run build

# Los archivos compilados estarán en: dist/
```

## 🚀 Deploy

```bash
# Deploy completo (build + deploy a Firebase)
npm run deploy

# O paso a paso:
npm run build
firebase deploy

# Deploy solo hosting
firebase deploy --only hosting

# Deploy solo functions
firebase deploy --only functions

# Deploy solo firestore rules
firebase deploy --only firestore:rules
```

## 🔍 Verificación Post-Instalación

```bash
# 1. Verificar que no hay errores de tipos
npm run typecheck

# 2. Verificar que el build funciona
npm run build

# 3. Iniciar servidor de desarrollo y probar manualmente
npm run dev

# 4. Ejecutar tests
npm run test
```

## 🐛 Solución de Problemas

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de npm
npm cache clean --force

# Verificar versión de Node.js (requiere Node 18+)
node --version

# Verificar versión de npm
npm --version
```

## 📋 Checklist de Verificación

- [ ] `npm ci` ejecutado sin errores
- [ ] `npm run typecheck` sin errores TypeScript
- [ ] `npm run build` compila correctamente
- [ ] `npm run dev` inicia el servidor
- [ ] La aplicación carga en el navegador
- [ ] `npm run test` pasa todos los tests
- [ ] El botón "Menú" aparece en la sección de productos (para categoría restaurantes_comida_rapida)

## 🎯 Comandos Rápidos (Copy & Paste)

```bash
# Instalación completa
npm ci && npm run typecheck && npm run build

# Desarrollo
npm run dev

# Tests
npm run test

# Deploy
npm run deploy
```

