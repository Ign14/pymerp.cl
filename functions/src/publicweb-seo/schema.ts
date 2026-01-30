import type { SeoCompany, SeoRouteParams, SeoServiceItem } from './types';

const buildAddress = (company: SeoCompany) => {
  const street = company.address || undefined;
  const locality = company.comuna || undefined;
  const region = company.region || undefined;

  if (!street && !locality && !region) return undefined;

  return {
    '@type': 'PostalAddress',
    streetAddress: street,
    addressLocality: locality,
    addressRegion: region,
    addressCountry: 'CL',
  };
};

const buildGeo = (company: SeoCompany) => {
  const latitude = company.location?.latitude ?? company.latitude ?? undefined;
  const longitude = company.location?.longitude ?? company.longitude ?? undefined;
  if (latitude == null || longitude == null) return undefined;
  return {
    '@type': 'GeoCoordinates',
    latitude,
    longitude,
  };
};

const buildOpeningHours = (company: SeoCompany) => {
  const specs: Array<Record<string, unknown>> = [];
  const pushSpec = (days?: string[] | null, opens?: string | null, closes?: string | null) => {
    if (!days || days.length === 0 || !opens || !closes) return;
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days,
      opens,
      closes,
    });
  };

  pushSpec(company.weekday_days, company.weekday_open_time, company.weekday_close_time);
  pushSpec(company.weekend_days, company.weekend_open_time, company.weekend_close_time);

  return specs.length > 0 ? specs : undefined;
};

const buildOfferCatalog = (services: SeoServiceItem[]) => {
  if (services.length === 0) return undefined;

  return {
    '@type': 'OfferCatalog',
    name: 'Servicios de barbería',
    itemListElement: services.slice(0, 10).map((service) => ({
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: service.price ?? undefined,
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description || undefined,
      },
    })),
  };
};

export const buildBarberiaSchema = (
  company: SeoCompany,
  route: SeoRouteParams,
  services: SeoServiceItem[]
) => {
  const address = buildAddress(company);
  const geo = buildGeo(company);
  const openingHoursSpecification = buildOpeningHours(company);
  const offerCatalog = buildOfferCatalog(services);
  const sameAs = company.social_links?.filter(Boolean) || [];

  return {
    '@context': 'https://schema.org',
    '@type': ['HealthAndBeautyBusiness', 'BeautySalon'],
    name: company.name,
    url: route.baseUrl + route.path,
    telephone: company.phone || company.whatsapp || undefined,
    address,
    geo,
    openingHoursSpecification,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    hasOfferCatalog: offerCatalog,
  };
};

export const buildBarberiaServiceSchema = (
  company: SeoCompany,
  route: SeoRouteParams,
  service: SeoServiceItem
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description || undefined,
    provider: {
      '@type': 'LocalBusiness',
      name: company.name,
      url: route.baseUrl + route.path,
    },
    offers: service.price != null
      ? {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'CLP',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
};

export const buildBreadcrumbSchema = (route: SeoRouteParams, crumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: route.baseUrl + crumb.url,
    })),
  };
};

