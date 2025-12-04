import { useEffect } from 'react';
import { setLinkTag, setMetaTag, upsertStructuredData } from './seo';

type MetaParams = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  structuredData?: Record<string, unknown> | null;
  structuredDataId?: string;
};

export function usePageMeta({
  title,
  description,
  image = '/logopymerp.png',
  url,
  structuredData,
  structuredDataId = 'page-json-ld',
}: MetaParams) {
  useEffect(() => {
    const pageUrl = url || window.location.href;

    if (title) {
      document.title = title;
      setMetaTag('og:title', title, 'property');
      setMetaTag('twitter:title', title, 'name');
    }
    if (description) {
      setMetaTag('description', description, 'name');
      setMetaTag('og:description', description, 'property');
      setMetaTag('twitter:description', description, 'name');
    }
    if (image) {
      setMetaTag('og:image', image, 'property');
      setMetaTag('twitter:image', image, 'name');
    }
    if (pageUrl) {
      setMetaTag('og:url', pageUrl, 'property');
      setLinkTag('canonical', pageUrl);
    }

    upsertStructuredData(structuredData, structuredDataId);
  }, [title, description, image, url, structuredData, structuredDataId]);
}
