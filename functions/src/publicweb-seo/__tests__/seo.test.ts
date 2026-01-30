import { describe, expect, it, vi } from 'vitest';
import { BarberiaSeoStrategy } from '../barberiaStrategy';

const sampleCompany = {
  id: 'company-1',
  name: 'Barbería Central',
  slug: 'barberia-central',
  publicEnabled: true,
  comuna: 'Providencia',
  region: 'Metropolitana',
  address: 'Av. Principal 123',
  whatsapp: '+56912345678',
};

const sampleServices = [
  { id: 's1', name: 'Corte clásico', price: 12000 },
  { id: 's2', name: 'Barba premium', price: 8000 },
  { id: 's3', name: 'Afeitado', price: 6000 },
];

describe('BarberiaSeoStrategy', () => {
  it('builds title and description with location', () => {
    const strategy = new BarberiaSeoStrategy();
    const seo = strategy.buildSeo({
      company: sampleCompany as any,
      services: sampleServices as any,
      route: {
        slug: sampleCompany.slug,
        locale: 'es',
        baseUrl: 'https://pymerp.cl',
        path: `/${sampleCompany.slug}/barberias`,
      },
    });

    expect(seo.title).toContain('Barbería');
    expect(seo.description).toContain(sampleCompany.name);
    expect(seo.h1).toContain('Barbería');
  });

  it('includes JSON-LD business schema and catalog', () => {
    const strategy = new BarberiaSeoStrategy();
    const seo = strategy.buildSeo({
      company: sampleCompany as any,
      services: sampleServices as any,
      route: {
        slug: sampleCompany.slug,
        locale: 'es',
        baseUrl: 'https://pymerp.cl',
        path: `/${sampleCompany.slug}/barberias`,
      },
    });

    const hasBusinessSchema = seo.jsonLd.some(
      (schema) => Array.isArray(schema['@type']) && schema['@type'].includes('HealthAndBeautyBusiness')
    );
    expect(hasBusinessSchema).toBe(true);
  });
});

vi.mock('../seoService', () => ({
  buildSeoData: vi.fn(async () => ({
    title: 'Barbería Central | Barbería en Providencia – Reserva Online',
    description: 'Reserva en Barbería Central (Providencia). Cortes, barba y estilismo.',
    keywords: ['barbería Providencia'],
    canonical: 'https://pymerp.cl/barberia-central/barberias',
    robots: 'index, follow',
    h1: 'Barbería Central – Barbería en Providencia',
    h2: 'Agenda online y servicios destacados',
    bodyText: 'Texto SEO de prueba.',
    og: {
      title: 'Barbería Central',
      description: 'Reserva en Barbería Central.',
      type: 'website',
      image: '/og-default.jpg',
      url: 'https://pymerp.cl/barberia-central/barberias',
      siteName: 'pymerp',
      locale: 'es_CL',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Barbería Central',
      description: 'Reserva en Barbería Central.',
      image: '/og-default.jpg',
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': ['HealthAndBeautyBusiness'],
        name: 'Barbería Central',
      },
    ],
  })),
}));

describe('public SEO handler', () => {
  it('renders HTML with meta tags and JSON-LD', async () => {
    process.env.PUBLIC_APP_ENTRY = '/assets/index-test.js';
    const { handlePublicSeoRequest } = await import('../handler');
    const req: any = {
      method: 'GET',
      path: '/barberia-central/barberias',
      query: {},
      get: (header: string) => {
        if (header === 'host') return 'pymerp.cl';
        if (header === 'x-forwarded-proto') return 'https';
        return '';
      },
    };

    const res: any = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: '',
      set(key: string, value: string) {
        this.headers[key] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(payload: string) {
        this.body = payload;
      },
    };

    await handlePublicSeoRequest(req, res);

    expect(res.statusCode).toBe(200);
    const html = String(res.body);
    expect(html).toContain('<title>');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('og:title');
  });
});

