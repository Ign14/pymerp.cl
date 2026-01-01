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
  Timestamp,
  onSnapshot,
  deleteDoc,
  QueryConstraint,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import type {
  Appointment,
  Professional,
  ProfessionalAvailability,
  NotificationSettings,
} from '../types';
import { AppointmentStatus } from '../types';
import { getCompany, getService } from './firestore';
import { sendAppointmentConfirmedEmail, sendAppointmentCancelledEmail } from './appointmentEmails';
import { sanitizeText, isValidPhone, isValidEmail, assertCompanyScope, coerceOptional } from './validation';

// ==================== PROFESSIONALS ====================

export const createProfessional = async (
  data: Omit<Professional, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  // LÍMITES DESHABILITADOS: Sin restricciones hasta implementar sistema de cobro
  
  /* VALIDACIÓN DE LÍMITES COMENTADA:
  const company = await getCompany(data.company_id);
  if (!company) {
    throw new Error('Company not found');
  }
  const maxProfessionals = company.subscription?.maxProfessionals || 1;
  const currentProfessionals = await getProfessionals(data.company_id);
  const activeCount = currentProfessionals.filter(p => p.status === 'ACTIVE').length;
  if (activeCount >= maxProfessionals) {
    throw new Error(`LIMIT_REACHED:Límite de profesionales alcanzado (${maxProfessionals}). Actualiza tu plan para agregar más.`);
  }
  */

  const docRef = await addDoc(collection(db, 'professionals'), {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
};

// Get subscription limits for company
// NOTA: Límites deshabilitados - siempre retorna límites ilimitados
export const getSubscriptionLimits = async (companyId: string): Promise<{
  maxProfessionals: number;
  currentProfessionals: number;
  canAddMore: boolean;
}> => {
  const professionals = await getProfessionals(companyId);
  const currentProfessionals = professionals.filter(p => p.status === 'ACTIVE').length;

  return {
    maxProfessionals: 999999, // Límite ilimitado (representado como número muy alto)
    currentProfessionals,
    canAddMore: true, // ✅ Siempre se puede agregar más
  };
};

export const getProfessionals = async (companyId: string): Promise<Professional[]> => {
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
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Professional;
  });
};

export const getProfessional = async (professionalId: string): Promise<Professional | null> => {
  const docRef = doc(db, 'professionals', professionalId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as Professional;
};

export const updateProfessional = async (
  professionalId: string,
  updates: Partial<Professional>
): Promise<void> => {
  const docRef = doc(db, 'professionals', professionalId);
  await updateDoc(docRef, {
    ...updates,
    updated_at: Timestamp.now(),
  });
};

export const deleteProfessional = async (professionalId: string): Promise<void> => {
  await deleteDoc(doc(db, 'professionals', professionalId));
};

// ==================== AVAILABILITY ====================

export const setProfessionalAvailability = async (
  data: Omit<ProfessionalAvailability, 'id' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'professional_availability'), {
    ...data,
    created_at: Timestamp.now(),
  });
  return docRef.id;
};

export const getProfessionalAvailability = async (
  professionalId: string
): Promise<ProfessionalAvailability[]> => {
  const q = query(
    collection(db, 'professional_availability'),
    where('professional_id', '==', professionalId),
    where('is_available', '==', true),
    orderBy('day_of_week', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
    } as ProfessionalAvailability;
  });
};

export const getAllProfessionalAvailability = async (
  professionalId: string
): Promise<ProfessionalAvailability[]> => {
  const q = query(
    collection(db, 'professional_availability'),
    where('professional_id', '==', professionalId),
    orderBy('day_of_week', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
    } as ProfessionalAvailability;
  });
};

export const deleteProfessionalAvailability = async (availabilityId: string): Promise<void> => {
  await deleteDoc(doc(db, 'professional_availability', availabilityId));
};

export const deleteAllProfessionalAvailability = async (professionalId: string): Promise<void> => {
  const availabilities = await getAllProfessionalAvailability(professionalId);
  const deletePromises = availabilities.map(av => deleteProfessionalAvailability(av.id));
  await Promise.all(deletePromises);
};

// ==================== APPOINTMENTS ====================

export const createAppointment = async (
  data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  // Debug: Log the company_id being used
  console.log('🔵 Creating appointment with company_id:', data.company_id);
  const scopedCompanyId = assertCompanyScope(data.company_id);
  
  // Filtrar campos undefined para evitar errores en Firestore
  const cleanData: any = {
    company_id: scopedCompanyId,
    service_id: data.service_id,
    professional_id: data.professional_id,
    client_name: sanitizeText(data.client_name, 120),
    client_phone: data.client_phone.trim(),
    appointment_date: Timestamp.fromDate(data.appointment_date),
    start_time: data.start_time,
    end_time: data.end_time,
    status: data.status,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };

  // Solo agregar campos opcionales si tienen valor (sanitizados)
  if (data.client_email) {
    cleanData.client_email = data.client_email.trim();
  }
  if (data.client_rut) {
    cleanData.client_rut = data.client_rut.trim();
  }
  if (data.notes) {
    cleanData.notes = sanitizeText(data.notes, 600);
  }
  if (data.created_by_user_id) {
    cleanData.created_by_user_id = data.created_by_user_id;
  }

  const docRef = await addDoc(collection(db, 'appointments'), cleanData);
  return docRef.id;
};

export const createManualAppointment = async (
  data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<string> => {
  return createAppointment({
    ...data,
    created_by_user_id: userId,
    status: data.status || AppointmentStatus.CONFIRMED,
  });
};

export const getAppointment = async (appointmentId: string): Promise<Appointment | null> => {
  const docRef = doc(db, 'appointments', appointmentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    appointment_date: data.appointment_date?.toDate?.() || new Date(),
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as Appointment;
};

export const getAppointmentsByCompany = async (companyId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, 'appointments'),
    where('company_id', '==', companyId),
    orderBy('appointment_date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appointment_date: data.appointment_date?.toDate?.() || new Date(),
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Appointment;
  });
};

export const getAppointmentsByRange = async (
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> => {
  const q = query(
    collection(db, 'appointments'),
    where('company_id', '==', companyId),
    where('appointment_date', '>=', Timestamp.fromDate(startDate)),
    where('appointment_date', '<=', Timestamp.fromDate(endDate)),
    orderBy('appointment_date', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appointment_date: data.appointment_date?.toDate?.() || new Date(),
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Appointment;
  });
};

export const getPendingAppointments = async (companyId: string): Promise<Appointment[]> => {
  const q = query(
    collection(db, 'appointments'),
    where('company_id', '==', companyId),
    where('status', '==', AppointmentStatus.REQUESTED),
    orderBy('appointment_date', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appointment_date: data.appointment_date?.toDate?.() || new Date(),
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as Appointment;
  });
};

export const updateAppointment = async (
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<void> => {
  const docRef = doc(db, 'appointments', appointmentId);
  const updateData: any = {
    ...updates,
    updated_at: Timestamp.now(),
  };
  if (updates.appointment_date) {
    updateData.appointment_date = Timestamp.fromDate(updates.appointment_date);
  }
  await updateDoc(docRef, updateData);
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  await updateAppointment(appointmentId, { status: AppointmentStatus.CANCELLED });
};

/**
 * Enhanced cancel appointment with email and WhatsApp notifications
 */
export const cancelAppointmentWithNotifications = async (appointmentId: string): Promise<void> => {
  // Get appointment data
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Cita no encontrada');
  }

  // Update status
  await updateAppointment(appointmentId, { status: AppointmentStatus.CANCELLED });

  // Get related data for notifications
  try {
    const [company, service, professional] = await Promise.all([
      getCompany(appointment.company_id),
      getService(appointment.service_id),
      appointment.professional_id !== 'unassigned' ? getProfessional(appointment.professional_id) : Promise.resolve(null),
    ]);

    if (!company || !service) return;

    const professionalName = professional?.name || 'Sin asignar';
    const companyWhatsapp = company.whatsapp;

    // Send email to client if available (non-blocking)
    if (appointment.client_email) {
      // Don't await - let it run in background without blocking
      sendAppointmentCancelledEmail(
        appointment,
        service.name,
        professionalName,
        company.name,
        appointment.client_email,
        companyWhatsapp
      ).catch(() => {
        // Silently ignore email errors - they're non-critical
      });
    }

    // Note: WhatsApp notification should be sent manually by the business owner
    // The email contains all the necessary information
  } catch (error) {
    // Silently ignore notification errors - they're non-critical
  }
};

export const confirmAppointment = async (appointmentId: string): Promise<void> => {
  await updateAppointment(appointmentId, { status: AppointmentStatus.CONFIRMED });
};

/**
 * Enhanced confirm appointment with email and WhatsApp notifications
 */
export const confirmAppointmentWithNotifications = async (appointmentId: string): Promise<void> => {
  // Get appointment data
  const appointment = await getAppointment(appointmentId);
  if (!appointment) {
    throw new Error('Cita no encontrada');
  }

  // Update status
  await updateAppointment(appointmentId, { status: AppointmentStatus.CONFIRMED });

  // Get related data for notifications
  try {
    const [company, service, professional] = await Promise.all([
      getCompany(appointment.company_id),
      getService(appointment.service_id),
      appointment.professional_id !== 'unassigned' ? getProfessional(appointment.professional_id) : Promise.resolve(null),
    ]);

    if (!company || !service) return;

    const professionalName = professional?.name || 'Sin asignar';
    const companyWhatsapp = company.whatsapp;

    // Send email to client if available (non-blocking)
    if (appointment.client_email) {
      // Don't await - let it run in background without blocking
      sendAppointmentConfirmedEmail(
        appointment,
        service.name,
        professionalName,
        company.name,
        appointment.client_email,
        companyWhatsapp
      ).catch(() => {
        // Silently ignore email errors - they're non-critical
      });
    }

    // Note: WhatsApp notification should be sent manually by the business owner
    // The email contains all the necessary information
  } catch (error) {
    // Silently ignore notification errors - they're non-critical
  }
};

export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'appointments', appointmentId));
};

// Real-time listener for appointments
export const listenAppointmentsByRange = (
  companyId: string,
  startDate: Date,
  endDate: Date,
  callback: (appointments: Appointment[]) => void,
  filters?: {
    professionalId?: string;
    status?: AppointmentStatus[];
  }
) => {
  const constraints: QueryConstraint[] = [
    where('company_id', '==', companyId),
    where('appointment_date', '>=', Timestamp.fromDate(startDate)),
    where('appointment_date', '<=', Timestamp.fromDate(endDate)),
  ];

  if (filters?.professionalId) {
    constraints.push(where('professional_id', '==', filters.professionalId));
  }

  if (filters?.status && filters.status.length > 0) {
    constraints.push(where('status', 'in', filters.status));
  }

  constraints.push(orderBy('appointment_date', 'asc'));

  const q = query(collection(db, 'appointments'), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const appointments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appointment_date: data.appointment_date?.toDate?.() || new Date(),
          created_at: data.created_at?.toDate?.() || new Date(),
          updated_at: data.updated_at?.toDate?.() || new Date(),
        } as Appointment;
      });
      callback(appointments);
    },
    (error) => {
      console.error('Error listening to appointments:', error);
      throw error;
    }
  );
};

// ==================== NOTIFICATIONS ====================

export const getNotificationSettings = async (
  userId: string,
  companyId: string
): Promise<NotificationSettings | null> => {
  const q = query(
    collection(db, 'notification_settings'),
    where('user_id', '==', userId),
    where('company_id', '==', companyId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return {
    id: snapshot.docs[0].id,
    ...data,
    created_at: data.created_at?.toDate?.() || new Date(),
    updated_at: data.updated_at?.toDate?.() || new Date(),
  } as NotificationSettings;
};

export const setEmailNotificationsEnabled = async (
  userId: string,
  companyId: string,
  enabled: boolean,
  email?: string
): Promise<void> => {
  const existing = await getNotificationSettings(userId, companyId);
  
  if (existing) {
    const docRef = doc(db, 'notification_settings', existing.id);
    await updateDoc(docRef, {
      email_notifications_enabled: enabled,
      notification_email: email || existing.notification_email,
      updated_at: Timestamp.now(),
    });
  } else {
    await addDoc(collection(db, 'notification_settings'), {
      user_id: userId,
      company_id: companyId,
      email_notifications_enabled: enabled,
      notification_email: email,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
  }
};

// Check if a time slot is available
export const isTimeSlotAvailable = async (
  professionalId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<boolean> => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'appointments'),
    where('professional_id', '==', professionalId),
    where('appointment_date', '>=', Timestamp.fromDate(dayStart)),
    where('appointment_date', '<=', Timestamp.fromDate(dayEnd)),
    where('status', 'in', [AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED])
  );

  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    if (excludeAppointmentId && docSnap.id === excludeAppointmentId) continue;
    
    const appt = docSnap.data();
    // Check for time overlap
    if (
      (startTime >= appt.start_time && startTime < appt.end_time) ||
      (endTime > appt.start_time && endTime <= appt.end_time) ||
      (startTime <= appt.start_time && endTime >= appt.end_time)
    ) {
      return false;
    }
  }
  
  return true;
};

// Get available time slots for a professional on a specific date
export const getAvailableTimeSlots = async (
  professionalId: string,
  date: Date,
  durationMinutes: number
): Promise<Array<{ start: string; end: string }>> => {
  const dayOfWeek = date.getDay();
  
  // Get professional's availability for this day
  const availabilityQuery = query(
    collection(db, 'professional_availability'),
    where('professional_id', '==', professionalId),
    where('day_of_week', '==', dayOfWeek),
    where('is_available', '==', true)
  );
  
  const availabilitySnapshot = await getDocs(availabilityQuery);
  
  if (availabilitySnapshot.empty) {
    return [];
  }
  
  // Get existing appointments for this day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('professional_id', '==', professionalId),
    where('appointment_date', '>=', Timestamp.fromDate(dayStart)),
    where('appointment_date', '<=', Timestamp.fromDate(dayEnd)),
    where('status', 'in', [AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED])
  );
  
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const bookedSlots = appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return { start: data.start_time, end: data.end_time };
  });
  
  // Generate time slots
  const slots: Array<{ start: string; end: string }> = [];
  
  availabilitySnapshot.forEach(doc => {
    const availability = doc.data();
    const startTime = availability.start_time; // e.g., "09:00"
    const endTime = availability.end_time; // e.g., "18:00"
    
    // Convert times to minutes
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Generate slots every 30 minutes (or duration, whichever is smaller)
    const slotInterval = Math.min(30, durationMinutes);
    
    for (let time = startMinutes; time + durationMinutes <= endMinutes; time += slotInterval) {
      const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      const slotEnd = `${String(Math.floor((time + durationMinutes) / 60)).padStart(2, '0')}:${String((time + durationMinutes) % 60).padStart(2, '0')}`;
      
      // Check if this slot conflicts with any booked appointment
      const hasConflict = bookedSlots.some(booked => {
        return (
          (slotStart >= booked.start && slotStart < booked.end) ||
          (slotEnd > booked.start && slotEnd <= booked.end) ||
          (slotStart <= booked.start && slotEnd >= booked.end)
        );
      });
      
      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }
  });
  
  return slots;
};

// ==================== PATIENT RECORDS ====================

/**
 * Get patient appointment history by name and RUT
 * Searches for all appointments matching the client name and RUT
 * If RUT is provided, searches by RUT first, then by name as fallback
 * If no RUT, searches only by name
 */
export const getPatientAppointmentHistory = async (
  companyId: string,
  clientName: string,
  clientRut?: string
): Promise<Appointment[]> => {
  // Normalize inputs for comparison
  const normalizedName = clientName.trim().toLowerCase();
  const normalizedRut = clientRut?.trim().replace(/[^0-9kK-]/g, '').toUpperCase();

  let appointments: Appointment[] = [];

  // If RUT is provided, search by RUT first
  if (normalizedRut) {
    const qByRut = query(
      collection(db, 'appointments'),
      where('company_id', '==', companyId),
      where('client_rut', '==', normalizedRut),
      orderBy('appointment_date', 'desc')
    );

    const snapshotByRut = await getDocs(qByRut);
    appointments = snapshotByRut.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        appointment_date: data.appointment_date?.toDate?.() || new Date(),
        created_at: data.created_at?.toDate?.() || new Date(),
        updated_at: data.updated_at?.toDate?.() || new Date(),
      } as Appointment;
    });
  }

  // Also search by name to catch appointments without RUT or with slight name variations
  // Get all appointments for the company and filter by name
  const qByName = query(
    collection(db, 'appointments'),
    where('company_id', '==', companyId),
    orderBy('appointment_date', 'desc')
  );

  const snapshotByName = await getDocs(qByName);
  const appointmentsByName = snapshotByName.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        appointment_date: data.appointment_date?.toDate?.() || new Date(),
        created_at: data.created_at?.toDate?.() || new Date(),
        updated_at: data.updated_at?.toDate?.() || new Date(),
      } as Appointment;
    })
    .filter((appt) => {
      const apptName = appt.client_name?.trim().toLowerCase() || '';
      // Match if names are similar (exact match, contains, or is contained)
      const nameMatches = 
        apptName === normalizedName || 
        apptName.includes(normalizedName) || 
        normalizedName.includes(apptName);
      
      // If we already have RUT-based results, only add if name matches and RUT doesn't match (or is missing)
      if (normalizedRut && appointments.length > 0) {
        const apptRut = appt.client_rut?.trim().replace(/[^0-9kK-]/g, '').toUpperCase();
        return nameMatches && apptRut !== normalizedRut;
      }
      
      return nameMatches;
    });

  // Combine and deduplicate by appointment ID
  const allAppointments = [...appointments, ...appointmentsByName];
  const uniqueAppointments = Array.from(
    new Map(allAppointments.map((apt) => [apt.id, apt])).values()
  );

  // Sort by date (most recent first)
  return uniqueAppointments.sort((a, b) => {
    const dateA = a.appointment_date.getTime();
    const dateB = b.appointment_date.getTime();
    if (dateA !== dateB) return dateB - dateA;
    return a.start_time.localeCompare(b.start_time);
  });
};

// ==================== PUBLIC APPOINTMENT REQUESTS (via Cloud Function) ====================

export interface CreateAppointmentRequestInput {
  companyId: string;
  serviceId: string;
  professionalId?: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
}

export interface CreateAppointmentRequestResponse {
  requestId: string;
  message?: string;
}

/**
 * Create a public appointment request via Cloud Function
 * This is called from the public booking page
 * The function validates slot availability and creates the request
 * 
 * @param input - Appointment request data
 * @returns Promise with request ID
 * @throws Error with code SLOT_TAKEN if time slot is not available
 */
export const createAppointmentRequestPublic = async (
  input: CreateAppointmentRequestInput
): Promise<CreateAppointmentRequestResponse> => {
  const companyId = assertCompanyScope(input.companyId);
  const clientName = sanitizeText(input.clientName, 120);
  const notes = input.notes ? sanitizeText(input.notes, 600) : undefined;

  if (!isValidPhone(input.clientPhone)) {
    const err = new Error('Invalid phone format');
    (err as any).code = 'invalid-phone';
    throw err;
  }

  if (input.clientEmail && !isValidEmail(input.clientEmail)) {
    const err = new Error('Invalid email format');
    (err as any).code = 'invalid-email';
    throw err;
  }

  const createRequestFn = httpsCallable<
    CreateAppointmentRequestInput,
    CreateAppointmentRequestResponse
  >(functions, 'createAppointmentRequest');

  try {
    const result = await createRequestFn({
      ...input,
      companyId,
      clientName,
      clientPhone: input.clientPhone.trim(),
      clientEmail: coerceOptional(input.clientEmail?.trim()),
      notes,
    });
    return result.data;
  } catch (error: any) {
    if (error.code) {
      const err = new Error(error.message || 'Failed to create appointment request');
      (err as any).code = error.code; // e.g., 'SLOT_TAKEN'
      throw err;
    }
    throw error;
  }
};
