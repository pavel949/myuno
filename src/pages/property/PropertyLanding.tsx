/**
 * PropertyLanding — the Real Estate Hub entry at /property.
 *
 * Composes the hub from small pieces under components/property/hub:
 * persona lanes (seeker / capital / pro), live featured rows, a trust strip,
 * and a ClearView callout. Consumer-first ordering; persona/pro lanes lower.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';
import { SeekerLane, CapitalLane, ProLane } from '@/components/property/hub';

export default function PropertyLanding() {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <>
      <SEOHead
        title={isRu ? 'Недвижимость — myUNO' : 'Property — myUNO'}
        description={isRu
          ? 'Аренда, покупка, инвестиции; коммерция и земля; кабинеты собственника, УК и застройщика — единая точка входа на Пхукете.'
          : 'Rent, buy, invest, commercial & land, plus pro tools for owners, MCs, and developers — one Phuket property hub.'}
      />
      <div className={cn(PROPERTY_VERTICAL_PAGE_GUTTER, 'py-8 pb-24')}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          {t('propertyHub.landing.heading')}
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-2xl leading-relaxed">
          {t('propertyHub.landing.subheading')}
        </p>

        <div className="space-y-10">
          <SeekerLane t={t} />
          <CapitalLane t={t} />
          <ProLane t={t} />
        </div>

        <Link
          to="/my-property"
          className="mt-10 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Home className="h-4 w-4" />
          {t('propertyHub.landing.myPropertyCta')}
        </Link>
      </div>
    </>
  );
}
