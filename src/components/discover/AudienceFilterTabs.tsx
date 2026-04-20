/**
 * AudienceFilterTabs — filter for audience-based service discovery
 */

export type AudienceFilter = 'all' | 'tourist' | 'resident' | 'family' | 'business';

export const AUDIENCE_CATEGORIES: { value: AudienceFilter; labelEn: string; labelRu: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все' },
  { value: 'tourist', labelEn: 'Tourist', labelRu: 'Турист' },
  { value: 'resident', labelEn: 'Resident', labelRu: 'Резидент' },
  { value: 'family', labelEn: 'Family', labelRu: 'Семья' },
  { value: 'business', labelEn: 'Business', labelRu: 'Бизнес' },
];

/** Maps audience tab to the verticalIds that should be shown. Empty = show all. */
export const AUDIENCE_VERTICAL_MAP: Record<AudienceFilter, string[]> = {
  all: [],
  tourist: ['transfer', 'vehicle', 'experience', 'yacht', 'restaurant', 'event', 'beauty', 'fitness'],
  resident: ['cleaning', 'medical', 'legal', 'education', 'insurance', 'pet_service', 'property', 'transfer'],
  family: ['education', 'babysitter', 'medical', 'cleaning', 'pet_service', 'experience'],
  business: ['legal', 'insurance', 'education'],
};

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AudienceFilterTabsProps {
  value: AudienceFilter;
  onChange: (value: AudienceFilter) => void;
}

export function AudienceFilterTabs({ value, onChange }: AudienceFilterTabsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {AUDIENCE_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            value === cat.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {isRu ? cat.labelRu : cat.labelEn}
        </button>
      ))}
    </div>
  );
}
