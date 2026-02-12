import * as functions from 'firebase-functions/v1';
import { defineString } from 'firebase-functions/params';
import type * as AdminNamespace from 'firebase-admin';
import { getAppointmentRequestEmailTemplate } from './emailTemplates';

// Lazy initialization para evitar problemas de carga y timeouts en deployment
let _adminInitialized = false;
let _admin: AdminNamespace | null = null;
let _sgMail: any;

const getAdmin = (): AdminNamespace => {
  if (!_admin) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _admin = require('firebase-admin');
  }
  return _admin;
};

const getSendGrid = () => {
  if (!_sgMail) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _sgMail = require('@sendgrid/mail');
  }
  return _sgMail;
};

const ensureAdminInitialized = () => {
  if (!_adminInitialized) {
    try {
      getAdmin().initializeApp();
      _adminInitialized = true;
    } catch (error: any) {
      // Si ya está inicializado, ignorar el error
      if (error.code !== 'app/already-initialized') {
        throw error;
      }
      _adminInitialized = true;
    }
  }
};

const getFirestore = () => {
  ensureAdminInitialized();
  return getAdmin().firestore();
};

const SENDGRID_API_KEY_PARAM = defineString('SENDGRID_API_KEY');
const getSendGridApiKey = () =>
  SENDGRID_API_KEY_PARAM.value() || process.env.SENDGRID_API_KEY || '';

type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';

const safeString = (value: unknown, min = 1, max = 200) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
};

const sanitizeEmail = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
};

const safeNumber = (value: unknown, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value < min || value > max) return null;
  return value;
};

const toTimestamp = (value: unknown, field: string) => {
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new functions.https.HttpsError('invalid-argument', `Fecha inválida para ${field}`);
    }
    return getAdmin().firestore.Timestamp.fromDate(date);
  }
  if (value instanceof getAdmin().firestore.Timestamp) return value;
  throw new functions.https.HttpsError('invalid-argument', `Fecha inválida para ${field}`);
};

const formatSlotId = (
  companyId: string,
  professionalId: string,
  start: AdminNamespace.firestore.Timestamp
) => {
  const date = start.toDate();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${companyId}_${professionalId}_${yyyy}${mm}${dd}${hh}${min}`;
};

const ensureSendGrid = () => {
  const key = getSendGridApiKey();
  if (!key) {
    throw new functions.https.HttpsError('failed-precondition', 'SendGrid API key no configurada');
  }
  getSendGrid().setApiKey(key);
};

// Simple rate limiter en memoria (por uid o ip)
const rateBuckets: Record<string, { count: number; reset: number }> = {};
const isRateLimited = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const bucket = rateBuckets[key] || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets[key] = bucket;
  return bucket.count > limit;
};

const resolveCompanyId = (data: any, context: functions.https.CallableContext): string => {
  const companyId = safeString(data.companyId || data.company_id, 1, 200);
  if (!companyId) throw new functions.https.HttpsError('invalid-argument', 'companyId requerido');
  const claimCompanyId = context.auth?.token?.company_id as string | undefined;
  if (claimCompanyId && claimCompanyId !== companyId) {
    throw new functions.https.HttpsError('permission-denied', 'No autorizado para este companyId');
  }
  return companyId;
};

const getLocalInfo = (ts: AdminNamespace.firestore.Timestamp, timeZone: string) => {
  const date = ts.toDate();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const weekday = get('weekday') || 'Sun';
  const hour = Number(get('hour') || '0');
  const minute = Number(get('minute') || '0');

  const weekdayToIndex: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  };

  return {
    weekdayIndex: weekdayToIndex[weekday] ?? date.getUTCDay(),
    minutesOfDay: hour * 60 + minute
  };
};

const parseHHMM = (value: string | undefined): number | null => {
  if (!value || typeof value !== 'string') return null;
  const [h, m] = value.split(':');
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
};

const isSlotAvailable = async ({
  companyId,
  professionalId,
  startAt,
  endAt,
}: {
  companyId: string;
  professionalId: string;
  startAt: AdminNamespace.firestore.Timestamp;
  endAt: AdminNamespace.firestore.Timestamp;
}) => {
  const companySnap = await getFirestore().doc(`companies/${companyId}`).get();
  const tz = (companySnap.get('timezone') as string) || 'America/Santiago';
  const { weekdayIndex, minutesOfDay } = getLocalInfo(startAt, tz);

  // Exceptions first (blocking overrides schedule)
  const exceptionsSnap = await getFirestore()
    .collection('availability_exceptions')
    .where('company_id', '==', companyId)
    .where('professional_id', '==', professionalId)
    .limit(20)
    .get();

  let hasOverride = false;
  for (const doc of exceptionsSnap.docs) {
    const ex = doc.data();
    const range = ex.dateRange || {};
    const from = range.startAt || range.start || ex.from || ex.startAt;
    const to = range.endAt || range.end || ex.to || ex.endAt;
    const start = from ? toTimestamp(from, 'exception.from') : null;
    const end = to ? toTimestamp(to, 'exception.to') : null;
    if (start && end && start <= startAt && endAt <= end) {
      if (ex.type === 'BLOCK') {
        return { ok: false, reason: 'SLOT_BLOCKED' };
      }
      if (ex.type === 'OVERRIDE') {
        hasOverride = true;
      }
    }
  }

  if (hasOverride) return { ok: true };

  // Weekly rules
  const templatesSnap = await getFirestore()
    .collection('availability_templates')
    .where('company_id', '==', companyId)
    .where('professional_id', '==', professionalId)
    .limit(1)
    .get();

  if (templatesSnap.empty) return { ok: true }; // si no hay plantilla, no se restringe

  const weeklyRules = templatesSnap.docs[0].get('weeklyRules') || {};
  const dayRules: any[] = weeklyRules[weekdayIndex] || weeklyRules[String(weekdayIndex)] || [];
  if (!Array.isArray(dayRules) || dayRules.length === 0) {
    return { ok: false, reason: 'OUT_OF_SCHEDULE' };
  }

  const fits = dayRules.some((rule) => {
    const startMin = parseHHMM(rule.start) ?? parseHHMM(rule.from);
    const endMin = parseHHMM(rule.end) ?? parseHHMM(rule.to);
    if (startMin == null || endMin == null) return false;
    return minutesOfDay >= startMin && minutesOfDay < endMin;
  });

  return fits ? { ok: true } : { ok: false, reason: 'OUT_OF_SCHEDULE' };
};

/**
 * Callable: crea profesional respetando el límite del plan.
 */
export const createProfessional = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    }

    const companyId = resolveCompanyId(data, context);
    const name = safeString(data.name, 2, 120);
    const email = data.email ? safeString(data.email, 3, 254) : undefined;
    const phone = data.phone ? safeString(data.phone, 3, 30) : undefined;
    const avatar_url = data.avatar_url ? safeString(data.avatar_url, 3, 2048) : undefined;
    const specialties = Array.isArray(data.specialties) ? data.specialties : undefined;
    const status = data.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (!name) throw new functions.https.HttpsError('invalid-argument', 'Nombre requerido');

    const companyRef = getFirestore().doc(`companies/${companyId}`);
    const professionalsCol = getFirestore().collection('professionals');

    return getFirestore().runTransaction(async (tx) => {
      const companySnap = await tx.get(companyRef);
      if (!companySnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Compañía no encontrada');
      }
      // LÍMITES DESHABILITADOS: Sin restricciones hasta implementar sistema de cobro
      // Las siguientes líneas están comentadas para permitir creación ilimitada
      
      /* CÓDIGO ORIGINAL (comentado temporalmente):
      const subscription = companySnap.get('subscription') || {};
      const subscriptionPlan = companySnap.get('subscription_plan') || 'BASIC';
      const planLimits: Record<string, number> = {
        BASIC: 1,
        STANDARD: 5,
        PRO: 60,
        APPROVED25: 10,
      };
      const maxProfessionals: number = subscription.maxProfessionals ?? planLimits[subscriptionPlan] ?? 1;
      if (maxProfessionals < 1 || maxProfessionals > 60) {
        throw new functions.https.HttpsError('failed-precondition', 'Plan inválido');
      }
      const current = await tx.get(
        professionalsCol.where('company_id', '==', companyId).where('status', '==', 'ACTIVE').limit(maxProfessionals + 1)
      );
      if (current.size >= maxProfessionals) {
        throw new functions.https.HttpsError('failed-precondition', 'PRO_LIMIT_REACHED');
      }
      */

      // ✅ Sin validación de límites - permitir creación ilimitada

      const newRef = professionalsCol.doc();
      
      // Crear objeto con campos obligatorios
      const professionalData: any = {
        company_id: companyId,
        name,
        status,
        created_at: getAdmin().firestore.FieldValue.serverTimestamp(),
        updated_at: getAdmin().firestore.FieldValue.serverTimestamp(),
      };
      
      // Agregar campos opcionales solo si están presentes
      if (email) professionalData.email = email;
      if (phone) professionalData.phone = phone;
      if (avatar_url) professionalData.avatar_url = avatar_url;
      if (specialties && specialties.length > 0) professionalData.specialties = specialties;

      tx.set(newRef, professionalData, { merge: false });
      
      tx.set(
        companyRef,
        { stats: { professionalsCount: getAdmin().firestore.FieldValue.increment(1) } },
        { merge: true }
      );

      return { professionalId: newRef.id };
    });
  });

/**
 * Callable: crea cita con bloqueo optimista de slot.
 */
export const createAppointmentRequest = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    const companyId = resolveCompanyId(data, context);
    const professionalId = safeString(data.professionalId || data.professional_id, 1, 200);
    const serviceId = safeString(data.serviceId || data.service_id, 1, 200);
    const clientName = safeString(data.clientName, 1, 140);
    const clientPhone = safeString(data.clientPhone, 6, 30);
    const clientEmail = data.clientEmail ? safeString(data.clientEmail, 5, 254) : null;
    const notes = data.notes ? safeString(data.notes, 0, 500) : null;
    const slotMinutes = safeNumber(data.slotMinutes ?? 15, 5, 240) ?? 15;

    if (!professionalId || !serviceId || !clientName || !clientPhone) {
      throw new functions.https.HttpsError('invalid-argument', 'Faltan campos requeridos');
    }

    const limiterKey = context.auth?.uid || context.rawRequest?.ip || 'anon';
    if (isRateLimited(String(limiterKey), 30, 60_000)) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
    }

    const startAt = toTimestamp(data.startAt, 'startAt');
    const endAt = data.endAt ? toTimestamp(data.endAt, 'endAt') : getAdmin().firestore.Timestamp.fromMillis(
      startAt.toMillis() + slotMinutes * 60_000
    );

    const nowMinus5 = getAdmin().firestore.Timestamp.fromMillis(Date.now() - 5 * 60_000);
    if (startAt < nowMinus5) {
      throw new functions.https.HttpsError('failed-precondition', 'Slot en pasado');
    }

    const slotId = formatSlotId(companyId, professionalId, startAt);
    const lockRef = getFirestore().doc(`locks/${slotId}`);
    const appointmentsCol = getFirestore().collection('appointments');
    const status: AppointmentStatus = context.auth ? (data.status === 'CONFIRMED' ? 'CONFIRMED' : 'REQUESTED') : 'REQUESTED';

    try {
      const availability = await isSlotAvailable({
        companyId,
        professionalId,
        startAt,
        endAt,
      });
      if (!availability.ok) {
        throw new functions.https.HttpsError('failed-precondition', availability.reason || 'SLOT_UNAVAILABLE');
      }

      const result = await getFirestore().runTransaction(async (tx) => {
        const lockSnap = await tx.get(lockRef);
        if (lockSnap.exists) {
          throw new functions.https.HttpsError('already-exists', 'SLOT_TAKEN');
        }

        tx.set(lockRef, {
          company_id: companyId,
          professional_id: professionalId,
          startAt,
          expiresAt: getAdmin().firestore.Timestamp.fromMillis(startAt.toMillis() + slotMinutes * 60_000),
          createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
          status: 'HELD',
        });

        const appointmentRef = appointmentsCol.doc();
        tx.set(appointmentRef, {
          company_id: companyId,
          professional_id: professionalId,
          service_id: serviceId,
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          notes: notes || null,
          startAt,
          endAt,
          status,
          source: context.auth ? 'DASHBOARD' : 'PUBLIC',
          createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        });

        return { appointmentId: appointmentRef.id, lockId: lockRef.id };
      });
      return result;
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) throw error;
      if (error.code === 6 || error.message?.includes('SLOT_TAKEN')) {
        throw new functions.https.HttpsError('already-exists', 'SLOT_TAKEN');
      }
      throw new functions.https.HttpsError('internal', error.message || 'Error creando cita');
    }
  });

/**
 * Callable: cancela una cita y libera el lock.
 */
export const cancelAppointment = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    const companyId = resolveCompanyId(data, context);
    const appointmentId = safeString(data.appointmentId, 1, 200);
    if (!appointmentId) throw new functions.https.HttpsError('invalid-argument', 'appointmentId requerido');

    const apptRef = getFirestore().doc(`appointments/${appointmentId}`);

    return getFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(apptRef);
      if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Cita no encontrada');
      const appt = snap.data();
      if (appt.company_id !== companyId) throw new functions.https.HttpsError('permission-denied', 'No autorizado');

      const start = appt.startAt as AdminNamespace.firestore.Timestamp | undefined;
      const professionalId = appt.professional_id as string | undefined;
      const oldLockId = start && professionalId ? formatSlotId(companyId, professionalId, start) : null;

      tx.update(apptRef, {
        status: 'CANCELLED',
        cancelledAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      });

      if (oldLockId) {
        tx.delete(getFirestore().doc(`locks/${oldLockId}`));
      }
      return { appointmentId };
    });
  });

/**
 * Callable: reprograma una cita con nuevo lock.
 */
export const rescheduleAppointment = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requiere inicio de sesión');
    const companyId = resolveCompanyId(data, context);
    const appointmentId = safeString(data.appointmentId, 1, 200);
    if (!appointmentId) throw new functions.https.HttpsError('invalid-argument', 'appointmentId requerido');

    const newProfessionalId = safeString(data.professionalId || data.professional_id, 1, 200);
    const newStartAt = toTimestamp(data.startAt, 'startAt');
    const slotMinutes = safeNumber(data.slotMinutes ?? 15, 5, 240) ?? 15;
    const newEndAt = data.endAt
      ? toTimestamp(data.endAt, 'endAt')
      : getAdmin().firestore.Timestamp.fromMillis(newStartAt.toMillis() + slotMinutes * 60_000);

    const apptRef = getFirestore().doc(`appointments/${appointmentId}`);
    const result = await getFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(apptRef);
      if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Cita no encontrada');
      const appt = snap.data();
      if (appt.company_id !== companyId) throw new functions.https.HttpsError('permission-denied', 'No autorizado');

      const currentProfessional = appt.professional_id as string;
      const professionalId = newProfessionalId || currentProfessional;
      const oldStart = appt.startAt as AdminNamespace.firestore.Timestamp | undefined;
      const oldLockId = oldStart ? formatSlotId(companyId, currentProfessional, oldStart) : null;

      const availability = await isSlotAvailable({
        companyId,
        professionalId,
        startAt: newStartAt,
        endAt: newEndAt,
      });
      if (!availability.ok) {
        throw new functions.https.HttpsError('failed-precondition', availability.reason || 'SLOT_UNAVAILABLE');
      }

      const newLockId = formatSlotId(companyId, professionalId, newStartAt);
      const newLockRef = getFirestore().doc(`locks/${newLockId}`);
      const lockSnap = await tx.get(newLockRef);
      if (lockSnap.exists) {
        throw new functions.https.HttpsError('already-exists', 'SLOT_TAKEN');
      }

      if (oldLockId) {
        tx.delete(getFirestore().doc(`locks/${oldLockId}`));
      }

      tx.set(newLockRef, {
        company_id: companyId,
        professional_id: professionalId,
        startAt: newStartAt,
        expiresAt: getAdmin().firestore.Timestamp.fromMillis(newStartAt.toMillis() + slotMinutes * 60_000),
        createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        status: 'HELD',
      });

      tx.update(apptRef, {
        professional_id: professionalId,
        startAt: newStartAt,
        endAt: newEndAt,
        status: appt.status === 'CANCELLED' ? 'CONFIRMED' : appt.status,
        rescheduledAt: getAdmin().firestore.FieldValue.serverTimestamp(),
        updatedAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      });

      return { appointmentId, lockId: newLockId };
    });

    return result;
  });

/**
 * Trigger: envía correo cuando se crea cita en estado REQUESTED.
 */
export const onAppointmentCreated = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || data.status !== 'REQUESTED') return;

    const appointmentId = context.params.appointmentId as string;
    const companyId = data.company_id as string;
    if (!companyId) return;

    const dedupeRef = getFirestore().doc(`appointmentEmailLogs/${context.eventId}`);
    const dedupeSnap = await dedupeRef.get();
    if (dedupeSnap.exists) return;

    const companyRef = getFirestore().doc(`companies/${companyId}`);
    const [companySnap, professionalSnap, serviceSnap] = await Promise.all([
      companyRef.get(),
      data.professional_id ? getFirestore().doc(`professionals/${data.professional_id}`).get() : null,
      data.service_id ? getFirestore().doc(`services/${data.service_id}`).get() : null,
    ]);

    const recipientSet = new Set<string>();

    // Prefer per-user notification settings (dashboard/settings/notifications)
    const notifSettingsSnap = await getFirestore()
      .collection('notification_settings')
      .where('company_id', '==', companyId)
      .where('email_notifications_enabled', '==', true)
      .limit(10)
      .get();

    notifSettingsSnap.docs.forEach((doc) => {
      const email = sanitizeEmail(doc.get('notification_email') || doc.get('user_email'));
      if (email) recipientSet.add(email);
    });

    // Legacy company-level notifications (kept for backward compatibility)
    const notifications = companySnap.get('notifications') || {};
    if (notifications.emailEnabled && notifications.toEmail) {
      const legacyEmail = sanitizeEmail(notifications.toEmail);
      if (legacyEmail) recipientSet.add(legacyEmail);
    }

    const recipients = Array.from(recipientSet);
    if (recipients.length === 0) {
      await dedupeRef.set({
        skipped: true,
        reason: 'notifications_disabled',
        createdAt: getAdmin().firestore.FieldValue.serverTimestamp(),
      });
      console.warn(
        'Appointment request without email recipients. Enable notifications at dashboard/settings/notifications',
        { companyId }
      );
      return;
    }

    // Obtener datos de la cita usando la estructura correcta
    const appointmentDate = data.appointment_date?.toDate 
      ? data.appointment_date.toDate() 
      : data.appointment_date instanceof getAdmin().firestore.Timestamp
      ? data.appointment_date.toDate()
      : new Date(data.appointment_date || Date.now());
    
    const startTime = data.start_time || 'N/D';
    const endTime = data.end_time || 'N/D';
    const clientName = data.client_name || 'N/D';
    const clientPhone = data.client_phone || 'N/D';
    const clientEmail = data.client_email || undefined;
    const notes = data.notes || undefined;
    
    const tz = companySnap.get('timezone') || 'America/Santiago';
    const dateFormatted = appointmentDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: tz,
    });
    
    const companyName = companySnap.get('name') || companyId;
    const serviceName = serviceSnap?.data()?.name || data.service_id || 'N/D';
    const professionalName = professionalSnap?.data()?.name || data.professional_id || 'Sin asignar';
    const dashboardUrl = 'https://www.pymerp.cl/dashboard/schedule';

    // Generar email HTML usando el template profesional
    const emailHtml = getAppointmentRequestEmailTemplate({
      clientName,
      clientPhone,
      clientEmail,
      serviceName,
      professionalName,
      date: dateFormatted,
      startTime,
      endTime,
      companyName,
      dashboardUrl,
      notes,
      language: 'es',
    });

    // Generar versión texto plano
    const emailText = `
Nueva solicitud de cita pendiente

Cliente: ${clientName}
Teléfono: ${clientPhone}${clientEmail ? `\nCorreo: ${clientEmail}` : ''}
Servicio: ${serviceName}
Profesional: ${professionalName}
Fecha: ${dateFormatted}
Horario: ${startTime} - ${endTime}
${notes ? `Notas: ${notes}` : ''}

Revisa y gestiona esta cita en tu dashboard:
${dashboardUrl}
    `.trim();

    ensureSendGrid();
    const msg = {
      to: recipients,
      from: notifications.fromEmail || 'ignacio@datakomerz.com',
      subject: `Nueva cita solicitada - ${companyName}`,
      text: emailText,
      html: emailHtml,
    };

    await getSendGrid().send(msg);
    await dedupeRef.set({ appointmentId, sent: true, createdAt: getAdmin().firestore.FieldValue.serverTimestamp() });
  });

/**
 * Limpieza de locks expirados (programado).
 */
export const cleanExpiredLocks = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    const now = getAdmin().firestore.Timestamp.now();
    const snap = await getFirestore()
      .collection('locks')
      .where('expiresAt', '<', now)
      .limit(100)
      .get();

    if (snap.empty) return null;
    const batch = getFirestore().batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`cleanExpiredLocks: removed ${snap.size} locks`);
    return null;
  });
