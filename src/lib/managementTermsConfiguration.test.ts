import { describe, expect, it } from 'vitest';
import { accountingPolicyIsValid, MANAGEMENT_EXPENSE_KEYS, managementTermsIssues, optionalConfigurationNumber } from './managementTermsConfiguration';
import type { ManagementTermsUpdate } from '@/hooks/usePropertyManagementTerms';
const expenses = Object.fromEntries(MANAGEMENT_EXPENSE_KEYS.map(key => [key, 'owner'])) as ManagementTermsUpdate['expense_responsibility'];
describe('user-entered management configuration', () => {
  it('keeps blank distinct from explicit zero', () => { expect(optionalConfigurationNumber('')).toBeNull(); expect(optionalConfigurationNumber('0')).toBe(0); });
  it('allows an unconfigured draft without adding rules', () => {
    const draft = { commission_type: 'percent' as const, commission_rate: null, payment_day: null, expense_responsibility: {}, accounting_policy: null };
    expect(managementTermsIssues(draft, 'draft')).toEqual([]);
    expect(draft).toEqual({ commission_type: 'percent', commission_rate: null, payment_day: null, expense_responsibility: {}, accounting_policy: null });
  });
  it.each(['active','pending_approval'] as const)('requires explicit values for %s', status => {
    expect(managementTermsIssues({ commission_type: 'percent' }, status)).toEqual(expect.arrayContaining(['commission_required','expenses_required']));
  });
  it('accepts explicitly configured zero percent and zero fixed amounts', () => {
    expect(managementTermsIssues({ commission_type: 'percent', commission_rate: 0, expense_responsibility: expenses }, 'active')).toEqual([]);
    expect(managementTermsIssues({ commission_type: 'fixed', commission_amount: 0, expense_responsibility: expenses }, 'active')).toEqual([]);
  });
  it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid percent %s even in drafts', rate => expect(managementTermsIssues({ commission_rate: rate }, 'draft')).toContain('invalid_number'));
  it.each([0, 32, 1.5])('rejects invalid payout day %s', payment_day => expect(managementTermsIssues({ payment_day })).toContain('invalid_payment_day'));
  it.each([
    { valid_from: '2026-02-30' }, { valid_until: '2026-13-01' },
    { valid_from: '2026-10-18', valid_until: '2026-10-17' },
  ])('rejects invalid validity periods', values => expect(managementTermsIssues(values)).toContain('invalid_dates'));
  it.each([null, {}, { payout_hold_days: 0, minimum_payout: 0, tax_withholding_percent: 0, net_profit_deductions: [] }])('preserves valid optional accounting settings', policy => expect(accountingPolicyIsValid(policy)).toBe(true));
  it.each([
    { arbitrary_default: 7 }, { payout_hold_days: -1 }, { payout_hold_days: 1.5 }, { minimum_payout: Number.POSITIVE_INFINITY },
    { tax_withholding_percent: 101 }, { net_profit_deductions: ['unknown'] }, { include_pending_bookings: 'true' },
    { report_format: null }, { report_frequency: 'weekly' }, { minimum_payout: '0' },
  ])('rejects unsupported or invalid accounting data', policy => expect(accountingPolicyIsValid(policy)).toBe(false));
});

