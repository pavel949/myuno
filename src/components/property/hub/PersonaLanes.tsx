/**
 * PersonaLanes — the audience-segmented entry cards for the Real Estate Hub.
 *
 * Extracted from PropertyLanding so the hub page can interleave them with the
 * live featured rows. Three independent lanes:
 *   - SeekerLane   : rent / buy / new / resale / invest (always visible)
 *   - CapitalLane  : commercial / land / hotels / yield-grade (persona-gated)
 *   - ProLane      : developer / MC / owner / list-with-us
 *
 * Design: DS 2.1 — sharp corners, flat surfaces, accent border only for the
 * highlight lane (no gradients), bilingual via i18n keys.
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
  ChevronRight,
  Construction,
  Briefcase,
  KeyRound,
  CirclePlus,
  Trees,
  Sparkles,
  Hotel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { useUserPersonas } from '@/hooks/useUserPersonas';

interface HubCardDef {
  to: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  highlight?: boolean;
}

type TFn = (key: string) => string;

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
    to: APP_ROUTES.HOTELS,
    icon: Hotel,
    titleKey: 'propertyHub.landing.hotels.title',
    descKey: 'propertyHub.landing.hotels.desc',
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
  {
    to: APP_ROUTES.PROPERTY_COMPANIES,
    icon: Building2,
    titleKey: 'propertyHub.landing.findMc.title',
    descKey: 'propertyHub.landing.findMc.desc',
  },
];

function HubCardGrid({ items, t }: { items: HubCardDef[]; t: TFn }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ to, icon: Icon, titleKey, descKey, highlight }) => (
        <Link
          key={to + titleKey}
          to={to}
          className={cn(
            'group flex flex-col rounded-none border p-5 shadow-sm transition-all',
            highlight
              ? 'border-accent/40 bg-card hover:border-accent/40 hover:shadow-md'
              : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-md'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-none',
                highlight ? 'bg-accent/15 text-accent dark:text-accent' : 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={cn('font-semibold leading-snug transition-colors', highlight ? 'group-hover:text-accent dark:group-hover:text-accent' : 'group-hover:text-primary')}>
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
  t: TFn;
  onEnable: (persona: 'business' | 'investor') => void;
  isToggling: boolean;
}) {
  return (
    <div className="rounded-none border border-accent/40 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-accent/15 text-accent dark:text-accent">
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
          className="gap-1.5 border-accent/40 hover:border-accent/40 hover:bg-accent/10"
        >
          <Briefcase className="h-3.5 w-3.5" />
          {t('propertyHub.landing.personaPrompt.enableBusiness')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEnable('investor')}
          disabled={isToggling}
          className="gap-1.5 border-accent/40 hover:border-accent/40 hover:bg-accent/10"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {t('propertyHub.landing.personaPrompt.enableInvestor')}
        </Button>
      </div>
    </div>
  );
}

/** Seeker lane — rent / buy / new / resale / invest. Always visible. */
export function SeekerLane({ t }: { t: TFn }) {
  return (
    <section aria-labelledby="property-seekers-heading">
      <h2
        id="property-seekers-heading"
        className="text-base font-semibold tracking-tight mb-3 text-foreground"
      >
        {t('propertyHub.landing.sectionSeekers')}
      </h2>
      <HubCardGrid items={SEEKER_CARDS} t={t} />
    </section>
  );
}

/** Capital lane — commercial / land / hotels / yield. Persona-gated with prompt. */
export function CapitalLane({ t }: { t: TFn }) {
  const { personas, togglePersona, isToggling } = useUserPersonas();
  const hasCapitalPersona = personas.includes('business') || personas.includes('investor');

  return (
    <section aria-labelledby="property-capital-heading">
      <div className="flex items-center gap-2 mb-3">
        <h2
          id="property-capital-heading"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          {t('propertyHub.landing.sectionCapital')}
        </h2>
        <Badge
          variant="outline"
          className="border-accent/40 bg-accent/10 text-accent dark:text-accent text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0"
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
  );
}

/** Pro lane — developer / MC / owner / list-with-us. */
export function ProLane({ t }: { t: TFn }) {
  return (
    <section aria-labelledby="property-pros-heading">
      <h2
        id="property-pros-heading"
        className="text-base font-semibold tracking-tight mb-3 text-foreground"
      >
        {t('propertyHub.landing.sectionPros')}
      </h2>
      <HubCardGrid items={PRO_CARDS} t={t} />
    </section>
  );
}
