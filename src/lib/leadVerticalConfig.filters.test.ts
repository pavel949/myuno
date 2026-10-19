import { describe, expect, it } from 'vitest';
import { getLeadVerticalFilterValues, getLeadSourceFilterValues, getLeadVerticalById } from './leadVerticalConfig';
import { VENDOR_ENTRIES } from './verticals/vendorEntries';

describe('consultation read-side aliases', () => {
  it.each(VENDOR_ENTRIES)('matches canonical and legacy stored values for $id', entry => {
    const expected = [entry.id, ...entry.aliases];
    expect(getLeadVerticalFilterValues(entry.id)).toEqual(expected);
    for (const alias of entry.aliases) expect(getLeadVerticalFilterValues(alias)).toEqual(expected);
  });
  it('retains unknown verticals without mapping them to another category', () => {
    expect(getLeadVerticalFilterValues('concierge')).toEqual(['concierge']);
    expect(getLeadVerticalFilterValues('future_vertical')).toEqual(['future_vertical']);
  });
  it('resolves labels for legacy legal and medical values', () => {
    expect(getLeadVerticalById('legal')?.id).toBe('legal_services');
    expect(getLeadVerticalById('medical')?.id).toBe('clinics');
  });
  it.each(['website', 'referral', 'fab', 'risk_assessment', 'dashboard_recommendation'])('supports stored source case variants for %s', source => {
    expect(getLeadSourceFilterValues(source)).toEqual([source, source.toUpperCase()]);
    expect(getLeadSourceFilterValues(source.toUpperCase())).toEqual([source, source.toUpperCase()]);
  });
});
