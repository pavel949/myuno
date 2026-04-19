import React from 'react';
import { Calculator, Percent, Calendar, Users, Sun, Snowflake, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { getCurrencySymbol } from '@/lib/config/currencies';
import { pluralizeNights } from '@/lib/i18n/pluralize';

interface SeasonalPriceEntry {
  id: string;
  name: string;
  nameRu?: string;
  type: 'high' | 'low' | 'holiday' | 'custom';
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priceModifier: number;
  pricePerNight?: number;
  minNights?: number;
}

interface PropertyPriceBreakdownProps {
  pricePerNight?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  depositAmount?: number;
  depositType?: string;
  depositCurrency?: string;
  extraGuestPrice?: number;
  extraGuestThreshold?: number;
  minStayNights?: number;
  seasonalPricing?: SeasonalPriceEntry[];
  currency?: string;
  className?: string;
}

export function PropertyPriceBreakdown({
  pricePerNight,
  weeklyDiscount,
  monthlyDiscount,
  depositAmount,
  depositType,
  depositCurrency,
  extraGuestPrice,
  extraGuestThreshold,
  minStayNights,
  seasonalPricing,
  currency = 'THB',
  className,
}: PropertyPriceBreakdownProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const symbol = getCurrencySymbol(currency);

  const depositTypeLabels: Record<string, { en: string; ru: string }> = {
    fixed: { en: 'Fixed amount', ru: 'Фиксированная сумма' },
    per_night: { en: 'Per night', ru: 'За ночь' },
    percentage: { en: 'Percentage', ru: 'Процент' },
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        {isRu ? 'Стоимость' : 'Pricing'}
      </h3>
      
      <div className="space-y-3">
        {/* Base price */}
        {pricePerNight && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRu ? 'Базовая цена' : 'Base Price'}</p>
                <p className="text-3xl font-bold text-primary">
                  {symbol}{pricePerNight.toLocaleString()}
                  <span className="text-base font-normal text-muted-foreground">
                    /{isRu ? 'ночь' : 'night'}
                  </span>
                </p>
              </div>
              {minStayNights && minStayNights > 1 && (
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {isRu ? 'Мин.' : 'Min'} {minStayNights} {pluralizeNights(minStayNights, language)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Discounts */}
        {(weeklyDiscount || monthlyDiscount) && (
          <div className="grid grid-cols-2 gap-2">
            {weeklyDiscount && weeklyDiscount > 0 && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">{isRu ? '7+ ночей' : '7+ nights'}</span>
                </div>
                <p className="text-lg font-bold text-success">-{weeklyDiscount}%</p>
              </div>
            )}
            {monthlyDiscount && monthlyDiscount > 0 && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">{isRu ? '30+ ночей' : '30+ nights'}</span>
                </div>
                <p className="text-lg font-bold text-success">-{monthlyDiscount}%</p>
              </div>
            )}
          </div>
        )}

        {/* Seasonal Pricing */}
        {seasonalPricing && seasonalPricing.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              {isRu ? 'Сезонные цены' : 'Seasonal Rates'}
            </p>
            <div className="grid gap-2">
              {seasonalPricing.map((season) => {
                // Use absolute price if set, otherwise calculate from modifier
                const seasonPrice = season.pricePerNight && season.pricePerNight > 0
                  ? season.pricePerNight
                  : (pricePerNight ? Math.round(pricePerNight * season.priceModifier / 100) : 0);
                const isHigher = seasonPrice > (pricePerNight || 0);
                const isLower = seasonPrice < (pricePerNight || 0);
                const SeasonIcon = season.type === 'high' ? Sun : season.type === 'low' ? Snowflake : season.type === 'holiday' ? Sparkles : Calendar;
                
                const monthNames = isRu 
                  ? ['', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
                  : ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dateRange = `${season.startDay} ${monthNames[season.startMonth]} – ${season.endDay} ${monthNames[season.endMonth]}`;
                const diffPercent = pricePerNight ? Math.round(((seasonPrice / pricePerNight) - 1) * 100) : 0;
                
                return (
                  <div 
                    key={season.id} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      isHigher ? 'bg-warning/5 border-warning/20' : isLower ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SeasonIcon className={`w-4 h-4 flex-shrink-0 ${
                        isHigher ? 'text-warning' : isLower ? 'text-success' : 'text-muted-foreground'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{isRu ? (season.nameRu || season.name) : season.name}</p>
                        <p className="text-xs text-muted-foreground">{dateRange}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-sm font-bold ${isHigher ? 'text-warning' : isLower ? 'text-success' : ''}`}>
                        {symbol}{seasonPrice.toLocaleString()}
                      </p>
                      {diffPercent !== 0 && (
                        <p className={`text-xs ${isHigher ? 'text-warning' : isLower ? 'text-success' : 'text-muted-foreground'}`}>
                          {diffPercent > 0 ? '+' : ''}{diffPercent}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {extraGuestPrice && extraGuestPrice > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {isRu 
                  ? `Более ${extraGuestThreshold || 2} гостей` 
                  : `More than ${extraGuestThreshold || 2} guests`}
              </span>
            </div>
            <span className="text-sm font-medium">
              +{symbol}{extraGuestPrice}/{isRu ? 'чел' : 'person'}
            </span>
          </div>
        )}

        {/* Deposit */}
        {depositAmount && depositAmount > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isRu ? 'Залог' : 'Security Deposit'}</p>
                <p className="text-xs text-muted-foreground">
                  {depositType && depositTypeLabels[depositType] 
                    ? (isRu ? depositTypeLabels[depositType].ru : depositTypeLabels[depositType].en)
                    : (isRu ? 'Возвратный' : 'Refundable')}
                </p>
              </div>
              <p className="text-lg font-bold">
                {getCurrencySymbol(depositCurrency || 'THB')}
                {depositAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
