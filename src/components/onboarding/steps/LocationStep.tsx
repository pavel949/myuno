import React from 'react';
import { Check, LucideIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'ru' | 'en' | 'th';

interface Location {
  id: string;
  name: { en: string; ru: string; th: string };
  country: { en: string; ru: string; th: string };
  flag: string;
  available: boolean;
}

interface LocationStepProps {
  lang: Language;
  step: {
    icon: LucideIcon;
    title: { en: string; ru: string; th: string };
    subtitle: { en: string; ru: string; th: string };
  };
  locations: Location[];
  selectedLocation: string | null;
  setSelectedLocation: (id: string) => void;
  comingSoonTexts: Record<Language, string>;
}

export function LocationStep({
  lang,
  step,
  locations,
  selectedLocation,
  setSelectedLocation,
  comingSoonTexts,
}: LocationStepProps) {
  const StepIcon = step.icon;

  return (
    <div className="space-y-6 flex-1">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
          <StepIcon className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-1">
          {step.title[lang]}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step.subtitle[lang]}
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Active locations */}
        {locations.filter(loc => loc.available).map(loc => (
          <button
            key={loc.id}
            onClick={() => setSelectedLocation(loc.id)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
              selectedLocation === loc.id 
                ? "border-primary bg-primary/10 shadow-md" 
                : "border-primary/50 hover:border-primary bg-card"
            )}
          >
            <span className="text-2xl">{loc.flag}</span>
            <div className="flex-1 text-left">
              <span className="font-semibold text-lg">{loc.name[lang]}</span>
              <p className="text-xs text-muted-foreground">
                {lang === 'ru' ? 'Доступно сейчас' : lang === 'th' ? 'พร้อมใช้งาน' : 'Available now'}
              </p>
            </div>
            {selectedLocation === loc.id && (
              <Check className="w-5 h-5 text-primary" />
            )}
          </button>
        ))}

        {/* Coming soon locations */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            {comingSoonTexts[lang]}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {locations.filter(loc => !loc.available).map(loc => (
              <div
                key={loc.id}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-muted/30 opacity-60"
              >
                <span className="text-lg">{loc.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {loc.name[lang]}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">
                    {loc.country[lang]}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* And more text */}
          <p className="text-center text-xs text-muted-foreground/70 pt-2 italic">
            {lang === 'en' && '...and more locations coming in 2025'}
            {lang === 'ru' && '...и другие города в 2025'}
            {lang === 'th' && '...และเมืองอื่นๆ ในปี 2025'}
          </p>
        </div>
        
        {/* Trust & Safety badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>
            {lang === 'ru' ? 'Все провайдеры проверены' : 
             lang === 'th' ? 'ผู้ให้บริการทุกรายได้รับการยืนยัน' : 
             'All providers verified'}
          </span>
        </div>
      </div>
    </div>
  );
}
