/**
 * @module AuthSheetContext
 * @description Provides openAuthSheet({ onSuccess, redirectTo, intent }) anywhere in the app.
 *
 * Renders an Airbnb-style bottom-sheet (mobile) / centered modal (desktop) with the
 * unified auth flow: Email + Password (default), Phone OTP (feature-flagged),
 * Google / Apple OAuth. All flows finalize through Supabase Auth → single UUID is preserved.
 *
 * Usage:
 *   const { openAuthSheet } = useAuthSheet();
 *   openAuthSheet({ onSuccess: () => proceedWithBooking() });
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeAuthReturnPath } from '@/lib/auth/redirectToAuth';

export interface OpenAuthSheetOptions {
  /** Called once the user is authenticated (existing or new). */
  onSuccess?: () => void;
  /** Optional intent label for analytics: 'booking' | 'message-host' | 'inquiry' | 'general'. */
  intent?: string;
  /** Optional path to navigate after success (only used if onSuccess is not provided). */
  redirectTo?: string;
}

interface AuthSheetContextValue {
  openAuthSheet: (opts?: OpenAuthSheetOptions) => void;
  closeAuthSheet: () => void;
  isOpen: boolean;
}

const AuthSheetContext = createContext<AuthSheetContextValue | undefined>(undefined);

export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<OpenAuthSheetOptions>({});
  const [sheetRevision, setSheetRevision] = useState(0);
  const { user, session, isLoading, sessionEpoch = 0 } = useAuth();
  const currentAuth = useRef({ user, session, isLoading, sessionEpoch });
  const attempt = useRef(0);
  const [authenticatedAttempt, setAuthenticatedAttempt] = useState<{ revision: number; actorId: string } | null>(null);
  const pending = useRef<{ revision: number; epoch: number; options: OpenAuthSheetOptions } | null>(null);

  // Any departure from an admitted actor invalidates the old intent, even if
  // the same account subsequently signs in again on this mounted provider.
  if (currentAuth.current.sessionEpoch !== sessionEpoch ||
      (currentAuth.current.user && (currentAuth.current.user.id !== user?.id || !session))) {
    pending.current = null;
    attempt.current += 1;
  }
  currentAuth.current = { user, session, isLoading, sessionEpoch };

  const closeAuthSheet = useCallback(() => {
    attempt.current += 1;
    pending.current = null;
    setAuthenticatedAttempt(null);
    setIsOpen(false);
  }, []);

  // Every entry point, including already-authenticated consumers, verifies the
  // current server actor. A successful signup response alone is not a session.
  const handleSuccess = useCallback(async (originRevision: number, expectedActorId?: string) => {
    const continuation = pending.current;
    if (!continuation || continuation.revision !== originRevision || attempt.current !== originRevision) return;
    const before = currentAuth.current;
    if (before.isLoading || before.sessionEpoch !== continuation.epoch) return;
    const initialActor = before.user?.id;
    let result;
    try { result = await supabase.auth.getUser(); } catch { return; }
    const { data, error } = result;
    const actorId = data.user?.id;
    if (error || !actorId || (expectedActorId && actorId !== expectedActorId) || (initialActor && initialActor !== actorId) ||
        pending.current !== continuation || attempt.current !== continuation.revision ||
        currentAuth.current.sessionEpoch !== continuation.epoch) return;
    setAuthenticatedAttempt({ revision: continuation.revision, actorId });
  }, []);

  useEffect(() => {
    const continuation = pending.current;
    if (!continuation || !authenticatedAttempt || authenticatedAttempt.revision !== continuation.revision) return;
    const actorId = authenticatedAttempt.actorId;
    const after = currentAuth.current;
    if (after.user && after.user.id !== actorId) { closeAuthSheet(); return; }
    if (after.isLoading ||
        after.user?.id !== actorId || after.session?.user.id !== actorId ||
        pending.current !== continuation || attempt.current !== continuation.revision ||
        currentAuth.current.sessionEpoch !== continuation.epoch) return;
    pending.current = null; // consume before invoking a potentially synchronous writer
    setIsOpen(false);
    const options = continuation.options;
    options.onSuccess?.();
    if (!options.onSuccess && options.redirectTo) {
      window.location.href = sanitizeAuthReturnPath(options.redirectTo);
    }
  }, [authenticatedAttempt, user, session, isLoading, sessionEpoch, closeAuthSheet]);

  const openAuthSheet = useCallback((options: OpenAuthSheetOptions = {}) => {
    const revision = ++attempt.current;
    pending.current = { revision, epoch: currentAuth.current.sessionEpoch, options: { ...options } };
    setOpts(options);
    setSheetRevision(revision);
    const auth = currentAuth.current;
    if (!auth.isLoading && auth.user && auth.session?.user.id === auth.user.id) {
      void handleSuccess(revision, auth.user.id);
    } else {
      setIsOpen(true);
    }
  }, [handleSuccess]);

  useEffect(() => () => { pending.current = null; attempt.current += 1; }, []);

  const value = useMemo<AuthSheetContextValue>(() => ({
    openAuthSheet, closeAuthSheet, isOpen,
  }), [openAuthSheet, closeAuthSheet, isOpen]);

  return (
    <AuthSheetContext.Provider value={value}>
      {children}
      <AuthSheet key={sheetRevision} open={isOpen} onOpenChange={(open) => { if (!open) closeAuthSheet(); }} onSuccess={(actorId) => { void handleSuccess(sheetRevision, actorId); }} intent={opts.intent} />
    </AuthSheetContext.Provider>
  );
}

export function useAuthSheet(): AuthSheetContextValue {
  const ctx = useContext(AuthSheetContext);
  if (!ctx) throw new Error('useAuthSheet must be used within AuthSheetProvider');
  return ctx;
}
