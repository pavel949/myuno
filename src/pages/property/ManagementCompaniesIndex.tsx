/**
 * ManagementCompaniesIndex — public directory of management companies.
 * Route: /property/companies. Lists active companies, each linking to its
 * public profile at /company/:slug.
 */
import React from 'react';
import { SEOHead, createBreadcrumbSchema } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { ManagementCompanyCard } from '@/components/property/ManagementCompanyCard';
import { APP_ROUTES } from '@/lib/config/routes';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';
import { cn } from '@/lib/utils';

const SITE = 'https://www.myuno.app';

export default function ManagementCompaniesIndex() {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
  const { data = [], isLoading } = useManagementCompanies();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      createBreadcrumbSchema([
        { name: isRu ? 'Недвижимость' : 'Property', url: `${SITE}${APP_ROUTES.PROPERTY}` },
        { name: t('mcDirectory.title'), url: `${SITE}${APP_ROUTES.PROPERTY_COMPANIES}` },
      ]),
      {
        '@type': 'ItemList',
        name: t('mcDirectory.title'),
        numberOfItems: data.length,
        itemListElement: data.map((company, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE}${APP_ROUTES.MANAGEMENT_COMPANY(company.slug)}`,
          name: isRu ? company.name_ru : company.name_en,
        })),
      },
    ],
  };

  return (
    <>
      <SEOHead
        title={isRu ? 'Управляющие компании — myUNO' : 'Management Companies — myUNO'}
        description={isRu
          ? 'Каталог проверенных управляющих компаний Пхукета: рейтинг, район, портфель объектов.'
          : 'Directory of verified Phuket management companies — ratings, districts, and managed portfolios.'}
        jsonLd={jsonLd}
      />
      <div className={cn(PROPERTY_VERTICAL_PAGE_GUTTER, 'py-8 pb-24')}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          {t('mcDirectory.title')}
        </h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-2xl leading-relaxed">
          {t('mcDirectory.subtitle')}
        </p>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-none bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-none border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {t('mcDirectory.empty')}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((company) => (
              <ManagementCompanyCard key={company.id} company={company} isRu={isRu} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
