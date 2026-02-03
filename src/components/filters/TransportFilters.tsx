import { FilterConfig, FilterOption } from './UniversalFilter';
import {
  VEHICLE_CATEGORIES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
} from '@/lib/config/transportTaxonomy';

// ====== VEHICLE TYPES (from taxonomy) ======
export const vehicleTypeOptions: FilterOption[] = VEHICLE_CATEGORIES.map(cat => ({
  id: cat.id,
  labelEn: cat.labelEn,
  labelRu: cat.labelRu,
  icon: cat.icon,
}));

// ====== TRANSMISSION OPTIONS ======
export const transmissionOptions: FilterOption[] = TRANSMISSION_TYPES.map(t => ({
  id: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
  icon: t.icon,
}));

// ====== FUEL TYPE OPTIONS ======
export const fuelTypeOptions: FilterOption[] = FUEL_TYPES.map(f => ({
  id: f.id,
  labelEn: f.labelEn,
  labelRu: f.labelRu,
  icon: f.icon,
}));

// ====== TRANSFER TYPES ======
export const transferTypeOptions: FilterOption[] = [
  { id: 'airport', labelEn: 'Airport Transfer', labelRu: 'Трансфер аэропорт', icon: '✈️' },
  { id: 'hotel', labelEn: 'Hotel Transfer', labelRu: 'Трансфер отель', icon: '🏨' },
  { id: 'hourly', labelEn: 'Hourly Rental', labelRu: 'Почасовая аренда', icon: '⏰' },
  { id: 'day-trip', labelEn: 'Day Trip', labelRu: 'На весь день', icon: '📅' },
];

// ====== VEHICLE FEATURES ======
export const vehicleFeatureOptions: FilterOption[] = [
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: '❄️' },
  { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🔄' },
  { id: 'manual', labelEn: 'Manual', labelRu: 'Механика', icon: '🎛️' },
  { id: 'gps', labelEn: 'GPS Navigation', labelRu: 'GPS навигатор', icon: '📍' },
  { id: 'child-seat', labelEn: 'Child Seat', labelRu: 'Детское кресло', icon: '👶' },
  { id: 'insurance', labelEn: 'Full Insurance', labelRu: 'Полная страховка', icon: '🛡️' },
  { id: 'driver', labelEn: 'With Driver', labelRu: 'С водителем', icon: '👨‍✈️' },
  { id: 'unlimited-km', labelEn: 'Unlimited KM', labelRu: 'Без лимита км', icon: '∞' },
];

// ====== PASSENGER CAPACITY ======
export const passengerOptions: FilterOption[] = [
  { id: '1-2', labelEn: '1-2 Passengers', labelRu: '1-2 пассажира', icon: '👤' },
  { id: '3-4', labelEn: '3-4 Passengers', labelRu: '3-4 пассажира', icon: '👥' },
  { id: '5-7', labelEn: '5-7 Passengers', labelRu: '5-7 пассажиров', icon: '👨‍👩‍👧' },
  { id: '8+', labelEn: '8+ Passengers', labelRu: '8+ пассажиров', icon: '👨‍👩‍👧‍👦' },
];

// ====== COMPLETE TRANSPORT FILTER CONFIG ======
export const transportFilterConfig: FilterConfig = {
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
      options: vehicleTypeOptions,
    },
    {
      id: 'transmission',
      titleEn: 'Transmission',
      titleRu: 'Трансмиссия',
      type: 'single',
      options: transmissionOptions,
    },
    {
      id: 'fuelType',
      titleEn: 'Fuel Type',
      titleRu: 'Тип топлива',
      type: 'multi',
      options: fuelTypeOptions,
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
