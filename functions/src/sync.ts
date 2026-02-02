/**
 * Funciones de sincronización automática
 * Mantienen sincronizados los datos entre companies, public_companies y servicios
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

// Detectar discovery phase
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
 * Normaliza un slug: lowercase, sin espacios, sin acentos, guiones en lugar de espacios
 */
const normalizeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Sincroniza datos de una company a public_companies
 */
const syncCompanyToPublic = async (companyId: string, companyData: any) => {
  if (isDiscoveryPhase) return;
  
  ensureAdminInitialized();
  const firestore = getFirestore();
  
  // Solo sincronizar si tiene slug y publicEnabled
  if (!companyData.slug || !companyData.publicEnabled) {
    // Si no es pública, eliminar de public_companies si existe
    const publicRef = firestore.collection('public_companies').doc(companyId);
    const publicSnap = await publicRef.get();
    if (publicSnap.exists) {
      await publicRef.delete();
      console.log(`Empresa ${companyId} eliminada de public_companies (no es pública)`);
    }
    return;
  }

  // Preparar datos públicos (solo campos necesarios)
  const publicData: any = {
    company_id: companyId,
    name: companyData.name || '',
    slug: companyData.slug,
    category_id: companyData.category_id || companyData.categoryId || null,
    categoryGroup: companyData.categoryGroup || companyData.category_group || null,
    address: companyData.address || null,
    comuna: companyData.comuna || null,
    region: companyData.region || null,
    location: companyData.location || null,
    whatsapp: companyData.whatsapp || null,
    phone: companyData.phone || null,
    email: companyData.email || null,
    social_links: companyData.social_links || null,
    publicEnabled: true,
    updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
  };

  // Agregar horarios si existen
  if (companyData.weekday_days) publicData.weekday_days = companyData.weekday_days;
  if (companyData.weekday_open_time) publicData.weekday_open_time = companyData.weekday_open_time;
  if (companyData.weekday_close_time) publicData.weekday_close_time = companyData.weekday_close_time;
  if (companyData.weekend_days) publicData.weekend_days = companyData.weekend_days;
  if (companyData.weekend_open_time) publicData.weekend_open_time = companyData.weekend_open_time;
  if (companyData.weekend_close_time) publicData.weekend_close_time = companyData.weekend_close_time;

  // Escribir en public_companies
  await firestore.collection('public_companies').doc(companyId).set(publicData, { merge: true });
  
  console.log(`Empresa ${companyId} sincronizada a public_companies`);
};

/**
 * Trigger: Sincronizar automáticamente cuando se escribe en companies
 */
export const syncCompanyPublicOnWriteHandler = async (
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext
) => {
  if (isDiscoveryPhase) return;

  const companyId = context.params.companyId;
  const afterData = change.after.exists ? change.after.data() : null;

  // Si el documento fue eliminado
  if (!afterData) {
    ensureAdminInitialized();
    const firestore = getFirestore();
    const publicRef = firestore.collection('public_companies').doc(companyId);
    await publicRef.delete();
    console.log(`Empresa ${companyId} eliminada de public_companies (documento eliminado)`);
    return;
  }

  // Si está marcado como deleted
  if (afterData.deleted_at) {
    ensureAdminInitialized();
    const firestore = getFirestore();
    const publicRef = firestore.collection('public_companies').doc(companyId);
    await publicRef.delete();
    console.log(`Empresa ${companyId} eliminada de public_companies (soft delete)`);
    return;
  }

  // Sincronizar datos
  await syncCompanyToPublic(companyId, afterData);
};

/**
 * Callable: Sincronizar horarios de una empresa a public_companies
 */
export const syncCompanyPublicScheduleHandler = async (
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

  const companyId = data?.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('invalid-argument', 'companyId requerido');
  }

  // Verificar que el usuario pertenece a la empresa
  const userSnap = await firestore.doc(`users/${context.auth.uid}`).get();
  const userData = userSnap.data();
  if (!userData || userData.company_id !== companyId) {
    throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para esta empresa');
  }

  // Obtener datos de la empresa
  const companySnap = await firestore.doc(`companies/${companyId}`).get();
  if (!companySnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Empresa no encontrada');
  }

  const companyData = companySnap.data();
  await syncCompanyToPublic(companyId, companyData);

  return { success: true, companyId };
};

/**
 * Trigger: Actualizar slug de servicio automáticamente
 * Cuando se crea o actualiza un servicio, genera/actualiza su slug
 */
export const syncServiceSlugHandler = async (
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext
) => {
  if (isDiscoveryPhase) return;

  const afterData = change.after.exists ? change.after.data() : null;
  if (!afterData) return; // Servicio eliminado, nada que hacer

  const serviceId = context.params.serviceId;
  const serviceName = afterData.name;

  if (!serviceName) {
    console.warn(`Servicio ${serviceId} sin nombre, no se puede generar slug`);
    return;
  }

  // Generar slug si no existe o si el nombre cambió
  const currentSlug = afterData.slug;
  const expectedSlug = normalizeSlug(serviceName);

  if (currentSlug === expectedSlug) {
    return; // Ya tiene el slug correcto
  }

  ensureAdminInitialized();
  const firestore = getFirestore();

  // Verificar si el slug ya existe para otro servicio de la misma empresa
  const companyId = afterData.company_id;
  if (!companyId) {
    console.warn(`Servicio ${serviceId} sin company_id`);
    return;
  }

  const existingSlugQuery = await firestore
    .collection('services')
    .where('company_id', '==', companyId)
    .where('slug', '==', expectedSlug)
    .limit(1)
    .get();

  let finalSlug = expectedSlug;
  
  // Si ya existe y no es el mismo servicio, agregar sufijo
  if (!existingSlugQuery.empty && existingSlugQuery.docs[0].id !== serviceId) {
    finalSlug = `${expectedSlug}-${serviceId.substring(0, 6)}`;
  }

  // Actualizar el slug
  await change.after.ref.update({
    slug: finalSlug,
    updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Slug de servicio ${serviceId} actualizado a: ${finalSlug}`);
};
