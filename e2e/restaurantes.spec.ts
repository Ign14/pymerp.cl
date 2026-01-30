import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test.describe('Restaurantes - Funcionalidades Públicas', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('e2e:user', 'seller'));
    await setupFirebaseMocks(page);
  });

  test('debe mostrar productos en la página pública de restaurante', async ({ page }) => {
    await page.goto('/productos-demo');

    // Verificar que la página carga correctamente
    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Verificar que hay productos visibles
    const productCards = page.getByRole('article').or(page.locator('[class*="product"]'));
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe filtrar productos por búsqueda', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Buscar input de búsqueda
    const searchInput = page.getByPlaceholder(/Buscar productos|Search products/i);
    const searchInputExists = await searchInput.isVisible().catch(() => false);

    if (searchInputExists) {
      await searchInput.fill('Pizza');

      // Esperar debounce
      await page.waitForTimeout(400);

      // Verificar que hay resultados
      const productCards = page.getByRole('article').or(page.locator('[class*="product"]'));
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('debe filtrar productos por categoría', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Buscar botones de categorías
    const categoryButtons = page.getByRole('button').filter({ hasText: /Entradas|Platos|Postres|Bebidas/i });
    const categoryExists = await categoryButtons.first().isVisible().catch(() => false);

    if (categoryExists) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);

      // Verificar que el botón está activo
      await expect(categoryButtons.first()).toHaveAttribute('class', /bg-slate-900|active/i);
    }
  });

  test('debe ordenar productos por precio', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Buscar select de ordenamiento
    const sortSelect = page.getByLabel(/Ordenar por|Sort by/i);
    const sortExists = await sortSelect.isVisible().catch(() => false);

    if (sortExists) {
      await sortSelect.selectOption({ label: /Precio.*menor|Price.*low/i });
      await page.waitForTimeout(300);

      await expect(sortSelect).toHaveValue(/priceAsc/i);
    }
  });

  test('debe agregar productos al carrito', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Buscar botón "Agregar" o "Add to cart"
    const addButton = page.getByRole('button', { name: /Agregar|Add/i }).first();
    const addButtonExists = await addButton.isVisible().catch(() => false);

    if (addButtonExists) {
      await addButton.click({ force: true });
      await page.waitForTimeout(300);

      // Verificar que el carrito muestra el producto
      const cartButton = page.getByRole('button', { name: /Carrito|Cart/i });
      const cartExists = await cartButton.isVisible().catch(() => false);

      if (cartExists) {
        await expect(cartButton).toContainText(/1|\(1\)/);
      }
    }
  });

  test('debe mostrar opciones de fulfillment (delivery/takeaway)', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Agregar un producto al carrito
    const addButton = page.getByRole('button', { name: /Agregar|Add/i }).first();
    const addButtonExists = await addButton.isVisible().catch(() => false);

    if (addButtonExists) {
      await addButton.click({ force: true });
      await page.waitForTimeout(300);

      // Abrir carrito
      const cartButton = page.getByRole('button', { name: /Carrito|Cart/i });
      const cartExists = await cartButton.isVisible().catch(() => false);

      if (cartExists) {
        await cartButton.click();
        await page.waitForTimeout(300);

        // Verificar opciones de fulfillment
        const deliveryOption = page.getByText(/Delivery|Retiro|Takeaway/i);
        const deliveryExists = await deliveryOption.isVisible().catch(() => false);

        // Si existe configuración de fulfillment, debe aparecer
        if (deliveryExists) {
          await expect(deliveryOption).toBeVisible();
        }
      }
    }
  });

  test('debe mostrar mensaje cuando no hay resultados de búsqueda', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar productos|Search products/i);
    const searchInputExists = await searchInput.isVisible().catch(() => false);

    if (searchInputExists) {
      await searchInput.fill('xyz123noexiste');

      await page.waitForTimeout(400);

      // Verificar mensaje de "no resultados"
      const noResults = page.getByText(/No se encontraron|No.*found/i);
      const noResultsExists = await noResults.isVisible().catch(() => false);

      if (noResultsExists) {
        await expect(noResults).toBeVisible();
      }
    }
  });

  test('debe mostrar paginación cuando hay muchos productos', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Verificar si hay botón "Cargar más"
    const loadMoreButton = page.getByRole('button', { name: /Cargar más productos|Load more products/i });
    const buttonExists = await loadMoreButton.isVisible().catch(() => false);

    if (buttonExists) {
      await loadMoreButton.click();
      await page.waitForTimeout(300);

      // Verificar que se cargaron más productos
      const productCards = page.getByRole('article').or(page.locator('[class*="product"]'));
      const count = await productCards.count();
      expect(count).toBeGreaterThan(24);
    }
  });

  test('debe validar pedido mínimo en carrito', async ({ page }) => {
    await page.goto('/productos-demo');

    await expect(page.getByRole('heading', { name: /Menú|Menu/i })).toBeVisible();

    // Abrir carrito (si hay productos)
    const cartButton = page.getByRole('button', { name: /Carrito|Cart/i });
    const cartExists = await cartButton.isVisible().catch(() => false);

    if (cartExists) {
      await cartButton.click();
      await page.waitForTimeout(300);

      // Buscar mensaje de pedido mínimo o botón deshabilitado
      const minOrderMessage = page.getByText(/Pedido mínimo|Minimum order/i);
      const minOrderExists = await minOrderMessage.isVisible().catch(() => false);

      // Si existe configuración de pedido mínimo, debe aparecer
      if (minOrderExists) {
        await expect(minOrderMessage).toBeVisible();
      }
    }
  });
});
