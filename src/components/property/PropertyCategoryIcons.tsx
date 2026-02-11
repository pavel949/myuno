import React from 'react';
import {
  Waves, TreePalm, Mountain, Sparkles, Building, Fence,
  Droplets, Dumbbell, PawPrint, Baby, Utensils, Wifi,
  Car, Eye, Sun, Home, Sailboat, Flower2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PropertyCategory {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
}

const CATEGORIES: PropertyCategory[] = [
  { id: 'beachfront', icon: Waves, labelEn: 'Beachfront', labelRu: 'У пляжа' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea View', labelRu: 'Вид на море' },
  { id: 'mountain_view', icon: Mountain, labelEn: 'Mountain', labelRu: 'Горы' },
  { id: 'tropical', icon: TreePalm, labelEn: 'Tropical', labelRu: 'Тропики' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс' },
  { id: 'new_build', icon: Building, labelEn: 'New Build', labelRu: 'Новострой' },
  { id: 'garden', icon: Fence, labelEn: 'Garden', labelRu: 'Сад' },
  { id: 'gym', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Спортзал' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pet Friendly', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'kitchen', icon: Utensils, labelEn: 'Kitchen', labelRu: 'Кухня' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
  { id: 'rooftop', icon: Sun, labelEn: 'Rooftop', labelRu: 'Крыша' },
];

interface PropertyCategoryIconsProps {
  selected: string[];
  onSelect: (ids: string[]) => void;
  className?: string;
}

export function PropertyCategoryIcons({ selected, onSelect, className }: PropertyCategoryIconsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleToggle = (id: string) => {
    onSelect(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex items-end gap-6 px-4 min-w-max">
        {CATEGORIES.map((cat) => {
          const isActive = selected.includes(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleToggle(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 pb-2 border-b-2 transition-all min-w-[56px]",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {isRu ? cat.labelRu : cat.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Matches a property against a category by checking amenities, highlights, and view_type.
 */
export function matchesCategory(property: {
  amenities?: string[];
  highlights?: string[];
  view_type?: string;
  is_featured?: boolean;
  property_type?: string;
}, categoryId: string): boolean {
  const amenities = (property.amenities || []).map(a => a.toLowerCase());
  const highlights = (property.highlights || []).map(h => h.toLowerCase());
  const all = [...amenities, ...highlights];
  const viewType = (property.view_type || '').toLowerCase();

  switch (categoryId) {
    case 'beachfront': return all.some(a => a.includes('beach'));
    case 'pool': return all.some(a => a.includes('pool') || a.includes('swimming'));
    case 'sea_view': return viewType.includes('sea') || viewType.includes('ocean') || all.some(a => a.includes('sea view'));
    case 'mountain_view': return viewType.includes('mountain') || all.some(a => a.includes('mountain'));
    case 'tropical': return all.some(a => a.includes('tropical') || a.includes('garden'));
    case 'luxury': return all.some(a => a.includes('luxury') || a.includes('premium'));
    case 'new_build': return all.some(a => a.includes('new') || a.includes('modern'));
    case 'garden': return viewType.includes('garden') || all.some(a => a.includes('garden'));
    case 'gym': return all.some(a => a.includes('gym') || a.includes('fitness'));
    case 'pet_friendly': return all.some(a => a.includes('pet'));
    case 'kid_friendly': return all.some(a => a.includes('kid') || a.includes('child') || a.includes('family'));
    case 'kitchen': return all.some(a => a.includes('kitchen'));
    case 'parking': return all.some(a => a.includes('parking') || a.includes('garage'));
    case 'wifi': return all.some(a => a.includes('wifi') || a.includes('wi-fi') || a.includes('internet'));
    case 'rooftop': return all.some(a => a.includes('rooftop') || a.includes('terrace'));
    default: return false;
  }
}
