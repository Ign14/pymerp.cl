# 🚀 PYM-ERP - Sistema de Gestión para Emprendimientos

[![CI Tests](https://img.shields.io/github/actions/workflow/status/pymerp/agendaweb/test.yml?branch=main&label=CI%20Tests)](./.github/workflows/test.yml)
[![E2E](https://img.shields.io/github/actions/workflow/status/pymerp/agendaweb/e2e.yml?branch=main&label=E2E%20Tests)](./.github/workflows/e2e.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/pymerp/agendaweb/deploy-vercel.yml?branch=main&label=Vercel%20deploy)](./.github/workflows/deploy-vercel.yml)
[![Coverage](https://img.shields.io/badge/coverage-vitest%20v8-blue)](./coverage/index.html)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff)](https://vitejs.dev/)

Plataforma SaaS para emprendedores que permite gestionar servicios o productos, conectar con clientes mediante WhatsApp, y tener presencia web con páginas públicas personalizadas.

## 📑 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Deploy](#-deploy)
- [Documentación](#-documentación)
- [Contribuir](#-contribuir)

## ✨ Características

### 🔐 Autenticación y Control de Acceso
- Sistema de solicitud de acceso para nuevos emprendedores
- Panel de administración para aprobar/rechazar solicitudes
- Roles: SUPERADMIN y ENTREPRENEUR
- Autenticación con Firebase Auth

### 🎨 Gestión de Emprendimientos
- **Wizard de configuración inicial**: Asistente paso a paso
- **Gestión de servicios**: Horarios, precios, reservas via WhatsApp
- **Gestión de productos**: Catálogo, carrito, pedidos via WhatsApp
- **Páginas públicas personalizadas**: URL única por emprendimiento
- **Personalización visual**: Logo, banner, colores, fuentes

### 📊 Analytics y Métricas
- Google Analytics 4 integrado
- Web Vitals tracking
- Sentry para monitoreo de errores
- Dashboard con métricas clave

### 🌍 Internacionalización
- Español e inglés
- Cambio de idioma en tiempo real
- Emails multiidioma

## 🛠 Stack Tecnológico

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.x** - Build tool & dev server
- **Tailwind CSS 3.x** - Styling
- **Framer Motion 12.x** - Animations
- **React Router 6.28** - Routing
- **i18next 16.3** - Internationalization

### Backend & Infrastructure
- **Firebase 12.6**
  - Authentication (Email/Password)
  - Firestore (NoSQL database)
  - Storage (File uploads)
  - Hosting (Static site)
  - Cloud Functions (Serverless backend)
- **SendGrid** - Transactional emails

### Security & Monitoring
- **🔒 Rate Limiting** - express-rate-limit
- **🔒 Input Sanitization** - validator + DOMPurify
- **🔒 CSP Headers** - Content Security Policy Level 2
- **🔒 Security Headers** - HSTS, X-Frame-Options, etc.
- **Sentry 10.27** - Error tracking
- **Google Analytics 4** - Usage analytics

### Testing
- **Vitest** - Unit testing
- **Playwright 1.50** - E2E testing

- **Frontend**: React 18.3 + TypeScript 5.5 + Vite
- **Styling**: Tailwind CSS 3.x
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Analytics**: Google Analytics 4, Sentry
- **Testing**: Vitest + Playwright
- **i18n**: react-i18next

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/agendaweb.git
cd agendaweb

# Instalar dependencias
npm install

# Firebase Functions
cd functions && npm install && cd ..

# Instalar Firebase CLI
npm install -g firebase-tools
firebase login
```

## ⚙️ Configuración

1. **Variables de Entorno** - Crea `.env.local`:

```bash
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_key
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

2. **Firebase Project** - Actualiza `.firebaserc`
3. **Deploy Rules** - `firebase deploy --only firestore:rules,storage:rules`

Ver [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) para detalles.

## 💻 Desarrollo

```bash
# Servidor desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura (HTML en carpeta `coverage/`)
npm run test:coverage

# Tests E2E
npm run test:e2e

# Con UI interactiva
npm run test:e2e:ui
```

**Thresholds de cobertura configurados:**
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## 🤖 CI/CD

### Workflows Configurados

**Tests Automáticos** (`.github/workflows/test.yml` y `e2e.yml`):
- Se ejecutan en cada push/PR a `main`
- Matriz de Node.js: 18.x, 20.x
- E2E tests con Playwright (Chromium)
- Coverage con thresholds configurados
- Artefactos: `coverage/` y `playwright-report/`

**Branch Protection** (`.github/workflows/branch-protection.yml`):
- Ejecutar manualmente: `Actions → Enforce Branch Protection → Run workflow`
- Requiere: `BRANCH_PROTECTION_TOKEN` (PAT con permisos admin)
- Aplica reglas:
  - ✅ Requiere checks de CI (Node 18.x, 20.x, E2E)
  - ✅ 1 aprobación en PRs
  - ✅ Dismiss stale reviews
  - ✅ Resolución de conversaciones
  - ✅ Bloquea force push y eliminación de rama
- Opción `dry_run` para preview sin aplicar

**Deploy a Vercel** (`.github/workflows/deploy-vercel.yml`):
- Ejecutar manualmente: `Actions → Deploy to Vercel → Run workflow`
- Automático en push a `main` → production
- Requiere secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Opciones: `preview` o `production`
- Health check automático post-deploy

📖 **Ver [.github/SECRETS.md](./.github/SECRETS.md) para configurar los secrets**

## 🚢 Deploy

```bash
# Deploy completo a Firebase
npm run deploy

# Solo hosting
npm run deploy:hosting
```

### Deploy a Vercel (Recomendado)

**Manual:**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Vincular proyecto
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

**Automático vía GitHub Actions:**
- Push a `main` → deploy automático a production
- Manual: `Actions → Deploy to Vercel → Run workflow` (elige `preview` o `production`)
- Requiere configurar secrets (ver `.github/SECRETS.md`)

## 📚 Documentación

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitectura del sistema
- **[API.md](./docs/API.md)** - APIs y servicios
- **[SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md)** - 🔒 Auditoría de seguridad
- **[SECURITY_HARDENING.md](./docs/SECURITY_HARDENING.md)** - 🛡️ Implementación de seguridad
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía de contribución
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Solución de problemas
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios
- **[I18N_GUIDE.md](./I18N_GUIDE.md)** - Internacionalización

## 🤝 Contribuir

Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para el proceso de contribución.

**Conventional Commits:**
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
test: tests
```

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

## 📧 Contacto

- Email: ignacio@datakomerz.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/agendaweb/issues)

**Made with ❤️ in Chile 🇨🇱**
```bash
npm run dev
```

5. Para desplegar en Firebase Hosting:
```bash
npm run build
firebase deploy
```

## Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── config/          # Configuración de Firebase
├── contexts/        # Contextos de React (Auth)
├── pages/           # Páginas de la aplicación
│   ├── admin/       # Panel de administración
│   ├── dashboard/   # Panel del emprendedor
│   ├── public/      # Fichas públicas
│   └── setup/       # Wizard de configuración
├── services/        # Servicios (Firestore, Auth, Storage, Email)
├── types/           # Tipos TypeScript
└── utils/           # Utilidades

```

## Notas Importantes

- El servicio de email (`src/services/email.ts`) necesita ser integrado con un proveedor real (SendGrid, Mailgun, o Firebase Functions)
- Asegúrate de configurar las reglas de seguridad de Firestore apropiadamente
- Las imágenes se almacenan en Firebase Storage

## Licencia

MIT
