/**
 * Utilidades para búsqueda de servicios en cliente
 * 
 * Implementa funciones para construir texto de búsqueda y filtrar servicios
 * basándose en nombre y descripción.
 */

import type { Service } from '../types';

/**
 * Construye un texto de búsqueda combinando nombre y descripción de un servicio
 * @param service - El servicio a procesar
 * @returns Texto combinado en lowercase para búsqueda
 */
export function buildSearchText(service: Service): string {
  return `${service.name} ${service.description || ''}`.toLowerCase();
}

/**
 * Filtra servicios basándose en un término de búsqueda
 * Realiza búsqueda case-insensitive en nombre y descripción
 * @param services - Array de servicios a filtrar
 * @param searchTerm - Término de búsqueda
 * @returns Array filtrado de servicios que coinciden con el término
 */
export function filterServicesBySearch(
  services: Service[],
  searchTerm: string
): Service[] {
  if (!searchTerm.trim()) return services;
  const normalized = searchTerm.trim().toLowerCase();
  return services.filter((service) =>
    buildSearchText(service).includes(normalized)
  );
}
