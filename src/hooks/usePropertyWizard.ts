import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { readPropertyCreationScope } from '@/lib/propertyAuthoring';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import {
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
import { savePropertyWizardDocument } from '@/lib/owner/propertyWizardDocument';

// Re-export types for backwards compatibility with existing consumers.
export type { AssetClass, OwnershipData, OwnershipType, PropertyFormData };

const errorLog = createErrorHandler('usePropertyWizard');

export function usePropertyWizard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany, isLoading: companyLoading, error: companyError, refetch: retryCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id || null;
  const { canAccess, isLoading: permissionsLoading } = useTeamPermissions();
  const authoringCapabilities = useMemo(() => ({ pricing: !companyId || (!permissionsLoading && canAccess('pricing', 'edit')), bookings: !companyId || (!permissionsLoading && canAccess('bookings', 'edit')) }), [companyId, permissionsLoading, canAccess]);
  const submitLock = useRef(false);
  const actorScope = `${user?.id || ''}:${companyId || ''}`;
  const actorScopeRef = useRef(actorScope);
  actorScopeRef.current = actorScope;
  useEffect(() => { submitLock.current = false; }, [actorScope]);
  const [operatingSpaceId, setOperatingSpaceId] = useState<string | null>(null);
  useEffect(() => setOperatingSpaceId(null), [companyId]);
  const resumeDraftId = searchParams.get('draft');
  const onDraftCreated = useCallback((id: string) => {
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('draft', id); next.delete('cloneFrom'); return next; }, { replace: true });
  }, [setSearchParams]);
  const creationScope = useQuery({
    queryKey: ['property-creation-scope', user?.id, companyId],
    enabled: !!user && !!companyId,
    queryFn: ({ signal }) => readPropertyCreationScope(companyId!, signal),
  });
  const isRu = language === 'ru';

  const cloneFromId = searchParams.get('cloneFrom');
  const { data: sourceProperty, isLoading: isLoadingSource } = useOwnerProperty(cloneFromId || undefined, { authoring: true });

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
  const [createdApprovalStatus, setCreatedApprovalStatus] = useState<'draft' | 'pending'>('draft');

  // Draft persistence — load/save/auto-save/beforeunload
  const draft = usePropertyWizardDraft({
    userId: !companyLoading && !companyError ? user?.id : undefined,
    cloneFromId,
    formData,
    setFormData,
    ownershipData,
    activeOrgId,
    isRu, language,
    companyId, operatingSpaceId, resumeDraftId, onDraftCreated, capabilities: authoringCapabilities,
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
    if (companyId && stepId === 'pricing' && (!authoringCapabilities.pricing || !authoringCapabilities.bookings)) return true;
    return validateWizardStep({ stepId, formData, ownershipData: companyId ? initialOwnershipData : ownershipData, isRu });
  }, [companyId, authoringCapabilities, formData, ownershipData, isRu]);

  const buildPropertyPayload = useCallback(
    (approvalStatus: 'draft' | 'pending') =>
      buildPayload({ formData, ownershipData, activeOrgId, approvalStatus }),
    [formData, ownershipData, activeOrgId],
  );

  // Submit property
  const handleSubmit = useCallback(async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    const submissionScope = actorScope;
    try {
      const isOnBehalf = !companyId && ownershipData.ownership_type !== 'own';
      const approvalStatus = formData.platform_listed ? 'pending' : 'draft';
      const submitPayload = buildPropertyPayload(approvalStatus);

      // Share the in-flight draft save so blur/autosave/Submit cannot create
      // parallel property shells. Review is a separate checked transition.
      const savedDraft = await draft.persistDraft(true);
      if (!savedDraft || actorScopeRef.current !== submissionScope) return;
      // Required documents belong to the retained draft. Do not move it into
      // review or clear its resume identity until each persisted row is confirmed.
      if (!companyId) {
        const documents = [
          ownershipData.management_document_url ? {
            document_type: 'power_of_attorney' as const,
            file_url: ownershipData.management_document_url,
            file_name: ownershipData.management_document_name || 'management-document',
            title: 'Management Agreement / POA', title_ru: 'Договор управления / Доверенность',
          } : null,
          ownershipData.ownership_document_url ? {
            document_type: 'ownership_title' as const,
            file_url: ownershipData.ownership_document_url,
            file_name: ownershipData.ownership_document_name || 'ownership-document',
            title: 'Ownership Document', title_ru: 'Документ о праве собственности',
          } : null,
        ];
        for (const document of documents) {
          if (!document) continue;
          if (actorScopeRef.current !== submissionScope) return;
          await savePropertyWizardDocument({ ...document, property_id: savedDraft.id, uploaded_by: user!.id });
        }
      }
      if (actorScopeRef.current !== submissionScope) return;
      const property = approvalStatus === 'pending'
        ? await updateProperty.mutateAsync({ id: savedDraft.id, ...(companyId ? {} : submitPayload), is_active: false, _authoring: true, _expectedUpdatedAt: savedDraft.updated_at, _submitForReview: true } as never)
        : savedDraft;
      if (actorScopeRef.current !== submissionScope) return;

      // Link property to a CRM owner contact when managing on behalf.
      // Priority: (1) reuse the contact the wizard was launched from, (2) reuse an
      // existing contact with the same email, (3) create a new one. This prevents
      // duplicate owner contacts when adding a property from an owner's card.
      if (isOnBehalf && property?.id && ownershipData.actual_owner_name.trim()) {
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          let ownerContactId: string | null = ownershipData.owner_contact_id || null;

          if (!ownerContactId && activeOrgId && ownershipData.actual_owner_email.trim()) {
            const { data: existing } = await typedFrom('crm_contacts')
              .select('id')
              .eq('company_id', activeOrgId)
              .eq('email', ownershipData.actual_owner_email.trim())
              .limit(1)
              .maybeSingle();
            if (existing?.id) ownerContactId = existing.id;
          }

          if (!ownerContactId) {
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
            ownerContactId = newContact?.id ?? null;
          }

          if (ownerContactId) {
            await typedFrom('properties').update({
              owner_contact_id: ownerContactId,
            }).eq('id', property.id);
          }
        } catch (error: unknown) {
          // Surface this — an unlinked property silently drops out of owner
          // accounts, CRM and statement reporting (see MC UX audit).
          errorLog.error(error, 'link_owner_contact');
          toast.error(isRu
            ? 'Объект создан, но не удалось связать его с собственником в CRM. Свяжите вручную на карточке объекта.'
            : 'Property created, but linking it to the owner in CRM failed. Link it manually on the property card.');
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

      if (actorScopeRef.current !== submissionScope) return;
      draft.clearDraft();
      draft.resetDraftSnapshot();

      setCreatedApprovalStatus(approvalStatus);
      setCreatedPropertyId(property?.id);
      setCreatedPropertyTitle(formData.title || formData.title_ru);
      setShowSuccess(true);
    } catch (error: unknown) {
      if (actorScopeRef.current !== submissionScope) return;
      errorLog.error(error, 'submit_property');
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(isRu ? `Ошибка сохранения: ${msg}` : `Error saving: ${msg}`);
    } finally { if (actorScopeRef.current === submissionScope) submitLock.current = false; }
  }, [actorScope, activeOrgId, companyId, buildPropertyPayload, draft, formData, isRu, ownershipData, sendInvite, updateProperty, user]);

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
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('draft'); return next; }, { replace: true });
    setFormData(initialFormData);
    setOwnershipData(initialOwnershipData);
    setSelectedProject(null);
    setIsCloneDataApplied(false);
    setShowSuccess(false);
    setCreatedPropertyId(undefined);
    setCreatedPropertyTitle(undefined);
    draft.clearDraft();
  }, [draft, setSearchParams]);

  return {
    formData,
    ownershipData,
    selectedProject,
    isCloneDataApplied,
    showSuccess,
    createdPropertyId,
    createdPropertyTitle,
    createdApprovalStatus,
    creationScope,
    companyLoading, companyError, retryCompany,
    managedCreation: !!companyId,
    authoringCapabilities,
    operatingSpaces: creationScope.data?.spaces || [],
    operatingSpaceId,
    setOperatingSpaceId,
    draftLoadError: draft.draftLoadError,
    isLoadingSource,
    isLoadingDraft: draft.isLoadingDraft,
    cloneFromId,
    sourceProperty,
    previewData,
    isSubmitting: updateProperty.isPending || draft.isSavingDraft,
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
