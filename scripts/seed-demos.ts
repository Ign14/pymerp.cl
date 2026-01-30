#!/usr/bin/env tsx
/**
 * Seed de datos demo multi-tenant.
 *
 * Uso:
 *  - node scripts/seed-demos.ts --emulator (default)
 *  - node scripts/seed-demos.ts --project <id> --confirm-prod
 *  - node scripts/seed-demos.ts --from 2
 */

import { Timestamp } from './lib/firebaseAdmin';
import { initFirebaseAdmin } from './lib/firebaseAdmin';
import { batchSet, deleteDemoDocs, mergeTimestamps } from './lib/upsert';
import { buildDemoData } from './demo-templates';
import { getDemoProfile, type DemoProfile } from './demo-templates/profiles';
import { getAllCategories, resolveCategoryId, type CategoryConfig } from '../src/config/categories';
import { geohashForLocation } from 'geofire-common';

type SeedOptions = {
  useEmulator: boolean;
  projectId?: string;
  confirmProd: boolean;
  startFrom: number;
};

type DemoAssignment = {
  category: CategoryConfig;
  slug: string;
  email: string;
  demoNumber: number;
};

const PASSWORD = 'Pymerp.cl1234';

// Coordenadas de Romeral, Región del Maule, Chile
const ROMERAL_LATITUDE = -34.9600;
const ROMERAL_LONGITUDE = -71.3300;

const parseArgs = (): SeedOptions => {
  const argv = process.argv.slice(2);
  const opts: SeedOptions = {
    useEmulator: true,
    confirmProd: false,
    startFrom: 2,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--emulator') {
      opts.useEmulator = true;
    } else if (arg === '--project') {
      opts.projectId = argv[i + 1];
      opts.useEmulator = false;
      i++;
    } else if (arg === '--confirm-prod') {
      opts.confirmProd = true;
    } else if (arg === '--from') {
      const val = parseInt(argv[i + 1], 10);
      if (!Number.isNaN(val)) {
        opts.startFrom = val;
      }
      i++;
    }
  }

  if (!opts.useEmulator && !opts.confirmProd) {
    throw new Error('⚠️ Ejecuta con --confirm-prod para tocar producción. Por defecto usa --emulator');
  }

  return opts;
};

const loadExistingDemoCompanies = async (db: FirebaseFirestore.Firestore) => {
  const bySlugSnap = await db
    .collection('companies')
    .where('slug', '>=', 'demo')
    .where('slug', '<', 'demop')
    .get();
  const byFlagSnap = await db.collection('companies').where('is_demo', '==', true).get();

  const usedNumbers = new Set<number>();
  const demoCategories = new Set<string>();

  const processDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    const slug = (data.slug || '').toString();
    const match = slug.match(/^demo(\\d+)/i);
    if (match) {
      usedNumbers.add(parseInt(match[1], 10));
    }
    const categoryId = resolveCategoryId({ category_id: data.category_id, categoryId: (data as any)?.categoryId });
    if (categoryId) {
      demoCategories.add(categoryId);
    }
  };

  bySlugSnap.docs.forEach(processDoc);
  byFlagSnap.docs.forEach(processDoc);

  return { usedNumbers, demoCategories };
};

const getNextAvailableNumber = (start: number, used: Set<number>): number => {
  let n = start;
  while (used.has(n)) {
    n++;
  }
  used.add(n);
  return n;
};

const resolveBusinessMode = (category: CategoryConfig): 'SERVICES' | 'PRODUCTS' | 'BOTH' => {
  const modules = new Set(category.dashboardModules);
  const hasServices = modules.has('appointments') || modules.has('appointments-lite') || modules.has('schedule');
  const hasProducts = modules.has('catalog') || modules.has('orders') || modules.has('menu-categories') || modules.has('menu-qr');

  if (category.businessModesAllowed.includes('BOTH') && hasServices && hasProducts) return 'BOTH';
  if (hasProducts && category.businessModesAllowed.includes('PRODUCTS')) return 'PRODUCTS';
  return 'SERVICES';
};

const upsertAuthUser = async (auth: import('firebase-admin').auth.Auth, email: string, password: string, displayName: string) => {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, displayName });
    return existing;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
    }
    throw error;
  }
};

const upsertUserDoc = async (
  db: FirebaseFirestore.Firestore,
  userId: string,
  email: string,
  companyId: string
) => {
  const ref = db.collection('users').doc(userId);
  const existing = await ref.get();
  const payload = mergeTimestamps(
    {
      email,
      company_id: companyId,
      status: 'ACTIVE',
      role: 'ENTREPRENEUR',
      updated_at: Timestamp.now(),
      created_by_demo_seed: true,
    },
    existing.data()
  );
  await ref.set(payload, { merge: true });
};

const upsertCompany = async (
  db: FirebaseFirestore.Firestore,
  category: CategoryConfig,
  companySlug: string,
  ownerUserId: string,
  businessMode: 'SERVICES' | 'PRODUCTS' | 'BOTH',
  profile: DemoProfile
) => {
  const companies = db.collection('companies');
  const existingSnap = await companies.where('slug', '==', companySlug).limit(1).get();
  const ref = existingSnap.empty ? companies.doc(companySlug) : existingSnap.docs[0].ref;
  const existing = existingSnap.empty ? null : existingSnap.docs[0].data();

  // Calcular geohash para Romeral
  const geohash = geohashForLocation([ROMERAL_LATITUDE, ROMERAL_LONGITUDE]);
  
  const companyData = mergeTimestamps(
    {
      owner_user_id: ownerUserId,
      name: profile.companyName,
      rut: '',
      industry: category.id,
      sector: category.group,
      seo_keyword: profile.tagline,
      whatsapp: profile.whatsapp,
      address: profile.address,
      commune: profile.commune,
      region: profile.region,
      latitude: ROMERAL_LATITUDE,
      longitude: ROMERAL_LONGITUDE,
      location: {
        latitude: ROMERAL_LATITUDE,
        longitude: ROMERAL_LONGITUDE,
      },
      geohash,
      status: 'ACTIVE',
      description: profile.description,
      show_description: true,
      booking_message: profile.bookingMessage,
      business_type: businessMode === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES',
      businessMode,
      category_id: category.id,
      categoryGroup: category.group,
      publicEnabled: true,
      public_layout_variant: 'classic',
      planId: 'STARTER',
      subscription_plan: 'BASIC',
      setup_completed: true,
      slug: companySlug,
      is_demo: true,
      delivery_enabled: businessMode !== 'SERVICES',
      background_enabled: false,
      created_by_demo_seed: true,
    },
    existing || undefined
  );

  await ref.set(companyData, { merge: true });
  return ref.id;
};

const upsertAppearance = async (
  db: FirebaseFirestore.Firestore,
  companyId: string,
  businessType: 'SERVICES' | 'PRODUCTS',
  category: CategoryConfig,
  heroUrl: string,
  logoUrl: string
) => {
  const collection = db.collection('companyAppearances');
  const existingSnap = await collection
    .where('company_id', '==', companyId)
    .where('context', '==', businessType)
    .limit(1)
    .get();
  const ref = existingSnap.empty ? collection.doc(`${companyId}-${businessType}`) : existingSnap.docs[0].ref;
  const payload = {
    company_id: companyId,
    context: businessType,
    logo_url: logoUrl,
    banner_url: heroUrl,
    background_color: category.defaultTheme.backgroundColor,
    card_color: '#ffffff',
    button_color: category.defaultTheme.primaryColor,
    button_text_color: category.defaultTheme.textColor,
    title_color: category.defaultTheme.textColor,
    subtitle_color: '#4b5563',
    text_color: '#1f2937',
    layout: 'GRID',
    show_whatsapp_fab: true,
    updated_at: Timestamp.now(),
    created_by_demo_seed: true,
  };
  await ref.set(payload, { merge: true });
};

const syncToPublicCompanies = async (
  db: FirebaseFirestore.Firestore,
  companyId: string,
  companyData: any,
  appearance: any
) => {
  // Solo sincronizar si publicEnabled es true
  if (!companyData.publicEnabled) {
    return;
  }

  const publicRef = db.collection('companies_public').doc(companyId);
  const geohash = geohashForLocation([ROMERAL_LATITUDE, ROMERAL_LONGITUDE]);
  
  const publicData = {
    id: companyId,
    name: companyData.name,
    publicSlug: companyData.slug,
    slug: companyData.slug,
    categoryId: companyData.category_id || null,
    categoryGroup: companyData.categoryGroup || null,
    comuna: companyData.commune || 'Romeral',
    region: companyData.region || 'Maule',
    geohash,
    location: {
      latitude: ROMERAL_LATITUDE,
      longitude: ROMERAL_LONGITUDE,
    },
    shortDescription: companyData.description || companyData.seo_keyword || '',
    photos: appearance?.banner_url ? [appearance.banner_url] : [],
    business_type: companyData.business_type,
    businessMode: companyData.businessMode,
    status: companyData.status || 'ACTIVE',
    address: companyData.address || 'Av. Principal, Romeral',
  };

  await publicRef.set(publicData, { merge: true });
};

const cleanupCollections = async (db: FirebaseFirestore.Firestore, companyId: string) => {
  const collections = [
    'professionals',
    'services',
    'scheduleSlots',
    'serviceSchedules',
    'appointmentRequests',
    'appointments',
    'menu_categories',
    'products',
    'productOrderRequests',
    'properties',
    'property_bookings',
    'leads',
    'work-orders-lite',
  ];

  for (const col of collections) {
    await deleteDemoDocs(db, col, companyId);
  }
};

const seedCategory = async (db: FirebaseFirestore.Firestore, auth: import('firebase-admin').auth.Auth, assignment: DemoAssignment) => {
  const { category, slug, email } = assignment;
  const profile = getDemoProfile(category.id);
  const businessMode = resolveBusinessMode(category);
  console.log(`\n🚀 Sembrando ${category.id} -> ${slug}`);

  // 1. Usuario Auth
  const userRecord = await upsertAuthUser(auth, email, PASSWORD, profile.companyName);

  // 2. Company
  const companyId = await upsertCompany(db, category, slug, userRecord.uid, businessMode, profile);
  
  // Obtener los datos de la empresa para sincronizar
  const companyRef = db.collection('companies').doc(companyId);
  const companySnap = await companyRef.get();
  const companyData = companySnap.data() || {};

  // 3. Custom claim
  await auth.setCustomUserClaims(userRecord.uid, { company_id: companyId });

  // 4. User doc
  await upsertUserDoc(db, userRecord.uid, email, companyId);

  // 5. Regenerar datasets con companyId
  const datasets = buildDemoData(category, companyId, slug);

  // 6. Apariencia
  const appearanceContext = businessMode === 'PRODUCTS' ? 'PRODUCTS' : 'SERVICES';
  await upsertAppearance(db, companyId, appearanceContext, category, datasets.imagePaths.hero, datasets.imagePaths.items[0]);
  
  // Obtener datos de apariencia para sincronizar
  const appearanceRef = db.collection('companyAppearances').doc(`${companyId}-${appearanceContext}`);
  const appearanceSnap = await appearanceRef.get();
  const appearanceData = appearanceSnap.data() || {};
  
  // 7. Sincronizar a companies_public para que aparezca en pymes cercanas
  await syncToPublicCompanies(db, companyId, companyData, appearanceData);

  // 8. Limpiar datos demo previos
  await cleanupCollections(db, companyId);

  // 9. Insertar colecciones según módulos
  const writeDocs: Array<{ collection: string; docs: any[] }> = [
    { collection: 'professionals', docs: datasets.professionals },
    { collection: 'services', docs: datasets.services },
    { collection: 'scheduleSlots', docs: datasets.scheduleSlots },
    { collection: 'serviceSchedules', docs: datasets.serviceSchedules },
    { collection: 'appointmentRequests', docs: datasets.appointmentRequests },
    { collection: 'appointments', docs: datasets.appointments },
    { collection: 'menu_categories', docs: datasets.menuCategories },
    { collection: 'products', docs: datasets.products },
    { collection: 'productOrderRequests', docs: datasets.productOrders },
    { collection: 'properties', docs: datasets.properties },
    { collection: 'property_bookings', docs: datasets.propertyBookings },
    { collection: 'leads', docs: datasets.leads },
    { collection: 'work-orders-lite', docs: datasets.workOrdersLite },
  ];

  for (const entry of writeDocs) {
    if (!entry.docs || entry.docs.length === 0) continue;
    const payload = entry.docs.map((doc) => ({
      id: doc.id,
      data: {
        ...doc,
        company_id: doc.company_id || companyId,
        updated_at: Timestamp.now(),
        created_by_demo_seed: true,
      },
    }));
    await batchSet(db, entry.collection, payload);
  }

  console.log(
    `✅ ${slug}: servicios ${datasets.services.length}, profesionales ${datasets.professionals.length}, productos ${datasets.products.length}, pedidos ${datasets.productOrders.length}, propiedades ${datasets.properties.length}, leads ${datasets.leads.length}, work-orders ${datasets.workOrdersLite.length}`
  );
};

const updateExistingDemoLocations = async (db: FirebaseFirestore.Firestore) => {
  console.log('\n📍 Actualizando ubicaciones de demos existentes a Romeral...');
  
  const geohash = geohashForLocation([ROMERAL_LATITUDE, ROMERAL_LONGITUDE]);
  const demoCompanies = await db.collection('companies').where('is_demo', '==', true).get();
  
  let updated = 0;
  for (const docSnap of demoCompanies.docs) {
    const data = docSnap.data();
    const ref = docSnap.ref;
    
    // Actualizar ubicación a Romeral
    await ref.update({
      address: data.address?.includes('Romeral') ? data.address : 'Av. Principal, Romeral',
      commune: 'Romeral',
      region: 'Maule',
      latitude: ROMERAL_LATITUDE,
      longitude: ROMERAL_LONGITUDE,
      location: {
        latitude: ROMERAL_LATITUDE,
        longitude: ROMERAL_LONGITUDE,
      },
      geohash,
      publicEnabled: true, // Asegurar que están visibles
    });
    
    // Actualizar companies_public también
    const companyId = docSnap.id;
    const publicRef = db.collection('companies_public').doc(companyId);
    
    // Obtener datos de apariencia para la foto
    const appearanceSnap = await db.collection('companyAppearances')
      .where('company_id', '==', companyId)
      .limit(1)
      .get();
    const appearanceData = appearanceSnap.empty ? {} : appearanceSnap.docs[0].data();
    
    await syncToPublicCompanies(db, companyId, { ...data, publicEnabled: true }, appearanceData);
    updated++;
  }
  
  console.log(`✅ ${updated} demos actualizados con ubicación en Romeral`);
};

async function main() {
  const opts = parseArgs();
  const { db, auth } = initFirebaseAdmin({ useEmulator: opts.useEmulator, projectId: opts.projectId });
  const categories = getAllCategories();

  // Actualizar demos existentes primero
  await updateExistingDemoLocations(db);

  const { usedNumbers, demoCategories } = await loadExistingDemoCompanies(db);
  const pendingCategories = categories.filter((cat) => !demoCategories.has(cat.id));

  if (pendingCategories.length === 0) {
    console.log('\n🎉 Todas las categorías ya tienen demo y están actualizadas con ubicación en Romeral.');
    return;
  }

  const assignments: DemoAssignment[] = [];
  let currentNumber = opts.startFrom;
  for (const category of pendingCategories) {
    const demoNumber = getNextAvailableNumber(currentNumber, usedNumbers);
    currentNumber = demoNumber + 1;
    const slug = `demo${demoNumber}`;
    assignments.push({
      category,
      slug,
      email: `${slug}@pymerp.cl`,
      demoNumber,
    });
  }

  console.log(`🔎 Categorías sin demo: ${pendingCategories.map((c) => c.id).join(', ')}`);
  console.log(`🌱 Creando ${assignments.length} demos desde demo${assignments[0]?.demoNumber || opts.startFrom}...`);

  for (const assignment of assignments) {
    await seedCategory(db, auth, assignment);
  }

  console.log('\n✨ Seed completado. Ejecuta scripts/generate-demo-webp.ts antes si faltan imágenes.');
}

main().catch((error) => {
  console.error('❌ Error en seed:', error);
  process.exit(1);
});
