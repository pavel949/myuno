import { managementTermsIssues, managementTermsIssueMessage, optionalConfigurationNumber, type AccountingPolicyDraft } from '@/lib/managementTermsConfiguration';
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Percent,
  DollarSign,
  CalendarDays,
  StickyNote,
  Wrench,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Send,
  Bell,
  Users,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ManagementTerms,
  ManagementTermsUpdate,
  ExpenseParty,
  ExpenseResponsibility,
  useCreateManagementTerms,
  useUpdateManagementTerms,
} from '@/hooks/usePropertyManagementTerms';
import { useLogTermsActivity } from '@/hooks/useManagementTermsActivity';
import {
  usePayoutRules,
  useCreatePayoutRule,
  useDeletePayoutRule,
  PayoutRule,
  PayoutRuleInsert,
  RecipientType,
  CommissionType,
  PayoutFrequency,
} from '@/hooks/usePayoutRules';
import { PayoutWaterfall } from './PayoutWaterfall';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface NotificationDefaults {
  booking_created: boolean;
  expense_recorded: boolean;
  income_recorded: boolean;
  service_request_created: boolean;
  inspection_completed: boolean;
  monthly_report: boolean;
}

const NOTIFICATION_TYPE_LABELS: { key: keyof NotificationDefaults; en: string; ru: string }[] = [
  { key: 'booking_created', en: 'New bookings', ru: 'Новые бронирования' },
  { key: 'income_recorded', en: 'Income recorded', ru: 'Записи о доходах' },
  { key: 'expense_recorded', en: 'Expenses recorded', ru: 'Записи о расходах' },
  { key: 'service_request_created', en: 'Service requests', ru: 'Запросы на обслуживание' },
  { key: 'inspection_completed', en: 'Inspections completed', ru: 'Завершённые осмотры' },
  { key: 'monthly_report', en: 'Monthly digest', ru: 'Ежемесячный отчёт' },
];

interface ManagementTermsFormProps {
  propertyId: string;
  existing?: ManagementTerms;
  onSaved?: (terms: ManagementTerms) => void;
  compact?: boolean;
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

export function ManagementTermsForm(props: ManagementTermsFormProps) {
  return <ManagementTermsFormContent key={`${props.propertyId}:${props.existing?.id ?? 'new'}`} {...props} />;
}

function ManagementTermsFormContent({ propertyId, existing, onSaved, compact = false }: ManagementTermsFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const createTerms = useCreateManagementTerms();
  const updateTerms = useUpdateManagementTerms();
  const logActivity = useLogTermsActivity();
  const isLoading = createTerms.isPending || updateTerms.isPending;

  const createPayoutRule = useCreatePayoutRule();
  const deletePayoutRule = useDeletePayoutRule();
  const { data: payoutRules = [], isLoading: rulesLoading, error: rulesError, refetch: retryRules } = usePayoutRules(propertyId);

  const [form, setForm] = useState<ManagementTermsUpdate>(() => ({
    property_id: propertyId,
    manager_user_id: existing?.manager_user_id || user?.id || '',
    commission_type: existing?.commission_type || 'percent',
    commission_rate: existing?.commission_rate ?? null,
    commission_amount: existing?.commission_amount ?? null,
    commission_base: existing?.commission_base || 'gross',
    revenue_split_owner: existing?.revenue_split_owner ?? null,
    revenue_split_manager: existing?.revenue_split_manager ?? null,
    expense_responsibility: existing?.expense_responsibility || {},
    payment_day: existing?.payment_day ?? null,
    payment_currency: existing?.payment_currency || 'THB',
    valid_from: existing?.valid_from || null,
    valid_until: existing?.valid_until || null,
    notes: existing?.notes || '',
    status: existing?.status || 'draft',
  }));

  const [accountingPolicy, setAccountingPolicy] = useState<AccountingPolicyDraft>(() => ({ ...existing?.accounting_policy }));

  // New payout rule form
  const [newRule, setNewRule] = useState<Partial<PayoutRuleInsert>>({
    recipient_type: 'coagent',
    commission_type: 'percent_net',
    commission_value: undefined,
    payout_frequency: 'monthly',
    deduct_before_owner: false,
    is_active: true,
  });

  const [notifDefaults, setNotifDefaults] = useState<Partial<NotificationDefaults>>(() => ({ ...existing?.owner_notification_defaults }));
  const toggleNotif = (key: keyof NotificationDefaults) => {
    setNotifDefaults(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (updates: Partial<ManagementTermsUpdate>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const setExpense = (key: ExpenseKey, value: ExpenseParty) => {
    update({
      expense_responsibility: {
        ...((form.expense_responsibility as ExpenseResponsibility) || {}),
        [key]: value,
      } as ExpenseResponsibility,
    });
  };

  const handleSave = async (status: 'draft' | 'active' | 'pending_approval' = 'active') => {
    const notificationChoices: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(notifDefaults)) if (typeof value === 'boolean') notificationChoices[key] = value;
    const payload: ManagementTermsUpdate & { property_id: string } = { ...form, status, property_id: propertyId, owner_notification_defaults: Object.keys(notificationChoices).length ? notificationChoices : null, accounting_policy: Object.keys(accountingPolicy).length ? accountingPolicy : null };
    const issues = managementTermsIssues(payload, status);
    if (issues.length) { toast.error(managementTermsIssueMessage(issues[0], isRu)); return; }
    let activityFailed = false;
    try {
      let result: ManagementTerms;
      if (existing) {
        result = await updateTerms.mutateAsync({ id: existing.id, updates: { ...payload } });
        // Log changes
        const changes: { field: string; old: string; new_: string }[] = [];
        if (existing.commission_rate !== form.commission_rate) {
          changes.push({ field: 'commission_rate', old: `${existing.commission_rate}%`, new_: `${form.commission_rate}%` });
        }
        if (existing.status !== status) {
          changes.push({ field: 'status', old: existing.status, new_: status });
        }
        if (existing.commission_base !== form.commission_base) {
          changes.push({ field: 'commission_base', old: existing.commission_base, new_: form.commission_base || '' });
        }
        for (const change of changes) {
          await logActivity.mutateAsync({
            terms_id: existing.id,
            action: change.field === 'status' ? 'status_changed' : 'updated',
            field_name: change.field,
            old_value: change.old,
            new_value: change.new_,
          }).catch(() => { activityFailed = true; });
        }
        if (changes.length === 0) {
          await logActivity.mutateAsync({
            terms_id: existing.id,
            action: 'updated',
            note: 'Terms updated',
          }).catch(() => { activityFailed = true; });
        }
      } else {
        result = await createTerms.mutateAsync(payload as ManagementTermsUpdate & { property_id: string });
        await logActivity.mutateAsync({
          terms_id: result.id,
          action: 'created',
          new_value: `${form.commission_rate}% ${form.commission_base}`,
        }).catch(() => { activityFailed = true; });
      }
      if (activityFailed) toast.warning(isRu ? 'Условия сохранены. Журнал изменений пока недоступен.' : 'Terms saved. The activity log is currently unavailable.');
      else toast.success(
        status === 'pending_approval'
          ? (isRu ? 'Отправлено на согласование' : 'Sent for approval')
          : (isRu ? 'Условия сохранены' : 'Terms saved')
      );
      onSaved?.(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast.error(msg);
    }
  };

  const expenses = (form.expense_responsibility as ExpenseResponsibility) || {};
  const commissionRate = form.commission_rate ?? null;
  const ownerSplit = commissionRate === null ? null : 100 - commissionRate;
  const notConfigured = isRu ? 'Не настроено' : 'Not configured';
  const newRuleValid = !!newRule.recipient_name?.trim() && newRule.commission_value !== undefined && Number.isFinite(newRule.commission_value) && newRule.commission_value >= 0 && (!['percent_net','percent_gross'].includes(newRule.commission_type ?? 'percent_net') || newRule.commission_value <= 100);

  const handleCommissionRateChange = (val: number) => {
    update({ commission_rate: val, revenue_split_owner: 100 - val, revenue_split_manager: val });
  };

  if (compact) {
    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-none border">
        <p className="text-sm font-medium text-foreground">
          {isRu ? 'Условия управления (кратко)' : 'Management Terms (Quick Setup)'}
        </p>

        {/* Commission rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{isRu ? 'Комиссия УК' : 'Manager Commission'}</Label>
            <span className="text-sm font-bold text-primary">{commissionRate === null ? notConfigured : `${commissionRate}%`}</span>
          </div>
          <Input aria-label={isRu ? 'Процент комиссии' : 'Commission rate'} type="number" min={0} max={100} step="any" value={commissionRate ?? ''} onChange={(e) => { const value = optionalConfigurationNumber(e.target.value); if (value === null) update({ commission_rate: null, revenue_split_owner: null, revenue_split_manager: null }); else handleCommissionRateChange(value); }} />
          <p className="text-xs text-muted-foreground">
            {isRu ? `Собственнику: ${ownerSplit === null ? notConfigured : `${ownerSplit}%`} / УК: ${commissionRate === null ? notConfigured : `${commissionRate}%`}` : `Owner: ${ownerSplit === null ? notConfigured : `${ownerSplit}%`} / Manager: ${commissionRate === null ? notConfigured : `${commissionRate}%`}`}
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
                className={`flex-1 py-1.5 rounded-none text-xs font-medium border transition-colors ${
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
            aria-label={isRu ? 'День выплаты' : 'Payout day'} type="number"
            min={1} max={31}
            value={form.payment_day ?? ''}
            onChange={(e) => update({ payment_day: optionalConfigurationNumber(e.target.value) })}
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
      <p className="text-sm text-muted-foreground">{isRu ? 'Заполните условия самостоятельно. Неполные настройки можно сохранить черновиком.' : 'Enter your own terms. Incomplete settings can be saved as a draft.'}</p>
      {/* ── Section A: Commission ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            {isRu ? 'A. Комиссия УК' : 'A. Manager Commission'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'percent', labelEn: '% of revenue', labelRu: '% от дохода' },
              { value: 'fixed', labelEn: 'Fixed amount', labelRu: 'Фикс. сумма' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ commission_type: opt.value as 'percent' | 'fixed' })}
                className={`p-3 rounded-none border-2 text-center text-sm font-medium transition-colors ${
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
                <span className="text-lg font-bold text-primary">{commissionRate === null ? notConfigured : `${commissionRate}%`}</span>
              </div>
              <Input aria-label={isRu ? 'Процент комиссии' : 'Commission rate'} type="number" min={0} max={100} step="any" value={commissionRate ?? ''} onChange={(e) => { const value = optionalConfigurationNumber(e.target.value); if (value === null) update({ commission_rate: null, revenue_split_owner: null, revenue_split_manager: null }); else handleCommissionRateChange(value); }} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span><span>100%</span>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex-1 p-3 rounded-none bg-muted/40 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Собственник' : 'Owner'}</p>
                  <p className="text-xl font-bold">{ownerSplit === null ? notConfigured : `${ownerSplit}%`}</p>
                </div>
                <div className="flex-1 p-3 rounded-none bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'УК' : 'Manager'}</p>
                  <p className="text-xl font-bold text-primary">{commissionRate === null ? notConfigured : `${commissionRate}%`}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input
                aria-label={isRu ? 'Фиксированная комиссия' : 'Fixed commission'} type="number"
                min={0}
                placeholder={notConfigured}
                value={form.commission_amount ?? ''}
                onChange={(e) => update({ commission_amount: optionalConfigurationNumber(e.target.value) })}
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
                  className={`flex-1 py-2 rounded-none text-xs font-medium border transition-colors ${
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

      {/* ── Section B: Expense Responsibility ── */}
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
                    className={cn(
                      'rounded-none border text-xs font-medium transition-all py-1',
                      opt.value === 'owner' ? 'w-16' : opt.value === 'manager' ? 'w-12' : 'w-16',
                      expenses[key] === opt.value
                        ? opt.value === 'owner'
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : opt.value === 'manager'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-accent text-accent-foreground border-accent'
                        : 'border-muted hover:border-muted-foreground/30'
                    )}
                  >
                    {isRu ? opt.labelRu : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Section C: Payment Terms ── */}
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
                aria-label={isRu ? 'День выплаты' : 'Payout day'} type="number"
                min={1} max={31}
                placeholder={notConfigured}
                value={form.payment_day ?? ''}
                onChange={(e) => update({ payment_day: optionalConfigurationNumber(e.target.value) })}
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

      {/* ── Section D: Owner Notification Defaults ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {isRu ? 'D. Уведомления собственника' : 'D. Owner Notifications'}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu
              ? 'Настройте, какие уведомления будет получать собственник по умолчанию'
              : 'Configure which notifications the owner receives by default'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {NOTIFICATION_TYPE_LABELS.map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <Label className="text-sm font-normal">{isRu ? item.ru : item.en}</Label>
              <Switch
                checked={notifDefaults[item.key] === true}
                onCheckedChange={() => toggleNotif(item.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Section F: Co-agent & Staff Commissions ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'F. Комиссии со-агентов и сотрудников' : 'F. Co-agent & Staff Commissions'}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Настройте правила выплат для каждого получателя' : 'Configure payout rules for each recipient'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {rulesError && <div role="alert" className="space-y-2"><p>{isRu ? 'Не удалось загрузить правила выплат' : 'Could not load payout rules'}</p><Button type="button" variant="outline" onClick={() => { void retryRules(); }}>{isRu ? 'Повторить' : 'Retry'}</Button></div>}
          {rulesLoading && <p role="status">{isRu ? 'Загрузка правил…' : 'Loading rules…'}</p>}
          {!rulesError && !rulesLoading && payoutRules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 p-3 rounded-none bg-muted/40 border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                   {rule.recipient_type === 'coagent' ? (isRu ? 'Со-агент' : 'Co-agent')
                      : rule.recipient_type === 'staff' ? (isRu ? 'Сотрудник' : 'Staff')
                      : rule.recipient_type === 'broker' ? (isRu ? 'Брокер' : 'Broker')
                      : rule.recipient_type === 'ota' ? (isRu ? 'OTA' : 'OTA')
                      : (isRu ? 'Партнёр' : 'Partner')}
                  </Badge>
                  <span className="text-sm font-medium truncate">{rule.recipient_name || '—'}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {rule.commission_type === 'percent_net' ? `${rule.commission_value}% ${isRu ? 'от чистого' : 'of net'}`
                    : rule.commission_type === 'percent_gross' ? `${rule.commission_value}% ${isRu ? 'от валового' : 'of gross'}`
                    : rule.commission_type === 'fixed' ? `${rule.commission_value} ${form.payment_currency || 'THB'} ${isRu ? 'фикс' : 'fixed'}`
                    : `${rule.commission_value} ${isRu ? 'за бронирование' : 'per booking'}`}
                  {rule.deduct_before_owner && ` · ${isRu ? 'до доли собственника' : 'before owner split'}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label={isRu ? 'Удалить' : 'Delete'} className="flex-shrink-0" onClick={() => deletePayoutRule.mutate({ id: rule.id, propertyId })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="space-y-3 p-3 rounded-none border border-dashed border-primary/30">
            <p className="text-xs font-medium text-primary">{isRu ? 'Добавить получателя' : 'Add recipient'}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Тип' : 'Type'}</Label>
                <Select value={newRule.recipient_type || 'coagent'} onValueChange={(v) => setNewRule(prev => ({ ...prev, recipient_type: v as RecipientType }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coagent">{isRu ? 'Со-агент' : 'Co-agent'}</SelectItem>
                    <SelectItem value="staff">{isRu ? 'Сотрудник' : 'Staff'}</SelectItem>
                    <SelectItem value="partner">{isRu ? 'Партнёр' : 'Partner'}</SelectItem>
                    <SelectItem value="broker">{isRu ? 'Брокер' : 'Broker'}</SelectItem>
                    <SelectItem value="ota">{isRu ? 'OTA-платформа' : 'OTA Platform'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Имя' : 'Name'}</Label>
                <Input aria-label={isRu ? 'Имя получателя' : 'Recipient name'} className="h-9" placeholder={isRu ? 'Имя получателя' : 'Recipient name'} value={newRule.recipient_name || ''} onChange={(e) => setNewRule(prev => ({ ...prev, recipient_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Тип комиссии' : 'Commission'}</Label>
                <Select value={newRule.commission_type || 'percent_net'} onValueChange={(v) => setNewRule(prev => ({ ...prev, commission_type: v as CommissionType }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent_net">% net</SelectItem>
                    <SelectItem value="percent_gross">% gross</SelectItem>
                    <SelectItem value="fixed">{isRu ? 'Фикс' : 'Fixed'}</SelectItem>
                    <SelectItem value="per_booking">{isRu ? 'За бронь' : 'Per booking'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Значение' : 'Value'}</Label>
                <Input aria-label={isRu ? 'Комиссия получателя' : 'Recipient commission'} type="number" className="h-9" min={0} value={newRule.commission_value ?? ''} onChange={(e) => setNewRule(prev => ({ ...prev, commission_value: optionalConfigurationNumber(e.target.value) ?? undefined }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Частота' : 'Freq'}</Label>
                <Select value={newRule.payout_frequency || 'monthly'} onValueChange={(v) => setNewRule(prev => ({ ...prev, payout_frequency: v as PayoutFrequency }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_booking">{isRu ? 'За бронь' : 'Per booking'}</SelectItem>
                    <SelectItem value="monthly">{isRu ? 'Мес.' : 'Monthly'}</SelectItem>
                    <SelectItem value="quarterly">{isRu ? 'Кварт.' : 'Quarterly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={newRule.deduct_before_owner ?? false} onCheckedChange={(v) => setNewRule(prev => ({ ...prev, deduct_before_owner: v }))} />
                <Label className="text-xs font-normal">{isRu ? 'Вычитать до доли собственника' : 'Deduct before owner split'}</Label>
              </div>
              <Button size="sm" variant="outline" disabled={!newRuleValid || !!rulesError || rulesLoading || createPayoutRule.isPending} onClick={() => {
                if (!newRuleValid || newRule.commission_value === undefined) return;
                createPayoutRule.mutate({
                  property_id: propertyId, management_terms_id: existing?.id || null,
                  recipient_type: newRule.recipient_type || 'coagent', recipient_staff_id: null,
                  recipient_name: newRule.recipient_name?.trim() || '', commission_type: newRule.commission_type || 'percent_net',
                  commission_value: newRule.commission_value, deduct_before_owner: newRule.deduct_before_owner || false,
                  min_payout: null, payout_frequency: newRule.payout_frequency || 'monthly', notes: null, is_active: true,
                }, { onSuccess: () => setNewRule({ recipient_type: 'coagent', commission_type: 'percent_net', commission_value: undefined, payout_frequency: 'monthly', deduct_before_owner: false, is_active: true }) });
              }}>
                <Plus className="h-3 w-3 mr-1" />{isRu ? 'Добавить' : 'Add'}
              </Button>
            </div>
          </div>

          {!rulesError && !rulesLoading && form.commission_type === 'percent' && commissionRate !== null && ownerSplit !== null && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Формула распределения (пример на 100,000)' : 'Distribution formula (example on 100,000)'}</p>
              <PayoutWaterfall grossIncome={100000} payoutRules={payoutRules} ownerSplitPercent={ownerSplit} managerSplitPercent={commissionRate} commissionBase={form.commission_base || 'gross'} currency={form.payment_currency || 'THB'} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section G: Accounting Policy ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {isRu ? 'G. Учётная политика' : 'G. Accounting Policy'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">{isRu ? 'Вычеты для чистого дохода' : 'Net income deductions'}</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_ITEMS.map(({ key, labelEn, labelRu }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox checked={(accountingPolicy.net_profit_deductions ?? []).includes(key)} onCheckedChange={(checked) => setAccountingPolicy(prev => ({ ...prev, net_profit_deductions: checked ? [...(prev.net_profit_deductions ?? []).filter(k => k !== key), key] : (prev.net_profit_deductions ?? []).filter(k => k !== key) }))} />
                  <Label className="text-xs font-normal">{isRu ? labelRu : labelEn}</Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Частота отчётов' : 'Report frequency'}</Label>
              <Select value={accountingPolicy.report_frequency ?? ''} onValueChange={(v) => setAccountingPolicy(prev => ({ ...prev, report_frequency: v as NonNullable<AccountingPolicyDraft['report_frequency']> }))}>
                <SelectTrigger><SelectValue placeholder={notConfigured} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{isRu ? 'Ежемесячно' : 'Monthly'}</SelectItem>
                  <SelectItem value="quarterly">{isRu ? 'Ежеквартально' : 'Quarterly'}</SelectItem>
                  <SelectItem value="on_demand">{isRu ? 'По запросу' : 'On demand'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Формат' : 'Format'}</Label>
              <Select value={accountingPolicy.report_format ?? ''} onValueChange={(v) => setAccountingPolicy(prev => ({ ...prev, report_format: v as NonNullable<AccountingPolicyDraft['report_format']> }))}>
                <SelectTrigger><SelectValue placeholder={notConfigured} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">{isRu ? 'Краткий' : 'Summary'}</SelectItem>
                  <SelectItem value="detailed">{isRu ? 'Детальный' : 'Detailed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Мин. выплата' : 'Min payout'}</Label>
              <Input type="number" min={0} placeholder={notConfigured} value={accountingPolicy.minimum_payout ?? ''} onChange={(e) => setAccountingPolicy(prev => ({ ...prev, minimum_payout: e.target.value ? optionalConfigurationNumber(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Удержание (дней)' : 'Hold (days)'}</Label>
              <Input type="number" min={0} aria-label={isRu ? 'Удержание (дней)' : 'Hold (days)'} placeholder={notConfigured} value={accountingPolicy.payout_hold_days ?? ''} onChange={(e) => setAccountingPolicy(prev => ({ ...prev, payout_hold_days: e.target.value ? optionalConfigurationNumber(e.target.value) : null }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Порог одобрения' : 'Approval threshold'}</Label>
              <Input type="number" min={0} placeholder={notConfigured} value={accountingPolicy.owner_approval_required_above ?? ''} onChange={(e) => setAccountingPolicy(prev => ({ ...prev, owner_approval_required_above: e.target.value ? optionalConfigurationNumber(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRu ? 'Налог (%)' : 'Tax (%)'}</Label>
              <Input type="number" min={0} max={100} placeholder={notConfigured} value={accountingPolicy.tax_withholding_percent ?? ''} onChange={(e) => setAccountingPolicy(prev => ({ ...prev, tax_withholding_percent: e.target.value ? optionalConfigurationNumber(e.target.value) : null }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={accountingPolicy.include_pending_bookings === false} onCheckedChange={(v) => setAccountingPolicy(prev => ({ ...prev, include_pending_bookings: !v }))} />
            <Label className="text-xs font-normal">{isRu ? 'Только подтверждённые бронирования' : 'Confirmed bookings only'}</Label>
          </div>
        </CardContent>
      </Card>

      {/* ── Section H: Notes ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            {isRu ? 'E. Примечания' : 'E. Notes'}
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

      {/* ── Actions with pending_approval ── */}
      <div className="space-y-2">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isRu ? 'Черновик' : 'Save Draft'}
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleSave('pending_approval')}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isRu ? 'Отправить на согласование собственнику' : 'Send for Owner Approval'}
        </Button>
      </div>
    </div>
  );
}

