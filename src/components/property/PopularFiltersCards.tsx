import { useLanguage } from '@/contexts/LanguageContext';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { cn } from '@/lib/utils';
import { FilterValues } from '@/components/filters/UniversalFilter';

interface PopularFilter {
  id: string;
  sectionId: string;
  labelEn: string;
  labelRu: string;
  icon: string;
  image?: string;
}

const popularFilters: PopularFilter[] = [
  // Popular districts
  { id: 'bang-tao', sectionId: 'district', labelEn: 'Bang Tao', labelRu: 'Банг Тао', icon: '⛱️', image: PLACEHOLDER_IMAGES.districts['bang-tao'] },
  { id: 'kamala', sectionId: 'district', labelEn: 'Kamala', labelRu: 'Камала', icon: '🌅', image: PLACEHOLDER_IMAGES.districts['kamala'] },
  { id: 'rawai', sectionId: 'district', labelEn: 'Rawai', labelRu: 'Равай', icon: '🐚', image: PLACEHOLDER_IMAGES.districts['rawai'] },
  { id: 'surin', sectionId: 'district', labelEn: 'Surin', labelRu: 'Сурин', icon: '🏝️', image: PLACEHOLDER_IMAGES.districts['surin'] },
  // Popular amenities
  { id: 'pool', sectionId: 'amenities', labelEn: 'With Pool', labelRu: 'С бассейном', icon: '🏊', image: PLACEHOLDER_IMAGES.amenities['pool'] },
  { id: 'sea-view', sectionId: 'amenities', labelEn: 'Sea View', labelRu: 'Вид на море', icon: '🌊', image: PLACEHOLDER_IMAGES.amenities['sea-view'] },
  { id: 'beachfront', sectionId: 'amenities', labelEn: 'Beachfront', labelRu: 'На пляже', icon: '🏖️', image: PLACEHOLDER_IMAGES.amenities['beachfront'] },
  { id: 'pet-friendly', sectionId: 'amenities', labelEn: 'Pet Friendly', labelRu: 'С питомцами', icon: '🐕', image: PLACEHOLDER_IMAGES.amenities['pet-friendly'] },
];

interface PopularFiltersCardsProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  className?: string;
}

export function PopularFiltersCards({ values, onChange, className }: PopularFiltersCardsProps) {
  const { language } = useLanguage();

  const isSelected = (filter: PopularFilter) => {
    const sectionValue = values[filter.sectionId];
    if (Array.isArray(sectionValue)) {
      return sectionValue.includes(filter.id);
    }
    return sectionValue === filter.id;
  };

  const toggleFilter = (filter: PopularFilter) => {
    const current = values[filter.sectionId];
    
    if (Array.isArray(current)) {
      // Multi-select: toggle in array
      const newArray = current.includes(filter.id)
        ? current.filter(id => id !== filter.id)
        : [...current, filter.id];
      onChange({ ...values, [filter.sectionId]: newArray.length > 0 ? newArray : undefined });
    } else if (current === filter.id) {
      // Already selected, remove
      const { [filter.sectionId]: _, ...rest } = values;
      onChange(rest);
    } else {
      // Single or first selection - use array for multi-selectable sections
      const multiSections = ['district', 'amenities', 'propertyType', 'bedrooms'];
      if (multiSections.includes(filter.sectionId)) {
        const existing = current ? [current as string] : [];
        onChange({ ...values, [filter.sectionId]: [...existing, filter.id] });
      } else {
        onChange({ ...values, [filter.sectionId]: filter.id });
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">
        {language === 'ru' ? 'Популярные критерии' : 'Popular Filters'}
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {popularFilters.map((filter) => {
          const selected = isSelected(filter);
          return (
            <button
              key={`${filter.sectionId}-${filter.id}`}
              onClick={() => toggleFilter(filter)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all overflow-hidden group",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              {/* Background image */}
              {filter.image && (
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                  <img 
                    src={filter.image} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>
              )}
              
              {/* Content */}
              <span className="relative text-2xl z-10">{filter.icon}</span>
              <span className={cn(
                "relative text-xs font-medium text-center leading-tight z-10",
                selected ? "text-primary" : "text-foreground"
              )}>
                {language === 'ru' ? filter.labelRu : filter.labelEn}
              </span>
              
              {/* Check indicator */}
              {selected && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}