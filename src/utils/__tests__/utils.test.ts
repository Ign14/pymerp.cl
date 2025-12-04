import { describe, test, expect } from 'vitest';
import { generateSlug } from '../slug';
import { generateRandomPassword } from '../password';

describe('Utils - Slug', () => {
  test('convierte texto con acentos a slug sin acentos', () => {
    expect(generateSlug('Mi Negocio Café')).toBe('mi-negocio-cafe');
    expect(generateSlug('Restaurante El Ñandú')).toBe('restaurante-el-nandu');
  });

  test('elimina espacios y caracteres especiales', () => {
    expect(generateSlug('  Tienda 123!!!  ')).toBe('tienda-123');
    expect(generateSlug('Producto @#$ Especial')).toBe('producto-especial');
  });

  test('convierte a minúsculas', () => {
    expect(generateSlug('MAYÚSCULAS')).toBe('mayusculas');
    expect(generateSlug('MixTO De CaSoS')).toBe('mixto-de-casos');
  });

  test('maneja strings vacíos', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
  });

  test('reemplaza múltiples guiones por uno solo', () => {
    expect(generateSlug('palabra---con---guiones')).toBe('palabra-con-guiones');
  });
});

describe('Utils - Password', () => {
  test('genera contraseña con longitud por defecto (12)', () => {
    const password = generateRandomPassword();
    expect(password).toHaveLength(12);
  });

  test('genera contraseña con longitud personalizada', () => {
    const password16 = generateRandomPassword(16);
    expect(password16).toHaveLength(16);
    
    const password8 = generateRandomPassword(8);
    expect(password8).toHaveLength(8);
  });

  test('genera contraseñas únicas', () => {
    const password1 = generateRandomPassword();
    const password2 = generateRandomPassword();
    expect(password1).not.toBe(password2);
  });

  test('contiene solo caracteres válidos', () => {
    const password = generateRandomPassword(100);
    const validChars = /^[a-zA-Z0-9!@#$%^&*]+$/;
    expect(password).toMatch(validChars);
  });

  test('incluye variedad de caracteres', () => {
    // Generar muchas contraseñas y verificar que hay variedad
    const passwords = Array.from({ length: 100 }, () => generateRandomPassword(20));
    const allChars = passwords.join('');
    
    // Verificar que hay al menos algunos de cada tipo
    expect(allChars).toMatch(/[a-z]/); // minúsculas
    expect(allChars).toMatch(/[A-Z]/); // mayúsculas
    expect(allChars).toMatch(/[0-9]/); // números
    expect(allChars).toMatch(/[!@#$%^&*]/); // especiales
  });
});

export {};
