/**
 * VehicleClassNav — Apple-style segmented class filter
 * Horizontal tabs with smooth transitions, mobile swipe
 */

import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface VehicleClass {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  count?: number;
}

export const VEHICLE_CLASSES: VehicleClass[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🔹' },
  { id: 'scooter', labelEn: 'Scooter', labelRu: 'Скутер', icon: '🛵' },
  { id: 'motorcycle', labelEn: 'Moto', labelRu: 'Мото', icon: '🏍️' },
  { id: 'compact', labelEn: 'Compact', labelRu: 'Компакт', icon: '🚗' },
  { id: 'sedan', labelEn: 'Sedan', labelRu: 'Седан', icon: '🚘' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник', icon: '🚙' },
  { id: 'van', labelEn: 'Van', labelRu: 'Минивэн', icon: '🚐' },
  { id: 'luxury', labelEn: 'Premium', labelRu: 'Премиум', icon: '✨' },
];

interface VehicleClassNavProps {
  selected: string;
  onChange: (id: string) => void;
  counts?: Record<string, number>;
}

export function VehicleClassNav({ selected, onChange, counts }: VehicleClassNavProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border/50">
      <div className="max-w-7xl mx-auto">
        <div
          ref={scrollRef}
          className="flex gap-1 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {VEHICLE_CLASSES.map(cls => {
            const isActive = selected === cls.id;
            const count = cls.id === 'all' ? undefined : counts?.[cls.id];

            return (
              <button
                key={cls.id}
                onClick={() => onChange(cls.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-base">{cls.icon}</span>
                <span>{isRu ? cls.labelRu : cls.labelEn}</span>
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-background/20 text-background" : "bg-muted-foreground/10 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
