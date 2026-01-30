import type { SeoStrategy, SeoStrategyInput, SeoData } from './types';
import {
  buildBarberiaTitle,
  buildBarberiaDescription,
  buildBarberiaH1,
  buildBarberiaKeywords,
  buildBarberiaBodyText,
  resolveLocationLabel,
} from './templates';
import { buildBarberiaSchema, buildBarberiaServiceSchema, buildBreadcrumbSchema } from './schema';

const DEFAULT_OG_IMAGE = '/og-default.jpg';

export class BarberiaSeoStrategy implements SeoStrategy {
  category: 'barberias' = 'barberias';

  buildSeo(input: SeoStrategyInput): SeoData {
    const { company, services, route, service } = input;
    const locationLabel = resolveLocationLabel(company);
    const topServices = services.slice(0, 3);

    const title = service
      ? `${service.name} en ${company.name} | Barbería${locationLabel ? ` en ${locationLabel}` : ''} – Reserva Online`
      : buildBarberiaTitle(company, locationLabel);

    const description = service
      ? `Reserva ${service.name} en ${company.name}${locationLabel ? ` (${locationLabel})` : ''}. Agenda online con precios y duración estimada.`
      : buildBarberiaDescription(company, locationLabel, topServices);

    const canonical = route.baseUrl + route.path;
    const h1 = service ? `${service.name} – ${company.name}` : buildBarberiaH1(company, locationLabel);
    const h2 = service ? 'Detalle del servicio' : 'Agenda online y servicios destacados';
    const bodyText = service
      ? buildBarberiaBodyText(company, locationLabel, [service])
      : buildBarberiaBodyText(company, locationLabel, topServices);

    const keywords = buildBarberiaKeywords(company, locationLabel);
    const ogTitle = title;
    const ogDescription = description;
    const ogImage = DEFAULT_OG_IMAGE;

    const breadcrumbs = service
      ? [
          { name: 'Inicio', url: `/${company.slug}` },
          { name: 'Barberías', url: `/${company.slug}/barberias` },
          { name: service.name, url: route.path },
        ]
      : [
          { name: 'Inicio', url: `/${company.slug}` },
          { name: 'Barberías', url: route.path },
        ];

    const jsonLd = service
      ? [
          buildBarberiaSchema(company, route, services),
          buildBarberiaServiceSchema(company, route, service),
          buildBreadcrumbSchema(route, breadcrumbs),
        ]
      : [
          buildBarberiaSchema(company, route, services),
          buildBreadcrumbSchema(route, breadcrumbs),
        ];

    return {
      title,
      description,
      keywords,
      canonical,
      robots: 'index, follow',
      h1,
      h2,
      bodyText,
      og: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        image: ogImage,
        url: canonical,
        siteName: 'pymerp',
        locale: 'es_CL',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
      },
      jsonLd,
      breadcrumbs,
    };
  }
}

