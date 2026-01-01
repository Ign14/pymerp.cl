import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  isValidEmail,
  isValidPhone,
  assertCompanyScope,
  coerceOptional,
} from '../validation';

describe('validation helpers', () => {
  it('sanitizes script tags and trims text', () => {
    const dirty = '  <script>alert(1)</script>Hello  ';
    expect(sanitizeText(dirty)).toBe('Hello');
  });

  it('validates email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('bad-email')).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it('validates phone format', () => {
    expect(isValidPhone('+123 456 789')).toBe(true);
    expect(isValidPhone('123-456')).toBe(true);
    expect(isValidPhone('abc123')).toBe(false);
  });

  it('asserts company scope', () => {
    expect(assertCompanyScope('company-1')).toBe('company-1');
    expect(() => assertCompanyScope('')).toThrow();
  });

  it('coerces optional values', () => {
    expect(coerceOptional(null)).toBeUndefined();
    expect(coerceOptional('value')).toBe('value');
  });
});
