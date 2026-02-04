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
    } catch (e) {
      console.warn('Failed to load draft:', e);
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
    } catch (e) {
      console.error('Failed to save draft:', e);
    } finally {
      // Small delay for visual feedback
      setTimeout(() => setIsSaving(false), 300);
    }
  }, [data, storageKey]);
  
  // Debounced save on data change
  useEffect(() => {
    if (!autoSave) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveDraft();
      }
    }, debounceMs);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, autoSave, debounceMs, hasUnsavedChanges, saveDraft]);
  
  // Periodic auto-save
  useEffect(() => {
    if (!autoSave) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        saveDraft();
      }
    }, autoSaveInterval);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, hasUnsavedChanges, saveDraft]);
  
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
