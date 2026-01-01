/**
 * Error mapping helpers for service layer
 * Maps Firebase/Cloud Function error codes to i18n translation keys
 */

export enum ServiceErrorCode {
  // Professional errors
  PRO_LIMIT_REACHED = 'PRO_LIMIT_REACHED',
  
  // Appointment errors
  SLOT_TAKEN = 'SLOT_TAKEN',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  
  // Form validation errors
  INVALID_EMAIL = 'invalid-email',
  INVALID_PHONE = 'invalid-phone',
  INVALID_RUT = 'invalid-rut',
  REQUIRED_FIELD = 'required-field',
  FIELD_TOO_SHORT = 'field-too-short',
  FIELD_TOO_LONG = 'field-too-long',
  INVALID_URL = 'invalid-url',
  
  // General errors
  PERMISSION_DENIED = 'permission-denied',
  NOT_FOUND = 'not-found',
  UNAUTHENTICATED = 'unauthenticated',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  DEADLINE_EXCEEDED = 'deadline-exceeded',
  UNAVAILABLE = 'unavailable',
}

/**
 * Map error code to i18n translation key
 * Translation keys should exist in namespace 'errors'
 * 
 * @param errorCode - The error code from Firebase or Cloud Function
 * @returns i18n translation key for the error message
 */
export const mapErrorToI18nKey = (errorCode: string): string => {
  const errorMap: Record<string, string> = {
    // Professionals
    [ServiceErrorCode.PRO_LIMIT_REACHED]: 'errors.proLimitReached',
    
    // Appointments
    [ServiceErrorCode.SLOT_TAKEN]: 'errors.slotTaken',
    [ServiceErrorCode.SLOT_UNAVAILABLE]: 'errors.slotUnavailable',
    [ServiceErrorCode.INVALID_TIME_RANGE]: 'errors.invalidTimeRange',
    
    // Form validation
    [ServiceErrorCode.INVALID_EMAIL]: 'errors.invalidEmail',
    [ServiceErrorCode.INVALID_PHONE]: 'errors.invalidPhone',
    [ServiceErrorCode.INVALID_RUT]: 'errors.invalidRut',
    [ServiceErrorCode.REQUIRED_FIELD]: 'errors.requiredField',
    [ServiceErrorCode.FIELD_TOO_SHORT]: 'errors.fieldTooShort',
    [ServiceErrorCode.FIELD_TOO_LONG]: 'errors.fieldTooLong',
    [ServiceErrorCode.INVALID_URL]: 'errors.invalidUrl',
    
    // Firebase errors
    [ServiceErrorCode.PERMISSION_DENIED]: 'errors.permissionDenied',
    [ServiceErrorCode.NOT_FOUND]: 'errors.notFound',
    [ServiceErrorCode.UNAUTHENTICATED]: 'errors.unauthenticated',
    [ServiceErrorCode.RESOURCE_EXHAUSTED]: 'errors.resourceExhausted',
    [ServiceErrorCode.DEADLINE_EXCEEDED]: 'errors.tryAgain',
    [ServiceErrorCode.UNAVAILABLE]: 'errors.tryAgain',
  };

  return errorMap[errorCode] || 'errors.unknownError';
};

/**
 * Get user-friendly error message from error code
 * Uses i18n for localized messages
 * 
 * @param errorCode - The error code
 * @param t - i18next translation function
 * @returns Localized error message
 */
export const getErrorMessage = (
  errorCode: string,
  t: (key: string) => string
): string => {
  const i18nKey = mapErrorToI18nKey(errorCode);
  return t(i18nKey);
};

/**
 * Extract error code from Error object
 * Handles both Firebase errors and custom errors
 * 
 * @param error - Error object
 * @returns Error code string or 'unknown'
 */
export const extractErrorCode = (error: any): string => {
  if (!error) return 'unknown';
  
  // Firebase Functions error format
  if (error.code) return error.code;
  
  // Firestore error format
  if (error.name === 'FirebaseError' && error.code) return error.code;
  
  // Custom error with code property
  if (typeof error === 'object' && 'code' in error) return error.code;
  
  return 'unknown';
};

/**
 * Check if error is a specific service error
 * 
 * @param error - Error object
 * @param code - Service error code to check
 * @returns True if error matches the code
 */
export const isServiceError = (error: any, code: ServiceErrorCode): boolean => {
  return extractErrorCode(error) === code;
};

/**
 * Form validation helpers
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, error: ServiceErrorCode.REQUIRED_FIELD };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: ServiceErrorCode.INVALID_EMAIL };
  }
  
  return { isValid: true };
};

/**
 * Validate phone format (Chilean format)
 */
export const validatePhone = (phone: string, required: boolean = false): ValidationResult => {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: ServiceErrorCode.REQUIRED_FIELD };
    }
    return { isValid: true }; // Optional field
  }
  
  const phoneRegex = /^\+?[\d\s-()]+$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: ServiceErrorCode.INVALID_PHONE };
  }
  
  return { isValid: true };
};

/**
 * Validate Chilean RUT format
 */
export const validateRut = (rut: string, required: boolean = true): ValidationResult => {
  if (!rut || !rut.trim()) {
    if (required) {
      return { isValid: false, error: ServiceErrorCode.REQUIRED_FIELD };
    }
    return { isValid: true };
  }
  
  // Basic RUT validation (can be enhanced)
  const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/;
  if (!rutRegex.test(rut)) {
    return { isValid: false, error: ServiceErrorCode.INVALID_RUT };
  }
  
  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: ServiceErrorCode.REQUIRED_FIELD };
  }
  return { isValid: true };
};

/**
 * Validate field length
 */
export const validateLength = (
  value: string,
  min?: number,
  max?: number
): ValidationResult => {
  const length = value ? value.trim().length : 0;
  
  if (min !== undefined && length < min) {
    return { isValid: false, error: ServiceErrorCode.FIELD_TOO_SHORT };
  }
  
  if (max !== undefined && length > max) {
    return { isValid: false, error: ServiceErrorCode.FIELD_TOO_LONG };
  }
  
  return { isValid: true };
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string, required: boolean = false): ValidationResult => {
  if (!url || !url.trim()) {
    if (required) {
      return { isValid: false, error: ServiceErrorCode.REQUIRED_FIELD };
    }
    return { isValid: true };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: ServiceErrorCode.INVALID_URL };
  }
};

/**
 * Validate multiple fields at once
 * Returns a record of field errors
 */
export const validateFields = (
  fields: Record<string, { value: string; validators: ((value: string) => ValidationResult)[] }>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(fields).forEach(([fieldName, { value, validators }]) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return errors;
};

/**
 * Example usage in component:
 * 
 * ```tsx
 * import { createProfessional } from '@/services/professionals';
 * import { isServiceError, ServiceErrorCode, getErrorMessage } from '@/services/errorHelpers';
 * import { useTranslation } from 'react-i18next';
 * import { useErrorHandler } from '@/hooks/useErrorHandler';
 * 
 * function ProfessionalForm() {
 *   const { t } = useTranslation();
 *   const { handleAsyncError } = useErrorHandler();
 * 
 *   const handleSubmit = async (data) => {
 *     try {
 *       await createProfessional({ companyId, ...data });
 *       toast.success(t('professionals.created'));
 *     } catch (error) {
 *       // Custom handling for specific errors
 *       if (isServiceError(error, ServiceErrorCode.PRO_LIMIT_REACHED)) {
 *         toast.error(t('errors.proLimitReached'));
 *         navigate('/features'); // Upgrade subscription
 *         return;
 *       }
 *       
 *       // Generic error handling with i18n
 *       const message = getErrorMessage(extractErrorCode(error), t);
 *       toast.error(message);
 *     }
 *   };
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
