/**
 * Tests unitarios para el sistema de categorías
 */

import {
  getCategoryConfig,
  resolveCategoryId,
  isModuleEnabled,
  getCategoryTheme,
  getCategoriesByGroup,
  getAllCategories,
  isValidCategoryId,
  type CategoryId,
} from '../categories';

describe('categories', () => {
  describe('getCategoryConfig', () => {
    it('debe retornar la configuración de una categoría válida', () => {
      const config = getCategoryConfig('barberias');
      expect(config).toBeDefined();
      expect(config.id).toBe('barberias');
      expect(config.group).toBe('BELLEZA');
      expect(config.dashboardModules).toContain('appointments-lite');
    });

    it('debe retornar "otros" para categoryId null', () => {
      const config = getCategoryConfig(null);
      expect(config.id).toBe('otros');
    });

    it('debe retornar "otros" para categoryId undefined', () => {
      const config = getCategoryConfig(undefined);
      expect(config.id).toBe('otros');
    });

    it('debe retornar "otros" para categoryId vacío', () => {
      const config = getCategoryConfig('');
      expect(config.id).toBe('otros');
    });

    it('debe retornar "otros" para categoryId inválido', () => {
      const config = getCategoryConfig('categoria_inexistente' as CategoryId);
      expect(config.id).toBe('otros');
    });

    it('debe retornar "otros" para categoryId no string', () => {
      const config = getCategoryConfig(123 as any);
      expect(config.id).toBe('otros');
    });

    it('debe resolver alias hacia el ID canónico', () => {
      const config = getCategoryConfig('construccion_mantencion');
      expect(config.id).toBe('construccion');
      expect(config.dashboardModules).toContain('work-orders-lite');
    });
  });

  describe('resolveCategoryId', () => {
    it('debe retornar category_id si existe', () => {
      const company = { category_id: 'barberias' };
      const result = resolveCategoryId(company);
      expect(result).toBe('barberias');
    });

    it('debe retornar categoryId si category_id no existe', () => {
      const company = { categoryId: 'peluquerias' };
      const result = resolveCategoryId(company);
      expect(result).toBe('peluquerias');
    });

    it('debe priorizar category_id sobre categoryId', () => {
      const company = { category_id: 'barberias', categoryId: 'peluquerias' };
      const result = resolveCategoryId(company);
      expect(result).toBe('barberias');
    });

    it('debe retornar "otros" si company es null', () => {
      const result = resolveCategoryId(null);
      expect(result).toBe('otros');
    });

    it('debe retornar "otros" si company es undefined', () => {
      const result = resolveCategoryId(undefined);
      expect(result).toBe('otros');
    });

    it('debe retornar "otros" si no hay category_id ni categoryId', () => {
      const company = { name: 'Test Company' };
      const result = resolveCategoryId(company);
      expect(result).toBe('otros');
    });

    it('debe retornar "otros" si category_id es null', () => {
      const company = { category_id: null };
      const result = resolveCategoryId(company);
      expect(result).toBe('otros');
    });

    it('debe retornar "otros" si category_id es una cadena vacía', () => {
      const company = { category_id: '' };
      const result = resolveCategoryId(company);
      expect(result).toBe('otros');
    });

    it('debe retornar "otros" si category_id no existe en CATEGORIES', () => {
      const company = { category_id: 'categoria_inexistente' };
      const result = resolveCategoryId(company);
      expect(result).toBe('otros');
    });

    it('debe mapear alias antiguos a IDs nuevos', () => {
      const company = { category_id: 'construccion_mantencion' };
      const result = resolveCategoryId(company);
      expect(result).toBe('construccion');
    });
  });

  describe('isModuleEnabled', () => {
    it('debe retornar true si el módulo está habilitado', () => {
      const result = isModuleEnabled('barberias', 'appointments-lite');
      expect(result).toBe(true);
    });

    it('debe retornar false si el módulo no está habilitado', () => {
      const result = isModuleEnabled('barberias', 'inventory');
      expect(result).toBe(false);
    });

    it('debe retornar false para categoryId null', () => {
      const result = isModuleEnabled(null, 'appointments');
      // Debe usar "otros" como fallback y verificar si tiene el módulo
      const otrosHasAppointments = getCategoryConfig('otros').dashboardModules.includes('appointments');
      expect(result).toBe(otrosHasAppointments);
    });

    it('debe retornar false para categoryId inválido', () => {
      const result = isModuleEnabled('categoria_inexistente', 'appointments');
      // Debe usar "otros" como fallback
      const otrosHasAppointments = getCategoryConfig('otros').dashboardModules.includes('appointments');
      expect(result).toBe(otrosHasAppointments);
    });
  });

  describe('isValidCategoryId', () => {
    it('valida IDs y alias conocidos', () => {
      expect(isValidCategoryId('barberias')).toBe(true);
      expect(isValidCategoryId('construccion_mantencion')).toBe(true);
      expect(isValidCategoryId('categoria_inexistente')).toBe(false);
      expect(isValidCategoryId(null)).toBe(false);
    });
  });

  describe('Nuevas subcategorías y módulos', () => {
    it('inmobiliaria_terrenos_casas incluye propiedades y reservas', () => {
      const config = getCategoryConfig('inmobiliaria_terrenos_casas');
      expect(config.dashboardModules).toEqual(
        expect.arrayContaining(['properties', 'property-bookings', 'appointments-lite', 'schedule', 'reports', 'notifications'])
      );
      expect(config.businessModesAllowed).toContain('BOTH');
    });

    it('agenda_profesionales_independientes usa agenda y pacientes básicos', () => {
      const config = getCategoryConfig('agenda_profesionales_independientes');
      expect(config.dashboardModules).toEqual(
        expect.arrayContaining(['appointments', 'patients-lite', 'schedule', 'reports', 'notifications'])
      );
      expect(config.businessModesAllowed).toContain('SERVICES');
    });

    it('agenda_profesionales replica la estructura de barberías (agenda lite + profesionales)', () => {
      const config = getCategoryConfig('agenda_profesionales');
      expect(config.dashboardModules).toEqual(
        expect.arrayContaining(['appointments-lite', 'patients-lite', 'schedule', 'professionals', 'reports', 'notifications'])
      );
      expect(config.businessModesAllowed).toContain('SERVICES');
    });

    it('productos_cuidado_personal opera con catálogo y órdenes', () => {
      const config = getCategoryConfig('productos_cuidado_personal');
      expect(config.dashboardModules).toEqual(
        expect.arrayContaining(['catalog', 'orders', 'inventory', 'reports', 'notifications'])
      );
      expect(config.businessModesAllowed).toContain('PRODUCTS');
    });

    it('restaurantes/bares/foodtruck heredan módulos de restaurantes_comida_rapida', () => {
      const base = getCategoryConfig('restaurantes_comida_rapida');
      (['restaurantes', 'bares', 'foodtruck'] as const).forEach((id) => {
        const cfg = getCategoryConfig(id);
        expect(cfg.dashboardModules).toEqual(expect.arrayContaining(base.dashboardModules));
        expect(cfg.businessModesAllowed).toEqual(base.businessModesAllowed);
        expect(cfg.group).toBe(base.group);
      });
    });
  });

  describe('getCategoryTheme', () => {
    it('debe retornar el tema de una categoría válida', () => {
      const theme = getCategoryTheme('barberias');
      expect(theme).toBeDefined();
      expect(theme.primary).toBeDefined();
      expect(theme.secondary).toBeDefined();
      expect(theme.accent).toBeDefined();
      expect(typeof theme.primary).toBe('string');
      expect(typeof theme.secondary).toBe('string');
      expect(typeof theme.accent).toBe('string');
    });

    it('debe retornar el tema de "otros" para categoryId null', () => {
      const theme = getCategoryTheme(null);
      const otrosTheme = getCategoryConfig('otros').defaultTheme;
      expect(theme.primary).toBe(otrosTheme.primaryColor);
      expect(theme.secondary).toBe(otrosTheme.secondaryColor);
      expect(theme.accent).toBe(otrosTheme.accentColor);
    });

    it('debe retornar el tema de "otros" para categoryId inválido', () => {
      const theme = getCategoryTheme('categoria_inexistente');
      const otrosTheme = getCategoryConfig('otros').defaultTheme;
      expect(theme.primary).toBe(otrosTheme.primaryColor);
    });
  });

  describe('getCategoriesByGroup', () => {
    it('debe retornar todas las categorías de un grupo', () => {
      const saludCategories = getCategoriesByGroup('SALUD');
      expect(saludCategories.length).toBeGreaterThan(0);
      saludCategories.forEach((cat) => {
        expect(cat.group).toBe('SALUD');
      });
    });

    it('debe retornar array vacío para grupo inexistente', () => {
      const result = getCategoriesByGroup('GRUPO_INEXISTENTE' as any);
      expect(result).toEqual([]);
    });
  });

  describe('getAllCategories', () => {
    it('debe retornar todas las categorías', () => {
      const allCategories = getAllCategories();
      expect(allCategories.length).toBeGreaterThan(0);
      expect(Array.isArray(allCategories)).toBe(true);
    });

    it('debe retornar categorías con estructura completa', () => {
      const allCategories = getAllCategories();
      allCategories.forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('labelKey');
        expect(cat).toHaveProperty('group');
        expect(cat).toHaveProperty('dashboardModules');
        expect(cat).toHaveProperty('iconPackKey');
        expect(cat).toHaveProperty('defaultTheme');
      });
    });
  });

  describe('Coherencia de módulos por vertical', () => {
    it('barberías debe tener appointments-lite, schedule, professionals, notifications', () => {
      const config = getCategoryConfig('barberias');
      expect(config.dashboardModules).toContain('appointments-lite');
      expect(config.dashboardModules).toContain('schedule');
      expect(config.dashboardModules).toContain('professionals');
      expect(config.dashboardModules).toContain('notifications');
      // Barberías incluye patients-lite para gestión de clientes
      expect(config.dashboardModules).toContain('patients-lite');
    });

    it('minimarket debe tener catalog, orders, inventory', () => {
      const config = getCategoryConfig('minimarket');
      expect(config.dashboardModules).toContain('catalog');
      expect(config.dashboardModules).toContain('orders');
      expect(config.dashboardModules).toContain('inventory');
    });

    it('taller_vehiculos debe tener work-orders-lite (no work-orders completo)', () => {
      const config = getCategoryConfig('taller_vehiculos');
      expect(config.dashboardModules).toContain('work-orders-lite');
      expect(config.dashboardModules).not.toContain('work-orders');
    });
  });
});
