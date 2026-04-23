/**
 * @module AuthContext
 * @description Authentication provider wrapping Supabase Auth.
 *
 * Provides: user, session, isLoading, signUp, signIn, signOut, resetPassword, updatePassword.
 * Listens to auth state changes and relies on Supabase session APIs.
 *
 * Usage: `const { user, signIn } = useAuth();`
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordResetRedirectUrl } from '@/lib/config/routes';
import { clearAdminCache } from '@/hooks/useIsAdmin';
import { readAnonSessionId, clearAnonSessionId } from '@/lib/segmentation/anonSession';

interface SignUpResult {
  error: Error | null;
  // `session` is null when email confirmation is required so callers can
  // detect that flow without falling through to a protected redirect.
  data?: { user: User | null; session: Session | null };
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  /**
   * Optional override. If omitted, signUp() reads the id from localStorage
   * (`myuno-anon-session-id`). Passed through to `auth.signUp({ options.data })`
   * so the `handle_new_user` trigger can claim anonymous onboarding data.
   */
  anonSessionId?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshFailureCountRef = useRef(0);

  const clearStoredAuthSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith('qa_multi_role_bundle_checked:'))
        .forEach((key) => window.sessionStorage.removeItem(key));
    }

    clearAdminCache();
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fallback: if backend doesn't respond, stop loading after 5s so app can render
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error
        ? `${reason.name}: ${reason.message}`.toLowerCase()
        : String(reason ?? '').toLowerCase();
      const stack = reason instanceof Error ? (reason.stack ?? '').toLowerCase() : '';
      const isSupabaseRefreshFailure =
        (message.includes('failed to fetch') || message.includes('abort'))
        && stack.includes('@supabase_supabase-js');

      if (!isSupabaseRefreshFailure) return;

      event.preventDefault();
      refreshFailureCountRef.current += 1;

      if (refreshFailureCountRef.current >= 3) {
        clearStoredAuthSession();
        if (isMounted) setIsLoading(false);
        refreshFailureCountRef.current = 0;
      }
    };

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        refreshFailureCountRef.current = 0;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message.toLowerCase() : '';
        const shouldResetSession =
          message.includes('refresh token')
          || message.includes('invalid jwt')
          || message.includes('jwt expired')
          || message.includes('session missing');

        if (shouldResetSession) {
          clearStoredAuthSession();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Set up auth state listener before fetching session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          refreshFailureCountRef.current = 0;
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    void initializeSession();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, [clearStoredAuthSession]);

  const signUp = useCallback(async ({ email, password, fullName, phone, anonSessionId }: SignUpData): Promise<SignUpResult> => {
    const redirectUrl = `${window.location.origin}/`;

    // M5 H.2 — read anon onboarding session id so handle_new_user() can
    // claim concierge_sessions / persona_detection_log on the new user.
    const resolvedAnonId = anonSessionId ?? readAnonSessionId();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          phone: phone || '',
          ...(resolvedAnonId ? { anon_session_id: resolvedAnonId } : {}),
        },
      },
    });

    // If signup successful and we have phone, update profile
    if (!error && data?.user && phone) {
      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', data.user.id);
    }

    // Anon id is now claimed by the trigger — clear local copy so future
    // sessions on this device start fresh.
    if (!error && data?.user && resolvedAnonId) {
      clearAnonSessionId();
    }

    return {
      error: error as Error | null,
      data: data ? { user: data.user, session: data.session } : undefined,
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    refreshFailureCountRef.current = 0;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    refreshFailureCountRef.current = 0;

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      clearStoredAuthSession();
    }
  }, [clearStoredAuthSession]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    return { error: error as Error | null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  }, []);

  const value = useMemo(() => ({
    user, session, isLoading, signUp, signIn, signOut, resetPassword, updatePassword,
  }), [user, session, isLoading, signUp, signIn, signOut, resetPassword, updatePassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
