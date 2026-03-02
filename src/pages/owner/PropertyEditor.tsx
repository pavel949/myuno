import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyRooms, Room } from '@/components/property/PropertyRooms';
import { PropertyCalendar, AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { SeasonalPrice } from '@/components/property/SeasonalPricing';
import { PropertyTeamTab } from '@/components/owner/PropertyTeamTab';
import { CanonicalPropertyForm, ExtraTab } from '@/components/property/canonical-form/CanonicalPropertyForm';
import { AIIntakePanel } from '@/components/owner/property-wizard/AIIntakePanel';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bed, Calendar, UsersRound, Eye, Loader2, Check, Rocket, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('PropertyEditor');

/**
 * Map DB property to CanonicalPropertyFormData-compatible initial data
 */
function mapPropertyToInitialData(property: any) {
  return {
    title_en: property.title || property.title_en || '',
    title_ru: property.title_ru || '',
    internal_name: property.internal_name || '',
    description_en: property.description_en || property.description || '',
    description_ru: property.description_ru || '',
    address: property.address || '',
    district: property.district || '',
    lat: property.lat,
    lng: property.lng,
    property_type: property.property_type || 'apartment',
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    area_sqm: property.area_sqm?.toString() || '',
    management_type: property.management_type || 'full',
    is_rented: property.is_rented || false,
    cover_image: property.cover_image || '',
    images: property.images || [],
    price_per_night: property.price_per_night?.toString() || '',
    deposit_amount: property.deposit_amount?.toString() || '',
    weekly_discount: property.weekly_discount?.toString() || '0',
    monthly_discount: property.monthly_discount?.toString() || '0',
    min_stay_nights: property.min_stay_nights || 1,
    max_guests: property.max_guests || 2,
    instant_booking: property.instant_booking || false,
    cancellation_policy: property.cancellation_policy || 'flexible',
    check_in_time: property.check_in_time || '14:00',
    check_out_time: property.check_out_time || '12:00',
    highlights: property.highlights || [],
    platform_listed: property.listing_modes?.includes('platform') ?? false,
    project_id: property.project_id,
    floor: property.floor,
    unit_number: property.unit_number || '',
    view_type: property.view_type || '',
    furnishing_level: property.furnishing_level || '',
    equipment: property.equipment || [],
    // Rules
    pets_allowed: property.pets_allowed || false,
    pet_deposit: property.pet_deposit?.toString() || '',
    smoking_allowed: property.smoking_allowed,
    smoking_penalty: property.smoking_penalty?.toString() || '',
    children_friendly: property.children_friendly ?? true,
    has_crib: property.has_crib || false,
    has_high_chair: property.has_high_chair || false,
    parties_allowed: property.parties_allowed || false,
    quiet_hours_start: property.quiet_hours_start || '22:00',
    quiet_hours_end: property.quiet_hours_end || '08:00',
    house_rules: property.house_rules || '',
    house_rules_ru: property.house_rules_ru || '',
    // Utilities
    electricity_included: property.electricity_included || false,
    electricity_unit_price: property.electricity_unit_price ?? 7,
    electricity_provider: property.electricity_provider,
    electricity_metering: property.electricity_metering,
    water_included: property.water_included ?? true,
    water_unit_price: property.water_unit_price,
    internet_speed: property.internet_speed,
    internet_provider: property.internet_provider,
    // Services
    cleaning_included: property.cleaning_included ?? true,
    cleaning_frequency: property.cleaning_frequency || 'weekly',
    extra_cleaning_price: property.extra_cleaning_price,
    linen_change_price: property.linen_change_price,
    linen_change_frequency: property.linen_change_frequency,
    early_checkin_price: property.early_checkin_price,
    late_checkout_price: property.late_checkout_price,
    transfer_available: property.transfer_available,
    transfer_airport_price: property.transfer_airport_price,
    extra_guest_price: property.extra_guest_price,
    extra_guest_threshold: property.extra_guest_threshold,
  };
}

export default function PropertyEditor() {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRu = language === 'ru';

  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();
  const { availability, syncAvailability, isSaving: isSavingAvailability } = usePropertyAvailabilityManagement(id);

  // Draft persistence
  const draftKey = `property_editor_${id}`;
  const [hasDraftToRestore] = useState(() => !!localStorage.getItem(`vendor_draft_${draftKey}`));
  const [draftRestored, setDraftRestored] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Rooms & Calendar local state (not in CanonicalPropertyForm)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [localAvailability, setLocalAvailability] = useState<AvailabilityEntry[]>([]);

  // Controlled form data for CanonicalPropertyForm
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [utilitiesData, setUtilitiesData] = useState<Record<string, any>>({});
  const [servicesData, setServicesData] = useState<Record<string, any>>({});

  // Populate from property data
  useEffect(() => {
    if (!property) return;
    if (hasDraftToRestore && !draftRestored) return;

    const mapped = mapPropertyToInitialData(property);
    // Set form data from mapped initial
    setFormData({
      title: mapped.title_en,
      title_ru: mapped.title_ru,
      internal_name: mapped.internal_name,
      address: mapped.address,
      district: mapped.district,
      lat: mapped.lat,
      lng: mapped.lng,
      property_type: mapped.property_type,
      bedrooms: mapped.bedrooms,
      bathrooms: mapped.bathrooms,
      area_sqm: mapped.area_sqm,
      description: mapped.description_en,
      description_ru: mapped.description_ru,
      cover_image: mapped.cover_image,
      images: mapped.images,
      management_type: mapped.management_type,
      is_rented: mapped.is_rented,
      rental_platforms: [],
      custom_platform: '',
      project_id: mapped.project_id,
      floor: mapped.floor,
      unit_number: mapped.unit_number,
      view_type: mapped.view_type,
      furnishing_level: mapped.furnishing_level,
      equipment: mapped.equipment,
      price_per_night: mapped.price_per_night,
      min_stay_nights: mapped.min_stay_nights,
      max_guests: mapped.max_guests,
      deposit_amount: mapped.deposit_amount,
      check_in_time: mapped.check_in_time,
      check_out_time: mapped.check_out_time,
      instant_booking: mapped.instant_booking,
      is_for_sale: false,
      sale_price: '',
      pets_allowed: mapped.pets_allowed,
      pet_deposit: mapped.pet_deposit,
      smoking_allowed: mapped.smoking_allowed,
      smoking_penalty: mapped.smoking_penalty,
      children_friendly: mapped.children_friendly,
      has_crib: mapped.has_crib,
      has_high_chair: mapped.has_high_chair,
      parties_allowed: mapped.parties_allowed,
      quiet_hours_start: mapped.quiet_hours_start,
      quiet_hours_end: mapped.quiet_hours_end,
      house_rules: mapped.house_rules,
      house_rules_ru: mapped.house_rules_ru,
      cancellation_policy: mapped.cancellation_policy,
      weekly_discount: mapped.weekly_discount,
      monthly_discount: mapped.monthly_discount,
      seasonal_pricing: (property.seasonal_pricing as unknown as SeasonalPrice[]) || [],
      highlights: mapped.highlights,
    } as PropertyFormData);

    setUtilitiesData({
      electricity_included: mapped.electricity_included,
      electricity_unit_price: mapped.electricity_unit_price,
      electricity_provider: mapped.electricity_provider,
      electricity_metering: mapped.electricity_metering,
      water_included: mapped.water_included,
      water_unit_price: mapped.water_unit_price,
      internet_speed: mapped.internet_speed,
      internet_provider: mapped.internet_provider,
    });

    setServicesData({
      cleaning_included: mapped.cleaning_included,
      cleaning_frequency: mapped.cleaning_frequency,
      extra_cleaning_price: mapped.extra_cleaning_price,
      linen_change_price: mapped.linen_change_price,
      linen_change_frequency: mapped.linen_change_frequency,
      early_checkin_price: mapped.early_checkin_price,
      late_checkout_price: mapped.late_checkout_price,
      transfer_available: mapped.transfer_available,
      transfer_airport_price: mapped.transfer_airport_price,
      extra_guest_price: mapped.extra_guest_price,
      extra_guest_threshold: mapped.extra_guest_threshold,
    });

    setRooms((property.rooms as unknown as Room[]) || []);
  }, [property, hasDraftToRestore, draftRestored]);

  // Sync availability
  useEffect(() => {
    if (availability) setLocalAvailability(availability);
  }, [availability]);

  // Draft auto-save
  const draftTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!property && !draftRestored) return;
    if (!formData) return;
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`vendor_draft_${draftKey}`, JSON.stringify({ formData, rooms }));
      } catch { /* quota exceeded */ }
    }, 800);
    return () => { if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current); };
  }, [formData, rooms, draftKey, property, draftRestored]);

  const clearEditorDraft = () => localStorage.removeItem(`vendor_draft_${draftKey}`);

  // AI Intake merge: only fills empty/missing fields, never overwrites existing data
  const handleAIMerge = useCallback((extracted: Record<string, any>) => {
    if (!formData) return;

    const fieldMap: Record<string, keyof PropertyFormData> = {
      title: 'title',
      title_ru: 'title_ru',
      description: 'description',
      description_ru: 'description_ru',
      address: 'address',
      district: 'district',
      property_type: 'property_type',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      area_sqm: 'area_sqm',
      price_per_night: 'price_per_night',
      max_guests: 'max_guests',
      deposit_amount: 'deposit_amount',
    };

    const updates: Partial<PropertyFormData> = {};
    let filled = 0;

    for (const [extractedKey, formKey] of Object.entries(fieldMap)) {
      const extractedVal = extracted[extractedKey];
      if (extractedVal == null || extractedVal === '') continue;

      const currentVal = formData[formKey];
      // Only fill if current value is empty/falsy (but keep 0 as valid)
      const isEmpty = currentVal === '' || currentVal === null || currentVal === undefined;
      if (isEmpty) {
        (updates as any)[formKey] = typeof extractedVal === 'number' ? String(extractedVal) : extractedVal;
        filled++;
      }
    }

    // Merge images: append new ones
    if (extracted.images?.length && formData.images) {
      const existingSet = new Set(formData.images);
      const newImages = extracted.images.filter((img: string) => !existingSet.has(img));
      if (newImages.length > 0) {
        (updates as any).images = [...formData.images, ...newImages];
        filled += newImages.length;
      }
    }
    if (extracted.cover_image && !formData.cover_image) {
      (updates as any).cover_image = extracted.cover_image;
      filled++;
    }

    if (filled > 0) {
      setFormData(prev => prev ? { ...prev, ...updates } : prev);
    }

    return filled;
  }, [formData]);

  const handleSubmit = async () => {
    if (!id || !formData) return;
    try {
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
        description_en: formData.description,
        description_ru: formData.description_ru,
        highlights: formData.highlights,
        rooms,
        address: formData.address,
        district: formData.district,
        lat: formData.lat,
        lng: formData.lng,
        cover_image: formData.cover_image,
        images: formData.images,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
        weekly_discount: Number(formData.weekly_discount) || 0,
        monthly_discount: Number(formData.monthly_discount) || 0,
        seasonal_pricing: formData.seasonal_pricing && formData.seasonal_pricing.length > 0 ? formData.seasonal_pricing : null,
        min_stay_nights: formData.min_stay_nights,
        max_guests: formData.max_guests,
        instant_booking: formData.instant_booking,
        cancellation_policy: formData.cancellation_policy,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        // Utilities
        electricity_included: utilitiesData.electricity_included,
        electricity_unit_price: utilitiesData.electricity_unit_price ? Number(utilitiesData.electricity_unit_price) : null,
        water_included: utilitiesData.water_included,
        water_unit_price: utilitiesData.water_unit_price ? Number(utilitiesData.water_unit_price) : null,
        internet_speed: utilitiesData.internet_speed || null,
        // Services
        cleaning_included: servicesData.cleaning_included,
        cleaning_frequency: servicesData.cleaning_frequency,
        extra_cleaning_price: servicesData.extra_cleaning_price ? Number(servicesData.extra_cleaning_price) : null,
        early_checkin_price: servicesData.early_checkin_price ? Number(servicesData.early_checkin_price) : null,
        late_checkout_price: servicesData.late_checkout_price ? Number(servicesData.late_checkout_price) : null,
        transfer_available: servicesData.transfer_available,
        transfer_airport_price: servicesData.transfer_airport_price ? Number(servicesData.transfer_airport_price) : null,
        // Rules
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
        // Platform listing modes
        listing_modes: [
          ...(formData.platform_listed ? ['platform'] : []),
          ...(formData.is_for_sale ? ['sale'] : []),
          ...(formData.price_per_night ? ['rent'] : []),
        ],
      } as any);

      await syncAvailability(localAvailability);
      clearEditorDraft();

      if ((window as any).__swPendingReload) {
        window.location.reload();
        return;
      }

      toast({
        title: isRu ? 'Сохранено' : 'Saved',
        description: isRu ? 'Изменения успешно сохранены' : 'Changes saved successfully',
      });
      navigate(`/mc/properties/${id}`);
    } catch (error) {
      errorLog.error(error, 'save_property');
    }
  };

  // Extra tabs for owner mode
  const extraTabs: ExtraTab[] = useMemo(() => [
    {
      id: 'rooms',
      icon: Bed,
      labelEn: 'Rooms',
      labelRu: 'Комнаты',
      content: <PropertyRooms rooms={rooms} onChange={setRooms} />,
    },
    {
      id: 'calendar',
      icon: Calendar,
      labelEn: 'Calendar',
      labelRu: 'Календарь',
      content: (
        <PropertyCalendar
          availability={localAvailability}
          onChange={setLocalAvailability}
          basePrice={Number(formData?.price_per_night) || 0}
          currency="THB"
        />
      ),
    },
    {
      id: 'team',
      icon: UsersRound,
      labelEn: 'Team',
      labelRu: 'Команда',
      content: <PropertyTeamTab propertyId={id || ''} />,
    },
  ], [rooms, localAvailability, formData?.price_per_night, formData?.seasonal_pricing, id]);

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Редактирование' : 'Edit Property'} showBack fallbackPath="/mc/properties" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-8 w-1/3 mb-4" /><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Объект не найден' : 'Property Not Found'} showBack fallbackPath="/mc/properties" />
      </PageContainer>
    );
  }

  const isSubmitting = updateProperty.isPending || isSavingAvailability;

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Редактировать объект' : 'Edit Property'}
        showBack
        fallbackPath={`/mc/properties/${id}`}
        subtitle={property.title}
        actions={
          <div className="flex items-center gap-2">
            {property.approval_status === 'approved' && (
              <Button
                variant={property.is_active ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  updateProperty.mutate({
                    id: id!,
                    is_active: !property.is_active,
                  } as any);
                }}
                disabled={updateProperty.isPending}
              >
                {property.is_active ? (
                  <><EyeOff className="h-4 w-4 mr-1" />{isRu ? 'Снять' : 'Unpublish'}</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-1" />{isRu ? 'Опубликовать' : 'Publish'}</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? (isRu ? 'Скрыть' : 'Hide') : (isRu ? 'Превью' : 'Preview')}
            </Button>
          </div>
        }
      />

      {/* Draft Restoration Banner */}
      {hasDraftToRestore && !draftRestored && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            {isRu ? 'Найден несохранённый черновик. Восстановить?' : 'Unsaved draft found. Restore?'}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="default" onClick={() => {
              try {
                const saved = localStorage.getItem(`vendor_draft_${draftKey}`);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed.formData) setFormData(parsed.formData);
                  if (parsed.rooms) setRooms(parsed.rooms);
                }
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

      {/* AI Intake - merge mode for existing property */}
      <AIIntakePanel onDataExtracted={handleAIMerge} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),280px] xl:grid-cols-[minmax(0,1fr),320px]">
        <div>
          {formData && (
            <CanonicalPropertyForm
              mode="owner"
              initialData={mapPropertyToInitialData(property)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(`/mc/properties/${id}`)}
              propertyId={id}
              extraTabs={extraTabs}
              controlledFormData={formData}
              onFormDataChange={setFormData}
              controlledUtilities={utilitiesData}
              onUtilitiesChange={setUtilitiesData}
              controlledServices={servicesData}
              onServicesChange={setServicesData}
            />
          )}
        </div>

        {/* Live Preview Sidebar */}
        {showPreview && formData && (
          <div className="hidden lg:block sticky top-20 h-fit">
            <div className="text-sm font-medium mb-3 text-muted-foreground">
              {isRu ? 'Как будет выглядеть в поиске:' : 'Search result preview:'}
            </div>
            <PropertyListingCard
              property={{
                id: id || 'preview',
                title_en: formData.title || '',
                title_ru: formData.title_ru || '',
                cover_image: formData.cover_image || '',
                images: formData.images || [],
                property_type: formData.property_type || 'apartment',
                district: formData.district || '',
                bedrooms: formData.bedrooms || 1,
                bathrooms: formData.bathrooms || 1,
                max_guests: formData.max_guests || 2,
                price: Number(formData.price_per_night) || 0,
                price_period: 'night',
                instant_booking: formData.instant_booking || false,
                is_featured: false,
              } as any}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
