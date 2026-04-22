import React from 'react';
import { CalendarClock, Wallet } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

export type PayWhenChoice = 'full' | 'split';

interface PayWhenSelectorProps {
  value: PayWhenChoice;
  onChange: (next: PayWhenChoice) => void;
  totalAmount: number;
  prepayAmount: number;
  prepayPercent: number;
  /** Optional ISO date when the balance will be charged (e.g. 7 days before check-in). */
  balanceDueDate?: Date | null;
  className?: string;
}

/**
 * Airbnb "Choose when to pay" — radio between paying the full amount now or
 * splitting into a prepayment + balance later. Only shown when the property
 * owner opted in via `allow_pay_later`. Doesn't touch pricing math.
 */
export function PayWhenSelector({
  value,
  onChange,
  totalAmount,
  prepayAmount,
  prepayPercent,
  balanceDueDate,
  className,
}: PayWhenSelectorProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const balance = Math.max(totalAmount - prepayAmount, 0);

  const formatBalanceDate = (d: Date) => {
    try {
      return d.toLocaleDateString(isRu ? 'ru-RU' : 'en-GB', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {isRu ? 'Когда оплачивать' : 'Choose when to pay'}
        </h2>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PayWhenChoice)}
        className="space-y-2"
      >
        {/* Pay in full */}
        <label
          htmlFor="pay-when-full"
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
            value === 'full' ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
          )}
        >
          <RadioGroupItem value="full" id="pay-when-full" className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {isRu ? `Оплатить ${formatPrice(totalAmount)} сейчас` : `Pay ${formatPrice(totalAmount)} now`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRu
                ? 'Списание сразу. Никаких дополнительных платежей до заезда.'
                : 'Charged immediately. Nothing else until check-in.'}
            </p>
          </div>
        </label>

        {/* Split */}
        <label
          htmlFor="pay-when-split"
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
            value === 'split' ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
          )}
        >
          <RadioGroupItem value="split" id="pay-when-split" className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {isRu
                  ? `Часть сейчас, остаток позже`
                  : `Pay part now, part later`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRu
                ? `${formatPrice(prepayAmount)} (${prepayPercent}%) сейчас, ${formatPrice(balance)}`
                : `${formatPrice(prepayAmount)} (${prepayPercent}%) due now, ${formatPrice(balance)}`}
              {balanceDueDate ? (
                <>
                  {' '}
                  <CalendarClock className="inline w-3 h-3 -mt-0.5" />{' '}
                  {isRu ? 'к' : 'on'} {formatBalanceDate(balanceDueDate)}
                </>
              ) : (
                <>
                  {' '}
                  {isRu ? 'до заезда' : 'before check-in'}
                </>
              )}
            </p>
          </div>
        </label>
      </RadioGroup>
    </section>
  );
}
