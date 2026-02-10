import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Percent, Calendar, TrendingDown, Sparkles } from 'lucide-react';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface DiscountsSectionProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

function DiscountsSectionInner({ formData, updateFormData }: DiscountsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const weeklyDiscount = formData.weekly_discount || 0;
  const monthlyDiscount = formData.monthly_discount || 0;
  const pricePerNight = Number(formData.price_per_night) || 0;

  // Calculate discounted prices
  const weeklyPrice = pricePerNight * 7 * (1 - weeklyDiscount / 100);
  const monthlyPrice = pricePerNight * 30 * (1 - monthlyDiscount / 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="h-4 w-4" />
          {isRu ? 'Скидки за длительное проживание' : 'Long-stay Discounts'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Предложите скидки для гостей, бронирующих на неделю или месяц, чтобы привлечь долгосрочных арендаторов.' 
            : 'Offer discounts for guests booking weekly or monthly to attract long-term renters.'}
        </p>

        <div className="grid gap-4">
          {/* Weekly discount */}
          <div className="p-4 rounded-xl border bg-gradient-to-r from-blue-500/5 to-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{isRu ? 'Недельная скидка' : 'Weekly Discount'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? '7+ ночей' : '7+ nights'}
                  </p>
                </div>
              </div>
              {weeklyDiscount > 0 && (
                <Badge className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -{weeklyDiscount}%
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[150px]">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={weeklyDiscount || ''}
                  onChange={(e) => updateFormData({ weekly_discount: Number(e.target.value) || undefined })}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              
              {weeklyDiscount > 0 && pricePerNight > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">฿{(pricePerNight * 7).toLocaleString()}</span>
                  {' → '}
                  <span className="text-foreground font-medium">
                    ฿{Math.round(weeklyPrice).toLocaleString()}
                  </span>
                  <span className="text-xs ml-1">{isRu ? '/неделя' : '/week'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Monthly discount */}
          <div className="p-4 rounded-xl border bg-gradient-to-r from-green-500/5 to-transparent">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{isRu ? 'Месячная скидка' : 'Monthly Discount'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? '28+ ночей' : '28+ nights'}
                  </p>
                </div>
              </div>
              {monthlyDiscount > 0 && (
                <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -{monthlyDiscount}%
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[150px]">
                <Input
                  type="number"
                  min={0}
                  max={70}
                  value={monthlyDiscount || ''}
                  onChange={(e) => updateFormData({ monthly_discount: Number(e.target.value) || undefined })}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              
              {monthlyDiscount > 0 && pricePerNight > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">฿{(pricePerNight * 30).toLocaleString()}</span>
                  {' → '}
                  <span className="text-foreground font-medium">
                    ฿{Math.round(monthlyPrice).toLocaleString()}
                  </span>
                  <span className="text-xs ml-1">{isRu ? '/месяц' : '/month'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? 'Рекомендуем: 5-10% на неделю, 15-25% на месяц. Объекты со скидками бронируют на 40% чаще.' 
              : 'Recommended: 5-10% weekly, 15-25% monthly. Properties with discounts get 40% more bookings.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const DiscountsSection = memo(DiscountsSectionInner);
