import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createErrorHandler, errorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useStripeUnifiedCheckout');

// A bounded browser navigation hint, never payment or order authority. Every
// consumer must re-read the canonical order under its current actor scope.
export const CHECKOUT_RETURN_HINT_TTL_MS = 30 * 60 * 1000;
const CHECKOUT_RETURN_HINT_KEY = 'myuno:checkout-return-hint:v1';

export function rememberCheckoutReturnHint(actorId: string | undefined, response: { sessionId?: unknown; orderId?: unknown }, now = Date.now()): void {
  if (!actorId || typeof response.sessionId !== 'string' || !response.sessionId.trim()
    || typeof response.orderId !== 'string' || !response.orderId.trim()) return;
  try {
    window.sessionStorage.setItem(CHECKOUT_RETURN_HINT_KEY, JSON.stringify({
      actorId, sessionId: response.sessionId, orderId: response.orderId, createdAt: now,
    }));
  } catch { /* Storage denial must not turn a created checkout into a failure. */ }
}

export function readCheckoutReturnHint(actorId: string | undefined, sessionId: string | null, now = Date.now()): string | undefined {
  if (!actorId || !sessionId) return undefined;
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_RETURN_HINT_KEY);
    if (!raw || raw.length > 4096) return undefined;
    const hint = JSON.parse(raw);
    if (hint?.actorId !== actorId || hint?.sessionId !== sessionId
      || typeof hint?.orderId !== 'string' || !hint.orderId.trim()
      || typeof hint?.createdAt !== 'number' || !Number.isFinite(hint.createdAt)
      || now < hint.createdAt || now - hint.createdAt > CHECKOUT_RETURN_HINT_TTL_MS) return undefined;
    return hint.orderId;
  } catch { return undefined; }
}


/**
 * Unified Stripe checkout hook — replaces useStripeCheckout, useStripeFlowersCheckout,
 * useStripeMarketCheckout, and useStripeServiceCheckout.
 *
 * Usage:
 *   const { createCheckout, isProcessing } = useStripeUnifiedCheckout();
 *   await createCheckout('create-flowers-checkout', { items, total_amount, ... });
 */
export function useStripeUnifiedCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const createCheckout = async (
    functionName: string,
    params: Record<string, unknown>,
    options?: { requireAuth?: boolean }
  ): Promise<boolean> => {
    const requireAuth = options?.requireAuth ?? true;
    setIsProcessing(true);

    try {
      let actorId: string | undefined;
      if (requireAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          errorHandler.auth(new Error('No active session'), functionName);
          return false;
        }
        actorId = session.user.id;
      }

      const response = await supabase.functions.invoke(functionName, {
        body: params,
      });

      if (response.error) {
        const isAuthError = response.error.message?.includes('Unauthorized') ||
                            response.error.message?.includes('authorization');
        if (isAuthError) {
          errorHandler.auth(response.error, functionName);
        } else {
          errorLog.error(response.error, `invoke_${functionName}`, {
            toastTitle: 'Payment Error',
            toastTitleRu: 'Ошибка платежа',
            toastDescription: 'Error creating payment',
            toastDescriptionRu: 'Ошибка при создании платежа',
          });
        }
        return false;
      }

      if (response.data?.url) {
        // Only explicit server response IDs are retained; never parse a Stripe
        // URL or infer a successful payment from the redirect.
        rememberCheckoutReturnHint(actorId, response.data);
        window.location.href = response.data.url;
        return true;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      if (isMountedRef.current) {
        errorLog.error(error, `create_checkout_${functionName}`, {
          toastTitle: 'Payment Error',
          toastTitleRu: 'Ошибка платежа',
          toastDescription: 'Error creating payment',
          toastDescriptionRu: 'Ошибка при создании платежа',
        });
      }
      return false;
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  return { createCheckout, isProcessing };
}
