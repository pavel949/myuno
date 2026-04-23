import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Zap, Plus, Trash2, TrendingDown } from 'lucide-react';

interface CustomLengthDiscount {
  min_nights: number;
  discount_percent: number;
}

interface PricingRulesData {
  early_booking_discount?: number;
  early_booking_days?: number;
  last_minute_discount?: number;
  last_minute_days?: number;
  custom_length_discounts?: CustomLengthDiscount[];
  negotiation_enabled?: boolean;
  price_per_night?: string;
}

interface PricingRulesSectionProps {
  formData: PricingRulesData;
  updateFormData: (updates: Partial<PricingRulesData>) => void;
}

function PricingRulesSectionInner({ formData, updateFormData }: PricingRulesSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const pricePerNight = Number(formData.price_per_night) || 0;

  const earlyEnabled = !!(formData.early_booking_discount && formData.early_booking_discount > 0);
  const lastMinuteEnabled = !!(formData.last_minute_discount && formData.last_minute_discount > 0);
  const customDiscounts = formData.custom_length_discounts || [];

  const addCustomDiscount = () => {
    const existing = [...customDiscounts];
    existing.push({ min_nights: 14, discount_percent: 10 });
    updateFormData({ custom_length_discounts: existing });
  };

  const removeCustomDiscount = (idx: number) => {
    const updated = customDiscounts.filter((_, i) => i !== idx);
    updateFormData({ custom_length_discounts: updated.length ? updated : undefined });
  };

  const updateCustomDiscount = (idx: number, field: keyof CustomLengthDiscount, val: number) => {
    const updated = [...customDiscounts];
    updated[idx] = { ...updated[idx], [field]: val };
    updateFormData({ custom_length_discounts: updated });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          {isRu ? 'Правила ценообразования' : 'Pricing Rules'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Early Booking Discount */}
        <div className="p-4 rounded-none border bg-gradient-to-r from-primary/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Раннее бронирование' : 'Early Booking'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Скидка за бронирование заранее' : 'Discount for booking ahead'}
                </p>
              </div>
            </div>
            <Switch
              checked={earlyEnabled}
              onCheckedChange={(checked) => {
                if (!checked) {
                  updateFormData({ early_booking_discount: undefined, early_booking_days: undefined });
                } else {
                  updateFormData({ early_booking_discount: 10, early_booking_days: 30 });
                }
              }}
            />
          </div>

          {earlyEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-11">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Дней заранее' : 'Days ahead'}</Label>
                <Select
                  value={String(formData.early_booking_days || 30)}
                  onValueChange={(v) => updateFormData({ early_booking_days: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14+</SelectItem>
                    <SelectItem value="30">30+</SelectItem>
                    <SelectItem value="60">60+</SelectItem>
                    <SelectItem value="90">90+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Скидка %' : 'Discount %'}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.early_booking_discount || ''}
                    onChange={(e) => updateFormData({ early_booking_discount: Number(e.target.value) || undefined })}
                    className="h-9 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
              {pricePerNight > 0 && formData.early_booking_discount && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  {isRu ? 'Пример: ' : 'Example: '}
                  {isRu
                    ? `Бронирование за ${formData.early_booking_days}+ дней = ฿${Math.round(pricePerNight * (1 - (formData.early_booking_discount || 0) / 100)).toLocaleString()}/ночь`
                    : `Book ${formData.early_booking_days}+ days ahead = ฿${Math.round(pricePerNight * (1 - (formData.early_booking_discount || 0) / 100)).toLocaleString()}/night`
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* Last-Minute Discount */}
        <div className="p-4 rounded-none border bg-gradient-to-r from-warning/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-none bg-warning/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="font-medium text-sm">{isRu ? 'Горящее предложение' : 'Last-Minute Deal'}</p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Скидка при бронировании за 1-7 дней' : 'Discount for booking within 1-7 days'}
                </p>
              </div>
            </div>
            <Switch
              checked={lastMinuteEnabled}
              onCheckedChange={(checked) => {
                if (!checked) {
                  updateFormData({ last_minute_discount: undefined, last_minute_days: undefined });
                } else {
                  updateFormData({ last_minute_discount: 10, last_minute_days: 3 });
                }
              }}
            />
          </div>

          {lastMinuteEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-11">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'В пределах дней' : 'Within days'}</Label>
                <Select
                  value={String(formData.last_minute_days || 3)}
                  onValueChange={(v) => updateFormData({ last_minute_days: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'Скидка %' : 'Discount %'}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.last_minute_discount || ''}
                    onChange={(e) => updateFormData({ last_minute_discount: Number(e.target.value) || undefined })}
                    className="h-9 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Length-of-Stay Discounts */}
        <div className="p-4 rounded-none border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{isRu ? 'Свои скидки за срок' : 'Custom Stay Discounts'}</p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Дополнительные пороги помимо недели/месяца' : 'Additional tiers beyond weekly/monthly'}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCustomDiscount}>
              <Plus className="h-3 w-3 mr-1" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </div>

          {customDiscounts.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{isRu ? 'Мин. ночей' : 'Min nights'}</Label>
                <Input
                  type="number"
                  min={2}
                  value={d.min_nights}
                  onChange={(e) => updateCustomDiscount(idx, 'min_nights', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{isRu ? 'Скидка %' : 'Discount %'}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={80}
                    value={d.discount_percent}
                    onChange={(e) => updateCustomDiscount(idx, 'discount_percent', Number(e.target.value))}
                    className="h-9 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 h-9 w-9 text-destructive"
                onClick={() => removeCustomDiscount(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Negotiation Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-none">
          <div>
            <p className="font-medium text-sm">{isRu ? 'Торг с гостем' : 'Price Negotiation'}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Гости смогут предлагать свою цену' : 'Guests can propose their own price'}
            </p>
          </div>
          <Switch
            checked={formData.negotiation_enabled ?? false}
            onCheckedChange={(checked) => updateFormData({ negotiation_enabled: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const PricingRulesSection = memo(PricingRulesSectionInner);
