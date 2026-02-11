/**
 * AirbnbCategoryRibbon — Horizontal scrollable category icons
 * Replicates Airbnb's primary discovery mechanism with underline-active style
 */
import { memo } from 'react';
import { 
  Waves, Droplets, Eye, Mountain, TreePalm, Sparkles, Building, 
  Fence, Dumbbell, PawPrint, Baby, Utensils, Car, Sun, Home, Wifi
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
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea view', labelRu: 'Вид на море' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс' },
  { id: 'tropical', icon: TreePalm, labelEn: 'Tropical', labelRu: 'Тропики' },
  { id: 'mountain_view', icon: Mountain, labelEn: 'Mountain', labelRu: 'Горы' },
  { id: 'new_build', icon: Building, labelEn: 'New build', labelRu: 'Новострой' },
  { id: 'garden', icon: Fence, labelEn: 'Garden', labelRu: 'Сад' },
  { id: 'gym', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Спортзал' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pets OK', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'kitchen', icon: Utensils, labelEn: 'Kitchen', labelRu: 'Кухня' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
  { id: 'rooftop', icon: Sun, labelEn: 'Rooftop', labelRu: 'Крыша' },
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
