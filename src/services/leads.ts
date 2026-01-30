import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { errorHandler } from './errorHandler';
import { assertCompanyScope, sanitizeText, isValidEmail, isValidPhone } from './validation';
import type { Lead } from '../types';

const LEADS_COLLECTION = 'leads';

const mapLead = (docSnap: any): Lead => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    preferred_date: data.preferred_date?.toDate?.() || data.preferred_date,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as Lead;
};

export const createLead = async (data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const scopedCompanyId = assertCompanyScope(data.company_id);

  const whatsapp = data.whatsapp.replace(/\D/g, '');
  if (!isValidPhone(whatsapp)) {
    throw new Error('INVALID_PHONE');
  }

  if (data.email && !isValidEmail(data.email)) {
    throw new Error('INVALID_EMAIL');
  }

  try {
    const now = Timestamp.now();
    const payload: any = {
      company_id: scopedCompanyId,
      intent: data.intent ?? 'general',
      name: sanitizeText(data.name, 120),
      whatsapp,
      email: data.email?.trim() || undefined,
      message: data.message ? sanitizeText(data.message, 800) : undefined,
      property_id: data.property_id,
      property_title: data.property_title,
      preferred_time: data.preferred_time,
      source: data.source || 'public',
      created_at: now,
      updated_at: now,
    };

    if (data.preferred_date instanceof Date) {
      payload.preferred_date = Timestamp.fromDate(data.preferred_date);
    }

    const docRef = await addDoc(collection(db, LEADS_COLLECTION), payload);
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: LEADS_COLLECTION, op: 'create' });
    throw error;
  }
};

export const getLeadsByCompany = async (companyId: string): Promise<Lead[]> => {
  const scopedCompanyId = assertCompanyScope(companyId);
  try {
    const q = query(
      collection(db, LEADS_COLLECTION),
      where('company_id', '==', scopedCompanyId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapLead);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: LEADS_COLLECTION, op: 'list' });
    throw error;
  }
};
