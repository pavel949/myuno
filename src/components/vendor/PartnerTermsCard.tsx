import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Percent, Calendar, Shield, Clock, 
  ChevronRight, Sparkles, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PartnerTermsCardProps {
  /** Commission rate (e.g., 10) */
  commissionRate?: number;
  /** Show promo badge for first month free */
  showPromo?: boolean;
  /** Vertical name for context */
  verticalLabel?: string;
  /** Callback when user clicks CTA */
  onAccept?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode for embedding */
  compact?: boolean;
  className?: string;
}

export function PartnerTermsCard({
  commissionRate = 10,
  showPromo = true,
  verticalLabel,
  onAccept,
  isLoading,
  compact,
  className,
}: PartnerTermsCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const earnings = 10000;
  const platformFee = (earnings * commissionRate) / 100;
  const partnerEarnings = earnings - platformFee;

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border/60 bg-card overflow-hidden',
        '[box-shadow:var(--shadow-elevation-2)]',
        'transition-all duration-200 hover:[box-shadow:var(--shadow-elevation-3)]',
        className
      )}
    >
      {/* Promo Badge */}
      {showPromo && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
            <Sparkles className="h-3 w-3 text-success" />
            <span className="text-[10px] font-medium text-success uppercase tracking-wide">
              {isRu ? '1 месяц 0%' : '1 month free'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn('px-5 pt-5', compact ? 'pb-3' : 'pb-4')}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {verticalLabel || (isRu ? 'Условия партнёрства' : 'Partnership Terms')}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-display tracking-tight">
            {commissionRate}%
          </span>
          <span className="text-muted-foreground text-sm">
            {isRu ? 'комиссия' : 'commission'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/60" />

      {/* Terms List - Airbnb stacked style */}
      <div className={cn('px-5', compact ? 'py-3' : 'py-4')}>
        <div className="space-y-0">
          <TermRow
            icon={Percent}
            label={isRu ? 'Комиссия платформы' : 'Platform fee'}
            value={`${commissionRate}%`}
            sublabel={isRu ? 'от суммы заказа' : 'of order value'}
            isFirst
          />
          <TermRow
            icon={Calendar}
            label={isRu ? 'Выплаты' : 'Payouts'}
            value={isRu ? 'Еженедельно' : 'Weekly'}
            sublabel={isRu ? 'каждую пятницу' : 'every Friday'}
          />
          <TermRow
            icon={Shield}
            label={isRu ? 'Escrow-защита' : 'Escrow protection'}
            value={isRu ? 'Включена' : 'Included'}
            sublabel={isRu ? '+72ч после услуги' : '+72h after service'}
          />
          <TermRow
            icon={Clock}
            label={isRu ? 'Время ответа' : 'Response time'}
            value={isRu ? '2 часа' : '2 hours'}
            sublabel={isRu ? 'требуется' : 'required'}
            isLast
          />
        </div>
      </div>

      {/* Price Breakdown Example */}
      {!compact && (
        <>
          <div className="mx-5 border-t border-border/60" />
          <div className="px-5 py-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isRu ? 'Пример расчёта' : 'Example breakdown'}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      {isRu 
                        ? 'Расчёт для заказа на ₿10,000. Реальные суммы зависят от услуги.'
                        : 'Calculation for a ₿10,000 order. Actual amounts depend on service.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRu ? 'Сумма заказа' : 'Order total'}
                </span>
                <span>฿{earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRu ? 'Комиссия платформы' : 'Platform fee'} ({commissionRate}%)
                </span>
                <span className="text-destructive">-฿{platformFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-border/60 pt-2 flex justify-between">
                <span className="font-semibold text-sm">
                  {isRu ? 'Ваш заработок' : 'Your earnings'}
                </span>
                <span className="font-bold text-success">
                  ฿{partnerEarnings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      {onAccept && (
        <>
          <div className="mx-5 border-t border-border/60" />
          <div className="p-5">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={onAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isRu ? 'Обработка...' : 'Processing...'}
                </span>
              ) : (
                <>
                  {isRu ? 'Принять условия' : 'Accept Terms'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {isRu 
                ? 'Нажимая, вы соглашаетесь с условиями партнёрства'
                : 'By clicking, you agree to the partnership terms'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── TermRow Component ──
interface TermRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

function TermRow({ icon: Icon, label, value, sublabel, isFirst, isLast }: TermRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3',
        !isLast && 'border-b border-border/40'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sublabel && (
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default PartnerTermsCard;
