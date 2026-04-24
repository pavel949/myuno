import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CreditCard, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export type PaymentModel = 'full_prepay' | 'split_payment' | 'inquiry_only';

export interface PaymentStage {
  type: 'deposit' | 'balance' | 'security_deposit';
  amount: number;
  dueDate?: Date;
  dueLabel?: string;
  isPaid?: boolean;
}

interface PaymentStageSelectorProps {
  totalAmount: number;
  securityDeposit: number;
  paymentModel: PaymentModel;
  prepayPercent: number;
  balanceDueDays: number;
  checkInDate: Date;
  currency: string;
  currencySymbol: string;
  selectedModel: 'full' | 'split';
  onSelectModel: (model: 'full' | 'split') => void;
  className?: string;
}

export function PaymentStageSelector({
  totalAmount,
  securityDeposit,
  paymentModel,
  prepayPercent,
  balanceDueDays,
  checkInDate,
  currency,
  currencySymbol,
  selectedModel,
  onSelectModel,
  className,
}: PaymentStageSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Calculate payment stages
  const stages = useMemo(() => {
    const depositAmount = Math.round((totalAmount * prepayPercent) / 100);
    const balanceAmount = totalAmount - depositAmount;
    const balanceDueDate = addDays(checkInDate, -balanceDueDays);

    const result: PaymentStage[] = [];

    if (selectedModel === 'full') {
      result.push({
        type: 'deposit',
        amount: totalAmount,
        dueLabel: isRu ? 'Сейчас' : 'Now',
      });
    } else {
      result.push({
        type: 'deposit',
        amount: depositAmount,
        dueLabel: isRu ? 'Сейчас' : 'Now',
      });
      result.push({
        type: 'balance',
        amount: balanceAmount,
        dueDate: balanceDueDate,
        dueLabel: balanceDueDays === 0 
          ? (isRu ? 'При заезде' : 'At check-in')
          : format(balanceDueDate, 'dd MMM', { locale: isRu ? ru : undefined }),
      });
    }

    if (securityDeposit > 0) {
      result.push({
        type: 'security_deposit',
        amount: securityDeposit,
        dueLabel: isRu ? 'При заезде' : 'At check-in',
      });
    }

    return result;
  }, [totalAmount, securityDeposit, prepayPercent, balanceDueDays, checkInDate, selectedModel, isRu]);

  // Calculate what's due now
  const dueNow = useMemo(() => {
    return stages
      .filter(s => s.dueLabel === (isRu ? 'Сейчас' : 'Now'))
      .reduce((sum, s) => sum + s.amount, 0);
  }, [stages, isRu]);

  // If payment model doesn't allow split, don't show selector
  if (paymentModel === 'full_prepay' || paymentModel === 'inquiry_only') {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <span className="font-semibold">{isRu ? 'Способ оплаты' : 'Payment Method'}</span>
      </div>

      <RadioGroup
        value={selectedModel}
        onValueChange={(v) => onSelectModel(v as 'full' | 'split')}
        className="space-y-3"
      >
        {/* Full Payment Option */}
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-none border-2 transition-all cursor-pointer",
            selectedModel === 'full' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelectModel('full')}
        >
          <RadioGroupItem value="full" id="full" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="full" className="font-medium cursor-pointer">
              {isRu ? 'Оплатить полностью' : 'Pay in Full'}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {currencySymbol}{totalAmount.toLocaleString()}
              {securityDeposit > 0 && (
                <span> + {currencySymbol}{securityDeposit.toLocaleString()} {isRu ? 'залог' : 'deposit'}</span>
              )}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <Check className="w-3 h-3 mr-1" />
            {isRu ? 'Один платёж' : 'One payment'}
          </Badge>
        </div>

        {/* Split Payment Option */}
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-none border-2 transition-all cursor-pointer",
            selectedModel === 'split' 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelectModel('split')}
        >
          <RadioGroupItem value="split" id="split" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="split" className="font-medium cursor-pointer">
              {isRu ? 'Депозит + остаток' : 'Deposit + Balance'}
            </Label>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {isRu ? 'Сейчас' : 'Now'}
                </Badge>
                <span>
                  {currencySymbol}{Math.round((totalAmount * prepayPercent) / 100).toLocaleString()} ({prepayPercent}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-2.5 h-2.5 mr-1" />
                  {balanceDueDays === 0 
                    ? (isRu ? 'При заезде' : 'Check-in')
                    : format(addDays(checkInDate, -balanceDueDays), 'dd MMM', { locale: isRu ? ru : undefined })
                  }
                </Badge>
                <span>
                  {currencySymbol}{(totalAmount - Math.round((totalAmount * prepayPercent) / 100)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RadioGroup>

      {/* Security Deposit Note */}
      {securityDeposit > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-none bg-muted/50 text-sm">
          <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">{isRu ? 'Залоговый депозит' : 'Security Deposit'}: </span>
            <span className="text-muted-foreground">
              {currencySymbol}{securityDeposit.toLocaleString()} — {isRu ? 'оплачивается при заезде, возвращается после выезда' : 'paid at check-in, refunded after check-out'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function calculatePaymentStages(
  totalAmount: number,
  securityDeposit: number,
  paymentModel: PaymentModel,
  prepayPercent: number,
  balanceDueDays: number,
  checkInDate: Date,
  selectedModel: 'full' | 'split'
): PaymentStage[] {
  const stages: PaymentStage[] = [];
  const depositAmount = Math.round((totalAmount * prepayPercent) / 100);
  const balanceAmount = totalAmount - depositAmount;
  const balanceDueDate = addDays(checkInDate, -balanceDueDays);

  if (paymentModel === 'full_prepay' || selectedModel === 'full') {
    stages.push({
      type: 'deposit',
      amount: totalAmount,
    });
  } else {
    stages.push({
      type: 'deposit',
      amount: depositAmount,
    });
    stages.push({
      type: 'balance',
      amount: balanceAmount,
      dueDate: balanceDueDate,
    });
  }

  if (securityDeposit > 0) {
    stages.push({
      type: 'security_deposit',
      amount: securityDeposit,
      dueDate: checkInDate,
    });
  }

  return stages;
}
