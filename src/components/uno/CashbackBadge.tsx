import React from 'react';
import { TrendingUp, Percent, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCashback } from '@/hooks/useCashback';
import { cn } from '@/lib/utils';

interface CashbackBadgeProps {
  category?: string;
  amount?: number;
  showAmount?: boolean;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function CashbackBadge({ 
  category, 
  amount, 
  showAmount = false,
  variant = 'inline',
  className 
}: CashbackBadgeProps) {
  const { language } = useLanguage();
  const { getCashbackPercentage, getCashbackAmount, getCashbackInfo, isLoading } = useCashback();

  if (isLoading) return null;

  const percentage = getCashbackPercentage(category);
  const cashbackAmount = amount ? getCashbackAmount(amount, category) : 0;
  const info = getCashbackInfo(category);

  if (!percentage || percentage <= 0) return null;

  // Check if order meets minimum
  if (amount && info?.min_order_amount && amount < info.min_order_amount) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400",
        className
      )}>
        <TrendingUp className="w-3 h-3" />
        {showAmount && cashbackAmount > 0 ? (
          <span>+{cashbackAmount.toLocaleString()} ₽</span>
        ) : (
          <span>{percentage}% {language === 'ru' ? 'кэшбэк' : 'cashback'}</span>
        )}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20",
        className
      )}>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Percent className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {language === 'ru' ? `Кэшбэк ${percentage}%` : `${percentage}% Cashback`}
          </div>
          {showAmount && cashbackAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Вернём на кошелёк' : 'Back to wallet'}: +{cashbackAmount.toLocaleString()} ₽
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20",
        className
      )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">
              {language === 'ru' ? `Кэшбэк ${percentage}%` : `${percentage}% Cashback`}
            </h4>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? `Получите ${showAmount && cashbackAmount > 0 ? cashbackAmount.toLocaleString() + ' ₽' : `до ${percentage}%`} обратно на кошелёк`
                : `Get ${showAmount && cashbackAmount > 0 ? cashbackAmount.toLocaleString() + ' ₽' : `up to ${percentage}%`} back to wallet`}
            </p>
          </div>
          {showAmount && cashbackAmount > 0 && (
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-500">
                +{cashbackAmount.toLocaleString()} ₽
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Standalone info block about cashback rates
export function CashbackRatesCard({ className }: { className?: string }) {
  const { language } = useLanguage();
  const { settings, isLoading } = useCashback();

  if (isLoading || settings.length === 0) return null;

  const categoryLabels: Record<string, { en: string; ru: string }> = {
    default: { en: 'All services', ru: 'Все услуги' },
    beauty: { en: 'Beauty & Spa', ru: 'Красота и СПА' },
    food: { en: 'Food & Delivery', ru: 'Еда и доставка' },
    property: { en: 'Real Estate', ru: 'Недвижимость' },
    service: { en: 'Services', ru: 'Услуги' },
    transport: { en: 'Transport', ru: 'Транспорт' },
    fitness: { en: 'Fitness', ru: 'Фитнес' },
    medical: { en: 'Medical', ru: 'Медицина' },
    events: { en: 'Events', ru: 'Мероприятия' },
    education: { en: 'Education', ru: 'Образование' },
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 border border-emerald-500/10",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold">
          {language === 'ru' ? 'Ставки кэшбэка' : 'Cashback Rates'}
        </h3>
      </div>
      <div className="space-y-2">
        {settings.map((setting) => (
          <div key={setting.category} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {categoryLabels[setting.category]?.[language] || setting.category}
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {setting.percentage}%
              {setting.min_order_amount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({language === 'ru' ? 'от' : 'from'} {setting.min_order_amount}₽)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
