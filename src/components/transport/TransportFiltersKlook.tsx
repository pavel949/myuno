/**
 * TransportFiltersKlook - Transport-specific wrapper around UnifiedFiltersKlook
 * 
 * Provides transport vertical with its specific filter configuration
 * using the shared UnifiedFiltersKlook component.
 */

import React, { useMemo } from 'react';
import { 
  UnifiedFiltersKlook, 
  type FilterCategory,
  type DatePreset 
} from '@/components/shared/UnifiedFiltersKlook';
import { TRANSPORT_KLOOK_CONFIG, TRANSPORT_CATEGORIES } from '@/lib/filterConfigs';

export { TRANSPORT_CATEGORIES };
export type { DatePreset };
export type SortOption = 'price_asc' | 'rating' | 'newest';

interface TransportFiltersKlookProps {
  // Category
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  
  // Sort
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  
  // Price
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  
  // Date (for rental)
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  
  // Inline quick filters (Automatic, Insurance, Delivery)
  selectedInlineFilters: string[];
  onInlineFiltersChange: (filters: string[]) => void;
  
  // Vehicle type
  selectedVehicleType: string[];
  onVehicleTypeChange: (types: string[]) => void;
  
  // Transmission
  selectedTransmission: string[];
  onTransmissionChange: (transmission: string[]) => void;
  
  // Fuel type
  selectedFuelType: string[];
  onFuelTypeChange: (fuelType: string[]) => void;
  
  // Features
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  
  // Quick filters (drawer)
  selectedQuickFilters: string[];
  onQuickFiltersChange: (filters: string[]) => void;
  
  // Results
  resultsCount: number;
  language: string;
}

export function TransportFiltersKlook({
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
  selectedInlineFilters,
  onInlineFiltersChange,
  selectedVehicleType,
  onVehicleTypeChange,
  selectedTransmission,
  onTransmissionChange,
  selectedFuelType,
  onFuelTypeChange,
  selectedFeatures,
  onFeaturesChange,
  selectedQuickFilters,
  onQuickFiltersChange,
  resultsCount,
  language,
}: TransportFiltersKlookProps) {
  // Map chip selections to unified format
  const chipSelections = useMemo(() => ({
    vehicleType: selectedVehicleType,
    transmission: selectedTransmission,
    fuelType: selectedFuelType,
    features: selectedFeatures,
  }), [selectedVehicleType, selectedTransmission, selectedFuelType, selectedFeatures]);

  const handleChipSelectionsChange = (sectionId: string, selectedIds: string[]) => {
    switch (sectionId) {
      case 'vehicleType':
        onVehicleTypeChange(selectedIds);
        break;
      case 'transmission':
        onTransmissionChange(selectedIds);
        break;
      case 'fuelType':
        onFuelTypeChange(selectedIds);
        break;
      case 'features':
        onFeaturesChange(selectedIds);
        break;
    }
  };

  return (
    <UnifiedFiltersKlook
      config={TRANSPORT_KLOOK_CONFIG}
      categories={TRANSPORT_CATEGORIES as FilterCategory[]}
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
      selectedInlineFilters={selectedInlineFilters}
      onInlineFiltersChange={onInlineFiltersChange}
      chipSelections={chipSelections}
      onChipSelectionsChange={handleChipSelectionsChange}
      selectedQuickFilters={selectedQuickFilters}
      onQuickFiltersChange={onQuickFiltersChange}
      resultsCount={resultsCount}
      language={language}
    />
  );
}
