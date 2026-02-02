/**
 * Funciones para gestión de horarios de servicios y profesionales
 */

import * as functions from 'firebase-functions/v1';
import cors from 'cors';

let admin: typeof import('firebase-admin') | null = null;

const getAdmin = () => {
  if (!admin) {
    admin = require('firebase-admin');
  }
  return admin;
};

const getFirestore = () => getAdmin().firestore();

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

// CORS para permitir llamadas desde el frontend
const corsHandler = cors({ origin: true });

/**
 * Validar estructura de horarios
 */
const validateSchedule = (schedule: any): boolean => {
  if (!schedule || typeof schedule !== 'object') return false;
  
  // Validar que tenga al menos un día con horarios
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let hasAtLeastOneDay = false;
  
  for (const day of days) {
    if (schedule[day]) {
      hasAtLeastOneDay = true;
      
      // Validar estructura del día
      if (!Array.isArray(schedule[day])) return false;
      
      for (const slot of schedule[day]) {
        if (!slot.start || !slot.end) return false;
        
        // Validar formato de hora (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) return false;
      }
    }
  }
  
  return hasAtLeastOneDay;
};

/**
 * Handler callable: Configurar horarios de servicios/profesionales
 */
export const setServiceSchedulesHandler = async (
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

  const { serviceId, professionalId, schedule } = data;

  if (!serviceId && !professionalId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere serviceId o professionalId'
    );
  }

  if (!schedule || !validateSchedule(schedule)) {
    throw new functions.https.HttpsError('invalid-argument', 'Estructura de horarios inválida');
  }

  // Verificar permisos del usuario
  const userSnap = await firestore.doc(`users/${context.auth.uid}`).get();
  const userData = userSnap.data();
  
  if (!userData || !userData.company_id) {
    throw new functions.https.HttpsError('permission-denied', 'Usuario sin empresa asociada');
  }

  const userCompanyId = userData.company_id;

  // Si es para un servicio, verificar que pertenece a la empresa del usuario
  if (serviceId) {
    const serviceSnap = await firestore.doc(`services/${serviceId}`).get();
    
    if (!serviceSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Servicio no encontrado');
    }

    const serviceData = serviceSnap.data();
    if (serviceData?.company_id !== userCompanyId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No tienes permiso para modificar este servicio'
      );
    }

    // Actualizar horarios del servicio
    await serviceSnap.ref.update({
      schedule,
      updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, serviceId, message: 'Horarios de servicio actualizados' };
  }

  // Si es para un profesional, verificar que pertenece a la empresa del usuario
  if (professionalId) {
    const professionalSnap = await firestore.doc(`professionals/${professionalId}`).get();
    
    if (!professionalSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Profesional no encontrado');
    }

    const professionalData = professionalSnap.data();
    if (professionalData?.company_id !== userCompanyId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No tienes permiso para modificar este profesional'
      );
    }

    // Actualizar horarios del profesional
    await professionalSnap.ref.update({
      schedule,
      updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, professionalId, message: 'Horarios de profesional actualizados' };
  }

  throw new functions.https.HttpsError('internal', 'Error inesperado');
};

/**
 * Handler HTTP: Configurar horarios (versión HTTP)
 */
export const setServiceSchedulesHttpHandler = async (req: any, res: any) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    if (isDiscoveryPhase) {
      res.status(503).json({ success: false, error: 'Service unavailable' });
      return;
    }

    ensureAdminInitialized();

    try {
      // Verificar token de autenticación
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'No autorizado' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await getAdmin().auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Obtener datos del body
      const { serviceId, professionalId, schedule } = req.body;

      if (!serviceId && !professionalId) {
        res.status(400).json({
          success: false,
          error: 'Se requiere serviceId o professionalId',
        });
        return;
      }

      if (!schedule || !validateSchedule(schedule)) {
        res.status(400).json({ success: false, error: 'Estructura de horarios inválida' });
        return;
      }

      const firestore = getFirestore();

      // Verificar permisos del usuario
      const userSnap = await firestore.doc(`users/${uid}`).get();
      const userData = userSnap.data();
      
      if (!userData || !userData.company_id) {
        res.status(403).json({ success: false, error: 'Usuario sin empresa asociada' });
        return;
      }

      const userCompanyId = userData.company_id;

      // Procesar según tipo
      if (serviceId) {
        const serviceSnap = await firestore.doc(`services/${serviceId}`).get();
        
        if (!serviceSnap.exists) {
          res.status(404).json({ success: false, error: 'Servicio no encontrado' });
          return;
        }

        const serviceData = serviceSnap.data();
        if (serviceData?.company_id !== userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'No tienes permiso para modificar este servicio',
          });
          return;
        }

        await serviceSnap.ref.update({
          schedule,
          updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({
          success: true,
          serviceId,
          message: 'Horarios de servicio actualizados',
        });
        return;
      }

      if (professionalId) {
        const professionalSnap = await firestore.doc(`professionals/${professionalId}`).get();
        
        if (!professionalSnap.exists) {
          res.status(404).json({ success: false, error: 'Profesional no encontrado' });
          return;
        }

        const professionalData = professionalSnap.data();
        if (professionalData?.company_id !== userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'No tienes permiso para modificar este profesional',
          });
          return;
        }

        await professionalSnap.ref.update({
          schedule,
          updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({
          success: true,
          professionalId,
          message: 'Horarios de profesional actualizados',
        });
        return;
      }

      res.status(500).json({ success: false, error: 'Error inesperado' });
    } catch (error: any) {
      console.error('Error en setServiceSchedulesHttp:', error);
      res.status(500).json({ success: false, error: error.message || 'Error interno' });
    }
  });
};
