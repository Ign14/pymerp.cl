import { 
  SchemaOrg,
  createArticleSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createProductSchema,
  createServiceSchema,
  createWebSiteSchema
} from './schema';

/**
 * Helpers para generar Schema.org markup desde datos de Firestore
 */

export interface FirestoreService {
  id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  status: string;
  company_id: string;
}

export interface FirestoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  sku?: string;
  brand?: string;
  status: string;
  stock?: number;
  company_id: string;
}

export interface CompanyInfo {
  name: string;
  url: string;
}

/**
 * Genera Schema.org Service desde datos de Firestore
 */
export function generateServiceSchema(
  service: FirestoreService,
  company: CompanyInfo,
  areaServed?: string
): SchemaOrg {
  const durationISO = service.duration_minutes 
    ? `PT${service.duration_minutes}M` 
    : undefined;

  return createServiceSchema({
    name: service.name,
    description: service.description || `${service.name} - Servicio profesional`,
    provider: {
      name: company.name,
      url: company.url
    },
    serviceType: service.name,
    areaServed,
    price: service.price ? {
      amount: service.price,
      currency: 'CLP'
    } : undefined,
    duration: durationISO
  });
}

/**
 * Genera Schema.org Product desde datos de Firestore
 */
export function generateProductSchema(
  product: FirestoreProduct
): SchemaOrg {
  const availability = product.status === 'ACTIVE' && (product.stock === undefined || product.stock > 0)
    ? 'InStock'
    : 'OutOfStock';

  return createProductSchema({
    name: product.name,
    description: product.description || `${product.name} - Producto de calidad`,
    image: product.image_url || '/placeholder-product.jpg',
    sku: product.sku || product.id,
    brand: product.brand,
    price: {
      amount: product.price,
      currency: 'CLP'
    },
    availability
  });
}

/**
 * Genera array de schemas para múltiples servicios
 */
export function generateServicesSchemas(
  services: FirestoreService[],
  company: CompanyInfo,
  areaServed?: string
): SchemaOrg[] {
  return services
    .filter(s => s.status === 'ACTIVE')
    .map(service => generateServiceSchema(service, company, areaServed));
}

/**
 * Genera array de schemas para múltiples productos
 */
export function generateProductsSchemas(
  products: FirestoreProduct[]
): SchemaOrg[] {
  return products
    .filter(p => p.status === 'ACTIVE')
    .map(product => generateProductSchema(product));
}

/**
 * Genera WebSite schema para páginas principales
 */
export function generateWebSiteSchema(options: {
  name: string;
  url: string;
  description?: string;
  searchActionPath?: string;
}): SchemaOrg {
  return createWebSiteSchema(options);
}

/**
 * Genera BreadcrumbList schema para navegación
 */
export function generateBreadcrumbSchema(items: Array<{
  name: string;
  url: string;
}>): SchemaOrg {
  return createBreadcrumbSchema(items);
}

/**
 * Genera FAQPage schema
 */
export function generateFAQSchema(faqs: Array<{
  question: string;
  answer: string;
}>): SchemaOrg {
  return createFAQSchema(faqs);
}

/**
 * Genera Article schema para blog posts
 */
export function generateArticleSchema(options: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
}): SchemaOrg {
  return createArticleSchema(options);
}
