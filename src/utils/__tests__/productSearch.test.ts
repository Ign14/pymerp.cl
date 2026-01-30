import { describe, test, expect } from 'vitest';
import { buildSearchText, filterProductsBySearch } from '../productSearch';
import type { Product } from '../../types';

describe('productSearch', () => {
  const createMockProduct = (
    name: string,
    description?: string,
    tags?: string[],
    status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE'
  ): Product => ({
    id: `product-${name.toLowerCase().replace(/\s+/g, '-')}`,
    company_id: 'test-company',
    name,
    description: description || '',
    price: 10000,
    image_url: 'https://example.com/image.jpg',
    status,
    tags: tags || [],
  });

  describe('buildSearchText', () => {
    test('debe combinar nombre, descripción y tags en lowercase', () => {
      const product = createMockProduct(
        'Pizza Margarita',
        'Pizza clásica italiana',
        ['pizza', 'italiana', 'queso']
      );
      const result = buildSearchText(product);
      expect(result).toBe('pizza margarita pizza clásica italiana pizza italiana queso');
    });

    test('debe manejar productos sin descripción ni tags', () => {
      const product = createMockProduct('Hamburguesa');
      const result = buildSearchText(product);
      expect(result).toBe('hamburguesa  ');
    });

    test('debe convertir a lowercase', () => {
      const product = createMockProduct('PIZZA PEPPERONI', 'PIZZA CON PEPPERONI', ['PIZZA', 'PEPPERONI']);
      const result = buildSearchText(product);
      expect(result).toBe('pizza pepperoni pizza con pepperoni pizza pepperoni');
    });

    test('debe unir tags con espacios', () => {
      const product = createMockProduct('Producto Test', 'Descripción', ['tag1', 'tag2', 'tag3']);
      const result = buildSearchText(product);
      expect(result).toContain('tag1 tag2 tag3');
    });
  });

  describe('filterProductsBySearch', () => {
    const products: Product[] = [
      createMockProduct('Pizza Margarita', 'Pizza clásica italiana', ['pizza', 'italiana']),
      createMockProduct('Hamburguesa Clásica', 'Hamburguesa con papas', ['hamburguesa', 'comida rapida']),
      createMockProduct('Coca Cola', 'Bebida gaseosa', ['bebida', 'refresco']),
      createMockProduct('Pizza Pepperoni', 'Pizza con pepperoni', ['pizza', 'pepperoni']),
      createMockProduct('Ensalada César', 'Ensalada fresca', ['ensalada', 'saludable']),
    ];

    test('debe retornar todos los productos si el término está vacío', () => {
      const result = filterProductsBySearch(products, '');
      expect(result).toEqual(products);
    });

    test('debe retornar todos los productos si el término solo tiene espacios', () => {
      const result = filterProductsBySearch(products, '   ');
      expect(result).toEqual(products);
    });

    test('debe filtrar por nombre (case-insensitive)', () => {
      const result = filterProductsBySearch(products, 'pizza');
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.name)).toContain('Pizza Margarita');
      expect(result.map((p) => p.name)).toContain('Pizza Pepperoni');
    });

    test('debe filtrar por descripción (case-insensitive)', () => {
      const result = filterProductsBySearch(products, 'fresca');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ensalada César');
    });

    test('debe filtrar por tags', () => {
      const result = filterProductsBySearch(products, 'comida rapida');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hamburguesa Clásica');
    });

    test('debe filtrar por nombre, descripción y tags combinados', () => {
      const result = filterProductsBySearch(products, 'italiana');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pizza Margarita');
    });

    test('debe ser case-insensitive', () => {
      const result1 = filterProductsBySearch(products, 'PIZZA');
      const result2 = filterProductsBySearch(products, 'pizza');
      const result3 = filterProductsBySearch(products, 'PiZzA');
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    test('debe manejar búsquedas parciales', () => {
      const result = filterProductsBySearch(products, 'hamburg');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hamburguesa Clásica');
    });

    test('debe retornar array vacío si no hay coincidencias', () => {
      const result = filterProductsBySearch(products, 'xyz123');
      expect(result).toEqual([]);
    });

    test('debe trim espacios en el término de búsqueda', () => {
      const result1 = filterProductsBySearch(products, 'pizza');
      const result2 = filterProductsBySearch(products, '  pizza  ');
      expect(result1).toEqual(result2);
    });

    test('debe filtrar correctamente con múltiples palabras', () => {
      const result = filterProductsBySearch(products, 'pizza clásica');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pizza Margarita');
    });

    test('debe manejar productos sin tags', () => {
      const productsWithoutTags = [
        createMockProduct('Producto Sin Tags', 'Descripción sin tags'),
      ];
      const result = filterProductsBySearch(productsWithoutTags, 'producto');
      expect(result).toHaveLength(1);
    });
  });
});
