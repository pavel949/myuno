import { describe, expect, it } from 'vitest';
import { projectInstallmentDraftExport, projectInstallmentTemplate, readProjectInstallmentTemplate } from './projectInstallmentTemplate';
const steps = [
  { event: 'reservation', percent: '12,50', date: '' },
  { event: 'date', percent: '17.5', date: '2028-02-29' },
  { event: 'handover', percent: '70', date: '' },
] as const;
describe('operator-only installment template', () => {
  it('round-trips exact percentages, civil dates and milestone order', () => {
    const result = projectInstallmentTemplate([...steps]);
    expect(result.ok).toBe(true);
    if (result.ok === false) throw Error(result.code);
    expect(result.template.steps.map(step => step.basis_points)).toEqual([1250,1750,7000]);
    expect(readProjectInstallmentTemplate(result.template)).toMatchObject({ kind: 'structured', steps: [{ percent: '12.5' }, { date: '2028-02-29' }, { event: 'handover' }] });
  });
  it('leaves unknown, invalid or legacy templates unparsed even when some keys look compatible', () => {
    for (const value of [[], [{ percent: 10 }], { format: 'myuno-project-installments-v2' }, { format: 'myuno-project-installments-v1', steps: [{ basis_points: 10000, due: { kind: 'date', date: '2028-02-31' } }] }]) {
      expect(readProjectInstallmentTemplate(value)).toEqual({ kind: 'legacy', steps: [] });
    }
    expect(readProjectInstallmentTemplate(null)).toEqual({ kind: 'empty', steps: [] });
  });
  it.each(['', '0', '-1', '1e2', '100.001', '10,2,0'])('rejects invalid share %s', percent => {
    expect(projectInstallmentTemplate([{ event: 'contract', percent, date: '' }])).toMatchObject({ ok: false, code: 'invalid_step' });
  });
  it('blocks invalid totals, invalid or reverse calendar dates', () => {
    expect(projectInstallmentTemplate([{ event: 'contract', percent: '99.99', date: '' }])).toMatchObject({ code: 'invalid_total' });
    expect(projectInstallmentTemplate([{ event: 'date', percent: '100', date: '2027-02-29' }])).toMatchObject({ code: 'invalid_step' });
    expect(projectInstallmentTemplate([{ ...steps[1], percent: '50' }, { ...steps[1], date: '2027-01-01', percent: '50' }])).toMatchObject({ code: 'date_order', row: 1 });
  });
  it('exports no obligation, money amount or publication permission', () => {
    const result = projectInstallmentDraftExport([...steps], 'synthetic-project');
    expect(result).toMatchObject({ ok: true, payload: { status: 'operator_draft', project_id: 'synthetic-project', publication_enabled: false } });
    if (result.ok === true) expect(Object.keys(result.payload).sort()).toEqual(['payment_plan_template','project_id','publication_enabled','status']);
  });
});

describe('strict extended schedule', () => {
  const extended = [
    { event: 'contract', percent: '23', date: '', creditAmount: '12500,25', creditCurrency: 'THB' },
    { event: 'after_deposit', percent: '27', date: '', offset: '45', offsetUnit: 'days' },
    { event: 'main_construction', percent: '18', date: '' },
    { event: 'roof', percent: '32', date: '' },
  ] as const;
  it('round-trips a fixed reservation credit, a relative deadline and distinct milestones without inventing amounts or dates', () => {
    const result = projectInstallmentTemplate([...extended]);
    expect(result.ok).toBe(true);
    if (result.ok === false) throw Error(result.code);
    expect(result.template).toEqual({
      format: 'myuno-project-installments-v2',
      steps: [
        { basis_points: 2300, due: { kind: 'milestone', milestone: 'contract' }, reservation_credit: { amount_minor: 1250025, currency: 'THB' } },
        { basis_points: 2700, due: { kind: 'relative', anchor: 'initial_deposit', count: 45, unit: 'days' } },
        { basis_points: 1800, due: { kind: 'milestone', milestone: 'main_construction' } },
        { basis_points: 3200, due: { kind: 'milestone', milestone: 'roof' } },
      ],
    });
    const parsed = readProjectInstallmentTemplate(result.template);
    expect(parsed.kind).toBe('structured');
    expect(projectInstallmentTemplate(parsed.steps)).toEqual(result);
    expect(readProjectInstallmentTemplate({ ...result.template, format: 'myuno-project-installments-v1' }).kind).toBe('legacy');
  });
  it('refuses duplicate credits or counting the same reservation as another percentage', () => {
    expect(projectInstallmentTemplate([...extended.slice(0, 3), { ...extended[0], event: 'handover', percent: '32' }])).toMatchObject({ code: 'credit', row: 3 });
    expect(projectInstallmentTemplate([...extended.slice(0, 3), { event: 'reservation', percent: '32', date: '' }])).toMatchObject({ code: 'credit', row: 0 });
  });
  it.each(['0', '-4', '1.5', '1e2', '10000'])('rejects invalid relative interval %s', offset => {
    expect(projectInstallmentTemplate([{ event: 'after_deposit', percent: '100', date: '', offset, offsetUnit: 'days' }])).toMatchObject({ code: 'invalid_step' });
  });
  it('requires explicitly entered fixed amount and currency, and preserves month units as months', () => {
    expect(projectInstallmentTemplate([{ event: 'contract', percent: '100', date: '', creditAmount: '' }])).toMatchObject({ code: 'credit' });
    expect(projectInstallmentTemplate([{ event: 'contract', percent: '100', date: '', creditAmount: '500' }])).toMatchObject({ code: 'credit' });
    expect(projectInstallmentTemplate([{ event: 'after_deposit', percent: '100', date: '', offset: '2', offsetUnit: 'months' }])).toMatchObject({
      ok: true, template: { steps: [{ due: { kind: 'relative', anchor: 'initial_deposit', count: 2, unit: 'months' } }] },
    });
  });
});
