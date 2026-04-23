import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CANCELLATION_POLICY_DETAILS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, addHours } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';

interface BookingTermsCardProps {
  cancellationPolicy?: string;
  securityDeposit?: number;
  cleaningFee?: number;
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string;
  houseRulesRu?: string;
  smokingPenalty?: number;
  lateCheckoutPenalty?: number;
  petDeposit?: number;
  className?: string;
  // New props for refund calculator
  checkInDate?: Date | string;
  totalPrice?: number;
  depositAmount?: number; // 10% prepayment amount
}

export function BookingTermsCard({
  cancellationPolicy = 'flexible',
  securityDeposit,
  cleaningFee,
  checkInTime,
  checkOutTime,
  houseRules,
  houseRulesRu,
  smokingPenalty,
  lateCheckoutPenalty,
  petDeposit,
  className,
  checkInDate,
  totalPrice,
  depositAmount,
}: BookingTermsCardProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = React.useState(false);

  const policy = CANCELLATION_POLICY_DETAILS[cancellationPolicy as keyof typeof CANCELLATION_POLICY_DETAILS] 
    || CANCELLATION_POLICY_DETAILS.flexible;

  // Calculate refund deadlines if check-in date is provided
  const checkIn = checkInDate ? new Date(checkInDate) : null;
  const fullRefundDeadline = checkIn && policy.fullRefundHours > 0 
    ? addHours(checkIn, -policy.fullRefundHours) 
    : null;
  // For partial refund window, use 24h before check-in for policies that have partial refund
  const partialRefundDeadline = checkIn && policy.partialRefundPercent > 0 
    ? addHours(checkIn, -24) 
    : null;
  
  // Calculate refund amounts
  const deposit = depositAmount || (totalPrice ? totalPrice * 0.1 : 0);
  const remainingAmount = totalPrice ? totalPrice - deposit : 0;
  const partialRefundAmount = remainingAmount && policy.partialRefundPercent 
    ? remainingAmount * (policy.partialRefundPercent / 100) 
    : 0;
  const fullRefundAmount = remainingAmount; // Full refund = everything except 10% deposit

  const policyColorClass = {
    green: 'bg-success/10 text-success border-success/20',
    yellow: 'bg-warning/10 text-warning border-warning/20',
    orange: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    red: 'bg-destructive/10 text-destructive border-destructive/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  }[policy.color] || 'bg-muted text-muted-foreground';

  const displayRules = isRu ? (houseRulesRu || houseRules) : houseRules;

  return (
    <Card className={cn("border-border", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-none bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">
                    {isRu ? 'Условия бронирования' : 'Booking Terms'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Политика отмены и правила' : 'Cancellation policy & rules'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-xs", policyColorClass)}>
                {isRu ? policy.nameRu : policy.nameEn}
              </Badge>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <Separator />

            {/* Cancellation Policy Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {isRu ? 'Политика отмены' : 'Cancellation Policy'}
              </h4>
              <div className={cn("p-3 rounded-none border", policyColorClass)}>
                <p className="text-sm font-medium">
                  {isRu ? policy.nameRu : policy.nameEn}
                </p>
                <p className="text-xs mt-1 opacity-80">
                  {isRu ? policy.descRu : policy.descEn}
                </p>
              </div>

              {/* Refund Calculator - Shows exact amounts and dates when available */}
              {fullRefundDeadline && totalPrice && (
                <div className="p-3 rounded-none bg-success/10 border border-success/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      {isRu ? 'Калькулятор возврата' : 'Refund Calculator'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-success">
                        {isRu 
                          ? `До ${format(fullRefundDeadline, 'd MMM, HH:mm', { locale: ruLocale })}: полный возврат ${formatPrice(fullRefundAmount)}`
                          : `Before ${format(fullRefundDeadline, 'd MMM, h:mm a', { locale: enUS })}: full refund ${formatPrice(fullRefundAmount)}`}
                      </span>
                    </div>
                    {partialRefundDeadline && partialRefundAmount > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-warning">
                          {isRu 
                            ? `${format(fullRefundDeadline, 'd MMM')} — ${format(partialRefundDeadline, 'd MMM')}: возврат ${formatPrice(partialRefundAmount)} (${policy.partialRefundPercent}%)`
                            : `${format(fullRefundDeadline, 'd MMM')} — ${format(partialRefundDeadline, 'd MMM')}: refund ${formatPrice(partialRefundAmount)} (${policy.partialRefundPercent}%)`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-destructive">
                        {isRu 
                          ? `Предоплата ${formatPrice(deposit)} невозвратная`
                          : `${formatPrice(deposit)} deposit is non-refundable`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund timeline visual - when no specific dates available */}
              {!fullRefundDeadline && (
                <>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>
                      {policy.fullRefundHours > 0 
                        ? (isRu 
                            ? `Полный возврат за ${policy.fullRefundHours}ч+ до заезда`
                            : `Full refund ${policy.fullRefundHours}h+ before check-in`)
                        : (isRu ? 'Возврат недоступен' : 'No refund available')
                      }
                    </span>
                  </div>
                  {policy.partialRefundPercent > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      <span>
                        {isRu 
                          ? `${policy.partialRefundPercent}% возврат в течение окна`
                          : `${policy.partialRefundPercent}% refund within window`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                    <span>
                      {isRu 
                        ? '10% предоплата невозвратная'
                        : '10% deposit is non-refundable'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Fees & Deposits */}
            {(securityDeposit || cleaningFee || petDeposit) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    {isRu ? 'Сборы и депозиты' : 'Fees & Deposits'}
                  </h4>
                  <div className="space-y-1.5">
                    {securityDeposit && securityDeposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRu ? 'Залог' : 'Security deposit'}
                        </span>
                        <span className="font-medium">{formatPrice(securityDeposit)}</span>
                      </div>
                    )}
                    {cleaningFee && cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRu ? 'Уборка' : 'Cleaning fee'}
                        </span>
                        <span className="font-medium">{formatPrice(cleaningFee)}</span>
                      </div>
                    )}
                    {petDeposit && petDeposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRu ? 'Депозит за питомца' : 'Pet deposit'}
                        </span>
                        <span className="font-medium">{formatPrice(petDeposit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Check-in/out times */}
            {(checkInTime || checkOutTime) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  {checkInTime && (
                    <div className="text-center p-2 rounded-none bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'Заезд с' : 'Check-in from'}
                      </p>
                      <p className="font-semibold">{checkInTime}</p>
                    </div>
                  )}
                  {checkOutTime && (
                    <div className="text-center p-2 rounded-none bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'Выезд до' : 'Check-out by'}
                      </p>
                      <p className="font-semibold">{checkOutTime}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Penalties */}
            {(smokingPenalty || lateCheckoutPenalty) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {isRu ? 'Штрафы' : 'Penalties'}
                  </h4>
                  <div className="space-y-1.5">
                    {smokingPenalty && smokingPenalty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRu ? 'Курение' : 'Smoking'}
                        </span>
                        <span className="font-medium text-destructive">
                          {formatPrice(smokingPenalty)}
                        </span>
                      </div>
                    )}
                    {lateCheckoutPenalty && lateCheckoutPenalty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRu ? 'Поздний выезд' : 'Late checkout'}
                        </span>
                        <span className="font-medium text-destructive">
                          {formatPrice(lateCheckoutPenalty)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* House Rules */}
            {displayRules && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {isRu ? 'Правила дома' : 'House Rules'}
                  </h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {displayRules}
                  </p>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
