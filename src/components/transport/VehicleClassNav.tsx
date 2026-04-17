/**
 * VehicleClassNav — Apple-style segmented class filter
 * Horizontal tabs with smooth transitions, mobile swipe
 */

import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Zap,
  Bike,
  Car,
  CarFront,
  Truck,
  Bus,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface VehicleClass {
  id: string;
  labelEn: string;
  labelRu: string;
}

const VEHICLE_CLASS_ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  scooter: Zap,
  motorcycle: Bike,
  compact: Car,
  sedan: CarFront,
  suv: Truck,
  van: Bus,
  luxury: Sparkles,
};

export const VEHICLE_CLASSES: VehicleClass[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'scooter', labelEn: 'Scooter', labelRu: 'Скутер' },
  { id: 'motorcycle', labelEn: 'Moto', labelRu: 'Мото' },
  { id: 'compact', labelEn: 'Compact', labelRu: 'Компакт' },
  { id: 'sedan', labelEn: 'Sedan', labelRu: 'Седан' },
  { id: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник' },
  { id: 'van', labelEn: 'Van', labelRu: 'Минивэн' },
  { id: 'luxury', labelEn: 'Premium', labelRu: 'Премиум' },
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
      <div className="max-w-[1536px] mx-auto">
        <div
          ref={scrollRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {VEHICLE_CLASSES.map(cls => {
            const isActive = selected === cls.id;
            const count = cls.id === 'all' ? undefined : counts?.[cls.id];
            const Icon = VEHICLE_CLASS_ICONS[cls.id] ?? LayoutGrid;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => onChange(cls.id)}
                className={cn(
                  'flex items-center gap-2 pl-3 pr-4 py-2.5 min-h-11 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-background' : 'text-foreground/80'
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{isRu ? cls.labelRu : cls.labelEn}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full min-w-[1.5rem] text-center',
                      isActive
                        ? 'bg-background/20 text-background'
                        : 'bg-muted-foreground/15 text-muted-foreground'
                    )}
                  >
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
