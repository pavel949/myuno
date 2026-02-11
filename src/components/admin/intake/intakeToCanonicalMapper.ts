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
    price_per_night: f.price_per_night || f.price || '',
    images: f.images || [],
    cover_image: f.cover_image || (f.images?.[0]) || '',
    lat: f.lat ? Number(f.lat) : undefined,
    lng: f.lng ? Number(f.lng) : undefined,
    floor: f.floor ? Number(f.floor) : undefined,
    total_floors: f.total_floors ? Number(f.total_floors) : undefined,
    pool_type: f.pool_type || '',
    view_type: f.view_type || '',
    furnishing_level: f.furnishing_level || '',
    amenities: f.amenities || [],
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
    pool_type: formData.pool_type,
    view_type: formData.view_type,
    furnishing_level: formData.furnishing_level,
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
