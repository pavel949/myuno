import type { ManagementTermsUpdate } from '@/hooks/usePropertyManagementTerms';
import type { AccountingPolicy } from '@/hooks/usePayoutRules';

export const MANAGEMENT_EXPENSE_KEYS = ['cleaning', 'electricity', 'water', 'internet', 'repairs_minor', 'repairs_major', 'cam_fees', 'insurance', 'marketing'] as const;
export type AccountingPolicyDraft = Partial<AccountingPolicy>;
export type ManagementTermsIssue = 'commission_required' | 'invalid_number' | 'invalid_payment_day' | 'invalid_dates' | 'expenses_required' | 'invalid_accounting_policy';

export function optionalConfigurationNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}
const finiteBetween = (value: unknown, min: number, max = Number.MAX_VALUE) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const civilDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export function accountingPolicyIsValid(policy: unknown): policy is AccountingPolicyDraft | null {
  if (policy === null) return true;
  if (typeof policy !== 'object' || Array.isArray(policy)) return false;
  const p = policy as Record<string, unknown>;
  const allowed = ['net_profit_deductions','report_frequency','report_format','report_language','minimum_payout','payout_hold_days','include_pending_bookings','owner_approval_required_above','tax_withholding_percent'];
  if (Object.keys(p).some(key => !allowed.includes(key))) return false;
  if ('net_profit_deductions' in p && (!Array.isArray(p.net_profit_deductions) || p.net_profit_deductions.some(key => !MANAGEMENT_EXPENSE_KEYS.includes(key as typeof MANAGEMENT_EXPENSE_KEYS[number])))) return false;
  if ('report_frequency' in p && !['monthly','quarterly','on_demand'].includes(String(p.report_frequency))) return false;
  if ('report_format' in p && !['summary','detailed'].includes(String(p.report_format))) return false;
  if ('report_language' in p && (typeof p.report_language !== 'string' || !/^[a-z]{2}(-[A-Z]{2})?$/.test(p.report_language))) return false;
  if ('include_pending_bookings' in p && typeof p.include_pending_bookings !== 'boolean') return false;
  for (const key of ['minimum_payout', 'owner_approval_required_above', 'payout_hold_days', 'tax_withholding_percent']) {
    const value = p[key];
    if (!(key in p) || value === null) continue;
    if (!finiteBetween(value, 0, key === 'tax_withholding_percent' ? 100 : Number.MAX_VALUE)) return false;
    if (key === 'payout_hold_days' && !Number.isSafeInteger(value)) return false;
  }
  return true;
}

export function managementTermsIssues(data: ManagementTermsUpdate, status = data.status ?? 'draft'): ManagementTermsIssue[] {
  const issues: ManagementTermsIssue[] = [];
  const numeric = [data.commission_rate, data.commission_amount, data.revenue_split_owner, data.revenue_split_manager];
  if (numeric.some(v => v !== null && v !== undefined && !finiteBetween(v, 0))
    || [data.commission_rate, data.revenue_split_owner, data.revenue_split_manager].some(v => v !== null && v !== undefined && !finiteBetween(v, 0, 100))) issues.push('invalid_number');
  if (data.payment_day !== null && data.payment_day !== undefined && (!Number.isInteger(data.payment_day) || !finiteBetween(data.payment_day, 1, 31))) issues.push('invalid_payment_day');
  if ((data.valid_from && !civilDate(data.valid_from)) || (data.valid_until && !civilDate(data.valid_until))
    || (data.valid_from && data.valid_until && data.valid_until < data.valid_from)) issues.push('invalid_dates');
  if (data.accounting_policy !== undefined && !accountingPolicyIsValid(data.accounting_policy)) issues.push('invalid_accounting_policy');
  if (status === 'active' || status === 'pending_approval') {
    const value = data.commission_type === 'fixed' ? data.commission_amount : data.commission_rate;
    if (value === null || value === undefined) issues.push('commission_required');
    if (MANAGEMENT_EXPENSE_KEYS.some(key => !['owner','manager','split'].includes(data.expense_responsibility?.[key] ?? ''))) issues.push('expenses_required');
  }
  return [...new Set(issues)];
}
export function managementTermsIssueMessage(issue: ManagementTermsIssue, isRu: boolean) {
  const messages: Record<ManagementTermsIssue, [string, string]> = {
    commission_required: ['Enter a commission value before activation or approval.', 'Укажите размер комиссии перед активацией или согласованием.'],
    invalid_number: ['Enter finite non-negative amounts and percentages from 0 to 100.', 'Укажите конечные неотрицательные суммы и проценты от 0 до 100.'],
    invalid_payment_day: ['Payout day must be a whole number from 1 to 31, or blank.', 'День выплаты — целое число от 1 до 31 или пустое поле.'],
    invalid_dates: ['Check the validity dates and their order.', 'Проверьте даты действия и их порядок.'],
    expenses_required: ['Choose expense responsibilities before activation or approval. You can save an incomplete draft.', 'Выберите плательщиков расходов перед активацией или согласованием. Неполные условия можно сохранить черновиком.'],
    invalid_accounting_policy: ['Check the accounting settings: amounts and days cannot be negative; tax must be from 0 to 100.', 'Проверьте учётные настройки: суммы и дни не могут быть отрицательными, налог — от 0 до 100.'],
  };
  return messages[issue][isRu ? 1 : 0];
}

export function configuredPayoutValueIsValid(type: string, value: unknown): value is number {
  return ['percent_net','percent_gross','fixed','per_booking'].includes(type) && finiteBetween(value, 0, ['percent_net','percent_gross'].includes(type) ? 100 : Number.MAX_VALUE);
}

