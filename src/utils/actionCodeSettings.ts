import { getCurrentLanguage } from '../config/i18n';

const DEFAULT_APP_HOST = 'https://pymerp.cl';

const isLocalOrigin = (origin: string) => /localhost|127\.0\.0\.1/.test(origin);
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '').replace('www.', '');

const getAppOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_APP_HOST;
};

const getAuthContinueUrl = () => {
  const origin = getAppOrigin();
  if (isLocalOrigin(origin)) {
    return `${origin}/auth/action`;
  }

  const normalized = normalizeOrigin(origin);
  if (normalized.includes('pymerp.cl')) {
    return `${normalized}/auth/action`;
  }

  return `${DEFAULT_APP_HOST}/auth/action`;
};

/**
 * Configuración para correos de restablecimiento de contraseña usando la autenticación de Firebase Hosting
 * El handler real será https://pymerp.cl/__/auth/action cuando authDomain esté configurado con pymerp.cl.
 * El continueUrl lleva a /auth/action (nuestra pantalla).
 */
export const getResetPasswordActionCodeSettings = () => {
  return {
    url: getAuthContinueUrl(),
    handleCodeInApp: false,
  } as const;
};

/**
 * Configuración para correos de verificación de email usando la autenticación de Firebase Hosting
 * El handler real será https://pymerp.cl/__/auth/action cuando authDomain esté configurado con pymerp.cl.
 * El continueUrl lleva a /auth/action (nuestra pantalla).
 */
export const getVerifyEmailActionCodeSettings = () => {
  return {
    url: getAuthContinueUrl(),
    handleCodeInApp: false,
  } as const;
};

/**
 * Ajusta el idioma de Auth para que Firebase envíe correos localizados.
 */
export const setAuthLanguage = (authInstance: { languageCode?: string | null }) => {
  try {
    authInstance.languageCode = getCurrentLanguage();
  } catch {
    /* noop */
  }
};
