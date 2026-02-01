import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { errorHandler } from './errorHandler';
import type { Property, PropertyBooking } from '../types';
import { assertCompanyScope, assertResourceBelongsToCompany } from './validation';

const PROPERTIES_COLLECTION = 'properties';
const BOOKINGS_COLLECTION = 'property_bookings';

const mapProperty = (docSnap: any): Property => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as Property;
};

const mapBooking = (docSnap: any): PropertyBooking => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    check_in: data.check_in?.toDate?.() || data.check_in,
    check_out: data.check_out?.toDate?.() || data.check_out,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as PropertyBooking;
};

export const getProperties = async (companyId: string): Promise<Property[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    const q = query(collection(db, PROPERTIES_COLLECTION), where('company_id', '==', scopedCompany));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapProperty);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: PROPERTIES_COLLECTION, op: 'list' });
    throw error;
  }
};

export const getProperty = async (
  propertyId: string,
  companyId?: string
): Promise<Property | null> => {
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const property = mapProperty(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        property.company_id,
        companyId,
        'Property',
        propertyId
      );
    }
    
    return property;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: PROPERTIES_COLLECTION, op: 'get' });
    throw error;
  }
};

export const createProperty = async (
  data: Omit<Property, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id as string);
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      ...data,
      company_id: scopedCompany,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: PROPERTIES_COLLECTION, op: 'create' });
    throw error;
  }
};

export const updateProperty = async (
  propertyId: string,
  updates: Partial<Property>,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getProperty(propertyId, companyId);
      if (!existing) {
        throw new Error(`Property ${propertyId} not found or does not belong to company ${companyId}`);
      }
    }
    
    const docRef = doc(db, PROPERTIES_COLLECTION, propertyId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: PROPERTIES_COLLECTION, op: 'update' });
    throw error;
  }
};

export const deleteProperty = async (
  propertyId: string,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getProperty(propertyId, companyId);
      if (!existing) {
        throw new Error(`Property ${propertyId} not found or does not belong to company ${companyId}`);
      }
    }
    
    await deleteDoc(doc(db, PROPERTIES_COLLECTION, propertyId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: PROPERTIES_COLLECTION, op: 'delete' });
    throw error;
  }
};

export const getPropertyBookings = async (
  companyId: string,
  propertyId?: string
): Promise<PropertyBooking[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    let constraints: any[] = [where('company_id', '==', scopedCompany)];
    if (propertyId) {
      constraints = [...constraints, where('property_id', '==', propertyId)];
    }
    const q = query(collection(db, BOOKINGS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapBooking);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: BOOKINGS_COLLECTION, op: 'list' });
    throw error;
  }
};

export const getPropertyBooking = async (
  bookingId: string,
  companyId?: string
): Promise<PropertyBooking | null> => {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const booking = mapBooking(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        booking.company_id as string | null | undefined,
        companyId,
        'PropertyBooking',
        bookingId
      );
    }
    
    return booking;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: BOOKINGS_COLLECTION, op: 'get' });
    throw error;
  }
};

export const createPropertyBooking = async (
  data: Omit<PropertyBooking, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id as string);
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...data,
      company_id: scopedCompany,
      check_in: data.check_in ? Timestamp.fromDate(data.check_in instanceof Date ? data.check_in : new Date(data.check_in as string | number)) : undefined,
      check_out: data.check_out ? Timestamp.fromDate(data.check_out instanceof Date ? data.check_out : new Date(data.check_out as string | number)) : undefined,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: BOOKINGS_COLLECTION, op: 'create' });
    throw error;
  }
};

export const updatePropertyBooking = async (
  bookingId: string,
  updates: Partial<PropertyBooking>
): Promise<void> => {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const updateData: any = {
      ...updates,
      updated_at: Timestamp.now(),
    };
    if (updates.check_in instanceof Date) {
      updateData.check_in = Timestamp.fromDate(updates.check_in);
    }
    if (updates.check_out instanceof Date) {
      updateData.check_out = Timestamp.fromDate(updates.check_out);
    }
    await updateDoc(docRef, updateData);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: BOOKINGS_COLLECTION, op: 'update' });
    throw error;
  }
};

export const deletePropertyBooking = async (bookingId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: BOOKINGS_COLLECTION, op: 'delete' });
    throw error;
  }
};
