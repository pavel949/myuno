/**
 * StayTypeTabs — segmented control splitting the nightly (short-term-rental)
 * browse into "Residences" (villas/condos/apartments) vs "Hotels".
 *
 * Controlled component. DS 2.1: sharp-cornered pills (rounded-full toggle
 * permitted), semantic tokens only, no gradients. Visual language mirrors
 * PropertyHubTabs. Bilingual via LanguageContext.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type StayType = 'residences' | 'hotels';

interface StayTypeTabsProps {
  value: StayType;
  onChange: (value: StayType) => void;
  className?: string;
}

const OPTIONS: { id: StayType; en: string; ru: string }[] = [
  { id: 'residences', en: 'Residences', ru: 'Жильё' },
  { id: 'hotels', en: 'Hotels', ru: 'Отели' },
];

export function StayTypeTabs({ value, onChange, className }: StayTypeTabsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div
      role="group"
      aria-label={isRu ? 'Тип размещения' : 'Stay type'}
      className={cn('flex gap-1.5', className)}
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.id)}
            className={cn(
              'shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-medium whitespace-nowrap transition-all leading-none',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {isRu ? opt.ru : opt.en}
          </button>
        );
      })}
    </div>
  );
}
