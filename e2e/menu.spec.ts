import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test('public menu whatsapp flow', async ({ page, context }) => {
  await setupFirebaseMocks(page, {
    collections: {
      menu_categories: {
        'cat-1': {
          data: {
            company_id: 'company-products',
            name: 'Categoría Demo',
            order: 0,
            active: true,
          },
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
      },
      products: {
        'product-a': {
          data: {
            company_id: 'company-products',
            name: 'Producto destacado',
            description: 'Producto de ejemplo',
            price: 19990,
            menuCategoryId: 'cat-1',
            menuOrder: 0,
            status: 'ACTIVE',
          },
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
      },
    },
  });

  await page.goto('/company-products/menu');

  await page.getByRole('button', { name: 'Categoría Demo' }).click();
  await page.getByRole('button', { name: /Agregar/i }).first().click();
  await page.getByRole('heading', { name: /Carrito/i }).waitFor();

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: /Pedir por WhatsApp/i }).click(),
  ]);

  await popup.waitForLoadState('domcontentloaded');
  const url = popup.url();
  expect(url).toContain('https://wa.me/56922222222');
  expect(decodeURIComponent(url)).toContain('Producto destacado');
});
