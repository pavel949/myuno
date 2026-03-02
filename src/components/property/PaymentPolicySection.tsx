import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';
import { PAYMENT_MODELS } from '@/lib/propertyTaxonomy';

interface PaymentPolicyData {
  payment_policy?: string;
  prepay_percent?: number;
  balance_due_days?: number;
  deposit_amount?: string;
  deposit_currency?: string;
}

interface PaymentPolicySectionProps {
  formData: PaymentPolicyData;
  updateFormData: (updates: Partial<PaymentPolicyData>) => void;
}

function PaymentPolicySectionInner({ formData, updateFormData }: PaymentPolicySectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const policy = formData.payment_policy || 'prepay_10';
  const isCustom = policy === 'custom';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          {isRu ? 'Порядок оплаты' : 'Payment Schedule'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Установите порядок оплаты для каждого объекта индивидуально.'
            : 'Set the payment schedule individually for each property.'}
        </p>

        {/* Payment Model Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PAYMENT_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                updateFormData({
                  payment_policy: model.id,
                  prepay_percent: model.prepayPercent,
                });
              }}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                policy === model.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{model.icon}</span>
                <span className="font-medium text-sm">
                  {isRu ? model.labelRu : model.labelEn}
                </span>
              </div>
            </button>
          ))}
          {/* Custom option */}
          <button
            type="button"
            onClick={() => updateFormData({ payment_policy: 'custom' })}
            className={`p-3 rounded-xl border-2 text-left transition-colors ${
              isCustom
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span className="font-medium text-sm">
                {isRu ? 'Свой вариант' : 'Custom'}
              </span>
            </div>
          </button>
        </div>

        {/* Custom prepay % */}
        {isCustom && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">{isRu ? 'Предоплата %' : 'Prepay %'}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.prepay_percent ?? ''}
                  onChange={(e) => updateFormData({ prepay_percent: Number(e.target.value) })}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isRu ? 'Остаток за N дней до заезда' : 'Balance due N days before'}</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={formData.balance_due_days ?? ''}
                onChange={(e) => updateFormData({ balance_due_days: Number(e.target.value) })}
                className="h-9"
                placeholder="7"
              />
            </div>
          </div>
        )}

        {/* Deposit with Currency */}
        <div className="space-y-2">
          <Label>{isRu ? 'Возвратный депозит' : 'Refundable Deposit'}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              value={formData.deposit_amount ?? ''}
              onChange={(e) => updateFormData({ deposit_amount: e.target.value })}
              placeholder="500"
              className="flex-1"
            />
            <Select
              value={formData.deposit_currency || 'USD'}
              onValueChange={(v) => updateFormData({ deposit_currency: v })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="THB">฿ THB</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Возвращается при выезде после проверки состояния объекта'
              : 'Returned at check-out after property condition check'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const PaymentPolicySection = memo(PaymentPolicySectionInner);
