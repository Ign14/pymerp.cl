export type SeoCategory = 'barberias';

export interface SeoRouteParams {
  slug: string;
  serviceSlug?: string;
  locale: string;
  baseUrl: string;
  path: string;
}

export interface SeoCompany {
  id: string;
  name: string;
  slug: string;
  publicEnabled?: boolean;
  address?: string | null;
  comuna?: string | null;
  region?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: { latitude: number; longitude: number } | null;
  latitude?: number | null;
  longitude?: number | null;
  weekday_days?: string[] | null;
  weekday_open_time?: string | null;
  weekday_close_time?: string | null;
  weekend_days?: string[] | null;
  weekend_open_time?: string | null;
  weekend_close_time?: string | null;
  social_links?: string[] | null;
  updated_at?: any;
  categoryId?: string | null;
}

export interface SeoServiceItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  estimated_duration_minutes?: number | null;
  status?: string | null;
  tags?: string[] | null;
  slug?: string | null;
  updated_at?: any;
  popularity?: number | null;
  bookings_count?: number | null;
}

export interface SeoData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  h1: string;
  h2?: string;
  bodyText: string;
  og: {
    title: string;
    description: string;
    type: 'website' | 'article';
    image: string;
    url: string;
    siteName: string;
    locale: string;
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  jsonLd: Record<string, unknown>[];
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export interface SeoStrategyInput {
  company: SeoCompany;
  services: SeoServiceItem[];
  route: SeoRouteParams;
  service?: SeoServiceItem | null;
}

export interface SeoStrategy {
  category: SeoCategory;
  buildSeo(input: SeoStrategyInput): SeoData;
}

