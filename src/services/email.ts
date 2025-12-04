// Removed unused imports - now using fetch for HTTP functions
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Obtiene la URL de la función HTTP
 */
const getFunctionUrl = (functionName: string): string => {
  const { projectId, functionsRegion } = env.firebase;
  return `https://${functionsRegion}-${projectId}.cloudfunctions.net/${functionName}`;
};

/**
 * Envía un email de notificación cuando se crea una nueva solicitud de acceso
 * Usa HTTP function para evitar problemas de permisos
 */
export const sendAccessRequestEmail = async (requestData: {
  full_name: string;
  email: string;
  business_name: string;
  whatsapp: string;
  plan?: string;
  created_at: Date;
  language?: 'es' | 'en';
}) => {
  try {
    const url = getFunctionUrl('sendAccessRequestEmailHttp');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        created_at: requestData.created_at.toISOString(),
        language: requestData.language || 'es',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      logger.error('❌ Error HTTP:', response.status, errorData);
      logger.warn('⚠️ Email no enviado:', errorData.error || errorData.message || 'Error desconocido');
      return;
    }

    const result = await response.json();

    if (result.success) {
      logger.success('Email de solicitud de acceso enviado correctamente');
    } else {
      logger.warn('⚠️ Email no enviado:', result.message || result.error);
      if (result.details) {
        logger.error('Detalles del error:', result.details);
      }
    }
  } catch (error: any) {
    // Si las funciones no están desplegadas o hay un error, solo logueamos
    // pero no fallamos la creación de la solicitud
    logger.error('Error completo enviando email:', error);
    logger.error('Mensaje de error:', error.message);
  }
};

/**
 * Envía un email al usuario cuando su cuenta es creada/aprobada
 * Usa HTTP function para evitar problemas de permisos
 */
export const sendUserCreationEmail = async (email: string, password: string, loginUrl: string, language: 'es' | 'en' = 'es') => {
  try {
    const url = getFunctionUrl('sendUserCreationEmailHttp');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        loginUrl,
        language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      logger.error('❌ Error HTTP:', response.status, errorData);
      logger.warn('⚠️ Email no enviado:', errorData.error || errorData.message || 'Error desconocido');
      return;
    }

    const result = await response.json();

    if (result.success) {
      logger.success('Email de creación de usuario enviado correctamente a:', email);
    } else {
      logger.warn('⚠️ Email no enviado:', result.message || result.error);
      if (result.details) {
        logger.error('Detalles del error:', result.details);
      }
    }
  } catch (error: any) {
    // Si las funciones no están desplegadas o hay un error, solo logueamos
    // pero no fallamos la creación del usuario
    logger.error('Error completo enviando email:', error);
    logger.error('Mensaje de error:', error.message);
  }
};
