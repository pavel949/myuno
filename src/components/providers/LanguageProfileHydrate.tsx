import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/i18n';

const isUiLanguage = (value: string | null | undefined): value is Language =>
  value === 'ru' || value === 'en' || value === 'th';

/**
 * After sign-in, align UI language with `profiles.preferred_language` once per
 * user session (same idea as ThemeProvider hydrating `preferred_theme`).
 * LocalStorage from the guest session may be overwritten when the profile has
 * an explicit preference.
 */
export function LanguageProfileHydrate() {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();
  const hydratedForUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      hydratedForUserId.current = null;
      return;
    }
    if (hydratedForUserId.current === userId) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      hydratedForUserId.current = userId;

      if (error || !data) return;
      const pl = data.preferred_language;
      if (isUiLanguage(pl)) {
        setLanguage(pl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setLanguage]);

  return null;
}
