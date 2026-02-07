/**
 * YachtFiltersKlook - Yacht-specific wrapper around UnifiedFiltersKlook
 * 
 * Provides yacht vertical with its specific filter configuration
 * using the shared UnifiedFiltersKlook component.
 */

import React, { useMemo } from 'react';
import { 
  UnifiedFiltersKlook, 
  type FilterCategory,
  type DatePreset 
} from '@/components/shared/UnifiedFiltersKlook';
import { YACHT_KLOOK_CONFIG, YACHT_CATEGORIES } from '@/lib/filterConfigs';

export { YACHT_CATEGORIES };
export type { DatePreset };
export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'capacity' | 'length' | 'newest';

interface YachtFiltersKlookProps {
  // Category
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  
  // Sort
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  
  // Price
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  
  // Date
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  
  // Duration (inline quick filters)
  selectedDuration: string[];
  onDurationChange: (durations: string[]) => void;
  
  // Experiences
  selectedExperiences: string[];
  onExperiencesChange: (experiences: string[]) => void;
  
  // Capacity
  selectedCapacity: string[];
  onCapacityChange: (capacity: string[]) => void;
  
  // Amenities
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  
  // Quick filters (drawer)
  selectedQuickFilters: string[];
  onQuickFiltersChange: (filters: string[]) => void;
  
  // Results
  resultsCount: number;
  language: string;
}

export function YachtFiltersKlook({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  selectedDate,
  onDateChange,
  datePreset,
  onDatePresetChange,
  selectedDuration,
  onDurationChange,
  selectedExperiences,
  onExperiencesChange,
  selectedCapacity,
  onCapacityChange,
  selectedAmenities,
  onAmenitiesChange,
  selectedQuickFilters,
  onQuickFiltersChange,
  resultsCount,
  language,
}: YachtFiltersKlookProps) {
  // Map chip selections to unified format
  const chipSelections = useMemo(() => ({
    experiences: selectedExperiences,
    capacity: selectedCapacity,
    amenities: selectedAmenities,
  }), [selectedExperiences, selectedCapacity, selectedAmenities]);

  const handleChipSelectionsChange = (sectionId: string, selectedIds: string[]) => {
    switch (sectionId) {
      case 'experiences':
        onExperiencesChange(selectedIds);
        break;
      case 'capacity':
        onCapacityChange(selectedIds);
        break;
      case 'amenities':
        onAmenitiesChange(selectedIds);
        break;
    }
  };

  return (
    <UnifiedFiltersKlook
      config={YACHT_KLOOK_CONFIG}
      categories={YACHT_CATEGORIES as FilterCategory[]}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      sortBy={sortBy}
      onSortChange={(sort) => onSortChange(sort as SortOption)}
      priceRange={priceRange}
      onPriceRangeChange={onPriceRangeChange}
      selectedDate={selectedDate}
      onDateChange={onDateChange}
      datePreset={datePreset}
      onDatePresetChange={onDatePresetChange}
      selectedInlineFilters={selectedDuration}
      onInlineFiltersChange={onDurationChange}
      chipSelections={chipSelections}
      onChipSelectionsChange={handleChipSelectionsChange}
      selectedQuickFilters={selectedQuickFilters}
      onQuickFiltersChange={onQuickFiltersChange}
      resultsCount={resultsCount}
      language={language}
    />
  );
}
