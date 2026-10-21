import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

// The canonical draft hook owns persistence; this only flushes pending writes.
const pendingDraftFlushers = new Set<() => boolean>();

/** Persist current mounted drafts before an explicitly requested reload. */
export function flushPendingBookingDrafts(): boolean {
  let saved = true;
  for (const flush of pendingDraftFlushers) {
    if (!flush()) saved = false;
  }
  return saved;
}

/**
 * Persists arbitrary booking form state to sessionStorage so the user never
 * loses what they typed — across refreshes, OAuth callbacks, or accidental
 * back-navigation. Generic across booking flows (transfer, flowers, taxi, etc.).
 *
 * Usage:
 *   const [formData, setFormData] = useState<TransferFormData>({...});
 *   const [step, setStep] = useState(0);
 *   useBookingDraft('transfer_airport', { formData, step }, (draft) => {
 *     if (draft.formData) setFormData(draft.formData);
 *     if (typeof draft.step === 'number') setStep(draft.step);
 *   });
 */
export function useBookingDraft<T extends Record<string, unknown>>(
  key: string,
  state: T,
  restore: (draft: Partial<T>) => void,
  options?: { debounceMs?: number; ttlMs?: number },
) {
  const storageKey = `booking_draft:${key}`;
  const debounceMs = options?.debounceMs ?? 400;
  const ttlMs = options?.ttlMs ?? 1000 * 60 * 60 * 24; // 24h
  const restoredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  const pendingRef = useRef(false);
  const restoredFromStateRef = useRef<T | null>(null);
  const clearedSnapshotRef = useRef<string | null>(null);
  latestStateRef.current = state;

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!pendingRef.current) return true;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), data: latestStateRef.current }));
      pendingRef.current = false;
      return true;
    } catch (err) {
      logger.warn('[useBookingDraft] failed to save', err);
      return false;
    }
  }, [storageKey]);

  useEffect(() => {
    pendingDraftFlushers.add(flush);
    return () => {
      flush(); // Preserve the last keystroke if a route/error boundary unmounts the form.
      pendingDraftFlushers.delete(flush);
    };
  }, [flush]);

  // Restore once on mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { ts: number; data: Partial<T> };
      if (Date.now() - parsed.ts > ttlMs) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      // Do not flush the pre-restoration defaults during StrictMode effect cleanup.
      restoredFromStateRef.current = state;
      restore(parsed.data);
    } catch (err) {
      logger.warn('[useBookingDraft] failed to restore', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save (debounced) on every state change after restore.
  useEffect(() => {
    if (!restoredRef.current || restoredFromStateRef.current === state) return;
    if (clearedSnapshotRef.current !== null) {
      try {
        // Some callers create a fresh wrapper on success rerenders. Only actual
        // changed draft contents should re-arm persistence after clear().
        if (JSON.stringify(state) === clearedSnapshotRef.current) return;
      } catch { /* A subsequent flush will fail closed for non-serializable state. */ }
      clearedSnapshotRef.current = null;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = true;
    timerRef.current = setTimeout(flush, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, debounceMs, flush]);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = false;
    try { clearedSnapshotRef.current = JSON.stringify(latestStateRef.current); } catch { /* no serializable snapshot */ }
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
  };

  return { clear };
}
