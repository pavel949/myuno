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
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://myuno.app');

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
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : 'en_US'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
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
