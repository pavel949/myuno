import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Check, CalendarDays, X, type LucideIcon } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';

// ============ TYPES ============

export interface FilterCategory {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string | LucideIcon;
}

export interface FilterChipOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string | LucideIcon;
}

export interface SortOption {
  id: string;
  labelEn: string;
  labelRu: string;
}

export type DatePreset = 'any' | 'today' | 'tomorrow' | 'this-week' | 'custom';

export interface PricePreset {
  min: number;
  max: number;
  labelEn: string;
  labelRu: string;
}

export interface ChipSection {
  id: string;
  titleEn: string;
  titleRu: string;
  options: FilterChipOption[];
  selectedIds: string[];
  initialVisible?: number;
}

export interface UnifiedFiltersKlookConfig {
  // Date filters (optional)
  showDateFilters?: boolean;
  datePresets?: { id: DatePreset; labelEn: string; labelRu: string }[];
  
  // Date range picker (for Transport, etc.)
  showDateRange?: boolean;
  dateRangeLabels?: { fromEn: string; fromRu: string; toEn: string; toRu: string };
  
  // Price filters (optional)
  showPriceFilter?: boolean;
  pricePresets?: PricePreset[];
  priceRange?: { min: number; max: number; step: number };
  currencySymbol?: string;
  
  // Sort options
  sortOptions: SortOption[];
  
  // Inline quick filters (visible in sticky bar, not drawer)
  inlineQuickFilters?: FilterChipOption[];
  
  // Quick filter chips in drawer
  quickFilterOptions?: FilterChipOption[];
  
  // Chip sections in drawer (interests, features, etc.)
  chipSections?: Omit<ChipSection, 'selectedIds'>[];
  
  // Labels
  labels?: {
    filtersEn?: string;
    filtersRu?: string;
    resetEn?: string;
    resetRu?: string;
    budgetEn?: string;
    budgetRu?: string;
    quickFiltersEn?: string;
    quickFiltersRu?: string;
    resultsEn?: string;
    resultsRu?: string;
    showResultsEn?: string;
    showResultsRu?: string;
    allEn?: string;
    allRu?: string;
    pickDateEn?: string;
    pickDateRu?: string;
  };
}

export interface UnifiedFiltersKlookProps {
  // Configuration
  config: UnifiedFiltersKlookConfig;
  
  // Categories (horizontal scroll)
  categories: FilterCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  
  // Sort
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Price (optional)
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  
  // Date (optional)
  selectedDate?: Date | null;
  onDateChange?: (date: Date | null) => void;
  datePreset?: DatePreset;
  onDatePresetChange?: (preset: DatePreset) => void;
  
  // Date range (optional, for Transport-like verticals)
  dateRange?: { from: Date | null; to: Date | null };
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
  
  // Chip selections (keyed by section id)
  chipSelections?: Record<string, string[]>;
  onChipSelectionsChange?: (sectionId: string, selectedIds: string[]) => void;
  
  // Quick filters
  selectedQuickFilters?: string[];
  onQuickFiltersChange?: (filters: string[]) => void;
  
  // Inline quick filters (visible in sticky bar)
  selectedInlineFilters?: string[];
  onInlineFiltersChange?: (filters: string[]) => void;
  
  // Results
  resultsCount: number;
  language: string;
  
  // Sticky offset (for header height)
  stickyTop?: string;
}

// ============ HELPER COMPONENTS ============

function renderIcon(icon: string | LucideIcon | undefined): React.ReactNode {
  if (!icon) return null;
  const Resolved = resolveIcon(icon);
  return <Resolved className="w-4 h-4" />;
}

function ChipSectionComponent({
  title,
  options,
  selectedIds,
  onToggle,
  language,
  initialVisible = 6,
}: {
  title: string;
  options: FilterChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  language: string;
  initialVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const isRu = language === 'ru';
  const visibleOptions = showAll ? options : options.slice(0, initialVisible);
  const hasMore = options.length > initialVisible;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option) => {
          const isActive = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {renderIcon(option.icon)}
              <span>{isRu ? option.labelRu : option.labelEn}</span>
              {isActive && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
        >
          {showAll 
            ? (isRu ? 'Скрыть' : 'See less')
            : (isRu ? 'Показать ещё' : 'See more')
          }
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export function UnifiedFiltersKlook({
  config,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange = [0, 50000],
  onPriceRangeChange,
  selectedDate,
  onDateChange,
  datePreset = 'any',
  onDatePresetChange,
  dateRange,
  onDateRangeChange,
  chipSelections = {},
  onChipSelectionsChange,
  selectedQuickFilters = [],
  onQuickFiltersChange,
  selectedInlineFilters = [],
  onInlineFiltersChange,
  resultsCount,
  language,
  stickyTop = 'top-14',
}: UnifiedFiltersKlookProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);
  const [tempQuickFilters, setTempQuickFilters] = useState(selectedQuickFilters);
  const [tempChipSelections, setTempChipSelections] = useState(chipSelections);
  
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const labels = config.labels || {};

  const currentSort = config.sortOptions.find(o => o.id === sortBy) || config.sortOptions[0];
  
  // Default date presets
  const datePresets = config.datePresets || [
    { id: 'today' as DatePreset, labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow' as DatePreset, labelEn: 'Tomorrow', labelRu: 'Завтра' },
    { id: 'this-week' as DatePreset, labelEn: 'This week', labelRu: 'Эта неделя' },
  ];
  
  // Handle date preset click
  const handleDatePreset = (preset: DatePreset) => {
    if (!onDatePresetChange || !onDateChange) return;
    
    if (datePreset === preset) {
      onDatePresetChange('any');
      onDateChange(null);
    } else {
      onDatePresetChange(preset);
      if (preset === 'today') {
        onDateChange(new Date());
      } else if (preset === 'tomorrow') {
        onDateChange(addDays(new Date(), 1));
      } else if (preset === 'this-week') {
        onDateChange(null);
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!onDateChange || !onDatePresetChange) return;
    
    if (date) {
      onDateChange(date);
      onDatePresetChange('custom');
    } else {
      onDateChange(null);
      onDatePresetChange('any');
    }
    setIsCalendarOpen(false);
  };

  const clearDateFilter = () => {
    onDateChange?.(null);
    onDatePresetChange?.('any');
  };

  const getDateDisplay = () => {
    if (datePreset === 'custom' && selectedDate) {
      return format(selectedDate, 'd MMM', { locale });
    }
    return null;
  };
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    const priceConfig = config.priceRange || { min: 0, max: 50000 };
    if (config.showPriceFilter && (priceRange[0] > priceConfig.min || priceRange[1] < priceConfig.max)) count++;
    if (selectedCategory !== 'all') count++;
    if (config.showDateFilters && datePreset !== 'any') count++;
    count += selectedQuickFilters.length;
    count += selectedInlineFilters.length;
    Object.values(chipSelections).forEach(arr => { count += arr.length; });
    return count;
  }, [priceRange, selectedCategory, selectedQuickFilters, selectedInlineFilters, chipSelections, datePreset, config]);

  const hasActiveFilters = activeFilterCount > 0;

  // Sync temp state when drawer opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempPriceRange(priceRange);
      setTempQuickFilters([...selectedQuickFilters]);
      setTempChipSelections({ ...chipSelections });
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    onPriceRangeChange?.(tempPriceRange);
    onQuickFiltersChange?.(tempQuickFilters);
    
    // Apply all chip section changes
    Object.entries(tempChipSelections).forEach(([sectionId, ids]) => {
      onChipSelectionsChange?.(sectionId, ids);
    });
    
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const priceConfig = config.priceRange || { min: 0, max: 50000 };
    setTempPriceRange([priceConfig.min, priceConfig.max]);
    setTempQuickFilters([]);
    setTempChipSelections({});
  };

  const toggleQuickFilter = (id: string) => {
    setTempQuickFilters(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleChipSelection = (sectionId: string, optionId: string) => {
    setTempChipSelections(prev => {
      const current = prev[sectionId] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      return { ...prev, [sectionId]: updated };
    });
  };

  const quickCategories = categories.slice(0, 8);
  const priceConfig = config.priceRange || { min: 0, max: 50000, step: 500 };
  const currencySymbol = config.currencySymbol || '฿';

  return (
    <>
      {/* Sticky Filter Bar */}
      <div className={cn("sticky z-20 bg-background/95 border-b -mx-4 px-4 py-2", stickyTop)}>
        {/* Date Quick Filters (if enabled) */}
        <div 
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-proximity pb-2 -mx-1 px-1 scroll-x-container"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {config.showDateFilters && datePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDatePreset(preset.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap border",
                datePreset === preset.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{isRu ? preset.labelRu : preset.labelEn}</span>
            </button>
          ))}
          
          {/* Calendar picker (if date filters enabled) */}
          {config.showDateFilters && (
            <>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap border",
                      datePreset === 'custom'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{getDateDisplay() || (isRu ? labels.pickDateRu || 'Выбрать дату' : labels.pickDateEn || 'Pick date')}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={handleCalendarSelect}
                    disabled={(date) => date < startOfDay(new Date())}
                    locale={locale}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {datePreset !== 'any' && (
                <button
                  onClick={clearDateFilter}
                  className="flex-shrink-0 px-2 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="w-px h-6 bg-border flex-shrink-0 self-center mx-1" />
            </>
          )}
          
          {/* Inline Quick Filters (visible in sticky bar, not drawer) */}
          {config.inlineQuickFilters && config.inlineQuickFilters.length > 0 && (
            <>
              {config.inlineQuickFilters.map((filter) => {
                const isActive = selectedInlineFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      if (onInlineFiltersChange) {
                        onInlineFiltersChange(
                          isActive
                            ? selectedInlineFilters.filter(f => f !== filter.id)
                            : [...selectedInlineFilters, filter.id]
                        );
                      }
                    }}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {renderIcon(filter.icon)}
                    <span>{isRu ? filter.labelRu : filter.labelEn}</span>
                  </button>
                );
              })}
              <div className="w-px h-6 bg-border flex-shrink-0 self-center mx-1" />
            </>
          )}
          
          {/* Category Quick Chips */}
          <button
            onClick={() => onCategoryChange('all')}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap border",
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:border-primary/50"
            )}
          >
            <span>🌟</span>
            <span>{isRu ? labels.allRu || 'Все' : labels.allEn || 'All'}</span>
          </button>
          {quickCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap border",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {renderIcon(category.icon)}
              <span>{isRu ? category.labelRu : category.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Sort & Filter Row */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            {resultsCount} {isRu ? labels.resultsRu || 'результатов' : labels.resultsEn || 'results'}
          </span>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {isRu ? currentSort?.labelRu : currentSort?.labelEn}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border">
                {config.sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onSortChange(option.id)}
                    className={cn(
                      "text-sm cursor-pointer",
                      sortBy === option.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {isRu ? option.labelRu : option.labelEn}
                    {sortBy === option.id && <Check className="w-4 h-4 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Button */}
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {isRu ? labels.filtersRu || 'Фильтры' : labels.filtersEn || 'Filters'}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 p-0 text-[10px] rounded-full justify-center bg-primary-foreground text-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bottom Sheet - Full height for better UX */}
      <Drawer open={isFilterOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">
                {isRu ? labels.filtersRu || 'Фильтры' : labels.filtersEn || 'Filters'}
              </DrawerTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isRu ? labels.resetRu || 'Сбросить' : labels.resetEn || 'Reset'}
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="px-4 py-5 space-y-5">
              
              {/* Price Range */}
              {config.showPriceFilter && config.pricePresets && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">
                      {isRu ? labels.budgetRu || 'Бюджет' : labels.budgetEn || 'Budget'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {config.pricePresets.map((preset) => {
                        const isActive = tempPriceRange[0] === preset.min && tempPriceRange[1] === preset.max;
                        return (
                          <button
                            key={`${preset.min}-${preset.max}`}
                            onClick={() => setTempPriceRange([preset.min, preset.max])}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {isRu ? preset.labelRu : preset.labelEn}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 px-1">
                      <Slider
                        value={tempPriceRange}
                        onValueChange={(value) => setTempPriceRange(value as [number, number])}
                        min={priceConfig.min}
                        max={priceConfig.max}
                        step={priceConfig.step}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>{currencySymbol}{tempPriceRange[0].toLocaleString()}</span>
                        <span>{currencySymbol}{tempPriceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Quick Filters */}
              {config.quickFilterOptions && config.quickFilterOptions.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">
                      {isRu ? labels.quickFiltersRu || 'Быстрые фильтры' : labels.quickFiltersEn || 'Quick filters'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {config.quickFilterOptions.map((option) => {
                        const isActive = tempQuickFilters.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleQuickFilter(option.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-2 rounded-none text-sm transition-all border",
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {renderIcon(option.icon)}
                            <span>{isRu ? option.labelRu : option.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Dynamic Chip Sections */}
              {config.chipSections?.map((section, idx) => (
                <React.Fragment key={section.id}>
                  <ChipSectionComponent
                    title={isRu ? section.titleRu : section.titleEn}
                    options={section.options}
                    selectedIds={tempChipSelections[section.id] || []}
                    onToggle={(optionId) => toggleChipSelection(section.id, optionId)}
                    language={language}
                    initialVisible={section.initialVisible || 6}
                  />
                  {idx < (config.chipSections?.length || 0) - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <DrawerFooter className="border-t pt-4 flex-shrink-0 pb-safe">
            <Button onClick={handleApplyFilters} className="w-full h-12 text-base">
              {isRu 
                ? `${labels.showResultsRu || 'Показать'} ${resultsCount} ${labels.resultsRu || 'результатов'}` 
                : `${labels.showResultsEn || 'Show'} ${resultsCount} ${labels.resultsEn || 'results'}`
              }
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// Re-export types for convenience
export type { FilterCategory as CategoryOption };
