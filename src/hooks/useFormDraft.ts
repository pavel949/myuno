import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormDraftOptions<T> {
  key: string;
  initialData: T;
  debounceMs?: number;
}

/**
 * Hook for auto-saving form drafts to localStorage
 * Prevents data loss on accidental page close
 */
export function useFormDraft<T extends object>({
  key,
  initialData,
  debounceMs = 1000,
}: UseFormDraftOptions<T>) {
  const storageKey = `vendor_draft_${key}`;
  
  // Load saved draft or use initial data
  const loadDraft = useCallback((): T => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      }
    } catch {
      // Silent fail for draft loading
    }
    return initialData;
  }, [storageKey, initialData]);

  const [formData, setFormData] = useState<T>(loadDraft);
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(storageKey));
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to localStorage
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
        setHasDraft(true);
        setLastSaved(new Date());
      } catch {
        // Silent fail for draft saving
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, storageKey, debounceMs]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  // Reset to initial data and clear draft
  const resetForm = useCallback(() => {
    setFormData(initialData);
    clearDraft();
  }, [initialData, clearDraft]);

  // Restore from draft
  const restoreDraft = useCallback(() => {
    setFormData(loadDraft());
  }, [loadDraft]);

  // Update single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    hasDraft,
    lastSaved,
    clearDraft,
    resetForm,
    restoreDraft,
  };
}
