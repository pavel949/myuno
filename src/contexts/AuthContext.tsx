/**
 * @module AuthContext
 * @description Authentication provider wrapping Supabase Auth.
 *
 * Provides: user, session, isLoading, signUp, signIn, signOut, resetPassword, updatePassword.
 * Listens to auth state changes and persists session in localStorage.
 *
 * Usage: `const { user, signIn } = useAuth();`
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordResetRedirectUrl } from '@/lib/config/routes';
import { clearAdminCache } from '@/hooks/useIsAdmin';

interface SignUpResult {
  error: Error | null;
  data?: { user: User | null };
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
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

  useEffect(() => {
    let isMounted = true;

    // Fallback: if Supabase doesn't respond (e.g. offline, wrong URL), stop loading after 5s so app can render
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    // Check for existing session FIRST (synchronously set initial state)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, phone }: SignUpData): Promise<SignUpResult> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          phone: phone || '',
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
    
    return {
      error: error as Error | null,
      data: data ? { user: data.user } : undefined,
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    clearAdminCache();
    await supabase.auth.signOut();
  }, []);

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
