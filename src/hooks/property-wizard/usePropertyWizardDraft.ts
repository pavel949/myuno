import { pickLang } from '@/lib/i18n/pickLang';
import type { Language } from '@/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler } from '@/lib/errorHandler';
import { useCreateOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { initialFormData, mapPropertyToFormData } from './initialData';
import type { OwnershipData, PropertyFormData } from './types';
import { buildPropertyPayload } from './buildPayload';
import { PropertyDraftSaveError, readManagedPropertyDraft, propertyAuthoringDelta, editablePropertyAuthoringPatch, type PropertyAuthoringCapabilities } from '@/lib/propertyAuthoring';
import type { OwnerProperty } from '@/types/property';
import { clearConfirmedAuthoringCreateIntents, AuthoringCreationResumeRequired } from '@/lib/authoringCreateIntent';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';
import { bindCompanyAccessOperation } from '@/lib/companyAccessOperation';

const errorLog = createErrorHandler('usePropertyWizardDraft');

type SaveState = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

interface DraftHookArgs {
  userId: string | undefined;
  cloneFromId: string | null;
  formData: PropertyFormData;
  setFormData: (data: PropertyFormData) => void;
  ownershipData: OwnershipData;
  activeOrgId: string | null | undefined;
  isRu: boolean;
  language?: Language;
  companyId: string | null;
  capabilities?: PropertyAuthoringCapabilities;
  operatingSpaceId: string | null;
  resumeDraftId: string | null;
  onDraftCreated: (id: string) => void;
}

/**
 * Manages property wizard draft persistence:
 * - Loads latest draft from Supabase
 * - Auto-saves every 30s when there are unsaved changes
 * - Warns on unload with unsaved changes
 */
export function usePropertyWizardDraft({
  userId,
  cloneFromId,
  formData,
  setFormData,
  ownershipData,
  activeOrgId,
  isRu, language,
  companyId, operatingSpaceId, resumeDraftId, onDraftCreated, capabilities = { pricing: true, bookings: true },
}: DraftHookArgs) {
  const draftCreateProperty = useCreateOwnerProperty();
  const draftUpdateProperty = useUpdateOwnerProperty();
  const lifetime = useCompanyAccessLifetime(userId, companyId || undefined);

  const actorScope = `${userId || ''}:${companyId || ''}`;
  // Async closures must reject the previous render immediately, before passive
  // effects have reset the form. This is response isolation, not server auth.
  const currentActorScopeRef = useRef(actorScope);
  currentActorScopeRef.current = actorScope;
  const scopeRef = useRef(actorScope);
  const draftIdRef = useRef<string>(undefined);
  const updatedAtRef = useRef<string>(undefined);
  const needsFullSaveRef = useRef(false);
  const savingRef = useRef<Promise<OwnerProperty | null> | null>(null);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftPropertyId, setDraftPropertyId] = useState<string>();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isLoadingDraft, setIsLoadingDraft] = useState(!cloneFromId);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const lastSavedSnapshotRef = useRef(JSON.stringify(initialFormData));

  const currentSnapshotRef = useRef(JSON.stringify(formData));
  currentSnapshotRef.current = JSON.stringify(formData);
  const hasUnsavedChanges = currentSnapshotRef.current !== lastSavedSnapshotRef.current;

  const hasMeaningfulDraftData = Boolean(
    formData.title.trim() ||
    formData.title_ru.trim() ||
    formData.description.trim() ||
    formData.description_ru.trim() ||
    formData.address.trim() ||
    formData.images.length > 0,
  );

  const markUnsaved = useCallback(() => {
    setSaveState('unsaved');
  }, []);

  const clearDraft = useCallback(() => {
    if (userId && companyId) clearConfirmedAuthoringCreateIntents('property', userId, companyId);
    setHasDraft(false);
    setLastSaved(null);
    setDraftPropertyId(undefined);
    draftIdRef.current = undefined;
    updatedAtRef.current = undefined;
    needsFullSaveRef.current = false;
    setDraftLoadError(null);
    lastSavedSnapshotRef.current = JSON.stringify(initialFormData);
    setSaveState('idle');
  }, [userId, companyId]);

  const restoreDraft = useCallback(() => {
    // Latest draft is loaded automatically from Supabase on open.
  }, []);

  // Load latest draft on mount
  useEffect(() => {
    if (scopeRef.current !== actorScope) {
      scopeRef.current = actorScope;
      draftIdRef.current = undefined;
      updatedAtRef.current = undefined;
    needsFullSaveRef.current = false;
      savingRef.current = null;
      setDraftPropertyId(undefined);
      setFormData(initialFormData);
      setHasDraft(false);
      setDraftLoadError(null);
      setIsSavingDraft(false);
      lastSavedSnapshotRef.current = JSON.stringify(initialFormData);
    }
    if (!userId || cloneFromId) {
      setIsLoadingDraft(false);
      return;
    }

    // A managed draft has no fabricated employee owner. Resume only its explicit
    // ID, never the latest company draft created by another teammate.
    if (companyId && !resumeDraftId) { setIsLoadingDraft(false); return; }
    if (resumeDraftId && resumeDraftId === draftIdRef.current) return;
    let cancelled = false;
    setIsLoadingDraft(true);
    setDraftLoadError(null);

    const loadLatestDraft = async () => {
      try {
        let data;
        if (companyId && resumeDraftId) {
          const lease = lifetime.begin();
          try { data = await readManagedPropertyDraft(resumeDraftId, companyId, await bindCompanyAccessOperation(lease)); }
          finally { lease.finish(); }
        } else {
        let query = supabase.from('properties').select('*').is('deleted_at', null);
        if (resumeDraftId) query = query.eq('id', resumeDraftId);
        else query = query.eq('owner_id', userId).eq('approval_status', 'draft');
        if (companyId) query = query.eq('management_company_id', companyId);
        const result = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (result.error) throw result.error;
        data = result.data;
        }
        if (cancelled) return;
        if (!data && resumeDraftId) throw new Error('Draft not found or access denied');
        if (!data) return;
        if (data.approval_status !== 'draft' || data.is_active) throw new Error('This property is no longer an editable draft. Open it from the property list.');

        const mappedDraft = mapPropertyToFormData(data);
        setFormData(mappedDraft);
        setDraftPropertyId(data.id);
        draftIdRef.current = data.id;
        updatedAtRef.current = data.updated_at;
        setHasDraft(true);
        setLastSaved(new Date(data.updated_at));
        lastSavedSnapshotRef.current = JSON.stringify(mappedDraft);
        setSaveState('saved');
      } catch (error) {
        if (!cancelled) setDraftLoadError(error instanceof Error ? error.message : 'Could not load draft');
        errorLog.silent(error, 'load_latest_property_draft');
      } finally {
        if (!cancelled) {
          setIsLoadingDraft(false);
        }
      }
    };

    loadLatestDraft();

    return () => {
      cancelled = true;
    };
  }, [actorScope, userId, cloneFromId, companyId, resumeDraftId, setFormData, lifetime]);

  const persistDraft = useCallback(async (showToast = false): Promise<OwnerProperty | null> => {
    if (currentActorScopeRef.current !== actorScope) return null;
    while (savingRef.current) {
      const saved = await savingRef.current;
      if (!saved || currentActorScopeRef.current !== actorScope) return null;
      if (lastSavedSnapshotRef.current === JSON.stringify(formData)) return saved;
    }
    if (!hasMeaningfulDraftData || !userId || isLoadingDraft || draftLoadError) return null;
    const savingScope = actorScope;
    const snapshot = JSON.stringify(formData);
    setIsSavingDraft(true);
    setSaveState('saving');
    const save = async () => {
      try {
        let draftPayload = buildPropertyPayload({ formData, ownershipData, activeOrgId, approvalStatus: 'draft' });
        if (companyId) {
          if (draftIdRef.current && !needsFullSaveRef.current) {
            const baseline = buildPropertyPayload({ formData: JSON.parse(lastSavedSnapshotRef.current), ownershipData, activeOrgId, approvalStatus: 'draft' });
            draftPayload = propertyAuthoringDelta(draftPayload, baseline);
          }
          draftPayload = editablePropertyAuthoringPatch(draftPayload, capabilities);
        }
        const property = draftIdRef.current
          ? await draftUpdateProperty.mutateAsync({ id: draftIdRef.current, ...draftPayload, _silent: true, _authoring: true, _expectedUpdatedAt: updatedAtRef.current } as never)
          : await draftCreateProperty.mutateAsync({ ...draftPayload, _silent: true, _companyId: companyId || undefined, _operatingSpaceId: operatingSpaceId } as never);
        if (currentActorScopeRef.current !== savingScope) return null;
        if (!property?.id) throw new Error('Draft save was not confirmed');
        draftIdRef.current = property.id;
        updatedAtRef.current = property.updated_at;
        needsFullSaveRef.current = false;
        setDraftPropertyId(property.id);
        onDraftCreated(property.id);
        setHasDraft(true);
        setLastSaved(new Date());
        lastSavedSnapshotRef.current = snapshot;
        setSaveState(currentSnapshotRef.current === snapshot ? 'saved' : 'unsaved');
        if (showToast) toast.success(pickLang(language || (isRu ? 'ru' : 'en'), { en: 'Draft saved', ru: 'Черновик сохранён', th: 'บันทึกฉบับร่างแล้ว' }));
        return property as OwnerProperty;
      } catch (error) {
        if (currentActorScopeRef.current !== savingScope) return null;
        if (error instanceof PropertyDraftSaveError) {
          draftIdRef.current = error.propertyId;
          updatedAtRef.current = error.expectedUpdatedAt;
          needsFullSaveRef.current = true;
          if (!error.expectedUpdatedAt) setDraftLoadError('The property was created, but could not be reloaded. Reload this draft before saving again.');
          setDraftPropertyId(error.propertyId);
          onDraftCreated(error.propertyId);
        }
        if (error instanceof AuthoringCreationResumeRequired) {
          draftIdRef.current = error.draft.id;
          updatedAtRef.current = undefined;
          needsFullSaveRef.current = true;
          setDraftLoadError('The previous creation was saved. Reload this draft before changing its content.');
          setDraftPropertyId(error.draft.id);
          onDraftCreated(error.draft.id);
        }
        setSaveState('error');
        if (showToast) toast.error(pickLang(language || (isRu ? 'ru' : 'en'), { en: 'Could not save draft', ru: 'Не удалось сохранить черновик', th: 'บันทึกฉบับร่างไม่สำเร็จ' }), {
          description: error instanceof Error ? error.message : undefined,
        });
        errorLog.silent(error, 'persist_property_draft');
        return null;
      } finally {
        if (currentActorScopeRef.current === savingScope) {
          savingRef.current = null;
          setIsSavingDraft(false);
        }
      }
    };
    savingRef.current = save();
    return savingRef.current;
  }, [actorScope, activeOrgId, capabilities, companyId, operatingSpaceId, draftCreateProperty, draftUpdateProperty, formData, hasMeaningfulDraftData, isRu, language, ownershipData, userId, isLoadingDraft, draftLoadError, onDraftCreated]);

  // Mark unsaved when form drifts from snapshot
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    setSaveState('unsaved');
  }, [hasUnsavedChanges]);

  // Auto-save every 30s
  useEffect(() => {
    if (!hasUnsavedChanges || !hasMeaningfulDraftData) return;

    const timer = window.setTimeout(() => {
      void persistDraft(false);
    }, 30000);

    return () => window.clearTimeout(timer);
  }, [hasMeaningfulDraftData, hasUnsavedChanges, persistDraft]);

  // Warn on unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const saveDraftOnBlur = useCallback(() => {
    if (!hasUnsavedChanges || !hasMeaningfulDraftData) return;
    void persistDraft(false);
  }, [hasMeaningfulDraftData, hasUnsavedChanges, persistDraft]);

  const handleSaveDraft = useCallback(async () => {
    await persistDraft(true);
  }, [persistDraft]);

  const resetDraftSnapshot = useCallback(() => {
    lastSavedSnapshotRef.current = JSON.stringify(formData);
  }, [formData]);

  return {
    // state
    hasDraft,
    lastSaved,
    draftPropertyId,
    saveState,
    isLoadingDraft,
    draftLoadError,
    isSavingDraft,
    hasUnsavedChanges,
    hasMeaningfulDraftData,
    // actions
    markUnsaved,
    clearDraft,
    restoreDraft,
    persistDraft,
    saveDraftOnBlur,
    handleSaveDraft,
    resetDraftSnapshot,
  };
}
