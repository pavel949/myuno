// These helpers only shape the existing providers/services admin mutations.
// Database authorization and the allowlisted public projections remain authoritative.
export function optionalAuthoringText(value: string): string | null {
  return value.trim() || null;
}

export function positiveAuthoringNumber(value: string, integer = false): number | null | undefined {
  const text = value.trim();
  if (!text) return null;
  if (!(integer ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/).test(text)) return undefined;
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 && (!integer || (Number.isSafeInteger(parsed) && parsed <= 2_147_483_647))
    ? parsed
    : undefined;
}

export function servicePriceForSave(value: string, savedPrice?: number | null) {
  const trimmed = value.trim();
  // Retain the existing monetary value (also a legacy zero/null) on an unchanged
  // editorial edit; a new or updated price has to be a complete positive decimal.
  if (savedPrice != null && trimmed === String(savedPrice)) return savedPrice;
  return positiveAuthoringNumber(value);
}

export function supplierIsPublishable(provider: {
  is_active: boolean | null;
  approval_status: string | null;
  is_demo: boolean | null;
} | undefined) {
  return provider?.is_active === true && provider.approval_status === 'approved' && provider.is_demo !== true;
}
