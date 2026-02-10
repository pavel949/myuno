import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, Users, Landmark, Building2, Briefcase, BadgeDollarSign, FileText, Sparkles, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { toast } from 'sonner';
import { HouseRulesSection } from './HouseRulesSection';
import { DiscountsSection } from './DiscountsSection';
import { CancellationPolicySection } from './CancellationPolicySection';

interface PricingStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject?: PropertyProject | null;
}

// Amenity labels for display
const amenityLabels: Record<string, { en: string; ru: string }> = {
  pool: { en: 'Pool', ru: 'Бассейн' },
  gym: { en: 'Gym', ru: 'Спортзал' },
  security: { en: '24h Security', ru: 'Охрана 24ч' },
  parking: { en: 'Parking', ru: 'Парковка' },
  garden: { en: 'Garden', ru: 'Сад' },
  spa: { en: 'Spa', ru: 'Спа' },
  beach_access: { en: 'Beach Access', ru: 'Доступ к пляжу' },
};

const ownershipOptions = [
  { value: 'freehold', labelEn: 'Freehold', labelRu: 'Фрихолд', icon: <Landmark className="h-4 w-4" /> },
  { value: 'leasehold', labelEn: 'Leasehold', labelRu: 'Лизхолд', icon: <Clock className="h-4 w-4" /> },
  { value: 'company', labelEn: 'Thai Company', labelRu: 'Тайская компания', icon: <Building2 className="h-4 w-4" /> },
  { value: 'foreign_company', labelEn: 'Foreign LLC', labelRu: 'Иностранная компания', icon: <Briefcase className="h-4 w-4" /> },
];

function PricingStepInner({ formData, updateFormData, selectedProject }: PricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleUseProjectDescription = () => {
    updateFormData({
      description: selectedProject?.description_en || '',
      description_ru: selectedProject?.description_ru || '',
    });
    toast.success(
      isRu 
        ? 'Описание проекта загружено' 
        : 'Project description loaded'
    );
  };

  const projectAmenities = selectedProject?.amenities || [];
  const hasProjectDescription = selectedProject?.description_en || selectedProject?.description_ru;
  const isDescriptionEmpty = !formData.description && !formData.description_ru;

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
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
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
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{option.icon}</span>
                  <span className="font-medium text-sm">{isRu ? option.labelRu : option.labelEn}</span>
                </div>
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

      {/* House Rules */}
      <HouseRulesSection formData={formData} updateFormData={updateFormData} />

      {/* Cancellation Policy */}
      <CancellationPolicySection formData={formData} updateFormData={updateFormData} />

      {/* Long-stay Discounts */}
      <DiscountsSection formData={formData} updateFormData={updateFormData} />

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
          )}
        </CardContent>
      </Card>

      {/* Description (moved from separate step) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {isRu ? 'Описание объекта' : 'Property Description'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use Project Description Button */}
          {hasProjectDescription && isDescriptionEmpty && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">
                {isRu 
                  ? 'Использовать описание проекта?' 
                  : 'Use project description?'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseProjectDescription}
              >
                <Building className="h-4 w-4 mr-1" />
                {isRu ? 'Да' : 'Yes'}
              </Button>
            </div>
          )}

          {/* Project Amenities Reference */}
          {projectAmenities.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">
                {isRu ? 'Удобства проекта:' : 'Project amenities:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {projectAmenities.slice(0, 5).map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenityLabels[amenity]
                      ? (isRu ? amenityLabels[amenity].ru : amenityLabels[amenity].en)
                      : amenity}
                  </Badge>
                ))}
                {projectAmenities.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{projectAmenities.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <TranslatableInput
            label={isRu ? 'Описание' : 'Description'}
            value={isRu ? formData.description_ru : formData.description}
            translatedValue={isRu ? formData.description : formData.description_ru}
            onChange={(val) => updateFormData({ [isRu ? 'description_ru' : 'description']: val })}
            onTranslatedChange={(val) => updateFormData({ [isRu ? 'description' : 'description_ru']: val })}
            placeholder={isRu ? 'Опишите вашу недвижимость...' : 'Describe your property...'}
            translatedPlaceholder={isRu ? 'Describe your property...' : 'Опишите вашу недвижимость...'}
            multiline
            rows={3}
          />

          <div className="p-4 bg-muted rounded-lg flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'После добавления объект будет проверен модератором UNO за 24 часа.' 
                : "After adding, the property will be reviewed by UNO within 24 hours."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const PricingStep = memo(PricingStepInner);
