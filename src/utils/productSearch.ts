/**
 * Utilidades para búsqueda de productos en cliente
 * 
 * Implementa funciones para construir texto de búsqueda y filtrar productos
 * basándose en nombre, descripción y tags.
 */

import type { Product } from '../types';

/**
 * Construye un texto de búsqueda combinando nombre, descripción y tags de un producto
 * @param product - El producto a procesar
 * @returns Texto combinado en lowercase para búsqueda
 */
export function buildSearchText(product: Product): string {
  const tags = (product.tags || []).join(' ');
  return `${product.name} ${product.description || ''} ${tags}`.toLowerCase();
}

/**
 * Filtra productos basándose en un término de búsqueda
 * Realiza búsqueda case-insensitive en nombre, descripción y tags
 * @param products - Array de productos a filtrar
 * @param searchTerm - Término de búsqueda
 * @returns Array filtrado de productos que coinciden con el término
 */
export function filterProductsBySearch(
  products: Product[],
  searchTerm: string
): Product[] {
  if (!searchTerm.trim()) return products;
  const normalized = searchTerm.trim().toLowerCase();
  return products.filter((product) =>
    buildSearchText(product).includes(normalized)
  );
}
