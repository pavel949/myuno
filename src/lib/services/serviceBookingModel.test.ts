import { describe, it, expect } from 'vitest';
import {
  buildServiceOrderParams, normalizeOfferings, providerEligibility, resolveProviderOrg,
  type ProviderRow, type Offering,
} from './serviceBookingModel';

const provider: ProviderRow = {
  id: 'prov-1', name: 'Phuket Plumbing', logo_url: null, business_category: 'plumbing',
  is_active: true, approval_status: 'approved', is_demo: false,
};
const offering: Offering = { id: 'svc-1', nameEn: 'Leak repair', nameRu: 'Устранение протечки', price: 1200, currency: 'THB' };
const base = {
  provider, selected: [offering], scheduledAt: new Date('2026-10-07T10:00:00+07:00'),
  contact: { name: 'Anna', phone: '+66000' }, address: 'Rawai', paymentMethod: 'cash' as const, serviceFee: 100,
};

describe('providerEligibility', () => {
  it('flags missing, inactive, pending and demo providers', () => {
    expect(providerEligibility(null)).toBe('missing');
    expect(providerEligibility({ ...provider, is_active: false })).toBe('inactive');
    expect(providerEligibility({ ...provider, approval_status: 'pending' })).toBe('inactive');
    expect(providerEligibility({ ...provider, is_demo: true })).toBe('inactive');
    expect(providerEligibility(provider)).toBe('eligible');
  });
});

describe('normalizeOfferings', () => {
  it('keeps only active, positive, finite THB offerings', () => {
    const { offerings, rejectedCount } = normalizeOfferings([
      { id: 'a', name_en: 'A', name_ru: 'А', price: 500, approval_status: 'approved', currency: 'thb', is_active: true },
      { id: 'b', name_en: 'B', name_ru: 'Б', price: 0, approval_status: 'approved', currency: 'THB', is_active: true },
      { id: 'c', name_en: 'C', name_ru: 'В', price: Number.POSITIVE_INFINITY, approval_status: 'approved', currency: 'THB', is_active: true },
      { id: 'd', name_en: 'D', name_ru: 'Г', price: 10, approval_status: 'approved', currency: 'USD', is_active: true },
      { id: 'e', name_en: 'E', name_ru: 'Д', price: 10, approval_status: 'approved', currency: 'THB', is_active: false },
      { id: 'f', name_en: 'F', name_ru: 'Е', price: null, approval_status: 'approved', currency: 'THB', is_active: true },
    ]);
    expect(offerings.map(o => o.id)).toEqual(['a']);
    expect(offerings[0].currency).toBe('THB');
    expect(rejectedCount).toBe(5);
  });
  it('rejects pending, rejected and missing approval even when active', () => {
    const row = { id: 's', name_en: 'Fix', name_ru: 'Fix', price: 100, currency: 'THB', is_active: true };
    for (const approval_status of ['pending', 'rejected', null]) {
      expect(normalizeOfferings([{ ...row, approval_status }]).offerings).toEqual([]);
    }
  });
  it('returns nothing (no invented fallback) for empty input', () => {
    expect(normalizeOfferings([]).offerings).toEqual([]);
    expect(normalizeOfferings(null).offerings).toEqual([]);
  });
});

describe('resolveProviderOrg', () => {
  it('is unmapped without trusted rows, ambiguous with several, mapped with exactly one', () => {
    expect(resolveProviderOrg([])).toEqual({ status: 'unmapped' });
    expect(resolveProviderOrg(['o1', 'o2'])).toEqual({ status: 'ambiguous', candidateCount: 2 });
    expect(resolveProviderOrg(['o1', 'o1', null])).toEqual({ status: 'mapped', orgId: 'o1' });
  });
});

describe('buildServiceOrderParams', () => {
  it('blocks when no org mapping exists — never sends provider id as org id', () => {
    expect(buildServiceOrderParams({ ...base, org: { status: 'unmapped' } })).toEqual({ ok: false, reason: 'org_unmapped' });
    expect(buildServiceOrderParams({ ...base, org: { status: 'ambiguous', candidateCount: 2 } })).toEqual({ ok: false, reason: 'org_ambiguous' });
  });
  it('blocks ineligible providers, empty selection and invalid amounts', () => {
    const org = { status: 'mapped' as const, orgId: 'org-9' };
    expect(buildServiceOrderParams({ ...base, org, provider: { ...provider, is_active: false } })).toMatchObject({ ok: false, reason: 'provider_not_eligible' });
    expect(buildServiceOrderParams({ ...base, org, selected: [] })).toMatchObject({ ok: false, reason: 'no_services' });
    expect(buildServiceOrderParams({ ...base, org, serviceFee: Number.NaN })).toMatchObject({ ok: false, reason: 'invalid_amount' });
    expect(buildServiceOrderParams({ ...base, org, selected: [{ ...offering, price: -5 }] })).toMatchObject({ ok: false, reason: 'invalid_amount' });
  });
  it('builds payload with mapped org as counterparty and provider kept in metadata', () => {
    const r = buildServiceOrderParams({ ...base, org: { status: 'mapped', orgId: 'org-9' } });
    expect(r.ok).toBe(true);
    if ('reason' in r) return;
    expect(r.params.provider_id).toBe('org-9');
    expect(r.params.provider_id).not.toBe(provider.id);
    expect(r.params.metadata).toEqual({ provider_id: 'prov-1', service_ids: ['svc-1'] });
    expect(r.params.total_amount).toBe(1300);
    expect(r.params.payment.amount).toBe(1300);
    expect(r.params.currency).toBe('THB');
  });
});
