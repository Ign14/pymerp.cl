# 🐛 Cómo Debuggear Estilos en Páginas Públicas

## ✅ Debug Logging Agregado

He agregado logs de consola temporales en `PublicPage.tsx` para ayudarte a identificar el problema exacto.

---

## 🔍 Paso a Paso para Diagnosticar

### **1. Asegurar que el dev server esté corriendo:**

```bash
npm run dev
```

**Output esperado:**
```
VITE v7.2.4  ready in 578 ms
→  Local:   http://localhost:5173/  (o 5174 si 5173 está ocupado)
```

---

### **2. Abrir DevTools Console:**

1. Navega a tu URL pública: `http://localhost:5173/micarritodecomida`
2. Presiona **F12** (o **Cmd+Option+I** en Mac)
3. Ve a la pestaña **Console**

---

### **3. Verificar logs en Console:**

Deberías ver estos logs en orden:

#### ✅ **Log 1: Clase aplicada**
```
✅ public-page-mode clase agregada al body
```

**Si NO ves esto:**
- El componente no se montó correctamente
- Problema con React Router

---

#### ✅ **Log 2: Cargando empresa**
```
🔍 Cargando datos para slug: micarritodecomida
```

**Si NO ves esto:**
- El slug no se está capturando correctamente
- Problema con useParams de React Router

---

#### ✅ **Log 3: Empresa cargada**
```
✅ Empresa cargada: Mi Carrito de Comida
```

**Si ves en lugar:**
```
❌ Empresa no encontrada para slug: micarritodecomida
```

**Problema:** El slug no existe en Firestore o hay error de permisos.

**Solución:**
- Verificar que la empresa existe en Firestore
- Verificar slug exacto en Firebase Console
- Verificar reglas de Firestore (lectura pública de companies)

---

#### ✅ **Log 4: Appearance data**
```
🎨 Appearance data (primera carga): CARGADO ✅
  Colors: {
    card: "#1a1a1a",
    text: "#ffffff",
    button: "#ff6b6b",
    hero_card: "#2d0e0e",
    hero_opacity: 0.9
  }
```

---

### **📊 Interpretación de Logs de Appearance:**

#### **CASO A: Appearance CARGADO con colores**
```
🎨 Appearance data: CARGADO ✅
  Colors: { card: "#1a1a1a", text: "#ffffff", ... }
```

✅ **Los datos SE ESTÁN cargando correctamente**

**Entonces el problema es:**
- HMR no actualiza estilos inline → **Solución: Hard Refresh (Ctrl+Shift+R)**
- Conflicto de especificidad CSS → **Ver más abajo**

---

#### **CASO B: Appearance NULL**
```
🎨 Appearance data: NULL ❌
⚠️ No se encontró appearance data - usando valores por defecto
```

❌ **Los datos NO se están cargando**

**Posibles causas:**
1. **No existe documento `company_appearance`** para esta empresa
2. **Reglas de Firestore bloquean lectura**
3. **business_type incorrecto**

**Solución:**
```javascript
// Verificar en Firestore Console:
// Collection: company_appearance
// Document ID: [company_id]
// Debe existir y tener campos:
{
  company_id: "xxx",
  context: "PRODUCTS" o "SERVICES",
  card_color: "#xxx",
  text_color: "#xxx",
  button_color: "#xxx",
  menu_hero_card_color: "#xxx",
  menu_hero_card_opacity: 0.9,
  // ...
}
```

---

#### **CASO C: Error al cargar**
```
❌ Error cargando appearance: Error: ...
```

❌ **Hay un error técnico**

**Verificar:**
1. Network Tab en DevTools → buscar error 403 o 500
2. Firestore rules permiten lectura pública de `company_appearance`

---

## 🔧 Soluciones Según Diagnóstico

### **Problema 1: "Appearance data: NULL"**

#### Verificar que existe el documento:

1. Ve a Firebase Console
2. Firestore → `company_appearance`
3. Busca el document ID = tu `company_id`
4. Si NO existe, créalo desde el dashboard de la app

#### Verificar Firestore Rules:

```javascript
// firestore.rules
match /company_appearance/{appearanceId} {
  allow read: if true; // ← DEBE PERMITIR LECTURA PÚBLICA
  allow write: if isAuthenticated() && belongsToUserCompany(resource.data.company_id);
}
```

---

### **Problema 2: "Appearance CARGADO pero estilos no se ven"**

#### Solución A: Hard Refresh

**En desarrollo, HMR puede no actualizar estilos inline:**

1. **Ctrl + Shift + R** (Windows/Linux)
2. **Cmd + Shift + R** (Mac)
3. O DevTools → Network Tab → "Disable cache" + Refresh

---

#### Solución B: Verificar que estilos se aplican en DOM

**En Console, ejecuta:**

```javascript
// Verificar color de fondo de hero
const hero = document.querySelector('.hero-card');
console.log('Hero styles:', window.getComputedStyle(hero).backgroundColor);

// Verificar appearance en React DevTools
// (Instalar React DevTools extension)
// Components → PublicPage → Props → appearance
```

---

#### Solución C: Comparar con Preview (producción)

```bash
# Terminal 1: Dev
npm run dev
# → http://localhost:5173/micarritodecomida

# Terminal 2: Build + Preview
npm run build
npm run preview
# → http://localhost:4173/micarritodecomida
```

**Si funciona en Preview pero NO en Dev:**
- Problema con HMR
- Solución: Hard Refresh o compilar build

**Si NO funciona en ninguno:**
- Problema con datos de Firestore
- Revisar logs de console

---

### **Problema 3: Error 403 en Network Tab**

**Firestore rules bloquean lectura:**

```javascript
// firestore.rules - VERIFICAR:
match /companies/{companyId} {
  allow read: if true; // ← Debe permitir lectura pública
}

match /company_appearance/{appearanceId} {
  allow read: if true; // ← Debe permitir lectura pública
}

match /products/{productId} {
  allow read: if true; // ← Debe permitir lectura pública para PRODUCTS business type
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules --project agendaemprende-8ac77
```

---

## 🎯 Checklist de Verificación

Cuando los estilos no se aplican:

- [ ] Dev server corriendo sin errores
- [ ] Console abierto (F12)
- [ ] Ver log: "✅ public-page-mode clase agregada"
- [ ] Ver log: "✅ Empresa cargada: [nombre]"
- [ ] Ver log: "🎨 Appearance data: CARGADO ✅"
- [ ] Ver colores en console log
- [ ] Hard refresh realizado (Ctrl+Shift+R)
- [ ] Network Tab sin errores 403/404
- [ ] Comparar con preview: `npm run build && npm run preview`

---

## 🚀 Próximos Pasos

1. **Abrir tu página pública:** `http://localhost:5173/micarritodecomida`
2. **Abrir Console (F12)** y **copia TODOS los logs**
3. **Reporta:**
   - ¿Qué logs ves?
   - ¿Appearance se carga (CARGADO ✅) o es NULL (NULL ❌)?
   - ¿Hay errores en Console?
   - ¿Hay errores en Network Tab?

Con esa información, puedo darte la solución exacta.

---

## 🧹 Limpiar Debug Logs (Después)

Una vez identificado y solucionado el problema, **remover los console.log** agregados:

```bash
# Buscar todos los console.log agregados
git diff src/pages/public/PublicPage.tsx

# Revertir cambios si no son necesarios
git checkout src/pages/public/PublicPage.tsx
```

O dejarlos con un flag de debug:

```typescript
const DEBUG = false; // ← Cambiar a true solo cuando debuggees

if (DEBUG) {
  console.log('...');
}
```

---

**Generado:** 2026-02-02  
**Archivos modificados:** `src/pages/public/PublicPage.tsx` (debug logs agregados)
