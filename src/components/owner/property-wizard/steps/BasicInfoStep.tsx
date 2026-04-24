import React, { memo, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Home, Bed, Bath, SquareStack, FileSignature, MessageCircle, Shield, Upload, UserPlus, X, Building2, Video, ChevronDown, Minus, Plus, Building, Briefcase, Landmark, Trees, TrendingUp, Ruler, ShieldCheck, Zap } from 'lucide-react';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { TranslatableTextarea } from '@/components/forms/TranslatableTextarea';
import { LocationProjectSearch } from '@/components/property/LocationProjectSearch';
import { UnitFields } from '@/components/property/UnitFields';
import { PropertyFormData, OwnershipData, OwnershipType, AssetClass } from '@/hooks/usePropertyWizard';
import { PropertyFeaturesSelector } from '../PropertyFeaturesSelector';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { getTypeAwareLabels } from '@/lib/propertyTypeConfig';
import { COMMERCIAL_TYPES, LAND_TYPES, TITLE_DEED_TYPES, HOTEL_LICENSE_TYPES, HOTEL_MANAGEMENT_STATUSES, formatLandSize, isHotelType } from '@/lib/real-estate/commercialTaxonomy';
import { Hotel, Star } from 'lucide-react';

const DISMISS_KEY = 'owner_contact_auto_create_hint_dismissed';

// --- Asset Class Picker ---
interface AssetClassOption {
  value: AssetClass;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: React.ElementType;
}

const ASSET_CLASS_OPTIONS: AssetClassOption[] = [
  { value: 'residential', labelEn: 'Residential', labelRu: 'Жилая', descEn: 'Villa, condo, apartment, house', descRu: 'Виллы, кондо, квартиры, дома', icon: Home },
  { value: 'commercial', labelEn: 'Commercial', labelRu: 'Коммерческая', descEn: 'Office, retail, warehouse, F&B', descRu: 'Офис, ритейл, склад, F&B', icon: Briefcase },
  { value: 'land', labelEn: 'Land plot', labelRu: 'Земельный участок', descEn: 'Land for residential / commercial use', descRu: 'Земля под жильё / коммерцию', icon: Trees },
];

// --- Property Type Visual Picker ---
interface PropertyTypeOption {
  value: string;
  labelEn: string;
  labelRu: string;
  icon: React.ElementType;
}
const RESIDENTIAL_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла', icon: Home },
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо', icon: Building2 },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира', icon: Building },
  { value: 'house', labelEn: 'House', labelRu: 'Дом', icon: Home },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус', icon: Building },
  { value: 'studio', labelEn: 'Studio', labelRu: 'Студия', icon: Building2 },
  { value: 'penthouse', labelEn: 'Penthouse', labelRu: 'Пентхаус', icon: Building2 },
];
const COMMERCIAL_TYPE_OPTIONS: PropertyTypeOption[] = COMMERCIAL_TYPES.map((t) => ({
  value: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
  icon: Briefcase,
}));
const LAND_TYPE_OPTIONS: PropertyTypeOption[] = LAND_TYPES.map((t) => ({
  value: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
  icon: Landmark,
}));

function getTypeOptionsForAssetClass(ac: AssetClass): PropertyTypeOption[] {
  if (ac === 'commercial') return COMMERCIAL_TYPE_OPTIONS;
  if (ac === 'land') return LAND_TYPE_OPTIONS;
  return RESIDENTIAL_TYPE_OPTIONS;
}

// --- Room Stepper ---
interface RoomStepperProps {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}
function RoomStepper({ label, value, onChange, min = 0, max = 20 }: RoomStepperProps) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="flex-1 text-center text-base font-semibold tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface BasicInfoStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject: PropertyProject | null;
  setSelectedProject: (project: PropertyProject | null) => void;
  ownershipData?: OwnershipData;
  updateOwnershipData?: (updates: Partial<OwnershipData>) => void;
}

interface OwnershipOption {
  id: OwnershipType;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}

const ownershipOptions: OwnershipOption[] = [
  {
    id: 'own',
    icon: <Home className="h-5 w-5" />,
    titleEn: 'My own property',
    titleRu: 'Мой объект',
    descEn: 'I am the legal owner',
    descRu: 'Я — собственник',
  },
  {
    id: 'management_agreement',
    icon: <FileSignature className="h-5 w-5" />,
    titleEn: 'Management Agreement',
    titleRu: 'Договор управления',
    descEn: 'I manage under contract',
    descRu: 'Управление по договору',
  },
  {
    id: 'verbal',
    icon: <MessageCircle className="h-5 w-5" />,
    titleEn: 'Verbal Agreement',
    titleRu: 'Устные договорённости',
    descEn: 'Managing by arrangement',
    descRu: 'На основании договорённости',
  },
];

function BasicInfoStepInner({ 
  formData, 
  updateFormData,
  selectedProject,
  setSelectedProject,
  ownershipData,
  updateOwnershipData
}: BasicInfoStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const typeLabels = getTypeAwareLabels(formData.property_type);
  
  // Hint about auto-creating CRM contact
  const [hintDismissed, setHintDismissed] = useState(() => 
    localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [showHint, setShowHint] = useState(false);

  // Show hint when user starts typing owner data
  const hasOwnerInput = ownershipData && 
    ownershipData.ownership_type !== 'own' && 
    (ownershipData.actual_owner_name.trim() || ownershipData.actual_owner_email.trim() || ownershipData.actual_owner_phone.trim());

  useEffect(() => {
    if (hasOwnerInput && !hintDismissed) {
      setShowHint(true);
    }
  }, [hasOwnerInput, hintDismissed]);

  const handleDismissForever = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setHintDismissed(true);
    setShowHint(false);
  }, []);
  const assetClass = formData.asset_class || 'residential';
  const typeOptions = getTypeOptionsForAssetClass(assetClass);
  const isResidential = assetClass === 'residential';
  const isCommercial = assetClass === 'commercial';
  const isLand = assetClass === 'land';
  const landSqm = formData.land_size_sqm ?? (formData.land_size_rai ? formData.land_size_rai * 1600 : undefined);
  const landBreakdown = landSqm ? formatLandSize(landSqm, isRu) : '';

  const handleAssetClassChange = useCallback((next: AssetClass) => {
    const nextOptions = getTypeOptionsForAssetClass(next);
    const stillValid = nextOptions.some((o) => o.value === formData.property_type);
    updateFormData({
      asset_class: next,
      property_type: stillValid ? formData.property_type : nextOptions[0]?.value || '',
      ...(next !== 'residential' ? { bedrooms: 0, bathrooms: 0 } : {}),
    });
  }, [formData.property_type, updateFormData]);

  return (
    <div className="space-y-6">
      {/* 0. Asset Class — high-level discriminator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            {isRu ? 'Класс объекта' : 'Asset Class'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ASSET_CLASS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = assetClass === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAssetClassChange(opt.value)}
                  className={`flex items-start gap-3 p-3 rounded-none border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30 bg-muted/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {isRu ? opt.labelRu : opt.labelEn}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {isRu ? opt.descRu : opt.descEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 1. Property Type — visual picker, depends on asset_class */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isRu ? 'Тип недвижимости' : 'Property Type'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = formData.property_type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFormData({ property_type: opt.value })}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-none border-2 transition-all text-center ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-none flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight">
                    {isRu ? opt.labelRu : opt.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Commercial / Land specifics — conditional */}
      {(isCommercial || isLand) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isLand ? <Trees className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              {isLand ? (isRu ? 'Параметры участка' : 'Land specifics') : (isRu ? 'Коммерческие параметры' : 'Commercial specifics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLand ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs"><Ruler className="h-3 w-3" />{isRu ? 'Площадь, m²' : 'Area, m²'}</Label>
                    <Input
                      type="number" min={0}
                      value={formData.land_size_sqm ?? ''}
                      onChange={(e) => updateFormData({ land_size_sqm: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="1600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs">{isRu ? 'Фасад, м' : 'Frontage, m'}</Label>
                    <Input
                      type="number" min={0}
                      value={formData.frontage_m ?? ''}
                      onChange={(e) => updateFormData({ frontage_m: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="20"
                    />
                  </div>
                </div>
                {landBreakdown && (
                  <p className="text-xs text-muted-foreground">≈ {landBreakdown}</p>
                )}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><ShieldCheck className="h-3 w-3" />{isRu ? 'Тип документа' : 'Title deed'}</Label>
                  <select
                    value={formData.title_deed_type ?? ''}
                    onChange={(e) => updateFormData({ title_deed_type: e.target.value || undefined })}
                    className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{isRu ? 'Не выбрано' : 'Not specified'}</option>
                    {TITLE_DEED_TYPES.map((d) => (
                      <option key={d.id} value={d.id}>{isRu ? d.labelRu : d.labelEn}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isRu ? 'Зонирование' : 'Zoning'}</Label>
                  <Input
                    value={formData.zoning ?? ''}
                    onChange={(e) => updateFormData({ zoning: e.target.value || undefined })}
                    placeholder={isRu ? 'Жёлтая зона / E-1-A' : 'Yellow zone / E-1-A'}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs"><Ruler className="h-3 w-3" />{isRu ? 'Площадь, m²' : 'Floor area, m²'}</Label>
                    <Input
                      type="number" min={0}
                      value={formData.floor_area_sqm ?? ''}
                      onChange={(e) => updateFormData({ floor_area_sqm: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="320"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs"><Zap className="h-3 w-3" />{isRu ? 'Эл. мощность, кВт' : 'Power load, kW'}</Label>
                    <Input
                      type="number" min={0}
                      value={formData.electricity_load_kw ?? ''}
                      onChange={(e) => updateFormData({ electricity_load_kw: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1 text-xs"><TrendingUp className="h-3 w-3" />Cap rate, %</Label>
                    <Input
                      type="number" min={0} step="0.1"
                      value={formData.cap_rate_pct ?? ''}
                      onChange={(e) => updateFormData({ cap_rate_pct: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="6.8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRu ? 'NOI, ฿/год' : 'NOI, ฿/yr'}</Label>
                    <Input
                      type="number" min={0}
                      value={formData.noi_annual_thb ?? ''}
                      onChange={(e) => updateFormData({ noi_annual_thb: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="3060000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><ShieldCheck className="h-3 w-3" />{isRu ? 'Тип документа' : 'Title deed'}</Label>
                  <select
                    value={formData.title_deed_type ?? ''}
                    onChange={(e) => updateFormData({ title_deed_type: e.target.value || undefined })}
                    className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{isRu ? 'Не выбрано' : 'Not specified'}</option>
                    {TITLE_DEED_TYPES.map((d) => (
                      <option key={d.id} value={d.id}>{isRu ? d.labelRu : d.labelEn}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hotel-specific block — operational hospitality data */}
      {isCommercial && isHotelType(formData.property_type) && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hotel className="h-4 w-4 text-accent" />
              {isRu ? 'Параметры отеля' : 'Hotel details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <Hotel className="h-3 w-3" />{isRu ? 'Кол-во номеров (keys)' : 'Number of keys'}
                </Label>
                <Input
                  type="number" min={0}
                  value={formData.hotel_keys ?? ''}
                  onChange={(e) => updateFormData({ hotel_keys: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="42"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3" />{isRu ? 'Звёздность (1–5)' : 'Star rating (1–5)'}
                </Label>
                <Input
                  type="number" min={0} max={5} step="0.5"
                  value={formData.hotel_star_rating ?? ''}
                  onChange={(e) => updateFormData({ hotel_star_rating: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Бренд / флаг' : 'Brand / flag'}</Label>
              <Input
                value={formData.hotel_brand ?? ''}
                onChange={(e) => updateFormData({ hotel_brand: e.target.value || undefined })}
                placeholder={isRu ? 'Marriott, Hilton, Independent…' : 'Marriott, Hilton, Independent…'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs">
                  <ShieldCheck className="h-3 w-3" />{isRu ? 'Лицензия' : 'License'}
                </Label>
                <select
                  value={formData.hotel_license_type ?? ''}
                  onChange={(e) => updateFormData({ hotel_license_type: e.target.value || undefined })}
                  className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">{isRu ? 'Не выбрано' : 'Not specified'}</option>
                  {HOTEL_LICENSE_TYPES.map((d) => (
                    <option key={d.id} value={d.id}>{isRu ? d.labelRu : d.labelEn}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Год реновации' : 'Year renovated'}</Label>
                <Input
                  type="number" min={1950} max={new Date().getFullYear()}
                  value={formData.hotel_year_renovated ?? ''}
                  onChange={(e) => updateFormData({ hotel_year_renovated: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="2023"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Статус управления' : 'Management status'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {HOTEL_MANAGEMENT_STATUSES.map((s) => {
                  const isSelected = formData.hotel_management_status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateFormData({ hotel_management_status: s.id })}
                      className={`flex items-center gap-2 p-2.5 rounded-none border-2 text-left transition-all ${
                        isSelected
                          ? 'border-accent/40 bg-accent/10'
                          : 'border-muted hover:border-muted-foreground/30 bg-muted/30'
                      }`}
                    >
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs font-medium leading-tight">
                        {isRu ? s.labelRu : s.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(formData.hotel_management_status === 'under_hma' || formData.hotel_management_status === 'owner_operated') && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Текущий оператор' : 'Current operator'}</Label>
                <Input
                  value={formData.hotel_operator_name ?? ''}
                  onChange={(e) => updateFormData({ hotel_operator_name: e.target.value || undefined })}
                  placeholder={isRu ? 'Marriott International / Self' : 'Marriott International / Self'}
                />
              </div>
            )}

            {/* Financial KPIs */}
            <div className="pt-2 border-t border-border/40 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Финансовые метрики (опционально)' : 'Financial metrics (optional)'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">ADR, ฿</Label>
                  <Input
                    type="number" min={0}
                    value={formData.hotel_adr_thb ?? ''}
                    onChange={(e) => updateFormData({ hotel_adr_thb: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="3500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RevPAR, ฿</Label>
                  <Input
                    type="number" min={0}
                    value={formData.hotel_revpar_thb ?? ''}
                    onChange={(e) => updateFormData({ hotel_revpar_thb: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="2450"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isRu ? 'Загрузка, %' : 'Occupancy, %'}</Label>
                  <Input
                    type="number" min={0} max={100} step="0.1"
                    value={formData.hotel_occupancy_pct ?? ''}
                    onChange={(e) => updateFormData({ hotel_occupancy_pct: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="70"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">GOP %</Label>
                  <Input
                    type="number" min={0} max={100} step="0.1"
                    value={formData.hotel_gop_margin_pct ?? ''}
                    onChange={(e) => updateFormData({ hotel_gop_margin_pct: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="38"
                  />
                </div>
              </div>
            </div>

            {formData.hotel_management_status === 'seeking_operator' && (
              <div className="rounded-none p-3 bg-accent/10 border border-accent/40 text-xs text-foreground">
                {isRu
                  ? '✨ Этот объект будет помечен как «Ищет оператора» в разделе HMA opportunities — управляющие компании увидят его в специальной выдаче.'
                  : '✨ This listing will be flagged as "Seeking Operator" in the HMA opportunities section — hotel management companies will see it in a dedicated feed.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <LocationProjectSearch
        formData={formData}
        updateFormData={updateFormData}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
      />

      {/* Basic Info — Title (most important) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4" />
            {isRu ? 'Основная информация' : 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TranslatableInput
            label={isRu ? 'Название' : 'Title'}
            value={isRu ? formData.title_ru : formData.title}
            translatedValue={isRu ? formData.title : formData.title_ru}
            onChange={(val) => updateFormData({ [isRu ? 'title_ru' : 'title']: val })}
            onTranslatedChange={(val) => updateFormData({ [isRu ? 'title' : 'title_ru']: val })}
            placeholder={isRu ? 'Современная вилла с бассейном' : 'Modern Villa with Pool'}
            translatedPlaceholder={isRu ? 'Modern Villa with Pool' : 'Современная вилла с бассейном'}
          />

          <TranslatableTextarea
            label={isRu ? 'Описание' : 'Description'}
            value={isRu ? (formData.description_ru || '') : (formData.description || '')}
            translatedValue={isRu ? (formData.description || '') : (formData.description_ru || '')}
            onChange={(val) => updateFormData({ [isRu ? 'description_ru' : 'description']: val })}
            onTranslatedChange={(val) => updateFormData({ [isRu ? 'description' : 'description_ru']: val })}
            placeholder={isRu ? 'Расскажите гостям, чем уникален ваш объект...' : 'Tell guests what makes your place special...'}
            translatedPlaceholder={isRu ? 'Description in English' : 'Описание на русском'}
            rows={4}
          />

          <div className="space-y-2">
            <Label>{isRu ? 'Внутреннее название' : 'Internal Name'}</Label>
            <Input
              value={formData.internal_name || ''}
              onChange={(e) => updateFormData({ internal_name: e.target.value })}
              placeholder={isRu ? 'Только для вас (не публикуется)' : 'Private note (not published)'}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {isResidential && (
              <>
                <RoomStepper
                  label={<><Bed className="h-3 w-3" />{isRu ? 'Спальни' : 'Bedrooms'}</>}
                  value={formData.bedrooms ?? 0}
                  onChange={(v) => updateFormData({ bedrooms: v })}
                />
                <RoomStepper
                  label={<><Bath className="h-3 w-3" />{isRu ? 'Ванные' : 'Bathrooms'}</>}
                  value={formData.bathrooms ?? 0}
                  onChange={(v) => updateFormData({ bathrooms: v })}
                />
              </>
            )}
            <div className={`space-y-1.5 ${isResidential ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-3'}`}>
              <Label className="flex items-center gap-1 text-xs">
                <SquareStack className="h-3 w-3" />
                {isRu ? typeLabels.areaLabelRu : typeLabels.areaLabel}
              </Label>
              <Input
                type="number"
                min={0}
                value={formData.area_sqm}
                onChange={(e) => updateFormData({ area_sqm: e.target.value })}
                placeholder="m²"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Type Selection (Compact) — who manages the property */}
      {ownershipData && updateOwnershipData && (
        <Collapsible defaultOpen={ownershipData.ownership_type !== 'own'} className="group/ownership">
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-none flex flex-row items-center justify-between gap-2 [&>div]:flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <CardTitle className="text-base">
                    {isRu ? 'Право на управление' : 'Management Rights'}
                  </CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]/ownership:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {isRu ? 'Кто управляет объектом' : 'Who manages this property'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ownershipOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateOwnershipData({ ownership_type: option.id })}
                  className={`p-3 rounded-none border-2 text-center transition-all ${
                    ownershipData.ownership_type === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    ownershipData.ownership_type === option.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {option.icon}
                  </div>
                  <p className="font-medium text-xs">
                    {isRu ? option.titleRu : option.titleEn}
                  </p>
                </button>
              ))}
                </div>

                {/* Auto-create contact hint */}
                {showHint && (
                  <div className="flex items-start gap-3 p-3 rounded-none bg-primary/5 border border-primary/20 text-sm">
                    <UserPlus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground font-medium">
                        {isRu 
                          ? 'Контакт собственника будет создан автоматически' 
                          : 'Owner contact will be created automatically'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isRu 
                          ? 'После сохранения объекта в CRM появится карточка собственника с указанными данными. Вы сможете дополнить её позже.'
                          : 'After saving, a CRM contact card will be created with this data. You can fill in more details later.'}
                      </p>
                      <button 
                        type="button" 
                        onClick={handleDismissForever}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        {isRu ? 'Больше не показывать' : "Don't show again"}
                      </button>
                    </div>
                    <button type="button" onClick={() => setShowHint(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
            {/* Quick owner contact for verbal/management */}
            {ownershipData.ownership_type !== 'own' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-none space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Контакты собственника для верификации:' : 'Owner contacts for verification:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder={isRu ? 'Имя' : 'Name'}
                    value={ownershipData.actual_owner_name}
                    onChange={(e) => updateOwnershipData({ actual_owner_name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={ownershipData.actual_owner_email}
                    onChange={(e) => updateOwnershipData({ actual_owner_email: e.target.value })}
                  />
                  <Input
                    placeholder={isRu ? 'Телефон' : 'Phone'}
                    type="tel"
                    value={ownershipData.actual_owner_phone}
                    onChange={(e) => updateOwnershipData({ actual_owner_phone: e.target.value })}
                  />
                </div>

                {/* Document upload for management agreement */}
                {ownershipData.ownership_type === 'management_agreement' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Upload className="h-3.5 w-3.5" />
                      {isRu ? 'Договор управления *' : 'Management Agreement *'}
                    </Label>
                    <UnifiedMediaUploader
                      mode="document"
                      value={ownershipData.management_document_url || ''}
                      onChange={(url) => updateOwnershipData({ management_document_url: typeof url === 'string' ? url : '' })}
                      bucket="property-documents"
                      placeholder={isRu ? 'Загрузите скан или фото договора' : 'Upload scan or photo of agreement'}
                    />
                  </div>
                )}

                {/* Optional ownership document */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Upload className="h-3.5 w-3.5" />
                    {isRu ? 'Документ о собственности (необязательно)' : 'Ownership document (optional)'}
                  </Label>
                  <UnifiedMediaUploader
                    mode="document"
                    value={ownershipData.ownership_document_url || ''}
                    onChange={(url) => updateOwnershipData({ ownership_document_url: typeof url === 'string' ? url : '' })}
                    bucket="property-documents"
                    placeholder={isRu ? 'Чанот, договор аренды и т.д.' : 'Chanote, lease contract, etc.'}
                  />
                </div>
              </div>
            )}
          </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Unit Fields — always shown after type is selected */}
      <UnitFields
        propertyType={formData.property_type}
        floor={formData.floor}
        unitNumber={formData.unit_number}
        onFloorChange={(floor) => updateFormData({ floor })}
        onUnitNumberChange={(unit_number) => updateFormData({ unit_number })}
        totalFloors={formData.total_floors}
        plotSizeSqm={formData.plot_size_sqm}
        hasElevator={formData.has_elevator}
        parkingType={formData.parking_type}
        poolType={formData.pool_type}
        gardenType={formData.garden_type}
        onTotalFloorsChange={(total_floors) => updateFormData({ total_floors })}
        onPlotSizeChange={(plot_size_sqm) => updateFormData({ plot_size_sqm })}
        onHasElevatorChange={(has_elevator) => updateFormData({ has_elevator })}
        onParkingTypeChange={(parking_type) => updateFormData({ parking_type })}
        onPoolTypeChange={(pool_type) => updateFormData({ pool_type })}
        onGardenTypeChange={(garden_type) => updateFormData({ garden_type })}
        viewType={formData.view_type}
        furnishingLevel={formData.furnishing_level}
        equipment={formData.equipment}
        onViewTypeChange={(view_type) => updateFormData({ view_type })}
        onFurnishingLevelChange={(furnishing_level) => updateFormData({ furnishing_level })}
        onEquipmentChange={(equipment) => updateFormData({ equipment })}
      />

      {/* Property Features / Highlights */}
      <PropertyFeaturesSelector
        highlights={formData.highlights}
        onChange={(highlights) => updateFormData({ highlights })}
      />

      {/* Management Type & Terms — hidden, management_type defaults to 'full' in usePropertyWizard */}

      {/* YouTube Video */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4" />
            {isRu ? 'Видео объекта' : 'Property Video'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm text-muted-foreground mb-1.5 block">
            {isRu ? 'Ссылка на YouTube' : 'YouTube URL'}
          </Label>
          <Input
            value={formData.video_url || ''}
            onChange={e => updateFormData({ video_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export const BasicInfoStep = memo(BasicInfoStepInner);
