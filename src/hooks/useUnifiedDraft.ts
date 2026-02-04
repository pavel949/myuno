/**
 * useUnifiedDraft - Unified draft management hook
 * 
 * Consolidates useFormDraft and useCanonicalDraft into a single system
 * 
 * Features:
 * - Auto-save every 10 seconds with debounce
 * - Visual saving indicator  
 * - Unsaved changes detection
 * - Draft restoration with conflict handling
 * - Migration from legacy keys
 * - Cleanup on successful submission
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UseUnifiedDraftOptions<T> {
  /** Unique key for this draft (e.g., 'vendor_product_new', 'canonical_yacht_abc123') */
  key: string;
  /** Initial form data */
  initialData: T;
  /** Auto-save interval in ms (default: 10000) */
  autoSaveInterval?: number;
  /** Debounce delay for changes (default: 1000) */
  debounceMs?: number;
  /** Enable auto-save (default: true) */
  autoSave?: boolean;
  /** Legacy keys to migrate from */
  legacyKeys?: string[];
}

interface DraftMetadata {
  savedAt: string;
  version: number;
  source: 'unified' | 'legacy_form' | 'legacy_canonical';
}

interface StoredDraft<T> {
  data: T;
  metadata: DraftMetadata;
}

interface UseUnifiedDraftReturn<T> {
  // Data
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (updates: Partial<T>) => void;
  
  // Draft state
  hasDraft: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  isSaving: boolean;
  
  // Actions
  saveDraft: () => void;
  clearDraft: () => void;
  resetToInitial: () => void;
  restoreDraft: () => void;
  
  // Metadata
  draftMetadata: DraftMetadata | null;
}

const STORAGE_PREFIX = 'unified_draft_';
const CURRENT_VERSION = 2;

export function useUnifiedDraft<T extends object>({
  key,
  initialData,
  autoSaveInterval = 10000,
  debounceMs = 1000,
  autoSave = true,
  legacyKeys = [],
}: UseUnifiedDraftOptions<T>): UseUnifiedDraftReturn<T> {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  
  // Try to load from storage (including legacy migration)
  const loadDraft = useCallback((): StoredDraft<T> | null => {
    // First try unified storage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredDraft<T>;
        if (parsed && typeof parsed === 'object' && parsed.data) {
          return {
            data: { ...initialData, ...parsed.data },
            metadata: parsed.metadata || {
              savedAt: new Date().toISOString(),
              version: CURRENT_VERSION,
              source: 'unified',
            },
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load unified draft:', e);
    }
    
    // Try legacy keys
    for (const legacyKey of legacyKeys) {
      try {
        // Try legacy canonical format
        const canonicalKey = `canonical_draft_${legacyKey}`;
        const canonical = localStorage.getItem(canonicalKey);
        if (canonical) {
          const parsed = JSON.parse(canonical);
          if (parsed?.data) {
            // Migrate to unified format
            const migrated: StoredDraft<T> = {
              data: { ...initialData, ...parsed.data },
              metadata: {
                savedAt: parsed.savedAt || new Date().toISOString(),
                version: CURRENT_VERSION,
                source: 'legacy_canonical',
              },
            };
            // Save in new format and remove legacy
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            localStorage.removeItem(canonicalKey);
            return migrated;
          }
        }
        
        // Try legacy form format
        const formKey = `vendor_draft_${legacyKey}`;
        const form = localStorage.getItem(formKey);
        if (form) {
          const parsed = JSON.parse(form);
          if (parsed && typeof parsed === 'object') {
            const migrated: StoredDraft<T> = {
              data: { ...initialData, ...parsed },
              metadata: {
                savedAt: new Date().toISOString(),
                version: CURRENT_VERSION,
                source: 'legacy_form',
              },
            };
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            localStorage.removeItem(formKey);
            return migrated;
          }
        }
      } catch (e) {
        console.warn('Failed to migrate legacy draft:', e);
      }
    }
    
    return null;
  }, [storageKey, initialData, legacyKeys]);
  
  // State
  const loadedDraft = loadDraft();
  const [data, setData] = useState<T>(() => loadedDraft?.data || initialData);
  const [draftMetadata, setDraftMetadata] = useState<DraftMetadata | null>(
    () => loadedDraft?.metadata || null
  );
  const [hasDraft, setHasDraft] = useState(() => !!loadedDraft);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    () => loadedDraft?.metadata?.savedAt ? new Date(loadedDraft.metadata.savedAt) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for tracking
  const initialDataRef = useRef(initialData);
  const lastSavedDataRef = useRef<string>(JSON.stringify(initialData));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const currentDataStr = JSON.stringify(data);
    return currentDataStr !== lastSavedDataRef.current;
  }, [data]);
  
  // Refs for cleanup-safe access
  const dataRef = useRef(data);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  
  useEffect(() => {
    dataRef.current = data;
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [data, hasUnsavedChanges]);
  
  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      setIsSaving(true);
      const draftData: StoredDraft<T> = {
        data: dataRef.current,
        metadata: {
          savedAt: new Date().toISOString(),
          version: CURRENT_VERSION,
          source: 'unified',
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setHasDraft(true);
      setLastSaved(new Date());
      setDraftMetadata(draftData.metadata);
      lastSavedDataRef.current = JSON.stringify(dataRef.current);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
    
    // Clear saving indicator after brief delay
    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    savingTimeoutRef.current = setTimeout(() => setIsSaving(false), 300);
  }, [storageKey]);
  
  // Debounced save on data change
  useEffect(() => {
    if (!autoSave) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (hasUnsavedChangesRef.current) {
        saveDraft();
      }
    }, debounceMs);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, autoSave, debounceMs, saveDraft]);
  
  // Periodic auto-save
  useEffect(() => {
    if (!autoSave) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChangesRef.current) {
        saveDraft();
      }
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, saveDraft]);
  
  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
      
      if (hasUnsavedChangesRef.current) {
        try {
          const draftData: StoredDraft<T> = {
            data: dataRef.current,
            metadata: {
              savedAt: new Date().toISOString(),
              version: CURRENT_VERSION,
              source: 'unified',
            },
          };
          localStorage.setItem(storageKey, JSON.stringify(draftData));
        } catch (e) {
          console.warn('Failed to save draft on unmount:', e);
        }
      }
    };
  }, [storageKey]);
  
  // Update single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
    setDraftMetadata(null);
    lastSavedDataRef.current = JSON.stringify(dataRef.current);
  }, [storageKey]);
  
  // Reset to initial data
  const resetToInitial = useCallback(() => {
    setData(initialDataRef.current);
    clearDraft();
  }, [clearDraft]);
  
  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setData(draft.data);
      setDraftMetadata(draft.metadata);
    }
  }, [loadDraft]);
  
  return {
    data,
    setData,
    updateField,
    updateFields,
    hasDraft,
    hasUnsavedChanges,
    lastSaved,
    isSaving,
    saveDraft,
    clearDraft,
    resetToInitial,
    restoreDraft,
    draftMetadata,
  };
}
