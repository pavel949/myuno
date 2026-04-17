/**
 * CanonicalPropertyForm - Unified property form for Admin/Vendor/Owner
 * 
 * Full 7-tab form for admin mode: Basic, Location, Photos, Pricing, Utilities, Services, Admin
 * Full 10-tab form for owner mode: Basic, Location, Photos, Pricing, Utilities, Services, Rules, Rooms, Calendar, Team
 * 4-tab form for vendor mode: Basic, Location, Photos, Pricing
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyFormData, OwnershipData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, MapPin, Camera, DollarSign, Loader2, Zap, Sparkles, Shield, Bed, Calendar, FileText, UsersRound, Check } from 'lucide-react';
import { normalizeFurnishingLevel, normalizeViewTypes } from '@/lib/propertyFormNormalizers';

// Import canonical step components from Owner Wizard
import { 
  BasicInfoStep, 
  LocationStep, 
  PhotosStep, 
  PricingStep,
  UtilitiesStep,
  ServicesStep,
  AdminSettingsStep,
  HouseRulesSection,
  CancellationPolicySection,
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

export interface ExtraTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
  content: React.ReactNode;
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
  /** Extra tabs injected by the host (e.g. Rooms, Calendar, Team) */
  extraTabs?: ExtraTab[];
  /** Property ID for tabs that need it (Team, Calendar) */
  propertyId?: string;
  /** Hide the built-in action buttons (host renders its own) */
  hideActions?: boolean;
  /** External form data control — when provided, the form becomes controlled */
  controlledFormData?: PropertyFormData;
  onFormDataChange?: (data: PropertyFormData) => void;
  /** External extra-data control for utilities/services */
  controlledUtilities?: Record<string, any>;
  onUtilitiesChange?: (data: Record<string, any>) => void;
  controlledServices?: Record<string, any>;
  onServicesChange?: (data: Record<string, any>) => void;
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
    view_type: normalizeViewTypes(data.view_type),
    furnishing_level: normalizeFurnishingLevel(data.furnishing_level),
    equipment: data.equipment || [],
    price_per_night: (data.price_per_night && data.price_per_night !== '0') ? data.price_per_night : (data.price ? String(data.price) : ''),
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
    seasonal_pricing: data.seasonal_pricing as any || [],
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
    furnishing_level: normalizeFurnishingLevel(ownerData.furnishing_level),
    equipment: ownerData.equipment,
    pets_allowed: ownerData.pets_allowed,
    smoking_allowed: ownerData.smoking_allowed,
    parties_allowed: ownerData.parties_allowed,
    children_friendly: ownerData.children_friendly,
    cancellation_policy: ownerData.cancellation_policy,
    weekly_discount: ownerData.weekly_discount,
    monthly_discount: ownerData.monthly_discount,
    seasonal_pricing: ownerData.seasonal_pricing,
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
  extraTabs = [],
  hideActions = false,
  controlledFormData,
  onFormDataChange,
  controlledUtilities,
  onUtilitiesChange,
  controlledServices,
  onServicesChange,
}: CanonicalPropertyFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isAdmin = mode === 'admin';
  const isOwner = mode === 'owner';
  
  // Internal state (used when not controlled)
  const [internalFormData, setInternalFormData] = useState<PropertyFormData>(() => 
    mapToOwnerFormat(initialData)
  );
  
  // Use controlled or internal state
  const formData = controlledFormData || internalFormData;
  const setFormData = useCallback((updater: PropertyFormData | ((prev: PropertyFormData) => PropertyFormData)) => {
    if (onFormDataChange) {
      const newData = typeof updater === 'function' ? updater(formData) : updater;
      onFormDataChange(newData);
    } else {
      setInternalFormData(updater as any);
    }
  }, [onFormDataChange, formData]);
  
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

  // Extra data for admin/owner tabs
  const [internalUtilitiesData, setInternalUtilitiesData] = useState(() => ({
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

  const utilitiesData = controlledUtilities || internalUtilitiesData;
  const setUtilitiesData = useCallback((updater: any) => {
    if (onUtilitiesChange) {
      const newData = typeof updater === 'function' ? updater(utilitiesData) : updater;
      onUtilitiesChange(newData);
    } else {
      setInternalUtilitiesData(updater);
    }
  }, [onUtilitiesChange, utilitiesData]);

  const [internalServicesData, setInternalServicesData] = useState(() => ({
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

  const servicesData = controlledServices || internalServicesData;
  const setServicesData = useCallback((updater: any) => {
    if (onServicesChange) {
      const newData = typeof updater === 'function' ? updater(servicesData) : updater;
      onServicesChange(newData);
    } else {
      setInternalServicesData(updater);
    }
  }, [onServicesChange, servicesData]);

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
  }, [setFormData]);

  const updateOwnershipData = useCallback((updates: Partial<OwnershipData>) => {
    setOwnershipData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUtilities = useCallback((updates: Record<string, any>) => {
    setUtilitiesData((prev: any) => ({ ...prev, ...updates }));
  }, [setUtilitiesData]);

  const updateServices = useCallback((updates: Record<string, any>) => {
    setServicesData((prev: any) => ({ ...prev, ...updates }));
  }, [setServicesData]);

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

  const adminOnlyTabs = [
    { id: 'utilities', icon: Zap, labelEn: 'Utilities', labelRu: 'Комм.' },
    { id: 'services', icon: Sparkles, labelEn: 'Services', labelRu: 'Сервис' },
    { id: 'admin', icon: Shield, labelEn: 'Admin', labelRu: 'Админ' },
  ];

  const ownerExtendedTabs = [
    { id: 'utilities', icon: Zap, labelEn: 'Utilities', labelRu: 'Комм.' },
    { id: 'services', icon: Sparkles, labelEn: 'Services', labelRu: 'Сервис' },
    { id: 'rules', icon: FileText, labelEn: 'Rules', labelRu: 'Правила' },
  ];

  // Build tab list based on mode
  let tabs = [...baseTabs];
  if (isAdmin) {
    tabs = [...tabs, ...adminOnlyTabs];
  } else if (isOwner) {
    tabs = [...tabs, ...ownerExtendedTabs];
    // Add extra tabs (Rooms, Calendar, Team)
    extraTabs.forEach(et => {
      tabs.push({ id: et.id, icon: et.icon as any, labelEn: et.labelEn, labelRu: et.labelRu });
    });
  }

  // Calculate completion status per tab
  const tabCompletion = useMemo(() => {
    const hasVal = (v: any) => v !== undefined && v !== null && v !== '' && v !== 0;
    const basic = [formData.title, formData.property_type, formData.description, formData.bedrooms, formData.bathrooms, formData.area_sqm];
    const location = [formData.address, formData.district, formData.lat, formData.lng];
    const photos = [formData.cover_image, ...(formData.images || [])];
    const pricing = [formData.price_per_night, formData.max_guests, formData.seasonal_pricing?.length ? true : undefined];
    const utilities = [utilitiesData.electricity_included, utilitiesData.water_included, utilitiesData.internet_speed];
    const services = [servicesData.cleaning_included, servicesData.cleaning_frequency];

    const pct = (arr: any[]) => {
      const filled = arr.filter(hasVal).length;
      return Math.round((filled / arr.length) * 100);
    };

    return {
      basic: pct(basic),
      location: pct(location),
      photos: pct(photos),
      pricing: pct(pricing),
      utilities: pct(utilities),
      services: pct(services),
      rules: formData.cancellation_policy ? 100 : 0,
      admin: 50, // admin is always optional
    } as Record<string, number>;
  }, [formData, utilitiesData, servicesData]);

  const getTabStatus = (tabId: string): 'empty' | 'partial' | 'complete' => {
    const pct = tabCompletion[tabId] ?? 0;
    if (pct >= 80) return 'complete';
    if (pct > 0) return 'partial';
    return 'empty';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Provider Selector for Admin */}
      {providerSelector && (
        <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed mb-4">
          {providerSelector}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
        {/* Sticky tab bar — full width, bold labels */}
        <div className="sticky top-0 z-20 bg-background border-b border-border mb-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => {
              const status = getTabStatus(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="hidden sm:inline">{isRu ? tab.labelRu : tab.labelEn}</span>
                  {/* Completion indicator */}
                  {status === 'complete' && !isActive && (
                    <Check className="h-3 w-3 text-success shrink-0" />
                  )}
                  {status === 'partial' && !isActive && (
                    <span className="h-2 w-2 rounded-full bg-warning shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area — full width, no ScrollArea constraint */}
        <div className="w-full">
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

          {(isAdmin || isOwner) && (
            <>
              <TabsContent value="utilities" className="mt-0">
                <UtilitiesStep data={utilitiesData} onChange={updateUtilities} />
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <ServicesStep data={servicesData} onChange={updateServices} />
              </TabsContent>
            </>
          )}

          {isAdmin && (
            <TabsContent value="admin" className="mt-0">
              <AdminSettingsStep data={adminData} onChange={updateAdmin} />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="rules" className="mt-0">
              <div className="space-y-4">
                <HouseRulesSection formData={formData} updateFormData={updateFormData} />
                <CancellationPolicySection formData={formData} updateFormData={updateFormData} />
              </div>
            </TabsContent>
          )}

          {/* Render extra tabs (Rooms, Calendar, Team) */}
          {extraTabs.map(et => (
            <TabsContent key={et.id} value={et.id} className="mt-0">
              {et.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Action Buttons */}
      {!hideActions && (
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
      )}
    </div>
  );
}
