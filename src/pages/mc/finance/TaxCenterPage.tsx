import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxFilings, useCreateTaxFiling, useUpdateTaxFilingStatus, TAX_TYPE_INFO, TaxFilingType, TaxFilingStatus } from '@/hooks/useTaxFilings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Plus, FileCheck2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<TaxFilingStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  calculated: 'bg-info/10 text-info',
  filed: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function TaxCenterPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: filings, isLoading } = useTaxFilings('all');
  const create = useCreateTaxFiling();
  const updateStatus = useUpdateTaxFilingStatus();

  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0,10);
  const monthStart = today.slice(0,8) + '01';
  const [form, setForm] = useState({
    filing_type: 'wht_3' as TaxFilingType,
    period_start: monthStart, period_end: today,
    taxable_base: 0, tax_rate: 3, notes: '',
  });

  const fmt = (n: number) => Number(n).toLocaleString('en-US');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary" />
            {isRu ? 'Налоги Таиланд' : 'Tax Center'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Расчёт WHT 3%, VAT 7%, PND 1/3/53 и квартальные декларации' : 'WHT 3%, VAT 7%, PND 1/3/53 quarterly filings'}
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />{isRu ? 'Новая декларация' : 'New filing'}</Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>{isRu ? 'Новая налоговая декларация' : 'New tax filing'}</SheetTitle></SheetHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label>{isRu ? 'Тип' : 'Type'}</Label>
                <Select value={form.filing_type} onValueChange={(v) => {
                  const t = v as TaxFilingType;
                  setForm({ ...form, filing_type: t, tax_rate: TAX_TYPE_INFO[t].defaultRate });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TAX_TYPE_INFO) as TaxFilingType[]).map(t => (
                      <SelectItem key={t} value={t}>
                        {isRu ? TAX_TYPE_INFO[t].labelRu : TAX_TYPE_INFO[t].labelEn} — {TAX_TYPE_INFO[t].descRu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>{isRu ? 'С даты' : 'From'}</Label><Input type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} /></div>
                <div><Label>{isRu ? 'По дату' : 'To'}</Label><Input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} /></div>
              </div>
              <div><Label>{isRu ? 'База, ฿' : 'Taxable base, ฿'}</Label><Input type="number" value={form.taxable_base} onChange={e => setForm({ ...form, taxable_base: Number(e.target.value) })} /></div>
              <div><Label>{isRu ? 'Ставка, %' : 'Rate, %'}</Label><Input type="number" step="0.1" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} /></div>
              <Card className="p-3 bg-primary/5">
                <div className="text-xs text-muted-foreground">{isRu ? 'Налог к уплате' : 'Tax due'}</div>
                <div className="text-2xl font-bold tabular-nums">{fmt((form.taxable_base * form.tax_rate) / 100)} ฿</div>
              </Card>
              <Button className="w-full" disabled={!form.taxable_base} onClick={async () => {
                await create.mutateAsync(form);
                setOpen(false);
              }}>{isRu ? 'Рассчитать' : 'Calculate'}</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? <Skeleton className="h-40" /> : !filings || filings.length === 0 ? (
        <Card className="p-10 text-center">
          <Calculator className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Деклараций пока нет' : 'No filings yet'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filings.map(f => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{TAX_TYPE_INFO[f.filing_type].labelEn}</span>
                    <Badge className={STATUS_COLORS[f.status]}>{f.status}</Badge>
                    {f.reference_number && <span className="text-xs text-muted-foreground font-mono">ref: {f.reference_number}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(new Date(f.period_start), 'dd MMM')} — {format(new Date(f.period_end), 'dd MMM yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {fmt(Number(f.taxable_base))} × {Number(f.tax_rate)}% = <span className="font-bold text-foreground">{fmt(Number(f.tax_amount))} {f.currency}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {f.status === 'calculated' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: f.id, status: 'filed' })}>
                      <FileCheck2 className="w-4 h-4 mr-1" />{isRu ? 'Подано' : 'Filed'}
                    </Button>
                  )}
                  {f.status === 'filed' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: f.id, status: 'paid' })}>
                      {isRu ? 'Оплачено' : 'Paid'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
