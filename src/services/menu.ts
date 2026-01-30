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
import type { MenuCategory } from '../types';
import { assertCompanyScope, assertResourceBelongsToCompany } from './validation';

const COLLECTION = 'menu_categories';

const mapMenuCategory = (docSnap: any): MenuCategory => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as MenuCategory;
};

export const getMenuCategories = async (companyId: string): Promise<MenuCategory[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    const q = query(collection(db, COLLECTION), where('company_id', '==', scopedCompany));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapMenuCategory);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'list' });
    throw error;
  }
};

export const getMenuCategory = async (
  categoryId: string,
  companyId?: string
): Promise<MenuCategory | null> => {
  try {
    const docRef = doc(db, COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const category = mapMenuCategory(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        category.company_id,
        companyId,
        'MenuCategory',
        categoryId
      );
    }
    
    return category;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'get' });
    throw error;
  }
};

export const createMenuCategory = async (
  data: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>
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

export const updateMenuCategory = async (
  categoryId: string,
  updates: Partial<MenuCategory>,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getMenuCategory(categoryId, companyId);
      if (!existing) {
        throw new Error(`MenuCategory ${categoryId} not found or does not belong to company ${companyId}`);
      }
    }
    const docRef = doc(db, COLLECTION, categoryId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'update' });
    throw error;
  }
};

export const deleteMenuCategory = async (
  categoryId: string,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getMenuCategory(categoryId, companyId);
      if (!existing) {
        throw new Error(`MenuCategory ${categoryId} not found or does not belong to company ${companyId}`);
      }
    }
    
    await deleteDoc(doc(db, COLLECTION, categoryId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: COLLECTION, op: 'delete' });
    throw error;
  }
};
