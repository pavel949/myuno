import { useState, useEffect, useCallback, useRef } from 'react';

const pendingFormFlushers = new Set<() => boolean>();

/** Flush this canonical hook's pending local drafts without submitting anything. */
export function flushPendingFormDrafts(): boolean {
  let saved = true;
  for (const flush of pendingFormFlushers) {
    if (!flush()) saved = false;
  }
  return saved;
}

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
  const initialSnapshot = JSON.stringify(initialData);
  
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
  const [hasDraft, setHasDraft] = useState(() => {
    try { return !!localStorage.getItem(storageKey); } catch { return false; }
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const latestDataRef = useRef(formData);
  const initialSnapshotRef = useRef(initialSnapshot);
  const pendingRef = useRef(false);
  const mountedRef = useRef(false);
  const clearedSnapshotRef = useRef<string | null>(null);
  latestDataRef.current = formData;
  initialSnapshotRef.current = initialSnapshot;

  const flush = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!pendingRef.current) return true;
    try {
      const snapshot = JSON.stringify(latestDataRef.current);
      const isEmpty = snapshot === initialSnapshotRef.current;
      if (isEmpty) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, snapshot);
      pendingRef.current = false;
      if (mountedRef.current) {
        setHasDraft(!isEmpty);
        setLastSaved(isEmpty ? null : new Date());
      }
      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  useEffect(() => {
    mountedRef.current = true;
    pendingFormFlushers.add(flush);
    return () => {
      mountedRef.current = false;
      flush();
      pendingFormFlushers.delete(flush);
    };
  }, [flush]);

  // Debounced save; explicit recovery can synchronously flush the latest input.
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const snapshot = JSON.stringify(formData);
    if (snapshot === clearedSnapshotRef.current) return;
    clearedSnapshotRef.current = null;
    pendingRef.current = true;
    if (snapshot === initialSnapshot) {
      flush(); // Reset/empty forms must not create a restorable draft.
    } else {
      timeoutRef.current = setTimeout(flush, debounceMs);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [formData, initialSnapshot, debounceMs, flush]);

  // Clear draft
  const clearDraft = useCallback(() => {
    // Discard/success must also cancel edits waiting in the debounce queue.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current = false;
    clearedSnapshotRef.current = JSON.stringify(latestDataRef.current);
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

