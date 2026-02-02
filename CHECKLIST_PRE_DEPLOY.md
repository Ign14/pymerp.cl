# ✅ Checklist Pre-Deploy

**Fecha:** 2026-02-02  
**Proyecto:** AgendaWeb - pymerp.cl

---

## 🎯 **REGLA DE ORO**

> **Deploy SOLO si Preview está perfecto.**  
> Dev puede tener problemas visuales (HMR), pero si Preview funciona → Deploy es seguro.

---

## ✅ **PASOS OBLIGATORIOS ANTES DE DEPLOY:**

### **1. Build y Preview** ⚡

```bash
# Limpiar dist anterior
rm -rf dist

# Build
npm run build

# Preview (producción local)
npm run preview
```

**Verificar:** http://localhost:4173

---

### **2. Validación Visual** 👁️

Abre estas URLs en Preview y verifica:

- [ ] **Landing:** http://localhost:4173/
- [ ] **Dashboard:** http://localhost:4173/dashboard
- [ ] **Página Pública:** http://localhost:4173/micarritodecomida
- [ ] **Setup:** http://localhost:4173/setup

**Checklist por página:**

#### **Landing** (/)
- [ ] Hero section se ve correctamente
- [ ] Botones "Comenzar Ahora" funcionan
- [ ] Sección "Cómo Funciona" carga
- [ ] Footer visible

#### **Dashboard** (/dashboard)
- [ ] Login funciona
- [ ] Sidebar visible
- [ ] Métricas cargan
- [ ] Navegación funciona

#### **Página Pública** (/micarritodecomida o tu slug)
- [ ] **Estilos se aplican correctamente** ← CRÍTICO
- [ ] Productos/servicios se ven
- [ ] Colores personalizados aparecen
- [ ] Carrito funciona (si aplica)
- [ ] WhatsApp FAB visible (si configurado)
- [ ] Responsive: prueba mobile y desktop

---

### **3. Tests Rápidos** 🧪

```bash
# Si tienes tests:
npm run test

# Lint (opcional pero recomendado):
npm run lint
```

---

### **4. Verificar Archivos Críticos** 📁

Antes de deploy, asegúrate de que estos archivos existen:

```bash
# Verificar dist/
ls dist/index.html
ls dist/assets/

# Verificar Firebase config
ls firebase.json
ls .firebaserc
ls firestore.rules
```

---

### **5. Variables de Entorno** 🔐

**Producción (`.env.production`):**

```bash
cat .env.production
```

Verificar que existan:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- (otros)

**Cloud Functions (`functions/.env`):**

```bash
cat functions/.env
```

Verificar:
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- (otros)

---

### **6. Git Status** 📝

```bash
# Ver cambios pendientes
git status

# Ver último commit
git log -1 --oneline
```

**Recomendación:** Commit antes de deploy.

```bash
git add .
git commit -m "fix: estilos públicos + mejoras HMR"
git push origin main
```

---

## 🚀 **COMANDO DE DEPLOY**

Una vez validado TODO lo anterior:

### **Opción 1: Deploy Completo (Hosting + Functions)**

```bash
firebase deploy --project agendaemprende-8ac77
```

### **Opción 2: Deploy Solo Hosting (Más Rápido)**

Si NO cambiaste Cloud Functions:

```bash
firebase deploy --only hosting --project agendaemprende-8ac77
```

### **Opción 3: Deploy Solo Functions**

Si SOLO cambiaste funciones:

```bash
firebase deploy --only functions --project agendaemprende-8ac77
```

---

## ⏱️ **Tiempos Estimados:**

| Deploy Tipo | Tiempo |
|-------------|--------|
| Solo Hosting | ~2-3 minutos |
| Solo Functions | ~5-8 minutos |
| Completo (Hosting + Functions) | ~8-12 minutos |

---

## ✅ **POST-DEPLOY: Verificación en Producción**

Una vez deployado, verifica:

### **1. Hosting**

```bash
# URL de producción
https://pymerp.cl
```

Abrir en navegador y verificar:
- [ ] Landing carga
- [ ] Página pública: https://pymerp.cl/micarritodecomida
- [ ] Estilos se aplican correctamente
- [ ] **Hard Refresh** (Ctrl+Shift+R) si no se ve

### **2. Functions**

```bash
# Verificar funciones deployadas
firebase functions:list --project agendaemprende-8ac77
```

Debe listar las 30 funciones.

### **3. Logs (si hay errores)**

```bash
# Ver logs de hosting
firebase hosting:channel:list --project agendaemprende-8ac77

# Ver logs de functions
firebase functions:log --project agendaemprende-8ac77 --limit 20
```

---

## 🐛 **Troubleshooting Post-Deploy**

### **Problema: "No se ven los estilos en producción"**

```bash
# Solución 1: Hard Refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Solución 2: Limpiar cache del navegador
```

### **Problema: "404 en página pública"**

Verificar `firebase.json` → `rewrites`:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/:slug",
        "function": "publicWebSeo"
      }
    ]
  }
}
```

### **Problema: "Funciones no responden"**

```bash
# Ver logs en tiempo real
firebase functions:log --project agendaemprende-8ac77
```

---

## 📊 **RESUMEN: ¿Cuándo NO Deployar?**

**NO DEPLOY si:**
- ❌ Preview tiene errores visuales
- ❌ Preview no carga (error 500)
- ❌ Tests fallan
- ❌ Hay errores de compilación (`npm run build` falla)
- ❌ `.env.production` está vacío o incorrecto

**SÍ DEPLOY si:**
- ✅ Preview se ve perfecto
- ✅ Build completa sin errores
- ✅ Variables de entorno configuradas
- ⚠️ Dev tiene problemas (HMR) pero Preview está bien

---

## 🎯 **TU CASO ACTUAL:**

```
Dev:     ❌ No se ve bien (HMR issue)
Preview: ✅ Perfecto
         ↓
Deploy:  ✅ SEGURO
```

**Razón:** El problema es específico del servidor de desarrollo (HMR con estilos inline). Preview es idéntico a producción, por lo que si Preview funciona, producción funcionará igual.

---

## 🚀 **WORKFLOW RECOMENDADO:**

```
1. Desarrollar en Dev
   ↓
2. npm run build
   ↓
3. npm run preview
   ↓
4. ¿Preview OK? 
   ├─ NO → Fix y volver a 2
   └─ SÍ → Deploy
          ↓
5. firebase deploy
   ↓
6. Verificar en producción
   ↓
7. Hard Refresh si es necesario
```

---

**Generado:** 2026-02-02  
**Estado:** ✅ Listo para deploy (Preview validado)
