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
  highlights: string[];
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
  highlights: [],
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

  // Apply prefill data from AI or OTA
  const applyPrefillData = useCallback((prefillData: Record<string, any>) => {
    if (!prefillData) return;
    
    setFormData(prev => ({
      ...prev,
      title: prefillData.name_en || prefillData.title || prev.title,
      title_ru: prefillData.name_ru || prefillData.title_ru || prev.title_ru,
      description: prefillData.description_en || prefillData.description || prev.description,
      description_ru: prefillData.description_ru || prev.description_ru,
      bedrooms: prefillData.bedrooms || prev.bedrooms,
      bathrooms: prefillData.bathrooms || prev.bathrooms,
      max_guests: prefillData.max_guests || prev.max_guests,
      price_per_night: prefillData.price_per_night?.toString() || prev.price_per_night,
      district: prefillData.district || prev.district,
      address: prefillData.address || prev.address,
      property_type: prefillData.property_type || prev.property_type,
      images: prefillData.images || prev.images,
      cover_image: prefillData.images?.[0] || prev.cover_image,
    }));
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
    const isOnBehalf = ownershipData.ownership_type !== 'own';
    
    const property = await createProperty.mutateAsync({
      ...formData,
      area_sqm: formData.area_sqm ? Number(formData.area_sqm) : undefined,
      price_per_night: formData.price_per_night ? Number(formData.price_per_night) : undefined,
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : undefined,
      sale_price: formData.sale_price ? Number(formData.sale_price) : undefined,
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
    });

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

        const { data: newContact } = await supabase.from('crm_contacts').insert({
          company_id: activeOrgId,
          contact_type: 'owner',
          first_name: firstName,
          last_name: lastName,
          email: ownershipData.actual_owner_email || null,
          phone: ownershipData.actual_owner_phone || null,
          source: 'property_wizard',
          lifecycle_stage: 'customer',
          created_by: userId,
        } as any).select('id').single();

        // Link owner contact to property
        if (newContact?.id) {
          await supabase.from('properties').update({
            owner_contact_id: newContact.id,
          } as any).eq('id', property.id);
        }
      } catch (error) {
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

    setCreatedPropertyId(property?.id);
    setCreatedPropertyTitle(formData.title || formData.title_ru);
    setShowSuccess(true);
  }, [formData, ownershipData, createProperty, sendInvite, activeOrgId, isRu]);

  // Preview data for live preview
  const previewData = useMemo(() => ({
    title: formData.title,
    titleRu: formData.title_ru,
    coverImage: formData.cover_image,
    images: formData.images,
    propertyType: formData.property_type,
    district: formData.district,
    address: formData.address,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    maxGuests: formData.max_guests,
    areaSqm: formData.area_sqm,
    pricePerNight: formData.price_per_night,
    instantBooking: formData.instant_booking,
  }), [formData]);

  // Clear draft on successful submission
  const handleSuccessfulSubmission = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

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
    setShowSuccess,
    handleSuccessfulSubmission,
  };
}
