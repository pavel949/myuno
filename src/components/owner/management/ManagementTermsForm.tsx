import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Percent,
  DollarSign,
  CalendarDays,
  StickyNote,
  Wrench,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  ManagementTerms,
  ManagementTermsUpdate,
  ExpenseParty,
  ExpenseResponsibility,
  DEFAULT_EXPENSES,
  useCreateManagementTerms,
  useUpdateManagementTerms,
} from '@/hooks/usePropertyManagementTerms';

interface ManagementTermsFormProps {
  propertyId: string;
  existing?: ManagementTerms;
  onSaved?: (terms: ManagementTerms) => void;
  compact?: boolean; // simplified view for wizard
}

type ExpenseKey = keyof ExpenseResponsibility;

const EXPENSE_ITEMS: { key: ExpenseKey; labelEn: string; labelRu: string }[] = [
  { key: 'cleaning', labelEn: 'Cleaning (between guests)', labelRu: 'Уборка (между гостями)' },
  { key: 'electricity', labelEn: 'Electricity', labelRu: 'Электричество' },
  { key: 'water', labelEn: 'Water', labelRu: 'Вода' },
  { key: 'internet', labelEn: 'Internet', labelRu: 'Интернет' },
  { key: 'repairs_minor', labelEn: 'Minor repairs (routine)', labelRu: 'Мелкий ремонт (текущий)' },
  { key: 'repairs_major', labelEn: 'Major repairs', labelRu: 'Крупный ремонт' },
  { key: 'cam_fees', labelEn: 'CAM / Sinking fund fees', labelRu: 'Взносы в фонд (CAM)' },
  { key: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка' },
  { key: 'marketing', labelEn: 'Marketing & advertising', labelRu: 'Маркетинг и реклама' },
];

const PARTY_OPTIONS: { value: ExpenseParty; labelEn: string; labelRu: string }[] = [
  { value: 'owner', labelEn: 'Owner', labelRu: 'Собственник' },
  { value: 'manager', labelEn: 'Manager', labelRu: 'УК' },
  { value: 'split', labelEn: 'Split', labelRu: 'Пополам' },
];

const CURRENCIES = ['THB', 'USD', 'EUR', 'RUB', 'GBP'];

function partyBadgeVariant(party: ExpenseParty) {
  if (party === 'owner') return 'secondary';
  if (party === 'manager') return 'default';
  return 'outline';
}

export function ManagementTermsForm({ propertyId, existing, onSaved, compact = false }: ManagementTermsFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const createTerms = useCreateManagementTerms();
  const updateTerms = useUpdateManagementTerms();
  const isLoading = createTerms.isPending || updateTerms.isPending;

  const [form, setForm] = useState<ManagementTermsUpdate>(() => ({
    property_id: propertyId,
    manager_user_id: existing?.manager_user_id || user?.id || '',
    commission_type: existing?.commission_type || 'percent',
    commission_rate: existing?.commission_rate ?? 20,
    commission_amount: existing?.commission_amount ?? null,
    commission_base: existing?.commission_base || 'gross',
    revenue_split_owner: existing?.revenue_split_owner ?? 80,
    revenue_split_manager: existing?.revenue_split_manager ?? 20,
    expense_responsibility: existing?.expense_responsibility || { ...DEFAULT_EXPENSES },
    payment_day: existing?.payment_day ?? 5,
    payment_currency: existing?.payment_currency || 'THB',
    valid_from: existing?.valid_from || null,
    valid_until: existing?.valid_until || null,
    notes: existing?.notes || '',
    status: existing?.status || 'draft',
  }));

  const update = (updates: Partial<ManagementTermsUpdate>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const setExpense = (key: ExpenseKey, value: ExpenseParty) => {
    update({
      expense_responsibility: {
        ...((form.expense_responsibility as ExpenseResponsibility) || DEFAULT_EXPENSES),
        [key]: value,
      } as ExpenseResponsibility,
    });
  };

  const handleSave = async (status: 'draft' | 'active' = 'active') => {
    const payload = { ...form, status, property_id: propertyId };
    try {
      let result: ManagementTerms;
      if (existing) {
        result = await updateTerms.mutateAsync({ id: existing.id, updates: { ...payload } });
      } else {
        result = await createTerms.mutateAsync(payload as ManagementTermsUpdate & { property_id: string });
      }
      toast.success(isRu ? 'Условия сохранены' : 'Terms saved');
      onSaved?.(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast.error(msg);
    }
  };

  const expenses = (form.expense_responsibility as ExpenseResponsibility) || DEFAULT_EXPENSES;
  const commissionRate = form.commission_rate ?? 20;
  const ownerSplit = 100 - commissionRate;

  // Sync splits with commission rate (percent mode)
  const handleCommissionRateChange = (val: number) => {
    update({ commission_rate: val, revenue_split_owner: 100 - val, revenue_split_manager: val });
  };

  if (compact) {
    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
        <p className="text-sm font-medium text-foreground">
          {isRu ? 'Условия управления (кратко)' : 'Management Terms (Quick Setup)'}
        </p>

        {/* Commission rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{isRu ? 'Комиссия УК' : 'Manager Commission'}</Label>
            <span className="text-sm font-bold text-primary">{commissionRate}%</span>
          </div>
          <Slider
            min={5} max={50} step={1}
            value={[commissionRate]}
            onValueChange={([v]) => handleCommissionRateChange(v)}
          />
          <p className="text-xs text-muted-foreground">
            {isRu ? `Собственнику: ${ownerSplit}% / УК: ${commissionRate}%` : `Owner: ${ownerSplit}% / Manager: ${commissionRate}%`}
          </p>
        </div>

        {/* Cleaning responsibility */}
        <div className="space-y-1">
          <Label className="text-xs">{isRu ? 'Уборка между гостями' : 'Cleaning (between guests)'}</Label>
          <div className="flex gap-2">
            {PARTY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExpense('cleaning', opt.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  expenses.cleaning === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-muted hover:border-muted-foreground/40'
                }`}
              >
                {isRu ? opt.labelRu : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Payment day */}
        <div className="flex items-center gap-3">
          <Label className="text-xs flex-1">{isRu ? 'День выплаты (число месяца)' : 'Payout day (of month)'}</Label>
          <Input
            type="number"
            min={1} max={31}
            value={form.payment_day ?? ''}
            onChange={(e) => update({ payment_day: Number(e.target.value) })}
            className="w-20 text-center"
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {isRu ? 'Сохранить черновик' : 'Save as draft'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section A: Commission */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            {isRu ? 'A. Комиссия УК' : 'A. Manager Commission'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Commission type */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'percent', labelEn: '% of revenue', labelRu: '% от дохода' },
              { value: 'fixed', labelEn: 'Fixed amount', labelRu: 'Фикс. сумма' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ commission_type: opt.value as 'percent' | 'fixed' })}
                className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-colors ${
                  form.commission_type === opt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                {isRu ? opt.labelRu : opt.labelEn}
              </button>
            ))}
          </div>

          {form.commission_type === 'percent' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{isRu ? 'Процент комиссии' : 'Commission rate'}</Label>
                <span className="text-lg font-bold text-primary">{commissionRate}%</span>
              </div>
              <Slider
                min={5} max={50} step={1}
                value={[commissionRate]}
                onValueChange={([v]) => handleCommissionRateChange(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span><span>50%</span>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex-1 p-3 rounded-xl bg-muted/40 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Собственник' : 'Owner'}</p>
                  <p className="text-xl font-bold">{ownerSplit}%</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'УК' : 'Manager'}</p>
                  <p className="text-xl font-bold text-primary">{commissionRate}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                placeholder="15000"
                value={form.commission_amount ?? ''}
                onChange={(e) => update({ commission_amount: Number(e.target.value) })}
              />
              <Select value={form.payment_currency || 'THB'} onValueChange={(v) => update({ payment_currency: v })}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Commission base */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{isRu ? 'База расчёта комиссии' : 'Commission base'}</Label>
            <div className="flex gap-2">
              {[
                { value: 'gross', labelEn: 'Gross revenue', labelRu: 'Валовая выручка' },
                { value: 'net', labelEn: 'Net income', labelRu: 'Чистый доход' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ commission_base: opt.value as 'gross' | 'net' })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.commission_base === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  {isRu ? opt.labelRu : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Expense Responsibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            {isRu ? 'B. Расходы — кто платит' : 'B. Expense Responsibility'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center mb-2">
            <span className="text-xs text-muted-foreground">{isRu ? 'Статья расхода' : 'Expense'}</span>
            <div className="flex gap-1 text-xs text-muted-foreground">
              <span className="w-16 text-center">{isRu ? 'Собств.' : 'Owner'}</span>
              <span className="w-12 text-center">{isRu ? 'УК' : 'Mgr'}</span>
              <span className="w-16 text-center">{isRu ? 'Пополам' : 'Split'}</span>
            </div>
          </div>
          <Separator className="mb-3" />
          {EXPENSE_ITEMS.map(({ key, labelEn, labelRu }) => (
            <div key={key} className="grid grid-cols-[1fr_auto] gap-x-3 items-center py-1.5">
              <span className="text-sm">{isRu ? labelRu : labelEn}</span>
              <div className="flex gap-1">
                {PARTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpense(key, opt.value)}
                    className={`rounded-lg border text-xs font-medium transition-all ${
                      opt.value === 'owner' ? 'w-16' : opt.value === 'manager' ? 'w-12' : 'w-16'
                    } py-1 ${
                      expenses[key] === opt.value
                        ? opt.value === 'owner'
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : opt.value === 'manager'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-accent text-accent-foreground border-accent'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    {isRu ? opt.labelRu : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section C: Payment Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {isRu ? 'C. Условия выплат' : 'C. Payment Terms'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'День выплаты (число мес.)' : 'Payout day (of month)'}</Label>
              <Input
                type="number"
                min={1} max={31}
                placeholder="5"
                value={form.payment_day ?? ''}
                onChange={(e) => update({ payment_day: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Валюта выплаты' : 'Payout currency'}</Label>
              <Select value={form.payment_currency || 'THB'} onValueChange={(v) => update({ payment_currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Действует с' : 'Valid from'}</Label>
              <Input
                type="date"
                value={form.valid_from || ''}
                onChange={(e) => update({ valid_from: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Действует до (или бессрочно)' : 'Valid until (or open-ended)'}</Label>
              <Input
                type="date"
                value={form.valid_until || ''}
                onChange={(e) => update({ valid_until: e.target.value || null })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section D: Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            {isRu ? 'D. Примечания' : 'D. Notes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder={isRu ? 'Особые условия, оговорки...' : 'Special conditions, remarks...'}
            value={form.notes || ''}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isRu ? 'Сохранить черновик' : 'Save as Draft'}
        </Button>
        <Button
          type="button"
          onClick={() => handleSave('active')}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {isRu ? 'Активировать' : 'Activate'}
        </Button>
      </div>
    </div>
  );
}
