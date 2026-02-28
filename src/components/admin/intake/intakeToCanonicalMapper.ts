/**
 * Bidirectional mapping between IntakeItem and Canonical form data.
 * 
 * IntakeItem.extractedFields -> CanonicalPropertyFormData / CanonicalListingData
 * CanonicalPropertyFormData / CanonicalListingData -> IntakeItem partial updates
 */

import { IntakeItem, ExtractedField } from '@/hooks/useIntakeAgent';
import { CanonicalPropertyFormData } from '@/components/property/canonical-form';
import { CanonicalListingData } from '@/components/vendor/wizard/CanonicalListingWizard';

// ==================== HELPERS ====================

/** Extract flat values from IntakeItem.extractedFields */
function flattenExtracted(fields: Record<string, ExtractedField>): Record<string, any> {
  const flat: Record<string, any> = {};
  for (const [key, field] of Object.entries(fields)) {
    flat[key] = field.value;
  }
  return flat;
}

/** Convert flat values back to ExtractedField format with 100% confidence (user-edited) */
function toExtractedFields(flat: Record<string, any>): Record<string, ExtractedField> {
  const result: Record<string, ExtractedField> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = { value, confidence: 1, source: 'text' };
    }
  }
  return result;
}

// ==================== PROPERTY MAPPING ====================

export function mapIntakeToPropertyForm(item: IntakeItem): CanonicalPropertyFormData {
  const f = flattenExtracted(item.extractedFields);

  return {
    title_en: f.name_en || item.suggestedTitle?.en || '',
    title_ru: f.name_ru || item.suggestedTitle?.ru || '',
    description_en: f.description_en || item.suggestedDescription?.en || '',
    description_ru: f.description_ru || item.suggestedDescription?.ru || '',
    property_type: f.property_type || 'apartment',
    address: f.address || f.location || '',
    district: f.district || '',
    bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
    bathrooms: f.bathrooms ? Number(f.bathrooms) : undefined,
    area_sqm: f.area_sqm || f.area || '',
    price: f.price ? Number(f.price) : undefined,
    price_per_night: f.price_per_night || f.price_per_day || f.price || '',
    images: f.images || [],
    cover_image: f.cover_image || (f.images?.[0]) || '',
    lat: f.lat ? Number(f.lat) : undefined,
    lng: f.lng ? Number(f.lng) : undefined,
    floor: f.floor ? Number(f.floor) : undefined,
    total_floors: f.total_floors ? Number(f.total_floors) : undefined,
    parking_type: f.parking_type || '',
    pool_type: f.pool_type || '',
    garden_type: f.garden_type || '',
    view_type: f.view_type || '',
    furnishing_level: f.furnishing_level || '',
    equipment: f.equipment || [],
    amenities: f.amenities || [],
    highlights: f.highlights || [],
    // Pricing & Terms
    // (price_per_night already set above)
    deposit_amount: f.deposit_amount || '',
    min_stay_nights: f.min_stay_nights ? Number(f.min_stay_nights) : undefined,
    max_guests: f.max_guests ? Number(f.max_guests) : undefined,
    check_in_time: f.check_in_time || '',
    check_out_time: f.check_out_time || '',
    instant_booking: f.instant_booking === true || f.instant_booking === 'true',
    weekly_discount: f.weekly_discount ? Number(f.weekly_discount) : undefined,
    monthly_discount: f.monthly_discount ? Number(f.monthly_discount) : undefined,
    cancellation_policy: f.cancellation_policy || '',
    // Structure
    unit_number: f.unit_number || '',
    plot_size_sqm: f.plot_size_sqm ? Number(f.plot_size_sqm) : undefined,
    has_elevator: f.has_elevator === true || f.has_elevator === 'true',
    // Ownership
    ownership_form: f.ownership_form || undefined,
    management_type: f.management_type || '',
    is_for_sale: f.is_for_sale === true || f.is_for_sale === 'true',
    sale_price: f.sale_price || '',
    // House Rules
    pets_allowed: f.pets_allowed === true || f.pets_allowed === 'true',
    pet_deposit: f.pet_deposit ? Number(f.pet_deposit) : undefined,
    smoking_allowed: f.smoking_allowed === true || f.smoking_allowed === 'true',
    parties_allowed: f.parties_allowed === true || f.parties_allowed === 'true',
    children_friendly: f.children_friendly === true || f.children_friendly === 'true',
    quiet_hours_start: f.quiet_hours_start || '',
    quiet_hours_end: f.quiet_hours_end || '',
    house_rules: f.house_rules || '',
    house_rules_ru: f.house_rules_ru || '',
    internal_name: f.internal_name || '',
    is_active: true,
    approval_status: 'pending',
  };
}

export function mapPropertyFormToIntake(
  formData: CanonicalPropertyFormData,
  originalItem: IntakeItem
): Partial<IntakeItem> {
  const flat: Record<string, any> = {
    name_en: formData.title_en || formData.title,
    name_ru: formData.title_ru,
    description_en: formData.description_en || formData.description,
    description_ru: formData.description_ru,
    property_type: formData.property_type,
    address: formData.address,
    district: formData.district,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    area_sqm: formData.area_sqm,
    price: formData.price || formData.price_per_night,
    price_per_night: formData.price_per_night,
    images: formData.images,
    cover_image: formData.cover_image,
    lat: formData.lat,
    lng: formData.lng,
    floor: formData.floor,
    total_floors: formData.total_floors,
    parking_type: formData.parking_type,
    pool_type: formData.pool_type,
    garden_type: formData.garden_type,
    view_type: formData.view_type,
    furnishing_level: formData.furnishing_level,
    equipment: formData.equipment,
    highlights: formData.highlights,
    // (price_per_night already set above)
    deposit_amount: formData.deposit_amount,
    min_stay_nights: formData.min_stay_nights,
    max_guests: formData.max_guests,
    check_in_time: formData.check_in_time,
    check_out_time: formData.check_out_time,
    instant_booking: formData.instant_booking,
    weekly_discount: formData.weekly_discount,
    monthly_discount: formData.monthly_discount,
    cancellation_policy: formData.cancellation_policy,
    unit_number: formData.unit_number,
    plot_size_sqm: formData.plot_size_sqm,
    has_elevator: formData.has_elevator,
    ownership_form: formData.ownership_form,
    management_type: formData.management_type,
    is_for_sale: formData.is_for_sale,
    sale_price: formData.sale_price,
    pets_allowed: formData.pets_allowed,
    smoking_allowed: formData.smoking_allowed,
    parties_allowed: formData.parties_allowed,
    children_friendly: formData.children_friendly,
    quiet_hours_start: formData.quiet_hours_start,
    quiet_hours_end: formData.quiet_hours_end,
    house_rules: formData.house_rules,
    house_rules_ru: formData.house_rules_ru,
    internal_name: formData.internal_name,
  };

  return {
    extractedFields: toExtractedFields(flat),
    suggestedTitle: {
      en: formData.title_en || formData.title || originalItem.suggestedTitle.en,
      ru: formData.title_ru || originalItem.suggestedTitle.ru,
    },
    suggestedDescription: {
      en: formData.description_en || formData.description || originalItem.suggestedDescription.en,
      ru: formData.description_ru || originalItem.suggestedDescription.ru,
    },
    overallConfidence: 0.95,
    missingRequiredFields: [],
  };
}

// ==================== LISTING MAPPING ====================

export function mapIntakeToListingData(item: IntakeItem): Partial<CanonicalListingData> {
  const f = flattenExtracted(item.extractedFields);

  return {
    title_en: f.name_en || item.suggestedTitle?.en || '',
    title_ru: f.name_ru || item.suggestedTitle?.ru || '',
    short_description_en: f.short_description_en || '',
    short_description_ru: f.short_description_ru || '',
    full_description_en: f.description_en || item.suggestedDescription?.en || '',
    full_description_ru: f.description_ru || item.suggestedDescription?.ru || '',
    base_price: f.price ? Number(f.price) : 0,
    cover_image: f.cover_image || (f.images?.[0]) || '',
    gallery: f.images || [],
    features: f.features || f.amenities || [],
    pricing_model: f.pricing_model || 'fixed',
    availability_type: f.availability_type || 'request',
    category_id: f.category_id || '',
  };
}

export function mapListingDataToIntake(
  formData: Partial<CanonicalListingData>,
  originalItem: IntakeItem
): Partial<IntakeItem> {
  const flat: Record<string, any> = {
    name_en: formData.title_en,
    name_ru: formData.title_ru,
    description_en: formData.full_description_en,
    description_ru: formData.full_description_ru,
    short_description_en: formData.short_description_en,
    short_description_ru: formData.short_description_ru,
    price: formData.base_price,
    cover_image: formData.cover_image,
    images: formData.gallery,
    features: formData.features,
    pricing_model: formData.pricing_model,
    availability_type: formData.availability_type,
    category_id: formData.category_id,
  };

  return {
    extractedFields: toExtractedFields(flat),
    suggestedTitle: {
      en: formData.title_en || originalItem.suggestedTitle.en,
      ru: formData.title_ru || originalItem.suggestedTitle.ru,
    },
    suggestedDescription: {
      en: formData.full_description_en || originalItem.suggestedDescription.en,
      ru: formData.full_description_ru || originalItem.suggestedDescription.ru,
    },
    overallConfidence: 0.95,
    missingRequiredFields: [],
  };
}

// ==================== VERTICAL DETECTION ====================

export const PROPERTY_VERTICALS = ['properties', 'property', 'real_estate'];

/** All verticals that should use CanonicalListingWizard */
export const LISTING_VERTICALS = [
  // Plural forms (URL slugs, legacy)
  'yachts', 'experiences', 'restaurants', 'salons', 'clinics',
  'gyms', 'babysitters', 'cleaning_services', 'pet_services',
  'legal_services', 'education_providers', 'events',
  'water_activities', 'flower_shops', 'insurance_providers',
  'vehicles', 'transfers',
  // Singular forms (canonical vertical IDs)
  'yacht', 'experience', 'restaurant', 'beauty', 'medical',
  'fitness', 'babysitter', 'cleaning', 'pet_service',
  'legal', 'education', 'event', 'water_activity',
  'flower', 'insurance', 'vehicle', 'transfer',
];

export function getFormType(detectedVertical: string): 'property' | 'listing' | 'generic' {
  if (PROPERTY_VERTICALS.includes(detectedVertical)) return 'property';
  if (LISTING_VERTICALS.includes(detectedVertical)) return 'listing';
  return 'generic';
}
