import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { AppError, ErrorType } from './errorHandler';
import type { NotificationSettings } from '../types';
import { assertCompanyScope, isValidEmail, coerceOptional } from './validation';

/**
 * Service for managing notification settings
 * Multi-tenant: All operations filter by company_id
 */

// ==================== GET NOTIFICATION SETTINGS ====================

/**
 * Get notification settings for a specific user in a company
 * @param userId - The user ID
 * @param companyId - The company ID (multi-tenant filter)
 * @returns Promise with notification settings or null if not found
 */
export const getNotificationSettings = async (
  userId: string,
  companyId: string
): Promise<NotificationSettings | null> => {
  const scopedCompany = assertCompanyScope(companyId);

  const q = query(
    collection(db, 'notification_settings'),
    where('user_id', '==', userId),
    where('company_id', '==', scopedCompany)
  );

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      user_id: data.user_id,
      company_id: data.company_id,
      email_notifications_enabled: data.email_notifications_enabled ?? false,
      notification_email: data.notification_email,
      created_at: data.created_at?.toDate?.() || new Date(),
      updated_at: data.updated_at?.toDate?.() || new Date(),
    } as NotificationSettings;
  } catch (error: any) {
    // Si las reglas no permiten leer (p. ej., usuario sin permisos), devolvemos null en lugar de lanzar
    if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
      try {
        const callable = httpsCallable(functions, 'getNotificationSettingsSafe');
        const result = await callable({ companyId, userId });
        const data: any = result.data;
        if (!data) return null;
        return {
          id: data.id,
          user_id: data.user_id,
          company_id: data.company_id,
          email_notifications_enabled: data.email_notifications_enabled ?? false,
          notification_email: data.notification_email || undefined,
          created_at: data.created_at?.toDate?.() || new Date(),
          updated_at: data.updated_at?.toDate?.() || new Date(),
        } as NotificationSettings;
      } catch (fnError) {
        console.warn('No se pudo leer notification_settings ni vía callable', fnError);
        return null;
      }
    }
    throw error;
  }
};

// ==================== SET EMAIL NOTIFICATIONS ====================

/**
 * Enable or disable email notifications for a user
 * Creates settings document if it doesn't exist
 * 
 * @param userId - The user ID
 * @param companyId - The company ID (multi-tenant filter)
 * @param enabled - Whether email notifications should be enabled
 * @param toEmail - Optional: Email address to send notifications to (defaults to user's email)
 */
export const setEmailNotificationsEnabled = async (
  userId: string,
  companyId: string,
  enabled: boolean,
  toEmail?: string
): Promise<void> => {
  const scopedCompany = assertCompanyScope(companyId);
  const sanitizedEmail = coerceOptional(toEmail?.trim());

  if (sanitizedEmail && !isValidEmail(sanitizedEmail)) {
    throw new AppError('El correo de notificación no es válido.', ErrorType.VALIDATION);
  }

  try {
    const existing = await getNotificationSettings(userId, scopedCompany);
    
    if (existing) {
      const docRef = doc(db, 'notification_settings', existing.id);
      await updateDoc(docRef, {
        email_notifications_enabled: enabled,
        notification_email: sanitizedEmail || existing.notification_email,
        updated_at: Timestamp.now(),
      });
    } else {
      await addDoc(collection(db, 'notification_settings'), {
        user_id: userId,
        company_id: scopedCompany,
        email_notifications_enabled: enabled,
        notification_email: sanitizedEmail,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
    }
  } catch (error: any) {
    if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
      try {
        const callable = httpsCallable(functions, 'setNotificationSettingsSafe');
        await callable({
          companyId: scopedCompany,
          enabled,
          notificationEmail: sanitizedEmail,
        });
        return;
      } catch (fnError: any) {
        throw new AppError(
          'No tienes permisos para editar las notificaciones de la empresa. Solicita al dueño de la URL que las active.',
          ErrorType.AUTHORIZATION,
          { original: error?.code, callableError: fnError?.code }
        );
      }
    }
    throw error;
  }
};

/**
 * Example usage in component:
 * 
 * ```tsx
 * import { getNotificationSettings, setEmailNotificationsEnabled } from '@/services/notifications';
 * import { useAuth } from '@/contexts/AuthContext';
 * import { useErrorHandler } from '@/hooks/useErrorHandler';
 * 
 * function NotificationsSettings() {
 *   const { firestoreUser } = useAuth();
 *   const { handleAsyncError } = useErrorHandler();
 *   const [settings, setSettings] = useState<NotificationSettings | null>(null);
 * 
 *   useEffect(() => {
 *     if (firestoreUser?.id && firestoreUser?.company_id) {
 *       loadSettings();
 *     }
 *   }, [firestoreUser]);
 * 
 *   const loadSettings = async () => {
 *     const data = await getNotificationSettings(
 *       firestoreUser!.id,
 *       firestoreUser!.company_id!
 *     );
 *     setSettings(data);
 *   };
 * 
 *   const handleToggle = async (enabled: boolean) => {
 *     await handleAsyncError(async () => {
 *       await setEmailNotificationsEnabled(
 *         firestoreUser!.id,
 *         firestoreUser!.company_id!,
 *         enabled,
 *         firestoreUser!.email
 *       );
 *       await loadSettings();
 *       toast.success('Settings updated');
 *     });
 *   };
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
