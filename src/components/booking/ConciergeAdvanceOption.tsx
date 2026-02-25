import { Sparkles, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConciergeAdvanceOptionProps {
  isSelected: boolean;
  onSelect: () => void;
  baseAmount: number;
  feePercent?: number;
  currency?: string;
  className?: string;
}

export function ConciergeAdvanceOption({
  isSelected,
  onSelect,
  baseAmount,
  feePercent = 5,
  currency = 'THB',
  className,
}: ConciergeAdvanceOptionProps) {
  const { language } = useLanguage();
  const currencySymbol = getCurrencySymbol(currency);
  
  const fee = Math.round(baseAmount * (feePercent / 100) * 100) / 100;
  const totalWithFee = baseAmount + fee;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all text-left",
        "bg-gradient-to-br from-amber-500/5 to-orange-500/5",
        isSelected
          ? "border-amber-500 bg-amber-500/10"
          : "border-border hover:border-amber-500/50",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isSelected 
            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" 
            : "bg-amber-500/20 text-amber-600"
        )}>
          <Sparkles className="w-5 h-5" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">
              {language === 'ru' 
                ? 'Попросить myUNO оплатить' 
                : 'Ask myUNO to pay'}
            </span>
            {feePercent > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium">
                +{feePercent}%
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
                {language === 'ru' ? 'Бесплатно' : 'Free'}
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="text-sm">
                    {language === 'ru'
                      ? 'myUNO внесёт предоплату провайдеру наличными. Вы оплатите нам любым удобным способом (карта, крипто, перевод).'
                      : 'myUNO will pay the provider in cash on your behalf. You can then pay us via card, crypto, or wire transfer.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {feePercent > 0
              ? (language === 'ru'
                ? 'Нет батов? Нет тайского счёта? Мы оплатим за вас!'
                : 'No Thai Baht? No Thai bank account? We\'ll pay for you!')
              : (language === 'ru'
                ? '🏠 Бесплатно для гостей myUNO! Мы оплатим за вас.'
                : '🏠 Free for myUNO property guests! We\'ll pay for you.')}
          </p>
          
          {/* Pricing breakdown */}
          <div className="bg-background/60 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Сумма заказа' : 'Order amount'}
              </span>
              <span>{currencySymbol}{baseAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'Сервис myUNO' : 'myUNO service'} ({feePercent}%)
              </span>
              <span className="text-amber-600">+{currencySymbol}{fee.toLocaleString()}</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between font-semibold">
              <span>{language === 'ru' ? 'К оплате' : 'You pay'}</span>
              <span className="text-amber-600">{currencySymbol}{totalWithFee.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Radio indicator */}
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1",
          isSelected 
            ? "border-amber-500 bg-amber-500" 
            : "border-muted-foreground/30"
        )}>
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
