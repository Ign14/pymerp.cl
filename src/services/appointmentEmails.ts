import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { Appointment } from '../types';

export interface SendAppointmentEmailInput {
  type: 'created' | 'confirmed' | 'cancelled' | 'reminder';
  appointmentId: string;
  companyId: string;
  recipientEmail: string;
  appointmentData: {
    clientName: string;
    serviceName: string;
    professionalName: string;
    date: string; // ISO string
    startTime: string;
    endTime: string;
    notes?: string;
  };
  companyData: {
    name: string;
    whatsapp?: string;
  };
}

export interface SendAppointmentEmailResponse {
  success: boolean;
  message?: string;
}

/**
 * Send appointment notification email via Cloud Function
 * 
 * @param input - Email data
 * @returns Promise with success status
 */
export const sendAppointmentEmail = async (
  input: SendAppointmentEmailInput
): Promise<SendAppointmentEmailResponse> => {
  const sendEmailFn = httpsCallable<
    SendAppointmentEmailInput,
    SendAppointmentEmailResponse
  >(functions, 'sendAppointmentEmail');

  try {
    const result = await sendEmailFn(input);
    return result.data;
  } catch (error: any) {
    // Email service is optional - don't break the app if it fails
    // Log silently to reduce console noise (emails are non-critical)
    // Return a success response to prevent error propagation
    return { success: false, message: error.message || 'Email service unavailable' };
  }
};

/**
 * Helper: Send email when appointment is created
 */
export const sendAppointmentCreatedEmail = async (
  appointment: Appointment,
  serviceName: string,
  professionalName: string,
  companyName: string,
  ownerEmail: string,
  companyWhatsapp?: string
): Promise<void> => {
  try {
    await sendAppointmentEmail({
      type: 'created',
      appointmentId: appointment.id,
      companyId: appointment.company_id,
      recipientEmail: ownerEmail,
      appointmentData: {
        clientName: appointment.client_name,
        serviceName,
        professionalName,
        date: appointment.appointment_date.toISOString(),
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        notes: appointment.notes,
      },
      companyData: {
        name: companyName,
        whatsapp: companyWhatsapp,
      },
    });
  } catch (error) {
    // Email sending is optional - fail silently without logging
  }
};

/**
 * Helper: Send email when appointment is confirmed
 */
export const sendAppointmentConfirmedEmail = async (
  appointment: Appointment,
  serviceName: string,
  professionalName: string,
  companyName: string,
  clientEmail?: string,
  companyWhatsapp?: string
): Promise<void> => {
  if (!clientEmail) return;

  // Email sending is optional - fail silently without throwing
  await sendAppointmentEmail({
    type: 'confirmed',
    appointmentId: appointment.id,
    companyId: appointment.company_id,
    recipientEmail: clientEmail,
    appointmentData: {
      clientName: appointment.client_name,
      serviceName,
      professionalName,
      date: appointment.appointment_date.toISOString(),
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      notes: appointment.notes,
    },
    companyData: {
      name: companyName,
      whatsapp: companyWhatsapp,
    },
  });

  // Email sending is optional - fail silently without logging
  // The error is already handled in sendAppointmentEmail
};

/**
 * Helper: Send email when appointment is cancelled
 */
export const sendAppointmentCancelledEmail = async (
  appointment: Appointment,
  serviceName: string,
  professionalName: string,
  companyName: string,
  recipientEmail: string,
  companyWhatsapp?: string
): Promise<void> => {
  // Email sending is optional - fail silently without throwing
  await sendAppointmentEmail({
    type: 'cancelled',
    appointmentId: appointment.id,
    companyId: appointment.company_id,
    recipientEmail,
    appointmentData: {
      clientName: appointment.client_name,
      serviceName,
      professionalName,
      date: appointment.appointment_date.toISOString(),
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      notes: appointment.notes,
    },
    companyData: {
      name: companyName,
      whatsapp: companyWhatsapp,
    },
  });

  // Email sending is optional - fail silently without logging
  // The error is already handled in sendAppointmentEmail
};

/**
 * Helper: Send reminder email 24h before appointment
 */
export const sendAppointmentReminderEmail = async (
  appointment: Appointment,
  serviceName: string,
  professionalName: string,
  companyName: string,
  clientEmail?: string,
  companyWhatsapp?: string
): Promise<void> => {
  if (!clientEmail) return;

  try {
    await sendAppointmentEmail({
      type: 'reminder',
      appointmentId: appointment.id,
      companyId: appointment.company_id,
      recipientEmail: clientEmail,
      appointmentData: {
        clientName: appointment.client_name,
        serviceName,
        professionalName,
        date: appointment.appointment_date.toISOString(),
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        notes: appointment.notes,
      },
      companyData: {
        name: companyName,
        whatsapp: companyWhatsapp,
      },
    });
  } catch (error) {
    // Email sending is optional - fail silently without logging
  }
};

