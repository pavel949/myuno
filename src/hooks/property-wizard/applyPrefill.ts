import { normalizeFurnishingLevel, normalizeViewTypes } from '@/lib/propertyFormNormalizers';
import type { PropertyFormData } from './types';

/**
 * Pure mapper: merges AI/OTA prefill data onto an existing form snapshot.
 * Extracted from usePropertyWizard.applyPrefillData.
 */
export function mergePrefillIntoForm(
  prev: PropertyFormData,
  prefillData: Record<string, any>,
): PropertyFormData {
  const updated: PropertyFormData = { ...prev };

  // Basic info
  if (prefillData.name_en || prefillData.title) updated.title = prefillData.name_en || prefillData.title;
  if (prefillData.name_ru || prefillData.title_ru) updated.title_ru = prefillData.name_ru || prefillData.title_ru;
  if (prefillData.description_en || prefillData.description) updated.description = prefillData.description_en || prefillData.description;
  if (prefillData.description_ru) updated.description_ru = prefillData.description_ru;
  if (prefillData.bedrooms) updated.bedrooms = prefillData.bedrooms;
  if (prefillData.bathrooms) updated.bathrooms = prefillData.bathrooms;
  if (prefillData.max_guests) updated.max_guests = prefillData.max_guests;
  if (prefillData.property_type) updated.property_type = prefillData.property_type;
  if (prefillData.area_sqm) updated.area_sqm = String(prefillData.area_sqm);

  // Location
  if (prefillData.district) updated.district = prefillData.district;
  if (prefillData.address) updated.address = prefillData.address;
  if (prefillData.lat) updated.lat = prefillData.lat;
  if (prefillData.lng) updated.lng = prefillData.lng;

  // Photos — merge, don't replace
  if (prefillData.images?.length > 0) {
    const existingSet = new Set(prev.images);
    const newImages = prefillData.images.filter((img: string) => !existingSet.has(img));
    updated.images = [...prev.images, ...newImages];
  }
  if (prefillData.cover_image) updated.cover_image = prefillData.cover_image;
  else if (prefillData.images?.[0] && !prev.cover_image) updated.cover_image = prefillData.images[0];

  // Pricing
  if (prefillData.price_per_night) updated.price_per_night = String(prefillData.price_per_night);
  if (prefillData.deposit_amount) updated.deposit_amount = String(prefillData.deposit_amount);
  if (prefillData.min_stay_nights) updated.min_stay_nights = prefillData.min_stay_nights;
  if (prefillData.weekly_discount) updated.weekly_discount = prefillData.weekly_discount;
  if (prefillData.monthly_discount) updated.monthly_discount = prefillData.monthly_discount;

  // Rental conditions
  if (prefillData.cancellation_policy) updated.cancellation_policy = prefillData.cancellation_policy;
  if (prefillData.instant_booking !== undefined) updated.instant_booking = prefillData.instant_booking;

  // Equipment / Amenities — merge with existing
  if (prefillData.equipment?.length > 0) {
    const merged = new Set([...prev.equipment, ...prefillData.equipment]);
    updated.equipment = Array.from(merged);
  }

  // Highlights — merge with existing
  if (prefillData.highlights?.length > 0) {
    const merged = new Set([...prev.highlights, ...prefillData.highlights]);
    updated.highlights = Array.from(merged).slice(0, 12);
  }

  // House rules
  if (prefillData.house_rules) updated.house_rules = prefillData.house_rules;
  if (prefillData.house_rules_ru) updated.house_rules_ru = prefillData.house_rules_ru;
  if (prefillData.pets_allowed !== undefined) updated.pets_allowed = prefillData.pets_allowed;
  if (prefillData.smoking_allowed !== undefined) updated.smoking_allowed = prefillData.smoking_allowed;
  if (prefillData.parties_allowed !== undefined) updated.parties_allowed = prefillData.parties_allowed;
  if (prefillData.children_friendly !== undefined) updated.children_friendly = prefillData.children_friendly;
  if (prefillData.check_in_time) updated.check_in_time = prefillData.check_in_time;
  if (prefillData.check_out_time) updated.check_out_time = prefillData.check_out_time;

  // Physical attributes
  if (prefillData.floor) updated.floor = prefillData.floor;
  if (prefillData.view_type) updated.view_type = normalizeViewTypes(prefillData.view_type);
  if (prefillData.furnishing_level) updated.furnishing_level = normalizeFurnishingLevel(prefillData.furnishing_level);
  if (prefillData.pool_type) updated.pool_type = prefillData.pool_type;
  if (prefillData.parking_type) updated.parking_type = prefillData.parking_type;

  return updated;
}
