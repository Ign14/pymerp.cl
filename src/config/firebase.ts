import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { logger } from '../utils/logger';
import { env } from './env';

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  // Usar el bucket tal cual está configurado (puede ser *.appspot.com o *.firebasestorage.app)
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

logger.success('Firebase configurado correctamente');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Forzar long polling para evitar bloqueos por extensiones/adblockers en algunos navegadores
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
// Configurar Functions con la región definida en .env o el valor por defecto
export const functions = getFunctions(app, env.firebase.functionsRegion);
