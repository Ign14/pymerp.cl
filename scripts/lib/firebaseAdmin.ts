import admin from 'firebase-admin';

type AdminOptions = {
  useEmulator?: boolean;
  projectId?: string;
};

let initialized = false;

export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;

export function initFirebaseAdmin(options: AdminOptions = {}) {
  const { useEmulator = false, projectId } = options;

  if (!initialized) {
    if (useEmulator) {
      // Defaults matching firebase.json emulators
      process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8081';
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
      process.env.GCLOUD_PROJECT ||= projectId || 'demo-project';
    }

    const appOptions: admin.AppOptions = {};
    if (projectId) {
      appOptions.projectId = projectId;
    }

    if (!admin.apps.length) {
      admin.initializeApp(appOptions);
    }
    initialized = true;
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  const auth = admin.auth();

  return { db, auth };
}

export function isEmulator(): boolean {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
}
