import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Clock, Users, Landmark, Building2, Briefcase, BadgeDollarSign } from 'lucide-react';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface PricingStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function PricingStep({ formData, updateFormData }: PricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const ownershipOptions = [
    { value: 'freehold', labelEn: 'Freehold (Chanote)', labelRu: 'Фрихолд (Чанот)', icon: <Landmark className="h-4 w-4" />, desc: isRu ? 'Полная собственность' : 'Full ownership' },
    { value: 'leasehold', labelEn: 'Leasehold', labelRu: 'Лизхолд', icon: <Clock className="h-4 w-4" />, desc: isRu ? 'Аренда земли' : 'Land lease' },
    { value: 'company', labelEn: 'Thai Company', labelRu: 'Тайская компания', icon: <Building2 className="h-4 w-4" />, desc: isRu ? 'Владение через ООО' : 'LLC ownership' },
    { value: 'foreign_company', labelEn: 'Foreign Company', labelRu: 'Иностранная компания', icon: <Briefcase className="h-4 w-4" />, desc: isRu ? 'Офшор / иностранное ООО' : 'Offshore / foreign LLC' },
  ];

  return (
    <div className="space-y-6">
      {/* Ownership Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            {isRu ? 'Форма собственности' : 'Ownership Structure'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Укажите юридическую форму владения недвижимостью' 
              : 'Specify the legal ownership structure of the property'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ownershipOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFormData({ ownership_form: option.value as PropertyFormData['ownership_form'] })}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  formData.ownership_form === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground">{option.icon}</span>
                  <span className="font-medium text-sm">{isRu ? option.labelRu : option.labelEn}</span>
                </div>
                <p className="text-xs text-muted-foreground">{option.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rental Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {isRu ? 'Условия аренды' : 'Rental Terms'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Цена за ночь (THB)' : 'Price per night (THB)'}</Label>
              <Input
                type="number"
                min={0}
                value={formData.price_per_night}
                onChange={(e) => updateFormData({ price_per_night: e.target.value })}
                placeholder="2500"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Депозит (THB)' : 'Deposit (THB)'}</Label>
              <Input
                type="number"
                min={0}
                value={formData.deposit_amount}
                onChange={(e) => updateFormData({ deposit_amount: e.target.value })}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isRu ? 'Мин. срок (ночей)' : 'Min stay (nights)'}
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.min_stay_nights}
                onChange={(e) => updateFormData({ min_stay_nights: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {isRu ? 'Макс. гостей' : 'Max guests'}
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.max_guests}
                onChange={(e) => updateFormData({ max_guests: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Заезд' : 'Check-in'}</Label>
              <Input
                type="time"
                value={formData.check_in_time}
                onChange={(e) => updateFormData({ check_in_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Выезд' : 'Check-out'}</Label>
              <Input
                type="time"
                value={formData.check_out_time}
                onChange={(e) => updateFormData({ check_out_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{isRu ? 'Мгновенное бронирование' : 'Instant Booking'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Гости могут бронировать без подтверждения' : 'Guests can book without approval'}
              </p>
            </div>
            <Switch
              checked={formData.instant_booking}
              onCheckedChange={(checked) => updateFormData({ instant_booking: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sale Option */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4" />
            {isRu ? 'Продажа объекта' : 'Property Sale'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{isRu ? 'Открыт к продаже' : 'Open to Sale'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Показать в разделе "Продажа"' : 'List in "For Sale" section'}
              </p>
            </div>
            <Switch
              checked={formData.is_for_sale}
              onCheckedChange={(checked) => updateFormData({ is_for_sale: checked })}
            />
          </div>

          {formData.is_for_sale && (
            <>
              <div className="space-y-2">
                <Label>{isRu ? 'Цена продажи (THB)' : 'Sale Price (THB)'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sale_price}
                  onChange={(e) => updateFormData({ sale_price: e.target.value })}
                  placeholder="5000000"
                  className="text-lg"
                />
                {formData.sale_price && Number(formData.sale_price) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    ≈ ${(Number(formData.sale_price) / 35).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
                  </p>
                )}
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  🏷️ {isRu ? 'Комиссия платформы: 5%' : 'Platform Commission: 5%'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
