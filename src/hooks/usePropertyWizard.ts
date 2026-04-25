import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import {
  useCreateOwnerProperty,
  useOwnerProperty,
  useUpdateOwnerProperty,
} from '@/hooks/usePropertyCare';
import { useSendOwnershipInvite } from '@/hooks/usePropertyOwnership';
import { supabase } from '@/integrations/supabase/client';
import { typedFrom } from '@/lib/untypedTables';
import { createErrorHandler } from '@/lib/errorHandler';
import {
  normalizeFurnishingLevel,
  primaryViewType,
} from '@/lib/propertyFormNormalizers';
import { PropertyProject } from '@/hooks/usePropertyProjects';

import type {
  AssetClass,
  OwnershipData,
  OwnershipType,
  PropertyFormData,
} from './property-wizard/types';
import {
  initialFormData,
  initialOwnershipData,
  mapPropertyToFormData,
} from './property-wizard/initialData';
import { mergePrefillIntoForm } from './property-wizard/applyPrefill';
import { buildPropertyPayload as buildPayload } from './property-wizard/buildPayload';
import { validateWizardStep } from './property-wizard/validateStep';
import { usePropertyWizardDraft } from './property-wizard/usePropertyWizardDraft';

// Re-export types for backwards compatibility with existing consumers.
export type { AssetClass, OwnershipData, OwnershipType, PropertyFormData };

const errorLog = createErrorHandler('usePropertyWizard');

export function usePropertyWizard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';

  const cloneFromId = searchParams.get('cloneFrom');
  const { data: sourceProperty, isLoading: isLoadingSource } = useOwnerProperty(cloneFromId || undefined);

  const createProperty = useCreateOwnerProperty();
  const updateProperty = useUpdateOwnerProperty();
  const sendInvite = useSendOwnershipInvite();
  const { activeOrgId } = useUserContext();

  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [ownershipData, setOwnershipData] = useState<OwnershipData>(initialOwnershipData);
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null);
  const [isCloneDataApplied, setIsCloneDataApplied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string>();
  const [createdPropertyTitle, setCreatedPropertyTitle] = useState<string>();

  // Draft persistence — load/save/auto-save/beforeunload
  const draft = usePropertyWizardDraft({
    userId: user?.id,
    cloneFromId,
    formData,
    setFormData,
    ownershipData,
    activeOrgId,
    isRu,
  });

  const updateFormData = useCallback((updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    draft.markUnsaved();
  }, [draft]);

  const updateOwnershipData = useCallback((updates: Partial<OwnershipData>) => {
    setOwnershipData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Apply clone data when source property loads
  useEffect(() => {
    if (sourceProperty && !isCloneDataApplied && cloneFromId) {
      const mappedSource: PropertyFormData = {
        ...mapPropertyToFormData(sourceProperty),
        floor: undefined,
        unit_number: '',
        total_floors: undefined,
        plot_size_sqm: undefined,
        has_elevator: false,
        parking_type: '',
        pool_type: '',
        garden_type: '',
        is_for_sale: false,
        sale_price: '',
      };
      setFormData(mappedSource);
      draft.resetDraftSnapshot();
      setIsCloneDataApplied(true);
      toast.success(isRu ? 'Данные объекта загружены' : 'Property data loaded');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceProperty, isCloneDataApplied, cloneFromId, isRu]);

  const applyPrefillData = useCallback((prefillData: Record<string, any>) => {
    if (!prefillData) return;
    setFormData((prev) => mergePrefillIntoForm(prev, prefillData));
    setIsCloneDataApplied(true);
    toast.success(isRu ? 'Данные загружены в форму' : 'Data loaded into form');
  }, [isRu]);

  const validateStep = useCallback((stepId: string): boolean => {
    return validateWizardStep({ stepId, formData, ownershipData, isRu });
  }, [formData, ownershipData, isRu]);

  const buildPropertyPayload = useCallback(
    (approvalStatus: 'draft' | 'pending') =>
      buildPayload({ formData, ownershipData, activeOrgId, approvalStatus }),
    [formData, ownershipData, activeOrgId],
  );

  // Submit property
  const handleSubmit = useCallback(async () => {
    try {
      const isOnBehalf = ownershipData.ownership_type !== 'own';
      const approvalStatus = formData.platform_listed ? 'pending' : 'draft';
      const submitPayload = buildPropertyPayload(approvalStatus);

      const property = draft.draftPropertyId
        ? await updateProperty.mutateAsync({ id: draft.draftPropertyId, ...submitPayload } as any)
        : await createProperty.mutateAsync(submitPayload as any);

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
          const nameParts = ownershipData.actual_owner_name.trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { data: newContact } = await typedFrom('crm_contacts').insert({
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

          if (newContact?.id) {
            await typedFrom('properties').update({
              owner_contact_id: newContact.id,
            }).eq('id', property.id);
          }
        } catch (error: unknown) {
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

      draft.clearDraft();
      draft.resetDraftSnapshot();

      setCreatedPropertyId(property?.id);
      setCreatedPropertyTitle(formData.title || formData.title_ru);
      setShowSuccess(true);
    } catch (error: unknown) {
      errorLog.error(error, 'submit_property');
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(isRu ? `Ошибка сохранения: ${msg}` : `Error saving: ${msg}`);
    }
  }, [activeOrgId, buildPropertyPayload, createProperty, draft, formData, isRu, ownershipData, sendInvite, updateProperty]);

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
    viewTypes: formData.view_type,
    viewType: primaryViewType(formData.view_type),
    furnishingLevel: normalizeFurnishingLevel(formData.furnishing_level),
    equipment: formData.equipment,
    lat: formData.lat,
    lng: formData.lng,
  }), [formData]);

  const handleSuccessfulSubmission = useCallback(() => {
    draft.clearDraft();
  }, [draft]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setOwnershipData(initialOwnershipData);
    setSelectedProject(null);
    setIsCloneDataApplied(false);
    setShowSuccess(false);
    setCreatedPropertyId(undefined);
    setCreatedPropertyTitle(undefined);
    draft.clearDraft();
  }, [draft]);

  return {
    formData,
    ownershipData,
    selectedProject,
    isCloneDataApplied,
    showSuccess,
    createdPropertyId,
    createdPropertyTitle,
    isLoadingSource,
    isLoadingDraft: draft.isLoadingDraft,
    cloneFromId,
    sourceProperty,
    previewData,
    isSubmitting: createProperty.isPending,
    isSavingDraft: draft.isSavingDraft,
    saveState: draft.saveState,
    hasUnsavedChanges: draft.hasUnsavedChanges,
    // Draft-related
    hasDraft: draft.hasDraft,
    lastSaved: draft.lastSaved,
    clearDraft: draft.clearDraft,
    restoreDraft: draft.restoreDraft,
    // Actions
    updateFormData,
    updateOwnershipData,
    setSelectedProject,
    applyPrefillData,
    validateStep,
    handleSubmit,
    handleSaveDraft: draft.handleSaveDraft,
    saveDraftOnBlur: draft.saveDraftOnBlur,
    resetForm,
    setShowSuccess,
    handleSuccessfulSubmission,
  };
}
