import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Check, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  experienceCategoryOptions,
  experienceFeatureOptions,
  experienceDurationOptions,
  experienceDifficultyOptions
} from '@/components/filters/ExperiencesFilters';
import { cn } from '@/lib/utils';

export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'duration';

// Interests/Tags for discovery (Klook style)
const INTEREST_OPTIONS = [
  { id: 'kid-friendly', labelEn: 'Kid-friendly', labelRu: 'Для детей', icon: '👶' },
  { id: 'couples', labelEn: 'Couples', labelRu: 'Для пар', icon: '💑' },
  { id: 'sunset', labelEn: 'Sunset viewing', labelRu: 'Закаты', icon: '🌅' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь', icon: '🌙' },
  { id: 'instagram', labelEn: 'Instagram spots', labelRu: 'Для инста', icon: '📸' },
  { id: 'local-food', labelEn: 'Local food', labelRu: 'Местная еда', icon: '🍜' },
  { id: 'adventure', labelEn: 'Adventure', labelRu: 'Приключения', icon: '🧗' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа', icon: '🌿' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура', icon: '🛕' },
  { id: 'wildlife', labelEn: 'Wildlife', labelRu: 'Животные', icon: '🐘' },
  { id: 'beach', labelEn: 'Beach', labelRu: 'Пляж', icon: '🏖️' },
  { id: 'island-hopping', labelEn: 'Island hopping', labelRu: 'По островам', icon: '🏝️' },
];

// Other features (instant confirm, etc.)
const OTHER_OPTIONS = [
  { id: 'instant', labelEn: 'Instant confirmation', labelRu: 'Мгновенное подтверждение', icon: '⚡' },
  { id: 'free-cancel', labelEn: 'Free cancellation', labelRu: 'Бесплатная отмена', icon: '✓' },
  { id: 'special-offer', labelEn: 'Special offer', labelRu: 'Спецпредложение', icon: '🎁' },
  { id: 'pickup', labelEn: 'Hotel pickup', labelRu: 'Трансфер', icon: '🚐' },
];

const SORT_OPTIONS: { id: SortOption; labelEn: string; labelRu: string }[] = [
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена: по возрастанию' },
  { id: 'price_desc', labelEn: 'Price: High to Low', labelRu: 'Цена: по убыванию' },
  { id: 'duration', labelEn: 'Duration', labelRu: 'По длительности' },
];

interface ExperienceFiltersKlookProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  durationRange: [number, number];
  onDurationRangeChange: (range: [number, number]) => void;
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  resultsCount: number;
  language: string;
}

// Helper to render icon (string emoji or LucideIcon)
function renderIcon(icon: string | LucideIcon | undefined): React.ReactNode {
  if (!icon) return null;
  if (typeof icon === 'string') return <span className="text-sm">{icon}</span>;
  const IconComponent = icon as LucideIcon;
  return <IconComponent className="w-4 h-4" />;
}

// Collapsible chip section with "See more"
function ChipSection({
  title,
  options,
  selectedIds,
  onToggle,
  language,
  initialVisible = 6,
}: {
  title: string;
  options: { id: string; labelEn: string; labelRu: string; icon?: string | LucideIcon }[];
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
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all",
                "border",
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

export function ExperienceFiltersKlook({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  durationRange,
  onDurationRangeChange,
  selectedInterests,
  onInterestsChange,
  selectedFeatures,
  onFeaturesChange,
  resultsCount,
  language,
}: ExperienceFiltersKlookProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempInterests, setTempInterests] = useState(selectedInterests);
  const [tempFeatures, setTempFeatures] = useState(selectedFeatures);
  const isRu = language === 'ru';

  const currentSort = SORT_OPTIONS.find(o => o.id === sortBy) || SORT_OPTIONS[0];
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < 50000) count++;
    if (selectedCategory !== 'all') count++;
    count += selectedInterests.length;
    count += selectedFeatures.length;
    return count;
  }, [priceRange, selectedCategory, selectedInterests, selectedFeatures]);

  const hasActiveFilters = activeFilterCount > 0;

  // Sync temp state when drawer opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempPriceRange(priceRange);
      setTempCategory(selectedCategory);
      setTempInterests([...selectedInterests]);
      setTempFeatures([...selectedFeatures]);
    }
    setIsFilterOpen(open);
  };

  const handleApplyFilters = () => {
    onPriceRangeChange(tempPriceRange);
    onCategoryChange(tempCategory);
    onInterestsChange(tempInterests);
    onFeaturesChange(tempFeatures);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setTempPriceRange([0, 50000]);
    setTempCategory('all');
    setTempInterests([]);
    setTempFeatures([]);
  };

  const toggleInterest = (id: string) => {
    setTempInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleFeature = (id: string) => {
    setTempFeatures(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setTempCategory(prev => prev === id ? 'all' : id);
  };

  // Quick filter chips (horizontal scroll bar)
  const quickCategories = experienceCategoryOptions.slice(0, 8);

  return (
    <>
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 py-2">
        {/* Quick Category Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-2 -mx-1 px-1">
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
            <span>{isRu ? 'Все' : 'All'}</span>
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
            {resultsCount} {isRu ? 'результатов' : 'results'}
          </span>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {isRu ? currentSort.labelRu : currentSort.labelEn}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border">
                {SORT_OPTIONS.map((option) => (
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
              {isRu ? 'Фильтры' : 'Filters'}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 p-0 text-[10px] rounded-full justify-center bg-primary-foreground text-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Klook-style Filter Bottom Sheet */}
      <Drawer open={isFilterOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">{isRu ? 'Фильтры' : 'Filters'}</DrawerTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-muted-foreground text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isRu ? 'Сбросить' : 'Reset'}
              </Button>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1 max-h-[calc(85vh-160px)]">
            <div className="px-4 py-6 space-y-6">
              
              {/* Categories Section - Klook style */}
              <ChipSection
                title={isRu ? 'Категории' : 'Categories'}
                options={experienceCategoryOptions}
                selectedIds={tempCategory === 'all' ? [] : [tempCategory]}
                onToggle={toggleCategory}
                language={language}
                initialVisible={8}
              />

              <Separator />

              {/* Interests Section - Klook style */}
              <ChipSection
                title={isRu ? 'Интересы' : 'Interests'}
                options={INTEREST_OPTIONS}
                selectedIds={tempInterests}
                onToggle={toggleInterest}
                language={language}
                initialVisible={6}
              />

              <Separator />

              {/* Price Range - Klook style */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">{isRu ? 'Цена' : 'Price range'}</h3>
                <div className="text-sm text-muted-foreground mb-2">
                  ฿{tempPriceRange[0].toLocaleString()} - ฿{tempPriceRange[1].toLocaleString()}
                </div>
                <div className="px-2">
                  <Slider
                    value={tempPriceRange}
                    onValueChange={(value) => setTempPriceRange(value as [number, number])}
                    min={0}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>฿0</span>
                    <span>฿50,000</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Others Section - Klook style */}
              <ChipSection
                title={isRu ? 'Другое' : 'Others'}
                options={OTHER_OPTIONS}
                selectedIds={tempFeatures}
                onToggle={toggleFeature}
                language={language}
                initialVisible={4}
              />
            </div>
          </ScrollArea>

          <DrawerFooter className="border-t pt-4">
            <Button onClick={handleApplyFilters} className="w-full h-12 text-base">
              {isRu 
                ? `Показать ${resultsCount} результатов` 
                : `Show ${resultsCount} results`
              }
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
