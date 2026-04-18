/**
 * PropertyLanding — neutral entry: B2C scenarios + B2B / owner paths with clear value props.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  CalendarClock,
  ShoppingCart,
  Building2,
  ArrowRightLeft,
  TrendingUp,
  Home,
  ChevronRight,
  Construction,
  Briefcase,
  KeyRound,
  CirclePlus,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';

interface HubCardDef {
  to: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
}

const SEEKER_CARDS: HubCardDef[] = [
  {
    to: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`,
    icon: CalendarClock,
    titleKey: 'propertyHub.landing.shortTerm.title',
    descKey: 'propertyHub.landing.shortTerm.desc',
  },
  {
    to: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`,
    icon: CalendarRange,
    titleKey: 'propertyHub.landing.longTerm.title',
    descKey: 'propertyHub.landing.longTerm.desc',
  },
  {
    to: `${APP_ROUTES.PROPERTY_BROWSE}?mode=buy`,
    icon: ShoppingCart,
    titleKey: 'propertyHub.landing.buy.title',
    descKey: 'propertyHub.landing.buy.desc',
  },
  {
    to: APP_ROUTES.OFFPLAN,
    icon: Building2,
    titleKey: 'propertyHub.landing.newBuild.title',
    descKey: 'propertyHub.landing.newBuild.desc',
  },
  {
    to: APP_ROUTES.RESALE,
    icon: ArrowRightLeft,
    titleKey: 'propertyHub.landing.resale.title',
    descKey: 'propertyHub.landing.resale.desc',
  },
  {
    to: APP_ROUTES.INVEST,
    icon: TrendingUp,
    titleKey: 'propertyHub.landing.invest.title',
    descKey: 'propertyHub.landing.invest.desc',
  },
];

const PRO_CARDS: HubCardDef[] = [
  {
    to: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,
    icon: Construction,
    titleKey: 'propertyHub.landing.developer.title',
    descKey: 'propertyHub.landing.developer.desc',
  },
  {
    to: APP_ROUTES.MC,
    icon: Briefcase,
    titleKey: 'propertyHub.landing.mc.title',
    descKey: 'propertyHub.landing.mc.desc',
  },
  {
    to: APP_ROUTES.OWNER,
    icon: KeyRound,
    titleKey: 'propertyHub.landing.owner.title',
    descKey: 'propertyHub.landing.owner.desc',
  },
  {
    to: APP_ROUTES.LIST_WITH_US,
    icon: CirclePlus,
    titleKey: 'propertyHub.landing.listWithUs.title',
    descKey: 'propertyHub.landing.listWithUs.desc',
  },
];

function HubCardGrid({
  items,
  t,
}: {
  items: HubCardDef[];
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ to, icon: Icon, titleKey, descKey }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'group flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all',
            'hover:border-primary/40 hover:shadow-md'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold leading-snug group-hover:text-primary transition-colors">
                {t(titleKey)}
              </span>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PropertyLanding() {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader showBottomNav showFooter>
      <SEOHead
        title={isRu ? 'Недвижимость — myUNO' : 'Property — myUNO'}
        description={isRu
          ? 'Аренда, покупка, инвестиции; кабинеты собственника, УК и застройщика — единая точка входа на Пхукете.'
          : 'Rent, buy, invest, and professional tools for owners, MCs, and developers — one Phuket property hub.'}
      />
      <div className={cn(PROPERTY_VERTICAL_PAGE_GUTTER, 'py-8 pb-24')}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          {t('propertyHub.landing.heading')}
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-2xl leading-relaxed">
          {t('propertyHub.landing.subheading')}
        </p>

        <section aria-labelledby="property-seekers-heading" className="mb-10">
          <h2
            id="property-seekers-heading"
            className="text-base font-semibold tracking-tight mb-3 text-foreground"
          >
            {t('propertyHub.landing.sectionSeekers')}
          </h2>
          <HubCardGrid items={SEEKER_CARDS} t={t} />
        </section>

        <section aria-labelledby="property-pros-heading">
          <h2
            id="property-pros-heading"
            className="text-base font-semibold tracking-tight mb-3 text-foreground"
          >
            {t('propertyHub.landing.sectionPros')}
          </h2>
          <HubCardGrid items={PRO_CARDS} t={t} />
        </section>

        <Link
          to="/property/my"
          className="mt-10 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Home className="h-4 w-4" />
          {t('propertyHub.landing.myPropertyCta')}
        </Link>
      </div>
    </AppLayout>
  );
}
