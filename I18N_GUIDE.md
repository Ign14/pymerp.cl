# Guía de Internacionalización (i18n)

## 🌍 Resumen

La aplicación ahora soporta **múltiples idiomas** (Español e Inglés) con cambio dinámico en tiempo real.

## ✅ Características Implementadas

### 1. **Configuración Completa**
- ✅ react-i18next configurado
- ✅ Detección automática de idioma del navegador
- ✅ Persistencia en localStorage
- ✅ HTTP backend para cargar traducciones
- ✅ Soporte para Español (es) e Inglés (en)

### 2. **Archivos de Traducción**
- **Ubicación**: `public/locales/{idioma}/translation.json`
- **Español**: `public/locales/es/translation.json` (200+ claves)
- **Inglés**: `public/locales/en/translation.json` (200+ claves)

### 3. **Componentes Actualizados**
- ✅ Landing.tsx
- ✅ Login.tsx (incluye modal de recuperación)
- ✅ RequestAccess.tsx (incluye condiciones beta)
- ✅ DashboardLayout

### 4. **Emails Multiidioma**
- ✅ sendAccessRequestEmail (notificación al admin)
- ✅ sendUserCreationEmail (bienvenida al usuario)

## 📖 Cómo Usar

### En Componentes React

```tsx
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('landing.title')}</h1>
      <p>{t('common.tagline')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### Cambiar Idioma Programáticamente

```tsx
import { changeLanguage } from './config/i18n';

// Cambiar a inglés
await changeLanguage('en');

// Cambiar a español
await changeLanguage('es');
```

### Obtener Idioma Actual

```tsx
import { getCurrentLanguage } from './config/i18n';

const currentLang = getCurrentLanguage(); // 'es' o 'en'
```

### Componente LanguageSelector

Ya está integrado en los layouts. Dos variantes disponibles:

```tsx
import LanguageSelector from './components/LanguageSelector';

// Variante dropdown (múltiples idiomas)
<LanguageSelector variant="dropdown" showLabel={true} />

// Variante button (toggle entre 2 idiomas)
<LanguageSelector variant="button" />
```

## 📁 Estructura de Archivos

```
public/
  locales/
    es/
      translation.json    # Traducciones en español
    en/
      translation.json    # Traducciones en inglés

src/
  config/
    i18n.ts              # Configuración de i18next
  components/
    LanguageSelector.tsx # Componente de selector de idioma
    LanguageToggle.tsx   # Toggle simplificado
  contexts/
    LanguageContext.tsx  # Contexto (wrapper de react-i18next)
```

## 🔑 Estructura de Claves

Las traducciones están organizadas en secciones:

```json
{
  "common": {
    "brand": "PYM-ERP",
    "tagline": "...",
    "email": "Email",
    "password": "Password",
    "submit": "Submit",
    "backHome": "Back to home"
  },
  "landing": {
    "title": "...",
    "subtitle": "...",
    "loginButton": "Login",
    "requestButton": "Request Access"
  },
  "login": {
    "title": "Sign In",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "submitButton": "Sign In",
    "forgotPassword": "Forgot password?"
  },
  "requestAccess": {
    "title": "Request Access",
    "fullNameLabel": "Full Name",
    "emailLabel": "Email",
    "businessNameLabel": "Business Name"
  }
}
```

## 🎯 Agregar Nuevas Traducciones

### 1. Agregar Clave en Archivos JSON

**Español** (`public/locales/es/translation.json`):
```json
{
  "miSeccion": {
    "miClave": "Mi texto en español"
  }
}
```

**Inglés** (`public/locales/en/translation.json`):
```json
{
  "miSeccion": {
    "miClave": "My text in English"
  }
}
```

### 2. Usar en Componente

```tsx
const { t } = useTranslation();

<p>{t('miSeccion.miClave')}</p>
```

## 📧 Emails Firebase Functions

Las funciones de email ahora aceptan el parámetro `language`:

```typescript
// En el frontend
import { sendUserCreationEmail } from './services/email';
import { getCurrentLanguage } from './config/i18n';

await sendUserCreationEmail(
  email, 
  password, 
  loginUrl, 
  getCurrentLanguage() // 'es' o 'en'
);
```

Las funciones automáticamente enviarán el email en el idioma correcto.

## 🚀 Deploy Firebase Functions

Después de actualizar las traducciones de emails, debes redesplegar las funciones:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🔧 Configuración Avanzada

### Agregar Nuevo Idioma

1. **Crear archivo de traducción**: `public/locales/fr/translation.json`
2. **Actualizar configuración** en `src/config/i18n.ts`:

```typescript
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr'] as const;
```

3. **Agregar bandera** en `LanguageSelector.tsx`:

```typescript
const LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
];
```

### Detección de Idioma

El orden de detección es:
1. localStorage ('i18nextLng')
2. Query string (?lng=en)
3. Navegador (navigator.language)
4. Fallback: Español ('es')

## 📊 Analytics

Los cambios de idioma se rastrean automáticamente en Google Analytics:

```typescript
gtag('event', 'language_change', {
  language: newLanguage
});
```

## 🐛 Troubleshooting

### Las traducciones no aparecen

1. Verificar que el archivo JSON exista en `public/locales/{idioma}/translation.json`
2. Verificar que la clave exista en el JSON
3. Revisar la consola del navegador para errores de i18next
4. Limpiar localStorage: `localStorage.removeItem('i18nextLng')`

### El idioma no persiste

- Verificar que localStorage esté habilitado en el navegador
- Revisar la configuración en `src/config/i18n.ts`

### Emails no llegan en el idioma correcto

- Verificar que se esté pasando el parámetro `language`
- Redesplegar Firebase Functions después de cambios
- Revisar logs en Firebase Console

## 📝 Notas

- **200+ strings** traducidos en español e inglés
- **Compilación exitosa** en TypeScript
- **Firebase Functions** actualizadas con soporte multiidioma
- **Componentes principales** completamente traducidos
- **Persistencia automática** del idioma seleccionado
- **Detección automática** del idioma del navegador

## 🎉 ¡Listo para Producción!

La implementación de i18n está completa y lista para usar. Los usuarios pueden cambiar el idioma en cualquier momento y la aplicación recordará su preferencia.
