import { buildSeoData } from './seoService';
import { renderSeoHtml } from './renderer';
import { withSpan } from './otel';

const resolveBaseUrl = (req: any): string => {
  const envBase = process.env.PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const proto = req.get('x-forwarded-proto') || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
};

const resolveLocale = (req: any): string => {
  const queryLocale = typeof req.query?.lang === 'string' ? req.query.lang : '';
  if (queryLocale) return queryLocale;
  const header = req.get('accept-language') || '';
  return header.split(',')[0] || 'es';
};

const appEntryCache = {
  value: '',
  expiresAt: 0,
};
const APP_ENTRY_TTL_MS = 60 * 60 * 1000;

const resolveAppEntry = async (baseUrl: string): Promise<string> => {
  const envEntry = process.env.PUBLIC_APP_ENTRY;
  if (envEntry) return envEntry;

  if (appEntryCache.value && Date.now() < appEntryCache.expiresAt) {
    return appEntryCache.value;
  }

  try {
    const response = await (globalThis as any).fetch(`${baseUrl}/index.html`, {
      headers: { 'user-agent': 'seo-renderer' },
    });
    if (response?.ok) {
      const html = await response.text();
      const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i);
      if (match && match[1]) {
        appEntryCache.value = match[1];
        appEntryCache.expiresAt = Date.now() + APP_ENTRY_TTL_MS;
        return match[1];
      }
    }
  } catch {
    // Fallback below
  }

  return '/assets/main.js';
};

const resolveAppRootId = (): string => {
  return process.env.PUBLIC_APP_ROOT_ID || 'root';
};

const setHtmlHeaders = (res: any) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
};

export const handlePublicSeoRequest = async (req: any, res: any) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  await withSpan('publicweb-seo.request', async () => {
    const baseUrl = resolveBaseUrl(req);
    const locale = resolveLocale(req);
    const path = decodeURIComponent(req.path);

    if (path === '/health') {
      res.status(200).send('ok');
      return;
    }

    const barberiasMatch = path.match(/^\/([^/]+)\/barberias\/?$/);
    if (barberiasMatch) {
      const slug = barberiasMatch[1];
      const routePath = `/${slug}/barberias`;
      const route = { slug, locale, baseUrl, path: routePath };
      const seo = await buildSeoData(slug, 'barberias', route);
      if (!seo) {
        res.status(404).send('Not found');
        return;
      }
      const appEntry = await resolveAppEntry(baseUrl);
      const html = renderSeoHtml(seo, appEntry, resolveAppRootId(), locale);
      setHtmlHeaders(res);
      res.status(200).send(html);
      return;
    }

    const serviceMatch = path.match(/^\/([^/]+)\/barberias\/servicios\/([^/]+)\/?$/);
    if (serviceMatch) {
      const slug = serviceMatch[1];
      const serviceSlug = serviceMatch[2];
      const routePath = `/${slug}/barberias/servicios/${serviceSlug}`;
      const route = { slug, locale, baseUrl, path: routePath };
      const seo = await buildSeoData(slug, 'barberias', route, serviceSlug);
      if (!seo) {
        res.status(404).send('Not found');
        return;
      }
      const appEntry = await resolveAppEntry(baseUrl);
      const html = renderSeoHtml(seo, appEntry, resolveAppRootId(), locale);
      setHtmlHeaders(res);
      res.status(200).send(html);
      return;
    }

    res.status(404).send('Not found');
  });
};

