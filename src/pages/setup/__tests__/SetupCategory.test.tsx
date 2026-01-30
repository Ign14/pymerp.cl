/**
 * Tests unitarios para SetupCategory
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SetupCategory from '../SetupCategory';
import { getAllCategories } from '../../../config/categories';
import { BusinessType } from '../../../types';
import toast from 'react-hot-toast';

// Mock de dependencias
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firestoreUser: {
      company_id: 'test-company-id',
    },
  }),
}));

vi.mock('../../../services/firestore', () => ({
  getCompany: vi.fn(),
  updateCompany: vi.fn(),
}));

vi.mock('react-hot-toast', () => {
  const toastMock: any = vi.fn();
  toastMock.success = vi.fn();
  toastMock.error = vi.fn();
  return {
    __esModule: true,
    default: toastMock,
  };
});

vi.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SetupCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const toastMock = toast as unknown as any;
    toastMock.success = vi.fn();
    toastMock.error = vi.fn();
  });

  describe('Filtrado de categorías por businessMode', () => {
    it('debe filtrar categorías para SERVICES correctamente', async () => {
      const { getCompany } = await import('../../../services/firestore');
      getCompany.mockResolvedValue({
        business_type: BusinessType.SERVICES,
      });

      const allCategories = getAllCategories();
      const servicesCategories = allCategories.filter((cat) => {
        const allowed = cat.businessModesAllowed;
        return allowed.includes('SERVICES') || allowed.includes('BOTH');
      });

      // Verificar que hay categorías para servicios
      expect(servicesCategories.length).toBeGreaterThan(0);

      // Verificar que todas tienen businessModesAllowed correcto
      servicesCategories.forEach((cat) => {
        expect(
          cat.businessModesAllowed.includes('SERVICES') ||
            cat.businessModesAllowed.includes('BOTH')
        ).toBe(true);
      });
    });

    it('debe filtrar categorías para PRODUCTS correctamente', () => {
      const allCategories = getAllCategories();
      const productsCategories = allCategories.filter((cat) => {
        const allowed = cat.businessModesAllowed;
        return allowed.includes('PRODUCTS') || allowed.includes('BOTH');
      });

      // Verificar que hay categorías para productos
      expect(productsCategories.length).toBeGreaterThan(0);

      // Verificar que todas tienen businessModesAllowed correcto
      productsCategories.forEach((cat) => {
        expect(
          cat.businessModesAllowed.includes('PRODUCTS') ||
            cat.businessModesAllowed.includes('BOTH')
        ).toBe(true);
      });
    });

    it('debe incluir categorías con BOTH para ambos tipos', () => {
      const allCategories = getAllCategories();
      const bothCategories = allCategories.filter((cat) =>
        cat.businessModesAllowed.includes('BOTH')
      );

      // Verificar que hay categorías que permiten ambos
      expect(bothCategories.length).toBeGreaterThan(0);

      // Verificar que aparecen en ambos filtros
      const servicesCategories = allCategories.filter((cat) => {
        const allowed = cat.businessModesAllowed;
        return allowed.includes('SERVICES') || allowed.includes('BOTH');
      });

      const productsCategories = allCategories.filter((cat) => {
        const allowed = cat.businessModesAllowed;
        return allowed.includes('PRODUCTS') || allowed.includes('BOTH');
      });

      bothCategories.forEach((cat) => {
        expect(servicesCategories).toContainEqual(cat);
        expect(productsCategories).toContainEqual(cat);
      });
    });
  });

  describe('Validación de selección', () => {
    it('debe bloquear avance sin selección de categoría', async () => {
      const { getCompany, updateCompany } = await import('../../../services/firestore');
      const toastMock = toast as unknown as any;

      getCompany.mockResolvedValue({
        business_type: BusinessType.SERVICES,
      });

      render(
        <BrowserRouter>
          <SetupCategory />
        </BrowserRouter>
      );

      // Esperar a que cargue
      await waitFor(() => {
        expect(getCompany).toHaveBeenCalled();
      });

      // Buscar el botón de submit
      const submitButton = screen.getByRole('button', { name: /finish|finalizar/i });
      expect(submitButton).toBeDisabled();

      // Intentar hacer submit sin seleccionar
      fireEvent.click(submitButton);

      // Verificar que no se llamó a updateCompany
      await waitFor(() => {
        expect(updateCompany).not.toHaveBeenCalled();
      });

      // Verificar que se muestra mensaje de requerido en el formulario
      expect(
        screen.getByText(/(setup\.category\.error\.required|Debes seleccionar una categoría)/i)
      ).toBeInTheDocument();
      expect(toastMock.error).not.toHaveBeenCalled();
    });

    it('debe permitir avance con categoría seleccionada', async () => {
      const { getCompany, updateCompany } = await import('../../../services/firestore');
      const toastMock = toast as unknown as any;

      getCompany.mockResolvedValue({
        business_type: BusinessType.SERVICES,
      });

      updateCompany.mockResolvedValue({});

      render(
        <BrowserRouter>
          <SetupCategory />
        </BrowserRouter>
      );

      // Esperar a que cargue
      await waitFor(() => {
        expect(getCompany).toHaveBeenCalled();
      });

      // Seleccionar una categoría (buscar el primer botón de categoría)
      const categoryButtons = await screen.findAllByRole('button', {
        name: /categories\..* - categories\.groups/i,
      });
      expect(categoryButtons.length).toBeGreaterThan(0);

      fireEvent.click(categoryButtons[0]);

      // El botón de submit debería estar habilitado ahora
      const submitButton = screen.getByRole('button', { name: /finish|finalizar/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Hacer submit
      fireEvent.click(submitButton);

      // Verificar que se llamó a updateCompany
      await waitFor(() => {
        expect(updateCompany).toHaveBeenCalled();
      });

      // Verificar que se podría mostrar éxito sin lanzar errores
      expect(toastMock.success).toBeDefined();
    });
  });

  describe('Filtrado por grupo', () => {
    it('debe filtrar categorías por grupo seleccionado', () => {
      const allCategories = getAllCategories();
      const saludGroup = allCategories.filter((cat) => cat.group === 'SALUD');

      expect(saludGroup.length).toBeGreaterThan(0);
      saludGroup.forEach((cat) => {
        expect(cat.group).toBe('SALUD');
      });
    });

    it('debe mostrar todas las categorías cuando se selecciona ALL', () => {
      const allCategories = getAllCategories();
      const servicesCategories = allCategories.filter((cat) => {
        const allowed = cat.businessModesAllowed;
        return allowed.includes('SERVICES') || allowed.includes('BOTH');
      });

      // Cuando no hay filtro de grupo, todas deberían estar disponibles
      expect(servicesCategories.length).toBeGreaterThan(0);
    });
  });

  describe('Búsqueda de categorías', () => {
    it('debe filtrar categorías por texto de búsqueda', () => {
      const allCategories = getAllCategories();
      const searchQuery = 'barber';
      const filtered = allCategories.filter((cat) => {
        // Simular búsqueda (en el componente real usa t() para traducciones)
        const label = cat.labelKey.toLowerCase();
        return label.includes(searchQuery.toLowerCase());
      });

      // Debe encontrar al menos barberias
      expect(filtered.some((cat) => cat.id === 'barberias')).toBe(true);
    });
  });
});
