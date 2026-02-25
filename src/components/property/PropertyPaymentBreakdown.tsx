import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Shield, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { PaymentStage } from './PaymentStageSelector';

interface PropertyPaymentBreakdownProps {
  pricePerNight: number;
  nights: number;
  totalAmount: number;
  securityDeposit: number;
  currency: string;
  currencySymbol: string;
  stages: PaymentStage[];
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  className?: string;
}

export function PropertyPaymentBreakdown({
  pricePerNight,
  nights,
  totalAmount,
  securityDeposit,
  currency,
  currencySymbol,
  stages,
  weeklyDiscount,
  monthlyDiscount,
  className,
}: PropertyPaymentBreakdownProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Calculate discounts
  const discountInfo = useMemo(() => {
    const baseTotal = pricePerNight * nights;
    let discountPercent = 0;
    let discountLabel = '';

    if (nights >= 30 && monthlyDiscount && monthlyDiscount > 0) {
      discountPercent = monthlyDiscount;
      discountLabel = isRu ? 'Скидка за месяц' : 'Monthly discount';
    } else if (nights >= 7 && weeklyDiscount && weeklyDiscount > 0) {
      discountPercent = weeklyDiscount;
      discountLabel = isRu ? 'Скидка за неделю' : 'Weekly discount';
    }

    const discountAmount = Math.round((baseTotal * discountPercent) / 100);
    return { baseTotal, discountPercent, discountAmount, discountLabel };
  }, [pricePerNight, nights, weeklyDiscount, monthlyDiscount, isRu]);

  // Calculate due now
  const dueNow = useMemo(() => {
    return stages
      .filter(s => s.type === 'deposit')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [stages]);

  const dueLater = useMemo(() => {
    return stages
      .filter(s => s.type === 'balance')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [stages]);

  const grandTotal = totalAmount + securityDeposit;

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-4", className)}>
      <h3 className="font-semibold">{isRu ? 'Стоимость' : 'Price Details'}</h3>

      {/* Base calculation */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {currencySymbol}{pricePerNight.toLocaleString()} × {nights} {isRu ? 'ночей' : 'nights'}
          </span>
          <span>{currencySymbol}{discountInfo.baseTotal.toLocaleString()}</span>
        </div>

        {/* Discount if applicable */}
        {discountInfo.discountPercent > 0 && (
          <div className="flex justify-between text-success">
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {discountInfo.discountLabel} -{discountInfo.discountPercent}%
            </span>
            <span>-{currencySymbol}{discountInfo.discountAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Accommodation total */}
      <div className="flex justify-between font-medium">
        <span>{isRu ? 'Проживание' : 'Accommodation'}</span>
        <span>{currencySymbol}{totalAmount.toLocaleString()}</span>
      </div>

      {/* Security deposit */}
      {securityDeposit > 0 && (
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="w-4 h-4" />
            {isRu ? 'Залоговый депозит' : 'Security Deposit'}
          </span>
          <span className="text-muted-foreground">{currencySymbol}{securityDeposit.toLocaleString()}</span>
        </div>
      )}

      <Separator />

      {/* Grand total */}
      <div className="flex justify-between text-lg font-bold">
        <span>{isRu ? 'Итого' : 'Total'}</span>
        <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
      </div>

      {/* Payment stages breakdown */}
      {stages.length > 1 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Этапы оплаты' : 'Payment Schedule'}
            </p>
            {stages.map((stage, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  stage.type === 'deposit' && "bg-primary/10",
                  stage.type === 'balance' && "bg-muted/50",
                  stage.type === 'security_deposit' && "bg-amber-500/10"
                )}
              >
                <div className="flex items-center gap-2">
                  {stage.type === 'deposit' && (
                    <Badge variant="default" className="text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      {isRu ? 'Сейчас' : 'Now'}
                    </Badge>
                  )}
                  {stage.type === 'balance' && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {stage.dueDate 
                        ? format(stage.dueDate, 'dd MMM', { locale: isRu ? ru : undefined })
                        : (isRu ? 'Позже' : 'Later')
                      }
                    </Badge>
                  )}
                  {stage.type === 'security_deposit' && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                      <Shield className="w-3 h-3 mr-1" />
                      {isRu ? 'Залог' : 'Deposit'}
                    </Badge>
                  )}
                  <span className="text-sm">
                    {stage.type === 'deposit' && (isRu ? 'Предоплата' : 'Deposit')}
                    {stage.type === 'balance' && (isRu ? 'Остаток' : 'Balance')}
                    {stage.type === 'security_deposit' && (isRu ? 'Возвращается' : 'Refundable')}
                  </span>
                </div>
                <span className={cn(
                  "font-semibold",
                  stage.type === 'deposit' && "text-primary"
                )}>
                  {currencySymbol}{stage.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Due now highlight */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="font-medium text-primary">
            {isRu ? 'К оплате сейчас' : 'Due Now'}
          </span>
          <span className="text-xl font-bold text-primary">
            {currencySymbol}{dueNow.toLocaleString()}
          </span>
        </div>
        {dueLater > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Остаток' : 'Remaining'}: {currencySymbol}{dueLater.toLocaleString()}
            {securityDeposit > 0 && ` + ${currencySymbol}${securityDeposit.toLocaleString()} ${isRu ? 'залог' : 'deposit'}`}
          </p>
        )}
      </div>
    </div>
  );
}
