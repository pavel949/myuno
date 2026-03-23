/**
 * Values stored in `deal_field_changes` must match {@link diffDealFields} encoding
 * so the deal History tab renders consistently.
 */
export function auditFieldValue(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value);
}
