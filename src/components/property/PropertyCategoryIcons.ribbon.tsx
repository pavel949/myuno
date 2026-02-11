/**
 * AirbnbCategoryRibbon — Horizontal scrollable category icons
 * Phuket-specific differentiators that match real search patterns
 */
import { memo } from 'react';
import { 
  Waves, Footprints, Eye, Droplets, Lock, 
  WashingMachine, PawPrint, Baby, Car, Wifi, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CategoryItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

export const PROPERTY_CATEGORIES: CategoryItem[] = [
  { id: 'beachfront', icon: Waves, labelEn: 'Beachfront', labelRu: 'У пляжа' },
  { id: 'walk_to_beach', icon: Footprints, labelEn: 'Walk to beach', labelRu: 'Пешком до пляжа' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea view', labelRu: 'Вид на море' },
  { id: 'private_pool', icon: Lock, labelEn: 'Private pool', labelRu: 'Свой бассейн' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'washer', icon: WashingMachine, labelEn: 'Washer', labelRu: 'Стиралка' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pets OK', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс' },
];

interface AirbnbCategoryRibbonProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  className?: string;
}

export const AirbnbCategoryRibbon = memo(function AirbnbCategoryRibbon({
  selected,
  onChange,
  className,
}: AirbnbCategoryRibbonProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className={cn("flex gap-1 overflow-x-auto scrollbar-hide touch-pan-y", className)}>
      {PROPERTY_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 pt-2 pb-2 shrink-0 transition-all",
              "border-b-2 min-w-[56px]",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground/70 hover:text-muted-foreground hover:border-muted-foreground/30"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "text-foreground")} />
            <span className="text-[10px] font-medium whitespace-nowrap leading-none">
              {isRu ? cat.labelRu : cat.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
});
