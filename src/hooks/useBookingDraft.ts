import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

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
      restore(parsed.data);
    } catch (err) {
      logger.warn('[useBookingDraft] failed to restore', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save (debounced) on every state change after restore.
  useEffect(() => {
    if (!restoredRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ ts: Date.now(), data: state }),
        );
      } catch (err) {
        logger.warn('[useBookingDraft] failed to save', err);
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, storageKey, debounceMs]);

  const clear = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
  };

  return { clear };
}
