/**
 * Intake item validation — pre-approve gate.
 * Returns { valid, missing, warnings } for an IntakeItem, based on the
 * vertical config + universal completeness rules.
 */

import { IntakeItem } from '@/hooks/useIntakeAgent';
import { getVerticalById } from '@/lib/intakeVerticals';

export interface IntakeValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/** Treat 0/'' as missing, but keep `false` as a valid value. */
function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function validateIntakeItem(item: IntakeItem): IntakeValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const vertical = getVerticalById(item.detectedVertical);
  const flat: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(item.extractedFields || {})) {
    flat[k] = f?.value;
  }

  // Inject suggestedTitle/Description so AI-generated content counts as present.
  if (isEmpty(flat.name_en) && item.suggestedTitle?.en) flat.name_en = item.suggestedTitle.en;
  if (isEmpty(flat.name_ru) && item.suggestedTitle?.ru) flat.name_ru = item.suggestedTitle.ru;
  if (isEmpty(flat.description_en) && item.suggestedDescription?.en) flat.description_en = item.suggestedDescription.en;
  if (isEmpty(flat.description_ru) && item.suggestedDescription?.ru) flat.description_ru = item.suggestedDescription.ru;
  if (isEmpty(flat.images) && item.sourceImages?.length) flat.images = item.sourceImages;
  if (isEmpty(flat.cover_image) && item.sourceImages?.length) flat.cover_image = item.sourceImages[0];

  // 1) Vertical-required fields (from config)
  const required = vertical?.requiredFields ?? ['name_en'];
  for (const field of required) {
    if (isEmpty(flat[field])) missing.push(field);
  }

  // 2) Universal soft-warnings (these don't block, just signal low quality)
  if (isEmpty(flat.cover_image) && isEmpty(flat.images) && isEmpty(flat.photo) && isEmpty(flat.logo)) {
    warnings.push('no_image');
  }
  if (isEmpty(flat.description_en) && isEmpty(flat.description_ru) && isEmpty(flat.bio_en) && isEmpty(flat.bio_ru)) {
    warnings.push('no_description');
  }

  // 3) Vertical-specific must-haves for usable cards on the storefront
  const t = vertical?.table;
  if (t === 'restaurants' || t === 'salons' || t === 'clinics' || t === 'gyms' || t === 'pharmacies' || t === 'flower_shops' || t === 'lawyers' || t === 'education_centers' || t === 'pet_services') {
    if (isEmpty(flat.address) && isEmpty(flat.district)) warnings.push('no_location');
  }
  if (t === 'yachts' || t === 'tours' || t === 'water_activities' || t === 'vehicles' || t === 'marketplace_products') {
    const hasPrice = !isEmpty(flat.price) || !isEmpty(flat.price_full_day) || !isEmpty(flat.price_half_day) || !isEmpty(flat.price_per_day) || !isEmpty(flat.price_from);
    if (!hasPrice) warnings.push('no_price');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/** Localized human-readable labels for the missing/warning codes. */
export function describeValidation(
  result: IntakeValidationResult,
  isRu: boolean,
  fieldLabels?: Record<string, { en: string; ru: string }>
): { missingText: string; warningText: string } {
  const missingText = result.missing
    .map((f) => {
      const lbl = fieldLabels?.[f];
      if (lbl) return isRu ? lbl.ru : lbl.en;
      return f;
    })
    .join(', ');

  const warnDict: Record<string, { en: string; ru: string }> = {
    no_image: { en: 'no image', ru: 'нет фото' },
    no_description: { en: 'no description', ru: 'нет описания' },
    no_location: { en: 'no address/district', ru: 'нет адреса/района' },
    no_price: { en: 'no price', ru: 'нет цены' },
  };
  const warningText = result.warnings
    .map((w) => warnDict[w]?.[isRu ? 'ru' : 'en'] ?? w)
    .join(', ');

  return { missingText, warningText };
}
