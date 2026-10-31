import { pickLang } from '@/lib/i18n/pickLang';
import React, { memo, useState } from 'react';
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
import { toast } from 'sonner';
import { HouseRulesSection } from './HouseRulesSection';
import { DiscountsSection } from './DiscountsSection';
import { CancellationPolicySection } from './CancellationPolicySection';
import { SeasonalPricing } from '@/components/property/SeasonalPricing';
import { PricingRulesSection } from '@/components/property/PricingRulesSection';
import { PaymentPolicySection } from '@/components/property/PaymentPolicySection';
import { GuestExtraFeesSection } from '@/components/property/GuestExtraFeesSection';
import { cn } from '@/lib/utils';

interface PricingStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject?: PropertyProject | null;
  authoringOnly?: boolean;
  canEditPricing?: boolean;
  canEditBookingTerms?: boolean;
  hideCommercialFields?: boolean;
  rentalCurrency?: string;
  saleCurrency?: string;
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
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-none">
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

// Pricing template definitions
const PRICING_TEMPLATES = [
  {
    id: 'short_term',
    labelEn: 'Short-term',
    labelRu: 'Посуточно',
    descEn: 'Tourists, ≤30 nights',
    descRu: 'Туристы, ≤30 ночей',
    icon: <Rocket className="h-4 w-4" />,
    defaults: { min_stay_nights: 1, check_in_time: '14:00', check_out_time: '12:00' },
  },
  {
    id: 'long_term',
    labelEn: 'Long-term',
    labelRu: 'Долгосрочно',
    descEn: 'Expats, 30+ nights',
    descRu: 'Экспаты, 30+ ночей',
    icon: <Briefcase className="h-4 w-4" />,
    defaults: { min_stay_nights: 30, check_in_time: '12:00', check_out_time: '12:00' },
  },
  {
    id: 'sale',
    labelEn: 'For sale',
    labelRu: 'Продажа',
    descEn: 'Investment / resale',
    descRu: 'Инвестиция / перепродажа',
    icon: <BadgeDollarSign className="h-4 w-4" />,
    defaults: { min_stay_nights: 0, instant_booking: false },
  },
] as const;

function PricingStepInner({ formData, updateFormData, selectedProject, authoringOnly = false, canEditPricing = true, canEditBookingTerms = true, hideCommercialFields = false, rentalCurrency = 'THB', saleCurrency = '' }: PricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const currencyLabel = rentalCurrency || (isRu ? 'валюта не задана' : 'currency not set');
  const [pricingMode, setPricingMode] = useState<'short_term' | 'long_term' | 'sale' | null>(null);

  const handleUseProjectDescription = () => {
    updateFormData({
      description: selectedProject?.description_en || '',
      description_ru: selectedProject?.description_ru || '',
    });
    toast.success(isRu ? 'Описание проекта загружено' : 'Project description loaded');
  };

  const handleSelectTemplate = (templateId: typeof PRICING_TEMPLATES[number]['id']) => {
    const template = PRICING_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    setPricingMode(templateId);
    updateFormData(template.defaults as Partial<PropertyFormData>);
    toast.success(isRu ? 'Шаблон применён' : 'Template applied');
  };

  const projectAmenities = selectedProject?.amenities || [];
  const hasProjectDescription = selectedProject?.description_en || selectedProject?.description_ru;
  const isDescriptionEmpty = !formData.description && !formData.description_ru;
  const basePrice = Number(formData.price_per_night) || 0;
  const seasonCount = formData.seasonal_pricing?.length || 0;

  // Live income preview (short-term, 70% occupancy)
  const occupancyRate = 0.7;
  const daysInMonth = 30;
  const estimatedMonthly = pricingMode !== 'sale' && basePrice > 0
    ? Math.round(basePrice * daysInMonth * occupancyRate)
    : 0;

  return (
    <div className="space-y-3">
      {authoringOnly && (!canEditPricing || !canEditBookingTerms) && <p className="text-sm text-muted-foreground" role="status">{pickLang(language, { en: 'Prices and booking settings need separate permissions. Disabled values remain unchanged; you can still save listing details.', ru: 'Тарифы и настройки бронирования требуют отдельных прав. Недоступные значения не меняются; данные объявления можно сохранить.', th: 'ราคาและการตั้งค่าการจองต้องมีสิทธิ์แยกต่างหาก ค่าที่ปิดไว้จะไม่เปลี่ยน คุณยังบันทึกรายละเอียดประกาศได้' })}</p>}
      <fieldset disabled={!canEditBookingTerms} className="min-w-0">
      {/* ─── Pricing Templates — always first ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {isRu ? 'Шаблон ценообразования' : 'Pricing Template'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            {isRu ? 'Быстрое заполнение условий по типу сдачи' : 'Quickly pre-fill terms based on rental type'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PRICING_TEMPLATES.map((tpl) => {
              const isActive = pricingMode === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-none border-2 text-center transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-none flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {tpl.icon}
                  </div>
                  <p className="text-xs font-medium leading-tight">{isRu ? tpl.labelRu : tpl.labelEn}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{isRu ? tpl.descRu : tpl.descEn}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </fieldset>

      {!authoringOnly && <>
      {/* ─── Ownership structure (legal form for reporting) — distinct from "Management rights" on step 1 ─── */}
      <CollapsibleSection
        icon={<Landmark className="h-4 w-4" />}
        title={isRu ? 'Форма собственности' : 'Ownership Structure'}
        defaultOpen
        badge={formData.ownership_form ? (ownershipOptions.find(o => o.value === formData.ownership_form)?.[isRu ? 'labelRu' : 'labelEn']) : undefined}
      >
        <p className="text-xs text-muted-foreground mb-3">
          {isRu ? 'Юридическая форма владения для отчётности и аналитики' : 'Legal ownership form for reporting and analytics'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ownershipOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFormData({ ownership_form: option.value as PropertyFormData['ownership_form'] })}
              className={`p-3 rounded-none border-2 text-left transition-colors ${
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

      </>}
      {/* ─── Rental Terms — always open ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Условия аренды' : 'Rental Terms'}
        defaultOpen
        badge={basePrice > 0 ? `${basePrice.toLocaleString()} ${currencyLabel}` : undefined}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!hideCommercialFields && <>
            <div className="space-y-2">
              <Label>{isRu ? 'Цена за ночь' : 'Price per night'}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  disabled={!canEditPricing}
                  aria-label={pickLang(language, { en: 'Price per night', ru: 'Цена за ночь', th: 'ราคาต่อคืน' })}
                  value={formData.price_per_night}
                  onChange={(e) => updateFormData({ price_per_night: e.target.value })}
                  placeholder="2500"
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-medium">
                  {currencyLabel}
                </span>
              </div>
              {estimatedMonthly > 0 && (
                <p className="text-xs text-success flex items-center gap-1">
                  <BadgeDollarSign className="h-3 w-3" />
                  {isRu
                    ? `≈ ${estimatedMonthly.toLocaleString('ru')} ${currencyLabel}/мес при загрузке 70%`
                    : `≈ ${estimatedMonthly.toLocaleString()} ${currencyLabel}/mo at 70% occupancy`}
                </p>
              )}
            </div>
            </>}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRu ? 'Мин. ночей' : 'Min nights'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  disabled={!canEditBookingTerms}
                  aria-label={pickLang(language, { en: 'Minimum nights', ru: 'Минимум ночей', th: 'จำนวนคืนขั้นต่ำ' })}
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
                  disabled={!canEditBookingTerms}
                  aria-label={pickLang(language, { en: 'Maximum guests', ru: 'Максимум гостей', th: 'จำนวนผู้เข้าพักสูงสุด' })}
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
                disabled={!canEditBookingTerms}
                  aria-label={pickLang(language, { en: 'Check-in time', ru: 'Время заезда', th: 'เวลาเช็กอิน' })}
                  value={formData.check_in_time}
                onChange={(e) => updateFormData({ check_in_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Выезд' : 'Check-out'}</Label>
              <Input
                type="time"
                disabled={!canEditBookingTerms}
                  aria-label={pickLang(language, { en: 'Check-out time', ru: 'Время выезда', th: 'เวลาเช็กเอาต์' })}
                  value={formData.check_out_time}
                onChange={(e) => updateFormData({ check_out_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-none">
            <div>
              <p className="font-medium">{isRu ? 'Мгновенное бронирование' : 'Instant Booking'}</p>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Гости могут бронировать без подтверждения' : 'Guests can book without approval'}
              </p>
            </div>
            <Switch
              disabled={!canEditBookingTerms}
              aria-label={pickLang(language, { en: 'Instant booking', ru: 'Мгновенное бронирование', th: 'การจองทันที' })}
              checked={formData.instant_booking}
              onCheckedChange={(checked) => updateFormData({ instant_booking: checked })}
            />
          </div>
        </div>
      </CollapsibleSection>

      <fieldset disabled={!canEditPricing || !canEditBookingTerms} className="min-w-0">
      {/* ─── Seasonal Pricing — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Сезонные цены' : 'Seasonal Pricing'}
        badge={seasonCount > 0 ? `${seasonCount}` : undefined}
      >
        <SeasonalPricing
          basePrice={basePrice > 0 ? basePrice : 0}
          currency={rentalCurrency}
          seasons={formData.seasonal_pricing || []}
          onChange={(seasons) => updateFormData({ seasonal_pricing: seasons })}
        />
      </CollapsibleSection>

      </fieldset>

      <fieldset disabled={!canEditPricing} className="min-w-0">
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
        <DiscountsSection currencyLabel={currencyLabel + ' '} formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      </fieldset>

      <fieldset disabled={!canEditPricing} className="min-w-0">
      {/* ─── Advanced Pricing Rules — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Продвинутые правила' : 'Advanced Pricing Rules'}
      >
        <PricingRulesSection currencyLabel={currencyLabel + ' '} formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      </fieldset>

      <fieldset disabled={!canEditPricing} className="min-w-0">
      {/* ─── Payment & Deposit — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Оплата и депозит' : 'Payment & Deposit'}
        badge={formData.deposit_amount ? `${Number(formData.deposit_amount).toLocaleString()} ${formData.deposit_currency || (isRu ? 'валюта не задана' : 'currency not set')}` : undefined}
      >
        <PaymentPolicySection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      </fieldset>

      <fieldset disabled={!canEditPricing} className="min-w-0">
      {/* ─── Guest Extra Fees — metered utilities, cleaning, internet, etc. ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Доп. оплаты гостя' : 'Guest extra fees'}
        badge={
          Array.isArray(formData.guest_extra_fees) && formData.guest_extra_fees.length > 0
            ? `${formData.guest_extra_fees.length}`
            : undefined
        }
      >
        <GuestExtraFeesSection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      </fieldset>

      <fieldset disabled={!canEditBookingTerms} className="min-w-0">
      {/* ─── Cancellation — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Политика отмены' : 'Cancellation Policy'}
      >
        <CancellationPolicySection formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      </fieldset>

      {/* ─── House Rules — collapsed ─── */}
      <CollapsibleSection
        icon={<DollarSign className="h-4 w-4" />}
        title={isRu ? 'Правила дома' : 'House Rules'}
      >
        <HouseRulesSection canEditPricing={canEditPricing} formData={formData} updateFormData={updateFormData} />
      </CollapsibleSection>

      {/* ─── Platform Listing — collapsed ─── */}
      <CollapsibleSection
        icon={<Rocket className="h-4 w-4" />}
        title={authoringOnly ? pickLang(language, { en: 'Administrator review', ru: 'Проверка администратором', th: 'การตรวจสอบโดยผู้ดูแล' }) : (isRu ? 'Размещение на платформе' : 'Platform Listing')}
        badge={formData.platform_listed ? (isRu ? 'Вкл' : 'On') : undefined}
      >
        <div className={`p-4 rounded-none border-2 transition-colors ${
          formData.platform_listed 
            ? 'border-primary/40 bg-primary/5' 
            : 'border-muted bg-muted'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                {authoringOnly ? pickLang(language, { en: 'Submit for review after saving', ru: 'Отправить на проверку после сохранения', th: 'ส่งตรวจสอบหลังบันทึก' }) : (isRu ? 'Разместить на myUNO для гостей' : 'List on myUNO for guests')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {authoringOnly ? pickLang(language, { en: 'Saving does not publish the listing. An administrator reviews it before publication.', ru: 'Сохранение не публикует объявление. Перед публикацией его проверит администратор.', th: 'การบันทึกไม่ได้เผยแพร่ประกาศ ผู้ดูแลต้องตรวจสอบก่อนเผยแพร่' }) : (isRu ? 'Комиссия платформы 10% с каждого успешного бронирования' : '10% platform fee per successful booking')}
              </p>
            </div>
            <Switch
              aria-label={authoringOnly ? pickLang(language, { en: 'Submit for review after saving', ru: 'Отправить на проверку после сохранения', th: 'ส่งตรวจสอบหลังบันทึก' }) : (isRu ? 'Разместить на платформе' : 'Platform listing')}
              checked={formData.platform_listed ?? true}
              onCheckedChange={(checked) => updateFormData({ platform_listed: checked })}
            />
          </div>
          {!hideCommercialFields && !authoringOnly && formData.platform_listed && basePrice > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
              {isRu ? 'Пример: ' : 'Example: '}
              {basePrice.toLocaleString()} {currencyLabel}/{isRu ? 'ночь' : 'night'} →
              {' '}{isRu ? 'комиссия' : 'fee'} {Math.round(basePrice * 0.1).toLocaleString()} {currencyLabel}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {!hideCommercialFields && <>
      <fieldset disabled={!canEditPricing || !canEditBookingTerms} className="min-w-0">
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
              <Label>{isRu ? 'Цена продажи' : 'Sale Price'} ({saleCurrency || (isRu ? 'валюта не задана' : 'currency not set')})</Label>
              <Input
                type="number"
                min={0}
                value={formData.sale_price}
                onChange={(e) => updateFormData({ sale_price: e.target.value })}
                placeholder="5000000"
                className="text-lg"
              />

            </div>
          )}
        </div>
      </CollapsibleSection>

      </fieldset>
      </>}

      {/* ─── Description — edited on step 1 (Основное); here only summary + optional "Use project description" ─── */}
      <CollapsibleSection
        icon={<FileText className="h-4 w-4" />}
        title={isRu ? 'Описание объекта' : 'Property Description'}
        badge={formData.description || formData.description_ru ? '✓' : undefined}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Описание задаётся на шаге «Основное». Здесь можно подставить описание из проекта.'
              : 'Description is set on step «Basic Info». You can fill it from the project here.'}
          </p>
          {hasProjectDescription && isDescriptionEmpty && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-none">
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
            <div className="p-3 bg-muted/50 rounded-none space-y-2">
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

          <div className="p-4 bg-muted rounded-none flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {pickLang(language, { en: 'After submission, check the property list for the review status.', ru: 'После отправки статус проверки доступен в списке объектов.', th: 'หลังส่งตรวจสอบ ดูสถานะได้ในรายการอสังหาริมทรัพย์' })}
            </p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

export const PricingStep = memo(PricingStepInner);
