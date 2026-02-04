/**
 * PropertyTypeSelector - Priority property types with "More" dropdown
 * Shows Condo & Villa prominently, other types in dropdown
 */

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterChip } from '@/components/uno/FilterChip';

export interface PropertyTypeOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string | React.ComponentType<{ className?: string }>;
}

interface PropertyTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  propertyTypes: PropertyTypeOption[];
  className?: string;
}

// Priority types shown as main pills
const PRIORITY_TYPES = ['all', 'condo', 'villa'];

// Helper to render icon (string emoji or Lucide component)
function renderIcon(icon: PropertyTypeOption['icon'], className?: string) {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <span className={className}>{icon}</span>;
  }
  const IconComponent = icon;
  return <IconComponent className={className || 'w-4 h-4'} />;
}

export function PropertyTypeSelector({
  selectedType,
  onTypeChange,
  propertyTypes,
  className,
}: PropertyTypeSelectorProps) {
  const { language } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Add "All" option and separate priority vs other types
  const allOption: PropertyTypeOption = {
    id: 'all',
    labelEn: 'All',
    labelRu: 'Все',
    icon: '🏠',
  };

  const priorityTypes = [
    allOption,
    ...propertyTypes.filter((t) => PRIORITY_TYPES.includes(t.id)),
  ];

  const otherTypes = propertyTypes.filter((t) => !PRIORITY_TYPES.includes(t.id));

  // Check if selected type is from "other" dropdown
  const selectedOtherType = otherTypes.find((t) => t.id === selectedType);
  const isOtherSelected = !!selectedOtherType;

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-hide', className)}>
      {/* Priority type pills */}
      {priorityTypes.map((type) => {
        const iconStr = typeof type.icon === 'string' ? type.icon : undefined;
        return (
          <FilterChip
            key={type.id}
            label={language === 'ru' ? type.labelRu : type.labelEn}
            icon={iconStr}
            isActive={selectedType === type.id}
            onToggle={() => onTypeChange(type.id)}
            size="md"
          />
        );
      })}

      {/* "More types" dropdown */}
      {otherTypes.length > 0 && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex-shrink-0',
                isOtherSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
              )}
            >
              {isOtherSelected ? (
                <>
                  {selectedOtherType.icon && renderIcon(selectedOtherType.icon, 'text-sm')}
                  <span>
                    {language === 'ru' ? selectedOtherType.labelRu : selectedOtherType.labelEn}
                  </span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>{language === 'ru' ? 'Ещё' : 'More'}</span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="min-w-[180px] bg-popover border shadow-lg z-50"
          >
            {otherTypes.map((type) => (
              <DropdownMenuItem
                key={type.id}
                onClick={() => {
                  onTypeChange(type.id);
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {type.icon && renderIcon(type.icon, 'text-base w-4 h-4')}
                <span className="flex-1">
                  {language === 'ru' ? type.labelRu : type.labelEn}
                </span>
                {selectedType === type.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {isOtherSelected && (
              <DropdownMenuItem
                onClick={() => {
                  onTypeChange('all');
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer text-muted-foreground border-t mt-1 pt-2"
              >
                <span className="text-base">✕</span>
                <span>{language === 'ru' ? 'Сбросить' : 'Clear'}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default PropertyTypeSelector;
