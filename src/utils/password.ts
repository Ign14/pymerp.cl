/**
 * Genera una contraseña aleatoria segura
 * 
 * Utiliza un conjunto de caracteres que incluye letras (mayúsculas y minúsculas),
 * números y caracteres especiales para crear una contraseña fuerte.
 * 
 * @param length - Longitud de la contraseña a generar (default: 12)
 * @returns Contraseña aleatoria con caracteres alfanuméricos y especiales
 * 
 * @example
 * ```typescript
 * const password = generateRandomPassword(); // 'aB3$xY9@kL2m' (12 chars)
 * const longPassword = generateRandomPassword(16); // 'mN5!pQ8@rS4$tU7%' (16 chars)
 * ```
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const MINIMARKET_HASH_SALT = 'pymerp_minimarket_access_v1';

/** Hash para cuentas de acceso Minimarket; no persistir contraseña en plano. */
export async function hashForMinimarketAccess(password: string): Promise<string> {
  const data = new TextEncoder().encode(MINIMARKET_HASH_SALT + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

