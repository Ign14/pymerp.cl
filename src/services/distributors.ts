import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { errorHandler } from './errorHandler';
import type { DeliveryRoute, PaymentCollection, DeliveryLocation } from '../types';
import { assertCompanyScope } from './validation';

const ROUTES_COLLECTION = 'delivery_routes';
const COLLECTIONS_COLLECTION = 'payment_collections';
const LOCATIONS_COLLECTION = 'delivery_locations';

const mapDeliveryRoute = (docSnap: any): DeliveryRoute => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    start_date: data.start_date?.toDate?.(),
    end_date: data.end_date?.toDate?.(),
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as DeliveryRoute;
};

const mapPaymentCollection = (docSnap: any): PaymentCollection => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    due_date: data.due_date?.toDate?.(),
    paid_date: data.paid_date?.toDate?.(),
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as PaymentCollection;
};

const mapDeliveryLocation = (docSnap: any): DeliveryLocation => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    timestamp: data.timestamp?.toDate?.() || new Date(),
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as DeliveryLocation;
};

export const getDeliveryRoutes = async (companyId: string): Promise<DeliveryRoute[]> => {
  const scopedCompany = assertCompanyScope(companyId, 'getDeliveryRoutes');
  try {
    const q = query(
      collection(db, ROUTES_COLLECTION),
      where('company_id', '==', scopedCompany),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDeliveryRoute);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: ROUTES_COLLECTION, op: 'list' });
    throw error;
  }
};

export const createDeliveryRoute = async (
  data: Omit<DeliveryRoute, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id as string, 'createDeliveryRoute');
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, ROUTES_COLLECTION), {
      ...data,
      company_id: scopedCompany,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: ROUTES_COLLECTION, op: 'create' });
    throw error;
  }
};

export const updateDeliveryRoute = async (
  routeId: string,
  updates: Partial<DeliveryRoute>
): Promise<void> => {
  try {
    const docRef = doc(db, ROUTES_COLLECTION, routeId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: ROUTES_COLLECTION, op: 'update' });
    throw error;
  }
};

export const getCollections = async (companyId: string): Promise<PaymentCollection[]> => {
  const scopedCompany = assertCompanyScope(companyId, 'getCollections');
  try {
    const q = query(
      collection(db, COLLECTIONS_COLLECTION),
      where('company_id', '==', scopedCompany),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPaymentCollection);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTIONS_COLLECTION, op: 'list' });
    throw error;
  }
};

export const updateCollection = async (
  collectionId: string,
  updates: Partial<PaymentCollection>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTIONS_COLLECTION, op: 'update' });
    throw error;
  }
};

export const getDeliveryLocations = async (companyId: string): Promise<DeliveryLocation[]> => {
  const scopedCompany = assertCompanyScope(companyId, 'getDeliveryLocations');
  try {
    const q = query(
      collection(db, LOCATIONS_COLLECTION),
      where('company_id', '==', scopedCompany),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDeliveryLocation);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: LOCATIONS_COLLECTION, op: 'list' });
    throw error;
  }
};
