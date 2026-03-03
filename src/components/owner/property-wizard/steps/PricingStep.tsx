import { memo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, Clock, Users, Landmark, Building2, Briefcase, BadgeDollarSign, FileText, Sparkles, Building, Rocket, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { toast } from 'sonner';
import { HouseRulesSection } from './HouseRulesSection';
import { DiscountsSection } from './DiscountsSection';
import { CancellationPolicySection } from './CancellationPolicySection';
import { SeasonalPricing } from '@/components/property/SeasonalPricing';
import { PricingRulesSection } from '@/components/property/PricingRulesSection';
import { PaymentPolicySection } from '@/components/property/PaymentPolicySection';
import { cn } from '@/lib/utils';

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

/** Reusable collapsible section wrapper */
function CollapsibleSection({
  icon,
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              <span className="flex-1">{title}</span>
              {badge && (
                <Badge variant="secondary" className="text-xs font-normal">{badge}</Badge>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function PricingStepInner({ formData, updateFormData, selectedProject }: PricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleUseProjectDescription = () => {
    updateFormData({
      description: selectedProject?.description_en || '',
      description_ru: selectedProject?.description_ru || '',
    });
    toast.success(isRu ? 'Описание проекта загружено' : 'Project description loaded');
  };

  const projectAmenities = selectedProject?.amenities || [];
  const hasProjectDescription = selectedProject?.description_en || selectedProject?.description_ru;
  const isDescriptionEmpty = !formData.description && !formData.description_ru;
  const basePrice = Number(formData.price_per_night) || 0;
  const seasonCount = formData.seasonal_pricing?.length || 0;

  return (
    <div className="space-y-3">
      {/* ─── Ownership — always open ─── */}
      <CollapsibleSection
        icon={<Landmark className="h-4 w-4" />}
        title={isRu ? 'Форма собственности' : 'Ownership Structure'}
        defaultOpen
        badge={formData.ownership_form ? (ownershipOptions.find(o => o.value === formData.ownership_form)?.[isRu ? 'labelRu' : 'labelEn']) : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      </CollapsibleSection>

      {/* ─── Rental Terms — always open ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Условия аренды' : 'Rental Terms'}
        defaultOpen
        badge={basePrice > 0 ? `${basePrice.toLocaleString()} THB` : undefined}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRu ? 'Мин. ночей' : 'Min nights'}
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
        </div>
      </CollapsibleSection>

      {/* ─── Seasonal Pricing — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Сезонные цены' : 'Seasonal Pricing'}
        badge={seasonCount > 0 ? `${seasonCount}` : undefined}
      >
        <SeasonalPricing
          basePrice={basePrice > 0 ? basePrice : 0}
          currency="THB"
          seasons={formData.seasonal_pricing || []}
          onChange={(seasons) => updateFormData({ seasonal_pricing: seasons })}
        />
      </CollapsibleSection>

      {/* ─── Discounts — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Скидки за длительность' : 'Length Discounts'}
        badge={
          (formData.weekly_discount || formData.monthly_discount)
            ? (isRu ? 'Настроено' : 'Set')
            : undefined
        }
      >
        <DiscountsSection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── Advanced Pricing Rules — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Продвинутые правила' : 'Advanced Pricing Rules'}
      >
        <PricingRulesSection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── Payment & Deposit — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Оплата и депозит' : 'Payment & Deposit'}
        badge={formData.deposit_amount ? `${Number(formData.deposit_amount).toLocaleString()} ${formData.deposit_currency || 'THB'}` : undefined}
      >
        <PaymentPolicySection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── Cancellation — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Политика отмены' : 'Cancellation Policy'}
      >
        <CancellationPolicySection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── House Rules — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Правила дома' : 'House Rules'}
      >
        <HouseRulesSection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── Platform Listing — collapsed ─── */}
      <CollapsibleSection
        icon={<Rocket className="h-4 w-4" />}
        title={isRu ? 'Размещение на платформе' : 'Platform Listing'}
        badge={formData.platform_listed ? (isRu ? 'Вкл' : 'On') : undefined}
      >
        <div className={`p-4 rounded-lg border-2 transition-colors ${
          formData.platform_listed 
            ? 'border-primary/40 bg-primary/5' 
            : 'border-muted bg-muted'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                {isRu ? 'Разместить на myUNO для гостей' : 'List on myUNO for guests'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu 
                  ? 'Комиссия платформы 10% с каждого успешного бронирования' 
                  : '10% platform fee per successful booking'}
              </p>
            </div>
            <Switch
              checked={formData.platform_listed ?? true}
              onCheckedChange={(checked) => updateFormData({ platform_listed: checked })}
            />
          </div>
          {formData.platform_listed && basePrice > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
              {isRu ? 'Пример: ' : 'Example: '}
              {basePrice.toLocaleString()} THB/{isRu ? 'ночь' : 'night'} → 
              {' '}{isRu ? 'комиссия' : 'fee'} {Math.round(basePrice * 0.1).toLocaleString()} THB
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ─── Sale Option — collapsed ─── */}
      <CollapsibleSection
        icon={<BadgeDollarSign className="h-4 w-4" />}
        title={isRu ? 'Продажа объекта' : 'Property Sale'}
        badge={formData.is_for_sale ? (isRu ? 'Да' : 'Yes') : undefined}
      >
        <div className="space-y-4">
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
        </div>
      </CollapsibleSection>

      {/* ─── Description — collapsed ─── */}
      <CollapsibleSection
        icon={<FileText className="h-4 w-4" />}
        title={isRu ? 'Описание объекта' : 'Property Description'}
        badge={formData.description ? '✓' : undefined}
      >
        <div className="space-y-4">
          {hasProjectDescription && isDescriptionEmpty && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">
                {isRu ? 'Использовать описание проекта?' : 'Use project description?'}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleUseProjectDescription}>
                <Building className="h-4 w-4 mr-1" />
                {isRu ? 'Да' : 'Yes'}
              </Button>
            </div>
          )}

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
                  <Badge variant="outline" className="text-xs">+{projectAmenities.length - 5}</Badge>
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
        </div>
      </CollapsibleSection>
    </div>
  );
}

export const PricingStep = memo(PricingStepInner);
