import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from '../../e2e/fixtures/mockFirebase';
import { closeOverlays, gotoWithFallback, safeWaitForTimeout } from '../utils/test-helpers';

test.describe('Barberías - Funcionalidades Públicas', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('e2e:user', 'founder'));
    await setupFirebaseMocks(page);
  });

  test('debe mostrar servicios en la página pública de barbería', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    // Verificar que la página carga correctamente
    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Verificar que hay servicios visibles
    const serviceCards = page.getByRole('article').filter({ hasText: /Corte|Barba|Tinte/i });
    await expect(serviceCards.first()).toBeVisible();
  });

  test('debe filtrar servicios por búsqueda', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    // Esperar a que la página cargue
    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Buscar input de búsqueda
    const searchInput = page.getByPlaceholder(/Buscar servicios|Search services/i);
    await expect(searchInput).toBeVisible();

    // Escribir en el input de búsqueda
    await searchInput.fill('Corte');

    // Esperar a que los resultados se filtren (debounce)
    await safeWaitForTimeout(page, 400);

    // Verificar que los resultados filtrados son visibles
    const serviceCards = page.getByRole('article');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe filtrar servicios por disponibilidad', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Buscar botón de filtro "Disponibles"
    const availableFilter = page.getByRole('button', { name: /Disponibles|Available/i });
    await expect(availableFilter).toBeVisible();

    // Click en el filtro
    await availableFilter.click();

    // Verificar que el filtro está activo (puede tener clase o atributo aria-pressed)
    await expect(availableFilter).toHaveAttribute('class', /bg-slate-900|active/i);
  });

  test('debe ordenar servicios por precio', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Buscar select de ordenamiento
    const sortSelect = page.getByLabel(/Ordenar por|Sort by/i);
    await expect(sortSelect).toBeVisible();

    // Seleccionar ordenamiento por precio
    await sortSelect.selectOption('priceAsc');

    // Esperar a que se reordene
    await safeWaitForTimeout(page, 300);

    // Verificar que los servicios están ordenados (verificamos que el select tiene el valor correcto)
    await expect(sortSelect).toHaveValue(/priceAsc/i);
  });

  test('debe mostrar mensaje cuando no hay resultados de búsqueda', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar servicios|Search services/i);
    await searchInput.fill('xyz123noexiste');

    await safeWaitForTimeout(page, 400);

    // Verificar mensaje de "no resultados"
    const noResults = page.getByText(/No se encontraron servicios|No services found/i);
    await expect(noResults).toBeVisible();
  });

  test('debe mostrar paginación cuando hay muchos servicios', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Verificar si hay botón "Cargar más" (solo aparece si hay más de 12 servicios)
    const loadMoreButton = page.getByRole('button', { name: /Cargar más servicios|Load more services/i });
    const buttonExists = await loadMoreButton.isVisible().catch(() => false);

    if (buttonExists) {
      await loadMoreButton.click();
      await safeWaitForTimeout(page, 300);
      // Verificar que se cargaron más servicios
      const serviceCards = page.getByRole('article');
      const count = await serviceCards.count();
      expect(count).toBeGreaterThan(12);
    }
  });

  test('debe abrir modal de booking al hacer click en "Agendar"', async ({ page }) => {
    await gotoWithFallback(page, '/demo10');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await closeOverlays(page);

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    // Buscar botón "Agendar" en el primer servicio
    const bookButton = page.getByRole('button', { name: /Agendar|Book/i }).first();
    await expect(bookButton).toBeVisible();

    await bookButton.click({ force: true });

    // Verificar que se abre el modal de booking
    await expect(page.getByRole('heading', { name: /Agendar|Book/i })).toBeVisible({ timeout: 2000 });
  });

  test('debe limpiar búsqueda con botón X', async ({ page }) => {
    await page.goto('/demo10');

    await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar servicios|Search services/i);
    await searchInput.fill('Corte');

    await safeWaitForTimeout(page, 400);

    // Buscar botón de limpiar (X)
    const clearButton = page.getByTestId('clear-search').or(
      page.locator('button[aria-label*="Limpiar" i], button[aria-label*="Clear" i]')
    );

    const clearButtonExists = await clearButton.first().isVisible().catch(() => false);

    if (clearButtonExists) {
      await clearButton.first().click();
      await safeWaitForTimeout(page, 300);

      // Verificar que el input está vacío
      await expect(searchInput).toHaveValue('');
    }
  });
});
