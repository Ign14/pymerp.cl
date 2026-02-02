/**
 * Funciones GDPR para gestión de privacidad y eliminación de datos
 * Cumplimiento con RGPD (Reglamento General de Protección de Datos)
 */

import * as functions from 'firebase-functions/v1';

let admin: typeof import('firebase-admin') | null = null;

const getAdmin = () => {
  if (!admin) {
    admin = require('firebase-admin');
  }
  return admin;
};

const getFirestore = () => getAdmin().firestore();
const getAuth = () => getAdmin().auth();
const getStorage = () => getAdmin().storage();

const isDiscoveryPhase = Boolean(process.env.FUNCTIONS_CONTROL_API) ||
  (!process.env.GCLOUD_PROJECT && 
    !process.env.FIREBASE_CONFIG &&
    !process.env.FUNCTIONS_EMULATOR &&
    process.env.NODE_ENV !== 'test');

let _adminInitialized = false;

const ensureAdminInitialized = () => {
  if (_adminInitialized || isDiscoveryPhase) return;
  
  try {
    if (!getAdmin().apps || getAdmin().apps.length === 0) {
      getAdmin().initializeApp();
    }
    _adminInitialized = true;
  } catch (err) {
    console.warn('Admin already initialized or discovery phase');
  }
};

/**
 * Eliminar todos los datos de un usuario de forma segura
 */
const deleteUserData = async (uid: string, email: string): Promise<void> => {
  const firestore = getFirestore();
  const batch = firestore.batch();
  let totalDeleted = 0;

  console.log(`Iniciando eliminación de datos para usuario ${uid} (${email})`);

  // 1. Eliminar documento de usuario
  const userRef = firestore.doc(`users/${uid}`);
  batch.delete(userRef);
  totalDeleted++;

  // 2. Eliminar configuración de notificaciones
  const notificationSettingsQuery = await firestore
    .collection('notification_settings')
    .where('user_id', '==', uid)
    .get();
  
  notificationSettingsQuery.docs.forEach(doc => {
    batch.delete(doc.ref);
    totalDeleted++;
  });

  // 3. Anonimizar citas (no eliminar, solo anonimizar)
  const appointmentsQuery = await firestore
    .collection('appointments')
    .where('user_id', '==', uid)
    .get();
  
  appointmentsQuery.docs.forEach(doc => {
    batch.update(doc.ref, {
      user_id: '[deleted]',
      customer_name: '[Usuario Eliminado]',
      customer_email: '[deleted]',
      customer_phone: '[deleted]',
      notes: '[datos eliminados por solicitud GDPR]',
      gdpr_deleted: true,
      gdpr_deleted_at: getAdmin().firestore.FieldValue.serverTimestamp(),
    });
    totalDeleted++;
  });

  // 4. Eliminar solicitudes de acceso del usuario
  const accessRequestsQuery = await firestore
    .collection('accessRequests')
    .where('email', '==', email)
    .get();
  
  accessRequestsQuery.docs.forEach(doc => {
    batch.delete(doc.ref);
    totalDeleted++;
  });

  // 5. Eliminar bloqueos de citas
  const locksQuery = await firestore
    .collection('appointment_locks')
    .where('user_id', '==', uid)
    .get();
  
  locksQuery.docs.forEach(doc => {
    batch.delete(doc.ref);
    totalDeleted++;
  });

  // Commit batch
  await batch.commit();
  console.log(`Eliminados/anonimizados ${totalDeleted} documentos para usuario ${uid}`);

  // 6. Eliminar archivos de Storage del usuario (si existen)
  try {
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
    
    if (files.length > 0) {
      await Promise.all(files.map(file => file.delete()));
      console.log(`Eliminados ${files.length} archivos de Storage para usuario ${uid}`);
    }
  } catch (error) {
    console.error('Error eliminando archivos de Storage:', error);
    // No fallar por esto, continuar
  }

  // 7. Eliminar usuario de Auth (último paso)
  try {
    await getAuth().deleteUser(uid);
    console.log(`Usuario ${uid} eliminado de Firebase Auth`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Usuario ${uid} ya no existe en Auth`);
    } else {
      throw error;
    }
  }
};

/**
 * Callable: Solicitar eliminación de datos (GDPR)
 */
export const requestDataDeletionHandler = async (
  data: any,
  context: functions.https.CallableContext
) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
  }

  if (isDiscoveryPhase) {
    throw new functions.https.HttpsError('internal', 'Function not available during discovery');
  }

  ensureAdminInitialized();
  const firestore = getFirestore();

  const uid = context.auth.uid;
  const email = context.auth.token.email || '';
  const reason = data?.reason || 'No especificado';

  console.log(`Solicitud de eliminación de datos recibida de ${uid} (${email})`);

  // Crear documento de solicitud
  const requestRef = await firestore.collection('data_deletion_requests').add({
    user_id: uid,
    email,
    reason,
    status: 'pending',
    requested_at: getAdmin().firestore.FieldValue.serverTimestamp(),
    processed_at: null,
    scheduled_deletion: getAdmin().firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días después
    ),
  });

  console.log(`Solicitud de eliminación creada: ${requestRef.id}`);

  return {
    success: true,
    requestId: requestRef.id,
    message: 'Solicitud de eliminación de datos registrada. Se procesará en los próximos 30 días.',
    scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * Scheduled: Procesar solicitudes de eliminación de datos pendientes
 * Se ejecuta diariamente a las 2:00 AM
 */
export const processDataDeletionRequestsHandler = async (context: functions.EventContext): Promise<any> => {
  if (isDiscoveryPhase) return null;

  ensureAdminInitialized();
  const firestore = getFirestore();

  console.log('Iniciando procesamiento de solicitudes de eliminación GDPR...');

  const now = getAdmin().firestore.Timestamp.now();

  // Obtener solicitudes pendientes que ya deben procesarse
  const requestsQuery = await firestore
    .collection('data_deletion_requests')
    .where('status', '==', 'pending')
    .where('scheduled_deletion', '<=', now)
    .limit(50) // Procesar máximo 50 por ejecución
    .get();

  if (requestsQuery.empty) {
    console.log('No hay solicitudes de eliminación pendientes');
    return null;
  }

  console.log(`Procesando ${requestsQuery.size} solicitudes de eliminación...`);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const doc of requestsQuery.docs) {
    const request = doc.data();
    const { user_id, email } = request;

    try {
      console.log(`Procesando eliminación para ${user_id} (${email})`);
      
      // Eliminar datos del usuario
      await deleteUserData(user_id, email);

      // Marcar solicitud como completada
      await doc.ref.update({
        status: 'completed',
        processed_at: getAdmin().firestore.FieldValue.serverTimestamp(),
      });

      results.success++;
      console.log(`✓ Eliminación completada para ${user_id}`);
    } catch (error: any) {
      console.error(`✗ Error eliminando datos de ${user_id}:`, error);
      
      // Marcar como error
      await doc.ref.update({
        status: 'error',
        error_message: error.message,
        processed_at: getAdmin().firestore.FieldValue.serverTimestamp(),
      });

      results.failed++;
      results.errors.push(`${user_id}: ${error.message}`);
    }
  }

  console.log(`Procesamiento completado: ${results.success} exitosas, ${results.failed} fallidas`);
  
  if (results.errors.length > 0) {
    console.error('Errores encontrados:', results.errors);
  }

  return results;
};
