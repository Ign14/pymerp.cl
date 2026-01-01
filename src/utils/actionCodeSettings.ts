import { getCurrentLanguage } from '../config/i18n';

const DEFAULT_APP_HOST = 'https://www.pymerp.cl';

const getAppOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_APP_HOST;
};

/**
 * Configuración para correos de restablecimiento de contraseña usando dominio pymerp.cl
 * Redirige a /auth/action que procesa el código y luego redirige a /change-password
 */
export const getResetPasswordActionCodeSettings = () => {
  const origin = getAppOrigin();
  return {
    url: `${origin}/auth/action`,
    handleCodeInApp: false,
  } as const;
};

/**
 * Configuración para correos de verificación de email usando dominio pymerp.cl
 * Redirige a /auth/action que procesa el código y luego redirige a /login
 */
export const getVerifyEmailActionCodeSettings = () => {
  const origin = getAppOrigin();
  return {
    url: `${origin}/auth/action`,
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
