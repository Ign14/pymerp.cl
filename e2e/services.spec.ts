import { Buffer } from 'buffer';
import { expect, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

const nextWeekday = (allowedDays: number[]) => {
  const start = new Date();
  for (let i = 0; i < 10; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    if (allowedDays.includes(candidate.getDay())) return candidate;
  }
  return start;
};

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

test('create, publish and book a service', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('e2e:user', 'founder'));
  await setupFirebaseMocks(page);

  await page.goto('/dashboard/services');

  await expect(page.getByRole('heading', { name: /Servicios|Services/ })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo servicio' }).click();

  await page.getByLabel('Nombre *').fill('Implementación Express');
  await page.getByLabel('Descripción *').fill('Implementación en 48 horas con acompañamiento.');
  await page.getByLabel('Valor *').fill('75000');
  await page.getByLabel('Duración estimada (minutos) *').fill('90');
  await page.getByLabel('Imagen *').setInputFiles({
    name: 'service.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71]),
  });
  await page.getByLabel('Estado').selectOption('ACTIVE');
  await page.locator('.schedule-slot').first().getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page).toHaveURL(/dashboard\/services$/);

  await page.goto('/servicios-demo');
  await page.getByRole('heading', { name: /Servicios|Services/ }).scrollIntoViewIfNeeded();
  await page.getByRole('heading', { name: 'Implementación Express' }).scrollIntoViewIfNeeded();
  await page.getByRole('heading', { name: 'Implementación Express' }).locator('..').getByRole('button', { name: 'Agendar' }).click({ force: true });

  const targetDate = nextWeekday([1, 3, 5]); // Monday, Wednesday, Friday
  await page.getByLabel('Fecha *').click();
  await page.getByLabel('Fecha *').fill(formatDate(targetDate));
  await page.getByLabel('Horario *').selectOption({ index: 1 });
  await page.getByLabel('Nombre *').fill('Cliente QA');
  await page.getByLabel('WhatsApp *').fill('+56977777777');
  await page.getByRole('button', { name: 'Enviar por WhatsApp' }).click();

  await expect(page.getByRole('heading', { name: /Agendar/ })).not.toBeVisible({ timeout: 4000 });
});
