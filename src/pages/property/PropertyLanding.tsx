/**
 * PropertyLanding — the Real Estate Hub entry at /property.
 *
 * Composes the hub from small pieces under components/property/hub:
 * persona lanes (seeker / capital / pro), live featured rows, a trust strip,
 * and a ClearView callout. Consumer-first ordering; persona/pro lanes lower.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BadgeCheck, Scale, ShieldCheck, MapPin } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';
import {
  HubHero,
  SeekerLane,
  CapitalLane,
  ProLane,
  RentFeaturedRow,
  OffplanFeaturedRow,
  ResaleFeaturedRow,
  InvestTeaserRow,
  HubTrustStrip,
  ClearViewCallout,
} from '@/components/property/hub';

export default function PropertyLanding() {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  const trustItems = [
    { icon: BadgeCheck, label: t('propertyHub.landing.trust.verified') },
    { icon: Scale, label: t('propertyHub.landing.trust.escrow') },
    { icon: ShieldCheck, label: t('propertyHub.landing.trust.clearview') },
    { icon: MapPin, label: t('propertyHub.landing.trust.localTeam') },
  ];

  return (
    <>
      <SEOHead
        title={isRu ? 'Недвижимость — myUNO' : 'Property — myUNO'}
        description={isRu
          ? 'Аренда, покупка, инвестиции; коммерция и земля; кабинеты собственника, УК и застройщика — единая точка входа на Пхукете.'
          : 'Rent, buy, invest, commercial & land, plus pro tools for owners, MCs, and developers — one Phuket property hub.'}
      />
      <div className={cn(PROPERTY_VERTICAL_PAGE_GUTTER, 'py-8 pb-24 space-y-10')}>
        <HubHero t={t} isRu={isRu} />
        <SeekerLane t={t} />
        <RentFeaturedRow t={t} />
        <OffplanFeaturedRow t={t} />
        <ResaleFeaturedRow t={t} />
        <HubTrustStrip items={trustItems} ariaLabel={t('propertyHub.landing.trust.clearview')} />
        <ClearViewCallout
          title={t('propertyHub.landing.clearview.title')}
          desc={t('propertyHub.landing.clearview.desc')}
          ctaLabel={t('propertyHub.landing.clearview.cta')}
          ctaTo={APP_ROUTES.CLEARVIEW}
          secondaryLabel={t('propertyHub.landing.clearview.why')}
          secondaryTo={APP_ROUTES.WHY_MYUNO}
        />
        <InvestTeaserRow t={t} />
        <CapitalLane t={t} />
        <ProLane t={t} />

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
