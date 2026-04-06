import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CancellationPolicySelector } from '@/components/property/CancellationPolicySelector';
import { createErrorHandler } from '@/lib/errorHandler';
import { OwnerProperty } from '@/types/property';
import { 
import { toast } from 'sonner';
  Loader2, DollarSign, Clock, Users, FileText, Shield, Zap, Droplets, 
  Sparkles, Car, PawPrint, Baby, Phone, Percent, CalendarDays, Key,
  Plane, Volume2, PartyPopper, Wifi
} from 'lucide-react';

const DEPOSIT_TYPES = [
  { value: 'fixed', labelEn: 'Fixed amount', labelRu: 'Фиксированная сумма' },
  { value: 'per_night', labelEn: 'Per night', labelRu: 'За ночь' },
  { value: 'percentage', labelEn: 'Percentage of total', labelRu: 'Процент от суммы' },
];

const ELECTRICITY_PROVIDERS = [
  { value: 'PEA', labelEn: 'PEA (Provincial)', labelRu: 'PEA (Провинциальный)' },
  { value: 'MEA', labelEn: 'MEA (Metropolitan)', labelRu: 'MEA (Столичный)' },
  { value: 'private', labelEn: 'Private meter', labelRu: 'Частный счётчик' },
];

const ELECTRICITY_METERING = [
  { value: 'meter', labelEn: 'Actual meter reading', labelRu: 'По счётчику' },
  { value: 'fixed', labelEn: 'Fixed monthly rate', labelRu: 'Фиксированная ставка' },
  { value: 'estimated', labelEn: 'Estimated usage', labelRu: 'Примерный расход' },
];

const CLEANING_FREQUENCIES = [
  { value: 'daily', labelEn: 'Daily', labelRu: 'Ежедневно' },
  { value: 'weekly', labelEn: 'Weekly', labelRu: 'Еженедельно' },
  { value: 'biweekly', labelEn: 'Every 2 weeks', labelRu: 'Раз в 2 недели' },
  { value: 'monthly', labelEn: 'Monthly', labelRu: 'Ежемесячно' },
  { value: 'none', labelEn: 'Not included', labelRu: 'Не включена' },
];

const KEY_HANDOVER_OPTIONS = [
  { value: 'in_person', labelEn: 'In person (meet manager)', labelRu: 'Лично (встреча с менеджером)' },
  { value: 'lockbox', labelEn: 'Lockbox with code', labelRu: 'Сейф с кодом' },
  { value: 'doorman', labelEn: 'Doorman / Security', labelRu: 'Консьерж / Охрана' },
  { value: 'self_service', labelEn: 'Smart lock / Self check-in', labelRu: 'Умный замок / Самозаезд' },
];

const INCLUDED_SERVICES_OPTIONS = [
  { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: Wifi },
  { id: 'ac', labelEn: 'Air conditioning', labelRu: 'Кондиционер', icon: Sparkles },
  { id: 'pool', labelEn: 'Pool', labelRu: 'Бассейн', icon: Droplets },
  { id: 'cleaning_weekly', labelEn: 'Weekly cleaning', labelRu: 'Еженедельная уборка', icon: Sparkles },
  { id: 'linen_change', labelEn: 'Linen change', labelRu: 'Смена белья', icon: Sparkles },
  { id: 'parking', labelEn: 'Parking', labelRu: 'Парковка', icon: Car },
  { id: 'gym', labelEn: 'Gym access', labelRu: 'Доступ в зал', icon: Users },
  { id: 'tv', labelEn: 'TV / Streaming', labelRu: 'ТВ / Стриминг', icon: Sparkles },
];

interface FormData {
  // Pricing
  price_per_night: string;
  deposit_currency: string;
  weekly_discount: string;
  monthly_discount: string;
  // Deposit
  deposit_amount: string;
  deposit_type: string;
  // Booking
  min_stay_nights: string;
  max_guests: string;
  instant_booking: boolean;
  cancellation_policy: string;
  // Check-in/out
  check_in_time: string;
  check_out_time: string;
  early_checkin_price: string;
  late_checkout_price: string;
  key_handover: string;
  check_in_instructions: string;
  check_in_instructions_ru: string;
  // Electricity
  electricity_included: boolean;
  electricity_unit_price: string;
  electricity_provider: string;
  electricity_metering: string;
  electricity_notes: string;
  electricity_notes_ru: string;
  // Water
  water_included: boolean;
  water_unit_price: string;
  water_notes: string;
  water_notes_ru: string;
  // Internet
  internet_speed: string;
  internet_provider: string;
  // Included services
  included_services: string[];
  // Cleaning
  cleaning_included: boolean;
  cleaning_frequency: string;
  extra_cleaning_price: string;
  linen_change_price: string;
  linen_change_frequency: string;
  // Transfer
  transfer_available: boolean;
  transfer_airport_price: string;
  transfer_notes: string;
  transfer_notes_ru: string;
  // Extra guests
  extra_guest_price: string;
  extra_guest_threshold: string;
  // Parking
  parking_included: boolean;
  parking_spaces: string;
  parking_notes: string;
  // Pets
  pets_allowed: boolean;
  pet_deposit: string;
  pet_notes: string;
  pet_notes_ru: string;
  // Children
  children_friendly: boolean;
  has_crib: boolean;
  has_high_chair: boolean;
  // Quiet hours & parties
  quiet_hours_start: string;
  quiet_hours_end: string;
  parties_allowed: boolean;
  max_party_guests: string;
  // Rules
  house_rules: string;
  house_rules_ru: string;
  // Penalties
  late_checkout_penalty: string;
  smoking_penalty: string;
  // Contact
  manager_name: string;
  manager_phone: string;
  manager_line_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  host_languages: string[];
}

const DEFAULT_FORM_DATA: FormData = {
  price_per_night: '',
  deposit_currency: 'THB',
  weekly_discount: '0',
  monthly_discount: '0',
  deposit_amount: '',
  deposit_type: 'fixed',
  min_stay_nights: '1',
  max_guests: '',
  instant_booking: false,
  cancellation_policy: 'flexible',
  check_in_time: '14:00',
  check_out_time: '12:00',
  early_checkin_price: '',
  late_checkout_price: '',
  key_handover: 'in_person',
  check_in_instructions: '',
  check_in_instructions_ru: '',
  electricity_included: false,
  electricity_unit_price: '7',
  electricity_provider: 'PEA',
  electricity_metering: 'meter',
  electricity_notes: '',
  electricity_notes_ru: '',
  water_included: true,
  water_unit_price: '',
  water_notes: '',
  water_notes_ru: '',
  internet_speed: '',
  internet_provider: '',
  included_services: ['wifi', 'ac'],
  cleaning_included: true,
  cleaning_frequency: 'weekly',
  extra_cleaning_price: '',
  linen_change_price: '',
  linen_change_frequency: 'weekly',
  transfer_available: false,
  transfer_airport_price: '',
  transfer_notes: '',
  transfer_notes_ru: '',
  extra_guest_price: '',
  extra_guest_threshold: '',
  parking_included: true,
  parking_spaces: '1',
  parking_notes: '',
  pets_allowed: false,
  pet_deposit: '',
  pet_notes: '',
  pet_notes_ru: '',
  children_friendly: true,
  has_crib: false,
  has_high_chair: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  parties_allowed: false,
  max_party_guests: '',
  house_rules: '',
  house_rules_ru: '',
  late_checkout_penalty: '',
  smoking_penalty: '',
  manager_name: '',
  manager_phone: '',
  manager_line_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  host_languages: ['en'],
};

export default function OwnerRentalTerms() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const errorLog = createErrorHandler('OwnerRentalTerms');

  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (property) {
      setFormData({
        price_per_night: property.price_per_night?.toString() || '',
        deposit_currency: property.deposit_currency || 'THB',
        weekly_discount: property.weekly_discount?.toString() || '0',
        monthly_discount: property.monthly_discount?.toString() || '0',
        deposit_amount: property.deposit_amount?.toString() || '',
        deposit_type: property.deposit_type || 'fixed',
        min_stay_nights: property.min_stay_nights?.toString() || '1',
        max_guests: property.max_guests?.toString() || '',
        instant_booking: property.instant_booking || false,
        cancellation_policy: property.cancellation_policy || 'flexible',
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '12:00',
        early_checkin_price: property.early_checkin_price?.toString() || '',
        late_checkout_price: property.late_checkout_price?.toString() || '',
        key_handover: property.key_handover || 'in_person',
        check_in_instructions: property.check_in_instructions || '',
        check_in_instructions_ru: property.check_in_instructions_ru || '',
        electricity_included: property.electricity_included || false,
        electricity_unit_price: property.electricity_unit_price?.toString() || '7',
        electricity_provider: property.electricity_provider || 'PEA',
        electricity_metering: property.electricity_metering || 'meter',
        electricity_notes: property.electricity_notes || '',
        electricity_notes_ru: property.electricity_notes_ru || '',
        water_included: property.water_included ?? true,
        water_unit_price: property.water_unit_price?.toString() || '',
        water_notes: property.water_notes || '',
        water_notes_ru: property.water_notes_ru || '',
        internet_speed: property.internet_speed || '',
        internet_provider: property.internet_provider || '',
        included_services: (property.included_services as string[]) || ['wifi', 'ac'],
        cleaning_included: property.cleaning_included ?? true,
        cleaning_frequency: property.cleaning_frequency || 'weekly',
        extra_cleaning_price: property.extra_cleaning_price?.toString() || '',
        linen_change_price: property.linen_change_price?.toString() || '',
        linen_change_frequency: property.linen_change_frequency || 'weekly',
        transfer_available: property.transfer_available || false,
        transfer_airport_price: property.transfer_airport_price?.toString() || '',
        transfer_notes: property.transfer_notes || '',
        transfer_notes_ru: property.transfer_notes_ru || '',
        extra_guest_price: property.extra_guest_price?.toString() || '',
        extra_guest_threshold: property.extra_guest_threshold?.toString() || '',
        parking_included: property.parking_included ?? true,
        parking_spaces: property.parking_spaces?.toString() || '1',
        parking_notes: property.parking_notes || '',
        pets_allowed: property.pets_allowed || false,
        pet_deposit: property.pet_deposit?.toString() || '',
        pet_notes: property.pet_notes || '',
        pet_notes_ru: property.pet_notes_ru || '',
        children_friendly: property.children_friendly ?? true,
        has_crib: property.has_crib || false,
        has_high_chair: property.has_high_chair || false,
        quiet_hours_start: property.quiet_hours_start || '22:00',
        quiet_hours_end: property.quiet_hours_end || '08:00',
        parties_allowed: property.parties_allowed || false,
        max_party_guests: property.max_party_guests?.toString() || '',
        house_rules: property.house_rules || '',
        house_rules_ru: property.house_rules_ru || '',
        late_checkout_penalty: property.late_checkout_penalty?.toString() || '',
        smoking_penalty: property.smoking_penalty?.toString() || '',
        manager_name: property.manager_name || '',
        manager_phone: property.manager_phone || '',
        manager_line_id: property.manager_line_id || '',
        emergency_contact_name: property.emergency_contact_name || '',
        emergency_contact_phone: property.emergency_contact_phone || '',
        host_languages: property.host_languages || ['en'],
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      await updateProperty.mutateAsync({
        id,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null,
        deposit_currency: formData.deposit_currency,
        weekly_discount: Number(formData.weekly_discount) || 0,
        monthly_discount: Number(formData.monthly_discount) || 0,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : null,
        deposit_type: formData.deposit_type,
        min_stay_nights: formData.min_stay_nights ? Number(formData.min_stay_nights) : 1,
        max_guests: formData.max_guests ? Number(formData.max_guests) : null,
        instant_booking: formData.instant_booking,
        cancellation_policy: formData.cancellation_policy,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        early_checkin_price: formData.early_checkin_price ? Number(formData.early_checkin_price) : null,
        late_checkout_price: formData.late_checkout_price ? Number(formData.late_checkout_price) : null,
        key_handover: formData.key_handover,
        check_in_instructions: formData.check_in_instructions || null,
        check_in_instructions_ru: formData.check_in_instructions_ru || null,
        electricity_included: formData.electricity_included,
        electricity_unit_price: formData.electricity_unit_price ? Number(formData.electricity_unit_price) : null,
        electricity_provider: formData.electricity_provider,
        electricity_metering: formData.electricity_metering,
        electricity_notes: formData.electricity_notes || null,
        electricity_notes_ru: formData.electricity_notes_ru || null,
        water_included: formData.water_included,
        water_unit_price: formData.water_unit_price ? Number(formData.water_unit_price) : null,
        water_notes: formData.water_notes || null,
        water_notes_ru: formData.water_notes_ru || null,
        internet_speed: formData.internet_speed || null,
        internet_provider: formData.internet_provider || null,
        included_services: formData.included_services,
        cleaning_included: formData.cleaning_included,
        cleaning_frequency: formData.cleaning_frequency,
        extra_cleaning_price: formData.extra_cleaning_price ? Number(formData.extra_cleaning_price) : null,
        linen_change_price: formData.linen_change_price ? Number(formData.linen_change_price) : null,
        linen_change_frequency: formData.linen_change_frequency,
        transfer_available: formData.transfer_available,
        transfer_airport_price: formData.transfer_airport_price ? Number(formData.transfer_airport_price) : null,
        transfer_notes: formData.transfer_notes || null,
        transfer_notes_ru: formData.transfer_notes_ru || null,
        extra_guest_price: formData.extra_guest_price ? Number(formData.extra_guest_price) : null,
        extra_guest_threshold: formData.extra_guest_threshold ? Number(formData.extra_guest_threshold) : null,
        parking_included: formData.parking_included,
        parking_spaces: formData.parking_spaces ? Number(formData.parking_spaces) : 1,
        parking_notes: formData.parking_notes || null,
        pets_allowed: formData.pets_allowed,
        pet_deposit: formData.pet_deposit ? Number(formData.pet_deposit) : null,
        pet_notes: formData.pet_notes || null,
        pet_notes_ru: formData.pet_notes_ru || null,
        children_friendly: formData.children_friendly,
        has_crib: formData.has_crib,
        has_high_chair: formData.has_high_chair,
        quiet_hours_start: formData.quiet_hours_start,
        quiet_hours_end: formData.quiet_hours_end,
        parties_allowed: formData.parties_allowed,
        max_party_guests: formData.max_party_guests ? Number(formData.max_party_guests) : null,
        house_rules: formData.house_rules || null,
        house_rules_ru: formData.house_rules_ru || null,
        late_checkout_penalty: formData.late_checkout_penalty ? Number(formData.late_checkout_penalty) : null,
        smoking_penalty: formData.smoking_penalty ? Number(formData.smoking_penalty) : null,
        manager_name: formData.manager_name || null,
        manager_phone: formData.manager_phone || null,
        manager_line_id: formData.manager_line_id || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        host_languages: formData.host_languages,
      } as Partial<OwnerProperty> & { id: string });

      toast(isRu, { description: isRu ? 'Условия аренды обновлены' : 'Rental terms updated' });

      navigate(`/mc/properties/${id}`);
    } catch (error) {
      errorLog.error(error, 'save_rental_terms');
    }
  };

  const toggleIncludedService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      included_services: prev.included_services.includes(serviceId)
        ? prev.included_services.filter(s => s !== serviceId)
        : [...prev.included_services, serviceId]
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      host_languages: prev.host_languages.includes(lang)
        ? prev.host_languages.filter(l => l !== lang)
        : [...prev.host_languages, lang]
    }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isRu ? 'Объект не найден' : 'Property not found'}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Условия аренды' : 'Rental Terms'}
        showBack
        fallbackPath={`/mc/properties/${id}`}
      />

      <form onSubmit={handleSubmit} className="mt-4 pb-24">
        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="pricing" className="text-xs px-1">
              <DollarSign className="h-3 w-3 mr-1 hidden sm:inline" />
              {isRu ? 'Цены' : 'Pricing'}
            </TabsTrigger>
            <TabsTrigger value="utilities" className="text-xs px-1">
              <Zap className="h-3 w-3 mr-1 hidden sm:inline" />
              {isRu ? 'Услуги' : 'Utilities'}
            </TabsTrigger>
            <TabsTrigger value="checkin" className="text-xs px-1">
              <Key className="h-3 w-3 mr-1 hidden sm:inline" />
              {isRu ? 'Заезд' : 'Check-in'}
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-xs px-1">
              <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
              {isRu ? 'Правила' : 'Rules'}
            </TabsTrigger>
          </TabsList>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-4">
            {/* Base Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {isRu ? 'Базовая цена' : 'Base Pricing'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Цена за ночь' : 'Price per night'}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                    <Select
                      value={formData.deposit_currency}
                      onValueChange={(v) => setFormData({ ...formData, deposit_currency: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">THB ฿</SelectItem>
                        <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem>
                        <SelectItem value="RUB">RUB ₽</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{isRu ? 'Мин. ночей' : 'Min. nights'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.min_stay_nights}
                    onChange={(e) => setFormData({ ...formData, min_stay_nights: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discounts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Percent className="h-4 w-4 text-primary" />
                  {isRu ? 'Скидки за срок' : 'Length Discounts'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Скидка за неделю (%)' : 'Weekly discount (%)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.weekly_discount}
                      onChange={(e) => setFormData({ ...formData, weekly_discount: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Скидка за месяц (%)' : 'Monthly discount (%)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="70"
                      value={formData.monthly_discount}
                      onChange={(e) => setFormData({ ...formData, monthly_discount: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  {isRu ? 'Залог' : 'Security Deposit'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Сумма залога' : 'Deposit amount'}</Label>
                    <Input
                      type="number"
                      value={formData.deposit_amount}
                      onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Тип залога' : 'Deposit type'}</Label>
                    <Select
                      value={formData.deposit_type}
                      onValueChange={(v) => setFormData({ ...formData, deposit_type: v })}
                    >
                      <SelectTrigger className="mt-1">
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

            {/* Extra Guests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  {isRu ? 'Гости' : 'Guests'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isRu ? 'Макс. гостей' : 'Max guests'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                    placeholder={isRu ? 'Не ограничено' : 'No limit'}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Доплата за гостя' : 'Extra guest fee'}</Label>
                    <Input
                      type="number"
                      value={formData.extra_guest_price}
                      onChange={(e) => setFormData({ ...formData, extra_guest_price: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'После скольки гостей' : 'After guests'}</Label>
                    <Input
                      type="number"
                      value={formData.extra_guest_threshold}
                      onChange={(e) => setFormData({ ...formData, extra_guest_threshold: e.target.value })}
                      placeholder="2"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation & Booking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {isRu ? 'Бронирование' : 'Booking'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Cancellation Policy Selector */}
                <CancellationPolicySelector
                  value={formData.cancellation_policy}
                  onChange={(v) => setFormData({ ...formData, cancellation_policy: v })}
                />

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">
                      {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRu 
                        ? 'Гости могут бронировать без одобрения' 
                        : 'Guests can book without approval'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.instant_booking}
                    onCheckedChange={(checked) => setFormData({ ...formData, instant_booking: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTILITIES TAB */}
          <TabsContent value="utilities" className="space-y-4">
            {/* Included Services */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isRu ? 'Что включено' : 'Included Services'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {INCLUDED_SERVICES_OPTIONS.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        id={service.id}
                        checked={formData.included_services.includes(service.id)}
                        onCheckedChange={() => toggleIncludedService(service.id)}
                      />
                      <Label htmlFor={service.id} className="text-sm cursor-pointer flex items-center gap-1">
                        <service.icon className="h-3 w-3 text-muted-foreground" />
                        {isRu ? service.labelRu : service.labelEn}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Electricity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-warning" />
                  {isRu ? 'Электричество' : 'Electricity'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Электричество включено' : 'Electricity included'}
                  </p>
                  <Switch
                    checked={formData.electricity_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, electricity_included: checked })}
                  />
                </div>

                {!formData.electricity_included && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isRu ? 'Цена за кВт (THB)' : 'Price per kWh (THB)'}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.electricity_unit_price}
                          onChange={(e) => setFormData({ ...formData, electricity_unit_price: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{isRu ? 'Поставщик' : 'Provider'}</Label>
                        <Select
                          value={formData.electricity_provider}
                          onValueChange={(v) => setFormData({ ...formData, electricity_provider: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ELECTRICITY_PROVIDERS.map((prov) => (
                              <SelectItem key={prov.value} value={prov.value}>
                                {isRu ? prov.labelRu : prov.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>{isRu ? 'Способ учёта' : 'Metering method'}</Label>
                      <Select
                        value={formData.electricity_metering}
                        onValueChange={(v) => setFormData({ ...formData, electricity_metering: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ELECTRICITY_METERING.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {isRu ? method.labelRu : method.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isRu ? 'Примечание (EN)' : 'Note (EN)'}</Label>
                      <Input
                        value={formData.electricity_notes}
                        onChange={(e) => setFormData({ ...formData, electricity_notes: e.target.value })}
                        placeholder={isRu ? 'Средний расход ~3,000 THB/мес' : 'Average usage ~3,000 THB/month'}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Water */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Droplets className="h-4 w-4 text-info" />
                  {isRu ? 'Вода' : 'Water'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Вода включена' : 'Water included'}
                  </p>
                  <Switch
                    checked={formData.water_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, water_included: checked })}
                  />
                </div>

                {!formData.water_included && (
                  <div>
                    <Label>{isRu ? 'Цена за юнит (THB)' : 'Price per unit (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.water_unit_price}
                      onChange={(e) => setFormData({ ...formData, water_unit_price: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internet */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wifi className="h-4 w-4 text-primary" />
                  {isRu ? 'Интернет' : 'Internet'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Скорость' : 'Speed'}</Label>
                    <Input
                      value={formData.internet_speed}
                      onChange={(e) => setFormData({ ...formData, internet_speed: e.target.value })}
                      placeholder="100 Mbps"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Провайдер' : 'Provider'}</Label>
                    <Input
                      value={formData.internet_provider}
                      onChange={(e) => setFormData({ ...formData, internet_provider: e.target.value })}
                      placeholder="AIS, True, 3BB"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cleaning */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isRu ? 'Уборка' : 'Cleaning'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Уборка включена' : 'Cleaning included'}
                  </p>
                  <Switch
                    checked={formData.cleaning_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, cleaning_included: checked })}
                  />
                </div>

                {formData.cleaning_included && (
                  <div>
                    <Label>{isRu ? 'Частота уборки' : 'Cleaning frequency'}</Label>
                    <Select
                      value={formData.cleaning_frequency}
                      onValueChange={(v) => setFormData({ ...formData, cleaning_frequency: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLEANING_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {isRu ? freq.labelRu : freq.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Доп. уборка (THB)' : 'Extra cleaning (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.extra_cleaning_price}
                      onChange={(e) => setFormData({ ...formData, extra_cleaning_price: e.target.value })}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Смена белья (THB)' : 'Linen change (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.linen_change_price}
                      onChange={(e) => setFormData({ ...formData, linen_change_price: e.target.value })}
                      placeholder="300"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-primary" />
                  {isRu ? 'Парковка' : 'Parking'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Парковка включена' : 'Parking included'}
                  </p>
                  <Switch
                    checked={formData.parking_included}
                    onCheckedChange={(checked) => setFormData({ ...formData, parking_included: checked })}
                  />
                </div>

                {formData.parking_included && (
                  <div>
                    <Label>{isRu ? 'Мест для авто' : 'Parking spaces'}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.parking_spaces}
                      onChange={(e) => setFormData({ ...formData, parking_spaces: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plane className="h-4 w-4 text-primary" />
                  {isRu ? 'Трансфер' : 'Transfer'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Трансфер доступен' : 'Transfer available'}
                  </p>
                  <Switch
                    checked={formData.transfer_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, transfer_available: checked })}
                  />
                </div>

                {formData.transfer_available && (
                  <>
                    <div>
                      <Label>{isRu ? 'Трансфер из аэропорта (THB)' : 'Airport transfer (THB)'}</Label>
                      <Input
                        type="number"
                        value={formData.transfer_airport_price}
                        onChange={(e) => setFormData({ ...formData, transfer_airport_price: e.target.value })}
                        placeholder="1200"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{isRu ? 'Примечание (EN)' : 'Note (EN)'}</Label>
                      <Input
                        value={formData.transfer_notes}
                        onChange={(e) => setFormData({ ...formData, transfer_notes: e.target.value })}
                        placeholder={isRu ? 'Минивэн до 6 человек' : 'Minivan for up to 6 people'}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHECK-IN TAB */}
          <TabsContent value="checkin" className="space-y-4">
            {/* Check-in/out Times */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  {isRu ? 'Время заезда/выезда' : 'Check-in/out Times'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Заезд с' : 'Check-in from'}</Label>
                    <Input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Выезд до' : 'Check-out by'}</Label>
                    <Input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Ранний заезд (THB)' : 'Early check-in (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.early_checkin_price}
                      onChange={(e) => setFormData({ ...formData, early_checkin_price: e.target.value })}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Поздний выезд (THB)' : 'Late check-out (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.late_checkout_price}
                      onChange={(e) => setFormData({ ...formData, late_checkout_price: e.target.value })}
                      placeholder="500"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Handover */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4 text-primary" />
                  {isRu ? 'Получение ключей' : 'Key Handover'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isRu ? 'Способ' : 'Method'}</Label>
                  <Select
                    value={formData.key_handover}
                    onValueChange={(v) => setFormData({ ...formData, key_handover: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEY_HANDOVER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {isRu ? opt.labelRu : opt.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{isRu ? 'Инструкции заезда (EN)' : 'Check-in instructions (EN)'}</Label>
                  <Textarea
                    value={formData.check_in_instructions}
                    onChange={(e) => setFormData({ ...formData, check_in_instructions: e.target.value })}
                    placeholder={isRu ? 'Как добраться, где встретиться...' : 'How to arrive, where to meet...'}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>{isRu ? 'Инструкции заезда (RU)' : 'Check-in instructions (RU)'}</Label>
                  <Textarea
                    value={formData.check_in_instructions_ru}
                    onChange={(e) => setFormData({ ...formData, check_in_instructions_ru: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Manager Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4 text-primary" />
                  {isRu ? 'Контакт менеджера' : 'Manager Contact'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isRu ? 'Имя' : 'Name'}</Label>
                  <Input
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                    <Input
                      value={formData.manager_phone}
                      onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                      placeholder="+66..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Line ID</Label>
                    <Input
                      value={formData.manager_line_id}
                      onChange={(e) => setFormData({ ...formData, manager_line_id: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-muted-foreground">{isRu ? 'Экстренный контакт' : 'Emergency contact'}</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder={isRu ? 'Имя' : 'Name'}
                    />
                    <Input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder={isRu ? 'Телефон' : 'Phone'}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Label>{isRu ? 'Языки' : 'Languages'}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['en', 'ru', 'th', 'zh'].map((lang) => (
                      <Button
                        key={lang}
                        type="button"
                        variant={formData.host_languages.includes(lang) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang === 'th' ? 'ไทย' : '中文'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RULES TAB */}
          <TabsContent value="rules" className="space-y-4">
            {/* House Rules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  {isRu ? 'Правила дома' : 'House Rules'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>English</Label>
                  <Textarea
                    value={formData.house_rules}
                    onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })}
                    placeholder="• No smoking inside&#10;• No parties&#10;• Quiet hours after 22:00"
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Русский</Label>
                  <Textarea
                    value={formData.house_rules_ru}
                    onChange={(e) => setFormData({ ...formData, house_rules_ru: e.target.value })}
                    placeholder="• Не курить в помещении&#10;• Без вечеринок&#10;• Тишина после 22:00"
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours & Parties */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Volume2 className="h-4 w-4 text-primary" />
                  {isRu ? 'Тихие часы' : 'Quiet Hours'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Тишина с' : 'Quiet from'}</Label>
                    <Input
                      type="time"
                      value={formData.quiet_hours_start}
                      onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'До' : 'Until'}</Label>
                    <Input
                      type="time"
                      value={formData.quiet_hours_end}
                      onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {isRu ? 'Вечеринки разрешены' : 'Parties allowed'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.parties_allowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, parties_allowed: checked })}
                  />
                </div>

                {formData.parties_allowed && (
                  <div>
                    <Label>{isRu ? 'Макс. гостей на вечеринке' : 'Max party guests'}</Label>
                    <Input
                      type="number"
                      value={formData.max_party_guests}
                      onChange={(e) => setFormData({ ...formData, max_party_guests: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PawPrint className="h-4 w-4 text-primary" />
                  {isRu ? 'Питомцы' : 'Pets'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Питомцы разрешены' : 'Pets allowed'}
                  </p>
                  <Switch
                    checked={formData.pets_allowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, pets_allowed: checked })}
                  />
                </div>

                {formData.pets_allowed && (
                  <>
                    <div>
                      <Label>{isRu ? 'Депозит за питомца (THB)' : 'Pet deposit (THB)'}</Label>
                      <Input
                        type="number"
                        value={formData.pet_deposit}
                        onChange={(e) => setFormData({ ...formData, pet_deposit: e.target.value })}
                        placeholder="3000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{isRu ? 'Примечание (EN)' : 'Note (EN)'}</Label>
                      <Input
                        value={formData.pet_notes}
                        onChange={(e) => setFormData({ ...formData, pet_notes: e.target.value })}
                        placeholder={isRu ? 'Только маленькие собаки до 10 кг' : 'Small dogs under 10kg only'}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Children */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Baby className="h-4 w-4 text-primary" />
                  {isRu ? 'Для детей' : 'Children'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">
                    {isRu ? 'Подходит для детей' : 'Children friendly'}
                  </p>
                  <Switch
                    checked={formData.children_friendly}
                    onCheckedChange={(checked) => setFormData({ ...formData, children_friendly: checked })}
                  />
                </div>

                {formData.children_friendly && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="crib"
                        checked={formData.has_crib}
                        onCheckedChange={(checked) => setFormData({ ...formData, has_crib: !!checked })}
                      />
                      <Label htmlFor="crib" className="text-sm cursor-pointer">
                        {isRu ? 'Детская кроватка' : 'Baby crib available'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="highchair"
                        checked={formData.has_high_chair}
                        onCheckedChange={(checked) => setFormData({ ...formData, has_high_chair: !!checked })}
                      />
                      <Label htmlFor="highchair" className="text-sm cursor-pointer">
                        {isRu ? 'Детский стульчик' : 'High chair available'}
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Penalties */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-destructive" />
                  {isRu ? 'Штрафы' : 'Penalties'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Поздний выезд (THB)' : 'Late checkout (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.late_checkout_penalty}
                      onChange={(e) => setFormData({ ...formData, late_checkout_penalty: e.target.value })}
                      placeholder="1000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Курение (THB)' : 'Smoking (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.smoking_penalty}
                      onChange={(e) => setFormData({ ...formData, smoking_penalty: e.target.value })}
                      placeholder="5000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Fixed Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button type="submit" className="w-full" disabled={updateProperty.isPending}>
            {updateProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRu ? 'Сохранить условия' : 'Save Terms'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
