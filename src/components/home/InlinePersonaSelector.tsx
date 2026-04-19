import React, { memo, useMemo } from 'react';
import {
  Plane, Home, Building2, TrendingUp, Baby, Heart,
  Music, Dumbbell, Briefcase, Laptop, PawPrint, Globe, Check, HardHat, Store,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Plane, Home, Building2, TrendingUp, Baby, Heart,
  Music, Dumbbell, Briefcase, Laptop, PawPrint, Globe, HardHat, Store,
};

const PERSONA_GRADIENTS: Record<UserPersona, string> = {
  tourist: 'linear-gradient(135deg, hsl(var(--cluster-arrive)), hsl(var(--cluster-arrive) / 0.7))',
  resident: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
  relocation: 'linear-gradient(135deg, hsl(var(--cluster-manage)), hsl(var(--cluster-manage) / 0.7))',
  property_owner: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-amber) / 0.7))',
  investor: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--cluster-invest)))',
  pet_owner: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-coral)))',
  family: 'linear-gradient(135deg, hsl(var(--accent-coral)), hsl(var(--accent-coral) / 0.7))',
  couple: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--accent-coral)))',
  nightlife: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--cluster-invest)))',
  active: 'linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-coral)))',
  business: 'linear-gradient(135deg, hsl(var(--accent) / 0.9), hsl(var(--accent) / 0.6))',
  nomad: 'linear-gradient(135deg, hsl(var(--accent-teal)), hsl(var(--accent-teal) / 0.7))',
  real_estate_developer: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent)))',
  local_services_provider: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--primary)))',
};

/** Primary personas shown on first visit (4 main use cases) */
const PRIMARY_PERSONAS: UserPersona[] = ['tourist', 'resident', 'property_owner', 'investor'];

/** Extended descriptions for first-visit cards */
const EXTENDED_DESC: Record<string, { ru: string; en: string }> = {
  tourist: { ru: 'Трансферы, туры, яхты, рестораны', en: 'Transfers, tours, yachts, dining' },
  resident: { ru: 'Визы, медицина, школы, доставка', en: 'Visas, medical, schools, delivery' },
  property_owner: { ru: 'Клининг, управление, ремонт, гости', en: 'Cleaning, management, repairs, guests' },
  investor: { ru: 'Новостройки, ROI, юрист, аналитика', en: 'Off-plan, ROI, legal, analytics' },
};

interface InlinePersonaSelectorProps {
  isFirstVisit?: boolean;
}

export const InlinePersonaSelector = memo(function InlinePersonaSelector({
  isFirstVisit = false,
}: InlinePersonaSelectorProps) {
  const { language } = useLanguage();
  const { personas, setPersonas, isSetting } = useUserPersonas();
  const isRu = language === 'ru';
  const activePersona = useMemo(() => personas[0] as UserPersona | undefined, [personas]);

  const displayPersonas = PRIMARY_PERSONAS;

  const handleSelect = (p: UserPersona) => {
    setPersonas([p]);
    if (isFirstVisit) {
      localStorage.setItem('myuno-onboarding-complete', 'true');
      sessionStorage.setItem('myuno-onboarding-complete', 'true');
    }
  };

  return (
    <section className="space-y-3">
      {isFirstVisit && (
        <div className="px-1">
          <h2 className="text-lg font-bold font-display text-foreground">
            {isRu ? 'Расскажите о себе' : 'Tell us about yourself'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu
              ? 'Мы подберём нужные сервисы \u00B7 Можно изменить позже'
              : 'We\u2019ll show relevant services \u00B7 Change anytime'}
          </p>
        </div>
      )}

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 w-max md:w-full md:grid md:grid-cols-4">
          {displayPersonas.map((p) => {
            const info = PERSONA_INFO[p];
            const Icon = ICON_MAP[info.icon] || Plane;
            const isActive = activePersona === p;
            const ext = EXTENDED_DESC[p];

            return (
              <button
                key={p}
                onClick={() => handleSelect(p)}
                disabled={isSetting}
                aria-pressed={isActive}
                className={cn(
                  "relative flex flex-col items-start gap-2 p-4 rounded-[var(--radius-lg)] shrink-0 transition-all duration-200 text-left",
                  "w-[140px] md:w-auto min-h-[120px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "ring-2 ring-primary shadow-md bg-primary/5"
                    : "ring-1 ring-border hover:ring-primary/40 hover:shadow-sm bg-card"
                )}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)]"
                  style={{ background: PERSONA_GRADIENTS[p] }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>

                {/* Label */}
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    {isRu ? info.labelRu : info.labelEn}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    {ext ? (isRu ? ext.ru : ext.en) : (isRu ? info.descRu : info.descEn)}
                  </span>
                </div>

                {/* Check */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});
