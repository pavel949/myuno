/**
 * /start — Routing-first 3-question onboarding.
 *
 * Q1 Who are you? → Q2 What for? → Q3 How long? → personalised path
 * Persists into concierge_sessions + concierge_journeys (anon-friendly).
 * Behind feature flag `feature_flag:concierge_routing_v1` (default OFF).
 */
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useStartOnboarding,
  type WhoAnswer,
  type GoalAnswer,
  type IntensityAnswer,
} from '@/hooks/useStartOnboarding';

type L = 'en' | 'ru';
type Copy = { en: string; ru: string };

const T = (c: Copy, l: L) => c[l] ?? c.en;

const WHO_OPTIONS: { value: WhoAnswer; label: Copy; icon: string; desc: Copy }[] = [
  {
    value: 'tourist',
    icon: '🏝️',
    label: { en: 'Visitor / tourist', ru: 'Турист' },
    desc: { en: 'I’m here for a holiday', ru: 'Приехал отдохнуть' },
  },
  {
    value: 'relocator',
    icon: '🛬',
    label: { en: 'Relocating / digital nomad', ru: 'Переезжаю / номад' },
    desc: { en: 'Long-term living in Phuket', ru: 'Долгосрочно жить на Пхукете' },
  },
  {
    value: 'investor',
    icon: '💼',
    label: { en: 'Investor', ru: 'Инвестор' },
    desc: { en: 'Buying property or business', ru: 'Покупаю недвижимость или бизнес' },
  },
  {
    value: 'owner',
    icon: '🏢',
    label: { en: 'Property owner', ru: 'Собственник' },
    desc: { en: 'I already own here', ru: 'У меня уже есть объект' },
  },
];

const GOAL_OPTIONS: { value: GoalAnswer; label: Copy; icon: string }[] = [
  { value: 'visit', icon: '🧭', label: { en: 'Enjoy a great trip', ru: 'Хорошо провести время' } },
  { value: 'live', icon: '🏠', label: { en: 'Live & settle in', ru: 'Жить и обустроиться' } },
  { value: 'invest', icon: '📈', label: { en: 'Invest & earn', ru: 'Инвестировать и зарабатывать' } },
  { value: 'manage', icon: '🛠️', label: { en: 'Manage what I own', ru: 'Управлять активами' } },
];

const INTENSITY_OPTIONS: { value: IntensityAnswer; label: Copy; icon: string; desc: Copy }[] = [
  {
    value: 'short',
    icon: '📅',
    label: { en: 'Up to 30 days', ru: 'До 30 дней' },
    desc: { en: 'Short visit', ru: 'Короткий визит' },
  },
  {
    value: 'long',
    icon: '🗓️',
    label: { en: '1–12 months', ru: '1–12 месяцев' },
    desc: { en: 'Extended stay', ru: 'Долгий приезд' },
  },
  {
    value: 'permanent',
    icon: '🏡',
    label: { en: '12 months +', ru: 'Больше года' },
    desc: { en: 'Permanent base', ru: 'На постоянной основе' },
  },
];

const COPY = {
  title: { en: 'Welcome to myUNO', ru: 'Добро пожаловать в myUNO' },
  subtitle: {
    en: '3 quick questions and we’ll route you to the right desk.',
    ru: '3 коротких вопроса — и мы покажем нужное направление.',
  },
  q1: { en: 'Who are you?', ru: 'Кто вы?' },
  q2: { en: 'What brings you here?', ru: 'Какая у вас цель?' },
  q3: { en: 'For how long?', ru: 'На какой срок?' },
  next: { en: 'Continue', ru: 'Дальше' },
  back: { en: 'Back', ru: 'Назад' },
  finish: { en: 'See my plan', ru: 'Показать маршрут' },
  saving: { en: 'Building your plan…', ru: 'Готовим маршрут…' },
  resultTitle: { en: 'Here’s your starting path', ru: 'Ваш стартовый маршрут' },
  primaryCta: { en: 'Start here', ru: 'Начать отсюда' },
  exploreLater: { en: 'Explore on my own', ru: 'Посмотреть самому' },
  redo: { en: 'Redo questions', ru: 'Пройти заново' },
  skip: { en: 'Skip onboarding', ru: 'Пропустить' },
  errorPrefix: { en: 'Could not save — please retry:', ru: 'Не удалось сохранить — попробуйте ещё раз:' },
  flagOffTitle: { en: 'Onboarding planned · Q3 2026', ru: 'Онбординг запланировано · Q3 2026' },
  flagOffBody: {
    en: 'The guided 3-question flow ships in Q3 2026. Meanwhile you can explore the platform directly.',
    ru: 'Гайд из трёх вопросов выходит в Q3 2026. Пока — изучите платформу самостоятельно.',
  },
  goHome: { en: 'Go to home', ru: 'На главную' },
};

interface OptionGridProps<T extends string> {
  options: { value: T; label: Copy; icon: string; desc?: Copy }[];
  selected: T | null;
  onSelect: (v: T) => void;
  lang: L;
}

function OptionGrid<T extends string>({ options, selected, onSelect, lang }: OptionGridProps<T>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'relative flex items-start gap-3 rounded-none border-2 bg-card p-4 text-left transition-all min-h-[88px]',
              'hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
            )}
            aria-pressed={isActive}
          >
            <span className="text-2xl shrink-0" aria-hidden>
              {opt.icon}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">{T(opt.label, lang)}</span>
              {opt.desc && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{T(opt.desc, lang)}</span>
              )}
            </span>
            {isActive && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

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

export default function StartOnboarding() {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as L;
  const navigate = useNavigate();
  const flagOn = useFeatureFlag('concierge_routing_v1', true);

  const {
    step,
    answers,
    setWho,
    setGoal,
    setIntensity,
    next,
    back,
    submit,
    canSubmit,
    isSubmitting,
    result,
    error,
    reset,
  } = useStartOnboarding();

  // Feature flag gating — show a polite placeholder so the route is always discoverable
  if (!flagOn) {
    return (
      <AppLayout showFooter={false}>
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
            <Button onClick={() => navigate(APP_ROUTES.HOME)} className="w-full">
              {T(COPY.goHome, lang)}
            </Button>
          </Card>
        </main>
      </AppLayout>
    );
  }

  const stepValid =
    (step === 0 && !!answers.who) || (step === 1 && !!answers.goal) || (step === 2 && !!answers.intensity);

  return (
    <AppLayout showFooter={false}>
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Helmet>
        <title>{T(COPY.title, lang)} · myUNO</title>
        <meta name="description" content={T(COPY.subtitle, lang)} />
      </Helmet>

      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-none bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{T(COPY.title, lang)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{T(COPY.subtitle, lang)}</p>
          <div className="mt-5">
            <StepDots step={Math.min(step, 2)} />
          </div>
        </header>

        <Card className="p-5 sm:p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section
                key="q1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                aria-labelledby="q1-title"
                className="space-y-4"
              >
                <h2 id="q1-title" className="text-lg font-semibold">
                  {T(COPY.q1, lang)}
                </h2>
                <OptionGrid options={WHO_OPTIONS} selected={answers.who} onSelect={setWho} lang={lang} />
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="q2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                aria-labelledby="q2-title"
                className="space-y-4"
              >
                <h2 id="q2-title" className="text-lg font-semibold">
                  {T(COPY.q2, lang)}
                </h2>
                <OptionGrid options={GOAL_OPTIONS} selected={answers.goal} onSelect={setGoal} lang={lang} />
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="q3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                aria-labelledby="q3-title"
                className="space-y-4"
              >
                <h2 id="q3-title" className="text-lg font-semibold">
                  {T(COPY.q3, lang)}
                </h2>
                <OptionGrid
                  options={INTENSITY_OPTIONS}
                  selected={answers.intensity}
                  onSelect={setIntensity}
                  lang={lang}
                />
              </motion.section>
            )}

            {step === 3 && result && (
              <motion.section
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                aria-labelledby="result-title"
                className="space-y-5"
              >
                <header className="text-center">
                  <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h2 id="result-title" className="text-lg font-semibold">
                    {T(COPY.resultTitle, lang)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{T(result.reasoning, lang)}</p>
                </header>

                <ul className="space-y-2">
                  {result.items.map((item, idx) => (
                    <li key={item.route}>
                      <button
                        type="button"
                        onClick={() => navigate(item.route)}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-none border bg-card p-3 text-left transition-all min-h-[64px]',
                          'hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          idx === 0 && 'border-primary/60 bg-primary/5',
                        )}
                      >
                        <span className="text-2xl shrink-0" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {T(item.title, lang)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {T(item.description, lang)}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => navigate(result.primaryCta.route)}
                  >
                    {T(COPY.primaryCta, lang)}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate(APP_ROUTES.DISCOVER)}>
                    {T(COPY.exploreLater, lang)}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {T(COPY.redo, lang)}
                </button>
              </motion.section>
            )}
          </AnimatePresence>

          {error && step !== 3 && (
            <p className="mt-4 rounded-none border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {T(COPY.errorPrefix, lang)} {error}
            </p>
          )}

          {/* Footer nav for question steps */}
          {step < 3 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={step === 0 || isSubmitting}
                className={cn(step === 0 && 'invisible')}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {T(COPY.back, lang)}
              </Button>

              {step < 2 ? (
                <Button type="button" onClick={next} disabled={!stepValid}>
                  {T(COPY.next, lang)}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
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

        {step < 3 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.HOME)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {T(COPY.skip, lang)}
            </button>
          </div>
        )}
      </div>
    </main>
    </AppLayout>
  );
}
