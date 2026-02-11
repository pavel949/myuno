import React from 'react';
import {
  Waves, Footprints, Eye, Droplets, Lock,
  WashingMachine, PawPrint, Baby, Car, Wifi, Sparkles
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
  { id: 'walk_to_beach', icon: Footprints, labelEn: 'Walk to beach', labelRu: 'Пешком до пляжа' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea View', labelRu: 'Вид на море' },
  { id: 'private_pool', icon: Lock, labelEn: 'Private pool', labelRu: 'Свой бассейн' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Бассейн' },
  { id: 'washer', icon: WashingMachine, labelEn: 'Washer', labelRu: 'Стиралка' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pets OK', labelRu: 'С питомцами' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Для детей' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс' },
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
      <div className="flex items-end gap-4 px-4 min-w-max">
        {selected.length > 1 && (
          <button
            onClick={() => onSelect([])}
            className="flex flex-col items-center gap-1.5 pb-2 border-b-2 border-transparent text-primary hover:text-primary/80 min-w-[56px] transition-all"
          >
            <span className="text-[10px] font-medium whitespace-nowrap">
              {isRu ? 'Сброс' : 'Clear'}
            </span>
          </button>
        )}
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
 * Matches a property against a category by checking amenities, highlights, view_type, and property_type.
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
  const propertyType = (property.property_type || '').toLowerCase();

  switch (categoryId) {
    case 'beachfront':
      return all.some(a => a.includes('beach'));
    case 'walk_to_beach':
      return all.some(a =>
        a.includes('walk') && a.includes('beach') ||
        a.includes('walking_to_beach') ||
        a.includes('beach_close') ||
        a.includes('near beach') ||
        a.includes('close to beach')
      );
    case 'sea_view':
      return viewType.includes('sea') || viewType.includes('ocean') || all.some(a => a.includes('sea view'));
    case 'private_pool':
      return all.some(a => a.includes('private') && a.includes('pool'));
    case 'pool':
      return all.some(a => a.includes('pool') || a.includes('swimming'));
    case 'washer':
      return all.some(a => a.includes('washer') || a.includes('washing machine') || a.includes('laundry'));
    case 'pet_friendly':
      return all.some(a => a.includes('pet'));
    case 'kid_friendly':
      return all.some(a => a.includes('kid') || a.includes('child') || a.includes('family'));
    case 'parking':
      return all.some(a => a.includes('parking') || a.includes('garage'));
    case 'wifi':
      return all.some(a => a.includes('wifi') || a.includes('wi-fi') || a.includes('internet'));
    case 'luxury':
      return all.some(a => a.includes('luxury') || a.includes('premium'));
    default:
      return false;
  }
}
