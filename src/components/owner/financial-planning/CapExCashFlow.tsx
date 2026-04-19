import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { CapExItem, LoanItem, Assumptions } from '@/lib/finance/financialModelMath';

interface Props {
  capex: CapExItem[];
  loans: LoanItem[];
  assumptions: Assumptions;
  onCapexChange: (items: CapExItem[]) => void;
  onLoansChange: (items: LoanItem[]) => void;
  onAssumptionsChange: (a: Assumptions) => void;
}

export function CapExCashFlow({ capex, loans, assumptions, onCapexChange, onLoansChange, onAssumptionsChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const addCapex = () => {
    onCapexChange([...capex, {
      id: crypto.randomUUID(),
      name: isRu ? 'Новая позиция' : 'New item',
      amount: 0,
      month: 1,
      lifespanYears: 5,
    }]);
  };

  const updateCapex = (id: string, patch: Partial<CapExItem>) => {
    onCapexChange(capex.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const removeCapex = (id: string) => onCapexChange(capex.filter(c => c.id !== id));

  const addLoan = () => {
    onLoansChange([...loans, {
      id: crypto.randomUUID(),
      principal: 0,
      annualRatePct: 7,
      termMonths: 240,
      startMonth: 1,
    }]);
  };
  const updateLoan = (id: string, patch: Partial<LoanItem>) => {
    onLoansChange(loans.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const removeLoan = (id: string) => onLoansChange(loans.filter(l => l.id !== id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            {isRu ? 'CapEx — крупные вложения' : 'CapEx — Capital expenditures'}
            <Button size="sm" variant="outline" onClick={addCapex}>
              <Plus className="h-4 w-4 mr-1" /> {isRu ? 'Добавить' : 'Add'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {capex.length === 0 ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground italic">
              {isRu ? 'Нет крупных вложений. Добавьте мебель, ремонт, оборудование.' : 'No CapEx items yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">{isRu ? 'Позиция' : 'Item'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Сумма ฿' : 'Amount ฿'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Месяц' : 'Month'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Срок (лет)' : 'Lifespan (yrs)'}</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {capex.map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="px-2 py-1">
                        <Input value={c.name} onChange={e => updateCapex(c.id, { name: e.target.value })} className="h-8 text-xs" />
                      </td>
                      <td className="px-2 py-1">
                        <Input type="number" value={c.amount} onChange={e => updateCapex(c.id, { amount: +e.target.value || 0 })} className="h-8 text-xs text-right" />
                      </td>
                      <td className="px-2 py-1">
                        <Input type="number" min={1} max={12} value={c.month} onChange={e => updateCapex(c.id, { month: Math.max(1, Math.min(12, +e.target.value || 1)) })} className="h-8 text-xs text-right w-16" />
                      </td>
                      <td className="px-2 py-1">
                        <Input type="number" min={1} value={c.lifespanYears} onChange={e => updateCapex(c.id, { lifespanYears: +e.target.value || 1 })} className="h-8 text-xs text-right w-16" />
                      </td>
                      <td className="px-2 py-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeCapex(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            {isRu ? 'Кредиты / Ипотека' : 'Loans / Mortgage'}
            <Button size="sm" variant="outline" onClick={addLoan}>
              <Plus className="h-4 w-4 mr-1" /> {isRu ? 'Добавить' : 'Add'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loans.length === 0 ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground italic">
              {isRu ? 'Нет кредитов. DSCR не рассчитывается без долга.' : 'No loans. DSCR requires debt.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">{isRu ? 'Тело' : 'Principal'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Ставка %' : 'Rate %'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Срок мес' : 'Term mo'}</th>
                    <th className="px-2 py-2 text-right">{isRu ? 'Старт мес' : 'Start mo'}</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="px-2 py-1"><Input type="number" value={l.principal} onChange={e => updateLoan(l.id, { principal: +e.target.value || 0 })} className="h-8 text-xs text-right" /></td>
                      <td className="px-2 py-1"><Input type="number" step="0.1" value={l.annualRatePct} onChange={e => updateLoan(l.id, { annualRatePct: +e.target.value || 0 })} className="h-8 text-xs text-right" /></td>
                      <td className="px-2 py-1"><Input type="number" value={l.termMonths} onChange={e => updateLoan(l.id, { termMonths: +e.target.value || 1 })} className="h-8 text-xs text-right" /></td>
                      <td className="px-2 py-1"><Input type="number" min={1} max={12} value={l.startMonth ?? 1} onChange={e => updateLoan(l.id, { startMonth: Math.max(1, Math.min(12, +e.target.value || 1)) })} className="h-8 text-xs text-right w-16" /></td>
                      <td className="px-2 py-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLoan(l.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isRu ? 'Допущения и ставки' : 'Assumptions & rates'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={isRu ? 'Стоимость объекта (฿)' : 'Property value (฿)'} value={assumptions.propertyValue} onChange={v => onAssumptionsChange({ ...assumptions, propertyValue: v })} />
            <Field label={isRu ? 'Вложено собственных (฿)' : 'Cash invested (฿)'} value={assumptions.cashInvested} onChange={v => onAssumptionsChange({ ...assumptions, cashInvested: v })} />
            <Field label={isRu ? 'Комиссия УК %' : 'Mgmt fee %'} value={assumptions.mgmtFeePct} onChange={v => onAssumptionsChange({ ...assumptions, mgmtFeePct: v })} step={0.5} />
            <Field label={isRu ? 'Комиссия каналов %' : 'Channel fee %'} value={assumptions.channelFeePct} onChange={v => onAssumptionsChange({ ...assumptions, channelFeePct: v })} step={0.5} />
            <Field label={isRu ? 'Налог %' : 'Tax rate %'} value={assumptions.taxRatePct} onChange={v => onAssumptionsChange({ ...assumptions, taxRatePct: v })} step={0.5} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value?: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input type="number" step={step} value={value ?? 0} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
    </label>
  );
}
