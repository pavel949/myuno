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
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);
  const { user } = useAuth();

  const openAuthSheet = useCallback((options: OpenAuthSheetOptions = {}) => {
    if (user) {
      // Already signed in — fire onSuccess immediately, no UI.
      options.onSuccess?.();
      return;
    }
    setOpts(options);
    setIsOpen(true);
  }, [user]);

  const closeAuthSheet = useCallback(() => setIsOpen(false), []);

  const handleSuccess = useCallback(() => {
    setIsOpen(false);
    // Fire onSuccess on next tick so consumer state updates settle first.
    setTimeout(() => {
      const o = optsRef.current;
      o.onSuccess?.();
      if (!o.onSuccess && o.redirectTo) {
        window.location.href = o.redirectTo;
      }
    }, 0);
  }, []);

  const value = useMemo<AuthSheetContextValue>(() => ({
    openAuthSheet, closeAuthSheet, isOpen,
  }), [openAuthSheet, closeAuthSheet, isOpen]);

  return (
    <AuthSheetContext.Provider value={value}>
      {children}
      <AuthSheet open={isOpen} onOpenChange={setIsOpen} onSuccess={handleSuccess} intent={opts.intent} />
    </AuthSheetContext.Provider>
  );
}

export function useAuthSheet(): AuthSheetContextValue {
  const ctx = useContext(AuthSheetContext);
  if (!ctx) throw new Error('useAuthSheet must be used within AuthSheetProvider');
  return ctx;
}
