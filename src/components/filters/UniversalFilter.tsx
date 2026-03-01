import React, { useState, useMemo } from 'react';
import { Filter, X, Check, ChevronDown, RotateCcw, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { InlineIcon } from '@/components/ui/IconBadge';
import { Bed } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

// ====== UNIVERSAL FILTER TYPES ======

export interface FilterOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string | LucideIcon;
  count?: number;
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
  children?: React.ReactNode;
}

// ====== PRICE LEVEL COMPONENT ======

function PriceLevelSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const levels = [
    { id: '1', label: '฿' },
    { id: '2', label: '฿฿' },
    { id: '3', label: '฿฿฿' },
    { id: '4', label: '฿฿฿฿' },
  ];

  return (
    <div className="flex gap-2">
      {levels.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(value === level.id ? null : level.id)}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
            value === level.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

// ====== SINGLE SELECT ======

function SingleSelectList({ options, value, onChange }: {
  options: FilterOption[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(isActive ? null : option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            {option.icon && <InlineIcon icon={option.icon} size="sm" className="flex-shrink-0" />}
            <span>{language === 'ru' ? option.labelRu : option.labelEn}</span>
            {isActive && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>
        );
      })}
    </div>
  );
}

// ====== MULTI SELECT CHIPS ======

function MultiSelectChips({ options, value, onChange }: {
  options: FilterOption[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { language } = useLanguage();

  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter((v) => v !== id)
        : [...value, id]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => toggle(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            {option.icon && <InlineIcon icon={option.icon} size="sm" className="flex-shrink-0" />}
            <span>{language === 'ru' ? option.labelRu : option.labelEn}</span>
            {option.count !== undefined && (
              <span className="text-xs opacity-60">({option.count})</span>
            )}
            {isActive && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>
        );
      })}
    </div>
  );
}

// ====== BEDROOM SELECT ======

function BedroomSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { language } = useLanguage();
  const options = [
    { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
    { id: '1', labelEn: '1', labelRu: '1' },
    { id: '2', labelEn: '2', labelRu: '2' },
    { id: '3', labelEn: '3', labelRu: '3' },
    { id: '4', labelEn: '4+', labelRu: '4+' },
  ];

  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter((v) => v !== id)
        : [...value, id]
    );
  };

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const isActive = value.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => toggle(option.id)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            {option.id !== 'studio' && <Bed className="w-3.5 h-3.5" />}
            {language === 'ru' ? option.labelRu : option.labelEn}
          </button>
        );
      })}
    </div>
  );
}

// ====== MAIN COMPONENT ======

export function UniversalFilter({
  config,
  values,
  onChange,
  activeCount = 0,
  className,
  children,
}: UniversalFilterProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterValues>(values);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalValues(values);
    }
    setIsOpen(open);
  };

  const updateSectionValue = (sectionId: string, value: string | string[] | null) => {
    setLocalValues((prev) => ({ ...prev, [sectionId]: value }));
  };

  const handleApply = () => {
    onChange(localValues);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    config.sections.forEach((section) => {
      resetValues[section.id] = section.type === 'multi' ? [] : null;
    });
    setLocalValues(resetValues);
  };

  const localActiveCount = useMemo(() => {
    let count = 0;
    Object.entries(localValues).forEach(([, val]) => {
      if (Array.isArray(val) && val.length > 0) count++;
      else if (val && typeof val === 'string') count++;
    });
    return count;
  }, [localValues]);

  const trigger = children || (
    <Button variant="outline" size="sm" className={cn("gap-2", className)} onClick={() => setIsOpen(true)}>
      <Filter className="w-4 h-4" />
      {language === 'ru' ? 'Фильтры' : 'Filters'}
      {activeCount > 0 && (
        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
          {activeCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger}
      </div>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={language === 'ru' ? 'Фильтры' : 'Filters'}
        icon={<Filter className="w-5 h-5 text-primary" />}
        size="lg"
        mobileHeight="max-h-[85vh]"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
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
            <Button onClick={handleApply} className="flex-1 max-w-xs ml-auto h-11 text-base" size="lg">
              {language === 'ru'
                ? `Применить${localActiveCount > 0 ? ` (${localActiveCount})` : ''}`
                : `Apply${localActiveCount > 0 ? ` (${localActiveCount})` : ''}`}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {config.sections.map((section, index) => (
            <div key={section.id}>
              {index > 0 && <Separator className="mb-6" />}

              <h3 className="font-semibold text-base mb-4">
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
                section.id === 'bedrooms' ? (
                  <BedroomSelect
                    value={(localValues[section.id] as string[]) || []}
                    onChange={(value) => updateSectionValue(section.id, value)}
                  />
                ) : (
                  <MultiSelectChips
                    options={section.options}
                    value={(localValues[section.id] as string[]) || []}
                    onChange={(value) => updateSectionValue(section.id, value)}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </ResponsiveModal>
    </>
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
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 touch-pan-y", className)}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              "border flex-shrink-0",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
            )}
          >
            {option.icon && <InlineIcon icon={option.icon} size="sm" className="flex-shrink-0" />}
            <span className="truncate max-w-[100px]">{language === 'ru' ? option.labelRu : option.labelEn}</span>
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
  className,
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
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 touch-pan-y", className)}>
      {activeFilters.map((filter, idx) => (
        <button
          key={`${filter.sectionId}-${filter.optionId}-${idx}`}
          onClick={() => onRemove(filter.sectionId, filter.optionId)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30 flex-shrink-0"
        >
          <span className="truncate max-w-[80px]">{filter.label}</span>
          <X className="w-3 h-3 flex-shrink-0" />
        </button>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30 flex-shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'ru' ? 'Сброс' : 'Clear'}</span>
        </button>
      )}
    </div>
  );
}
