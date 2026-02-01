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
import type { Event, EventReservation } from '../types';
import { assertCompanyScope, assertResourceBelongsToCompany } from './validation';

const EVENTS_COLLECTION = 'events';
const RESERVATIONS_COLLECTION = 'event_reservations';

const mapEvent = (docSnap: any): Event => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    start_date: data.start_date?.toDate?.() || data.start_date,
    end_date: data.end_date?.toDate?.() || data.end_date,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as Event;
};

const mapReservation = (docSnap: any): EventReservation => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as EventReservation;
};

export const getEvents = async (companyId: string): Promise<Event[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    const q = query(collection(db, EVENTS_COLLECTION), where('company_id', '==', scopedCompany));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapEvent);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: EVENTS_COLLECTION, op: 'list' });
    throw error;
  }
};

export const getEvent = async (
  eventId: string,
  companyId?: string
): Promise<Event | null> => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const event = mapEvent(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        event.company_id,
        companyId,
        'Event',
        eventId
      );
    }
    
    return event;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: EVENTS_COLLECTION, op: 'get' });
    throw error;
  }
};

export const createEvent = async (
  data: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id as string);
  try {
    const now = Timestamp.now();
    const startDate = data.start_date instanceof Date ? data.start_date : data.start_date ? new Date(data.start_date as string | number) : new Date();
    const endDate = data.end_date instanceof Date ? data.end_date : data.end_date ? new Date(data.end_date as string | number) : undefined;
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...data,
      company_id: scopedCompany,
      start_date: Timestamp.fromDate(startDate),
      end_date: endDate ? Timestamp.fromDate(endDate) : undefined,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: EVENTS_COLLECTION, op: 'create' });
    throw error;
  }
};

export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getEvent(eventId, companyId);
      if (!existing) {
        throw new Error(`Event ${eventId} not found or does not belong to company ${companyId}`);
      }
    }
    
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const updateData: any = {
      ...updates,
      updated_at: Timestamp.now(),
    };
    if (updates.start_date instanceof Date) {
      updateData.start_date = Timestamp.fromDate(updates.start_date);
    }
    if (updates.end_date instanceof Date) {
      updateData.end_date = Timestamp.fromDate(updates.end_date);
    }
    await updateDoc(docRef, updateData);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: EVENTS_COLLECTION, op: 'update' });
    throw error;
  }
};

export const deleteEvent = async (
  eventId: string,
  companyId?: string
): Promise<void> => {
  try {
    // Validate company_id if provided
    if (companyId) {
      const existing = await getEvent(eventId, companyId);
      if (!existing) {
        throw new Error(`Event ${eventId} not found or does not belong to company ${companyId}`);
      }
    }
    
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: EVENTS_COLLECTION, op: 'delete' });
    throw error;
  }
};

export const getEventReservations = async (
  companyId: string,
  eventId?: string
): Promise<EventReservation[]> => {
  const scopedCompany = assertCompanyScope(companyId);
  try {
    let constraints: any[] = [where('company_id', '==', scopedCompany)];
    if (eventId) {
      constraints = [...constraints, where('event_id', '==', eventId)];
    }
    const q = query(collection(db, RESERVATIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapReservation);
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: RESERVATIONS_COLLECTION, op: 'list' });
    throw error;
  }
};

export const getEventReservation = async (
  reservationId: string,
  companyId?: string
): Promise<EventReservation | null> => {
  try {
    const docRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const reservation = mapReservation(docSnap);
    
    // Validate company_id if provided
    if (companyId) {
      assertResourceBelongsToCompany(
        reservation.company_id as string | null | undefined,
        companyId,
        'EventReservation',
        reservationId
      );
    }
    
    return reservation;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: RESERVATIONS_COLLECTION, op: 'get' });
    throw error;
  }
};

export const createEventReservation = async (
  data: Omit<EventReservation, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  const scopedCompany = assertCompanyScope(data.company_id as string);
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, RESERVATIONS_COLLECTION), {
      ...data,
      company_id: scopedCompany,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: RESERVATIONS_COLLECTION, op: 'create' });
    throw error;
  }
};

export const updateEventReservation = async (
  reservationId: string,
  updates: Partial<EventReservation>
): Promise<void> => {
  try {
    const docRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: RESERVATIONS_COLLECTION, op: 'update' });
    throw error;
  }
};

export const deleteEventReservation = async (reservationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, RESERVATIONS_COLLECTION, reservationId));
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { collection: RESERVATIONS_COLLECTION, op: 'delete' });
    throw error;
  }
};

/**
 * Suma la cantidad confirmada de tickets (CONFIRMED) de una lista de reservas
 */
export const sumConfirmedQty = (reservations: EventReservation[]): number => {
  return reservations
    .filter((r) => (r.status || 'CONFIRMED') === 'CONFIRMED')
    .reduce((sum, r) => sum + (r.tickets || 1), 0);
};
