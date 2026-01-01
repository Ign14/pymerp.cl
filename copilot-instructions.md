# AI Agent Instructions - PYM-ERP / AgendaWeb

## Project Overview
React 18 + TypeScript SaaS platform for entrepreneurs managing services/products with WhatsApp integration. Firebase BaaS (Auth, Firestore, Storage, Functions). Multi-tenant with role-based access (SUPERADMIN, ENTREPRENEUR).

## Architecture Patterns

### Authentication Flow
- **Dual-user system**: Firebase Auth + Firestore user profile
- Always use `useAuth()` hook which provides both `firebaseUser` (auth) and `firestoreUser` (profile with role, company_id, status)
- Protected routes in [src/App.tsx](src/App.tsx): `<ProtectedRoute requiredRole={UserRole.ENTREPRENEUR}>` or `requireActive={false}` for FORCE_PASSWORD_CHANGE status
- E2E bypass: supports mock users via `localStorage.setItem('e2e:user', 'founder')` in test environment

### Data Access Patterns
- **Service Layer**: all Firebase operations in [src/services/](src/services/) - never import Firebase SDK directly in components
- **User ownership model**: `company_id` on User links to Company document; Firestore rules enforce `ownsCompany(companyId)` checks
- **Deterministic IDs**: users stored by `userId` or `email` (not auto-generated) to match `request.auth.uid` in rules - see [firestore.rules](firestore.rules) lines 73-90
- Collections: `users`, `access_requests`, `companies`, `services`, `products`, `appointments`, `orders`, `analytics_events`

### Configuration
- **Environment variables**: use `env` object from [src/config/env.ts](src/config/env.ts), never `import.meta.env` directly
- All Firebase config centralized in [src/config/firebase.ts](src/config/firebase.ts)
- Required vars: `VITE_FIREBASE_*` (8 vars), `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GA4_MEASUREMENT_ID` - see [ENV_VARIABLES_GUIDE.md](ENV_VARIABLES_GUIDE.md)

## Development Workflows

### Running & Testing
```bash
npm run dev                    # Vite dev server on :5173
npm run build                  # TypeScript + Vite build (checks types first)
npm run test                   # Vitest unit tests
npm run test:e2e               # Playwright E2E (needs dev server running)
npm run test:e2e:ui            # Interactive Playwright UI
```

### E2E Testing Conventions
- Tests in [e2e/](e2e/) with fixtures in [e2e/fixtures/](e2e/fixtures/)
- Use `page.getByRole()` over selectors - accessibility-first approach
- Mock E2E auth by setting `localStorage.setItem('e2e:user', 'founder')` before navigation - see [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) lines 24-67
- **Mock users**: `founder` (entrepreneur), `seller` (products owner), `admin` (superadmin), `force` (FORCE_PASSWORD_CHANGE)
- **Firebase mocking**: use `setupFirebaseMocks(page)` from [e2e/fixtures/mockFirebase.ts](e2e/fixtures/mockFirebase.ts)
  - Returns mutable `MockState` with pre-populated collections (users, companies, services, products)
  - Mock Firestore API calls with realistic data encoding/decoding
- Config in [playwright.config.ts](playwright.config.ts): retries=1 (CI: 2), parallel execution, screenshots on failure

### Unit Testing Setup
- Test utilities in [src/test/setupTests.ts](src/test/setupTests.ts)
firebase deploy --only storage   # Storage rules
```

### Common Setup Commands
```bash
# First-time setup
npm install
cd functions && npm install && cd ..
firebase login
firebase use <project-id>      # Set active Firebase project

# Environment variables
cp .env.example .env.local     # Copy and edit with real values
npm run verify:secrets         # Verify all required vars are set

# Emulators (local testing)
firebase emulators:start       # Start all emulators
firebase emulators:start --only firestore,auth  # Specific emulators
- Mocks i18next backend to avoid network calls during tests
- jest-axe for accessibility testing: `expect.extend(toHaveNoViolations)`
- All Firebase imports mocked via Vitest - see setupTests.ts for patterns

### Firebase Deployment
```bash
npm run deploy                 # Full Firebase deploy (hosting + rules)
npm run deploy:hosting         # Hosting only
npm run deploy:firestore       # Firestore rules only
firebase deploy --only functions  # Cloud Functions
```

### Vercel Deployment (Recommended)
- GitHub Actions workflow [.github/workflows/deploy-vercel.yml](.github/workflows/deploy-vercel.yml)
- Manual: `vercel --prod` after `npm run build`
- Requires secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Code Conventions

### TypeScript Types
- Centralized in [src/types/index.ts](src/types/index.ts)
- Use enums: `UserRole`, `UserStatus`, `AccessRequestStatus`, `BusinessType`, `EventType`
- Date fields from Firestore: convert with `.toDate()` - see [src/services/firestore.ts](src/services/firestore.ts) lines 73-77

### Custom React Hooks
- **useAuth()**: from AuthContext - provides `{ firebaseUser, firestoreUser, loading }`
- **useErrorHandler()**: from [src/hooks/useErrorHandler.ts](src/hooks/useErrorHandler.ts)
  - `handleError(error, options)`: sync error handling with toast
  - `handleAsyncError(asyncFn, options)`: wrapper for async operations
- **useAnalytics()**: from [src/hooks/useAnalytics.ts](src/hooks/useAnalytics.ts)
  - `usePageTracking()`: auto-track page views on route change
  - `useTimeOnPage()`: track time spent on page
  - `trackClick(action)`: track button/link clicks
  - `trackConversion()`: track conversions (bookings, orders)
- **usePWA()**: from [src/hooks/usePWA.ts](src/hooks/usePWA.ts) - PWA state (needRefresh, offlineReady, isInstalled)

### Component Structure
- Page components in `src/pages/`: admin/, dashboard/, public/, setup/, info/
- Reusable UI in `src/components/`
- Route structure follows: `/admin`, `/dashboard/*`, `/setup/*`, `/:companyId` (public pages)
- Animations: wrap routes in `<PageTransition>` component with Framer Motion

### Internationalization
- i18next with language detector - files in [public/locales/](public/locales/)/{es,en}/*.json
- Use `useTranslation()` hook: `const { t } = useTranslation('namespace')`
- Namespaces: common, auth, dashboard, admin, errors, setup - see [src/i18n.ts](src/i18n.ts)

### Styling
- Tailwind CSS 3.x - config in [tailwind.config.js](tailwind.config.js)
- Custom colors: primary (blue-600), secondary (purple-600)
- Responsive: mobile-first approach
- Animations: Framer Motion for page transitions and micro-interactions

### Error Handling
- Sentry integration via [src/config/sentry.ts](src/config/sentry.ts)
- Toast notifications: `react-hot-toast` - use `toast.error()`, `toast.success()`
- Logger utility in [src/utils/logger.ts](src/utils/logger.ts) - use instead of console.log
- **Custom hooks**: `useErrorHandler()` for consistent error handling with toast + Sentry logging

### Security & Input Validation
- **Client-side sanitization**: [src/utils/security.ts](src/utils/security.ts)
  - `sanitizeInput()`: XSS prevention (escape HTML entities)
  - `sanitizePhone()`: strip non-digits from phone numbers
  - `isValidEmail()`, `isValidURL()`, `isValidPhone()`: validation helpers
- **Server-side**: Firebase Functions have `sanitizeEmail()`, `sanitizeText()`, `sanitizePhoneNumber()` in [functions/src/index.ts](functions/src/index.ts)
- Always validate user inputs before Firestore/Storage operations

## Key Integrations

### Firebase Services
- **Auth**: email/password only - no social providers yet
- **Firestore**: read [firestore.rules](firestore.rules) before modifying collections - strict ownership validation
- **Storage**: company logos/banners in `companies/{companyId}/` - requires `company_id` custom claim
- **Functions**: email sending via SendGrid proxy - see [functions/src/](functions/src/)

### Analytics
- Google Analytics 4 via `react-ga4` - initialized in [src/main.tsx](src/main.tsx)
- Custom events tracked: PAGE_VIEW, WHATSAPP_CLICK, SERVICE_BOOK_CLICK, PRODUCT_ORDER_CLICK
- Privacy-compliant: cookie consent banner required before initialization

### PWA Features
- Vite PWA plugin with Workbox - config in [vite.config.ts](vite.config.ts)
- Service worker caches: fonts, Firebase Storage images, static assets
- Install prompt: [src/components/PWAInstallPrompt.tsx](src/components/PWAInstallPrompt.tsx)
- Update detection: [src/components/PWAUpdatePrompt.tsx](src/components/PWAUpdatePrompt.tsx)

## Multi-Tenant Architecture
- Each entrepreneur gets one Company document (company_id)
- Public pages at `/:companyId` route - see [src/pages/public/PublicPage.tsx](src/pages/public/PublicPage.tsx)
- WhatsApp integration: pre-filled messages with service/product details
- Business type toggles features: SERVICES (scheduling) vs PRODUCTS (catalog)

## Security Notes
- CSP headers in [public/_headers](public/_headers)
- Rate limiting via Firebase Functions
- Input sanitization: validator + DOMPurify (not yet fully implemented - use cautiously)
- Firestore rules enforce row-level security - test with `firebase emulators:start`
- NEVER expose Firebase Admin SDK credentials in frontend

## Documentation
- Architecture deep-dive: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API reference: [docs/API.md](docs/API.md)
- Security audit: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)
- Troubleshooting: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
