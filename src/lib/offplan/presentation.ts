import { getProjectFacilityLabel } from '@/lib/propertyAttributeRegistry';
import { getAmenityLabel } from '@/lib/propertyTaxonomy';
import { parseCivilDate } from '@/lib/hotelDates';

/** Display-only fallback: retain source words/numbers rather than infer new facts. */
export function projectFeatureLabel(value: string, language: string): string {
  const locale = language === 'ru' ? 'ru' : 'en';
  const facility = getProjectFacilityLabel(value, locale);
  if (facility !== value) return facility;
  const amenity = getAmenityLabel(value, locale);
  return amenity !== value ? amenity : value.replace(/_/g, ' ');
}

export function projectCompletionLabel(value: string, language: string): string {
  const date = parseCivilDate(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US', {
    month: 'short', year: 'numeric', calendar: 'gregory',
  });
}
