import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty, OwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyWizard } from '@/components/owner/PropertyWizard';
import { PropertyRooms, Room } from '@/components/property/PropertyRooms';
import { PropertyCalendar, AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { SeasonalPricing, SeasonalPrice } from '@/components/property/SeasonalPricing';
import { PropertyHighlights } from '@/components/property/PropertyHighlights';
import { PropertyPreviewCard } from '@/components/property/PropertyPreviewCard';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Home, MapPin, Bed, Bath, SquareStack, Upload, Loader2, DollarSign, Clock, Users,
  Zap, Droplets, Sparkles, Car, PawPrint, Baby, Volume2, PartyPopper, Key, FileText,
  Settings, Calendar, Eye, UsersRound
} from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { useToast } from '@/hooks/use-toast';
import { createErrorHandler } from '@/lib/errorHandler';
import { PropertyTeamTab } from '@/components/owner/PropertyTeamTab';

// Extended wizard steps
const editorSteps = [
  { id: 'basic', title: 'Basic Info', titleRu: 'Основное', icon: <Home className="h-4 w-4" /> },
  { id: 'spaces', title: 'Rooms & Beds', titleRu: 'Комнаты', icon: <Bed className="h-4 w-4" /> },
  { id: 'location', title: 'Location', titleRu: 'Адрес', icon: <MapPin className="h-4 w-4" /> },
  { id: 'photos', title: 'Photos', titleRu: 'Фото', icon: <Upload className="h-4 w-4" /> },
  { id: 'pricing', title: 'Pricing', titleRu: 'Цены', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'calendar', title: 'Calendar', titleRu: 'Календарь', icon: <Calendar className="h-4 w-4" /> },
  { id: 'utilities', title: 'Utilities', titleRu: 'Услуги', icon: <Zap className="h-4 w-4" /> },
  { id: 'rules', title: 'Rules', titleRu: 'Правила', icon: <FileText className="h-4 w-4" /> },
  { id: 'team', title: 'Team', titleRu: 'Команда', icon: <UsersRound className="h-4 w-4" /> },
];

// Import centralized taxonomy
import { 
  PHUKET_DISTRICTS, 
  PROPERTY_TYPES,
  normalizeDistrictId,
  normalizePropertyType,
} from '@/lib/taxonomies';

// Use centralized taxonomy data
const districts = PHUKET_DISTRICTS.map(d => d.id);
const propertyTypes = PROPERTY_TYPES.map(t => ({
  value: t.id,
  labelEn: t.labelEn,
  labelRu: t.labelRu,
}));

const managementTypes = [
  { value: 'owner', labelEn: 'Self-Managed by Owner', labelRu: 'Управление собственником', desc: 'Owner manages everything' },
  { value: 'full', labelEn: 'Full Management (MC)', labelRu: 'Полное управление (УК)', desc: 'Management company handles everything' },
  { value: 'partial', labelEn: 'Service Partner', labelRu: 'Сервис-партнёр', desc: 'Shared responsibilities' },
  { value: 'self', labelEn: 'Listing Only', labelRu: 'Только листинг', desc: 'Platform listing only' },
];

const cancellationPolicies = [
  { value: 'flexible', labelEn: 'Flexible (24h)', labelRu: 'Гибкая (24ч)' },
  { value: 'moderate', labelEn: 'Moderate (5 days)', labelRu: 'Умеренная (5 дней)' },
  { value: 'strict', labelEn: 'Strict (7 days, 50%)', labelRu: 'Строгая (7 дней, 50%)' },
  { value: 'non_refundable', labelEn: 'Non-refundable', labelRu: 'Без возврата' },
];

const keyHandoverOptions = [
  { value: 'in_person', labelEn: 'In person', labelRu: 'Лично' },
  { value: 'lockbox', labelEn: 'Lockbox', labelRu: 'Сейф с кодом' },
  { value: 'doorman', labelEn: 'Doorman', labelRu: 'Консьерж' },
  { value: 'self_service', labelEn: 'Smart lock', labelRu: 'Умный замок' },
];

interface EditorFormData {
  // Basic
  title: string;
  title_ru: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  management_type: string;
  is_rented: boolean;
  description_en: string;
  description_ru: string;
  highlights: string[];
  // Rooms
  rooms: Room[];
  // Location
  address: string;
  district: string;
  lat?: number;
  lng?: number;
  // Photos
  cover_image: string;
  images: string[];
  // Pricing
  price_per_night: string;
  deposit_amount: string;
  deposit_currency: string;
  weekly_discount: string;
  monthly_discount: string;
  seasonal_pricing: SeasonalPrice[];
  // Booking
  min_stay_nights: number;
  max_guests: number;
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
  // Utilities
  electricity_included: boolean;
  electricity_unit_price: string;
  water_included: boolean;
  water_unit_price: string;
  internet_speed: string;
  cleaning_included: boolean;
  cleaning_frequency: string;
  extra_cleaning_price: string;
  parking_included: boolean;
  parking_spaces: string;
  // Guests
  pets_allowed: boolean;
  pet_deposit: string;
  children_friendly: boolean;
  has_crib: boolean;
  has_high_chair: boolean;
  // Rules
  quiet_hours_start: string;
  quiet_hours_end: string;
  parties_allowed: boolean;
  house_rules: string;
  house_rules_ru: string;
  smoking_penalty: string;
}

const DEFAULT_FORM_DATA: EditorFormData = {
  title: '',
  title_ru: '',
  property_type: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  area_sqm: '',
  management_type: 'full',
  is_rented: false,
  description_en: '',
  description_ru: '',
  highlights: [],
  rooms: [],
  address: '',
  district: '',
  lat: undefined,
  lng: undefined,
  cover_image: '',
  images: [],
  price_per_night: '',
  deposit_amount: '',
  deposit_currency: 'THB',
  weekly_discount: '0',
  monthly_discount: '0',
  seasonal_pricing: [],
  min_stay_nights: 1,
  max_guests: 2,
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
  water_included: true,
  water_unit_price: '',
  internet_speed: '',
  cleaning_included: true,
  cleaning_frequency: 'weekly',
  extra_cleaning_price: '',
  parking_included: true,
  parking_spaces: '1',
  pets_allowed: false,
  pet_deposit: '',
  children_friendly: true,
  has_crib: false,
  has_high_chair: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  parties_allowed: false,
  house_rules: '',
  house_rules_ru: '',
  smoking_penalty: '',
};

export default function PropertyEditor() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRu = language === 'ru';
  const errorLog = createErrorHandler('PropertyEditor');
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();
  const { availability, syncAvailability, isSaving: isSavingAvailability } = usePropertyAvailabilityManagement(id);

  const draftKey = `property_editor_${id}`;
  const [hasDraftToRestore] = useState(() => !!localStorage.getItem(`vendor_draft_${draftKey}`));
  const [draftRestored, setDraftRestored] = useState(false);

  const [formData, setFormData] = useState<EditorFormData>(DEFAULT_FORM_DATA);
  const [localAvailability, setLocalAvailability] = useState<AvailabilityEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-save draft to localStorage on every change (debounced)
  const draftTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Don't save until we have real data (not just defaults)
    if (!property && !draftRestored) return;
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`vendor_draft_${draftKey}`, JSON.stringify(formData));
      } catch { /* quota exceeded — ignore */ }
    }, 800);
    return () => { if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current); };
  }, [formData, draftKey, property, draftRestored]);

  // Clear draft on successful save
  const clearEditorDraft = () => {
    localStorage.removeItem(`vendor_draft_${draftKey}`);
  };

  // Populate form when property data is loaded
  useEffect(() => {
    if (!property) return;
    // If there's a saved draft, don't overwrite it — let user decide
    if (hasDraftToRestore && !draftRestored) return;
    setFormData({
      title: property.title || '',
      title_ru: property.title_ru || '',
      property_type: property.property_type || 'apartment',
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      area_sqm: property.area_sqm?.toString() || '',
      management_type: property.management_type || 'full',
      is_rented: property.is_rented || false,
      description_en: property.description_en || '',
      description_ru: property.description_ru || '',
      highlights: property.highlights || [],
      rooms: (property.rooms as unknown as Room[]) || [],
      address: property.address || '',
      district: property.district || '',
      lat: property.lat,
      lng: property.lng,
      cover_image: property.cover_image || '',
      images: property.images || [],
      price_per_night: property.price_per_night?.toString() || '',
      deposit_amount: property.deposit_amount?.toString() || '',
      deposit_currency: property.deposit_currency || 'THB',
      weekly_discount: property.weekly_discount?.toString() || '0',
      monthly_discount: property.monthly_discount?.toString() || '0',
      seasonal_pricing: (property.seasonal_pricing as unknown as SeasonalPrice[]) || [],
      min_stay_nights: property.min_stay_nights || 1,
      max_guests: property.max_guests || 2,
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
      water_included: property.water_included ?? true,
      water_unit_price: property.water_unit_price?.toString() || '',
      internet_speed: property.internet_speed || '',
      cleaning_included: property.cleaning_included ?? true,
      cleaning_frequency: property.cleaning_frequency || 'weekly',
      extra_cleaning_price: property.extra_cleaning_price?.toString() || '',
      parking_included: property.parking_included ?? true,
      parking_spaces: property.parking_spaces?.toString() || '1',
      pets_allowed: property.pets_allowed || false,
      pet_deposit: property.pet_deposit?.toString() || '',
      children_friendly: property.children_friendly ?? true,
      has_crib: property.has_crib || false,
      has_high_chair: property.has_high_chair || false,
      quiet_hours_start: property.quiet_hours_start || '22:00',
      quiet_hours_end: property.quiet_hours_end || '08:00',
      parties_allowed: property.parties_allowed || false,
      house_rules: property.house_rules || '',
      house_rules_ru: property.house_rules_ru || '',
      smoking_penalty: property.smoking_penalty?.toString() || '',
    });
  }, [property, hasDraftToRestore, draftRestored]);

  // Sync availability from hook
  useEffect(() => {
    if (availability) {
      setLocalAvailability(availability);
    }
  }, [availability]);

  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        return !!formData.title && !!formData.property_type;
      case 'location':
        return !!formData.address;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    try {
      // Save property data
      await updateProperty.mutateAsync({
        id,
        title: formData.title,
        title_ru: formData.title_ru,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
        management_type: formData.management_type,
        is_rented: formData.is_rented,
        description_en: formData.description_en,
        description_ru: formData.description_ru,
        highlights: formData.highlights,
        rooms: formData.rooms,
        address: formData.address,
        district: formData.district,
        lat: formData.lat,
        lng: formData.lng,
        cover_image: formData.cover_image,
        images: formData.images,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
        deposit_currency: formData.deposit_currency,
        weekly_discount: Number(formData.weekly_discount) || 0,
        monthly_discount: Number(formData.monthly_discount) || 0,
        seasonal_pricing: formData.seasonal_pricing,
        min_stay_nights: formData.min_stay_nights,
        max_guests: formData.max_guests,
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
        water_included: formData.water_included,
        water_unit_price: formData.water_unit_price ? Number(formData.water_unit_price) : null,
        internet_speed: formData.internet_speed || null,
        cleaning_included: formData.cleaning_included,
        cleaning_frequency: formData.cleaning_frequency,
        extra_cleaning_price: formData.extra_cleaning_price ? Number(formData.extra_cleaning_price) : null,
        parking_included: formData.parking_included,
        parking_spaces: formData.parking_spaces ? Number(formData.parking_spaces) : 1,
        pets_allowed: formData.pets_allowed,
        pet_deposit: formData.pet_deposit ? Number(formData.pet_deposit) : null,
        children_friendly: formData.children_friendly,
        has_crib: formData.has_crib,
        has_high_chair: formData.has_high_chair,
        quiet_hours_start: formData.quiet_hours_start,
        quiet_hours_end: formData.quiet_hours_end,
        parties_allowed: formData.parties_allowed,
        house_rules: formData.house_rules || null,
        house_rules_ru: formData.house_rules_ru || null,
        smoking_penalty: formData.smoking_penalty ? Number(formData.smoking_penalty) : null,
      } as any);

      // Save availability
      await syncAvailability(localAvailability);

      clearEditorDraft();

      // If SW update was deferred, reload now that draft is saved
      if ((window as any).__swPendingReload) {
        window.location.reload();
        return;
      }

      toast({
        title: isRu ? 'Сохранено' : 'Saved',
        description: isRu ? 'Изменения успешно сохранены' : 'Changes saved successfully',
      });

      navigate(`/owner/properties/${id}`);
    } catch (error) {
      errorLog.error(error, 'save_property');
    }
  };

  const handleImageUpload = (url: string) => {
    if (!formData.cover_image) {
      setFormData(prev => ({ ...prev, cover_image: url }));
    } else {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const removeImage = (index: number) => {
    if (index === -1) {
      if (formData.images.length > 0) {
        setFormData(prev => ({
          ...prev,
          cover_image: prev.images[0],
          images: prev.images.slice(1)
        }));
      } else {
        setFormData(prev => ({ ...prev, cover_image: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const renderStep = (stepId: string): ReactNode => {
    switch (stepId) {
      case 'basic':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Основная информация' : 'Basic Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Название (EN)' : 'Title (EN)'} *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Modern Villa with Pool"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Название (RU)' : 'Title (RU)'}</Label>
                    <Input
                      value={formData.title_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                      placeholder="Современная вилла с бассейном"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Тип недвижимости' : 'Property Type'} *</Label>
                    <Select 
                      value={formData.property_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {isRu ? type.labelRu : type.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Тип управления' : 'Management Type'}</Label>
                    <Select 
                      value={formData.management_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, management_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {managementTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {isRu ? type.labelRu : type.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {isRu ? 'Спальни' : 'Bedrooms'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bedrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {isRu ? 'Ванные' : 'Bathrooms'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.bathrooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <SquareStack className="h-3 w-3" />
                      {isRu ? 'Площадь (м²)' : 'Area (m²)'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.area_sqm}
                      onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <PropertyHighlights
              highlights={formData.highlights}
              onChange={(highlights) => setFormData(prev => ({ ...prev, highlights }))}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Описание' : 'Description'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    placeholder="Опишите вашу недвижимость..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'spaces':
        return (
          <PropertyRooms
            rooms={formData.rooms}
            onChange={(rooms) => setFormData(prev => ({ ...prev, rooms }))}
          />
        );

      case 'location':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {isRu ? 'Расположение' : 'Location'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Адрес' : 'Address'} *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Beach Road, Patong"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Район' : 'District'}</Label>
                <Select 
                  value={formData.district}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ProjectLocationPicker
                value={formData.lat && formData.lng ? { 
                  lat: formData.lat, 
                  lng: formData.lng, 
                  address: formData.address 
                } : undefined}
                onChange={(location) => {
                  setFormData(prev => ({
                    ...prev,
                    lat: location.lat,
                    lng: location.lng,
                    address: location.address || prev.address,
                  }));
                }}
              />
            </CardContent>
          </Card>
        );

      case 'photos':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {isRu ? 'Фотографии' : 'Photos'}
              </CardTitle>
              <CardDescription>
                {isRu ? 'Первое фото станет обложкой' : 'First photo will be the cover'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload 
                onChange={handleImageUpload}
                folder="owner-properties"
              />

              {(formData.cover_image || formData.images.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.cover_image && (
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-primary">
                      <img 
                        src={formData.cover_image} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        {isRu ? 'Обложка' : 'Cover'}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(-1)}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden border">
                      <img 
                        src={url} 
                        alt={`Photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Базовые цены' : 'Base Pricing'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Цена за ночь (THB)' : 'Price per night (THB)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.price_per_night}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                      placeholder="2500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Депозит (THB)' : 'Deposit (THB)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.deposit_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                      placeholder="10000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Скидка за неделю (%)' : 'Weekly discount (%)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.weekly_discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekly_discount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Скидка за месяц (%)' : 'Monthly discount (%)'}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.monthly_discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_discount: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, min_stay_nights: Number(e.target.value) }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, max_guests: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Политика отмены' : 'Cancellation Policy'}</Label>
                  <Select 
                    value={formData.cancellation_policy}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cancellation_policy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cancellationPolicies.map((policy) => (
                        <SelectItem key={policy.value} value={policy.value}>
                          {isRu ? policy.labelRu : policy.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <SeasonalPricing
              basePrice={Number(formData.price_per_night) || 0}
              currency="THB"
              seasons={formData.seasonal_pricing}
              onChange={(seasons) => setFormData(prev => ({ ...prev, seasonal_pricing: seasons }))}
            />
          </div>
        );

      case 'calendar':
        return (
          <PropertyCalendar
            availability={localAvailability}
            onChange={setLocalAvailability}
            basePrice={Number(formData.price_per_night) || 0}
            currency="THB"
          />
        );

      case 'utilities':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Коммунальные услуги' : 'Utilities'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-warning" />
                    <span>{isRu ? 'Электричество включено' : 'Electricity included'}</span>
                  </div>
                  <Switch
                    checked={formData.electricity_included}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, electricity_included: checked }))}
                  />
                </div>
                {!formData.electricity_included && (
                  <div className="space-y-2 pl-6">
                    <Label>{isRu ? 'Цена за кВт⋅ч (THB)' : 'Price per kWh (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.electricity_unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, electricity_unit_price: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-info" />
                    <span>{isRu ? 'Вода включена' : 'Water included'}</span>
                  </div>
                  <Switch
                    checked={formData.water_included}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, water_included: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent-purple" />
                    <span>{isRu ? 'Уборка включена' : 'Cleaning included'}</span>
                  </div>
                  <Switch
                    checked={formData.cleaning_included}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cleaning_included: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-success" />
                    <span>{isRu ? 'Парковка включена' : 'Parking included'}</span>
                  </div>
                  <Switch
                    checked={formData.parking_included}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, parking_included: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Заезд и выезд' : 'Check-in & Check-out'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Заезд' : 'Check-in'}</Label>
                    <Input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Выезд' : 'Check-out'}</Label>
                    <Input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Передача ключей' : 'Key Handover'}</Label>
                  <Select 
                    value={formData.key_handover}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, key_handover: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {keyHandoverOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {isRu ? option.labelRu : option.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Инструкции по заезду (EN)' : 'Check-in Instructions (EN)'}</Label>
                  <Textarea
                    value={formData.check_in_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_in_instructions: e.target.value }))}
                    placeholder="Enter building through main gate, take elevator..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Гости' : 'Guests'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4" />
                    <span>{isRu ? 'Можно с питомцами' : 'Pets allowed'}</span>
                  </div>
                  <Switch
                    checked={formData.pets_allowed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pets_allowed: checked }))}
                  />
                </div>
                {formData.pets_allowed && (
                  <div className="space-y-2 pl-6">
                    <Label>{isRu ? 'Депозит за питомца (THB)' : 'Pet deposit (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.pet_deposit}
                      onChange={(e) => setFormData(prev => ({ ...prev, pet_deposit: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    <span>{isRu ? 'Подходит для детей' : 'Children friendly'}</span>
                  </div>
                  <Switch
                    checked={formData.children_friendly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, children_friendly: checked }))}
                  />
                </div>
                {formData.children_friendly && (
                  <div className="flex gap-4 pl-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.has_crib}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_crib: !!checked }))}
                      />
                      <Label className="text-sm">{isRu ? 'Детская кроватка' : 'Crib available'}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.has_high_chair}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_high_chair: !!checked }))}
                      />
                      <Label className="text-sm">{isRu ? 'Детский стульчик' : 'High chair'}</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Тихие часы и вечеринки' : 'Quiet Hours & Parties'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Volume2 className="h-3 w-3" />
                      {isRu ? 'Тихие часы с' : 'Quiet from'}
                    </Label>
                    <Input
                      type="time"
                      value={formData.quiet_hours_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'до' : 'until'}</Label>
                    <Input
                      type="time"
                      value={formData.quiet_hours_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4" />
                    <span>{isRu ? 'Вечеринки разрешены' : 'Parties allowed'}</span>
                  </div>
                  <Switch
                    checked={formData.parties_allowed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, parties_allowed: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRu ? 'Правила дома' : 'House Rules'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Правила (EN)' : 'Rules (EN)'}</Label>
                  <Textarea
                    value={formData.house_rules}
                    onChange={(e) => setFormData(prev => ({ ...prev, house_rules: e.target.value }))}
                    placeholder="No smoking inside, take off shoes..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Правила (RU)' : 'Rules (RU)'}</Label>
                  <Textarea
                    value={formData.house_rules_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, house_rules_ru: e.target.value }))}
                    placeholder="Не курить внутри, снимать обувь..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'team':
        return (
          <PropertyTeamTab propertyId={id || ''} />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Редактирование' : 'Edit Property'}
          showBack
          fallbackPath="/owner/properties"
        />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Объект не найден' : 'Property Not Found'}
          showBack
          fallbackPath="/owner/properties"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Редактировать объект' : 'Edit Property'}
        showBack
        fallbackPath={`/owner/properties/${id}`}
        subtitle={property.title}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? (isRu ? 'Скрыть превью' : 'Hide Preview') : (isRu ? 'Превью' : 'Preview')}
          </Button>
        }
      />

      {/* Draft Restoration Banner */}
      {hasDraftToRestore && !draftRestored && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            {isRu 
              ? 'Найден несохранённый черновик. Восстановить изменения?' 
              : 'Unsaved draft found. Restore your changes?'}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="default" onClick={() => {
              try {
                const saved = localStorage.getItem(`vendor_draft_${draftKey}`);
                if (saved) setFormData(JSON.parse(saved));
              } catch { /* ignore */ }
              setDraftRestored(true);
              toast({ title: isRu ? 'Черновик восстановлен' : 'Draft restored' });
            }}>
              {isRu ? 'Восстановить' : 'Restore'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              clearEditorDraft();
              setDraftRestored(true);
              toast({ title: isRu ? 'Черновик удалён' : 'Draft discarded' });
            }}>
              {isRu ? 'Нет' : 'Discard'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <PropertyWizard
            onSubmit={handleSubmit}
            isSubmitting={updateProperty.isPending || isSavingAvailability}
            validateStep={validateStep}
          >
            {renderStep}
          </PropertyWizard>
        </div>

        {/* Live Preview Sidebar */}
        {showPreview && (
          <div className="hidden lg:block sticky top-20 h-fit">
            <div className="text-sm font-medium mb-3 text-muted-foreground">
              {isRu ? 'Как будет выглядеть в поиске:' : 'Search result preview:'}
            </div>
            <PropertyPreviewCard
              data={{
                title: formData.title,
                titleRu: formData.title_ru,
                coverImage: formData.cover_image,
                propertyType: formData.property_type,
                district: formData.district,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                maxGuests: formData.max_guests,
                pricePerNight: Number(formData.price_per_night) || undefined,
                currency: 'THB',
                instantBooking: formData.instant_booking,
                highlights: formData.highlights,
              }}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
