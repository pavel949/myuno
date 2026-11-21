const V1_MILESTONES = ['reservation', 'contract', 'construction', 'handover'] as const;
export const INSTALLMENT_MILESTONES = [...V1_MILESTONES, 'main_construction', 'roof'] as const;
export const INSTALLMENT_CURRENCIES = ['THB', 'USD', 'EUR'] as const;
type CreditCurrency = typeof INSTALLMENT_CURRENCIES[number];
export type InstallmentMilestone = typeof INSTALLMENT_MILESTONES[number];
export type InstallmentEvent = InstallmentMilestone | 'date' | 'after_deposit';
export type InstallmentDraftStep = { event: InstallmentEvent; percent: string; date: string;
  offset?: string; offsetUnit?: 'days' | 'months'; creditAmount?: string; creditCurrency?: CreditCurrency };
type InstallmentStep = { basis_points: number;
  due: { kind: 'date'; date: string } | { kind: 'milestone'; milestone: InstallmentMilestone } |
    { kind: 'relative'; anchor: 'initial_deposit'; count: number; unit: 'days' | 'months' };
  reservation_credit?: { amount_minor: number; currency: CreditCurrency } };
type InstallmentTemplate = { format: 'myuno-project-installments-v1' | 'myuno-project-installments-v2'; steps: InstallmentStep[] };
function isCurrency(value: unknown): value is CreditCurrency {
  return INSTALLMENT_CURRENCIES.some(currency => currency === value);
}
function creditMinor(amount: string): number {
  const match = /^(\d{1,12})(?:[.,](\d{1,2}))?$/.exec(amount.trim());
  return match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : 0;
}

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function isMilestone(value: unknown): value is InstallmentMilestone {
  return typeof value === 'string' && INSTALLMENT_MILESTONES.some(milestone => milestone === value);
}

export function projectInstallmentTemplate(draft: InstallmentDraftStep[]):
  { ok: true; template: InstallmentTemplate } | { ok: false; code: 'step_count' | 'invalid_step' | 'invalid_total' | 'date_order' | 'credit'; row?: number } {
  if (draft.length < 1 || draft.length > 12) return { ok: false, code: 'step_count' };
  let total = 0;
  let previousDate: string | undefined;
  const steps: InstallmentStep[] = [];
  let hasCredit = false;
  const hasPercentageReservation = draft.some(step => step.event === 'reservation');
  let extended = false;
  for (const [row, step] of draft.entries()) {
    const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(step.percent.trim());
    const points = match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : 0;
    if (points < 1 || points > 10000) return { ok: false, code: 'invalid_step', row };
    let due: InstallmentStep['due'];
    if (step.event === 'date') {
      if (!isCivilDate(step.date) || step.offset || step.offsetUnit) return { ok: false, code: 'invalid_step', row };
      if (previousDate && step.date < previousDate) return { ok: false, code: 'date_order', row };
      previousDate = step.date;
      due = { kind: 'date', date: step.date };
    } else if (step.event === 'after_deposit') {
      const count = Number(step.offset);
      if (step.date || !/^[1-9]\d{0,3}$/.test(step.offset ?? '') ||
          !['days', 'months'].includes(step.offsetUnit ?? '') || !step.offsetUnit) {
        return { ok: false, code: 'invalid_step', row };
      }
      extended = true;
      due = { kind: 'relative', anchor: 'initial_deposit', count, unit: step.offsetUnit };
    } else {
      if (!isMilestone(step.event) || step.date || step.offset || step.offsetUnit) return { ok: false, code: 'invalid_step', row };
      if (!V1_MILESTONES.some(milestone => milestone === step.event)) extended = true;
      due = { kind: 'milestone', milestone: step.event };
    }
    let credit: InstallmentStep['reservation_credit'];
    if (step.creditAmount !== undefined || step.creditCurrency !== undefined) {
      const amount = creditMinor(step.creditAmount ?? '');
      if (hasCredit || !amount || !isCurrency(step.creditCurrency) || hasPercentageReservation) {
        return { ok: false, code: 'credit', row };
      }
      hasCredit = true;
      extended = true;
      credit = { amount_minor: amount, currency: step.creditCurrency };
    }
    steps.push({ basis_points: points, due, ...(credit ? { reservation_credit: credit } : {}) });
    total += points;
  }
  return total === 10000 ? { ok: true, template: { format: extended ? 'myuno-project-installments-v2' : 'myuno-project-installments-v1', steps } }
    : { ok: false, code: 'invalid_total' };
}

export function readProjectInstallmentTemplate(value: unknown): { kind: 'empty' | 'legacy' | 'structured'; steps: InstallmentDraftStep[] } {
  if (value == null) return { kind: 'empty', steps: [] };
  const row = object(value);
  const legacy = { kind: 'legacy', steps: [] } as const;
  if (!row || (row.format !== 'myuno-project-installments-v1' && row.format !== 'myuno-project-installments-v2') ||
      !Array.isArray(row.steps) || row.steps.length < 1 || row.steps.length > 12 || !exactKeys(row, ['format', 'steps'])) return { ...legacy, steps: [] };
  const v2 = row.format === 'myuno-project-installments-v2';
  const steps: InstallmentDraftStep[] = [];
  for (const raw of row.steps) {
    const step = object(raw);
    const due = object(step?.due);
    const hasCredit = !!step && Object.prototype.hasOwnProperty.call(step, 'reservation_credit');
    if (!step || !due || !exactKeys(step, hasCredit && v2 ? ['basis_points', 'due', 'reservation_credit'] : ['basis_points', 'due']) ||
        typeof step.basis_points !== 'number' || !Number.isInteger(step.basis_points) ||
        step.basis_points < 1 || step.basis_points > 10000) return { ...legacy, steps: [] };
    const percent = String(step.basis_points / 100);
    let parsed: InstallmentDraftStep;
    if (due.kind === 'date' && isCivilDate(due.date) && exactKeys(due, ['kind', 'date'])) {
      parsed = { event: 'date', percent, date: due.date };
    } else if (due.kind === 'milestone' && isMilestone(due.milestone) && exactKeys(due, ['kind', 'milestone']) &&
        (v2 || V1_MILESTONES.some(milestone => milestone === due.milestone))) {
      parsed = { event: due.milestone, percent, date: '' };
    } else if (v2 && due.kind === 'relative' && due.anchor === 'initial_deposit' && typeof due.count === 'number' &&
        Number.isInteger(due.count) && (due.unit === 'days' || due.unit === 'months') && exactKeys(due, ['kind', 'anchor', 'count', 'unit'])) {
      parsed = { event: 'after_deposit', percent, date: '', offset: String(due.count), offsetUnit: due.unit };
    } else return { ...legacy, steps: [] };
    if (hasCredit) {
      const credit = object(step.reservation_credit);
      if (!credit || !exactKeys(credit, ['amount_minor', 'currency']) || typeof credit.amount_minor !== 'number' ||
          !Number.isSafeInteger(credit.amount_minor) || credit.amount_minor < 1 || credit.amount_minor >= 1e14 ||
          !isCurrency(credit.currency)) return { ...legacy, steps: [] };
      parsed.creditAmount = (credit.amount_minor / 100).toFixed(2);
      parsed.creditCurrency = credit.currency;
    }
    steps.push(parsed);
  }
  const checked = projectInstallmentTemplate(steps);
  return checked.ok && checked.template.format === row.format ? { kind: 'structured', steps } : { ...legacy, steps: [] };
}
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
const exactKeys = (row: Record<string, unknown>, keys: string[]) =>
  Object.keys(row).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(row, key));

export function projectInstallmentDraftExport(draft: InstallmentDraftStep[], projectId?: string) {
  const result = projectInstallmentTemplate(draft);
  return result.ok === true ? { ...result, payload: {
    status: 'operator_draft', project_id: projectId ?? null, publication_enabled: false,
    payment_plan_template: result.template,
  } } : result;
}
