import React, { useState } from 'react';
import { Filter, ArrowUpDown, ChevronDown, X, SlidersHorizontal, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerFooter,
  DrawerClose 
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { EXPERIENCE_CATEGORIES } from '@/hooks/useExperiences';
import { cn } from '@/lib/utils';

export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'duration';

interface ExperienceFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  durationRange: [number, number];
  onDurationRangeChange: (range: [number, number]) => void;
  resultsCount: number;
  language: string;
}

const SORT_OPTIONS: { id: SortOption; labelEn: string; labelRu: string }[] = [
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена: по возрастанию' },
  { id: 'price_desc', labelEn: 'Price: High to Low', labelRu: 'Цена: по убыванию' },
  { id: 'duration', labelEn: 'Duration', labelRu: 'По длительности' },
];

export function ExperienceFilters({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  durationRange,
  onDurationRangeChange,
  resultsCount,
  language,
}: ExperienceFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);
  const [tempDurationRange, setTempDurationRange] = useState(durationRange);
  const isRu = language === 'ru';

  const currentSort = SORT_OPTIONS.find(o => o.id === sortBy) || SORT_OPTIONS[0];
  
  const hasActiveFilters = 
    priceRange[0] > 0 || 
    priceRange[1] < 50000 || 
    durationRange[0] > 0 || 
    durationRange[1] < 480;

  const activeFilterCount = [
    priceRange[0] > 0 || priceRange[1] < 50000,
    durationRange[0] > 0 || durationRange[1] < 480,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    onPriceRangeChange(tempPriceRange);
    onDurationRangeChange(tempDurationRange);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setTempPriceRange([0, 50000]);
    setTempDurationRange([0, 480]);
    onPriceRangeChange([0, 50000]);
    onDurationRangeChange([0, 480]);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}${isRu ? 'м' : 'm'}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}${isRu ? 'ч' : 'h'}`;
    return `${hours}${isRu ? 'ч' : 'h'} ${mins}${isRu ? 'м' : 'm'}`;
  };

  return (
    <>
      {/* Sticky Filter Bar - Klook style */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 py-2">
        {/* Category Chips - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-2 -mx-1 px-1">
          {EXPERIENCE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{category.icon}</span>
              <span>{isRu ? category.labelRu : category.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Sort & Filter Row */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Results count */}
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
              <DropdownMenuContent align="end" className="w-48">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onSortChange(option.id)}
                    className={cn(
                      "text-sm",
                      sortBy === option.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {isRu ? option.labelRu : option.labelEn}
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
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] rounded-full justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bottom Sheet - Klook style */}
      <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>{isRu ? 'Фильтры' : 'Filters'}</DrawerTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-primary text-xs"
                >
                  {isRu ? 'Сбросить' : 'Reset'}
                </Button>
              )}
            </div>
          </DrawerHeader>

          <div className="px-4 py-6 space-y-8 overflow-y-auto">
            {/* Price Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="font-medium">{isRu ? 'Цена' : 'Price'}</h3>
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
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>฿{tempPriceRange[0].toLocaleString()}</span>
                  <span>฿{tempPriceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Duration Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-medium">{isRu ? 'Длительность' : 'Duration'}</h3>
              </div>
              <div className="px-2">
                <Slider
                  value={tempDurationRange}
                  onValueChange={(value) => setTempDurationRange(value as [number, number])}
                  min={0}
                  max={480}
                  step={30}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{formatDuration(tempDurationRange[0])}</span>
                  <span>{formatDuration(tempDurationRange[1])}</span>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t">
            <Button onClick={handleApplyFilters} className="w-full">
              {isRu ? `Показать ${resultsCount} результатов` : `Show ${resultsCount} results`}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
