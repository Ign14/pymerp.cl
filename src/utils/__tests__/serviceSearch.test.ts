import { describe, test, expect } from 'vitest';
import { buildSearchText, filterServicesBySearch } from '../serviceSearch';
import type { Service } from '../../types';

describe('serviceSearch', () => {
  const createMockService = (
    name: string,
    description?: string,
    status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE'
  ): Service => ({
    id: `service-${name.toLowerCase().replace(/\s+/g, '-')}`,
    company_id: 'test-company',
    name,
    description: description || '',
    price: 10000,
    image_url: 'https://example.com/image.jpg',
    estimated_duration_minutes: 30,
    status,
  });

  describe('buildSearchText', () => {
    test('debe combinar nombre y descripción en lowercase', () => {
      const service = createMockService('Corte de Cabello', 'Corte clásico y moderno');
      const result = buildSearchText(service);
      expect(result).toBe('corte de cabello corte clásico y moderno');
    });

    test('debe manejar servicios sin descripción', () => {
      const service = createMockService('Barba Completa');
      const result = buildSearchText(service);
      expect(result).toBe('barba completa ');
    });

    test('debe convertir a lowercase', () => {
      const service = createMockService('TINTE PARA CABELLO', 'COLORACIÓN PROFESIONAL');
      const result = buildSearchText(service);
      expect(result).toBe('tinte para cabello coloración profesional');
    });

    test('debe manejar strings vacíos', () => {
      const service = createMockService('');
      const result = buildSearchText(service);
      expect(result).toBe(' ');
    });
  });

  describe('filterServicesBySearch', () => {
    const services: Service[] = [
      createMockService('Corte de Cabello', 'Corte clásico y moderno'),
      createMockService('Barba Completa', 'Arreglo de barba completa'),
      createMockService('Tinte para Cabello', 'Coloración profesional'),
      createMockService('Corte + Barba', 'Combo completo'),
      createMockService('Tratamiento Capilar', 'Hidratación y nutrición'),
    ];

    test('debe retornar todos los servicios si el término está vacío', () => {
      const result = filterServicesBySearch(services, '');
      expect(result).toEqual(services);
    });

    test('debe retornar todos los servicios si el término solo tiene espacios', () => {
      const result = filterServicesBySearch(services, '   ');
      expect(result).toEqual(services);
    });

    test('debe filtrar por nombre (case-insensitive)', () => {
      const result = filterServicesBySearch(services, 'corte');
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.name)).toContain('Corte de Cabello');
      expect(result.map((s) => s.name)).toContain('Corte + Barba');
    });

    test('debe filtrar por descripción (case-insensitive)', () => {
      const result = filterServicesBySearch(services, 'profesional');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tinte para Cabello');
    });

    test('debe filtrar por nombre y descripción', () => {
      const result = filterServicesBySearch(services, 'barba');
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.name)).toContain('Barba Completa');
      expect(result.map((s) => s.name)).toContain('Corte + Barba');
    });

    test('debe ser case-insensitive', () => {
      const result1 = filterServicesBySearch(services, 'CORTE');
      const result2 = filterServicesBySearch(services, 'corte');
      const result3 = filterServicesBySearch(services, 'CoRtE');
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    test('debe manejar búsquedas parciales', () => {
      const result = filterServicesBySearch(services, 'tinte');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tinte para Cabello');
    });

    test('debe retornar array vacío si no hay coincidencias', () => {
      const result = filterServicesBySearch(services, 'xyz123');
      expect(result).toEqual([]);
    });

    test('debe trim espacios en el término de búsqueda', () => {
      const result1 = filterServicesBySearch(services, 'corte');
      const result2 = filterServicesBySearch(services, '  corte  ');
      expect(result1).toEqual(result2);
    });

    test('debe filtrar correctamente con múltiples palabras (busca coincidencias parciales)', () => {
      // La función busca el término completo, no palabras individuales
      const result = filterServicesBySearch(services, 'corte de cabello');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Corte de Cabello');
    });
  });
});
