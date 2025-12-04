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

