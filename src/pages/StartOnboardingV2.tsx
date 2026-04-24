/**
 * StartOnboardingV2 — M5 canonical 3-question onboarding.
 *
 * Q1: lifecycle stage (8 canonical values)
 * Q2: primary role (6 canonical values)
 * Q3: modifiers (multi-select, 10 options + none)
 * Result: persona + 5–7 service recommendations.
 *
 * Behind feature flag `feature_flag:concierge_routing_v2_canonical`.
 * Falls back to a polite placeholder when flag is OFF so the route
 * remains discoverable without breaking existing /start.
 */
import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCanonicalOnboarding } from '@/hooks/useCanonicalOnboarding';
import { LifecycleStep } from '@/components/onboarding/v2/LifecycleStep';
import { RoleStep } from '@/components/onboarding/v2/RoleStep';
import { ModifiersStep } from '@/components/onboarding/v2/ModifiersStep';
import { ResultStep } from '@/components/onboarding/v2/ResultStep';

type L = 'en' | 'ru';
const T = (c: { en: string; ru: string }, l: L) => c[l] ?? c.en;

const COPY = {
  title: { en: 'Welcome to myUNO', ru: 'Добро пожаловать в myUNO' },
  subtitle: {
    en: '3 questions to understand your stage in Phuket.',
    ru: '3 вопроса, чтобы понять вашу ситуацию на Пхукете.',
  },
  q1: { en: 'Where are you in the journey?', ru: 'На каком этапе пути вы сейчас?' },
  q2: { en: 'How do you act here?', ru: 'Какая у вас роль?' },
  q3: { en: 'Anything specific to consider?', ru: 'Есть что-то особенное?' },
  next: { en: 'Continue', ru: 'Дальше' },
  back: { en: 'Back', ru: 'Назад' },
  finish: { en: 'See my recommendations', ru: 'Показать рекомендации' },
  saving: { en: 'Preparing your map…', ru: 'Готовим карту…' },
  skip: { en: 'Skip for now', ru: 'Пропустить' },
  errorPrefix: { en: 'Could not save — please retry:', ru: 'Не удалось сохранить — попробуйте ещё раз:' },
  flagOffTitle: { en: 'Onboarding coming soon', ru: 'Онбординг скоро' },
  flagOffBody: {
    en: 'A canonical version of this guided flow is being prepared.',
    ru: 'Каноническая версия этого мастера готовится.',
  },
  goHome: { en: 'Go to home', ru: 'На главную' },
};

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Step ${step + 1} of 3`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/60' : 'w-4 bg-muted',
          )}
        />
      ))}
    </div>
  );
}

/**
 * Sanitize the `?return=` query param so it can only redirect inside the app
 * (must start with `/` and not be a protocol-relative URL).
 */
function sanitizeReturnPath(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export default function StartOnboardingV2() {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as L;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flagOn = useFeatureFlag('concierge_routing_v2_canonical', false);

  const returnTo = useMemo(
    () => sanitizeReturnPath(searchParams.get('return')),
    [searchParams],
  );

  const o = useCanonicalOnboarding();

  // After the result step renders, auto-return to the caller (e.g. /account)
  // so refining persona feels like a quick edit, not a detour.
  useEffect(() => {
    if (o.step !== 3 || returnTo === '/') return;
    const t = setTimeout(() => navigate(returnTo), 1800);
    return () => clearTimeout(t);
  }, [o.step, returnTo, navigate]);

  if (!flagOn) {
    return (
      <AppLayout showHeader={false}>
        <main className="min-h-[80vh] bg-background flex items-center justify-center p-6">
          <Helmet>
            <title>{T(COPY.flagOffTitle, lang)} · myUNO</title>
          </Helmet>
          <Card className="max-w-md w-full p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">{T(COPY.flagOffTitle, lang)}</h1>
            <p className="text-sm text-muted-foreground">{T(COPY.flagOffBody, lang)}</p>
            <Button onClick={() => navigate(returnTo)} className="w-full">
              {T(COPY.goHome, lang)}
            </Button>
          </Card>
        </main>
      </AppLayout>
    );
  }

  const stepValid =
    (o.step === 0 && !!o.lifecycle) ||
    (o.step === 1 && !!o.role) ||
    (o.step === 2);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Helmet>
        <title>{T(COPY.title, lang)} · myUNO</title>
        <meta name="description" content={T(COPY.subtitle, lang)} />
      </Helmet>

      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-none bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{T(COPY.title, lang)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{T(COPY.subtitle, lang)}</p>
          <div className="mt-5">
            <StepDots step={Math.min(o.step, 2)} />
          </div>
        </header>

        <Card className="p-5 sm:p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {o.step === 0 && (
              <motion.section
                key="q1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">{T(COPY.q1, lang)}</h2>
                <LifecycleStep value={o.lifecycle} onChange={o.setLifecycle} lang={lang} />
              </motion.section>
            )}

            {o.step === 1 && (
              <motion.section
                key="q2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">{T(COPY.q2, lang)}</h2>
                <RoleStep value={o.role} onChange={o.setRole} lang={lang} />
              </motion.section>
            )}

            {o.step === 2 && (
              <motion.section
                key="q3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">{T(COPY.q3, lang)}</h2>
                <ModifiersStep selected={o.modifiers} onToggle={o.toggleModifier} lang={lang} />
              </motion.section>
            )}

            {o.step === 3 && o.result && (
              <motion.section
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                <ResultStep result={o.result} lang={lang} onReset={o.reset} />
              </motion.section>
            )}
          </AnimatePresence>

          {o.error && o.step !== 3 && (
            <p className="mt-4 rounded-none border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {T(COPY.errorPrefix, lang)} {o.error}
            </p>
          )}

          {o.step < 3 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={o.back}
                disabled={o.step === 0 || o.isSubmitting}
                className={cn(o.step === 0 && 'invisible')}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {T(COPY.back, lang)}
              </Button>

              {o.step < 2 ? (
                <Button type="button" onClick={o.next} disabled={!stepValid}>
                  {T(COPY.next, lang)}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={o.submit} disabled={!o.canSubmit || o.isSubmitting}>
                  {o.isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      {T(COPY.saving, lang)}
                    </>
                  ) : (
                    <>
                      {T(COPY.finish, lang)}
                      <Sparkles className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </Card>

        {o.step < 3 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {T(COPY.skip, lang)}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
