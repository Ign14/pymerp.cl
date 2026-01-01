import { addDoc, collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export type CalendarInventoryStatus = 'BOOKED' | 'REQUESTED';

export interface CalendarInventoryEntry {
  id: string;
  company_id: string;
  service_id: string;
  professional_id: string;
  schedule_slot_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: CalendarInventoryStatus;
  created_at: Date;
}

export const createCalendarInventoryEntry = async (
  data: Omit<CalendarInventoryEntry, 'id' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'calendarInventory'), {
    ...data,
    created_at: Timestamp.now(),
  });
  return docRef.id;
};

export const isInventorySlotAvailable = async (
  companyId: string,
  professionalId: string,
  date: Date,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  const day = date.toISOString().split('T')[0];
  const q = query(
    collection(db, 'calendarInventory'),
    where('company_id', '==', companyId),
    where('professional_id', '==', professionalId),
    where('date', '==', day),
    where('status', 'in', ['BOOKED', 'REQUESTED'])
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const item = docSnap.data() as CalendarInventoryEntry;
    const overlaps =
      (startTime >= item.start_time && startTime < item.end_time) ||
      (endTime > item.start_time && endTime <= item.end_time) ||
      (startTime <= item.start_time && endTime >= item.end_time);
    if (overlaps) {
      return false;
    }
  }

  return true;
};

/**
 * Obtiene todas las citas ocupadas para una fecha y compañía específicas
 */
export const getOccupiedSlotsForDate = async (
  companyId: string,
  date: Date
): Promise<CalendarInventoryEntry[]> => {
  const day = date.toISOString().split('T')[0];
  const q = query(
    collection(db, 'calendarInventory'),
    where('company_id', '==', companyId),
    where('date', '==', day),
    where('status', 'in', ['BOOKED', 'REQUESTED'])
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
  })) as CalendarInventoryEntry[];
};

/**
 * Obtiene todas las citas ocupadas para un rango de fechas
 */
export const getOccupiedSlotsForDateRange = async (
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarInventoryEntry[]> => {
  const startDay = startDate.toISOString().split('T')[0];
  const endDay = endDate.toISOString().split('T')[0];
  
  const q = query(
    collection(db, 'calendarInventory'),
    where('company_id', '==', companyId),
    where('date', '>=', startDay),
    where('date', '<=', endDay),
    where('status', 'in', ['BOOKED', 'REQUESTED'])
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate() || new Date(),
  })) as CalendarInventoryEntry[];
};

/**
 * Verifica si un horario está ocupado
 */
export const isSlotOccupied = (
  slot: { start_time: string; end_time: string },
  occupiedSlots: CalendarInventoryEntry[]
): boolean => {
  return occupiedSlots.some((occupied) => {
    const overlaps =
      (slot.start_time >= occupied.start_time && slot.start_time < occupied.end_time) ||
      (slot.end_time > occupied.start_time && slot.end_time <= occupied.end_time) ||
      (slot.start_time <= occupied.start_time && slot.end_time >= occupied.end_time);
    return overlaps;
  });
};

/**
 * Verifica si un profesional tiene horarios disponibles en una fecha
 */
export const hasAvailableSlotsForProfessional = (
  professionalId: string,
  availableSchedules: Array<{ id: string; start_time: string; end_time: string }>,
  occupiedSlots: CalendarInventoryEntry[]
): boolean => {
  // Si no hay horarios disponibles, el profesional no está disponible
  if (availableSchedules.length === 0) return false;

  // Filtrar horarios ocupados para este profesional
  const professionalOccupiedSlots = occupiedSlots.filter(
    (slot) => slot.professional_id === professionalId || slot.professional_id === 'unassigned'
  );

  // Verificar si hay al menos un horario disponible
  return availableSchedules.some((schedule) => {
    return !isSlotOccupied(schedule, professionalOccupiedSlots);
  });
};
