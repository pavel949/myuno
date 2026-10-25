/** Shared buyer contract. A request never commits inventory or payment. */
export const OFFPLAN_VERTICAL = 'properties' as const;
export type BuyerIntent = 'documents' | 'viewing' | 'reserve_request' | 'consultation';
export type SalesAvailability = 'available' | 'reserved' | 'sold' | 'unavailable' | 'unknown';
export function salesAvailability(status?: string | null): SalesAvailability {
  if (status === 'available') return 'available';
  if (['reserved', 'held', 'soft_hold'].includes(status || '')) return 'reserved';
  if (status === 'sold') return 'sold';
  if (['blocked', 'not_for_sale', 'spa_signed'].includes(status || '')) return 'unavailable';
  return 'unknown';
}
export function buyerRequestContext(projectId: string, intent: BuyerIntent, unitId?: string, propertyId?: string) {
  if (!projectId.trim()) throw new Error('Project is required');
  return { schema_version: 1, project_id: projectId, unit_id: unitId || null, property_id: propertyId || null, offer_id: null, intent, request_only: true };
}

/** Parallel legacy/devmod statuses cannot silently restore availability. */
export function reconcileSalesAvailability(status?: string | null, unitStatus?: string | null): SalesAvailability {
  if (!status) return salesAvailability(unitStatus);
  if (!unitStatus) return salesAvailability(status);
  const legacy = salesAvailability(status), current = salesAvailability(unitStatus);
  if (legacy === current) return current;
  if (legacy === 'available') return current;
  if (current === 'available') return legacy;
  return 'unknown';
}

export function reconcileBuyerPrice(price: number | null, currency: string | null, priceThb: number | null) {
  const legacyValid = Number.isFinite(price) && price! > 0 && /^[A-Z]{3}$/.test(currency || '');
  const thbValid = Number.isFinite(priceThb) && priceThb! > 0;
  if (legacyValid && thbValid && (currency !== 'THB' || price !== priceThb)) return { price: null, currency: null };
  if (thbValid) return { price: priceThb, currency: 'THB' };
  return legacyValid ? { price, currency } : { price: null, currency: null };
}
