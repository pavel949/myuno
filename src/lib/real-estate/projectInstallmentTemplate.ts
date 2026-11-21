export const INSTALLMENT_MILESTONES = ['reservation', 'contract', 'construction', 'handover'] as const;
export type InstallmentMilestone = typeof INSTALLMENT_MILESTONES[number];
export type InstallmentEvent = InstallmentMilestone | 'date';
export type InstallmentDraftStep = { event: InstallmentEvent; percent: string; date: string };
type InstallmentStep = { basis_points: number; due: { kind: 'date'; date: string } | { kind: 'milestone'; milestone: InstallmentMilestone } };
type InstallmentTemplate = { format: 'myuno-project-installments-v1'; steps: InstallmentStep[] };

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function isMilestone(value: unknown): value is InstallmentMilestone {
  return typeof value === 'string' && INSTALLMENT_MILESTONES.some(milestone => milestone === value);
}

export function projectInstallmentTemplate(draft: InstallmentDraftStep[]):
  { ok: true; template: InstallmentTemplate } | { ok: false; code: 'step_count' | 'invalid_step' | 'invalid_total' | 'date_order'; row?: number } {
  if (draft.length < 1 || draft.length > 12) return { ok: false, code: 'step_count' };
  let total = 0;
  let previousDate: string | undefined;
  const steps: InstallmentStep[] = [];
  for (const [row, step] of draft.entries()) {
    const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(step.percent.trim());
    const points = match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : 0;
    if (points < 1 || points > 10000) return { ok: false, code: 'invalid_step', row };
    if (step.event === 'date') {
      if (!isCivilDate(step.date)) return { ok: false, code: 'invalid_step', row };
      if (previousDate && step.date < previousDate) return { ok: false, code: 'date_order', row };
      previousDate = step.date;
      steps.push({ basis_points: points, due: { kind: 'date', date: step.date } });
    } else {
      if (!isMilestone(step.event) || step.date) return { ok: false, code: 'invalid_step', row };
      steps.push({ basis_points: points, due: { kind: 'milestone', milestone: step.event } });
    }
    total += points;
  }
  return total === 10000 ? { ok: true, template: { format: 'myuno-project-installments-v1', steps } }
    : { ok: false, code: 'invalid_total' };
}

export function readProjectInstallmentTemplate(value: unknown): { kind: 'empty' | 'legacy' | 'structured'; steps: InstallmentDraftStep[] } {
  if (value == null) return { kind: 'empty', steps: [] };
  const row = object(value);
  if (!row || row.format !== 'myuno-project-installments-v1' || !Array.isArray(row.steps) ||
      !exactKeys(row, ['format', 'steps'])) return { kind: 'legacy', steps: [] };
  const steps: InstallmentDraftStep[] = [];
  for (const raw of row.steps) {
    const step = object(raw);
    const due = object(step?.due);
    if (!step || !due || !exactKeys(step, ['basis_points', 'due']) || typeof step.basis_points !== 'number' ||
        !Number.isInteger(step.basis_points) || step.basis_points < 1 || step.basis_points > 10000) return { kind: 'legacy', steps: [] };
    const percent = String(step.basis_points / 100);
    if (due.kind === 'date' && isCivilDate(due.date) && exactKeys(due, ['kind', 'date'])) steps.push({ event: 'date', percent, date: due.date });
    else if (due.kind === 'milestone' && isMilestone(due.milestone) && exactKeys(due, ['kind', 'milestone'])) steps.push({ event: due.milestone, percent, date: '' });
    else return { kind: 'legacy', steps: [] };
  }
  return projectInstallmentTemplate(steps).ok ? { kind: 'structured', steps } : { kind: 'legacy', steps: [] };
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
