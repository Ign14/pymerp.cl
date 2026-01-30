import crypto from 'crypto';
import { trace } from '@opentelemetry/api';
import { BarberiaSeoStrategy } from './barberiaStrategy';
import type { SeoCategory, SeoData, SeoRouteParams } from './types';
import { getSeoCache, setSeoCache } from './seoCache';
import { listCompanyServices, resolveCompanyBySlug, resolveLatestUpdate, resolveServiceBySlug } from './data';

const strategies = {
  barberias: new BarberiaSeoStrategy(),
};
const tracer = trace.getTracer('publicweb-seo');

const hashUpdateKey = (value: string): string => {
  return crypto.createHash('sha1').update(value).digest('hex');
};

const buildCacheKey = (
  companyId: string,
  category: SeoCategory,
  locale: string,
  updatedHash: string,
  routePath: string
) => `seo:${companyId}:${category}:${locale}:${updatedHash}:${routePath}`;

export const buildSeoData = async (
  slug: string,
  category: SeoCategory,
  route: SeoRouteParams,
  serviceSlug?: string
): Promise<SeoData | null> => {
  const company = await resolveCompanyBySlug(slug);
  if (!company || company.publicEnabled === false) return null;
  if (category === 'barberias' && company.categoryId && company.categoryId !== 'barberias') {
    return null;
  }

  const services = await listCompanyServices(company.id);
  const service = serviceSlug ? resolveServiceBySlug(services, serviceSlug) : null;
  if (serviceSlug && !service) return null;

  const latestUpdate = resolveLatestUpdate(company, services);
  const updateHash = hashUpdateKey(
    `${company.id}:${latestUpdate?.toISOString() || '0'}:${route.path}`
  );
  const cacheKey = buildCacheKey(company.id, category, route.locale, updateHash, route.path);

  const cacheSpan = tracer.startSpan('publicweb-seo.cache');
  const cached = await getSeoCache(cacheKey);
  if (cached) {
    cacheSpan.setAttribute('cache.hit', true);
    cacheSpan.end();
    return cached;
  }
  cacheSpan.setAttribute('cache.hit', false);
  cacheSpan.end();

  const strategy = strategies[category];
  const seo = strategy.buildSeo({
    company,
    services,
    route,
    service,
  });

  await setSeoCache(cacheKey, seo);
  return seo;
};

