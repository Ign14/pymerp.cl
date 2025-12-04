import { SchemaOrg } from './schema';

export const DEFAULT_SITE_URL = 'https://agendaweb.app';
export const DEFAULT_BRAND_NAME = 'AgendaWeb';

export function formatSeoTitle(title: string, brand: string = DEFAULT_BRAND_NAME): string {
  const normalizedTitle = title.trim();
  return normalizedTitle.toLowerCase().includes(brand.toLowerCase())
    ? normalizedTitle
    : `${normalizedTitle} | ${brand}`;
}

export function resolveFullUrl(preferredUrl?: string, fallback: string = DEFAULT_SITE_URL): string {
  if (preferredUrl) return preferredUrl;
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }
  return fallback;
}

export function resolveCanonicalUrl(canonical?: string, fullUrl?: string): string {
  if (canonical) return canonical;
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return fullUrl || DEFAULT_SITE_URL;
}

export function normalizeSchemas(schema?: SchemaOrg | SchemaOrg[] | null): SchemaOrg[] {
  if (!schema) return [];
  return Array.isArray(schema) ? schema : [schema];
}

export function serializeSchemas(schema?: SchemaOrg | SchemaOrg[] | null): string[] {
  return normalizeSchemas(schema).map(s => JSON.stringify(s, null, 2));
}

export function setMetaTag(key: string, value: string, attr: 'name' | 'property') {
  if (!value || typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

export function setLinkTag(rel: string, href: string) {
  if (!href || typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export function upsertStructuredData(structuredData: unknown, id: string) {
  if (typeof document === 'undefined') return;

  const existingScript = document.head.querySelector<HTMLScriptElement>(
    `script[data-meta-id="${id}"]`
  );

  if (structuredData) {
    const script = existingScript || document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.metaId = id;
    script.textContent = typeof structuredData === 'string'
      ? structuredData
      : JSON.stringify(structuredData);
    if (!existingScript) document.head.appendChild(script);
  } else if (existingScript) {
    existingScript.remove();
  }
}
