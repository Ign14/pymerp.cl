/**
 * Genera un slug URL-friendly a partir de un texto
 * 
 * Convierte texto a minúsculas, normaliza caracteres unicode (elimina acentos),
 * reemplaza caracteres no alfanuméricos por guiones y limpia guiones al inicio/final.
 * 
 * @param text - Texto a convertir en slug
 * @returns Slug generado (formato: palabras-separadas-por-guiones)
 * 
 * @example
 * ```typescript
 * generateSlug('Mi Negocio Café'); // 'mi-negocio-cafe'
 * generateSlug('Restaurante El Ñandú'); // 'restaurante-el-nandu'
 * generateSlug('  Tienda 123!!!  '); // 'tienda-123'
 * ```
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

