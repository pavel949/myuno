import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLanguage,
  hasExplicitLanguagePreference,
  markLanguageExplicit,
} from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/i18n';

const isUiLanguage = (value: string | null | undefined): value is Language =>
  value === 'ru' || value === 'en' || value === 'th';

/**
 * Two-way sync between UI language and `profiles.preferred_language`:
 *  - On sign-in: hydrate UI from profile ONLY if the user has not made an
 *    explicit choice in this browser. An explicit choice (anonymous or signed-in)
 *    always wins and is pushed to the profile instead.
 *  - On language change while signed in: persist back to profile so the
 *    next session / other device sees the same preference.
 */
export function LanguageProfileHydrate() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const hydratedForUserId = useRef<string | null>(null);
  const lastWrittenLang = useRef<string | null>(null);

  // Hydrate from profile (or push local choice up if user already picked one)
  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      hydratedForUserId.current = null;
      lastWrittenLang.current = null;
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

      if (error) return;

      const profileLang = data?.preferred_language;
      const userPicked = hasExplicitLanguagePreference();

      if (userPicked) {
        // Local explicit choice wins — push it up to the profile so other
        // devices catch up. Never override the user's just-made selection.
        lastWrittenLang.current = language;
        if (profileLang !== language) {
          void supabase
            .from('profiles')
            .update({ preferred_language: language })
            .eq('id', userId);
        }
        return;
      }

      if (isUiLanguage(profileLang)) {
        lastWrittenLang.current = profileLang;
        setLanguage(profileLang);
        // Hydrated from profile counts as an explicit preference for this browser.
        markLanguageExplicit();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setLanguage, language]);

  // Persist language change back to profile
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    if (hydratedForUserId.current !== userId) return; // wait until hydration done
    if (lastWrittenLang.current === language) return;

    lastWrittenLang.current = language;

    void supabase
      .from('profiles')
      .update({ preferred_language: language })
      .eq('id', userId);
  }, [user?.id, language]);

  return null;
}


