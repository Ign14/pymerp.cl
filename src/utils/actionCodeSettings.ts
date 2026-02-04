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
 * Configuración para correos de restablecimiento de contraseña.
 * Usamos handleCodeInApp=true para que el link vaya directo a /auth/action
 * y evitar el intermedio /__/auth/action que puede mostrar página en blanco.
 */
export const getResetPasswordActionCodeSettings = () => {
  return {
    url: getAuthContinueUrl(),
    handleCodeInApp: true,
  } as const;
};

/**
 * Configuración para correos de verificación de email.
 * También usamos handleCodeInApp=true para mantener la misma ruta.
 */
export const getVerifyEmailActionCodeSettings = () => {
  return {
    url: getAuthContinueUrl(),
    handleCodeInApp: true,
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
