import { expect, Page, test } from '@playwright/test';
import { setupFirebaseMocks } from './fixtures/mockFirebase';

const stubMaps = async (page: Page) => {
  const stubScript = `
    window.google = {
      maps: {
        Map: function() { this.addListener = () => ({ remove() {} }); this.panTo = () => {}; },
        Marker: function() {},
        places: { Autocomplete: function() { this.getPlace = () => ({ formatted_address: 'Av. Siempre Viva 123', geometry: { location: { lat: () => -33.45, lng: () => -70.66 } } }); this.addListener = () => {}; } },
      },
    };
  `;
  await page.route('https://maps.googleapis.com/maps/api/js**', (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: stubScript }),
  );
};

test('complete onboarding wizard', async ({ page }) => {
  const state = await setupFirebaseMocks(page);
  state.collections.companies['company-services'].data.setup_completed = false;
  await stubMaps(page);
  await page.addInitScript(() => localStorage.setItem('e2e:user', 'founder'));

  await page.goto('/setup/company-basic');

  await expect(page).toHaveURL(/setup\/company-basic/);
  await page.getByLabel('Nombre de la empresa *').fill('Servicios Demo QA');
  await page.getByLabel('RUT *').fill('12.345.678-9');
  await page.getByLabel('Rubro *').fill('Tecnología');
  await page.getByLabel('Sector *').fill('Consultoría');
  await page.getByLabel('Palabra o frase clave (SEO) *').fill('consultoría en línea');
  await page.getByLabel('Teléfono WhatsApp principal *').fill('+56988888888');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page).toHaveURL(/setup\/company-location/);
  await page.getByLabel('Dirección *').fill('Av. Siempre Viva 123');
  await page.getByLabel('Comuna / Ciudad').fill('Santiago');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page).toHaveURL(/setup\/company-info/);
  await page.getByLabel('Misión').fill('Ayudar a los negocios a crecer.');
  await page.getByLabel('Visión').fill('Ser la plataforma preferida.');
  await page.getByLabel('Mensaje para agendar/comprar').fill('¡Agenda tu demostración!');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page).toHaveURL(/setup\/business-type/);
  await page.getByLabel('Servicios').check();
  await page.getByRole('button', { name: 'Finalizar' }).click();

  await expect(page).toHaveURL(/dashboard\/services/);
  await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();
});
