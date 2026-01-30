import type { SeoData } from './types';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderMeta = (name: string, content: string) =>
  `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;

const renderPropertyMeta = (property: string, content: string) =>
  `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`;

const renderJsonLd = (json: Record<string, unknown>) =>
  `<script type="application/ld+json">${JSON.stringify(json)}</script>`;

export const renderSeoHtml = (
  seo: SeoData,
  appEntry: string,
  appRootId: string,
  locale: string = 'es'
): string => {
  const keywords = seo.keywords.join(', ');
  const jsonLdBlocks = seo.jsonLd.map(renderJsonLd).join('');
  const htmlLang = locale.split('-')[0] || 'es';

  return `<!doctype html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(seo.title)}</title>
    ${renderMeta('description', seo.description)}
    ${renderMeta('keywords', keywords)}
    ${renderMeta('robots', seo.robots)}
    <link rel="canonical" href="${escapeHtml(seo.canonical)}" />
    ${renderPropertyMeta('og:title', seo.og.title)}
    ${renderPropertyMeta('og:description', seo.og.description)}
    ${renderPropertyMeta('og:type', seo.og.type)}
    ${renderPropertyMeta('og:url', seo.og.url)}
    ${renderPropertyMeta('og:image', seo.og.image)}
    ${renderPropertyMeta('og:site_name', seo.og.siteName)}
    ${renderPropertyMeta('og:locale', seo.og.locale)}
    ${renderMeta('twitter:card', seo.twitter.card)}
    ${renderMeta('twitter:title', seo.twitter.title)}
    ${renderMeta('twitter:description', seo.twitter.description)}
    ${renderMeta('twitter:image', seo.twitter.image)}
    ${jsonLdBlocks}
  </head>
  <body>
    <main>
      <h1>${escapeHtml(seo.h1)}</h1>
      ${seo.h2 ? `<h2>${escapeHtml(seo.h2)}</h2>` : ''}
      <p>${escapeHtml(seo.bodyText)}</p>
    </main>
    <div id="${escapeHtml(appRootId)}"></div>
    <script type="module" src="${escapeHtml(appEntry)}"></script>
  </body>
</html>`;
};

