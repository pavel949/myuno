/**
 * Pure booking model for provider service booking (no I/O).
 *
 * Provider identity (`providers.id`) and order counterparty (`orders.provider_org_id`,
 * FK -> `orgs.id`) are different entities. No trusted provider -> org mapping exists in
 * the schema yet, so callers must never pass a provider UUID as an org UUID.
 */

export const SUPPORTED_CURRENCY = 'THB' as const;

/**
 * UNRESOLVED BUSINESS CONSTRAINTS — not canonical configuration.
 * Kept explicit so they are visible; replace with configured values when they exist.
 */
export const UNRESOLVED_SERVICE_FEE_THB = 100;
export const UNRESOLVED_FIXED_TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export interface ProviderRow {
  id: string;
  name: string;
  logo_url: string | null;
  business_category: string | null;
  is_active: boolean | null;
  approval_status: string | null;
  is_demo: boolean | null;
}

export interface ServiceRow {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  price: number | null;
  currency: string | null;
  is_active: boolean | null;
}

export interface Offering {
  id: string;
  nameEn: string;
  nameRu: string;
  price: number;
  currency: typeof SUPPORTED_CURRENCY;
}

export type ProviderEligibility = 'eligible' | 'missing' | 'inactive';

export function providerEligibility(p: ProviderRow | null | undefined): ProviderEligibility {
  if (!p) return 'missing';
  if (p.is_active !== true || p.approval_status !== 'approved' || p.is_demo === true) return 'inactive';
  return 'eligible';
}

export interface NormalizedOfferings {
  offerings: Offering[];
  rejectedCount: number;
}

/** Keep only active offerings with a finite positive price in the single supported currency. */
export function normalizeOfferings(rows: ServiceRow[] | null | undefined): NormalizedOfferings {
  const offerings: Offering[] = [];
  let rejectedCount = 0;
  for (const r of rows ?? []) {
    const currency = (r.currency ?? SUPPORTED_CURRENCY).trim().toUpperCase();
    const price = typeof r.price === 'number' ? r.price : Number.NaN;
    const name = (r.name_ru || r.name_en || '').trim();
    if (r.is_active !== true || currency !== SUPPORTED_CURRENCY || !Number.isFinite(price) || price <= 0 || !name) {
      rejectedCount += 1;
      continue;
    }
    offerings.push({
      id: r.id,
      nameEn: (r.name_en || r.name_ru || '').trim(),
      nameRu: (r.name_ru || r.name_en || '').trim(),
      price,
      currency: SUPPORTED_CURRENCY,
    });
  }
  return { offerings, rejectedCount };
}

export type OrgResolution =
  | { status: 'mapped'; orgId: string }
  | { status: 'unmapped' }
  | { status: 'ambiguous'; candidateCount: number };

/**
 * Resolve the order counterparty org from EXPLICIT trusted mapping rows only
 * (never by membership or name matching). Currently no such source exists in the schema,
 * so callers pass an empty list and get `unmapped`.
 */
export function resolveProviderOrg(trustedOrgIds: ReadonlyArray<string | null | undefined>): OrgResolution {
  const unique = [...new Set(trustedOrgIds.filter((x): x is string => typeof x === 'string' && x.length > 0))];
  if (unique.length === 0) return { status: 'unmapped' };
  if (unique.length > 1) return { status: 'ambiguous', candidateCount: unique.length };
  return { status: 'mapped', orgId: unique[0] };
}

export interface ServiceOrderInput {
  provider: ProviderRow;
  org: OrgResolution;
  selected: Offering[];
  scheduledAt: Date;
  contact: { name: string; phone: string; email?: string; notes?: string };
  address: string;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'online' | 'promptpay' | 'concierge_advance';
  serviceFee: number;
}

export type ServiceOrderBuild =
  | { ok: true; params: ServiceOrderParams }
  | { ok: false; reason: 'provider_not_eligible' | 'org_unmapped' | 'org_ambiguous' | 'no_services' | 'invalid_amount' | 'mixed_currency' };

export interface ServiceOrderParams {
  booking_type: 'service';
  /** useBooking maps this field to orders.provider_org_id — it MUST be an orgs.id. */
  provider_id: string;
  scheduled_at: Date;
  total_amount: number;
  currency: typeof SUPPORTED_CURRENCY;
  notes?: string;
  items: Array<{ item_type: string; item_id: string; item_name: string; quantity: number; unit_price: number; subtotal: number }>;
  participants: Array<{ name: string; phone: string; email?: string; is_primary: boolean }>;
  addresses: Array<{ address_type: 'service'; address: string }>;
  payment: { amount: number; payment_method: ServiceOrderInput['paymentMethod'] };
  metadata: { provider_id: string; service_ids: string[] };
}

export function buildServiceOrderParams(input: ServiceOrderInput): ServiceOrderBuild {
  if (providerEligibility(input.provider) !== 'eligible') return { ok: false, reason: 'provider_not_eligible' };
  if (input.org.status === 'unmapped') return { ok: false, reason: 'org_unmapped' };
  if (input.org.status === 'ambiguous') return { ok: false, reason: 'org_ambiguous' };
  if (input.selected.length === 0) return { ok: false, reason: 'no_services' };
  if (input.selected.some(s => s.currency !== SUPPORTED_CURRENCY)) return { ok: false, reason: 'mixed_currency' };
  const fee = input.serviceFee;
  if (!Number.isFinite(fee) || fee < 0 || input.selected.some(s => !Number.isFinite(s.price) || s.price <= 0)) {
    return { ok: false, reason: 'invalid_amount' };
  }
  const subtotal = input.selected.reduce((sum, s) => sum + s.price, 0);
  const total = subtotal + fee;
  if (!Number.isFinite(total) || total <= 0) return { ok: false, reason: 'invalid_amount' };

  const items = input.selected.map(s => ({
    item_type: 'service', item_id: s.id, item_name: s.nameRu, quantity: 1, unit_price: s.price, subtotal: s.price,
  }));
  if (fee > 0) {
    items.push({ item_type: 'fee', item_id: 'service_fee', item_name: 'Сервисный сбор', quantity: 1, unit_price: fee, subtotal: fee });
  }

  return {
    ok: true,
    params: {
      booking_type: 'service',
      provider_id: input.org.orgId,
      scheduled_at: input.scheduledAt,
      total_amount: total,
      currency: SUPPORTED_CURRENCY,
      notes: input.contact.notes,
      items,
      participants: [{ name: input.contact.name, phone: input.contact.phone, email: input.contact.email, is_primary: true }],
      addresses: [{ address_type: 'service', address: input.address }],
      payment: { amount: total, payment_method: input.paymentMethod },
      metadata: { provider_id: input.provider.id, service_ids: input.selected.map(s => s.id) },
    },
  };
}
