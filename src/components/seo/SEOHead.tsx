import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  jsonLd?: object;
}

const defaultMeta = {
  en: {
    title: 'myUNO - All Services in One',
    description: 'Your life abroad, simplified. Book transport, tours, restaurants, beauty services, and more in one app.',
  },
  ru: {
    title: 'myUNO - Все услуги в одном приложении',
    description: 'Ваша жизнь за рубежом стала проще. Бронируйте транспорт, туры, рестораны, салоны красоты и многое другое.',
  },
};

export function SEOHead({
  title,
  description,
  image = 'https://myuno.app/og-image.png',
  url,
  type = 'website',
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const { language } = useLanguage();
  const lang = language === 'ru' ? 'ru' : 'en';
  
  const finalTitle = title 
    ? `${title} | myUNO`
    : defaultMeta[lang].title;
  
  const finalDescription = description || defaultMeta[lang].description;
  
  // Always use production domain for canonical/OG URLs
  const BASE = 'https://myuno.app';
  const basePath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const canonicalUrl = url || `${BASE}${basePath}`;
  
  // Build hreflang alternate URLs
  const hreflangUrls = {
    en: `${BASE}${basePath}?lang=en`,
    ru: `${BASE}${basePath}?lang=ru`,
    th: `${BASE}${basePath}?lang=th`,
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <html lang={lang} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="myUNO" />
      <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : 'en_US'} />
      <meta property="og:locale:alternate" content={lang === 'ru' ? 'en_US' : 'ru_RU'} />
      <meta property="og:locale:alternate" content="th_TH" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@myUNOapp" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang alternate links — th omitted until Thai content ships (Trust Stack audit A3) */}
      <link rel="alternate" hrefLang="en" href={hreflangUrls.en} />
      <link rel="alternate" hrefLang="ru" href={hreflangUrls.ru} />
      <link rel="alternate" hrefLang="x-default" href={hreflangUrls.en} />
      
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Common JSON-LD schemas
export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'myUNO',
  url: 'https://myuno.app',
  logo: 'https://myuno.app/icons/icon-512x512.png',
  sameAs: [
    'https://twitter.com/myUNOapp',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Russian'],
  },
});

export const createServiceSchema = (service: {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  description: service.description,
  provider: {
    '@type': 'Organization',
    name: 'myUNO',
  },
  ...(service.price && {
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: service.currency || 'THB',
    },
  }),
  ...(service.rating && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: service.rating,
      reviewCount: service.reviewCount || 0,
    },
  }),
  ...(service.image && { image: service.image }),
});

export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const createRealEstateListingSchema = (listing: {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  image?: string;
  url?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  address?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: listing.name,
  description: listing.description,
  ...(listing.url && { url: listing.url }),
  ...(listing.image && { image: listing.image }),
  ...(listing.price && {
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency || 'THB',
    },
  }),
  ...(listing.address && {
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.address,
      addressRegion: 'Phuket',
      addressCountry: 'TH',
    },
  }),
  ...(listing.bedrooms && { numberOfBedrooms: listing.bedrooms }),
  ...(listing.bathrooms && { numberOfBathroomsTotal: listing.bathrooms }),
  ...(listing.area && { floorSize: { '@type': 'QuantitativeValue', value: listing.area, unitCode: 'MTK' } }),
});

export const createTouristAttractionSchema = (attraction: {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  image?: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: attraction.name,
  description: attraction.description,
  ...(attraction.url && { url: attraction.url }),
  ...(attraction.image && { image: attraction.image }),
  ...(attraction.price && {
    offers: {
      '@type': 'Offer',
      price: attraction.price,
      priceCurrency: attraction.currency || 'THB',
    },
  }),
  ...(attraction.rating && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: attraction.rating,
      reviewCount: attraction.reviewCount || 0,
    },
  }),
  isAccessibleForFree: false,
  touristType: 'Adventure',
});

export const createProductSchema = (product: {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  image?: string;
  url?: string;
  brand?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  ...(product.image && { image: product.image }),
  ...(product.url && { url: product.url }),
  ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
  ...(product.price && {
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'THB',
      availability: 'https://schema.org/InStock',
    },
  }),
});
