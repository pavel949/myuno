import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateOwnerProperty, useOwnerProperty } from '@/hooks/usePropertyCare';
import { useSendOwnershipInvite } from '@/hooks/usePropertyOwnership';
import { useUserContext } from '@/hooks/useUserContext';
import { useFormDraft } from '@/hooks/useFormDraft';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedFrom = (table: string) => (supabase as any).from(table);
import { PropertyProject } from '@/hooks/usePropertyProjects';

const errorLog = createErrorHandler('usePropertyWizard');

export type OwnershipType = 'own' | 'verbal' | 'management_agreement';

export interface OwnershipData {
  ownership_type: OwnershipType;
  actual_owner_email: string;
  actual_owner_name: string;
  actual_owner_phone: string;
  send_invite_immediately: boolean;
  management_document_url: string;
  management_document_name: string;
  commercial_terms_redacted: boolean;
  ownership_document_url: string;
  ownership_document_name: string;
}

export interface PropertyFormData {
  title: string;
  title_ru: string;
  internal_name: string;
  address: string;
  district: string;
  lat?: number;
  lng?: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: string;
  description: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  management_type: string;
  is_rented: boolean;
  rental_platforms: string[];
  custom_platform: string;
  project_id?: string;
  complex_id?: string;
  video_url?: string;
  floor?: number;
  unit_number: string;
  total_floors?: number;
  plot_size_sqm?: number;
  has_elevator: boolean;
  parking_type: string;
  pool_type: string;
  garden_type: string;
  view_type: string;
  furnishing_level: string;
  equipment: string[];
  price_per_night: string;
  min_stay_nights: number;
  max_guests: number;
  deposit_amount: string;
  check_in_time: string;
  check_out_time: string;
  instant_booking: boolean;
  ownership_form?: 'freehold' | 'leasehold' | 'company' | 'foreign_company';
  is_for_sale: boolean;
  sale_price: string;
  // House Rules
  pets_allowed?: boolean;
  pet_deposit?: number;
  smoking_allowed?: boolean;
  smoking_penalty?: number;
  parties_allowed?: boolean;
  max_party_guests?: number;
  children_friendly?: boolean;
  has_crib?: boolean;
  has_high_chair?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  house_rules?: string;
  house_rules_ru?: string;
  // Cancellation & Discounts
  cancellation_policy?: string;
  weekly_discount?: number;
  monthly_discount?: number;
  seasonal_pricing?: Array<{
    id: string;
    name: string;
    nameRu?: string;
    type: 'high' | 'low' | 'holiday' | 'custom';
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    priceModifier: number;
    minNights?: number;
  }>;
  highlights: string[];
  // Platform listing
  platform_listed?: boolean;
  // Advanced pricing rules
  early_booking_discount?: number;
  early_booking_days?: number;
  last_minute_discount?: number;
  last_minute_days?: number;
  payment_policy?: string;
  prepay_percent?: number;
  balance_due_days?: number;
  deposit_currency?: string;
  negotiation_enabled?: boolean;
  custom_length_discounts?: Array<{ min_nights: number; discount_percent: number }>;
}

const initialFormData: PropertyFormData = {
  title: '',
  title_ru: '',
  internal_name: '',
  address: '',
  district: '',
  lat: undefined,
  lng: undefined,
  property_type: 'apartment',
  bedrooms: 1,
  bathrooms: 1,
  area_sqm: '',
  description: '',
  description_ru: '',
  cover_image: '',
  images: [],
  management_type: 'full',
  is_rented: false,
  rental_platforms: [],
  custom_platform: '',
  project_id: undefined,
  complex_id: undefined,
  video_url: '',
  floor: undefined,
  unit_number: '',
  total_floors: undefined,
  plot_size_sqm: undefined,
  has_elevator: false,
  parking_type: '',
  pool_type: '',
  garden_type: '',
  view_type: '',
  furnishing_level: '',
  equipment: [],
  price_per_night: '',
  min_stay_nights: 1,
  max_guests: 2,
  deposit_amount: '',
  check_in_time: '14:00',
  check_out_time: '12:00',
  instant_booking: false,
  ownership_form: undefined,
  is_for_sale: false,
  sale_price: '',
  // House Rules defaults
  pets_allowed: false,
  smoking_allowed: false,
  parties_allowed: false,
  children_friendly: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  // Cancellation & Discounts defaults
  cancellation_policy: 'flexible',
  seasonal_pricing: [],
  highlights: [],
  platform_listed: true,
  // Advanced pricing defaults
  payment_policy: 'prepay_10',
  deposit_currency: 'USD',
  negotiation_enabled: false,
};

const initialOwnershipData: OwnershipData = {
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
};

export function usePropertyWizard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  
  const cloneFromId = searchParams.get('cloneFrom');
  const { data: sourceProperty, isLoading: isLoadingSource } = useOwnerProperty(cloneFromId || undefined);
  
  const createProperty = useCreateOwnerProperty();
  const sendInvite = useSendOwnershipInvite();
  const { activeOrgId } = useUserContext();
  
  // Use draft persistence for form data
  const {
    formData,
    setFormData,
    updateFields: updateFormData,
    hasDraft,
    clearDraft,
    lastSaved,
    restoreDraft,
  } = useFormDraft<PropertyFormData>({
    key: 'owner_property_wizard',
    initialData: initialFormData,
    debounceMs: 1000,
  });

  const [ownershipData, setOwnershipData] = useState<OwnershipData>(initialOwnershipData);
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
  const [isCloneDataApplied, setIsCloneDataApplied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string>();
  const [createdPropertyTitle, setCreatedPropertyTitle] = useState<string>();

  // Apply clone data when loaded
  useEffect(() => {
    if (sourceProperty && !isCloneDataApplied && cloneFromId) {
      setFormData({
        title: sourceProperty.title || '',
        title_ru: sourceProperty.title_ru || '',
        internal_name: (sourceProperty as any).internal_name || '',
        address: sourceProperty.address || '',
        district: sourceProperty.district || '',
        lat: sourceProperty.lat ?? undefined,
        lng: sourceProperty.lng ?? undefined,
        property_type: sourceProperty.property_type || 'apartment',
        bedrooms: sourceProperty.bedrooms || 1,
        bathrooms: sourceProperty.bathrooms || 1,
        area_sqm: sourceProperty.area_sqm?.toString() || '',
        description: sourceProperty.description_en || '',
        description_ru: sourceProperty.description_ru || '',
        cover_image: sourceProperty.cover_image || '',
        images: sourceProperty.images || [],
        management_type: sourceProperty.management_type || 'full',
        is_rented: sourceProperty.is_rented || false,
        rental_platforms: sourceProperty.rental_platform ? [sourceProperty.rental_platform] : [],
        custom_platform: '',
        project_id: sourceProperty.project_id ?? undefined,
        floor: undefined,
        unit_number: '',
        total_floors: undefined,
        plot_size_sqm: undefined,
        has_elevator: false,
        parking_type: '',
        pool_type: '',
        garden_type: '',
        view_type: sourceProperty.view_type || '',
        furnishing_level: sourceProperty.furnishing_level || '',
        equipment: sourceProperty.equipment || [],
        price_per_night: sourceProperty.price_per_night?.toString() || '',
        min_stay_nights: sourceProperty.min_stay_nights || 1,
        max_guests: sourceProperty.max_guests || 2,
        deposit_amount: sourceProperty.deposit_amount?.toString() || '',
        check_in_time: sourceProperty.check_in_time || '14:00',
        check_out_time: sourceProperty.check_out_time || '12:00',
        instant_booking: sourceProperty.instant_booking || false,
        ownership_form: undefined,
        is_for_sale: false,
        sale_price: '',
        highlights: sourceProperty.highlights || [],
      });
      setIsCloneDataApplied(true);
      toast.success(isRu ? 'Данные объекта загружены' : 'Property data loaded');
    }
  }, [sourceProperty, isCloneDataApplied, cloneFromId, setFormData, isRu]);

  // Update ownership data
  const updateOwnershipData = useCallback((updates: Partial<OwnershipData>) => {
    setOwnershipData(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply prefill data from AI or OTA — maps all available fields
  const applyPrefillData = useCallback((prefillData: Record<string, any>) => {
    if (!prefillData) return;
    
    setFormData(prev => {
      const updated = { ...prev };
      
      // Basic info
      if (prefillData.name_en || prefillData.title) updated.title = prefillData.name_en || prefillData.title;
      if (prefillData.name_ru || prefillData.title_ru) updated.title_ru = prefillData.name_ru || prefillData.title_ru;
      if (prefillData.description_en || prefillData.description) updated.description = prefillData.description_en || prefillData.description;
      if (prefillData.description_ru) updated.description_ru = prefillData.description_ru;
      if (prefillData.bedrooms) updated.bedrooms = prefillData.bedrooms;
      if (prefillData.bathrooms) updated.bathrooms = prefillData.bathrooms;
      if (prefillData.max_guests) updated.max_guests = prefillData.max_guests;
      if (prefillData.property_type) updated.property_type = prefillData.property_type;
      if (prefillData.area_sqm) updated.area_sqm = String(prefillData.area_sqm);
      
      // Location
      if (prefillData.district) updated.district = prefillData.district;
      if (prefillData.address) updated.address = prefillData.address;
      if (prefillData.lat) updated.lat = prefillData.lat;
      if (prefillData.lng) updated.lng = prefillData.lng;
      
      // Photos — merge, don't replace
      if (prefillData.images?.length > 0) {
        const existingSet = new Set(prev.images);
        const newImages = prefillData.images.filter((img: string) => !existingSet.has(img));
        updated.images = [...prev.images, ...newImages];
      }
      if (prefillData.cover_image) updated.cover_image = prefillData.cover_image;
      else if (prefillData.images?.[0] && !prev.cover_image) updated.cover_image = prefillData.images[0];
      
      // Pricing
      if (prefillData.price_per_night) updated.price_per_night = String(prefillData.price_per_night);
      if (prefillData.deposit_amount) updated.deposit_amount = String(prefillData.deposit_amount);
      if (prefillData.min_stay_nights) updated.min_stay_nights = prefillData.min_stay_nights;
      if (prefillData.weekly_discount) updated.weekly_discount = prefillData.weekly_discount;
      if (prefillData.monthly_discount) updated.monthly_discount = prefillData.monthly_discount;
      
      // Rental conditions
      if (prefillData.cancellation_policy) updated.cancellation_policy = prefillData.cancellation_policy;
      if (prefillData.instant_booking !== undefined) updated.instant_booking = prefillData.instant_booking;
      
      // Equipment / Amenities — merge with existing
      if (prefillData.equipment?.length > 0) {
        const merged = new Set([...prev.equipment, ...prefillData.equipment]);
        updated.equipment = Array.from(merged);
      }
      
      // Highlights — merge with existing
      if (prefillData.highlights?.length > 0) {
        const merged = new Set([...prev.highlights, ...prefillData.highlights]);
        updated.highlights = Array.from(merged).slice(0, 12);
      }
      
      // House rules
      if (prefillData.house_rules) updated.house_rules = prefillData.house_rules;
      if (prefillData.house_rules_ru) updated.house_rules_ru = prefillData.house_rules_ru;
      if (prefillData.pets_allowed !== undefined) updated.pets_allowed = prefillData.pets_allowed;
      if (prefillData.smoking_allowed !== undefined) updated.smoking_allowed = prefillData.smoking_allowed;
      if (prefillData.parties_allowed !== undefined) updated.parties_allowed = prefillData.parties_allowed;
      if (prefillData.children_friendly !== undefined) updated.children_friendly = prefillData.children_friendly;
      if (prefillData.check_in_time) updated.check_in_time = prefillData.check_in_time;
      if (prefillData.check_out_time) updated.check_out_time = prefillData.check_out_time;
      
      // Physical attributes
      if (prefillData.floor) updated.floor = prefillData.floor;
      if (prefillData.view_type) updated.view_type = prefillData.view_type;
      if (prefillData.furnishing_level) updated.furnishing_level = prefillData.furnishing_level;
      if (prefillData.pool_type) updated.pool_type = prefillData.pool_type;
      if (prefillData.parking_type) updated.parking_type = prefillData.parking_type;
      
      return updated;
    });
    setIsCloneDataApplied(true);
    toast.success(isRu ? 'Данные загружены в форму' : 'Data loaded into form');
  }, [isCloneDataApplied, isRu]);

  // Validate step
  const validateStep = useCallback((stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        if (!formData.title.trim()) {
          toast.error(isRu ? 'Введите название объекта' : 'Enter property title');
          return false;
        }
        // Ownership validation (embedded in basic step)
        if (ownershipData.ownership_type === 'verbal') {
          if (!ownershipData.actual_owner_name.trim()) {
            toast.error(isRu ? 'Введите имя собственника' : 'Enter owner name');
            return false;
          }
          if (!ownershipData.actual_owner_phone.trim()) {
            toast.error(isRu ? 'Введите телефон собственника' : 'Enter owner phone');
            return false;
          }
        }
        if (ownershipData.ownership_type === 'management_agreement') {
          if (!ownershipData.management_document_url) {
            toast.error(isRu ? 'Загрузите договор управления' : 'Upload management agreement');
            return false;
          }
        }
        return true;
      case 'location':
        if (!formData.address.trim()) {
          toast.error(isRu ? 'Введите адрес' : 'Enter address');
          return false;
        }
        return true;
      default:
        return true;
    }
  }, [formData, ownershipData, isRu]);

  // Submit property
  const handleSubmit = useCallback(async () => {
    try {
    const isOnBehalf = ownershipData.ownership_type !== 'own';
    
    // Strip fields that don't exist on the properties table
    // IMPORTANT: property_type MUST be preserved — it's a required DB column
    const { 
      title, title_ru, description, description_ru,
      rental_platforms, custom_platform, platform_listed,
      is_for_sale, sale_price, area_sqm, price_per_night, deposit_amount,
      smoking_allowed, seasonal_pricing,
      ...cleanData 
    } = formData;
    
    // Determine approval_status based on platform_listed flag
    // If user wants to list on myUNO platform → pending (goes for moderation)
    // If not → draft (stays in user's cabinet without moderation)
    const approvalStatus = platform_listed ? 'pending' : 'draft';
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submitPayload: any = {
      ...cleanData,
      area_sqm: area_sqm ? Number(area_sqm) : undefined,
      price_per_night: price_per_night ? Number(price_per_night) : undefined,
      deposit_amount: deposit_amount ? Number(deposit_amount) : undefined,
      sale_price: sale_price ? Number(sale_price) : undefined,
      is_for_sale,
      // Map smoking_allowed boolean to smoking_policy text column
      smoking_policy: smoking_allowed ? 'allowed' : 'not_allowed',
      seasonal_pricing: seasonal_pricing && seasonal_pricing.length > 0 ? seasonal_pricing : null,
      // These will be remapped by useCreateOwnerProperty
      title,
      title_ru,
      description,
      description_ru,
      approval_status: approvalStatus,
      rental_platform: rental_platforms?.length ? rental_platforms[0] : undefined,
      listing_modes: [
        ...(platform_listed ? ['platform'] : []),
        ...(is_for_sale ? ['sale'] : []),
        ...(price_per_night ? ['rent'] : []),
      ],
      created_on_behalf: isOnBehalf,
      ownership_type: ownershipData.ownership_type,
      actual_owner_email: isOnBehalf ? ownershipData.actual_owner_email : undefined,
      actual_owner_name: isOnBehalf ? ownershipData.actual_owner_name : undefined,
      actual_owner_phone: isOnBehalf ? ownershipData.actual_owner_phone : undefined,
      managed_by_org_id: ownershipData.ownership_type === 'management_agreement' ? activeOrgId : undefined,
      management_document_url: ownershipData.management_document_url || undefined,
      management_document_name: ownershipData.management_document_name || undefined,
      commercial_terms_redacted: ownershipData.commercial_terms_redacted,
      ownership_verification_status: isOnBehalf ? 'pending' : 'verified',
    };

    // Clean undefined values to prevent DB errors
    Object.keys(submitPayload).forEach(key => {
      if (submitPayload[key] === undefined) delete submitPayload[key];
    });

    const property = await createProperty.mutateAsync(submitPayload);

    // Save documents
    if (property?.id) {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (ownershipData.management_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'power_of_attorney',
          title: 'Management Agreement / POA',
          title_ru: 'Договор управления / Доверенность',
          file_url: ownershipData.management_document_url,
          file_name: ownershipData.management_document_name || 'management-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }

      if (ownershipData.ownership_document_url) {
        await supabase.from('property_documents').insert({
          property_id: property.id,
          document_type: 'ownership_title',
          title: 'Ownership Document',
          title_ru: 'Документ о праве собственности',
          file_url: ownershipData.ownership_document_url,
          file_name: ownershipData.ownership_document_name || 'ownership-document',
          is_sensitive: true,
          uploaded_by: userId,
        });
      }
    }

    // Auto-create CRM owner contact when managing on behalf
    if (isOnBehalf && property?.id && ownershipData.actual_owner_name.trim()) {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        // Split name into first/last
        const nameParts = ownershipData.actual_owner_name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newContact } = await untypedFrom('crm_contacts').insert({
          company_id: activeOrgId,
          contact_type: 'owner',
          first_name: firstName,
          last_name: lastName,
          email: ownershipData.actual_owner_email || null,
          phone: ownershipData.actual_owner_phone || null,
          source: 'property_wizard',
          lifecycle_stage: 'customer',
          created_by: userId,
        }).select('id').single();

        // Link owner contact to property
        if (newContact?.id) {
          await untypedFrom('properties').update({
            owner_contact_id: newContact.id,
          }).eq('id', property.id);
        }
      } catch (error: unknown) {
        // Non-blocking — property is already saved
        errorLog.silent(error, 'auto_create_owner_contact');
      }
    }

    // Send invite if needed
    if (isOnBehalf && ownershipData.send_invite_immediately && property?.id) {
      try {
        await sendInvite.mutateAsync({
          propertyId: property.id,
          inviteeEmail: ownershipData.actual_owner_email,
          inviteeName: ownershipData.actual_owner_name,
          inviteType: 'ownership_transfer',
        });
        toast.success(isRu ? 'Приглашение отправлено' : 'Invitation sent');
      } catch (error) {
        errorLog.silent(error, 'send_invite');
      }
    }

    // Clear draft on successful save
    clearDraft();
    
    setCreatedPropertyId(property?.id);
    setCreatedPropertyTitle(formData.title || formData.title_ru);
    setShowSuccess(true);
    } catch (error: unknown) {
      errorLog.error(error, 'submit_property');
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(isRu ? `Ошибка сохранения: ${msg}` : `Error saving: ${msg}`);
    }
  }, [formData, ownershipData, createProperty, sendInvite, activeOrgId, isRu]);

  // Preview data for live preview
  const previewData = useMemo(() => ({
    title: formData.title,
    titleRu: formData.title_ru,
    coverImage: formData.cover_image,
    images: formData.cover_image 
      ? [formData.cover_image, ...formData.images] 
      : formData.images,
    propertyType: formData.property_type,
    district: formData.district,
    address: formData.address,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    maxGuests: formData.max_guests,
    areaSqm: formData.area_sqm,
    pricePerNight: formData.price_per_night,
    instantBooking: formData.instant_booking,
    floor: formData.floor,
    unitNumber: formData.unit_number,
    totalFloors: formData.total_floors,
    plotSizeSqm: formData.plot_size_sqm,
    poolType: formData.pool_type,
    gardenType: formData.garden_type,
    parkingType: formData.parking_type,
    viewType: formData.view_type,
    furnishingLevel: formData.furnishing_level,
    equipment: formData.equipment,
    lat: formData.lat,
    lng: formData.lng,
  }), [formData]);

  // Clear draft on successful submission
  const handleSuccessfulSubmission = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Save current form as a draft to the database
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const handleSaveDraft = useCallback(async () => {
    if (!formData.title.trim() && !formData.title_ru.trim()) {
      toast.error(isRu ? 'Введите название объекта' : 'Enter property title');
      return;
    }

    setIsSavingDraft(true);
    try {
      const { 
        title, title_ru, description, description_ru,
        rental_platforms, custom_platform, platform_listed,
        is_for_sale, sale_price, area_sqm, price_per_night, deposit_amount,
        smoking_allowed, seasonal_pricing,
        ...cleanData 
      } = formData;

      const draftPayload: any = {
        ...cleanData,
        seasonal_pricing: seasonal_pricing && seasonal_pricing.length > 0 ? seasonal_pricing : null,
        area_sqm: area_sqm ? Number(area_sqm) : undefined,
        price_per_night: price_per_night ? Number(price_per_night) : undefined,
        deposit_amount: deposit_amount ? Number(deposit_amount) : undefined,
        sale_price: sale_price ? Number(sale_price) : undefined,
        is_for_sale,
        smoking_policy: smoking_allowed ? 'allowed' : 'not_allowed',
        title,
        title_ru,
        description,
        description_ru,
        approval_status: 'draft',
        is_active: false,
        rental_platform: rental_platforms?.length ? rental_platforms[0] : undefined,
        listing_modes: [
          ...(platform_listed ? ['platform'] : []),
          ...(is_for_sale ? ['sale'] : []),
          ...(price_per_night ? ['rent'] : []),
        ],
      };

      const property = await createProperty.mutateAsync(draftPayload);
      clearDraft();
      toast.success(isRu ? 'Черновик сохранён в список объектов' : 'Draft saved to property list');
      setCreatedPropertyId(property?.id);
      setCreatedPropertyTitle(formData.title || formData.title_ru);
      setShowSuccess(true);
    } catch (error) {
      errorLog.error(error, 'save_draft');
      toast.error(isRu ? 'Ошибка сохранения черновика' : 'Error saving draft');
    } finally {
      setIsSavingDraft(false);
    }
  }, [formData, createProperty, clearDraft, isRu]);

  // Reset form to start a new property from scratch
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setOwnershipData(initialOwnershipData);
    setSelectedProject(null);
    setIsCloneDataApplied(false);
    setShowSuccess(false);
    setCreatedPropertyId(undefined);
    setCreatedPropertyTitle(undefined);
    clearDraft();
  }, [setFormData, clearDraft]);

  return {
    formData,
    ownershipData,
    selectedProject,
    isCloneDataApplied,
    showSuccess,
    createdPropertyId,
    createdPropertyTitle,
    isLoadingSource,
    cloneFromId,
    sourceProperty,
    previewData,
    isSubmitting: createProperty.isPending,
    isSavingDraft,
    // Draft-related
    hasDraft,
    lastSaved,
    clearDraft,
    restoreDraft,
    // Actions
    updateFormData,
    updateOwnershipData,
    setSelectedProject,
    applyPrefillData,
    validateStep,
    handleSubmit,
    handleSaveDraft,
    resetForm,
    setShowSuccess,
    handleSuccessfulSubmission,
  };
}
