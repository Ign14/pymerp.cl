/**
 * Security Utilities
 * 
 * Funciones para prevenir vulnerabilidades comunes
 */

/**
 * Sanitizar input de usuario para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizar HTML permitiendo solo tags seguros
 */
export function sanitizeHTML(html: string, allowedTags: string[] = []): string {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Si no se permiten tags, remover todos
  if (allowedTags.length === 0) {
    return div.textContent || '';
  }
  
  // Permitir solo tags específicos
  const elements = div.querySelectorAll('*');
  elements.forEach(el => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.replaceWith(el.textContent || '');
    }
  });
  
  return div.innerHTML;
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar URL segura (solo http/https)
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validar número de teléfono (formato chileno)
 */
export function isValidPhone(phone: string): boolean {
  // Remover caracteres no numéricos
  const digits = phone.replace(/\D/g, '');
  
  // Chile: 9 dígitos (569XXXXXXXX formato internacional)
  return digits.length === 9 || digits.length === 11;
}

/**
 * Sanitizar número de teléfono
 */
export function sanitizePhone(phone: string): string {
  // Solo dígitos
  return phone.replace(/\D/g, '');
}

/**
 * Prevenir Path Traversal
 */
export function sanitizePath(path: string): string {
  // Remover .. y otros caracteres peligrosos
  return path
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '');
}

/**
 * Generar token CSRF
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verificar token CSRF
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}

/**
 * Rate limiting simple (client-side)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minuto
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filtrar intentos dentro de la ventana de tiempo
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Agregar nuevo intento
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Validar y sanitizar file upload
 */
export function validateFileUpload(file: File, options: {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  } = options;
  
  // Verificar tamaño
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo ${maxSizeMB}MB`
    };
  }
  
  // Verificar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`
    };
  }
  
  // Verificar extensión
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Extensión no permitida. Permitidas: ${allowedExtensions.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Prevenir clickjacking
 */
export function preventClickjacking(): void {
  // Verificar que no estamos en iframe
  if (window.self !== window.top) {
    // Romper fuera del iframe
    try {
      window.top!.location.href = window.self.location.href;
    } catch (e) {
      // Si falla por CORS, al menos loguear
      console.warn('Clickjacking attempt detected');
    }
  }
}

/**
 * Content Security Policy helper
 */
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.sentry.io",
    "frame-src 'self' https://www.google.com https://www.youtube.com https://youtube.com",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Secure localStorage wrapper
 */
export const secureStorage = {
  setItem(key: string, value: any): void {
    try {
      // Encriptar datos sensibles (básico - usar crypto library en producción)
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  },
  
  getItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Error leyendo de localStorage:', error);
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
  
  clear(): void {
    localStorage.clear();
  }
};

/**
 * Validar datos de formulario
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const rule = rules[field];
    
    if (rule.required && !value) {
      errors[field] = 'Campo requerido';
      return;
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `Mínimo ${rule.minLength} caracteres`;
      return;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `Máximo ${rule.maxLength} caracteres`;
      return;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = 'Formato inválido';
      return;
    }
    
    if (rule.custom && !rule.custom(value)) {
      errors[field] = 'Valor inválido';
      return;
    }
  });
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

