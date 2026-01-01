import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { Professional } from '../types';
import {
  assertCompanyScope,
  isValidEmail,
  isValidPhone,
  sanitizeText,
  coerceOptional,
} from './validation';

/**
 * Service for managing professionals
 * IMPORTANT: Components should NOT import firebase/* directly
 * All Firebase interactions go through this service layer
 */

// ==================== LIST PROFESSIONALS ====================

/**
 * Get all active professionals for a company (one-time fetch)
 * @param companyId - The company ID to filter by
 * @returns Promise with array of professionals
 */
export const listProfessionals = async (companyId: string): Promise<Professional[]> => {
  const q = query(
    collection(db, 'professionals'),
    where('company_id', '==', companyId),
    where('status', '==', 'ACTIVE'),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      company_id: data.company_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      specialties: data.specialties || [],
      status: data.status,
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Professional;
  });
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Listen to professionals in real-time (for dashboard/schedule views)
 * @param companyId - The company ID to filter by
 * @param callback - Callback function that receives updated professionals array
 * @returns Unsubscribe function
 */
export const listenProfessionals = (
  companyId: string,
  callback: (professionals: Professional[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'professionals'),
    where('company_id', '==', companyId),
    where('status', '==', 'ACTIVE'),
    orderBy('name', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const professionals = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          company_id: data.company_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar_url: data.avatar_url,
          specialties: data.specialties || [],
          status: data.status,
          created_at: data.created_at?.toDate?.() || new Date(),
          updated_at: data.updated_at?.toDate?.() || new Date(),
        } as Professional;
      });
      callback(professionals);
    },
    (error) => {
      console.error('Error listening to professionals:', error);
      // Re-throw to be handled by useErrorHandler in component
      throw error;
    }
  );
};

// ==================== CREATE PROFESSIONAL (via Cloud Function) ====================

export interface CreateProfessionalInput {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  specialties?: string[];
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateProfessionalResponse {
  professionalId: string;
  message?: string;
}

/**
 * Create a new professional via Cloud Function
 * This enforces business rules (e.g., PRO_LIMIT_REACHED) server-side
 * 
 * @param input - Professional data
 * @returns Promise with new professional ID
 * @throws Error with code PRO_LIMIT_REACHED if subscription limit exceeded
 */
export const createProfessional = async (
  input: CreateProfessionalInput
): Promise<CreateProfessionalResponse> => {
  // Basic input validation to avoid malformed documents / rule bypass attempts
  const companyId = assertCompanyScope(input.companyId);
  const name = sanitizeText(input.name, 120);

  if (!name) {
    throw new Error('Professional name is required');
  }

  if (input.email && !isValidEmail(input.email)) {
    const err = new Error('Invalid email format');
    (err as any).code = 'invalid-email';
    throw err;
  }

  if (input.phone && !isValidPhone(input.phone)) {
    const err = new Error('Invalid phone format');
    (err as any).code = 'invalid-phone';
    throw err;
  }

  const createProfessionalFn = httpsCallable<
    CreateProfessionalInput,
    CreateProfessionalResponse
  >(functions, 'createProfessional');

  try {
    const result = await createProfessionalFn({
      ...input,
      companyId,
      name,
      email: coerceOptional(input.email),
      phone: coerceOptional(input.phone),
      avatar_url: coerceOptional(input.avatar_url),
      specialties: input.specialties?.map((s) => sanitizeText(s, 80)),
    });
    return result.data;
  } catch (error: any) {
    // Firebase Functions error format
    if (error.code) {
      // Re-throw with structured error for useErrorHandler
      const err = new Error(error.message || 'Failed to create professional');
      (err as any).code = error.code; // e.g., 'PRO_LIMIT_REACHED'
      throw err;
    }
    throw error;
  }
};

/**
 * Example usage in component:
 * 
 * ```tsx
 * import { createProfessional, listenProfessionals } from '@/services/professionals';
 * import { useErrorHandler } from '@/hooks/useErrorHandler';
 * 
 * function ProfessionalsManager() {
 *   const { handleAsyncError } = useErrorHandler();
 *   const [professionals, setProfessionals] = useState<Professional[]>([]);
 * 
 *   useEffect(() => {
 *     const unsubscribe = listenProfessionals(companyId, setProfessionals);
 *     return unsubscribe;
 *   }, [companyId]);
 * 
 *   const handleCreate = async (data) => {
 *     await handleAsyncError(async () => {
 *       const result = await createProfessional({ companyId, ...data });
 *       toast.success('Professional created!');
 *       return result;
 *     });
 *   };
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
