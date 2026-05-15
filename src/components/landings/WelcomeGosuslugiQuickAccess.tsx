/**
 * WelcomeGosuslugiQuickAccess — catalog-forward strip (sections / situations / categories).
 * Exported for reuse on marketing surfaces; optional on WelcomeLanding itself.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { LandingContainer, LandingSection } from './LandingPrimitives';
import { cn } from '@/lib/utils';

export function WelcomeGosuslugiQuickAccess() {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const { clusters, categories } = useCatalogFromDB();

  const sectionCount = clusters.length;
  const categoryCount = categories.length;

  const rows = [
    { label: t('welcome.gosuslugi.sections'), value: sectionCount, href: `${APP_ROUTES.DISCOVER}?from=welcome` },
    {
      label: t('welcome.gosuslugi.situations'),
      value: '20+',
      href: `${APP_ROUTES.DISCOVER}?from=welcome&view=situations`,
    },
    { label: t('welcome.gosuslugi.categories'), value: categoryCount, href: `${APP_ROUTES.DISCOVER}?from=welcome&view=categories` },
  ];

  return (
    <LandingSection>
      <LandingContainer className="py-10 sm:py-12">
        <div className="mb-4 space-y-1">
          <h2 className="font-display text-h3 font-normal tracking-tight text-foreground">{t('welcome.gosuslugi.title')}</h2>
          <p className="max-w-2xl font-sans text-body-sm text-muted-foreground">{t('welcome.gosuslugi.subtitle')}</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
          {rows.map((row) => (
            <Link
              key={row.label}
              to={row.href}
              className={cn(
                'min-w-[140px] shrink-0 rounded-none border border-border bg-card px-4 py-3 transition-colors',
                'hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-w-0',
              )}
            >
              <div className="font-mono text-h3 font-medium tabular-nums text-foreground">{row.value}</div>
              <div className="mt-0.5 font-sans text-caption text-muted-foreground">{row.label}</div>
            </Link>
          ))}
        </div>
        <p className="mt-3 font-sans text-caption text-muted-foreground/80">{t('welcome.gosuslugi.scrollHint')}</p>
        <div className="mt-4">
          <Link
            to={APP_ROUTES.DISCOVER}
            className="inline-flex items-center font-sans text-body-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {isRu ? 'Открыть навигатор' : 'Open navigator'}
          </Link>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
