/**
 * HubHero — editorial headline + a compact search entry for the Real Estate Hub.
 *
 * The search panel is intentionally light: pick a mode (Rent / Buy / New) and an
 * optional Phuket district, then deep-link into the existing catalog. It does not
 * duplicate the full rentals search (dates/guests/amenities) that lives on
 * /property/browse — it just gets the user there with the right context.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APP_ROUTES } from '@/lib/config/routes';
import { POPULAR_DISTRICTS } from '@/lib/propertyTaxonomy';
import { cn } from '@/lib/utils';

type TFn = (key: string) => string;
type HeroMode = 'rent' | 'buy' | 'new';

const ANY_DISTRICT = '__any__';

const MODES: { id: HeroMode; labelKey: string }[] = [
  { id: 'rent', labelKey: 'propertyHub.landing.hero.tabRent' },
  { id: 'buy', labelKey: 'propertyHub.landing.hero.tabBuy' },
  { id: 'new', labelKey: 'propertyHub.landing.hero.tabNew' },
];

function buildHref(mode: HeroMode, district: string): string {
  const districtQuery =
    district && district !== ANY_DISTRICT ? `&district=${encodeURIComponent(district)}` : '';
  if (mode === 'new') {
    // Off-plan catalog has its own surface; carry district when chosen.
    return district && district !== ANY_DISTRICT
      ? `${APP_ROUTES.OFFPLAN}?district=${encodeURIComponent(district)}`
      : APP_ROUTES.OFFPLAN;
  }
  if (mode === 'buy') {
    return `${APP_ROUTES.PROPERTY_BROWSE}?mode=buy${districtQuery}`;
  }
  return `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short${districtQuery}`;
}

export function HubHero({ t, isRu }: { t: TFn; isRu: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<HeroMode>('rent');
  const [district, setDistrict] = useState<string>(ANY_DISTRICT);

  const handleSearch = () => navigate(buildHref(mode, district));

  return (
    <section aria-labelledby="hub-hero-heading" className="space-y-5">
      <div>
        <h1
          id="hub-hero-heading"
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
        >
          {t('propertyHub.landing.heading')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('propertyHub.landing.subheading')}
        </p>
      </div>

      <div className="rounded-none border border-border bg-card p-3 shadow-sm">
        {/* Mode segmented control */}
        <div
          role="tablist"
          aria-label={t('propertyHub.landing.hero.cta')}
          className="flex gap-1.5"
        >
          {MODES.map(({ id, labelKey }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(id)}
                className={cn(
                  'min-h-[36px] flex-1 rounded-none px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* District + submit */}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger
              className="h-11 flex-1 rounded-none border-border"
              aria-label={t('propertyHub.landing.hero.searchPlaceholder')}
            >
              <SelectValue placeholder={t('propertyHub.landing.hero.searchPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_DISTRICT}>
                {t('propertyHub.landing.hero.anyArea')}
              </SelectItem>
              {POPULAR_DISTRICTS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.icon} {isRu ? d.labelRu : d.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleSearch}
            className="h-11 gap-2 rounded-none sm:w-auto"
          >
            <Search className="h-4 w-4" />
            {t('propertyHub.landing.hero.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
