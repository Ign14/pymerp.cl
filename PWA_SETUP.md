# 📱 Progressive Web App (PWA) - Setup Completo

## ✅ Estado de Implementación

**PWA completamente configurada y funcionando**

---

## 🎯 Características Implementadas

### 1. ✅ Manifest.json
- **Nombre**: AgendaWeb - Sistema de Gestión Empresarial
- **Short name**: AgendaWeb
- **Theme color**: #2563eb (Azul)
- **Background color**: #ffffff (Blanco)
- **Display**: standalone (fullscreen app)
- **Orientación**: portrait
- **Idioma**: es-CL
- **Categorías**: business, productivity, utilities

### 2. ✅ Service Worker con Workbox
- **Auto-update**: Actualización automática
- **Offline ready**: Funciona sin conexión
- **Cache strategies**:
  - Google Fonts: CacheFirst (1 año)
  - Firebase Storage: StaleWhileRevalidate (30 días)
  - Imágenes: CacheFirst (30 días, max 100)
  - API calls: NetworkFirst (5 minutos)
- **Background sync**: Sincronización en segundo plano
- **Skip waiting**: true
- **Clients claim**: true

### 3. ✅ Iconos PWA
Resoluciones configuradas:
- **192x192**: Android home screen
- **512x512**: Android splash screen
- **180x180**: iOS home screen (apple-touch-icon)
- **32x32**: Favicon desktop
- **16x16**: Favicon browser tab

### 4. ✅ Install Prompt
Componente interactivo que aparece después de 30 segundos:
- Diseño moderno con animaciones
- Lista de beneficios
- Botones "Instalar" y "Ahora no"
- Recordatorio en 7 días si se rechaza
- Auto-hide si ya está instalado

---

## 🚀 Setup Rápido

### Paso 1: Generar Iconos

```bash
# Opción A: Con tu logo
# 1. Coloca tu logo en: public/logo-source.png (1024x1024)
# 2. Instala sharp
npm install -D sharp

# 3. Genera los iconos
node scripts/generate-pwa-icons.js
```

```bash
# Opción B: Iconos placeholder (desarrollo)
# Los iconos ya están configurados en vite.config.ts
# Solo asegúrate de tener los archivos en public/
```

### Paso 2: Build y Deploy

```bash
# Build de producción (genera manifest y service worker)
npm run build

# Preview local
npm run preview
```

### Paso 3: Verificar PWA

Abrir DevTools (F12):
1. **Application** tab
2. **Manifest** → Ver configuración
3. **Service Workers** → Ver estado
4. **Lighthouse** → Run PWA audit

---

## 📋 Componentes PWA Creados

### 1. `PWAInstallPrompt.tsx`
Prompt para instalar la app:
```typescript
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Ya incluido en App.tsx
<PWAInstallPrompt />
```

**Características:**
- Aparece después de 30 segundos
- Animación suave (framer-motion)
- Lista de beneficios:
  - Acceso rápido desde pantalla
  - Funciona sin conexión
  - Actualizaciones automáticas
- Botón "Instalar" y "Ahora no"
- Auto-hide si ya instalado

### 2. `PWAUpdatePrompt.tsx`
Notifica cuando hay actualizaciones:
```typescript
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

// Ya incluido en App.tsx
<PWAUpdatePrompt />
```

**Características:**
- Aparece en top center
- Botón "Actualizar" para recargar
- Mensaje cuando está listo para offline

### 3. `OfflineIndicator.tsx`
Barra que indica conexión perdida:
```typescript
import OfflineIndicator from './components/OfflineIndicator';

// Ya incluido en App.tsx
<OfflineIndicator />
```

**Características:**
- Aparece solo cuando offline
- Color amarillo de advertencia
- Ícono de WiFi desconectado
- Animación suave

### 4. Hook `usePWA.ts`
Hook para gestionar PWA:
```typescript
import { usePWA } from './hooks/usePWA';

const { 
  isInstalled, 
  isUpdateAvailable,
  isOffline,
  updateServiceWorker 
} = usePWA();
```

**API:**
- `isInstalled`: boolean - App instalada
- `isUpdateAvailable`: boolean - Update disponible
- `isOffline`: boolean - Sin conexión
- `updateServiceWorker()`: Promise - Actualizar app
- `needRefresh`: [boolean, setter] - Estado de refresh
- `offlineReady`: [boolean, setter] - Estado offline ready

### 5. Hook `useOnlineStatus.ts`
Hook simple para detectar conexión:
```typescript
import { useOnlineStatus } from './hooks/usePWA';

const isOnline = useOnlineStatus();
```

---

## ⚙️ Configuración

### vite.config.ts

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AgendaWeb',
        short_name: 'AgendaWeb',
        theme_color: '#2563eb',
        // ... más configuración
      },
      workbox: {
        // Estrategias de cache
        runtimeCaching: [...]
      }
    })
  ]
})
```

### Estrategias de Cache

| Recurso | Estrategia | Duración | Max Entries |
|---------|-----------|----------|-------------|
| Google Fonts | CacheFirst | 1 año | 10 |
| Firebase Images | StaleWhileRevalidate | 30 días | 50 |
| Imágenes locales | CacheFirst | 30 días | 100 |
| API Calls | NetworkFirst | 5 minutos | 50 |

---

## 🧪 Testing

### Verificar Instalación

1. **Chrome DevTools**:
   ```
   F12 → Application → Manifest
   ✓ Manifest válido
   ✓ Service Worker activo
   ✓ Iconos cargados
   ```

2. **Lighthouse Audit**:
   ```
   F12 → Lighthouse → Progressive Web App
   Score objetivo: 100/100
   ```

3. **Install Test**:
   - Desktop: Ver botón "+" en barra de direcciones
   - Mobile: Ver banner "Agregar a pantalla de inicio"

### Verificar Offline

1. Chrome DevTools:
   ```
   F12 → Network → Offline
   ✓ App sigue funcionando
   ✓ Barra amarilla aparece
   ```

2. Verificar cache:
   ```
   Application → Cache Storage
   ✓ workbox-precache
   ✓ images-cache
   ✓ api-cache
   ```

### Verificar Updates

1. Hacer cambios en código
2. Build: `npm run build`
3. Reload página
4. Ver prompt de actualización

---

## 🎨 Generar Iconos

### Método 1: Script Automático

```bash
# 1. Preparar logo fuente
# - Tamaño: 1024x1024 px
# - Formato: PNG
# - Ubicación: public/logo-source.png

# 2. Instalar sharp
npm install -D sharp

# 3. Generar iconos
node scripts/generate-pwa-icons.js

# Salida:
# ✅ pwa-icon-192.png (192x192) - any maskable
# ✅ pwa-icon-512.png (512x512) - any maskable
# ✅ apple-touch-icon.png (180x180) - any
# ✅ favicon-32x32.png (32x32) - any
# ✅ favicon-16x16.png (16x16) - any
```

### Método 2: Herramientas Online

#### PWA Asset Generator
```
https://www.pwabuilder.com/imageGenerator

1. Upload logo (512x512 mínimo)
2. Generar iconos
3. Descargar zip
4. Copiar a public/
```

#### Favicon Generator
```
https://realfavicongenerator.net/

1. Upload logo
2. Configurar para todas las plataformas
3. Generar y descargar
4. Copiar a public/
```

### Método 3: Figma/Photoshop

Tamaños necesarios:
- `pwa-icon-192.png`: 192x192
- `pwa-icon-512.png`: 512x512
- `apple-touch-icon.png`: 180x180
- `favicon-32x32.png`: 32x32
- `favicon-16x16.png`: 16x16

---

## 📱 Instalación en Dispositivos

### Android (Chrome)

1. Abrir app en Chrome
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. O click en el prompt automático
4. Ícono aparece en home screen

### iOS (Safari)

1. Abrir app en Safari
2. Botón Compartir (⬆️)
3. "Agregar a pantalla de inicio"
4. Ícono aparece en home screen

### Desktop (Chrome/Edge)

1. Abrir app en navegador
2. Ver ícono "+" en barra de direcciones
3. Click en "Instalar"
4. O usar prompt automático
5. App se abre como ventana independiente

---

## 🔄 Ciclo de Actualización

### Flujo Automático

```
1. Usuario usa app (Service Worker activo)
   ↓
2. Nueva versión se publica
   ↓
3. Service Worker detecta update (cada 1 hora)
   ↓
4. Descarga nuevo contenido en background
   ↓
5. PWAUpdatePrompt aparece
   ↓
6. Usuario click "Actualizar"
   ↓
7. App se recarga con nueva versión
```

### Manual Update

```typescript
const { updateServiceWorker } = usePWA();

// Forzar actualización
await updateServiceWorker(true); // true = reload page
```

---

## 🎯 Mejores Prácticas

### 1. Manifest

✅ **DO:**
- Usar colores consistentes con brand
- Proporcionar iconos en todos los tamaños
- Incluir descripción clara
- Definir screenshots (opcional pero recomendado)

❌ **DON'T:**
- Cambiar `start_url` frecuentemente
- Usar colores con mal contraste
- Omitir iconos necesarios

### 2. Service Worker

✅ **DO:**
- Implementar estrategia de cache apropiada
- Limpiar cache antiguo
- Manejar updates gracefully
- Probar offline functionality

❌ **DON'T:**
- Cachear todo indiscriminadamente
- Ignorar errores de cache
- Bloquear actualizaciones

### 3. UX

✅ **DO:**
- Mostrar estado de conexión
- Notificar updates disponibles
- Permitir al usuario decidir cuándo actualizar
- Dar feedback visual

❌ **DON'T:**
- Forzar updates sin avisar
- Recargar página automáticamente
- Ocultar estado de offline

---

## 📊 Métricas y Monitoreo

### Lighthouse Score

Objetivo: **100/100** en PWA

Categorías:
- ✓ Installable
- ✓ PWA Optimized
- ✓ Fast and reliable
- ✓ Works offline

### Analytics

Trackear:
- Install events
- Update events
- Offline usage
- Cache hit rate

```typescript
import { trackEvent, GAEventAction } from './config/analytics';

// Track PWA install
window.addEventListener('appinstalled', () => {
  trackEvent(GAEventAction.PWA_INSTALL, {
    category: 'pwa',
  });
});

// Track offline usage
if (!navigator.onLine) {
  trackEvent('pwa_offline_usage', {
    category: 'pwa',
  });
}
```

---

## 🐛 Troubleshooting

### Service Worker no se registra

**Problema**: Console muestra error de registro

**Solución**:
```bash
# 1. Limpiar cache
# DevTools → Application → Clear storage → Clear site data

# 2. Rebuild
npm run build

# 3. Hard reload
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Install prompt no aparece

**Problema**: Botón de instalación no visible

**Causas**:
- Ya está instalada
- No cumple criterios PWA
- Prompt fue rechazado recientemente

**Solución**:
```bash
# Chrome DevTools
Application → Manifest → "Add to home screen"

# O esperar 30 segundos para prompt automático
```

### Updates no se aplican

**Problema**: Nueva versión no se carga

**Solución**:
```typescript
// Forzar skip waiting
// En vite.config.ts:
workbox: {
  skipWaiting: true,
  clientsClaim: true
}
```

### Iconos no cargan

**Problema**: Iconos rotos en manifest

**Solución**:
```bash
# 1. Verificar archivos existen
ls public/*.png

# 2. Regenerar iconos
node scripts/generate-pwa-icons.js

# 3. Rebuild
npm run build
```

---

## 📚 Recursos

### Documentación Oficial
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

### Herramientas
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web App Manifest Generator](https://app-manifest.firebaseapp.com/)

### Testing
- [PWA Testing Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audit](https://developer.chrome.com/docs/lighthouse/pwa/)

---

## ✅ Checklist de Deploy

Antes de producción:

- [ ] Iconos generados en todas las resoluciones
- [ ] Manifest.json configurado
- [ ] Service Worker funcionando
- [ ] Install prompt testeado
- [ ] Update prompt funcional
- [ ] Offline mode verificado
- [ ] Lighthouse score 100/100
- [ ] Testeado en Android
- [ ] Testeado en iOS
- [ ] Testeado en Desktop
- [ ] Analytics configurado

---

## 🎉 ¡PWA Lista!

Tu aplicación AgendaWeb ahora es una **Progressive Web App** completa:

✅ Instalable en todos los dispositivos
✅ Funciona offline
✅ Actualiz aciones automáticas
✅ Performance optimizado
✅ UX nativo

**Próximos pasos:**
1. Generar iconos personalizados
2. Build y deploy
3. Verificar en dispositivos reales
4. Monitorear métricas

---

**¿Preguntas?** Revisar documentación en `vite.config.ts` y componentes en `src/components/`

