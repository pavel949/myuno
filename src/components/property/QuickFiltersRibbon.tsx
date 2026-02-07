/**
 * QuickFiltersRibbon - Agoda/Airbnb style horizontal filter chips
 * Dynamic filters loaded from lookup_values
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2 } from 'lucide-react';
import { FilterChip } from '@/components/uno/FilterChip';

interface QuickFiltersRibbonProps {
  selectedFilters: string[];
  selectedDistricts?: string[];
  onFilterToggle: (filterId: string) => void;
  onDistrictToggle?: (districtId: string) => void;
  selectedProjectName?: string;
  onProjectClear?: () => void;
  className?: string;
}

export function QuickFiltersRibbon({
  selectedFilters,
  selectedDistricts = [],
  onFilterToggle,
  onDistrictToggle,
  selectedProjectName,
  onProjectClear,
  className,
}: QuickFiltersRibbonProps) {
  const { language } = useLanguage();
  const { quickFilters, districts, isLoading } = usePropertyQuickFilters();

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick Filter Chips (Tags) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-y">
        {/* Project filter chip */}
        {selectedProjectName && onProjectClear && (
          <FilterChip
            label={selectedProjectName}
            icon={<Building2 className="w-3.5 h-3.5" />}
            isActive={true}
            onToggle={onProjectClear}
            onRemove={onProjectClear}
            size="sm"
          />
        )}
        {quickFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={language === 'ru' ? filter.labelRu : filter.labelEn}
            icon={filter.icon}
            isActive={selectedFilters.includes(filter.id)}
            onToggle={() => onFilterToggle(filter.id)}
            size="sm"
          />
        ))}
      </div>

      {/* Districts Section */}
      {districts.length > 0 && onDistrictToggle && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mr-4 pr-4 touch-pan-y">
            {districts.map((district) => (
              <FilterChip
                key={district.id}
                label={language === 'ru' ? district.labelRu : district.labelEn}
                isActive={selectedDistricts.includes(district.valueKey)}
                onToggle={() => onDistrictToggle(district.valueKey)}
                size="sm"
              />
            ))}
          </div>
          {selectedDistricts.length > 0 && (
            <button
              onClick={() => {
                selectedDistricts.forEach((d) => onDistrictToggle(d));
              }}
              className="text-xs text-primary hover:underline shrink-0"
            >
              {language === 'ru' ? 'Сброс' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Note: Projects section moved to ProjectPromoSection carousel */}
    </div>
  );
}

export default QuickFiltersRibbon;
