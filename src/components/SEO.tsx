import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { 
  formatSeoTitle, 
  resolveCanonicalUrl, 
  resolveFullUrl, 
  serializeSchemas 
} from '../utils/seo';
import type { SchemaOrg } from '../utils/schema';

export interface SEOProps {
  // Basic Meta Tags
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  
  // Open Graph / Facebook
  ogType?: 'website' | 'article' | 'profile' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  ogUrl?: string;
  
  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  
  // Additional Meta
  canonical?: string;
  robots?: string;
  language?: string;
  viewport?: string;
  
  // Schema.org Structured Data
  schema?: SchemaOrg | SchemaOrg[];
  
  // Custom meta tags
  customMeta?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

/**
 * Componente SEO Enterprise-Grade
 * 
 * Gestiona todos los meta tags necesarios para optimización SEO incluyendo:
 * - Meta tags básicos (title, description, keywords)
 * - Open Graph para redes sociales
 * - Twitter Cards
 * - Schema.org structured data
 * - Canonical URLs
 * - Robots directives
 * 
 * @example
 * ```tsx
 * <SEO
 *   title="Mi Empresa - Agenda Online"
 *   description="Sistema de agendamiento para negocios"
 *   ogImage="/images/og-image.jpg"
 *   schema={{
 *     '@context': 'https://schema.org',
 *     '@type': 'LocalBusiness',
 *     name: 'Mi Empresa'
 *   }}
 * />
 * ```
 */
export default function SEO({
  title,
  description,
  keywords,
  author = 'AgendaWeb',
  ogType = 'website',
  ogImage = '/og-default.jpg',
  ogImageAlt,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterSite = '@agendaweb',
  twitterCreator,
  canonical,
  robots = 'index, follow',
  language = 'es',
  viewport = 'width=device-width, initial-scale=1.0',
  schema,
  customMeta = []
}: SEOProps) {
  // Generar URL completa si es necesaria
  const fullUrl = useMemo(() => {
    return resolveFullUrl(ogUrl);
  }, [ogUrl]);

  // Generar canonical URL
  const canonicalUrl = useMemo(() => {
    return resolveCanonicalUrl(canonical, fullUrl);
  }, [canonical, fullUrl]);

  // Formatear título con sufijo
  const formattedTitle = useMemo(() => {
    return formatSeoTitle(title);
  }, [title]);

  // Serializar Schema.org JSON-LD
  const schemaMarkup = useMemo(() => {
    const serializedSchemas = serializeSchemas(schema);
    if (serializedSchemas.length === 0) return null;

    return serializedSchemas.map((schemaContent, index) => (
      <script 
        key={`schema-${index}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: schemaContent 
        }}
      />
    ));
  }, [schema]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} />
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      <meta name="viewport" content={viewport} />
      <meta name="robots" content={robots} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:site_name" content="AgendaWeb" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      
      {/* Additional Meta Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta name="theme-color" content="#2563eb" />
      
      {/* Custom Meta Tags */}
      {customMeta.map((meta, index) => {
        if (meta.name) {
          return <meta key={`custom-${index}`} name={meta.name} content={meta.content} />;
        }
        if (meta.property) {
          return <meta key={`custom-${index}`} property={meta.property} content={meta.content} />;
        }
        return null;
      })}
      
      {/* Schema.org Structured Data */}
      {schemaMarkup}
    </Helmet>
  );
}

export type { SchemaOrg } from '../utils/schema';
export {
  createOrganizationSchema,
  createLocalBusinessSchema,
  createServiceSchema,
  createProductSchema,
  createWebSiteSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createArticleSchema
} from '../utils/schema';
