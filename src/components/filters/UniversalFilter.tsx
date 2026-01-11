import React, { useState, useMemo } from 'react';
import { Filter, X, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// ====== UNIVERSAL FILTER TYPES ======

export interface FilterOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string; // emoji or icon name
  count?: number; // optional count of items
}

export interface FilterSection {
  id: string;
  titleEn: string;
  titleRu: string;
  type: 'single' | 'multi' | 'range' | 'price-level';
  options: FilterOption[];
  defaultValue?: string | string[];
}

export interface FilterConfig {
  sections: FilterSection[];
}

export interface FilterValues {
  [sectionId: string]: string | string[] | null;
}

export interface UniversalFilterProps {
  config: FilterConfig;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  activeCount?: number;
  className?: string;
}

// ====== PRICE LEVEL COMPONENT ======

interface PriceLevelSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  maxLevel?: number;
}

function PriceLevelSelect({ value, onChange, maxLevel = 4 }: PriceLevelSelectProps) {
  const { language } = useLanguage();
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);
  
  const labels: Record<number, { en: string; ru: string }> = {
    1: { en: 'Budget', ru: 'Бюджетно' },
    2: { en: 'Moderate', ru: 'Средне' },
    3: { en: 'Upscale', ru: 'Дорого' },
    4: { en: 'Luxury', ru: 'Премиум' },
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onChange(value === String(level) ? null : String(level))}
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
            value === String(level)
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          )}
        >
          <span className="text-sm font-medium">
            {'฿'.repeat(level)}
          </span>
          <span className="text-xs text-muted-foreground">
            {language === 'ru' ? labels[level]?.ru : labels[level]?.en}
          </span>
        </button>
      ))}
    </div>
  );
}

// ====== MULTI SELECT CHIPS ======

interface MultiSelectChipsProps {
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

function MultiSelectChips({ options, value, onChange }: MultiSelectChipsProps) {
  const { language } = useLanguage();

  const toggleOption = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter(v => v !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all",
              "border-2",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            <span>{language === 'ru' ? option.labelRu : option.labelEn}</span>
            {isActive && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

// ====== SINGLE SELECT LIST ======

interface SingleSelectListProps {
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

function SingleSelectList({ options, value, onChange }: SingleSelectListProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(isActive ? null : option.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <span className="flex-1 font-medium">
              {language === 'ru' ? option.labelRu : option.labelEn}
            </span>
            {option.count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {option.count}
              </Badge>
            )}
            {isActive && <Check className="w-4 h-4" />}
          </button>
        );
      })}
    </div>
  );
}

// ====== MAIN UNIVERSAL FILTER COMPONENT ======

export function UniversalFilter({ 
  config, 
  values, 
  onChange,
  activeCount = 0,
  className 
}: UniversalFilterProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterValues>(values);

  // Reset local values when sheet opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalValues(values);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(localValues);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    config.sections.forEach(section => {
      resetValues[section.id] = section.type === 'multi' ? [] : null;
    });
    setLocalValues(resetValues);
  };

  const updateSectionValue = (sectionId: string, value: string | string[] | null) => {
    setLocalValues(prev => ({ ...prev, [sectionId]: value }));
  };

  const localActiveCount = useMemo(() => {
    let count = 0;
    Object.entries(localValues).forEach(([_, value]) => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value) {
        count += 1;
      }
    });
    return count;
  }, [localValues]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Filter className="w-4 h-4" />
          {language === 'ru' ? 'Фильтры' : 'Filters'}
          {activeCount > 0 && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {language === 'ru' ? 'Фильтры' : 'Filters'}
            </SheetTitle>
            {localActiveCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'ru' ? 'Сбросить' : 'Reset'}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-140px)] pr-4">
          <div className="space-y-6 pb-4">
            {config.sections.map((section, index) => (
              <div key={section.id}>
                {index > 0 && <Separator className="mb-6" />}
                
                <h3 className="font-semibold mb-4">
                  {language === 'ru' ? section.titleRu : section.titleEn}
                </h3>

                {section.type === 'price-level' && (
                  <PriceLevelSelect
                    value={localValues[section.id] as string | null}
                    onChange={(value) => updateSectionValue(section.id, value)}
                  />
                )}

                {section.type === 'single' && (
                  <SingleSelectList
                    options={section.options}
                    value={localValues[section.id] as string | null}
                    onChange={(value) => updateSectionValue(section.id, value)}
                  />
                )}

                {section.type === 'multi' && (
                  <MultiSelectChips
                    options={section.options}
                    value={(localValues[section.id] as string[]) || []}
                    onChange={(value) => updateSectionValue(section.id, value)}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Apply Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button onClick={handleApply} className="w-full" size="lg">
            {language === 'ru' 
              ? `Применить${localActiveCount > 0 ? ` (${localActiveCount})` : ''}`
              : `Apply${localActiveCount > 0 ? ` (${localActiveCount})` : ''}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ====== QUICK FILTER BAR (horizontal chips for quick access) ======

interface QuickFilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuickFilterBar({ options, value, onChange, className }: QuickFilterBarProps) {
  const { language } = useLanguage();

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4", className)}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              "border flex-shrink-0",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            <span>{language === 'ru' ? option.labelRu : option.labelEn}</span>
          </button>
        );
      })}
    </div>
  );
}

// ====== ACTIVE FILTERS DISPLAY ======

interface ActiveFiltersProps {
  config: FilterConfig;
  values: FilterValues;
  onRemove: (sectionId: string, optionId?: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({ 
  config, 
  values, 
  onRemove, 
  onClearAll,
  className 
}: ActiveFiltersProps) {
  const { language } = useLanguage();

  const activeFilters: { sectionId: string; optionId: string; label: string }[] = [];

  config.sections.forEach(section => {
    const sectionValue = values[section.id];
    
    if (section.type === 'multi' && Array.isArray(sectionValue)) {
      sectionValue.forEach(optionId => {
        const option = section.options.find(o => o.id === optionId);
        if (option) {
          activeFilters.push({
            sectionId: section.id,
            optionId,
            label: language === 'ru' ? option.labelRu : option.labelEn,
          });
        }
      });
    } else if (sectionValue && typeof sectionValue === 'string') {
      if (section.type === 'price-level') {
        activeFilters.push({
          sectionId: section.id,
          optionId: sectionValue,
          label: '฿'.repeat(parseInt(sectionValue)),
        });
      } else {
        const option = section.options.find(o => o.id === sectionValue);
        if (option) {
          activeFilters.push({
            sectionId: section.id,
            optionId: sectionValue,
            label: language === 'ru' ? option.labelRu : option.labelEn,
          });
        }
      }
    }
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4", className)}>
      {activeFilters.map((filter, idx) => (
        <button
          key={`${filter.sectionId}-${filter.optionId}-${idx}`}
          onClick={() => onRemove(filter.sectionId, filter.optionId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/30 whitespace-nowrap flex-shrink-0"
        >
          <span>{filter.label}</span>
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive border border-destructive/30 whitespace-nowrap flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {language === 'ru' ? 'Сбросить' : 'Clear all'}
        </button>
      )}
    </div>
  );
}
