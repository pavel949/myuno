import { useCallback, useEffect, useState } from 'react';

/**
 * Remembers the last payment method the guest chose across sessions, mirroring
 * the draft-persistence pattern used in PropertyInquiry.
 *
 * Methods:
 *   - card       — Stripe online card checkout
 *   - transfer   — offline bank transfer (manager sends details)
 *   - whatsapp   — open-ended chat with manager
 *   - rub_manual — pay in Russian rubles, processed manually by admin
 *                  (SBP / Russian-card transfer / future automated providers)
 *
 * Stored in localStorage so it survives OAuth round-trips & full reloads.
 */
export type PaymentMethodId = 'card' | 'transfer' | 'whatsapp' | 'rub_manual';

const STORAGE_KEY = 'uno_last_payment_method';
const VALID_METHODS: PaymentMethodId[] = ['card', 'transfer', 'whatsapp', 'rub_manual'];

function readStored(): PaymentMethodId | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (VALID_METHODS as string[]).includes(v)) return v as PaymentMethodId;
  } catch {
    /* ignore */
  }
  return null;
}

export function useLastPaymentMethod(defaultMethod: PaymentMethodId = 'card') {
  const [method, setMethodState] = useState<PaymentMethodId>(() => readStored() ?? defaultMethod);

  // Keep in sync if another tab updates the value.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStored();
      if (next) setMethodState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMethod = useCallback((next: PaymentMethodId) => {
    setMethodState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota errors */
    }
  }, []);

  return { method, setMethod };
}
