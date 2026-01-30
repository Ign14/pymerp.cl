import { describe, it, expect } from 'vitest';
import { resolvePublicLayout, type ResolvedPublicLayout } from '../publicPage';
import type { Company } from '../../types';
import { BusinessType } from '../../types';

describe('resolvePublicLayout', () => {
  const createMockCompany = (
    categoryId: string | null = 'restaurantes_comida_rapida',
    publicLayoutVariant?: string,
    businessType: BusinessType = BusinessType.PRODUCTS,
    slug?: string
  ): Company => ({
    id: 'test-company-1',
    name: 'Test Company',
    slug: slug || 'test-company',
    category_id: categoryId,
    business_type: businessType,
    public_layout_variant: publicLayoutVariant as any,
    created_at: new Date(),
    updated_at: new Date(),
  } as Company);

  it('debe retornar el mismo layout para el mismo company_id aunque cambie el slug', () => {
    // Validar que el slug NO afecta el layout
    const company1 = createMockCompany('restaurantes_comida_rapida', undefined, BusinessType.PRODUCTS, 'slug-1');
    const company2 = createMockCompany('restaurantes_comida_rapida', undefined, BusinessType.PRODUCTS, 'slug-2');
    const company3 = createMockCompany('restaurantes_comida_rapida', undefined, BusinessType.PRODUCTS, 'slug-3');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Mismo category_id debe producir mismo layout key (independiente del slug)
    expect(layout1.key).toBe(layout2.key);
    expect(layout2.key).toBe(layout3.key);
    expect(layout1.categoryId).toBe(layout2.categoryId);
    expect(layout2.categoryId).toBe(layout3.categoryId);
    
    // Layout completo debe ser idéntico (slug no debe afectar)
    expect(layout1).toEqual(layout2);
    expect(layout2).toEqual(layout3);
  });
  
  it('debe validar que slug nunca se usa para determinar layout', () => {
    // Crear companies con mismo category_id pero slugs completamente diferentes
    const company1 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'mi-barberia');
    const company2 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'tu-barberia');
    const company3 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'otra-barberia-completamente-diferente');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Todos deben tener el mismo layout porque tienen el mismo category_id
    // El slug no debe influir en absoluto
    expect(layout1.key).toBe('barberiasShowcase');
    expect(layout2.key).toBe('barberiasShowcase');
    expect(layout3.key).toBe('barberiasShowcase');
    
    // Layout completo debe ser idéntico
    expect(layout1).toEqual(layout2);
    expect(layout2).toEqual(layout3);
  });

  it('debe usar category_id para determinar el layout, no el slug', () => {
    const company1 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'barberia-1');
    const company2 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'barberia-2');
    const company3 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'completely-different-slug');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Todos deben tener el mismo layout porque tienen el mismo category_id
    expect(layout1.key).toBe('barberiasShowcase');
    expect(layout2.key).toBe('barberiasShowcase');
    expect(layout3.key).toBe('barberiasShowcase');
  });

  it('debe respetar public_layout_variant cuando está configurado', () => {
    const company1 = createMockCompany('restaurantes_comida_rapida', 'modern', BusinessType.PRODUCTS, 'slug-1');
    const company2 = createMockCompany('restaurantes_comida_rapida', 'modern', BusinessType.PRODUCTS, 'slug-2');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);

    // Mismo variant aunque slug diferente
    expect(layout1.variant).toBe('modern');
    expect(layout2.variant).toBe('modern');
    expect(layout1.variantSource).toBe('company');
    expect(layout2.variantSource).toBe('company');
  });

  it('debe usar fallback robusto cuando company es null', () => {
    const layout = resolvePublicLayout(null);

    expect(layout.key).toBe('default');
    expect(layout.variant).toBe('classic');
    expect(layout.source).toBe('fallback');
    expect(layout.categoryId).toBeNull();
  });

  it('debe usar fallback robusto cuando category_id es null', () => {
    const company = createMockCompany(null, undefined, BusinessType.PRODUCTS, 'any-slug');
    const layout = resolvePublicLayout(company);

    // Debe usar business_type como fallback
    expect(layout.key).toBe('productsShowcase');
    expect(layout.source).toBe('businessType');
  });

  it('debe usar fallback robusto cuando category_id es inválido', () => {
    const company = createMockCompany('invalid-category-id' as any, undefined, BusinessType.SERVICES, 'any-slug');
    const layout = resolvePublicLayout(company);

    // Debe usar fallback a default
    expect(layout.key).toBe('default');
    expect(layout.source).toBe('fallback');
  });

  it('debe retornar layout diferente para diferentes category_id', () => {
    const company1 = createMockCompany('barberias', undefined, BusinessType.SERVICES, 'slug-1');
    const company2 = createMockCompany('restaurantes_comida_rapida', undefined, BusinessType.PRODUCTS, 'slug-2');
    const company3 = createMockCompany('arriendo_cabanas_casas', undefined, BusinessType.SERVICES, 'slug-3');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Diferentes category_id deben producir diferentes layouts
    expect(layout1.key).toBe('barberiasShowcase');
    expect(layout2.key).toBe('restaurantesComidaRapidaShowcase');
    expect(layout3.key).toBe('propertyShowcase');
  });

  it('debe mantener consistencia: mismo company_id + mismo variant = mismo layout completo', () => {
    const company1 = createMockCompany('minimarket', 'compact', BusinessType.PRODUCTS, 'slug-a');
    const company2 = createMockCompany('minimarket', 'compact', BusinessType.PRODUCTS, 'slug-b');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);

    // Layout completo debe ser idéntico
    expect(layout1).toEqual(layout2);
  });

  it('debe usar fallback seguro cuando variant es inválido', () => {
    const company1 = createMockCompany('barberias', 'invalid-variant' as any, BusinessType.SERVICES, 'slug-1');
    const company2 = createMockCompany('barberias', 'another-invalid' as any, BusinessType.SERVICES, 'slug-2');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);

    // Debe usar variant por defecto de la categoría o 'classic'
    expect(layout1.variant).toBe('modern'); // barberias tiene variant 'modern' por defecto
    expect(layout2.variant).toBe('modern');
    expect(layout1.variantSource).toBe('category');
    expect(layout2.variantSource).toBe('category');
  });

  it('debe usar fallback seguro cuando variant es vacío o null', () => {
    const company1 = createMockCompany('restaurantes_comida_rapida', '', BusinessType.PRODUCTS, 'slug-1');
    const company2 = createMockCompany('restaurantes_comida_rapida', null as any, BusinessType.PRODUCTS, 'slug-2');
    const company3 = createMockCompany('restaurantes_comida_rapida', undefined, BusinessType.PRODUCTS, 'slug-3');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Debe usar variant por defecto de la categoría o 'classic'
    expect(layout1.variant).toBe('classic'); // restaurantes_comida_rapida tiene variant 'classic' por defecto
    expect(layout2.variant).toBe('classic');
    expect(layout3.variant).toBe('classic');
    expect(layout1.variantSource).toBe('category');
    expect(layout2.variantSource).toBe('category');
    expect(layout3.variantSource).toBe('category');
  });

  it('debe usar fallback seguro cuando variant es un string vacío con espacios', () => {
    const company = createMockCompany('barberias', '   ' as any, BusinessType.SERVICES, 'slug-1');
    const layout = resolvePublicLayout(company);

    // Debe usar variant por defecto de la categoría
    expect(layout.variant).toBe('modern');
    expect(layout.variantSource).toBe('category');
  });

  it('debe validar que el variant resuelto siempre es válido', () => {
    const validVariants = ['classic', 'modern', 'compact', 'immersive', 'minimal'];
    
    // Probar con diferentes combinaciones
    const testCases = [
      createMockCompany('barberias', 'modern', BusinessType.SERVICES, 'slug-1'),
      createMockCompany('restaurantes_comida_rapida', 'classic', BusinessType.PRODUCTS, 'slug-2'),
      createMockCompany('arriendo_cabanas_casas', 'compact', BusinessType.SERVICES, 'slug-3'),
      createMockCompany('minimarket', 'immersive', BusinessType.PRODUCTS, 'slug-4'),
      createMockCompany('construccion', 'minimal', BusinessType.SERVICES, 'slug-5'),
    ];

    testCases.forEach((company) => {
      const layout = resolvePublicLayout(company);
      expect(validVariants).toContain(layout.variant);
    });
  });

  it('debe asegurar que el cambio de variant no depende del slug', () => {
    // Mismo variant, diferentes slugs
    const company1 = createMockCompany('barberias', 'modern', BusinessType.SERVICES, 'slug-a');
    const company2 = createMockCompany('barberias', 'modern', BusinessType.SERVICES, 'slug-b');
    const company3 = createMockCompany('barberias', 'modern', BusinessType.SERVICES, 'completely-different-slug');

    const layout1 = resolvePublicLayout(company1);
    const layout2 = resolvePublicLayout(company2);
    const layout3 = resolvePublicLayout(company3);

    // Todos deben tener el mismo variant independientemente del slug
    expect(layout1.variant).toBe('modern');
    expect(layout2.variant).toBe('modern');
    expect(layout3.variant).toBe('modern');
    expect(layout1.variantSource).toBe('company');
    expect(layout2.variantSource).toBe('company');
    expect(layout3.variantSource).toBe('company');
  });
});

