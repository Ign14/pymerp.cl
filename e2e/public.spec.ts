import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test('landing navigation and public cart experience', async ({ page }) => {
  await setupFirebaseMocks(page);

  await page.goto('/');
  await page.getByRole('button', { name: /Close|Cerrar|×/i }).click({ force: true });
  await page.locator('a[href="/login"]').first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goBack();
  await page.locator('a[href="/request-access"]').first().click();
  await expect(page).toHaveURL(/request-access/);

  await page.goto('/productos-demo');
  await page.getByRole('button', { name: /Carrito/ }).click();
  await expect(page.getByText('El carrito está vacío')).toBeVisible();

  await page.getByRole('heading', { name: 'Producto destacado' }).locator('..').getByRole('button', { name: 'Agregar' }).click();
  await page.getByRole('button', { name: /Carrito/ }).click();
  await expect(page.getByText('Producto destacado').first()).toBeVisible();
});
