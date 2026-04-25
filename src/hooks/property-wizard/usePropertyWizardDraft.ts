import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler } from '@/lib/errorHandler';
import { useCreateOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { initialFormData, mapPropertyToFormData } from './initialData';
import type { OwnershipData, PropertyFormData } from './types';
import { buildPropertyPayload } from './buildPayload';

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
  isRu,
}: DraftHookArgs) {
  const draftCreateProperty = useCreateOwnerProperty();
  const draftUpdateProperty = useUpdateOwnerProperty();

  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftPropertyId, setDraftPropertyId] = useState<string>();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isLoadingDraft, setIsLoadingDraft] = useState(!cloneFromId);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const lastSavedSnapshotRef = useRef(JSON.stringify(initialFormData));

  const hasUnsavedChanges = JSON.stringify(formData) !== lastSavedSnapshotRef.current;

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
    setHasDraft(false);
    setLastSaved(null);
    setDraftPropertyId(undefined);
    lastSavedSnapshotRef.current = JSON.stringify(initialFormData);
    setSaveState('idle');
  }, []);

  const restoreDraft = useCallback(() => {
    // Latest draft is loaded automatically from Supabase on open.
  }, []);

  // Load latest draft on mount
  useEffect(() => {
    if (!userId || cloneFromId) {
      setIsLoadingDraft(false);
      return;
    }

    let cancelled = false;

    const loadLatestDraft = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', userId)
          .eq('approval_status', 'draft')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!data || cancelled) return;

        const mappedDraft = mapPropertyToFormData(data);
        setFormData(mappedDraft);
        setDraftPropertyId(data.id);
        setHasDraft(true);
        setLastSaved(new Date(data.updated_at));
        lastSavedSnapshotRef.current = JSON.stringify(mappedDraft);
        setSaveState('saved');
      } catch (error) {
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
  }, [userId, cloneFromId, setFormData]);

  const persistDraft = useCallback(async (showToast = false) => {
    if (!hasMeaningfulDraftData || !userId) return null;

    setIsSavingDraft(true);
    setSaveState('saving');

    try {
      const draftPayload = buildPropertyPayload({
        formData,
        ownershipData,
        activeOrgId,
        approvalStatus: 'draft',
      });
      const property = draftPropertyId
        ? await draftUpdateProperty.mutateAsync({ id: draftPropertyId, ...draftPayload, _silent: true } as any)
        : await draftCreateProperty.mutateAsync({ ...draftPayload, _silent: true } as any);

      if (property?.id) {
        setDraftPropertyId(property.id);
      }

      const savedAt = new Date();
      setHasDraft(true);
      setLastSaved(savedAt);
      lastSavedSnapshotRef.current = JSON.stringify(formData);
      setSaveState('saved');

      if (showToast) {
        toast.success(isRu ? 'Черновик сохранён' : 'Draft saved');
      }

      return property;
    } catch (error) {
      setSaveState('error');
      if (showToast) {
        toast.error(isRu ? 'Ошибка сохранения черновика' : 'Error saving draft');
      }
      errorLog.silent(error, 'persist_property_draft');
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  }, [activeOrgId, draftCreateProperty, draftPropertyId, draftUpdateProperty, formData, hasMeaningfulDraftData, isRu, ownershipData, userId]);

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
