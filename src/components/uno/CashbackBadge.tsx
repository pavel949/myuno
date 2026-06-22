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
        "inline-flex items-center gap-1 text-xs font-medium text-success",
        className
      )}>
        <TrendingUp className="w-3 h-3" />
        {showAmount && cashbackAmount > 0 ? (
          <span>+{cashbackAmount.toLocaleString()} ₽</span>
        ) : (
          <span>{percentage}% {language === 'ru' ? 'кэшбэк' : language === 'th' ? 'เงินคืน' : 'cashback'}</span>
        )}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-none bg-success/10 border border-success/20",
        className
      )}>
        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
          <Percent className="w-4 h-4 text-success" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-success">
            {language === 'ru' ? `Кэшбэк ${percentage}%` : language === 'th' ? `เงินคืน ${percentage}%` : `${percentage}% Cashback`}
          </div>
          {showAmount && cashbackAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Вернём на кошелёк' : language === 'th' ? 'คืนเข้ากระเป๋าเงิน' : 'Back to wallet'}: +{cashbackAmount.toLocaleString()} ₽
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "relative overflow-hidden p-4 rounded-none bg-gradient-to-r from-success/10 via-success/10 to-accent-teal/10 border border-success/20",
        className
      )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-success">
              {language === 'ru' ? `Кэшбэк ${percentage}%` : language === 'th' ? `เงินคืน ${percentage}%` : `${percentage}% Cashback`}
            </h4>
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? `Получите ${showAmount && cashbackAmount > 0 ? cashbackAmount.toLocaleString() + ' ₽' : `до ${percentage}%`} обратно на кошелёк`
                : language === 'th'
                ? `รับ ${showAmount && cashbackAmount > 0 ? cashbackAmount.toLocaleString() + ' ₽' : `สูงสุด ${percentage}%`} คืนเข้ากระเป๋าเงิน`
                : `Get ${showAmount && cashbackAmount > 0 ? cashbackAmount.toLocaleString() + ' ₽' : `up to ${percentage}%`} back to wallet`}
            </p>
          </div>
          {showAmount && cashbackAmount > 0 && (
            <div className="text-right">
              <div className="text-xl font-bold text-success">
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

  const categoryLabels: Record<string, { en: string; ru: string; th: string }> = {
    default: { en: 'All services', ru: 'Все услуги', th: 'บริการทั้งหมด' },
    beauty: { en: 'Beauty & Spa', ru: 'Красота и СПА', th: 'ความงามและสปา' },
    food: { en: 'Food & Delivery', ru: 'Еда и доставка', th: 'อาหารและเดลิเวอรี' },
    property: { en: 'Real Estate', ru: 'Недвижимость', th: 'อสังหาริมทรัพย์' },
    service: { en: 'Services', ru: 'Услуги', th: 'บริการ' },
    transport: { en: 'Transport', ru: 'Транспорт', th: 'การเดินทาง' },
    fitness: { en: 'Fitness', ru: 'Фитнес', th: 'ฟิตเนส' },
    medical: { en: 'Medical', ru: 'Медицина', th: 'การแพทย์' },
    events: { en: 'Events', ru: 'Мероприятия', th: 'อีเวนต์' },
    education: { en: 'Education', ru: 'Образование', th: 'การศึกษา' },
  };

  return (
    <div className={cn(
      "p-4 rounded-none bg-gradient-to-r from-success/5 via-success/5 to-accent-teal/5 border border-success/10",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-success" />
        <h3 className="font-semibold">
          {language === 'ru' ? 'Ставки кэшбэка' : language === 'th' ? 'อัตราเงินคืน' : 'Cashback Rates'}
        </h3>
      </div>
      <div className="space-y-2">
        {settings.map((setting) => (
          <div key={setting.category} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {categoryLabels[setting.category]?.[language] || setting.category}
            </span>
            <span className="font-medium text-success">
              {setting.percentage}%
              {setting.min_order_amount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({language === 'ru' ? 'от' : language === 'th' ? 'ตั้งแต่' : 'from'} {setting.min_order_amount}₽)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
