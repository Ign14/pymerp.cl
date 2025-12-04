# 📱 PWA Quick Start - AgendaWeb

## ⚡ Setup en 3 Pasos

### 1️⃣ Generar Iconos (Opcional)

```bash
# Opción A: Generar desde tu logo
# 1. Coloca logo-source.png en public/ (1024x1024)
npm install -D sharp
node scripts/generate-pwa-icons.js

# Opción B: Usar placeholders (desarrollo)
# Los iconos ya están configurados, solo asegúrate que existan en public/
```

### 2️⃣ Build

```bash
npm run build
```

### 3️⃣ Verificar

```bash
# Preview local
npm run preview

# Abrir DevTools (F12)
# → Application → Manifest ✓
# → Service Workers ✓
# → Lighthouse → PWA Audit ✓
```

---

## ✨ Características Activadas

### ✅ Install Prompt
- Aparece automáticamente después de 30 segundos
- Diseño moderno con animaciones
- Lista de beneficios
- Botones "Instalar" / "Ahora no"

### ✅ Update Prompt
- Notifica cuando hay nueva versión
- Botón "Actualizar" para recargar
- Aparece en top center

### ✅ Offline Indicator
- Barra amarilla cuando se pierde conexión
- Ícono de WiFi desconectado
- Se oculta al reconectar

### ✅ Service Worker
- **Auto-update**: Actualización automática
- **Cache strategies**: Optimizado para cada tipo de recurso
- **Offline ready**: Funciona sin internet
- **Background sync**: Sincronización automática

---

## 📊 Componentes PWA

```typescript
// Ya incluidos en App.tsx:

<PWAInstallPrompt />      // Prompt de instalación
<PWAUpdatePrompt />       // Prompt de actualización
<OfflineIndicator />      // Indicador offline

// Hook personalizado:
import { usePWA } from './hooks/usePWA';

const { 
  isInstalled,         // ¿App instalada?
  isUpdateAvailable,   // ¿Update disponible?
  isOffline,           // ¿Sin conexión?
  updateServiceWorker  // Forzar actualización
} = usePWA();
```

---

## 🎨 Iconos Necesarios

Colocar en `public/`:

- `pwa-icon-192.png` (192x192)
- `pwa-icon-512.png` (512x512)
- `apple-touch-icon.png` (180x180)
- `favicon-32x32.png` (32x32)
- `favicon-16x16.png` (16x16)

**Generarlos automáticamente:**
```bash
node scripts/generate-pwa-icons.js
```

---

## 📱 Instalar App

### Android (Chrome)
```
1. Abrir app
2. Ver prompt automático
3. O: Menú → "Agregar a pantalla"
```

### iOS (Safari)
```
1. Abrir app
2. Botón Compartir (⬆️)
3. "Agregar a pantalla de inicio"
```

### Desktop
```
1. Ver ícono "+" en barra de direcciones
2. O: Ver prompt automático
3. Click "Instalar"
```

---

## 🧪 Testing

### Chrome DevTools

```
F12 → Application

✓ Manifest válido
✓ Service Worker activo
✓ Iconos cargados
✓ Cache funcionando
```

### Lighthouse Audit

```
F12 → Lighthouse → Progressive Web App

Score objetivo: 100/100
```

### Offline Test

```
F12 → Network → Offline

✓ App sigue funcionando
✓ Barra amarilla aparece
✓ Cache sirve contenido
```

---

## 🔄 Updates

### Automático (Recomendado)
```
1. Nueva versión se publica
2. Service Worker detecta (cada 1h)
3. Update prompt aparece
4. Usuario click "Actualizar"
5. App recarga con nueva versión
```

### Manual
```typescript
const { updateServiceWorker } = usePWA();

// Forzar update
await updateServiceWorker(true);
```

---

## 🐛 Troubleshooting

### Service Worker no registra
```bash
# Limpiar cache
DevTools → Application → Clear storage

# Rebuild
npm run build

# Hard reload
Ctrl + Shift + R
```

### Install prompt no aparece
```bash
# Verificar
1. ¿Ya instalada? → Desinstalar
2. ¿Criterios PWA? → Lighthouse audit
3. ¿Rechazada antes? → Esperar 3 meses
```

### Updates no aplican
```bash
# Verificar vite.config.ts
workbox: {
  skipWaiting: true,
  clientsClaim: true
}
```

---

## 📚 Documentación Completa

Ver: `PWA_SETUP.md`

---

## ✅ Checklist

- [ ] Iconos generados
- [ ] Build sin errores
- [ ] Service Worker activo
- [ ] Install prompt funciona
- [ ] Update prompt funciona
- [ ] Offline mode funciona
- [ ] Lighthouse 100/100
- [ ] Testeado en móvil
- [ ] Testeado en desktop

---

**¡PWA lista para producción!** 🎉

Manifest configurado ✓
Service Worker activo ✓
Iconos generados ✓
Install prompt ✓
Offline ready ✓

