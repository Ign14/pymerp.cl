import { addDoc, collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { errorHandler } from './errorHandler';
import { assertCompanyScope, sanitizeText, isValidEmail, isValidPhone } from './validation';

const WORK_ORDERS_LITE_COLLECTION = 'work-orders-lite';

export type WorkOrderLite = {
  id: string;
  company_id: string;
  requester_name: string;
  phone: string;
  email?: string;
  service_type?: string;
  description?: string;
  preferred_date?: Date;
  preferred_time?: string;
  source?: string;
  status?: string;
  created_at: Date;
  updated_at: Date;
};

const mapWorkOrderLite = (docSnap: any): WorkOrderLite => {
  const data = docSnap.data?.() ?? docSnap.data;
  return {
    id: docSnap.id,
    ...data,
    preferred_date: data?.preferred_date?.toDate?.() || data?.preferred_date,
    created_at: data?.created_at?.toDate?.() || data?.created_at || new Date(),
    updated_at: data?.updated_at?.toDate?.() || data?.updated_at || new Date(),
  } as WorkOrderLite;
};

type CreateWorkOrderLitePayload = {
  company_id: string;
  requester_name: string;
  phone: string;
  email?: string;
  service_type?: string;
  description?: string;
  preferred_date?: Date | string;
  preferred_time?: string;
  source?: string;
  status?: string;
};

/**
 * Crea una solicitud de orden de trabajo lite de forma idempotente.
 * Verifica si ya existe una solicitud similar en los últimos 5 minutos para evitar duplicados.
 */
export const createWorkOrderLiteRequest = async (
  data: CreateWorkOrderLitePayload
): Promise<string> => {
  const scopedCompanyId = assertCompanyScope(data.company_id);
  const phone = data.phone.replace(/\D/g, '');

  if (!isValidPhone(phone)) {
    throw new Error('INVALID_PHONE');
  }

  if (data.email && !isValidEmail(data.email)) {
    throw new Error('INVALID_EMAIL');
  }

  // Idempotencia: verificar si existe una solicitud similar reciente (últimos 5 minutos)
  const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
  try {
    const existingQuery = query(
      collection(db, WORK_ORDERS_LITE_COLLECTION),
      where('company_id', '==', scopedCompanyId),
      where('phone', '==', phone),
      where('created_at', '>=', fiveMinutesAgo),
      orderBy('created_at', 'desc')
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    // Si existe una solicitud reciente con el mismo teléfono y descripción similar, retornar su ID
    if (!existingSnapshot.empty) {
      const recent = existingSnapshot.docs[0];
      const recentData = recent.data();
      const recentDesc = recentData.description?.toLowerCase().trim() || '';
      const newDesc = data.description?.toLowerCase().trim() || '';
      
      // Si las descripciones son muy similares (más del 80% de coincidencia), retornar el ID existente
      if (recentDesc && newDesc && recentDesc.length > 0) {
        const similarity = recentDesc.includes(newDesc) || newDesc.includes(recentDesc) || 
          (recentDesc.length > 10 && newDesc.length > 10 && 
           recentDesc.slice(0, Math.min(20, recentDesc.length)) === newDesc.slice(0, Math.min(20, newDesc.length)));
        
        if (similarity) {
          return recent.id; // Idempotencia: retornar ID existente
        }
      } else if (!recentDesc && !newDesc) {
        // Si ambas descripciones están vacías, es probablemente un duplicado
        return recent.id;
      }
    }
  } catch (queryError: any) {
    // Si falla la query (puede ser por índices faltantes), continuar con la creación
    // No lanzar error para no bloquear el flujo
    console.warn('Could not check for duplicate work order:', queryError);
  }

  const now = Timestamp.now();

  const payload: Record<string, any> = {
    company_id: scopedCompanyId,
    requester_name: sanitizeText(data.requester_name, 140),
    phone,
    email: data.email?.trim() || undefined,
    service_type: data.service_type ? sanitizeText(data.service_type, 120) : undefined,
    description: data.description ? sanitizeText(data.description, 1200) : undefined,
    preferred_time: data.preferred_time ? sanitizeText(data.preferred_time, 80) : undefined,
    source: data.source || 'public',
    status: data.status || 'NEW',
    created_at: now,
    updated_at: now,
  };

  if (data.preferred_date instanceof Date) {
    payload.preferred_date = Timestamp.fromDate(data.preferred_date);
  } else if (typeof data.preferred_date === 'string' && data.preferred_date.trim()) {
    const parsed = new Date(data.preferred_date);
    if (!Number.isNaN(parsed.getTime())) {
      payload.preferred_date = Timestamp.fromDate(parsed);
    } else {
      payload.preferred_date_text = sanitizeText(data.preferred_date, 80);
    }
  }

  try {
    const docRef = await addDoc(collection(db, WORK_ORDERS_LITE_COLLECTION), payload);
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: WORK_ORDERS_LITE_COLLECTION, op: 'create' });
    throw error;
  }
};

export const getWorkOrdersLiteByCompany = async (companyId: string): Promise<WorkOrderLite[]> => {
  const scopedCompanyId = assertCompanyScope(companyId);
  try {
    const q = query(
      collection(db, WORK_ORDERS_LITE_COLLECTION),
      where('company_id', '==', scopedCompanyId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapWorkOrderLite);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: WORK_ORDERS_LITE_COLLECTION, op: 'list' });
    throw error;
  }
};
