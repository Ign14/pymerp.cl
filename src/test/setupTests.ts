import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
// No importamos appI18n aquí para evitar inicialización durante setup

// Mock i18next backend/detector to avoid network during tests
vi.mock('i18next-http-backend', () => ({
  default: class NoopBackend {
    static type = 'backend';
    type = 'backend';
    init() {}
    read(language: string, namespace: string, callback: (err: any, data: any) => void) {
      const es = {
        translation: {
          loginTitle: 'Iniciar sesión',
          common: {
            email: 'Email',
            password: 'Contraseña',
            backHome: 'Volver al inicio',
            tagline: ''
          },
          login: {
            title: 'Iniciar sesión',
            submitButton: 'Iniciar sesión',
            forgotPassword: '¿Olvidaste tu contraseña?'
          },
          requestAccess: {
            title: 'Solicitar acceso',
            subtitle: 'Completa el formulario y recibirás tu acceso.',
            fullNameLabel: 'Nombre completo',
            businessNameLabel: 'Nombre del negocio',
          businessNameHint: 'Ingresa el nombre de tu negocio',
          whatsappLabel: 'WhatsApp',
          planLabel: 'Plan',
          invalidWhatsapp: 'WhatsApp inválido',
          requestAlreadySubmitted: 'Solicitud ya enviada',
          acceptBetaLabel: 'Aceptar términos beta',
          betaTermsLink: 'Ver términos',
          submitButton: 'Enviar solicitud'
          },
          language: { toggle: 'Cambiar idioma' },
          landing: {
            title: 'Bienvenido',
            subtitle: 'Gestión integral de tu negocio',
            loginButton: 'Iniciar sesión',
            requestButton: 'Solicitar acceso',
            nearbyButton: 'Negocios cercanos'
          }
        }
      };
      const en = {
        translation: {
          loginTitle: 'Sign in',
          common: {
            email: 'Email',
            password: 'Password',
            backHome: 'Back to home',
            tagline: ''
          },
          login: {
            title: 'Sign in',
            submitButton: 'Sign in',
            forgotPassword: 'Forgot your password?'
          },
          requestAccess: {
            title: 'Request access',
            subtitle: 'Complete the form and you will receive your access.',
            fullNameLabel: 'Full name',
            businessNameLabel: 'Business name',
          businessNameHint: 'Enter your business name',
          whatsappLabel: 'WhatsApp',
          planLabel: 'Plan',
          invalidWhatsapp: 'Invalid WhatsApp',
          requestAlreadySubmitted: 'Request already submitted',
          acceptBetaLabel: 'Accept beta terms',
          betaTermsLink: 'View terms',
          submitButton: 'Send request'
          },
          language: { toggle: 'Toggle language' },
          landing: {
            title: 'Welcome',
            subtitle: 'Comprehensive business management',
            loginButton: 'Sign in',
            requestButton: 'Request access',
            nearbyButton: 'Nearby businesses'
          }
        }
      };
      const bundles: Record<string, any> = { es, en };
      const data = bundles[language]?.[namespace] ?? {};
      callback(null, data);
    }
  },
}));

vi.mock('i18next-browser-languagedetector', () => ({
  default: class MockDetector {
    static type = 'languageDetector';
    type = 'languageDetector';
    init() {}
    detect() {
      const stored = typeof localStorage !== 'undefined'
        ? localStorage.getItem('i18nextLng')
        : null;
      return stored || 'es';
    }
    cacheUserLanguage(lng: string) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('i18nextLng', lng);
      }
    }
  },
}));

// Register jest-axe matchers for a11y testing
expect.extend(toHaveNoViolations);

// Provide a minimal translation catalog for tests
const esTranslations = {
  loginTitle: 'Iniciar sesión',
  loginSubmit: 'Iniciar sesión',
  tagline: '',
  backHome: 'Volver al inicio',
  email: 'Email',
  password: 'Contraseña',
  requestAccessTitle: 'Solicitar acceso',
  requestAccessSubtitle: 'Completa el formulario y recibirás tu acceso.',
  sendRequest: 'Enviar solicitud',
  alreadyAccount: '¿Ya tienes cuenta?',
  goLogin: 'Ir a iniciar sesión',
  landingLogin: 'Ingresar',
  landingRequest: 'Solicitar acceso',
  language: { toggle: 'Cambiar idioma' },
  common: {
  tagline: '',
    email: 'Email',
    password: 'Contraseña',
    backHome: 'Volver al inicio',
  },
  landing: {
    title: 'Inicio',
    closeButton: 'Cerrar',
    betaTitle: 'Versión Beta Gratuita',
    betaMessage: 'Mensaje beta',
    betaOffer: 'Oferta beta',
    betaLaunch: 'Lanzamiento beta',
    alreadyAccount: '¿Ya tienes cuenta?',
    subtitle: 'Subtítulo',
    loginButton: 'Ingresar',
    requestButton: 'Solicitar acceso',
    nearbyButton: 'PyMEs cercanas',
  },
  login: {
    title: 'Iniciar sesión',
    subtitle: 'Accede a tu cuenta',
    submitButton: 'Iniciar sesión',
    forgotPassword: '¿Problemas con tu contraseña?',
    resetPasswordTitle: 'Recuperar contraseña',
    resetPasswordMessage: 'Ingresa tu email',
    resetSendButton: 'Enviar solicitud',
  },
  requestAccess: {
    title: 'Solicitar acceso',
    subtitle: 'Completa el formulario y recibirás tu acceso.',
    fullNameLabel: 'Nombre completo',
    businessNameLabel: 'Nombre del emprendimiento',
    businessNameHint: 'Usaremos este nombre en tu perfil público',
    whatsappLabel: 'WhatsApp',
    invalidWhatsapp: 'WhatsApp inválido',
    requestAlreadySubmitted: 'Solicitud ya enviada',
    planLabel: 'Plan',
    acceptBetaLabel: 'Aceptar condiciones beta',
    betaTermsLink: 'Ver condiciones',
    submitButton: 'Enviar solicitud',
  },
};

const enTranslations = {
  loginTitle: 'Sign in',
  loginSubmit: 'Sign in',
  tagline: '',
  backHome: 'Back to home',
  email: 'Email',
  password: 'Password',
  requestAccessTitle: 'Request access',
  requestAccessSubtitle: 'Fill out the form and you will receive access.',
  sendRequest: 'Send request',
  alreadyAccount: 'Already have an account?',
  goLogin: 'Go to login',
  landingLogin: 'Sign in',
  landingRequest: 'Request access',
  language: { toggle: 'Toggle language' },
  common: {
    tagline: 'Platform to showcase services or products.',
    email: 'Email',
    password: 'Password',
    backHome: 'Back to home',
  },
  landing: {
    title: 'Home',
    closeButton: 'Close',
    betaTitle: 'Free Beta Version',
    betaMessage: 'Beta message',
    betaOffer: 'Beta offer',
    betaLaunch: 'Beta launch',
    alreadyAccount: 'Already have an account?',
    subtitle: 'Subtitle',
    loginButton: 'Sign in',
    requestButton: 'Request access',
    nearbyButton: 'Nearby companies',
  },
  login: {
    title: 'Sign in',
    subtitle: 'Access your account',
    submitButton: 'Sign in',
    forgotPassword: 'Forgot your password?',
    resetPasswordTitle: 'Recover password',
    resetPasswordMessage: 'Enter your email',
    resetSendButton: 'Send request',
  },
  requestAccess: {
    title: 'Request access',
    subtitle: 'Fill out the form and you will receive access.',
    fullNameLabel: 'Full name',
    businessNameLabel: 'Business name',
    businessNameHint: 'We will use this name on your public profile',
    whatsappLabel: 'WhatsApp',
    invalidWhatsapp: 'Invalid WhatsApp',
    requestAlreadySubmitted: 'Request already submitted',
    planLabel: 'Plan',
    acceptBetaLabel: 'Accept beta terms',
    betaTermsLink: 'View terms',
    submitButton: 'Send request',
  },
};

// Comentado para evitar error en tests simples
// Los tests que necesiten i18n deben importarlo explícitamente
// appI18n.addResourceBundle('es', 'translation', esTranslations, true, true);
// appI18n.addResourceBundle('en', 'translation', enTranslations, true, true);
// appI18n.changeLanguage('es');

// Basic matchMedia mock for components that rely on it
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
