import type { SeoCompany, SeoServiceItem } from './types';
import { normalizeSlug } from './slug';

const isDiscoveryPhase =
  Boolean(process.env.FUNCTIONS_CONTROL_API) ||
  (!process.env.GCLOUD_PROJECT &&
    !process.env.FIREBASE_CONFIG &&
    !process.env.FUNCTIONS_EMULATOR &&
    process.env.NODE_ENV !== 'test');

const ensureAdmin = () => {
  if (isDiscoveryPhase) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

export const resolveCompanyBySlug = async (slug: string): Promise<SeoCompany | null> => {
  const admin = ensureAdmin();
  if (!admin) return null;
  const firestore = admin.firestore();
  const trimmedSlug = slug.trim().toLowerCase();

  const querySnapshot = await firestore
    .collection('companies_public')
    .where('slug', '==', trimmedSlug)
    .limit(1)
    .get();

  const doc = querySnapshot.docs[0];
  if (!doc) {
    const fallbackSnapshot = await firestore
      .collection('companies_public')
      .where('publicSlug', '==', trimmedSlug)
      .limit(1)
      .get();
    const fallbackDoc = fallbackSnapshot.docs[0];
    if (!fallbackDoc) return null;
    return normalizeCompany(fallbackDoc.id, fallbackDoc.data());
  }

  return normalizeCompany(doc.id, doc.data());
};

const normalizeCompany = (id: string, data: any): SeoCompany => {
  const location = data.location && typeof data.location === 'object'
    ? {
        latitude: data.location.latitude ?? data.location._latitude,
        longitude: data.location.longitude ?? data.location._longitude,
      }
    : null;

  return {
    id,
    name: data.name || 'Empresa',
    slug: data.slug || data.publicSlug || normalizeSlug(data.name || ''),
    publicEnabled: data.publicEnabled === true,
    address: data.address || null,
    comuna: data.comuna || data.commune || data.city || null,
    region: data.region || null,
    whatsapp: data.whatsapp || null,
    phone: data.phone || data.whatsapp || null,
    email: data.email || null,
    location,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    weekday_days: data.weekday_days || null,
    weekday_open_time: data.weekday_open_time || null,
    weekday_close_time: data.weekday_close_time || null,
    weekend_days: data.weekend_days || null,
    weekend_open_time: data.weekend_open_time || null,
    weekend_close_time: data.weekend_close_time || null,
    social_links: Array.isArray(data.social_links)
      ? data.social_links
      : Array.isArray(data.socialLinks)
      ? data.socialLinks
      : null,
    updated_at: data.updated_at || data.updatedAt || null,
    categoryId: data.categoryId || data.category_id || null,
  };
};

export const listCompanyServices = async (companyId: string): Promise<SeoServiceItem[]> => {
  const admin = ensureAdmin();
  if (!admin) return [];
  const firestore = admin.firestore();

  const snapshot = await firestore
    .collection('services')
    .where('company_id', '==', companyId)
    .get();

  return snapshot.docs
    .map((doc: any) => normalizeService(doc.id, doc.data()))
    .filter((service: SeoServiceItem) => service.status !== 'INACTIVE');
};

const normalizeService = (id: string, data: any): SeoServiceItem => {
  return {
    id,
    name: data.name || 'Servicio',
    description: data.description || null,
    price: typeof data.price === 'number' ? data.price : null,
    estimated_duration_minutes: data.estimated_duration_minutes ?? null,
    status: data.status || null,
    tags: Array.isArray(data.tags) ? data.tags : null,
    slug: data.slug || data.service_slug || normalizeSlug(data.name || ''),
    updated_at: data.updated_at || data.updatedAt || null,
    popularity: data.popularity ?? data.bookings_count ?? data.appointments_count ?? null,
    bookings_count: data.bookings_count ?? null,
  };
};

export const resolveServiceBySlug = (services: SeoServiceItem[], slug: string): SeoServiceItem | null => {
  const target = normalizeSlug(slug);
  return services.find((service) => normalizeSlug(service.slug || service.name) === target) || null;
};

export const resolveLatestUpdate = (company: SeoCompany, services: SeoServiceItem[]): Date | null => {
  const dates: Date[] = [];
  const companyDate = toDate(company.updated_at);
  if (companyDate) dates.push(companyDate);
  services.forEach((service) => {
    const date = toDate(service.updated_at);
    if (date) dates.push(date);
  });
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
};

