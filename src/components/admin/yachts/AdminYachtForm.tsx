import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Yacht } from '@/hooks/useYachts';
import { VendorFormSection } from '@/components/vendor/VendorFormSection';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Ship, DollarSign, MapPin, Wrench, Sparkles, Clock, Settings, Zap, FileText } from 'lucide-react';

const yachtTypes = [
  { value: 'motor_yacht', label: 'Motor Yacht', labelRu: 'Моторная яхта' },
  { value: 'catamaran', label: 'Catamaran', labelRu: 'Катамаран' },
  { value: 'speedboat', label: 'Speedboat', labelRu: 'Скоростная лодка' },
  { value: 'superyacht', label: 'Superyacht', labelRu: 'Суперяхта' },
];

export interface YachtFormData {
  provider_id: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  yacht_type: string;
  cover_image: string;
  images: string[];
  capacity: string;
  price_half_day: string;
  price_full_day: string;
  location_name: string;
  location_ru: string;
  features_en: string;
  features_ru: string;
  length_meters: string;
  year_built: string;
  beam: string;
  draft: string;
  engines: string;
  cruising_speed: string;
  max_speed: string;
  fuel_capacity: string;
  cabins: string;
  bathrooms: string;
  has_crew: boolean;
  is_featured: boolean;
  is_active: boolean;
  departure_times: string;
  booking_flow: string;       // 'in_app_request' | 'instant'
  deposit_percent: string;    // 0-100
  balance_due_hours: string;  // hours before boarding to pay balance
}

export const emptyFormData: YachtFormData = {
  provider_id: '',
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  yacht_type: 'motor_yacht',
  cover_image: '',
  images: [],
  capacity: '10',
  price_half_day: '',
  price_full_day: '',
  location_name: '',
  location_ru: '',
  features_en: '',
  features_ru: '',
  length_meters: '',
  year_built: '',
  beam: '',
  draft: '',
  engines: '',
  cruising_speed: '',
  max_speed: '',
  fuel_capacity: '',
  cabins: '',
  bathrooms: '',
  has_crew: true,
  is_featured: false,
  is_active: true,
  departure_times: '',
  booking_flow: 'in_app_request',
  deposit_percent: '50',
  balance_due_hours: '48',
};

export function yachtToFormData(yacht: Yacht): YachtFormData {
  return {
    provider_id: (yacht as any).provider_id || '',
    name_en: yacht.name_en,
    name_ru: yacht.name_ru || '',
    description_en: yacht.description_en || '',
    description_ru: yacht.description_ru || '',
    yacht_type: yacht.yacht_type,
    cover_image: yacht.cover_image || '',
    images: yacht.images || [],
    capacity: yacht.capacity.toString(),
    price_half_day: yacht.price_half_day?.toString() || '',
    price_full_day: yacht.price_full_day?.toString() || '',
    location_name: yacht.location_name || '',
    location_ru: yacht.location_ru || '',
    features_en: yacht.features_en?.join(', ') || '',
    features_ru: yacht.features_ru?.join(', ') || '',
    length_meters: yacht.length_meters?.toString() || '',
    year_built: yacht.year_built?.toString() || '',
    beam: yacht.beam || '',
    draft: yacht.draft || '',
    engines: yacht.engines || '',
    cruising_speed: yacht.cruising_speed || '',
    max_speed: yacht.max_speed || '',
    fuel_capacity: yacht.fuel_capacity || '',
    cabins: yacht.cabins?.toString() || '',
    bathrooms: yacht.bathrooms?.toString() || '',
    has_crew: yacht.has_crew ?? true,
    is_featured: yacht.is_featured,
    is_active: yacht.is_active ?? true,
    departure_times: yacht.departure_times?.join(', ') || '',
    booking_flow: yacht.booking_flow || 'in_app_request',
    deposit_percent: yacht.deposit_percent?.toString() || '50',
    balance_due_hours: yacht.balance_due_hours?.toString() || '48',
  };
}

export function formDataToPayload(formData: YachtFormData) {
  return {
    provider_id: formData.provider_id,
    name_en: formData.name_en,
    name_ru: formData.name_ru || formData.name_en,
    description_en: formData.description_en || undefined,
    description_ru: formData.description_ru || undefined,
    yacht_type: formData.yacht_type,
    cover_image: formData.cover_image || undefined,
    images: formData.images.length > 0 ? formData.images : [],
    capacity: parseInt(formData.capacity) || 10,
    price_half_day: formData.price_half_day ? parseFloat(formData.price_half_day) : undefined,
    price_full_day: parseFloat(formData.price_full_day),
    currency: 'THB',
    location_name: formData.location_name || undefined,
    location_ru: formData.location_ru || undefined,
    features_en: formData.features_en ? formData.features_en.split(',').map(f => f.trim()).filter(Boolean) : [],
    features_ru: formData.features_ru ? formData.features_ru.split(',').map(f => f.trim()).filter(Boolean) : [],
    length_meters: formData.length_meters ? parseFloat(formData.length_meters) : undefined,
    year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
    beam: formData.beam || undefined,
    draft: formData.draft || undefined,
    engines: formData.engines || undefined,
    cruising_speed: formData.cruising_speed || undefined,
    max_speed: formData.max_speed || undefined,
    fuel_capacity: formData.fuel_capacity || undefined,
    cabins: formData.cabins ? parseInt(formData.cabins) : undefined,
    bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
    has_crew: formData.has_crew,
    is_featured: formData.is_featured,
    is_active: formData.is_active,
    departure_times: formData.departure_times ? formData.departure_times.split(',').map(t => t.trim()).filter(Boolean) : null,
    booking_flow: formData.booking_flow,
    deposit_percent: formData.deposit_percent ? parseInt(formData.deposit_percent) : 50,
    balance_due_hours: formData.balance_due_hours ? parseInt(formData.balance_due_hours) : 48,
  };
}

interface AdminYachtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingYacht: Yacht | null;
  initialProviderId?: string;
  onSubmit: (data: ReturnType<typeof formDataToPayload>, isEdit: boolean, yachtId?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function AdminYachtForm({
  open,
  onOpenChange,
  editingYacht,
  initialProviderId,
  onSubmit,
  isSubmitting,
}: AdminYachtFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [formData, setFormData] = useState<YachtFormData>(emptyFormData);

  // Sync form when dialog opens or editing yacht changes
  useEffect(() => {
    if (open) {
      if (editingYacht) {
        setFormData(yachtToFormData(editingYacht));
      } else {
        setFormData({ ...emptyFormData, provider_id: initialProviderId || '' });
      }
    }
  }, [open, editingYacht, initialProviderId]);

  const update = <K extends keyof YachtFormData>(key: K, value: YachtFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(formDataToPayload(formData), !!editingYacht, editingYacht?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {editingYacht
              ? (isRu ? 'Редактировать яхту' : 'Edit Yacht')
              : (isRu ? 'Новая яхта' : 'New Yacht')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
          <div className="space-y-6 py-4">
            {/* Provider */}
            <div className="p-4 bg-muted/50 rounded-none border-2 border-dashed">
              <ProviderSelector
                value={formData.provider_id}
                onChange={(id) => update('provider_id', id)}
                label={isRu ? 'Привязать к провайдеру' : 'Assign to Provider'}
                required
              />
            </div>

            {/* === Basic Info === */}
            <VendorFormSection
              title={isRu ? 'Основная информация' : 'Basic Information'}
              icon={<Ship className="h-4 w-4" />}
              badge={isRu ? 'Обязательно' : 'Required'}
            >
              <div className="space-y-2">
                <Label>{isRu ? 'Обложка' : 'Cover Image'}</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(url) => update('cover_image', url)}
                  folder="yachts"
                  placeholder={isRu ? 'Загрузить обложку' : 'Upload cover'}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Галерея (до 10 фото)' : 'Gallery (up to 10 photos)'}</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(urls) => update('images', urls)}
                  folder="yachts"
                  maxImages={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                  <Input value={formData.name_en} onChange={(e) => update('name_en', e.target.value)} placeholder="Luxury Yacht 42ft" />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                  <Input value={formData.name_ru} onChange={(e) => update('name_ru', e.target.value)} placeholder="Люксовая яхта 42 фута" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Тип' : 'Type'}</Label>
                  <Select value={formData.yacht_type} onValueChange={(v) => update('yacht_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {yachtTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{isRu ? t.labelRu : t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Вместимость' : 'Capacity'}</Label>
                  <Input type="number" value={formData.capacity} onChange={(e) => update('capacity', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea value={formData.description_en} onChange={(e) => update('description_en', e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                  <Textarea value={formData.description_ru} onChange={(e) => update('description_ru', e.target.value)} rows={3} />
                </div>
              </div>
            </VendorFormSection>

            {/* === Pricing === */}
            <VendorFormSection
              title={isRu ? 'Цены' : 'Pricing'}
              icon={<DollarSign className="h-4 w-4" />}
              badge={isRu ? 'Обязательно' : 'Required'}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Цена за полдня (฿)' : 'Half-day Price (฿)'}</Label>
                  <Input type="number" value={formData.price_half_day} onChange={(e) => update('price_half_day', e.target.value)} placeholder="25000" />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Цена за день (฿) *' : 'Full-day Price (฿) *'}</Label>
                  <Input type="number" value={formData.price_full_day} onChange={(e) => update('price_full_day', e.target.value)} placeholder="45000" />
                </div>
              </div>
            </VendorFormSection>

            {/* === Location === */}
            <VendorFormSection
              title={isRu ? 'Локация' : 'Location'}
              icon={<MapPin className="h-4 w-4" />}
              collapsible
              defaultOpen={!!formData.location_name}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Локация (EN)' : 'Location (EN)'}</Label>
                  <Input value={formData.location_name} onChange={(e) => update('location_name', e.target.value)} placeholder="Chalong Bay Marina" />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Локация (RU)' : 'Location (RU)'}</Label>
                  <Input value={formData.location_ru} onChange={(e) => update('location_ru', e.target.value)} placeholder="Марина Чалонг Бэй" />
                </div>
              </div>
            </VendorFormSection>

            {/* === Tech Specs === */}
            <VendorFormSection
              title={isRu ? 'Технические характеристики' : 'Technical Specs'}
              icon={<Wrench className="h-4 w-4" />}
              collapsible
              defaultOpen={false}
              badge={isRu ? 'Опционально' : 'Optional'}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Длина (м)' : 'Length (m)'}</Label>
                  <Input type="number" value={formData.length_meters} onChange={(e) => update('length_meters', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Год постройки' : 'Year Built'}</Label>
                  <Input type="number" value={formData.year_built} onChange={(e) => update('year_built', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Каюты' : 'Cabins'}</Label>
                  <Input type="number" value={formData.cabins} onChange={(e) => update('cabins', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Ванные' : 'Bathrooms'}</Label>
                  <Input type="number" value={formData.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Двигатели' : 'Engines'}</Label>
                  <Input value={formData.engines} onChange={(e) => update('engines', e.target.value)} placeholder="2x 500HP" />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Макс. скорость' : 'Max Speed'}</Label>
                  <Input value={formData.max_speed} onChange={(e) => update('max_speed', e.target.value)} placeholder="25 knots" />
                </div>
              </div>
            </VendorFormSection>

            {/* === Features === */}
            <VendorFormSection
              title={isRu ? 'Особенности' : 'Features'}
              icon={<Sparkles className="h-4 w-4" />}
              collapsible
              defaultOpen={!!formData.features_en}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Особенности (EN, через запятую)' : 'Features (EN, comma-separated)'}</Label>
                  <Input value={formData.features_en} onChange={(e) => update('features_en', e.target.value)} placeholder="WiFi, Air conditioning, Kitchen" />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Особенности (RU, через запятую)' : 'Features (RU, comma-separated)'}</Label>
                  <Input value={formData.features_ru} onChange={(e) => update('features_ru', e.target.value)} placeholder="WiFi, Кондиционер, Кухня" />
                </div>
              </div>
            </VendorFormSection>

            {/* === Departure Schedule === */}
            <VendorFormSection
              title={isRu ? 'Расписание отправлений' : 'Departure Schedule'}
              icon={<Clock className="h-4 w-4" />}
              collapsible
              defaultOpen={!!formData.departure_times}
            >
              <div className="space-y-2">
                <Label>{isRu ? 'Время отправления (через запятую)' : 'Departure Times (comma-separated)'}</Label>
                <Input value={formData.departure_times} onChange={(e) => update('departure_times', e.target.value)} placeholder="08:00, 09:00, 10:00, 14:00" />
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Оставьте пустым для стандартного расписания (полдня: 09:00, 14:00 / день: 08:00, 09:00, 10:00)'
                    : 'Leave empty for default schedule (half day: 09:00, 14:00 / full day: 08:00, 09:00, 10:00)'}
                </p>
              </div>
            </VendorFormSection>

            {/* === Booking Flow === */}
            <VendorFormSection
              title={isRu ? 'Режим бронирования' : 'Booking Flow'}
              icon={<Zap className="h-4 w-4" />}
              badge={isRu ? 'Важно' : 'Important'}
            >
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update('booking_flow', 'in_app_request')}
                  className={`p-4 rounded-none border-2 text-left transition-all ${
                    formData.booking_flow === 'in_app_request'
                      ? 'border-warning bg-warning/10'
                      : 'border-border hover:border-warning/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-warning" />
                    <span className="font-medium text-sm">{isRu ? 'По заявке' : 'Request to Book'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Клиент отправляет заявку, менеджер подтверждает и выставляет счёт на депозит'
                      : 'Client submits request, manager confirms and sends deposit invoice'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => update('booking_flow', 'instant')}
                  className={`p-4 rounded-none border-2 text-left transition-all ${
                    formData.booking_flow === 'instant'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{isRu ? 'Мгновенное' : 'Instant Booking'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Депозит оплачивается сразу онлайн, бронирование подтверждается автоматически'
                      : 'Deposit paid immediately online, booking confirmed automatically'}
                  </p>
                </button>
              </div>

              {/* Deposit percent */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label>
                    {isRu ? 'Депозит (% от стоимости)' : 'Deposit (% of total)'}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.deposit_percent}
                      onChange={(e) => update('deposit_percent', e.target.value)}
                      placeholder="50"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Стандарт: 50%. Депозит всегда обязателен.' : 'Default: 50%. Deposit is always required.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    {isRu ? 'Остаток — за сколько часов до посадки' : 'Balance due hours before boarding'}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={formData.balance_due_hours}
                      onChange={(e) => update('balance_due_hours', e.target.value)}
                      placeholder="48"
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {isRu ? 'часов' : 'hours'}
                    </span>
                  </div>
                </div>
              </div>
            </VendorFormSection>

            {/* === Settings === */}
            <VendorFormSection
              title={isRu ? 'Настройки' : 'Settings'}
              icon={<Settings className="h-4 w-4" />}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{isRu ? 'С экипажем' : 'With Crew'}</Label>
                  <Switch checked={formData.has_crew} onCheckedChange={(c) => update('has_crew', c)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRu ? 'Избранное (Featured)' : 'Featured'}</Label>
                  <Switch checked={formData.is_featured} onCheckedChange={(c) => update('is_featured', c)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRu ? 'Активна' : 'Active'}</Label>
                  <Switch checked={formData.is_active} onCheckedChange={(c) => update('is_active', c)} />
                </div>
              </div>
            </VendorFormSection>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingYacht
              ? (isRu ? 'Сохранить' : 'Save')
              : (isRu ? 'Создать' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
