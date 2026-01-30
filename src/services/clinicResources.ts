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
import type { ClinicResource } from '../types';
import { assertCompanyScope, assertResourceBelongsToCompany } from './validation';

const COLLECTION = 'clinic_resources';

const mapClinicResource = (docSnap: any): ClinicResource => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as ClinicResource;
};

export const getClinicResources = async (companyId: string): Promise<ClinicResource[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    const q = query(collection(db, COLLECTION), where('company_id', '==', scopedCompany));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapClinicResource);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'list' });
    throw error;
  }
};

export const getClinicResource = async (
  resourceId: string,
  companyId?: string
): Promise<ClinicResource | null> => {
  try {
    const docRef = doc(db, COLLECTION, resourceId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const resource = mapClinicResource(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        resource.company_id,
        companyId,
        'ClinicResource',
        resourceId
      );
    }
    
    return resource;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'get' });
    throw error;
  }
};

export const createClinicResource = async (
  data: Omit<ClinicResource, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id);
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      company_id: scopedCompany,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'create' });
    throw error;
  }
};

export const updateClinicResource = async (
  resourceId: string,
  updates: Partial<ClinicResource>,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getClinicResource(resourceId, companyId);
      if (!existing) {
        throw new Error(`ClinicResource ${resourceId} not found or does not belong to company ${companyId}`);
      }
    }
    const docRef = doc(db, COLLECTION, resourceId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'update' });
    throw error;
  }
};

export const deleteClinicResource = async (
  resourceId: string,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getClinicResource(resourceId, companyId);
      if (!existing) {
        throw new Error(`ClinicResource ${resourceId} not found or does not belong to company ${companyId}`);
      }
    }
    
    await deleteDoc(doc(db, COLLECTION, resourceId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'delete' });
    throw error;
  }
};
