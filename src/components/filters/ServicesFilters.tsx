/**
 * Services Filters - Database-Driven
 * Uses useDynamicFilterOptions for all taxonomy data
 */

import { useHomeServiceFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { FilterConfig, FilterOption } from './UniversalFilter';

// Re-export the dynamic hook
export { useHomeServiceFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Legacy static exports (empty, use hook instead)
export const serviceCategoryOptions: FilterOption[] = [];
export const serviceDomainOptions: FilterOption[] = [];
export const providerTypeOptions: FilterOption[] = [];

// Service features - static as they're platform-wide
export const serviceFeatureOptions: FilterOption[] = [
  { id: 'verified', labelEn: 'Verified', labelRu: 'Проверенные', icon: '✅' },
  { id: 'insured', labelEn: 'Insured', labelRu: 'Застрахованы', icon: '🛡️' },
  { id: 'guaranteed', labelEn: 'Guaranteed', labelRu: 'Гарантия работ', icon: '💯' },
  { id: 'fast-response', labelEn: 'Fast Response', labelRu: 'Быстрый отклик', icon: '⚡' },
  { id: 'english', labelEn: 'English Speaking', labelRu: 'Говорят по-английски', icon: '🇬🇧' },
  { id: 'russian', labelEn: 'Russian Speaking', labelRu: 'Говорят по-русски', icon: '🇷🇺' },
];

// Booking type options - static
export const bookingTypeOptions: FilterOption[] = [
  { id: 'hourly', labelEn: 'Hourly', labelRu: 'Почасовая', icon: '⏰' },
  { id: 'fixed', labelEn: 'Fixed Price', labelRu: 'Фикс цена', icon: '💵' },
  { id: 'subscription', labelEn: 'Subscription', labelRu: 'Подписка', icon: '🔄' },
];

// Export a function to get the filter config
export function getServicesFilterConfig(): FilterConfig {
  return {
    sections: [
      {
        id: 'providerType',
        titleEn: 'Provider Type',
        titleRu: 'Тип исполнителя',
        type: 'single',
        options: [],
      },
      {
        id: 'priceLevel',
        titleEn: 'Price Level',
        titleRu: 'Уровень цен',
        type: 'price-level',
        options: [],
      },
      {
        id: 'category',
        titleEn: 'Service Type',
        titleRu: 'Тип услуги',
        type: 'multi',
        options: [],
      },
      {
        id: 'bookingType',
        titleEn: 'Pricing',
        titleRu: 'Оплата',
        type: 'single',
        options: bookingTypeOptions,
      },
      {
        id: 'features',
        titleEn: 'Features',
        titleRu: 'Особенности',
        type: 'multi',
        options: serviceFeatureOptions,
      },
    ],
  };
}

// For backwards compatibility
export const servicesFilterConfig = getServicesFilterConfig();
