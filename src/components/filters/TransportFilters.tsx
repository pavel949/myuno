/**
 * Transport Filters - Database-Driven
 * Uses useDynamicFilterOptions for all taxonomy data
 */

import { useTransportFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { FilterConfig, FilterOption } from './UniversalFilter';

// Re-export the dynamic hook
export { useTransportFilterOptions } from '@/hooks/useDynamicFilterOptions';

// Legacy static exports (empty, use hook instead)
export const vehicleTypeOptions: FilterOption[] = [];
export const transmissionOptions: FilterOption[] = [];
export const fuelTypeOptions: FilterOption[] = [];

// Transfer types - static as they're specific to booking flow
export const transferTypeOptions: FilterOption[] = [
  { id: 'airport', labelEn: 'Airport Transfer', labelRu: 'Трансфер аэропорт', icon: '✈️' },
  { id: 'hotel', labelEn: 'Hotel Transfer', labelRu: 'Трансфер отель', icon: '🏨' },
  { id: 'hourly', labelEn: 'Hourly Rental', labelRu: 'Почасовая аренда', icon: '⏰' },
  { id: 'day-trip', labelEn: 'Day Trip', labelRu: 'На весь день', icon: '📅' },
];

// Passenger options - static as numeric
export const passengerOptions: FilterOption[] = [
  { id: '1-2', labelEn: '1-2 Passengers', labelRu: '1-2 пассажира', icon: '👤' },
  { id: '3-4', labelEn: '3-4 Passengers', labelRu: '3-4 пассажира', icon: '👥' },
  { id: '5-7', labelEn: '5-7 Passengers', labelRu: '5-7 пассажиров', icon: '👨‍👩‍👧' },
  { id: '8+', labelEn: '8+ Passengers', labelRu: '8+ пассажиров', icon: '👨‍👩‍👧‍👦' },
];

// Vehicle features - static fallback
export const vehicleFeatureOptions: FilterOption[] = [
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🔄' },
  { id: 'gps', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'child-seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'insurance', labelEn: 'Full Insurance', labelRu: 'Полная страховка', icon: '🛡️' },
  { id: 'driver', labelEn: 'With Driver', labelRu: 'С водителем', icon: '👨‍✈️' },
  { id: 'unlimited-km', labelEn: 'Unlimited KM', labelRu: 'Без лимита км', icon: '∞' },
];

// Export a function to get the filter config
export function getTransportFilterConfig(): FilterConfig {
  return {
    sections: [
      {
        id: 'priceLevel',
        titleEn: 'Price Level',
        titleRu: 'Уровень цен',
        type: 'price-level',
        options: [],
      },
      {
        id: 'vehicleType',
        titleEn: 'Vehicle Type',
        titleRu: 'Тип транспорта',
        type: 'multi',
        options: [],
      },
      {
        id: 'transmission',
        titleEn: 'Transmission',
        titleRu: 'Трансмиссия',
        type: 'single',
        options: [],
      },
      {
        id: 'fuelType',
        titleEn: 'Fuel Type',
        titleRu: 'Тип топлива',
        type: 'multi',
        options: [],
      },
      {
        id: 'passengers',
        titleEn: 'Passengers',
        titleRu: 'Пассажиры',
        type: 'single',
        options: passengerOptions,
      },
      {
        id: 'features',
        titleEn: 'Features',
        titleRu: 'Особенности',
        type: 'multi',
        options: vehicleFeatureOptions,
      },
    ],
  };
}

// For backwards compatibility
export const transportFilterConfig = getTransportFilterConfig();
