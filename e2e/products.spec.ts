import { Buffer } from 'buffer';
import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test('create, publish and request a product', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('e2e:user', 'seller'));
  await setupFirebaseMocks(page);

  await page.goto('/dashboard/products');

  await expect(page.getByRole('heading', { name: /Productos|Products/ })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo producto' }).click();

  await page.getByLabel('Nombre *').fill('Caja regalo premium');
  await page.getByLabel('Descripción *').fill('Caja de productos seleccionados para sorprender.');
  await page.getByLabel('Precio *').fill('29990');
  await page.getByLabel('Imagen *').setInputFiles({
    name: 'product.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71]),
  });
  await page.getByLabel('Estado').selectOption('ACTIVE');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page).toHaveURL(/dashboard\/products$/);

  await page.goto('/productos-demo');
  await page.getByRole('heading', { name: /Producto destacado/i }).locator('..').getByRole('button', { name: 'Agregar' }).click({ force: true });
  await page.getByRole('button', { name: /Carrito/ }).click();

  await page.getByLabel('Nombre *').fill('Comprador QA');
  await page.getByLabel('WhatsApp *').fill('+56966666666');
  await page.getByLabel('Comentario').fill('Entregar mañana por la mañana.');
  await page.getByRole('button', { name: 'Solicitar disponibilidad por WhatsApp' }).click();
});
