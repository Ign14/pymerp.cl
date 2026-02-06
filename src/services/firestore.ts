import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  Timestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { db } from '../config/firebase';
import type {
  User,
  AccessRequest,
  Company,
  CompanyAppearance,
  ScheduleSlot,
  Service,
  ServiceSchedule,
  Product,
  AppointmentRequest,
  ProductOrderRequest,
  PublicPageEvent,
  BusinessType,
  PublicCompany,
  MinimarketAccessAccount,
} from '../types';
import { AccessRequestStatus, EventType, UserStatus, UserRole } from '../types';

const MINIMARKET_ACCESS_COLLECTION = 'minimarket_access_accounts';

// Users
export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }
  return null;
};

export const createUser = async (
  userData: Omit<User, 'id' | 'created_at'>,
  userId?: string
): Promise<string> => {
  // Prefer deterministic IDs (auth uid or email) so security rules can match request.auth.{uid,email}
  const documentId = userId || userData.email;
  await setDoc(doc(db, 'users', documentId), {
    ...userData,
    created_at: Timestamp.now(),
  });
  return documentId;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, updates);
};

export const getAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
    } as User;
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId));
};

export const getActiveEntrepreneurUsers = async (): Promise<User[]> => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', UserRole.ENTREPRENEUR),
    where('status', 'in', [UserStatus.ACTIVE, UserStatus.FORCE_PASSWORD_CHANGE])
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
    } as User;
  });
};

// Access Requests
export const createAccessRequest = async (
  requestData: Omit<AccessRequest, 'id' | 'status' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'accessRequests'), {
    ...requestData,
    status: AccessRequestStatus.PENDING,
    created_at: Timestamp.now(),
    // processed_at se agregará cuando se apruebe/rechace
  });
  return docRef.id;
};

export const getAccessRequests = async (status?: AccessRequestStatus): Promise<AccessRequest[]> => {
  let q = query(collection(db, 'accessRequests'), orderBy('created_at', 'desc'));
  if (status) {
    q = query(q, where('status', '==', status));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
    processed_at: doc.data().processed_at?.toDate(),
  })) as AccessRequest[];
};

export const updateAccessRequest = async (
  requestId: string,
  updates: Partial<AccessRequest>
): Promise<void> => {
  const docRef = doc(db, 'accessRequests', requestId);
  const updateData: any = { ...updates };
  if (updates.processed_at) {
    updateData.processed_at = Timestamp.fromDate(updates.processed_at);
  }
  await updateDoc(docRef, updateData);
};

export const getAccessRequestByEmail = async (email: string): Promise<AccessRequest | null> => {
  const q = query(collection(db, 'accessRequests'), where('email', '==', email), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
      processed_at: data.processed_at?.toDate?.(),
    } as AccessRequest;
  }
  return null;
};

// Companies
export const getCompany = async (companyId: string): Promise<Company | null> => {
  const docRef = doc(db, 'companies', companyId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    } as Company;
  }
  return null;
};

export const getCompaniesWithCommune = async (): Promise<Company[]> => {
  const querySnapshot = await getDocs(collection(db, 'companies'));
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Company;
  });
};

export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
  const q = query(collection(db, 'companies'), where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    } as Company;
  }
  return null;
};

export const createCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'companies'), {
    ...companyData,
    business_type: (companyData as any).business_type || 'SERVICES',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCompany = async (companyId: string, updates: Partial<Company>): Promise<void> => {
  const docRef = doc(db, 'companies', companyId);
  const updateData: any = { ...updates, updated_at: Timestamp.now() };
  await updateDoc(docRef, updateData);
};

// Company Appearance
export const getCompanyAppearance = async (
  companyId: string,
  context: BusinessType
): Promise<CompanyAppearance | null> => {
  const q = query(
    collection(db, 'companyAppearances'),
    where('company_id', '==', companyId),
    where('context', '==', context),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CompanyAppearance;
  }
  return null;
};

export const setCompanyAppearance = async (
  companyId: string,
  context: BusinessType,
  appearance: Omit<CompanyAppearance, 'id' | 'company_id' | 'context'>
): Promise<string> => {
  const existing = await getCompanyAppearance(companyId, context);
  if (existing) {
    await updateDoc(doc(db, 'companyAppearances', existing.id), appearance);
    return existing.id;
  } else {
    const docRef = await addDoc(collection(db, 'companyAppearances'), {
      company_id: companyId,
      context,
      ...appearance,
    });
    return docRef.id;
  }
};

// Schedule Slots
export const getScheduleSlots = async (companyId: string): Promise<ScheduleSlot[]> => {
  const q = query(collection(db, 'scheduleSlots'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ScheduleSlot[];
};

export const createScheduleSlot = async (
  slotData: Omit<ScheduleSlot, 'id'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'scheduleSlots'), slotData);
  return docRef.id;
};

export const updateScheduleSlot = async (
  slotId: string,
  updates: Partial<ScheduleSlot>
): Promise<void> => {
  const docRef = doc(db, 'scheduleSlots', slotId);
  await updateDoc(docRef, updates);
};

export const deleteScheduleSlot = async (slotId: string): Promise<void> => {
  await deleteDoc(doc(db, 'scheduleSlots', slotId));
};

// Services
export const getServices = async (companyId: string): Promise<Service[]> => {
  const q = query(collection(db, 'services'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    professional_ids: (doc.data() as any)?.professional_ids || [],
  })) as Service[];
};

export const getService = async (serviceId: string): Promise<Service | null> => {
  const docRef = doc(db, 'services', serviceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      professional_ids: (data as any)?.professional_ids || [],
    } as Service;
  }
  return null;
};

export const createService = async (serviceData: Omit<Service, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'services'), serviceData);
  return docRef.id;
};

export const updateService = async (serviceId: string, updates: Partial<Service>): Promise<void> => {
  const docRef = doc(db, 'services', serviceId);
  await updateDoc(docRef, updates);
};

export const deleteService = async (serviceId: string): Promise<void> => {
  await deleteDoc(doc(db, 'services', serviceId));
};

// Service Schedules
export const getServiceSchedules = async (serviceId: string): Promise<ServiceSchedule[]> => {
  const q = query(collection(db, 'serviceSchedules'), where('service_id', '==', serviceId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ServiceSchedule[];
};

export const setServiceSchedules = async (
  serviceId: string,
  scheduleSlotIds: string[]
): Promise<void> => {
  // Delete existing
  const existing = await getServiceSchedules(serviceId);
  for (const schedule of existing) {
    await deleteDoc(doc(db, 'serviceSchedules', schedule.id));
  }
  // Create new
  for (const slotId of scheduleSlotIds) {
    await addDoc(collection(db, 'serviceSchedules'), {
      service_id: serviceId,
      schedule_slot_id: slotId,
    });
  }
};

// Products
export const getProducts = async (companyId: string): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'products'), productData);
  return docRef.id;
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, updates);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', productId));
};

// Minimarket access accounts (por company_id)
function toAccessAccount(
  docSnap: { id: string; data: () => Record<string, unknown> }
): MinimarketAccessAccount {
  const d = docSnap.data();
  const created = d.created_at as { toDate?: () => Date } | undefined;
  const updated = d.updated_at as { toDate?: () => Date } | undefined;
  return {
    id: docSnap.id,
    companyId: (d.company_id as string | undefined) ?? '',
    email: (d.email as string | undefined) ?? '',
    role: (d.role as MinimarketAccessAccount['role'] | undefined) ?? 'STAFF',
    status: (d.status as MinimarketAccessAccount['status']) ?? 'ACTIVE',
    createdAt: created?.toDate?.() ?? new Date(),
    updatedAt: updated?.toDate?.() ?? new Date(),
  };
}

export const getMinimarketAccessAccounts = async (
  companyId: string
): Promise<MinimarketAccessAccount[]> => {
  const q = query(
    collection(db, MINIMARKET_ACCESS_COLLECTION),
    where('company_id', '==', companyId)
  );
  const snapshot = await getDocs(q);
  const accounts = snapshot.docs.map(toAccessAccount);
  accounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return accounts;
};

export const getMinimarketAccessAccount = async (
  id: string
): Promise<MinimarketAccessAccount | null> => {
  const ref = doc(db, MINIMARKET_ACCESS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toAccessAccount(snap);
};

export const getMinimarketAccessAccountByEmail = async (
  companyId: string,
  email: string
): Promise<MinimarketAccessAccount | null> => {
  const q = query(
    collection(db, MINIMARKET_ACCESS_COLLECTION),
    where('company_id', '==', companyId)
  );
  const snapshot = await getDocs(q);
  const normalized = email.trim().toLowerCase();
  const doc = snapshot.docs.find((d) => (d.data().email as string)?.toLowerCase() === normalized);
  return doc ? toAccessAccount(doc) : null;
};

export const createMinimarketAccessAccount = async (
  companyId: string,
  data: {
    email: string;
    passwordHash: string;
    role: MinimarketAccessAccount['role'];
    status: MinimarketAccessAccount['status'];
  }
): Promise<string> => {
  const ref = await addDoc(collection(db, MINIMARKET_ACCESS_COLLECTION), {
    company_id: companyId,
    email: data.email.trim().toLowerCase(),
    password_hash: data.passwordHash,
    role: data.role,
    status: data.status,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return ref.id;
};

export const updateMinimarketAccessAccount = async (
  id: string,
  updates: {
    email?: string;
    passwordHash?: string;
    role?: MinimarketAccessAccount['role'];
    status?: MinimarketAccessAccount['status'];
  }
): Promise<void> => {
  const ref = doc(db, MINIMARKET_ACCESS_COLLECTION, id);
  const payload: Record<string, unknown> = {
    updated_at: Timestamp.now(),
  };
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
  if (updates.passwordHash !== undefined) payload.password_hash = updates.passwordHash;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.status !== undefined) payload.status = updates.status;
  await updateDoc(ref, payload);
};

export const deleteMinimarketAccessAccount = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, MINIMARKET_ACCESS_COLLECTION, id));
};

// Appointment Requests
export const createAppointmentRequest = async (
  requestData: Omit<AppointmentRequest, 'id' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'appointmentRequests'), {
    ...requestData,
    client_email: (requestData as any).client_email,
    created_at: Timestamp.now(),
  });
  return docRef.id;
};

export const getAppointmentRequests = async (companyId: string): Promise<AppointmentRequest[]> => {
  const q = query(collection(db, 'appointmentRequests'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
  })) as AppointmentRequest[]).sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0));
};

// Product Order Requests
export const createProductOrderRequest = async (
  requestData: Omit<ProductOrderRequest, 'id' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'productOrderRequests'), {
    ...requestData,
    created_at: Timestamp.now(),
  });
  return docRef.id;
};

export const getProductOrderRequests = async (companyId: string): Promise<ProductOrderRequest[]> => {
  const q = query(collection(db, 'productOrderRequests'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
  })) as ProductOrderRequest[]).sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0));
};

export const getProductOrderRequestById = async (orderId: string): Promise<ProductOrderRequest | null> => {
  const docRef = doc(db, 'productOrderRequests', orderId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
  } as ProductOrderRequest;
};

export const updateProductOrderRequest = async (
  companyId: string,
  orderId: string,
  updates: Partial<ProductOrderRequest>
): Promise<void> => {
  const existing = await getProductOrderRequestById(orderId);
  if (!existing || existing.company_id !== companyId) {
    throw new Error('Order not found for company');
  }
  const docRef = doc(db, 'productOrderRequests', orderId);
  await updateDoc(docRef, updates as any);
};

export const advanceProductOrderStatus = async (
  companyId: string,
  orderId: string,
  nextStatus: NonNullable<ProductOrderRequest['status']>
): Promise<void> => {
  const existing = await getProductOrderRequestById(orderId);
  if (!existing || existing.company_id !== companyId) {
    throw new Error('Order not found for company');
  }
  const currentStatus = existing.status || 'REQUESTED';
  const status_history = [
    ...(existing.status_history || []),
    { from: currentStatus || null, to: nextStatus, created_at: new Date() },
  ];
  const docRef = doc(db, 'productOrderRequests', orderId);
  await updateDoc(docRef, { status: nextStatus, status_history } as any);
};

export const getPublicCompanies = async (opts?: {
  categoryId?: string;
  comuna?: string;
  bounds?: { center: [number, number]; radiusInM: number };
}): Promise<PublicCompany[]> => {
  const categoryId = opts?.categoryId;
  const comuna = opts?.comuna;
  const bounds = opts?.bounds;

  const normalizeLocation = (data: any) => {
    if (data?.location) {
      const loc = data.location;
      if (typeof loc === 'object') {
        if ('latitude' in loc && 'longitude' in loc) {
          return { latitude: loc.latitude, longitude: loc.longitude };
        }
        if ('lat' in loc && typeof loc.lat === 'function') {
          return { latitude: loc.lat(), longitude: loc.lng() };
        }
      }
    }
    if (typeof data?.latitude === 'number' && typeof data?.longitude === 'number') {
      return { latitude: data.latitude, longitude: data.longitude };
    }
    return undefined;
  };

  if (bounds) {
    const [lat, lng] = bounds.center;
    const queryBounds = geohashQueryBounds([lat, lng], bounds.radiusInM);
    const snapshots = await Promise.all(
      queryBounds.map(([start, end]) =>
        getDocs(
          query(
            collection(db, 'companies_public'),
            orderBy('geohash'),
            startAt(start),
            endAt(end)
          )
        )
      )
    );
    const unique = new Map<string, PublicCompany>();
    snapshots.forEach((snap) => {
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const location = normalizeLocation(data);
        unique.set(docSnap.id, { id: docSnap.id, ...data, location } as PublicCompany);
      });
    });
    let results = Array.from(unique.values()).filter((company) => {
      if (!company.location?.latitude || !company.location?.longitude) return false;
      const distanceKm = distanceBetween(
        [company.location.latitude, company.location.longitude],
        [lat, lng]
      );
      return distanceKm * 1000 <= bounds.radiusInM;
    });
    if (categoryId) results = results.filter((c) => (c as any).categoryId === categoryId);
    if (comuna) results = results.filter((c) => (c as any).comuna === comuna);
    return results.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
  }

  const constraints = [];
  if (categoryId) constraints.push(where('categoryId', '==', categoryId));
  if (comuna) constraints.push(where('comuna', '==', comuna));
  const q = constraints.length
    ? query(collection(db, 'companies_public'), ...constraints)
    : query(collection(db, 'companies_public'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      const location = normalizeLocation(data);
      return { id: docSnap.id, ...data, location } as PublicCompany;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
};

// Public Page Events
export const createPublicPageEvent = async (
  companyId: string,
  eventType: EventType
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'publicPageEvents'), {
    company_id: companyId,
    event_type: eventType,
    created_at: Timestamp.now(),
  });
  return docRef.id;
};

export const getPublicPageEvents = async (companyId: string): Promise<PublicPageEvent[]> => {
  const q = query(collection(db, 'publicPageEvents'), where('company_id', '==', companyId));
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
  })) as PublicPageEvent[]).sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};
