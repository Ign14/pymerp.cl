/**
 * Lightweight validation and sanitization helpers for service layer.
 * Keep these side-effect free so they can be reused in Cloud Functions tests.
 */

const SCRIPT_TAG_REGEX = /<\s*\/?script[^>]*>.*?<\s*\/\s*script\s*>/gis;
const SCRIPT_OPEN_CLOSE_REGEX = /<\s*\/?script[^>]*>/gi;

/**
 * Remove script tags and trim whitespace. Does not attempt full HTML sanitization
 * (server-side should still sanitize/validate).
 */
export function sanitizeText(input: string, maxLength = 500): string {
  // Remove full script blocks, then any stray opening/closing tags
  const withoutScripts = input.replace(SCRIPT_TAG_REGEX, '').replace(SCRIPT_OPEN_CLOSE_REGEX, '');
  const cleaned = withoutScripts.trim();
  return cleaned.slice(0, maxLength);
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone?: string | null): boolean {
  if (!phone) return false;
  return /^\+?[\d\s\-()]{6,20}$/.test(phone.trim());
}

export function assertCompanyScope(companyId?: string): string {
  if (!companyId) {
    throw new Error('company_id is required for multi-tenant operations');
  }
  return companyId;
}

export function coerceOptional<T>(value: T | undefined | null): T | undefined {
  return value ?? undefined;
}
