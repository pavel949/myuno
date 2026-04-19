/**
 * PropertyLanding — neutral entry: B2C scenarios + Capital (persona-gated) + B2B/owner paths.
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
  Trees,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';

interface HubCardDef {
  to: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  highlight?: boolean;
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

const CAPITAL_CARDS: HubCardDef[] = [
  {
    to: APP_ROUTES.COMMERCIAL,
    icon: Briefcase,
    titleKey: 'propertyHub.landing.commercial.title',
    descKey: 'propertyHub.landing.commercial.desc',
    highlight: true,
  },
  {
    to: APP_ROUTES.LAND,
    icon: Trees,
    titleKey: 'propertyHub.landing.land.title',
    descKey: 'propertyHub.landing.land.desc',
    highlight: true,
  },
  {
    to: `${APP_ROUTES.COMMERCIAL}?intent=sale&minCap=6`,
    icon: TrendingUp,
    titleKey: 'propertyHub.landing.investmentGrade.title',
    descKey: 'propertyHub.landing.investmentGrade.desc',
    highlight: true,
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
      {items.map(({ to, icon: Icon, titleKey, descKey, highlight }) => (
        <Link
          key={to + titleKey}
          to={to}
          className={cn(
            'group flex flex-col rounded-2xl border p-5 shadow-sm transition-all',
            highlight
              ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-card hover:border-amber-500/70 hover:shadow-md'
              : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-md'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                highlight ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={cn('font-semibold leading-snug transition-colors', highlight ? 'group-hover:text-amber-600 dark:group-hover:text-amber-400' : 'group-hover:text-primary')}>
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

function CapitalPersonaPrompt({
  t,
  onEnable,
  isToggling,
}: {
  t: (key: string) => string;
  onEnable: (persona: 'business' | 'investor') => void;
  isToggling: boolean;
}) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-foreground">
            {t('propertyHub.landing.personaPrompt.title')}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {t('propertyHub.landing.personaPrompt.desc')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEnable('business')}
          disabled={isToggling}
          className="gap-1.5 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
        >
          <Briefcase className="h-3.5 w-3.5" />
          {t('propertyHub.landing.personaPrompt.enableBusiness')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEnable('investor')}
          disabled={isToggling}
          className="gap-1.5 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {t('propertyHub.landing.personaPrompt.enableInvestor')}
        </Button>
      </div>
    </div>
  );
}

export default function PropertyLanding() {
  const { t, language } = useLanguage();
  const { personas, togglePersona, isToggling } = useUserPersonas();
  const isRu = language === 'ru';
  const hasCapitalPersona = personas.includes('business') || personas.includes('investor');

  return (
    <AppLayout showHeader showBottomNav showFooter>
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

        <section aria-labelledby="property-seekers-heading" className="mb-10">
          <h2
            id="property-seekers-heading"
            className="text-base font-semibold tracking-tight mb-3 text-foreground"
          >
            {t('propertyHub.landing.sectionSeekers')}
          </h2>
          <HubCardGrid items={SEEKER_CARDS} t={t} />
        </section>

        <section aria-labelledby="property-capital-heading" className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <h2
              id="property-capital-heading"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              {t('propertyHub.landing.sectionCapital')}
            </h2>
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0"
            >
              {t('propertyHub.landing.proBadge')}
            </Badge>
          </div>
          {hasCapitalPersona ? (
            <HubCardGrid items={CAPITAL_CARDS} t={t} />
          ) : (
            <CapitalPersonaPrompt t={t} onEnable={togglePersona} isToggling={isToggling} />
          )}
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
