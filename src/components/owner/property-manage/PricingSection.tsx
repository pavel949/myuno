import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent, Users, Shield, Clock, Zap } from 'lucide-react';

interface PricingSectionProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

const DEPOSIT_TYPES = [
  { value: 'fixed', labelEn: 'Fixed amount', labelRu: 'Фиксированная сумма' },
  { value: 'per_night', labelEn: 'Per night', labelRu: 'За ночь' },
  { value: 'percentage', labelEn: '% of total', labelRu: '% от суммы' },
];

export function PropertyManagePricingSection({ formData, updateFormData }: PricingSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {isRu ? 'Цены и депозит' : 'Pricing & Deposit'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu 
            ? 'Настройте тарифы, скидки и условия оплаты' 
            : 'Set rates, discounts and payment terms'}
        </p>
      </div>

      {/* Base Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'Базовые тарифы' : 'Base Rates'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Цена за ночь' : 'Price per night'} *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.price_per_night || ''}
                  onChange={(e) => updateFormData({ price_per_night: e.target.value })}
                  placeholder="2500"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
              <Select
                value={formData.deposit_currency || 'THB'}
                onValueChange={(value) => updateFormData({ deposit_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB (฿)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="RUB">RUB (₽)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            {isRu ? 'Скидки за длительное проживание' : 'Length of Stay Discounts'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Недельная скидка (%)' : 'Weekly discount (%)'}</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={formData.weekly_discount || ''}
                onChange={(e) => updateFormData({ weekly_discount: e.target.value })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                {isRu ? 'При бронировании от 7 ночей' : 'For stays of 7+ nights'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Месячная скидка (%)' : 'Monthly discount (%)'}</Label>
              <Input
                type="number"
                min={0}
                max={70}
                value={formData.monthly_discount || ''}
                onChange={(e) => updateFormData({ monthly_discount: e.target.value })}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground">
                {isRu ? 'При бронировании от 28 ночей' : 'For stays of 28+ nights'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {isRu ? 'Депозит' : 'Security Deposit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Сумма депозита' : 'Deposit amount'}</Label>
              <Input
                type="number"
                value={formData.deposit_amount || ''}
                onChange={(e) => updateFormData({ deposit_amount: e.target.value })}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Тип расчёта' : 'Calculation type'}</Label>
              <Select
                value={formData.deposit_type || 'fixed'}
                onValueChange={(value) => updateFormData({ deposit_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {isRu ? type.labelRu : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guests & Stay */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Гости и проживание' : 'Guests & Stay'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Макс. гостей' : 'Max guests'}</Label>
              <Select
                value={String(formData.max_guests || 2)}
                onValueChange={(value) => updateFormData({ max_guests: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Мин. ночей' : 'Min nights'}</Label>
              <Select
                value={String(formData.min_stay_nights || 1)}
                onValueChange={(value) => updateFormData({ min_stay_nights: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7, 14, 30].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-none border bg-muted/30">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Гости могут бронировать без одобрения' : 'Guests can book without approval'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.instant_booking || false}
              onCheckedChange={(checked) => updateFormData({ instant_booking: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Check-in/out */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isRu ? 'Заезд и выезд' : 'Check-in & Check-out'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Время заезда' : 'Check-in time'}</Label>
              <Select
                value={formData.check_in_time || '14:00'}
                onValueChange={(value) => updateFormData({ check_in_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Время выезда' : 'Check-out time'}</Label>
              <Select
                value={formData.check_out_time || '12:00'}
                onValueChange={(value) => updateFormData({ check_out_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Ранний заезд (доплата)' : 'Early check-in (fee)'}</Label>
              <Input
                type="number"
                value={formData.early_checkin_price || ''}
                onChange={(e) => updateFormData({ early_checkin_price: e.target.value })}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Поздний выезд (доплата)' : 'Late check-out (fee)'}</Label>
              <Input
                type="number"
                value={formData.late_checkout_price || ''}
                onChange={(e) => updateFormData({ late_checkout_price: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
