/**
 * CanonicalPropertyForm - Unified property form for Admin/Vendor/Owner
 * 
 * Full 7-tab form for admin mode: Basic, Location, Photos, Pricing, Utilities, Services, Admin
 * 4-tab form for owner/vendor mode: Basic, Location, Photos, Pricing
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyFormData, OwnershipData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, MapPin, Camera, DollarSign, Loader2, Zap, Sparkles, Shield } from 'lucide-react';

// Import canonical step components from Owner Wizard
import { 
  BasicInfoStep, 
  LocationStep, 
  PhotosStep, 
  PricingStep,
  UtilitiesStep,
  ServicesStep,
  AdminSettingsStep,
} from '@/components/owner/property-wizard/steps';

export interface CanonicalPropertyFormData extends Partial<PropertyFormData> {
  // Admin/Vendor specific fields
  provider_id?: string;
  highlights?: string[];
  listing_modes?: string[];
  listing_type?: string;
  price?: number;
  price_period?: string;
  amenities?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  approval_status?: string;
  rejection_reason?: string;
  commission_rate?: number;
  notes?: string;
  // Map to owner fields
  title_en?: string;
  title_ru?: string;
  description_en?: string;
  description_ru?: string;
  // Utilities
  electricity_included?: boolean;
  electricity_unit_price?: number;
  electricity_provider?: string;
  electricity_metering?: string;
  electricity_notes?: string;
  electricity_notes_ru?: string;
  water_included?: boolean;
  water_unit_price?: number;
  water_notes?: string;
  water_notes_ru?: string;
  internet_speed?: string;
  internet_provider?: string;
  // Services
  cleaning_included?: boolean;
  cleaning_frequency?: string;
  extra_cleaning_price?: number;
  linen_change_price?: number;
  linen_change_frequency?: string;
  early_checkin_price?: number;
  late_checkout_price?: number;
  transfer_available?: boolean;
  transfer_airport_price?: number;
  transfer_notes?: string;
  transfer_notes_ru?: string;
  extra_guest_price?: number;
  extra_guest_threshold?: number;
  // Investment
  purchase_price?: number;
  purchase_date?: string;
  purchase_currency?: string;
  acquisition_costs?: number;
  mortgage_amount?: number;
  mortgage_bank?: string;
  mortgage_interest_rate?: number;
  mortgage_monthly_payment?: number;
  chanote_number?: string;
  ical_export_enabled?: boolean;
}

interface CanonicalPropertyFormProps {
  initialData?: CanonicalPropertyFormData;
  onSubmit: (data: CanonicalPropertyFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode: 'admin' | 'vendor' | 'owner';
  showOwnership?: boolean;
  showProviderSelector?: boolean;
  providerSelector?: React.ReactNode;
}

// Map Admin/Vendor fields to Owner format
function mapToOwnerFormat(data: CanonicalPropertyFormData): PropertyFormData {
  return {
    title: data.title_en || data.title || '',
    title_ru: data.title_ru || '',
    internal_name: data.internal_name || '',
    address: data.address || '',
    district: data.district || '',
    lat: data.lat,
    lng: data.lng,
    property_type: data.property_type || 'apartment',
    bedrooms: data.bedrooms || 1,
    bathrooms: data.bathrooms || 1,
    area_sqm: data.area_sqm || '',
    description: data.description_en || data.description || '',
    description_ru: data.description_ru || '',
    cover_image: data.cover_image || '',
    images: data.images || [],
    management_type: data.management_type || 'self',
    is_rented: data.is_rented || false,
    rental_platforms: data.rental_platforms || [],
    custom_platform: data.custom_platform || '',
    project_id: data.project_id,
    floor: data.floor,
    unit_number: data.unit_number || '',
    total_floors: data.total_floors,
    plot_size_sqm: data.plot_size_sqm,
    has_elevator: data.has_elevator || false,
    parking_type: data.parking_type || '',
    pool_type: data.pool_type || '',
    garden_type: data.garden_type || '',
    view_type: data.view_type || '',
    furnishing_level: data.furnishing_level || '',
    equipment: data.equipment || [],
    price_per_night: data.price_per_night || String(data.price || ''),
    min_stay_nights: data.min_stay_nights || 1,
    max_guests: data.max_guests || 2,
    deposit_amount: data.deposit_amount || '',
    check_in_time: data.check_in_time || '14:00',
    check_out_time: data.check_out_time || '12:00',
    instant_booking: data.instant_booking || false,
    ownership_form: data.ownership_form,
    is_for_sale: data.is_for_sale || (data.listing_modes?.includes('sale') ?? false),
    sale_price: data.sale_price || '',
    pets_allowed: data.pets_allowed,
    pet_deposit: data.pet_deposit,
    smoking_allowed: data.smoking_allowed,
    smoking_penalty: data.smoking_penalty,
    parties_allowed: data.parties_allowed,
    max_party_guests: data.max_party_guests,
    children_friendly: data.children_friendly,
    has_crib: data.has_crib,
    has_high_chair: data.has_high_chair,
    quiet_hours_start: data.quiet_hours_start,
    quiet_hours_end: data.quiet_hours_end,
    house_rules: data.house_rules,
    house_rules_ru: data.house_rules_ru,
    cancellation_policy: data.cancellation_policy,
    weekly_discount: data.weekly_discount,
    monthly_discount: data.monthly_discount,
    highlights: data.highlights || [],
  };
}

// Map back to Admin/Vendor format for submission
function mapFromOwnerFormat(
  ownerData: PropertyFormData, 
  originalData: CanonicalPropertyFormData,
  extraData: ExtraFormData,
): CanonicalPropertyFormData {
  return {
    ...originalData,
    title: ownerData.title,
    title_en: ownerData.title,
    title_ru: ownerData.title_ru,
    internal_name: ownerData.internal_name,
    address: ownerData.address,
    district: ownerData.district,
    lat: ownerData.lat,
    lng: ownerData.lng,
    property_type: ownerData.property_type,
    bedrooms: ownerData.bedrooms,
    bathrooms: ownerData.bathrooms,
    area_sqm: ownerData.area_sqm,
    description: ownerData.description,
    description_en: ownerData.description,
    description_ru: ownerData.description_ru,
    cover_image: ownerData.cover_image,
    images: ownerData.images,
    management_type: ownerData.management_type,
    is_rented: ownerData.is_rented,
    project_id: ownerData.project_id,
    floor: ownerData.floor,
    unit_number: ownerData.unit_number,
    price_per_night: ownerData.price_per_night,
    price: ownerData.price_per_night ? Number(ownerData.price_per_night) : undefined,
    min_stay_nights: ownerData.min_stay_nights,
    max_guests: ownerData.max_guests,
    deposit_amount: ownerData.deposit_amount,
    check_in_time: ownerData.check_in_time,
    check_out_time: ownerData.check_out_time,
    instant_booking: ownerData.instant_booking,
    is_for_sale: ownerData.is_for_sale,
    sale_price: ownerData.sale_price,
    view_type: ownerData.view_type,
    furnishing_level: ownerData.furnishing_level,
    equipment: ownerData.equipment,
    pets_allowed: ownerData.pets_allowed,
    smoking_allowed: ownerData.smoking_allowed,
    parties_allowed: ownerData.parties_allowed,
    children_friendly: ownerData.children_friendly,
    cancellation_policy: ownerData.cancellation_policy,
    weekly_discount: ownerData.weekly_discount,
    monthly_discount: ownerData.monthly_discount,
    house_rules: ownerData.house_rules,
    house_rules_ru: ownerData.house_rules_ru,
    listing_modes: [
      ...(ownerData.is_for_sale ? ['sale'] : []),
      ...(ownerData.price_per_night ? ['rent'] : []),
    ].length > 0 ? [
      ...(ownerData.is_for_sale ? ['sale'] : []),
      ...(ownerData.price_per_night ? ['rent'] : []),
    ] : ['rent'],
    listing_type: ownerData.is_for_sale && !ownerData.price_per_night ? 'sale' : 'rent',
    // Extra data from new tabs
    ...extraData.utilities,
    ...extraData.services,
    ...extraData.admin,
  };
}

interface ExtraFormData {
  utilities: Record<string, any>;
  services: Record<string, any>;
  admin: Record<string, any>;
}

export function CanonicalPropertyForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
  showOwnership = false,
  providerSelector,
}: CanonicalPropertyFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isAdmin = mode === 'admin';
  
  // Convert initial data to Owner format
  const [formData, setFormData] = useState<PropertyFormData>(() => 
    mapToOwnerFormat(initialData)
  );
  
  const [ownershipData, setOwnershipData] = useState<OwnershipData>({
    ownership_type: 'own',
    actual_owner_email: '',
    actual_owner_name: '',
    actual_owner_phone: '',
    send_invite_immediately: true,
    management_document_url: '',
    management_document_name: '',
    commercial_terms_redacted: false,
    ownership_document_url: '',
    ownership_document_name: '',
  });

  // Extra data for admin tabs
  const [utilitiesData, setUtilitiesData] = useState(() => ({
    electricity_included: initialData.electricity_included,
    electricity_unit_price: initialData.electricity_unit_price,
    electricity_provider: initialData.electricity_provider,
    electricity_metering: initialData.electricity_metering,
    electricity_notes: initialData.electricity_notes,
    electricity_notes_ru: initialData.electricity_notes_ru,
    water_included: initialData.water_included,
    water_unit_price: initialData.water_unit_price,
    water_notes: initialData.water_notes,
    water_notes_ru: initialData.water_notes_ru,
    internet_speed: initialData.internet_speed,
    internet_provider: initialData.internet_provider,
  }));

  const [servicesData, setServicesData] = useState(() => ({
    cleaning_included: initialData.cleaning_included,
    cleaning_frequency: initialData.cleaning_frequency,
    extra_cleaning_price: initialData.extra_cleaning_price,
    linen_change_price: initialData.linen_change_price,
    linen_change_frequency: initialData.linen_change_frequency,
    early_checkin_price: initialData.early_checkin_price,
    late_checkout_price: initialData.late_checkout_price,
    transfer_available: initialData.transfer_available,
    transfer_airport_price: initialData.transfer_airport_price,
    transfer_notes: initialData.transfer_notes,
    transfer_notes_ru: initialData.transfer_notes_ru,
    extra_guest_price: initialData.extra_guest_price,
    extra_guest_threshold: initialData.extra_guest_threshold,
  }));

  const [adminData, setAdminData] = useState(() => ({
    is_active: initialData.is_active ?? true,
    is_featured: initialData.is_featured ?? false,
    is_verified: initialData.is_verified ?? false,
    approval_status: initialData.approval_status || 'pending',
    rejection_reason: initialData.rejection_reason,
    commission_rate: initialData.commission_rate,
    notes: initialData.notes,
    purchase_price: initialData.purchase_price,
    purchase_date: initialData.purchase_date,
    purchase_currency: initialData.purchase_currency,
    acquisition_costs: initialData.acquisition_costs,
    mortgage_amount: initialData.mortgage_amount,
    mortgage_bank: initialData.mortgage_bank,
    mortgage_interest_rate: initialData.mortgage_interest_rate,
    mortgage_monthly_payment: initialData.mortgage_monthly_payment,
    chanote_number: initialData.chanote_number,
    ical_export_enabled: initialData.ical_export_enabled,
  }));
  
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Keep original data for merging on submit
  const [originalData] = useState(initialData);

  const updateFormData = useCallback((updates: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateOwnershipData = useCallback((updates: Partial<OwnershipData>) => {
    setOwnershipData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUtilities = useCallback((updates: Record<string, any>) => {
    setUtilitiesData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateServices = useCallback((updates: Record<string, any>) => {
    setServicesData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAdmin = useCallback((updates: Record<string, any>) => {
    setAdminData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSubmit = async () => {
    const submissionData = mapFromOwnerFormat(formData, originalData, {
      utilities: utilitiesData,
      services: servicesData,
      admin: adminData,
    });
    await onSubmit(submissionData);
  };

  const baseTabs = [
    { id: 'basic', icon: Home, labelEn: 'Basic', labelRu: 'Основное' },
    { id: 'location', icon: MapPin, labelEn: 'Location', labelRu: 'Локация' },
    { id: 'photos', icon: Camera, labelEn: 'Photos', labelRu: 'Фото' },
    { id: 'pricing', icon: DollarSign, labelEn: 'Pricing', labelRu: 'Цены' },
  ];

  const adminTabs = [
    { id: 'utilities', icon: Zap, labelEn: 'Utilities', labelRu: 'Комм.' },
    { id: 'services', icon: Sparkles, labelEn: 'Services', labelRu: 'Сервис' },
    { id: 'admin', icon: Shield, labelEn: 'Admin', labelRu: 'Админ' },
  ];

  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  return (
    <div className="flex flex-col h-full">
      {/* Provider Selector for Admin */}
      {providerSelector && (
        <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed mb-4">
          {providerSelector}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className={`grid w-full mb-4 ${isAdmin ? 'grid-cols-7' : 'grid-cols-4'}`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 px-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{isRu ? tab.labelRu : tab.labelEn}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1 pr-4" style={{ maxHeight: 'calc(70vh - 200px)' }}>
          <TabsContent value="basic" className="mt-0">
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              ownershipData={showOwnership ? ownershipData : undefined}
              updateOwnershipData={showOwnership ? updateOwnershipData : undefined}
            />
          </TabsContent>

          <TabsContent value="location" className="mt-0">
            <LocationStep
              formData={formData}
              updateFormData={updateFormData}
            />
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <PhotosStep
              formData={formData}
              updateFormData={updateFormData}
            />
          </TabsContent>

          <TabsContent value="pricing" className="mt-0">
            <PricingStep
              formData={formData}
              updateFormData={updateFormData}
              selectedProject={selectedProject}
            />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="utilities" className="mt-0">
                <UtilitiesStep data={utilitiesData} onChange={updateUtilities} />
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <ServicesStep data={servicesData} onChange={updateServices} />
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <AdminSettingsStep data={adminData} onChange={updateAdmin} />
              </TabsContent>
            </>
          )}
        </ScrollArea>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 mt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isRu ? 'Сохранить' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
