import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test.describe('Admin dashboard', () => {
  test('approve access request and see new profile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('e2e:user', 'admin'));
    await setupFirebaseMocks(page);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Panel de Administración' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Solicitudes de Acceso/i })).toBeVisible();

    const requestCard = page.getByText('Ana SPA').first().locator('..');
    await requestCard.getByRole('button', { name: 'Aprobar' }).click();

    await expect(requestCard.getByText('APPROVED')).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Perfiles' }).click();
    await expect(page.getByText('Perfiles')).toBeVisible();
    await expect(page.getByText(/founder@demo.com/)).toBeVisible();
    await expect(page.getByText(/Ana SPA/)).toBeVisible();
  });
});
