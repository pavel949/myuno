/**
 * CooperationTermsSection — Editable panel for payment methods, commission, payout schedule.
 * Used in ContactDetail (contact-level defaults) and DealDetail (deal-level overrides).
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCooperationTerms,
  useUpsertCooperationTerms,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYOUT_FREQUENCIES,
  PAYOUT_FREQUENCY_LABELS,
  type CooperationTerms,
  type PaymentMethod,
} from '@/hooks/useCooperationTerms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Handshake, Save, ChevronDown, ChevronUp, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  companyId: string;
  contactId?: string;
  dealId?: string;
  readonly?: boolean;
}

type FormData = Partial<CooperationTerms>;

export function CooperationTermsSection({ companyId, contactId, dealId, readonly = false }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: terms, isLoading } = useCooperationTerms(contactId, dealId);
  const upsert = useUpsertCooperationTerms();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<FormData>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (terms) {
      setForm(terms);
      setDirty(false);
    }
  }, [terms]);

  const update = (patch: FormData) => {
    setForm(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const current = form.payment_methods || [];
    const next = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    update({ payment_methods: next });
  };

  const handleSave = () => {
    upsert.mutate({
      id: terms?.id,
      companyId,
      contactId,
      dealId,
      data: form,
    });
    setDirty(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedMethods = form.payment_methods || [];

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            {isRu ? 'Условия сотрудничества' : 'Cooperation Terms'}
            {terms && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {/* Payment Methods */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              {isRu ? 'Способы выплат' : 'Payment Methods'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(method => {
                const label = PAYMENT_METHOD_LABELS[method];
                const checked = selectedMethods.includes(method);
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm',
                      checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                      readonly && 'cursor-default'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => !readonly && togglePaymentMethod(method)}
                      disabled={readonly}
                    />
                    <span>{label.icon}</span>
                    <span className="text-xs">{isRu ? label.ru : label.en}</span>
                  </label>
                );
              })}
            </div>

            {selectedMethods.length > 0 && (
              <div className="pt-1">
                <Label className="text-xs text-muted-foreground">
                  {isRu ? 'Предпочтительный' : 'Preferred'}
                </Label>
                <Select
                  value={form.preferred_payment_method || ''}
                  onValueChange={v => update({ preferred_payment_method: v })}
                  disabled={readonly}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder={isRu ? 'Выберите...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMethods.map(m => {
                      const l = PAYMENT_METHOD_LABELS[m as PaymentMethod];
                      return l ? (
                        <SelectItem key={m} value={m} className="text-xs">
                          {l.icon} {isRu ? l.ru : l.en}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Bank Details (shown if bank_transfer selected) */}
          {selectedMethods.includes('bank_transfer') && (
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <p className="text-xs font-semibold">🏦 {isRu ? 'Банковские реквизиты' : 'Bank Details'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{isRu ? 'Банк' : 'Bank'}</Label>
                  <Input className="h-8 text-xs" value={form.bank_name || ''} onChange={e => update({ bank_name: e.target.value })} disabled={readonly} />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Номер счёта' : 'Account Number'}</Label>
                  <Input className="h-8 text-xs" value={form.bank_account_number || ''} onChange={e => update({ bank_account_number: e.target.value })} disabled={readonly} />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Имя владельца' : 'Account Name'}</Label>
                  <Input className="h-8 text-xs" value={form.bank_account_name || ''} onChange={e => update({ bank_account_name: e.target.value })} disabled={readonly} />
                </div>
                <div>
                  <Label className="text-xs">SWIFT</Label>
                  <Input className="h-8 text-xs" value={form.bank_swift || ''} onChange={e => update({ bank_swift: e.target.value })} disabled={readonly} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">IBAN</Label>
                  <Input className="h-8 text-xs" value={form.bank_iban || ''} onChange={e => update({ bank_iban: e.target.value })} disabled={readonly} />
                </div>
              </div>
            </div>
          )}

          {/* Crypto (shown if crypto selected) */}
          {selectedMethods.includes('crypto') && (
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <p className="text-xs font-semibold">₿ {isRu ? 'Крипто-кошелёк' : 'Crypto Wallet'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{isRu ? 'Адрес' : 'Wallet Address'}</Label>
                  <Input className="h-8 text-xs font-mono" value={form.crypto_wallet_address || ''} onChange={e => update({ crypto_wallet_address: e.target.value })} disabled={readonly} />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Сеть' : 'Network'}</Label>
                  <Input className="h-8 text-xs" placeholder="TRC-20, ERC-20, BEP-20..." value={form.crypto_network || ''} onChange={e => update({ crypto_network: e.target.value })} disabled={readonly} />
                </div>
              </div>
            </div>
          )}

          {/* Digital payments */}
          {(selectedMethods.includes('paypal') || selectedMethods.includes('wise') || selectedMethods.includes('promptpay') || selectedMethods.includes('stripe')) && (
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <p className="text-xs font-semibold">💳 {isRu ? 'Электронные платежи' : 'Digital Payments'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedMethods.includes('paypal') && (
                  <div>
                    <Label className="text-xs">PayPal Email</Label>
                    <Input className="h-8 text-xs" value={form.paypal_email || ''} onChange={e => update({ paypal_email: e.target.value })} disabled={readonly} />
                  </div>
                )}
                {selectedMethods.includes('wise') && (
                  <div>
                    <Label className="text-xs">Wise Email</Label>
                    <Input className="h-8 text-xs" value={form.wise_email || ''} onChange={e => update({ wise_email: e.target.value })} disabled={readonly} />
                  </div>
                )}
                {selectedMethods.includes('promptpay') && (
                  <div>
                    <Label className="text-xs">PromptPay ID</Label>
                    <Input className="h-8 text-xs" value={form.promptpay_id || ''} onChange={e => update({ promptpay_id: e.target.value })} disabled={readonly} />
                  </div>
                )}
                {selectedMethods.includes('stripe') && (
                  <div>
                    <Label className="text-xs">Stripe Account ID</Label>
                    <Input className="h-8 text-xs font-mono" value={form.stripe_account_id || ''} onChange={e => update({ stripe_account_id: e.target.value })} disabled={readonly} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commission */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isRu ? 'Комиссия' : 'Commission'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">{isRu ? 'Тип' : 'Type'}</Label>
                <Select value={form.commission_type || 'percentage'} onValueChange={v => update({ commission_type: v })} disabled={readonly}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage" className="text-xs">{isRu ? 'Процент' : 'Percentage'}</SelectItem>
                    <SelectItem value="fixed" className="text-xs">{isRu ? 'Фиксированная' : 'Fixed'}</SelectItem>
                    <SelectItem value="mixed" className="text-xs">{isRu ? 'Смешанная' : 'Mixed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.commission_type === 'percentage' || form.commission_type === 'mixed') && (
                <div>
                  <Label className="text-xs">%</Label>
                  <Input className="h-8 text-xs" type="number" step="0.5" min="0" max="100" value={form.commission_percent ?? ''} onChange={e => update({ commission_percent: e.target.value ? Number(e.target.value) : null })} disabled={readonly} />
                </div>
              )}
              {(form.commission_type === 'fixed' || form.commission_type === 'mixed') && (
                <div>
                  <Label className="text-xs">{isRu ? 'Сумма' : 'Amount'}</Label>
                  <Input className="h-8 text-xs" type="number" value={form.commission_fixed_amount ?? ''} onChange={e => update({ commission_fixed_amount: e.target.value ? Number(e.target.value) : null })} disabled={readonly} />
                </div>
              )}
              <div>
                <Label className="text-xs">{isRu ? 'Валюта' : 'Currency'}</Label>
                <Select value={form.commission_currency || 'THB'} onValueChange={v => update({ commission_currency: v })} disabled={readonly}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['THB', 'USD', 'EUR', 'RUB', 'USDT'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payout Schedule */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isRu ? 'График выплат' : 'Payout Schedule'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">{isRu ? 'Частота' : 'Frequency'}</Label>
                <Select value={form.payout_frequency || 'monthly'} onValueChange={v => update({ payout_frequency: v })} disabled={readonly}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYOUT_FREQUENCIES.map(f => {
                      const l = PAYOUT_FREQUENCY_LABELS[f];
                      return <SelectItem key={f} value={f} className="text-xs">{isRu ? l.ru : l.en}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {form.payout_frequency === 'monthly' && (
                <div>
                  <Label className="text-xs">{isRu ? 'День месяца' : 'Day of month'}</Label>
                  <Input className="h-8 text-xs" type="number" min="1" max="28" value={form.payout_day ?? ''} onChange={e => update({ payout_day: e.target.value ? Number(e.target.value) : null })} disabled={readonly} />
                </div>
              )}
              <div>
                <Label className="text-xs">{isRu ? 'Мин. сумма' : 'Min payout'}</Label>
                <Input className="h-8 text-xs" type="number" value={form.minimum_payout_amount ?? ''} onChange={e => update({ minimum_payout_amount: e.target.value ? Number(e.target.value) : null })} disabled={readonly} />
              </div>
            </div>
          </div>

          {/* Contract Dates */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isRu ? 'Срок контракта' : 'Contract Period'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">{isRu ? 'Начало' : 'Start'}</Label>
                <Input className="h-8 text-xs" type="date" value={form.contract_start_date || ''} onChange={e => update({ contract_start_date: e.target.value || null })} disabled={readonly} />
              </div>
              <div>
                <Label className="text-xs">{isRu ? 'Окончание' : 'End'}</Label>
                <Input className="h-8 text-xs" type="date" value={form.contract_end_date || ''} onChange={e => update({ contract_end_date: e.target.value || null })} disabled={readonly} />
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <Switch
                  checked={form.auto_renew ?? false}
                  onCheckedChange={v => update({ auto_renew: v })}
                  disabled={readonly}
                />
                <Label className="text-xs">{isRu ? 'Автопродление' : 'Auto-renew'}</Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea
              className="text-xs min-h-[60px]"
              value={form.notes || ''}
              onChange={e => update({ notes: e.target.value })}
              placeholder={isRu ? 'Особые условия...' : 'Special conditions...'}
              disabled={readonly}
            />
          </div>

          {/* Save */}
          {!readonly && dirty && (
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending} className="w-full">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {upsert.isPending
                ? (isRu ? 'Сохранение...' : 'Saving...')
                : (isRu ? 'Сохранить условия' : 'Save Terms')}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
