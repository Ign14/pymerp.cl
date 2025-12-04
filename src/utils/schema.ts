export interface SchemaOrg {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

export function createOrganizationSchema(data: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}): SchemaOrg {
  const schema: SchemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
  };

  if (data.description) schema.description = data.description;
  if (data.email) schema.email = data.email;
  if (data.phone) schema.telephone = data.phone;
  
  if (data.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: data.address.street,
      addressLocality: data.address.city,
      addressRegion: data.address.region,
      postalCode: data.address.postalCode,
      addressCountry: data.address.country
    };
  }

  if (data.socialMedia) {
    const sameAs = [];
    if (data.socialMedia.facebook) sameAs.push(data.socialMedia.facebook);
    if (data.socialMedia.twitter) sameAs.push(data.socialMedia.twitter);
    if (data.socialMedia.instagram) sameAs.push(data.socialMedia.instagram);
    if (data.socialMedia.linkedin) sameAs.push(data.socialMedia.linkedin);
    if (sameAs.length > 0) schema.sameAs = sameAs;
  }

  return schema;
}

export function createLocalBusinessSchema(data: {
  name: string;
  description: string;
  image: string;
  url: string;
  phone?: string;
  priceRange?: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  rating?: {
    value: number;
    count: number;
  };
}): SchemaOrg {
  const schema: SchemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    image: data.image,
    url: data.url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.street,
      addressLocality: data.address.city,
      addressRegion: data.address.region,
      postalCode: data.address.postalCode,
      addressCountry: data.address.country
    }
  };

  if (data.phone) schema.telephone = data.phone;
  if (data.priceRange) schema.priceRange = data.priceRange;
  
  if (data.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude
    };
  }

  if (data.openingHours && data.openingHours.length > 0) {
    schema.openingHoursSpecification = data.openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0],
      opens: hours.split(' ')[1],
      closes: hours.split(' ')[2]
    }));
  }

  if (data.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.value,
      reviewCount: data.rating.count
    };
  }

  return schema;
}

export function createServiceSchema(data: {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  serviceType: string;
  areaServed?: string;
  price?: {
    amount: number;
    currency: string;
  };
  duration?: string;
}): SchemaOrg {
  const schema: SchemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    serviceType: data.serviceType,
    provider: {
      '@type': 'Organization',
      name: data.provider.name,
      url: data.provider.url
    }
  };

  if (data.areaServed) schema.areaServed = data.areaServed;
  if (data.duration) schema.duration = data.duration;
  
  if (data.price) {
    schema.offers = {
      '@type': 'Offer',
      price: data.price.amount,
      priceCurrency: data.price.currency
    };
  }

  return schema;
}

export function createProductSchema(data: {
  name: string;
  description: string;
  image: string;
  sku?: string;
  brand?: string;
  price: {
    amount: number;
    currency: string;
  };
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
}): SchemaOrg {
  const schema: SchemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: data.price.amount,
      priceCurrency: data.price.currency,
      availability: `https://schema.org/${data.availability || 'InStock'}`
    }
  };

  if (data.sku) schema.sku = data.sku;
  if (data.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: data.brand
    };
  }

  if (data.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.value,
      reviewCount: data.rating.count
    };
  }

  return schema;
}

export function createWebSiteSchema(options: {
  name: string;
  url: string;
  description?: string;
  searchActionPath?: string;
}): SchemaOrg {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name,
    url: options.url,
    description: options.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${options.url}${options.searchActionPath || '/buscar?q={search_term_string}'}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function createBreadcrumbSchema(items: Array<{
  name: string;
  url: string;
}>): SchemaOrg {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function createFAQSchema(faqs: Array<{
  question: string;
  answer: string;
}>): SchemaOrg {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function createArticleSchema(options: {
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.title,
    description: options.description,
    image: options.image,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    author: {
      '@type': 'Person',
      name: options.author.name,
      url: options.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: options.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: options.publisher.logo
      }
    }
  };
}
