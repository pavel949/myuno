/**
 * CanonicalPropertyForm - Unified property form for Admin/Vendor/Owner
 * 
 * This component provides a canonical property creation/editing experience
 * by reusing the Owner Wizard step components. It ensures consistent data
 * collection across all roles.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyFormData, OwnershipData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, MapPin, Camera, DollarSign, Loader2 } from 'lucide-react';

// Import canonical step components from Owner Wizard
import { 
  BasicInfoStep, 
  LocationStep, 
  PhotosStep, 
  PricingStep 
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
  approval_status?: string;
  // Map to owner fields
  title_en?: string;
  title_ru?: string;
  description_en?: string;
  description_ru?: string;
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
  };
}

// Map back to Admin/Vendor format for submission
function mapFromOwnerFormat(
  ownerData: PropertyFormData, 
  originalData: CanonicalPropertyFormData
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
    // Derive listing modes from is_for_sale
    listing_modes: [
      ...(ownerData.is_for_sale ? ['sale'] : []),
      ...(ownerData.price_per_night ? ['rent'] : []),
    ].length > 0 ? [
      ...(ownerData.is_for_sale ? ['sale'] : []),
      ...(ownerData.price_per_night ? ['rent'] : []),
    ] : ['rent'],
    listing_type: ownerData.is_for_sale && !ownerData.price_per_night ? 'sale' : 'rent',
  };
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

  const handleSubmit = async () => {
    const submissionData = mapFromOwnerFormat(formData, originalData);
    await onSubmit(submissionData);
  };

  const tabs = useMemo(() => [
    { id: 'basic', icon: Home, labelEn: 'Basic', labelRu: 'Основное' },
    { id: 'location', icon: MapPin, labelEn: 'Location', labelRu: 'Локация' },
    { id: 'photos', icon: Camera, labelEn: 'Photos', labelRu: 'Фото' },
    { id: 'pricing', icon: DollarSign, labelEn: 'Pricing', labelRu: 'Цены' },
  ], []);

  return (
    <div className="flex flex-col h-full">
      {/* Provider Selector for Admin */}
      {providerSelector && (
        <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed mb-4">
          {providerSelector}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{isRu ? tab.labelRu : tab.labelEn}</span>
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
