/** Maps a catalogue URL to a CRM lead (consultation_requests). Unknown params stay unknown. */
import type { UniversalLeadInput } from '@/hooks/useUniversalLead';

export type SearchLeadKind = 'rent' | 'buy' | 'experiences';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const list = (v: string | null) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);
const amount = (v: string | null) => { if (v == null || v === '') return undefined; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : undefined; };

export function buildSearchLeadInput(kind: SearchLeadKind, params: URLSearchParams, contact: { name: string; phone: string; notes?: string }): UniversalLeadInput {
  const search: Record<string, string> = {};
  params.forEach((value, key) => { if (key.length <= 40 && value.length <= 200) search[key] = value; });
  const districts = list(params.get('district'));
  const types = list(params.get('types'));
  const guests = Number(params.get('guests'));
  const checkIn = params.get('checkIn'), checkOut = params.get('checkOut');
  const budgetMin = amount(params.get('minPrice')), budgetMax = amount(params.get('maxPrice'));
  return {
    vertical_id: kind === 'experiences' ? 'tours' : 'properties',
    request_type: kind === 'experiences' ? 'experience_search' : kind === 'buy' ? 'property_purchase_search' : 'property_rental_search',
    lead_source: 'organic',
    entry_point: `catalogue_search:${kind}`,
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    notes: contact.notes?.trim() || undefined,
    currency: 'THB',
    budget_min: budgetMin,
    budget_max: budgetMax,
    districts: districts.length ? districts : undefined,
    property_types: kind !== 'experiences' && types.length ? types : undefined,
    guests_count: kind === 'rent' && Number.isSafeInteger(guests) && guests >= 1 && guests <= 50 ? guests : undefined,
    preferred_dates: kind === 'rent' && checkIn && checkOut && DATE.test(checkIn) && DATE.test(checkOut) && checkIn < checkOut ? { check_in: checkIn, check_out: checkOut } : undefined,
    vertical_metadata: { search_kind: kind, search, tenancy: kind === 'rent' ? params.get('tenancy') ?? undefined : undefined },
  };
}
