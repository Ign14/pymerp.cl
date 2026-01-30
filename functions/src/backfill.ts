/**
 * Cloud Function para ejecutar backfill de empresas existentes
 * Solo accesible para SUPERADMIN
 */

import * as functions from 'firebase-functions/v1';
let admin: typeof import('firebase-admin') | null = null;

const getAdmin = () => {
  if (!admin) {
    // Lazy load to reduce discovery timeouts
    admin = require('firebase-admin');
  }
  return admin;
};

// Detectar discovery phase (cuando Firebase CLI está analizando el código).
// Incluye FUNCTIONS_CONTROL_API que el CLI setea durante la inspección.
const isDiscoveryPhase = Boolean(process.env.FUNCTIONS_CONTROL_API) ||
  (!process.env.GCLOUD_PROJECT && 
    !process.env.FIREBASE_CONFIG &&
    !process.env.FUNCTIONS_EMULATOR &&
    process.env.NODE_ENV !== 'test');

// Lazy initialization de Firebase Admin para evitar timeouts en deployment
let _adminInitialized = false;

const ensureProjectEnv = () => {
  // Si ya están configuradas, no hacer nada
  if (process.env.GCLOUD_PROJECT && process.env.FIREBASE_CONFIG) {
    return;
  }

  try {
    const getProjectIdFromConfig = () => {
      try {
        const cfg = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
        return cfg.projectId as string | undefined;
      } catch {
        // Silently ignore durante discovery
        return undefined;
      }
    };

    const projectId =
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      getProjectIdFromConfig() ||
      'local-dev';

    if (!process.env.GCLOUD_PROJECT) {
      process.env.GCLOUD_PROJECT = projectId;
    }
    if (!process.env.GCP_PROJECT) {
      process.env.GCP_PROJECT = projectId;
    }
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      process.env.GOOGLE_CLOUD_PROJECT = projectId;
    }

    if (!process.env.FIREBASE_CONFIG) {
      process.env.FIREBASE_CONFIG = JSON.stringify({ projectId });
    }
  } catch (err) {
    // Silently ignore durante discovery - no lanzar errores
    console.warn('Warning: Could not set project env vars during discovery:', err);
  }
};

const ensureAdminInitialized = () => {
  // Evitar inicialización durante discovery (cuando no hay GCLOUD_PROJECT)
  if (isDiscoveryPhase) {
    return; // Silently skip durante discovery
  }
  
  if (!_adminInitialized) {
    ensureProjectEnv(); // Asegurar variables de entorno antes de inicializar
    try {
      getAdmin().initializeApp();
      _adminInitialized = true;
    } catch (error: any) {
      // Si ya está inicializado, ignorar el error
      if (error.code !== 'app/already-initialized') {
        // Durante discovery, ignorar errores silenciosamente
        if (isDiscoveryPhase) {
          return;
        }
        throw error;
      }
      _adminInitialized = true;
    }
  }
};

// Helper para obtener Firestore de forma lazy (evita dependencias circulares)
const getFirestore = () => {
  // Evitar ejecución durante discovery - retornar mock seguro
  if (isDiscoveryPhase) {
    // Retornar un mock que tenga la estructura mínima necesaria para evitar errores
    return {
      collection: () => ({ 
        doc: () => ({ get: async () => ({ exists: false, data: () => null, id: '' }) }), 
        where: () => ({ get: async () => ({ docs: [], empty: true }) }),
        add: async () => ({ id: '' }),
      }),
      doc: () => ({ 
        get: async () => ({ exists: false, data: () => null, id: '' }), 
        set: async () => {}, 
        update: async () => {},
      }),
      batch: () => ({
        update: () => {},
        commit: async () => {},
      }),
    } as any;
  }
  
  ensureProjectEnv(); // Asegurar variables de entorno antes de inicializar
  ensureAdminInitialized();
  return getAdmin().firestore();
};

// Importar resolveCategoryId desde el código fuente compartido
// Como no podemos importar directamente desde src/, duplicamos la lógica aquí
const CATEGORIES = [
  'clinicas_odontologicas',
  'clinicas_kinesiologicas',
  'centros_entrenamiento',
  'centros_terapia',
  'psicologia',
  'nutricion',
  'masajes_spa',
  'barberias',
  'peluquerias',
  'centros_estetica',
  'unas',
  'tatuajes_piercing',
  'aseo_ornato',
  'chef_personal',
  'asesoria_hogar',
  'construccion_mantencion',
  'taller_vehiculos',
  'cursos_capacitaciones',
  'minimarket',
  'articulos_aseo',
  'ferreteria',
  'floreria',
  'ropa_accesorios',
  'libreria_papeleria',
  'tecnologia',
  'botillerias',
  'restaurantes_comida_rapida',
  'restaurantes',
  'bares',
  'foodtruck',
  'panaderia_pasteleria',
  'centros_eventos',
  'deporte_aventura',
  'turismo',
  'fotografia',
  'mascotas_veterinarias',
  'artesania',
  'talabarteria',
  'taller_artes',
  'agenda_profesionales',
  'servicios_legales',
  'contabilidad',
  'bodegas_logistica',
  'agricultura_productores',
  'otros',
] as const;

type CategoryId = typeof CATEGORIES[number];

function resolveCategoryId(company: { category_id?: string | null; categoryId?: string | null } | null | undefined): CategoryId {
  if (!company) {
    return 'otros';
  }
  const rawId = company.category_id ?? company.categoryId ?? null;
  if (!rawId || typeof rawId !== 'string') {
    return 'otros';
  }
  if (CATEGORIES.includes(rawId as CategoryId)) {
    return rawId as CategoryId;
  }
  return 'otros';
}

// Mapeo de grupos por categoría (debe coincidir con src/config/categories.ts)
const getCategoryGroup = (categoryId: string): string => {
  const groupMap: Record<string, string> = {
    // SALUD
    clinicas_odontologicas: 'SALUD',
    clinicas_kinesiologicas: 'SALUD',
    centros_entrenamiento: 'SALUD',
    centros_terapia: 'SALUD',
    psicologia: 'SALUD',
    nutricion: 'SALUD',
    masajes_spa: 'SALUD',
    // BELLEZA
    barberias: 'BELLEZA',
    peluquerias: 'BELLEZA',
    centros_estetica: 'BELLEZA',
    unas: 'BELLEZA',
    tatuajes_piercing: 'BELLEZA',
    // HOGAR
    aseo_ornato: 'HOGAR',
    chef_personal: 'HOGAR',
    asesoria_hogar: 'HOGAR',
    construccion_mantencion: 'HOGAR',
    // AUTOMOTRIZ
    taller_vehiculos: 'AUTOMOTRIZ',
    // EDUCACION
    cursos_capacitaciones: 'EDUCACION',
    // RETAIL
    minimarket: 'RETAIL',
    articulos_aseo: 'RETAIL',
    ferreteria: 'RETAIL',
    floreria: 'RETAIL',
    ropa_accesorios: 'RETAIL',
    libreria_papeleria: 'RETAIL',
    tecnologia: 'RETAIL',
    botillerias: 'RETAIL',
    // ALIMENTOS
    restaurantes_comida_rapida: 'ALIMENTOS',
    restaurantes: 'ALIMENTOS',
    bares: 'ALIMENTOS',
    foodtruck: 'ALIMENTOS',
    panaderia_pasteleria: 'ALIMENTOS',
    // TURISMO_EVENTOS
    centros_eventos: 'TURISMO_EVENTOS',
    deporte_aventura: 'TURISMO_EVENTOS',
    turismo: 'TURISMO_EVENTOS',
    fotografia: 'TURISMO_EVENTOS',
    // MASCOTAS
    mascotas_veterinarias: 'MASCOTAS',
    // ARTES_OFICIOS
    artesania: 'ARTES_OFICIOS',
    talabarteria: 'ARTES_OFICIOS',
    taller_artes: 'ARTES_OFICIOS',
    // OTROS
    agenda_profesionales: 'OTROS',
    servicios_legales: 'OTROS',
    contabilidad: 'OTROS',
    bodegas_logistica: 'OTROS',
    agricultura_productores: 'OTROS',
    otros: 'OTROS',
  };
  return groupMap[categoryId] || 'OTROS';
};

/**
 * Handler para ejecutar backfill de empresas
 * Solo accesible para SUPERADMIN
 */
export const backfillCompaniesHandler = async (data: any, context: functions.https.CallableContext) => {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    }

    // Verificar que sea SUPERADMIN
    const userDoc = await getFirestore().doc(`users/${context.auth.uid}`).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Usuario no encontrado');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'SUPERADMIN') {
      throw new functions.https.HttpsError('permission-denied', 'Solo SUPERADMIN puede ejecutar backfill');
    }

    const firestore = getFirestore();
    const companiesRef = firestore.collection('companies');
    const snapshot = await companiesRef.get();

    if (snapshot.empty) {
      return {
        success: true,
        updated: 0,
        skipped: 0,
        total: 0,
        message: 'No hay empresas para procesar',
      };
    }

    let updated = 0;
    let skipped = 0;
    let batch = firestore.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Límite de Firestore

    const commitBatch = async (reason: string) => {
      if (batchCount === 0) return;
      await batch.commit();
      console.log(`✅ Procesado batch de ${batchCount} empresas (${reason})`);
      batch = firestore.batch(); // Crear nuevo batch después de cada commit
      batchCount = 0;
    };

    for (const doc of snapshot.docs) {
      const company: any = { id: doc.id, ...doc.data() };
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // 1. Asignar categoryId si no existe
      if (!company.category_id) {
        updates.category_id = 'otros';
        needsUpdate = true;
      }

      // 2. Resolver categoryId válido y asignar categoryGroup
      const resolvedCategoryId = resolveCategoryId(company);
      if (company.category_id !== resolvedCategoryId) {
        updates.category_id = resolvedCategoryId;
        needsUpdate = true;
      }

      // 3. Asignar categoryGroup si no existe
      if (!company.categoryGroup) {
        updates.categoryGroup = getCategoryGroup(resolvedCategoryId);
        needsUpdate = true;
      }

      // 4. Asignar publicEnabled si no existe
      if (company.publicEnabled === undefined) {
        updates.publicEnabled = false;
        needsUpdate = true;
      }

      // 5. Asignar planId si no existe
      if (!company.planId) {
        // Migrar de subscription_plan legacy si existe
        if (company.subscription_plan) {
          const planMapping: Record<string, string> = {
            BASIC: 'BASIC',
            STANDARD: 'STARTER',
            PRO: 'PRO',
            APPROVED25: 'BUSINESS',
          };
          updates.planId = planMapping[company.subscription_plan] || 'BASIC';
        } else {
          updates.planId = 'BASIC';
        }
        needsUpdate = true;
      }

      // 6. Asignar businessMode desde business_type si no existe
      if (!company.businessMode && company.business_type) {
        updates.businessMode = company.business_type;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const companyRef = companiesRef.doc(company.id);
        batch.update(companyRef, {
          ...updates,
          updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
        });
        batchCount++;
        updated++;

        if (batchCount >= BATCH_SIZE) {
          await commitBatch('límite de batch alcanzado');
        }
      } else {
        skipped++;
      }
    }

    // Commit del batch final
    await commitBatch('batch final');

    return {
      success: true,
      updated,
      skipped,
      total: snapshot.size,
      message: `Backfill completado: ${updated} actualizadas, ${skipped} omitidas`,
    };
};

/**
 * Handler para sincronizar companies_public desde companies
 * Solo sincroniza empresas con publicEnabled=true y location definido
 * Solo accesible para SUPERADMIN
 */
export const syncPublicCompaniesHandler = async (data: any, context: functions.https.CallableContext) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
  }

  // Verificar que sea SUPERADMIN
  const userDoc = await getFirestore().doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Usuario no encontrado');
  }

  const userData = userDoc.data();
  if (userData?.role !== 'SUPERADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Solo SUPERADMIN puede ejecutar sincronización');
  }

  const firestore = getFirestore();
  const companiesRef = firestore.collection('companies');
  const publicCompaniesRef = firestore.collection('companies_public');
  
  const snapshot = await companiesRef.get();

  if (snapshot.empty) {
    return {
      success: true,
      synced: 0,
      deleted: 0,
      skipped: 0,
      total: 0,
      message: 'No hay empresas para procesar',
    };
  }

  const getGeohashForLocation = () => {
    try {
      const geofireCommon = require('geofire-common');
      return geofireCommon.geohashForLocation as (coords: [number, number]) => string;
    } catch (error) {
      console.error('Error cargando geofire-common:', error);
      throw new functions.https.HttpsError('internal', 'Error cargando geofire-common');
    }
  };
  const geohashForLocation = getGeohashForLocation();

  let synced = 0;
  let deleted = 0;
  let skipped = 0;
  let batch = firestore.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500; // Límite de Firestore

  const commitBatch = async (reason: string) => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`✅ Procesado batch de ${batchCount} empresas (${reason})`);
    batch = firestore.batch(); // Crear nuevo batch después de cada commit
    batchCount = 0;
  };

  // Obtener todas las empresas públicas existentes para comparar
  const existingPublicSnapshot = await publicCompaniesRef.get();
  const existingPublicIds = new Set(existingPublicSnapshot.docs.map(doc => doc.id));

  for (const doc of snapshot.docs) {
    const company: any = { id: doc.id, ...doc.data() };
    
    // Verificar si debe estar en companies_public
    const shouldBePublic = company.publicEnabled === true && 
                          company.location && 
                          (company.location.latitude !== undefined || 
                           (company.location.lat && typeof company.location.lat === 'function'));

    if (!shouldBePublic) {
      // Si no debe estar público, eliminarlo de companies_public si existe
      if (existingPublicIds.has(company.id)) {
        const publicRef = publicCompaniesRef.doc(company.id);
        batch.delete(publicRef);
        batchCount++;
        deleted++;
        
        if (batchCount >= BATCH_SIZE) {
          await commitBatch('límite de batch alcanzado (eliminaciones)');
        }
      } else {
        skipped++;
      }
      continue;
    }

    // Extraer location
    let latitude: number;
    let longitude: number;
    
    if (company.location.latitude !== undefined && company.location.longitude !== undefined) {
      latitude = company.location.latitude;
      longitude = company.location.longitude;
    } else if (company.location.lat && typeof company.location.lat === 'function') {
      // GeoPoint de Firestore
      latitude = company.location.lat();
      longitude = company.location.lng();
    } else {
      // También verificar company.latitude/longitude como fallback
      if (company.latitude && company.longitude) {
        latitude = company.latitude;
        longitude = company.longitude;
      } else {
        skipped++;
        continue;
      }
    }

    // Calcular geohash
    let geohash: string;
    try {
      geohash = geohashForLocation([latitude, longitude]);
    } catch (error) {
      console.warn(`Error calculando geohash para empresa ${company.id}:`, error);
      skipped++;
      continue;
    }

    // Preparar datos para companies_public
    const publicCompanyData: any = {
      name: company.name || '',
      slug: company.slug || '',
      publicSlug: company.slug || '',
      categoryId: company.category_id || null,
      categoryGroup: company.categoryGroup || null,
      comuna: company.commune || null,
      region: company.region || null,
      geohash: geohash,
      location: new (getAdmin().firestore.GeoPoint)(latitude, longitude),
      business_type: company.business_type || null,
      businessMode: company.businessMode || company.business_type || null,
      status: company.status || 'ACTIVE',
      address: company.address || null,
      whatsapp: company.whatsapp || null,
      industry: company.industry || null,
      sector: company.sector || null,
      seo_keyword: company.seo_keyword || null,
      description: company.description || null,
      show_description: company.show_description ?? null,
      mission: company.mission || null,
      vision: company.vision || null,
      show_mission_vision: company.show_mission_vision ?? null,
      booking_message: company.booking_message || null,
      public_layout_variant: company.public_layout_variant || null,
      publicEnabled: company.publicEnabled === true,
      video_enabled: company.video_enabled === true,
      video_url: company.video_url || null,
      video_placement: company.video_placement || null,
      background_enabled: company.background_enabled === true,
      background_url: company.background_url || null,
      background_orientation: company.background_orientation || null,
      background_fit: company.background_fit || null,
      background_opacity: company.background_opacity ?? null,
      weekday_days: company.weekday_days || null,
      weekday_open_time: company.weekday_open_time || null,
      weekday_close_time: company.weekday_close_time || null,
      weekend_days: company.weekend_days || null,
      weekend_open_time: company.weekend_open_time || null,
      weekend_close_time: company.weekend_close_time || null,
      delivery_enabled: company.delivery_enabled === true,
      fulfillment_config: company.fulfillment_config || null,
      externalWebsiteEnabled: company.externalWebsiteEnabled === true,
      externalWebsiteUrl: company.externalWebsiteUrl || null,
      latitude,
      longitude,
    };

    // Agregar campos opcionales si existen
    if (company.description) {
      publicCompanyData.shortDescription = company.description.substring(0, 200); // Limitar longitud
    }
    if (company.photos && Array.isArray(company.photos) && company.photos.length > 0) {
      publicCompanyData.photos = company.photos.slice(0, 5); // Limitar a 5 fotos
    }

    const publicRef = publicCompaniesRef.doc(company.id);
    batch.set(publicRef, publicCompanyData, { merge: true });
    batchCount++;
    synced++;

    if (batchCount >= BATCH_SIZE) {
      await commitBatch('límite de batch alcanzado');
    }
  }

  // Commit del batch final
  await commitBatch('batch final');

  return {
    success: true,
    synced,
    deleted,
    skipped,
    total: snapshot.size,
    message: `Sincronización completada: ${synced} sincronizadas, ${deleted} eliminadas, ${skipped} omitidas`,
  };
};

const buildPublicCompanyData = (company: any, latitude?: number, longitude?: number): any => {
  const publicCompanyData: any = {
    name: company.name || '',
    slug: company.slug || '',
    publicSlug: company.slug || '',
    categoryId: company.category_id || company.categoryId || null,
    categoryGroup: company.categoryGroup || null,
    comuna: company.commune || company.comuna || null,
    region: company.region || null,
    business_type: company.business_type || null,
    businessMode: company.businessMode || company.business_type || null,
    status: company.status || 'ACTIVE',
    address: company.address || null,
    whatsapp: company.whatsapp || null,
    industry: company.industry || null,
    sector: company.sector || null,
    seo_keyword: company.seo_keyword || null,
    description: company.description || null,
    show_description: company.show_description ?? null,
    mission: company.mission || null,
    vision: company.vision || null,
    show_mission_vision: company.show_mission_vision ?? null,
    booking_message: company.booking_message || null,
    public_layout_variant: company.public_layout_variant || null,
    publicEnabled: company.publicEnabled === true,
    video_enabled: company.video_enabled === true,
    video_url: company.video_url || null,
    video_placement: company.video_placement || null,
    background_enabled: company.background_enabled === true,
    background_url: company.background_url || null,
    background_orientation: company.background_orientation || null,
    background_fit: company.background_fit || null,
    background_opacity: company.background_opacity ?? null,
    weekday_days: company.weekday_days || null,
    weekday_open_time: company.weekday_open_time || null,
    weekday_close_time: company.weekday_close_time || null,
    weekend_days: company.weekend_days || null,
    weekend_open_time: company.weekend_open_time || null,
    weekend_close_time: company.weekend_close_time || null,
    delivery_enabled: company.delivery_enabled === true,
    fulfillment_config: company.fulfillment_config || null,
    externalWebsiteEnabled: company.externalWebsiteEnabled === true,
    externalWebsiteUrl: company.externalWebsiteUrl || null,
  };

  if (latitude != null && longitude != null) {
    publicCompanyData.location = new (getAdmin().firestore.GeoPoint)(latitude, longitude);
    publicCompanyData.latitude = latitude;
    publicCompanyData.longitude = longitude;
  }

  if (company.photos && Array.isArray(company.photos) && company.photos.length > 0) {
    publicCompanyData.photos = company.photos.slice(0, 5);
  }
  if (company.description) {
    publicCompanyData.shortDescription = company.description.substring(0, 200);
  }

  return publicCompanyData;
};

/**
 * Handler para sincronizar una empresa específica hacia companies_public.
 * Permite forzar el sync aun si no tiene publicEnabled/location.
 * Solo accesible para SUPERADMIN.
 */
export const syncPublicCompanyBySlugHandler = async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
  }

  const userDoc = await getFirestore().doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Usuario no encontrado');
  }

  const userData = userDoc.data();
  if (userData?.role !== 'SUPERADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Solo SUPERADMIN puede ejecutar sincronización');
  }

  const slug = data?.slug;
  const force = data?.force === true;
  if (!slug || typeof slug !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'slug requerido');
  }

  const firestore = getFirestore();
  const companySnap = await firestore.collection('companies').where('slug', '==', slug).limit(1).get();
  if (companySnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Empresa no encontrada');
  }

  const doc = companySnap.docs[0];
  const company: any = { id: doc.id, ...doc.data() };

  let latitude: number | undefined;
  let longitude: number | undefined;
  if (company.location?.latitude != null && company.location?.longitude != null) {
    latitude = company.location.latitude;
    longitude = company.location.longitude;
  } else if (company.location?.lat && typeof company.location.lat === 'function') {
    latitude = company.location.lat();
    longitude = company.location.lng();
  } else if (company.latitude != null && company.longitude != null) {
    latitude = company.latitude;
    longitude = company.longitude;
  }

  const hasLocation = latitude != null && longitude != null;
  if (!force && !(company.publicEnabled === true && hasLocation)) {
    throw new functions.https.HttpsError('failed-precondition', 'Empresa no es pública o no tiene ubicación');
  }

  const publicData = buildPublicCompanyData(company, latitude, longitude);
  if (hasLocation) {
    try {
      const geofireCommon = require('geofire-common');
      publicData.geohash = geofireCommon.geohashForLocation([latitude, longitude]);
    } catch (error) {
      console.warn('Error calculando geohash:', error);
    }
  }

  await firestore.collection('companies_public').doc(company.id).set(publicData, { merge: true });
  return { success: true, companyId: company.id };
};

/**
 * Handler para habilitar publicEnabled en empresas con ubicación
 * Solo habilita empresas que tienen location pero publicEnabled no está en true
 * Solo accesible para SUPERADMIN
 */
export const enablePublicForCompaniesWithLocationHandler = async (data: any, context: functions.https.CallableContext) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
  }

  // Verificar que sea SUPERADMIN
  const userDoc = await getFirestore().doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Usuario no encontrado');
  }

  const userData = userDoc.data();
  if (userData?.role !== 'SUPERADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Solo SUPERADMIN puede ejecutar esta función');
  }

  const firestore = getFirestore();
  const companiesRef = firestore.collection('companies');
  const snapshot = await companiesRef.get();

  if (snapshot.empty) {
    return {
      success: true,
      enabled: 0,
      skipped: 0,
      total: 0,
      message: 'No hay empresas para procesar',
    };
  }

  let enabled = 0;
  let skipped = 0;
  let batch = firestore.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500; // Límite de Firestore

  const commitBatch = async (reason: string) => {
    if (batchCount === 0) return;
    await batch.commit();
    console.log(`✅ Procesado batch de ${batchCount} empresas (${reason})`);
    batch = firestore.batch(); // Crear nuevo batch después de cada commit
    batchCount = 0;
  };

  for (const doc of snapshot.docs) {
    const company: any = { id: doc.id, ...doc.data() };
    
    // Solo habilitar si:
    // 1. Tiene location definido
    // 2. publicEnabled no está en true (undefined o false)
    const hasLocation = company.location && (
      company.location.latitude !== undefined || 
      (company.location.lat && typeof company.location.lat === 'function') ||
      (company.latitude && company.longitude)
    );

    if (hasLocation && company.publicEnabled !== true) {
      const companyRef = companiesRef.doc(company.id);
      batch.update(companyRef, {
        publicEnabled: true,
        updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
      });
      batchCount++;
      enabled++;

      if (batchCount >= BATCH_SIZE) {
        await commitBatch('límite de batch alcanzado');
      }
    } else {
      skipped++;
    }
  }

  // Commit del batch final
  await commitBatch('batch final');

  return {
    success: true,
    enabled,
    skipped,
    total: snapshot.size,
    message: `Habilitación completada: ${enabled} empresas habilitadas para aparecer en el mapa, ${skipped} omitidas`,
  };
};

/**
 * Migración puntual: deja la empresa del usuario actual en "foodtruck".
 * Útil cuando se dividió restaurantes_comida_rapida en categorías nuevas.
 */
export const migrateMyCompanyToFoodtruckHandler = async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
  }

  // Evitar ejecución durante discovery
  if (isDiscoveryPhase) {
    throw new functions.https.HttpsError('internal', 'Function not available during discovery');
  }

  ensureAdminInitialized();
  const firestore = getFirestore();

  // Obtener company_id desde el user doc
  const userSnap = await firestore.doc(`users/${context.auth.uid}`).get();
  const companyId = (userSnap.exists ? (userSnap.data() as any)?.company_id : null) as string | null;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Usuario sin company_id asociado');
  }

  const companyRef = firestore.doc(`companies/${companyId}`);
  const companySnap = await companyRef.get();
  if (!companySnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Compañía no encontrada');
  }

  const prevCategory = (companySnap.get('category_id') as string | null) || null;

  await companyRef.update({
    category_id: 'foodtruck',
    categoryGroup: 'ALIMENTOS',
    // Guardar también el grupo en sector para compatibilidad
    sector: 'ALIMENTOS',
    updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    companyId,
    previousCategoryId: prevCategory,
    newCategoryId: 'foodtruck',
  };
};
