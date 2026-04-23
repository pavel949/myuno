/**
 * PersonaPromptBanner — M5.11
 *
 * Lightweight nudge on Home for authenticated users without a
 * `detected_persona`. Suggests `/start/v2` when the canonical v2
 * onboarding flag is on; falls back to `/start` when only v1 is on.
 *
 * Dismissable via sessionStorage so we don't spam returning users.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const KEY = 'myuno-persona-banner-dismissed';

const COPY = {
  title: {
    en: 'Tell us about you in 30 seconds',
    ru: 'Расскажите о себе за 30 секунд',
  },
  body: {
    en: 'We will tailor your home, services and journey.',
    ru: 'Подстроим главную, сервисы и маршрут под вас.',
  },
  cta: { en: 'Start', ru: 'Начать' },
  dismiss: { en: 'Dismiss', ru: 'Скрыть' },
};

export function PersonaPromptBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading } = useCanonicalProfile();
  const v2On = useFeatureFlag('concierge_routing_v2_canonical', false);
  const v1On = useFeatureFlag('concierge_routing_v1', false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  if (!user?.id) return null;
  if (isLoading) return null;
  if (dismissed) return null;
  if (profile?.detectedPersona) return null;
  if (!v2On && !v1On) return null;

  const target = v2On ? '/start/v2' : '/start';
  const lang = language === 'ru' ? 'ru' : 'en';

  return (
    <section className="px-4 mt-3" aria-label="Persona detection prompt" data-testid="persona-prompt-banner">
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-3.5',
          'shadow-sm',
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {COPY.title[lang as 'en' | 'ru']}
          </p>
          <p className="text-xs text-muted-foreground">
            {COPY.body[lang as 'en' | 'ru']}
          </p>
        </div>
        <Link
          to={target}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {COPY.cta[lang as 'en' | 'ru']}
        </Link>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
          }}
          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label={COPY.dismiss[lang as 'en' | 'ru']}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
