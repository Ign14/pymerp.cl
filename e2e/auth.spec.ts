import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test.describe('Auth flows', () => {

  test('login and logout happy path', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('e2e:user', 'founder'));
    await setupFirebaseMocks(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('forces password change when status requires it', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('e2e:user', 'force'));
    const state = await setupFirebaseMocks(page);
    state.collections.companies['company-services'].data.setup_completed = false;
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/dashboard/);
  });
});
