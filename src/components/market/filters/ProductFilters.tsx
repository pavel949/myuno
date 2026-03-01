import React, { useState } from 'react';
import { SlidersHorizontal, Star, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

export interface ProductFiltersState {
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
  hasDiscount: boolean;
  isNew: boolean;
  isPopular: boolean;
}

interface ProductFiltersProps {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  maxPrice?: number;
  activeCount?: number;
}

const DEFAULT_FILTERS: ProductFiltersState = {
  priceRange: [0, 10000],
  minRating: 0,
  inStockOnly: true,
  hasDiscount: false,
  isNew: false,
  isPopular: false,
};

export function ProductFilters({ 
  filters, 
  onChange, 
  maxPrice = 10000,
  activeCount = 0 
}: ProductFiltersProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS, priceRange: [0, maxPrice] as [number, number] };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  const updateFilter = <K extends keyof ProductFiltersState>(
    key: K, 
    value: ProductFiltersState[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const footer = (
    <div className="flex gap-2 w-full">
      <Button variant="outline" onClick={handleReset} className="flex-1">
        {language === 'ru' ? 'Сбросить' : 'Reset'}
      </Button>
      <Button onClick={handleApply} className="flex-1">
        {language === 'ru' ? 'Применить' : 'Apply Filters'}
      </Button>
    </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <SlidersHorizontal className="w-4 h-4" />
        {language === 'ru' ? 'Фильтры' : 'Filters'}
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
            {activeCount}
          </Badge>
        )}
      </Button>

      <ResponsiveModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={language === 'ru' ? 'Фильтры' : 'Filters'}
        icon={<SlidersHorizontal className="h-5 w-5 text-primary" />}
        size="md"
        footer={footer}
      >
        <div className="space-y-6">
          {/* Price Range */}
          <div className="space-y-3">
            <Label>{language === 'ru' ? 'Цена' : 'Price'}</Label>
            <Slider
              value={localFilters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              min={0}
              max={maxPrice}
              step={100}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>฿{localFilters.priceRange[0]}</span>
              <span>฿{localFilters.priceRange[1]}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>{language === 'ru' ? 'Минимальный рейтинг' : 'Minimum Rating'}</Label>
            <div className="flex gap-2">
              {[0, 3, 4, 4.5].map((rating) => (
                <Button
                  key={rating}
                  variant={localFilters.minRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('minRating', rating)}
                  className="flex-1"
                >
                  {rating === 0 ? (
                    language === 'ru' ? 'Все' : 'All'
                  ) : (
                    <span className="flex items-center gap-1">
                      {rating}
                      <Star className="w-3 h-3 fill-current" />
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={localFilters.inStockOnly}
                onCheckedChange={(checked) => updateFilter('inStockOnly', !!checked)}
              />
              <Label htmlFor="inStock" className="cursor-pointer">
                {language === 'ru' ? 'Только в наличии' : 'In stock only'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDiscount"
                checked={localFilters.hasDiscount}
                onCheckedChange={(checked) => updateFilter('hasDiscount', !!checked)}
              />
              <Label htmlFor="hasDiscount" className="cursor-pointer">
                {language === 'ru' ? 'Со скидкой' : 'On sale'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNew"
                checked={localFilters.isNew}
                onCheckedChange={(checked) => updateFilter('isNew', !!checked)}
              />
              <Label htmlFor="isNew" className="cursor-pointer">
                {language === 'ru' ? 'Новинки' : 'New arrivals'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPopular"
                checked={localFilters.isPopular}
                onCheckedChange={(checked) => updateFilter('isPopular', !!checked)}
              />
              <Label htmlFor="isPopular" className="cursor-pointer">
                {language === 'ru' ? 'Популярные' : 'Popular'}
              </Label>
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}

// Active filters display
export function ActiveFilters({ 
  filters, 
  onChange,
  maxPrice = 10000
}: { 
  filters: ProductFiltersState; 
  onChange: (filters: ProductFiltersState) => void;
  maxPrice?: number;
}) {
  const { language } = useLanguage();
  
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
    activeFilters.push({
      key: 'price',
      label: `฿${filters.priceRange[0]} - ฿${filters.priceRange[1]}`,
      onRemove: () => onChange({ ...filters, priceRange: [0, maxPrice] })
    });
  }

  if (filters.minRating > 0) {
    activeFilters.push({
      key: 'rating',
      label: `${filters.minRating}+ ⭐`,
      onRemove: () => onChange({ ...filters, minRating: 0 })
    });
  }

  if (filters.hasDiscount) {
    activeFilters.push({
      key: 'discount',
      label: language === 'ru' ? 'Скидки' : 'On sale',
      onRemove: () => onChange({ ...filters, hasDiscount: false })
    });
  }

  if (filters.isNew) {
    activeFilters.push({
      key: 'new',
      label: language === 'ru' ? 'Новинки' : 'New',
      onRemove: () => onChange({ ...filters, isNew: false })
    });
  }

  if (filters.isPopular) {
    activeFilters.push({
      key: 'popular',
      label: language === 'ru' ? 'Популярные' : 'Popular',
      onRemove: () => onChange({ ...filters, isPopular: false })
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => (
        <Badge 
          key={filter.key} 
          variant="secondary"
          className="gap-1 pl-2 pr-1"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="p-0.5 hover:bg-muted-foreground/20 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
