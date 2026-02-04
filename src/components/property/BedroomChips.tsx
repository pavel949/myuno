/**
 * BedroomChips - Inline multi-select bedroom filter
 * Airbnb/Klook style horizontal chips
 */

import { Bed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';

interface BedroomOption {
  id: string;
  labelEn: string;
  labelRu: string;
}

const BEDROOM_OPTIONS: BedroomOption[] = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
  { id: '1', labelEn: '1', labelRu: '1' },
  { id: '2', labelEn: '2', labelRu: '2' },
  { id: '3', labelEn: '3', labelRu: '3' },
  { id: '4', labelEn: '4', labelRu: '4' },
  { id: '5+', labelEn: '5+', labelRu: '5+' },
];

interface BedroomChipsProps {
  selectedBedrooms: string[];
  onBedroomsChange: (bedrooms: string[]) => void;
  className?: string;
}

export function BedroomChips({
  selectedBedrooms,
  onBedroomsChange,
  className,
}: BedroomChipsProps) {
  const { language } = useLanguage();

  const handleToggle = (bedroomId: string) => {
    if (selectedBedrooms.includes(bedroomId)) {
      onBedroomsChange(selectedBedrooms.filter((b) => b !== bedroomId));
    } else {
      onBedroomsChange([...selectedBedrooms, bedroomId]);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Label */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
        <Bed className="w-4 h-4" />
        <span className="hidden sm:inline">
          {language === 'ru' ? 'Спальни:' : 'Beds:'}
        </span>
      </div>

      {/* Chips - scrollable */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
        {BEDROOM_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            label={language === 'ru' ? option.labelRu : option.labelEn}
            isActive={selectedBedrooms.includes(option.id)}
            onToggle={() => handleToggle(option.id)}
            size="sm"
          />
        ))}
      </div>

      {/* Clear button when filters active */}
      {selectedBedrooms.length > 0 && (
        <button
          onClick={() => onBedroomsChange([])}
          className="text-xs text-primary hover:underline shrink-0"
        >
          {language === 'ru' ? 'Сброс' : 'Clear'}
        </button>
      )}
    </div>
  );
}

export default BedroomChips;
