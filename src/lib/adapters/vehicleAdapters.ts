/**
 * Vehicle Adapters - Centralized mapping for vehicle card props
 * Ensures consistency between DB schema and UI components
 */

import { Users, Briefcase, Gauge, Fuel, DoorOpen } from 'lucide-react';
import type { Vehicle } from '@/hooks/useVehicles';
import {
  getTransmissionLabel,
  getFuelLabel,
  getLocalizedFeatures,
  getCategoryConfig,
} from '@/lib/taxonomies';

export interface VehicleCardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency: string;
  priceLabel: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  meta: Array<{ icon: typeof Users; label: string }>;
  tags: string[];
  badge?: { text: string; className?: string };
}

const DEFAULT_VEHICLE_IMAGE = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600';

/**
 * Map a Vehicle from DB to ItemCard props
 */
export function mapVehicleToCardProps(
  vehicle: Vehicle,
  language: string,
  currencySymbol: string = '฿'
): VehicleCardProps {
  const lang = language === 'ru' ? 'ru' : 'en';
  const categoryConfig = getCategoryConfig(vehicle.vehicle_type);
  
  // Build meta array with real data from DB
  const meta: VehicleCardProps['meta'] = [];
  
  // Capacity (passengers)
  if (vehicle.capacity) {
    meta.push({ icon: Users, label: `${vehicle.capacity}` });
  }
  
  // Luggage capacity
  if (vehicle.luggage_capacity) {
    meta.push({ icon: Briefcase, label: `${vehicle.luggage_capacity}` });
  }
  
  // Transmission - dynamic from DB, not hardcoded
  const transmissionLabel = getTransmissionLabel(vehicle.transmission, lang);
  meta.push({ icon: Gauge, label: transmissionLabel });
  
  // Fuel type
  if (vehicle.fuel_type) {
    const fuelLabel = getFuelLabel(vehicle.fuel_type, lang);
    meta.push({ icon: Fuel, label: fuelLabel });
  }
  
  // Doors (optional, shown if available and space permits)
  // Usually we limit to 4 meta items for cleaner UI
  
  // Get localized features for tags
  const localizedFeatures = getLocalizedFeatures(vehicle.features, lang);
  
  // Build subtitle with year and category
  const subtitleParts: string[] = [];
  if (vehicle.year_built) {
    subtitleParts.push(vehicle.year_built.toString());
  }
  subtitleParts.push(lang === 'ru' ? categoryConfig.labelRu : categoryConfig.labelEn);
  
  return {
    id: vehicle.id,
    image: vehicle.cover_image || DEFAULT_VEHICLE_IMAGE,
    title: lang === 'ru' ? vehicle.name_ru : vehicle.name_en,
    subtitle: subtitleParts.join(' • '),
    rating: vehicle.rating || undefined,
    reviewCount: vehicle.review_count || undefined,
    price: vehicle.price_per_day ?? undefined,
    currency: currencySymbol,
    priceLabel: `/${lang === 'ru' ? 'день' : 'day'}`,
    isVerified: vehicle.is_verified,
    isFeatured: vehicle.is_featured,
    meta: meta.slice(0, 4), // Limit to 4 meta items
    tags: localizedFeatures.slice(0, 2), // Show first 2 features as tags
    badge: vehicle.is_featured ? { text: lang === 'ru' ? 'Популярное' : 'Popular' } : undefined,
  };
}

/**
 * Map vehicle data for booking context
 */
export function mapVehicleToBookingContext(
  vehicle: Vehicle,
  language: string
) {
  const lang = language === 'ru' ? 'ru' : 'en';
  return {
    id: vehicle.id,
    nameEn: vehicle.name_en,
    nameRu: vehicle.name_ru,
    name: lang === 'ru' ? vehicle.name_ru : vehicle.name_en,
    pricePerDay: vehicle.price_per_day || 0,
    pricePerHour: vehicle.price_per_hour || null,
    depositAmount: vehicle.deposit_amount || 0,
    image: vehicle.cover_image || DEFAULT_VEHICLE_IMAGE,
    vehicle_type: vehicle.vehicle_type,
    transmission: vehicle.transmission,
    fuel_type: vehicle.fuel_type,
    capacity: vehicle.capacity,
    features: vehicle.features || [],
  };
}

/**
 * Get vehicle specs for detail page
 */
export function getVehicleSpecs(vehicle: Vehicle, language: string) {
  const lang = language === 'ru' ? 'ru' : 'en';
  const specs: Array<{ icon: typeof Users; label: string; value: string }> = [];
  
  if (vehicle.capacity) {
    specs.push({
      icon: Users,
      label: lang === 'ru' ? 'Пассажиры' : 'Passengers',
      value: `${vehicle.capacity}`,
    });
  }
  
  if (vehicle.luggage_capacity) {
    specs.push({
      icon: Briefcase,
      label: lang === 'ru' ? 'Багаж' : 'Luggage',
      value: `${vehicle.luggage_capacity}`,
    });
  }
  
  if (vehicle.doors) {
    specs.push({
      icon: DoorOpen,
      label: lang === 'ru' ? 'Двери' : 'Doors',
      value: `${vehicle.doors}`,
    });
  }
  
  if (vehicle.transmission) {
    specs.push({
      icon: Gauge,
      label: lang === 'ru' ? 'Трансмиссия' : 'Transmission',
      value: getTransmissionLabel(vehicle.transmission, lang),
    });
  }
  
  if (vehicle.fuel_type) {
    specs.push({
      icon: Fuel,
      label: lang === 'ru' ? 'Топливо' : 'Fuel',
      value: getFuelLabel(vehicle.fuel_type, lang),
    });
  }
  
  return specs;
}
