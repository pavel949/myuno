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
