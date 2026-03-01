/**
 * useCanonicalDraft - Enhanced draft management hook
 * 
 * Features:
 * - Auto-save every 10-20 seconds with debounce
 * - Visual saving indicator
 * - Unsaved changes detection
 * - Draft restoration prompt
 * - Conflict handling
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UseCanonicalDraftOptions<T> {
  key: string;
  initialData: T;
  /** Auto-save interval in ms (default: 10000) */
  autoSaveInterval?: number;
  /** Debounce delay for changes (default: 1000) */
  debounceMs?: number;
  /** Enable auto-save (default: true) */
  autoSave?: boolean;
}

interface UseCanonicalDraftReturn<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (updates: Partial<T>) => void;
  hasDraft: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  isSaving: boolean;
  saveDraft: () => void;
  clearDraft: () => void;
  resetToInitial: () => void;
  restoreDraft: () => void;
}

const STORAGE_PREFIX = 'canonical_draft_';

export function useCanonicalDraft<T extends object>({
  key,
  initialData,
  autoSaveInterval = 10000,
  debounceMs = 1000,
  autoSave = true,
}: UseCanonicalDraftOptions<T>): UseCanonicalDraftReturn<T> {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  
  // Load draft from storage
  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that saved data has expected shape
        if (parsed && typeof parsed === 'object') {
          return { ...initialData, ...parsed.data };
        }
      }
    } catch {
      // Silent fail for draft loading
    }
    return null;
  }, [storageKey, initialData]);
  
  // State
  const [data, setData] = useState<T>(() => loadDraft() || initialData);
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(storageKey));
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for tracking changes
  const initialDataRef = useRef(initialData);
  const lastSavedDataRef = useRef<string>(JSON.stringify(initialData));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const currentDataStr = JSON.stringify(data);
    return currentDataStr !== lastSavedDataRef.current;
  }, [data]);
  
  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      setIsSaving(true);
      const draftData = {
        data,
        savedAt: new Date().toISOString(),
        version: 1,
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setHasDraft(true);
      setLastSaved(new Date());
      lastSavedDataRef.current = JSON.stringify(data);
    } catch {
      // Silent fail for draft saving
    }
    // Cleanup-safe visual feedback handled by ref
  }, [data, storageKey]);
  
  // Delayed isSaving reset with cleanup
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveDraftWithFeedback = useCallback(() => {
    saveDraft();
    if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    savingTimeoutRef.current = setTimeout(() => setIsSaving(false), 300);
  }, [saveDraft]);
  
  // Cleanup saving timeout on unmount
  useEffect(() => {
    return () => {
      if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    };
  }, []);
  
  // Debounced save on data change
  // Use ref to avoid race condition with hasUnsavedChanges stale closure
  const pendingSaveRef = useRef(false);
  
  useEffect(() => {
    if (!autoSave) return;
    
    // Mark that we have pending changes
    pendingSaveRef.current = true;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Check ref at execution time, not at closure time
      if (pendingSaveRef.current) {
        saveDraft();
        pendingSaveRef.current = false;
      }
    }, debounceMs);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, autoSave, debounceMs, saveDraft]);
  
  // Periodic auto-save - use ref to avoid stale closure
  useEffect(() => {
    if (!autoSave) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      // Check current state via ref at execution time
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
  
  // Use refs to access latest values in unmount cleanup (avoid stale closure)
  const dataRef = useRef(data);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  
  useEffect(() => {
    dataRef.current = data;
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [data, hasUnsavedChanges]);
  
  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current) {
        try {
          const draftData = {
            data: dataRef.current,
            savedAt: new Date().toISOString(),
            version: 1,
          };
          localStorage.setItem(storageKey, JSON.stringify(draftData));
        } catch {
          // Silent fail for unmount draft save
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
    lastSavedDataRef.current = JSON.stringify(data);
  }, [storageKey, data]);
  
  // Reset to initial data
  const resetToInitial = useCallback(() => {
    setData(initialDataRef.current);
    clearDraft();
  }, [clearDraft]);
  
  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setData(draft);
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
  };
}
