import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { applyTheme } from '@/lib/themeSwitch';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'myuno-theme';

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    // Canon: light is the default. Dark stays available as opt-in for admin/MC.
    return 'light';
  } catch {
    return 'light';
  }
};

const isTheme = (value: string | null | undefined): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

/**
 * ThemeProvider
 *
 * Persistence strategy:
 *  - Guests → `localStorage[myuno-theme]` (synchronous, instant first paint).
 *  - Signed-in users → `profiles.preferred_theme` is the canonical source.
 *      • On sign-in we hydrate the local state from the profile.
 *      • On every `setTheme` we mirror to `localStorage` (instant) AND fire an
 *        async UPDATE to `profiles.preferred_theme` so the choice follows the
 *        user across devices.
 *      • The `userThemeAppliedFor` ref guards against re-applying the same
 *        remote value in a loop and against stale writes from other sessions.
 *
 * Sign-out wipes any user-specific row from local state by re-reading
 * `localStorage` (which we leave as the last known choice for that browser).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme()));
  // Tracks which user id we already hydrated from `profiles.preferred_theme`.
  // Prevents an infinite loop where local update → remote write → onAuthStateChange → local update.
  const userThemeAppliedFor = useRef<string | null>(null);

  // Apply theme to <html> whenever it changes.
  useEffect(() => {
    const updateTheme = () => {
      const resolved = resolveTheme(theme);
      void applyTheme(resolved, { skipLocalStorage: theme === 'system' });
      setResolvedTheme(resolved);
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Pull the saved theme from `profiles` when a user is present, and keep it
  // in sync with auth lifecycle events.
  useEffect(() => {
    let cancelled = false;

    const hydrateFromProfile = async (userId: string) => {
      if (userThemeAppliedFor.current === userId) return;
      // Set the guard IMMEDIATELY (before the await) so concurrent auth events
      // (TOKEN_REFRESHED, INITIAL_SESSION firing twice, etc.) do not trigger a
      // second hydrate that races with the first and flips the theme back.
      userThemeAppliedFor.current = userId;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_theme')
          .eq('id', userId)
          .maybeSingle();
        if (cancelled || error || !data) return;

        const remote = data.preferred_theme;

        if (isTheme(remote)) {
          // Profile has a saved choice — adopt it only if it actually differs
          // from the current local theme. Avoids a no-op re-render that would
          // re-trigger the apply effect.
          setThemeState((current) => (current === remote ? current : remote));
          try {
            const localStored = localStorage.getItem(STORAGE_KEY);
            if (localStored !== remote) {
              localStorage.setItem(STORAGE_KEY, remote);
            }
          } catch {
            // Ignore storage write errors.
          }
        }
        // NOTE: We deliberately do NOT backfill profiles.preferred_theme from
        // the local value when remote is null. Doing so used to overwrite a
        // choice the user had made on another device the moment they logged
        // in here, which felt like the theme flipping on its own. The profile
        // gets populated the first time the user explicitly toggles the theme
        // (see setTheme below).
      } catch {
        // Network or schema hiccup — fall back to local theme silently.
        // Reset the guard so a later auth event can retry.
        if (!cancelled) userThemeAppliedFor.current = null;
      }
    };

    // Initial check (in case the user is already signed in on mount).
    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (userId) void hydrateFromProfile(userId);
    });

    // Subscribe to auth changes. Setup BEFORE any future getSession calls per
    // Supabase guidance to avoid missing the initial event.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (userId) {
        void hydrateFromProfile(userId);
      } else {
        // Signed out — reset the guard so the next sign-in re-hydrates.
        userThemeAppliedFor.current = null;
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage write errors (private mode, quota, etc.)
    }

    // Fire-and-forget remote sync. We do not block the UI on the network.
    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;
      // Mark as applied for this user so the auth listener doesn't bounce the
      // value back to us if it fires before the UPDATE round-trips.
      userThemeAppliedFor.current = userId;
      void supabase
        .from('profiles')
        .update({ preferred_theme: newTheme })
        .eq('id', userId);
    });
  }, []);

  // Cross-tab sync via storage events (works for guests and signed-in users
  // sharing the same browser).
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (isTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
