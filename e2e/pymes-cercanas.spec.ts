import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

test('pymes cercanas filters and list updates', async ({ page }) => {
  await setupFirebaseMocks(page, {
    collections: {
      companies_public: {
        'c-1': {
          data: {
            name: 'Barbería Central',
            categoryId: 'barberias',
            comuna: 'Santiago',
            region: 'Región Metropolitana',
            location: { latitude: -33.45, longitude: -70.66 },
            geohash: '66j8k9m2n',
            shortDescription: 'Cortes y barbería',
            publicSlug: 'barberia-central',
          },
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
        'c-2': {
          data: {
            name: 'Panadería Barrio',
            categoryId: 'panaderia_pasteleria',
            comuna: 'Providencia',
            region: 'Región Metropolitana',
            location: { latitude: -33.44, longitude: -70.63 },
            geohash: '66j8k9m3a',
            shortDescription: 'Pan fresco cada día',
            publicSlug: 'panaderia-barrio',
          },
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
      },
    },
  });

  await page.goto('/pymes-cercanas');

  await expect(page.getByRole('heading', { name: /pymes cercanas/i })).toBeVisible();

  await page.getByLabel('Categoría').selectOption('barberias');
  await expect(page.getByText('Barbería Central')).toBeVisible();
  await expect(page.getByText('Panadería Barrio')).not.toBeVisible();

  await page.getByLabel('Comuna').selectOption('Providencia');
  await expect(page.getByText('Panadería Barrio')).toBeVisible();
  await expect(page.getByText('Barbería Central')).not.toBeVisible();
});
