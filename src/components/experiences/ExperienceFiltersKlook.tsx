/**
 * ExperienceFiltersKlook - Experience-specific wrapper around UnifiedFiltersKlook
 * 
 * This component provides the Experiences vertical with its specific filter configuration
 * while using the shared UnifiedFiltersKlook component underneath.
 */

import React, { useMemo } from 'react';
import { 
  UnifiedFiltersKlook, 
  UnifiedFiltersKlookConfig,
  FilterCategory,
  DatePreset 
} from '@/components/shared/UnifiedFiltersKlook';

// Re-export types for backward compatibility
export type { FilterCategory as CategoryOption, DatePreset };
export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'duration';

// Experience-specific interest/style options
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

// Quick filter options (instant confirm, free cancel, etc.)
const QUICK_FILTER_OPTIONS = [
  { id: 'instant', labelEn: 'Instant confirmation', labelRu: 'Мгновенное подтверждение', icon: '⚡' },
  { id: 'free-cancel', labelEn: 'Free cancellation', labelRu: 'Бесплатная отмена', icon: '✓' },
  { id: 'special-offer', labelEn: 'Special offer', labelRu: 'Спецпредложение', icon: '🎁' },
  { id: 'pickup', labelEn: 'Hotel pickup', labelRu: 'Трансфер', icon: '🚐' },
];

// Experiences-specific configuration
const EXPERIENCES_CONFIG: UnifiedFiltersKlookConfig = {
  showDateFilters: true,
  datePresets: [
    { id: 'today', labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра' },
    { id: 'this-week', labelEn: 'This week', labelRu: 'Эта неделя' },
  ],
  
  showPriceFilter: true,
  pricePresets: [
    { min: 0, max: 1000, labelEn: 'Under ฿1K', labelRu: 'До ฿1K' },
    { min: 1000, max: 3000, labelEn: '฿1K-3K', labelRu: '฿1K-3K' },
    { min: 3000, max: 10000, labelEn: '฿3K-10K', labelRu: '฿3K-10K' },
    { min: 10000, max: 50000, labelEn: '฿10K+', labelRu: '฿10K+' },
  ],
  priceRange: { min: 0, max: 50000, step: 500 },
  currencySymbol: '฿',
  
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена: по возрастанию' },
    { id: 'price_desc', labelEn: 'Price: High to Low', labelRu: 'Цена: по убыванию' },
    { id: 'duration', labelEn: 'Duration', labelRu: 'По длительности' },
  ],
  
  quickFilterOptions: QUICK_FILTER_OPTIONS,
  
  chipSections: [
    {
      id: 'interests',
      titleEn: 'Travel style',
      titleRu: 'Стиль путешествия',
      options: INTEREST_OPTIONS,
      initialVisible: 8,
    },
  ],
};

interface ExperienceFiltersKlookProps {
  categories: FilterCategory[];
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
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  resultsCount: number;
  language: string;
}

export function ExperienceFiltersKlook({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  selectedInterests,
  onInterestsChange,
  selectedFeatures,
  onFeaturesChange,
  selectedDate,
  onDateChange,
  datePreset,
  onDatePresetChange,
  resultsCount,
  language,
}: ExperienceFiltersKlookProps) {
  // Map interests and features to chip selections format
  const chipSelections = useMemo(() => ({
    interests: selectedInterests,
  }), [selectedInterests]);

  const handleChipSelectionsChange = (sectionId: string, selectedIds: string[]) => {
    if (sectionId === 'interests') {
      onInterestsChange(selectedIds);
    }
  };

  return (
    <UnifiedFiltersKlook
      config={EXPERIENCES_CONFIG}
      categories={categories}
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
      chipSelections={chipSelections}
      onChipSelectionsChange={handleChipSelectionsChange}
      selectedQuickFilters={selectedFeatures}
      onQuickFiltersChange={onFeaturesChange}
      resultsCount={resultsCount}
      language={language}
    />
  );
}
