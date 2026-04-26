import type { OwnershipData, PropertyFormData } from './types';

interface BuildPayloadArgs {
  formData: PropertyFormData;
  ownershipData: OwnershipData;
  activeOrgId: string | null | undefined;
  approvalStatus: 'draft' | 'pending';
}

/**
 * Pure builder: turns wizard form state into the property record payload.
 * Extracted from usePropertyWizard.buildPropertyPayload.
 */
export function buildPropertyPayload({
  formData,
  ownershipData,
  activeOrgId,
  approvalStatus,
}: BuildPayloadArgs): Record<string, unknown> {
  const isOnBehalf = ownershipData.ownership_type !== 'own';
  const {
    title, title_ru, description, description_ru,
    rental_platforms, custom_platform, platform_listed,
    is_for_sale, sale_price, area_sqm, price_per_night, deposit_amount,
    smoking_allowed, seasonal_pricing,
    ...cleanData
  } = formData;

  const payload: Record<string, unknown> = {
    ...cleanData,
    area_sqm: area_sqm ? Number(area_sqm) : undefined,
    price_per_night: price_per_night ? Number(price_per_night) : undefined,
    deposit_amount: deposit_amount ? Number(deposit_amount) : undefined,
    sale_price: sale_price ? Number(sale_price) : undefined,
    is_for_sale,
    smoking_policy: smoking_allowed ? 'allowed' : 'not_allowed',
    seasonal_pricing: seasonal_pricing && seasonal_pricing.length > 0 ? seasonal_pricing : null,
    title_en: title,
    title,
    title_ru,
    description_en: description,
    description_ru,
    approval_status: approvalStatus,
    is_active: approvalStatus === 'draft' ? false : undefined,
    rental_platform: rental_platforms?.length ? rental_platforms[0] : undefined,
    // listing_modes is a denormalised cache mirrored from tenancy_modes/sale_intent
    // so legacy consumers (useStaysSearch, PropertyCard) keep working.
    listing_modes: Array.from(new Set([
      ...(platform_listed ? ['platform'] : []),
      ...((is_for_sale || (cleanData as any).sale_intent) ? ['sale'] : []),
      ...((cleanData as any).tenancy_modes?.includes?.('short')  ? ['rent', 'short'] : (price_per_night ? ['rent', 'short'] : [])),
      ...((cleanData as any).tenancy_modes?.includes?.('medium') ? ['medium'] : []),
      ...((cleanData as any).tenancy_modes?.includes?.('long')   ? ['long']   : []),
    ])),
    created_on_behalf: isOnBehalf,
    ownership_type: ownershipData.ownership_type,
    actual_owner_email: isOnBehalf ? ownershipData.actual_owner_email : undefined,
    actual_owner_name: isOnBehalf ? ownershipData.actual_owner_name : undefined,
    actual_owner_phone: isOnBehalf ? ownershipData.actual_owner_phone : undefined,
    managed_by_org_id: ownershipData.ownership_type === 'management_agreement' ? activeOrgId : undefined,
    management_document_url: ownershipData.management_document_url || undefined,
    management_document_name: ownershipData.management_document_name || undefined,
    commercial_terms_redacted: ownershipData.commercial_terms_redacted,
    ownership_verification_status: isOnBehalf ? 'pending' : 'verified',
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}
