import { useCallback, useEffect, useState } from 'react';

/**
 * Remembers the last payment method the guest chose (card / transfer / whatsapp)
 * across sessions, mirroring the draft-persistence pattern used in PropertyInquiry.
 *
 * Stored in localStorage so it survives OAuth round-trips & full reloads.
 */
export type PaymentMethodId = 'card' | 'transfer' | 'whatsapp';

const STORAGE_KEY = 'uno_last_payment_method';

function readStored(): PaymentMethodId | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'card' || v === 'transfer' || v === 'whatsapp') return v;
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
