import { DEFAULT_FUNCTIONS_REGION } from '../utils/constants';
import { logger } from '../utils/logger';

type EnvKeys =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_FIREBASE_FUNCTIONS_REGION'
  | 'VITE_GOOGLE_MAPS_API_KEY'
  | 'VITE_GA_MEASUREMENT_ID'
  | 'VITE_GA_DEBUG'
  | 'VITE_APP_VERSION'
  | 'VITE_APP_NAME'
  | 'VITE_APP_ENV'
  | 'VITE_ENABLE_ANALYTICS'
  | 'VITE_SENTRY_DSN'
  | 'VITE_E2E_USER';

const rawEnv = import.meta.env as unknown as Partial<Record<EnvKeys, string>>;

const normalizeEnvValue = (value: string | undefined): string => value?.trim() || '';

const missingVars: string[] = [];

const getEnvVar = (key: EnvKeys, { required = true, fallback = '' } = {}): string => {
  const value = normalizeEnvValue(rawEnv[key]);
  if (!value && required) {
    missingVars.push(key);
  }
  return value || fallback;
};

const firebase = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  functionsRegion: getEnvVar('VITE_FIREBASE_FUNCTIONS_REGION', {
    required: false,
    fallback: DEFAULT_FUNCTIONS_REGION,
  }),
};

if (missingVars.length > 0) {
  const message = `Variables de entorno faltantes: ${missingVars.join(', ')}`;
  logger.error('❌ Variables de entorno faltantes:', missingVars);
  logger.error('Por favor, verifica que el archivo .env existe y contiene todas las variables necesarias.');
  throw new Error(message);
}

export const env = {
  // App config
  app: {
    version: getEnvVar('VITE_APP_VERSION', { required: false, fallback: '1.0.0' }),
    name: getEnvVar('VITE_APP_NAME', { required: false, fallback: 'AgendaWeb' }),
    environment: getEnvVar('VITE_APP_ENV', { required: false, fallback: 'development' }),
  },
  
  // Firebase config
  firebase,
  
  // Google Maps
  googleMapsApiKey: getEnvVar('VITE_GOOGLE_MAPS_API_KEY', { required: false, fallback: '' }),
  
  // Analytics
  analytics: {
    measurementId: getEnvVar('VITE_GA_MEASUREMENT_ID', { required: false, fallback: '' }),
    debug: getEnvVar('VITE_GA_DEBUG', { required: false, fallback: 'false' }) === 'true',
    enabled: getEnvVar('VITE_ENABLE_ANALYTICS', { required: false, fallback: 'true' }) === 'true',
  },
  
  // Sentry
  sentry: {
    dsn: getEnvVar('VITE_SENTRY_DSN', { required: false, fallback: '' }),
  },
  
  // Feature flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  e2eUser: getEnvVar('VITE_E2E_USER', { required: false, fallback: '' }),
};
