/**
 * useStartOnboarding — drives the routing-first 3-question onboarding at /start.
 *
 * Persists answers to `concierge_sessions` (anon or authed) and writes a
 * recommended journey into `concierge_journeys`. Recommendations are computed
 * client-side from a small rules table — Phase A keeps this deterministic and
 * AI-free; the same shape will be filled by an edge function in Phase B.
 *
 * Anonymous flow: a stable `anon_session_id` is kept in localStorage so the
 * conversion-to-user later (post-signup) can be backfilled by a trigger.
 */
import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export type WhoAnswer = 'tourist' | 'relocator' | 'investor' | 'owner';
export type GoalAnswer = 'live' | 'invest' | 'visit' | 'manage';
export type IntensityAnswer = 'short' | 'long' | 'permanent';

export interface StartAnswers {
  who: WhoAnswer | null;
  goal: GoalAnswer | null;
  intensity: IntensityAnswer | null;
}

export interface RecommendedItem {
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  route: string;
  icon: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface OnboardingResult {
  sessionId: string;
  primaryCta: { route: string; label: { en: string; ru: string } };
  items: RecommendedItem[];
  reasoning: { en: string; ru: string };
}

const ANON_KEY = 'myuno-anon-session-id';

function getOrCreateAnonId(): string {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

/** Deterministic routing rules — first matching rule wins for primary CTA. */
function recommend(answers: Required<StartAnswers>): OnboardingResult['items'] {
  const items: RecommendedItem[] = [];

  // Real estate / investor track
  if (answers.who === 'investor' || answers.goal === 'invest') {
    items.push({
      title: { en: 'Invest in Phuket', ru: 'Инвестировать на Пхукете' },
      description: {
        en: 'Off-plan & resale projects with ClearView ranking',
        ru: 'Новостройки и переуступки с рейтингом ClearView',
      },
      route: '/property/offplan',
      icon: '🏗️',
      urgency: 'high',
    });
    items.push({
      title: { en: 'Capital advisory', ru: 'Capital advisory' },
      description: {
        en: 'Talk to our investment desk',
        ru: 'Связаться с инвестиционной командой',
      },
      route: '/invest',
      icon: '💼',
      urgency: 'medium',
    });
  }

  // Relocator / long-term track
  if (answers.who === 'relocator' || answers.intensity === 'permanent' || answers.intensity === 'long') {
    items.push({
      title: { en: 'Relocation kit', ru: 'Комплект релокации' },
      description: {
        en: 'Visa, schools, banking, healthcare in one place',
        ru: 'Виза, школы, банки и медицина в одном месте',
      },
      route: '/relocate',
      icon: '🛬',
      urgency: 'high',
    });
    items.push({
      title: { en: 'Visa quiz', ru: 'Подбор визы' },
      description: {
        en: '4 questions → recommended visa type',
        ru: '4 вопроса → подходящий тип визы',
      },
      route: '/visa/quiz',
      icon: '🛂',
      urgency: 'high',
    });
    items.push({
      title: { en: 'Long-term rentals', ru: 'Долгосрочная аренда' },
      description: { en: 'Houses & condos for 6m+', ru: 'Дома и кондо от 6 месяцев' },
      route: '/property/rent',
      icon: '🏠',
      urgency: 'medium',
    });
  }

  // Owner track
  if (answers.who === 'owner' || answers.goal === 'manage') {
    items.push({
      title: { en: 'Owner portal', ru: 'Кабинет собственника' },
      description: {
        en: 'List, manage and earn from your property',
        ru: 'Разместить и управлять своей недвижимостью',
      },
      route: '/mc',
      icon: '🏢',
      urgency: 'high',
    });
  }

  // Tourist / short-term track
  if (answers.who === 'tourist' || answers.intensity === 'short' || answers.goal === 'visit') {
    items.push({
      title: { en: 'Short-term stays', ru: 'Краткосрочное жильё' },
      description: { en: 'Villas, condos, hotels with PMS-grade trust', ru: 'Виллы, кондо, отели от УК' },
      route: '/property/rent',
      icon: '🏝️',
      urgency: 'high',
    });
    items.push({
      title: { en: 'Airport transfer', ru: 'Трансфер из аэропорта' },
      description: { en: 'Meet & greet, fast-track', ru: 'Встреча, fast-track' },
      route: '/airport',
      icon: '✈️',
      urgency: 'medium',
    });
    items.push({
      title: { en: 'Discover services', ru: 'Сервисы и услуги' },
      description: {
        en: 'Yachts, restaurants, spa, pharmacies',
        ru: 'Яхты, рестораны, спа, аптеки',
      },
      route: '/discover',
      icon: '🧭',
      urgency: 'low',
    });
  }

  // Always include myUNO ID & SOS as foundation
  items.push({
    title: { en: 'Set up your myUNO ID', ru: 'Настроить myUNO ID' },
    description: {
      en: 'Single profile for visa, taxes, properties and documents',
      ru: 'Единый профиль для визы, налогов, объектов и документов',
    },
    route: '/account',
    icon: '🪪',
    urgency: 'medium',
  });

  // Dedupe by route, max 5 items
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.route) ? false : (seen.add(i.route), true))).slice(0, 5);
}

function reasoningFor(answers: Required<StartAnswers>): { en: string; ru: string } {
  const persona =
    answers.who === 'investor'
      ? { en: 'an investor', ru: 'инвестора' }
      : answers.who === 'relocator'
      ? { en: 'a future resident', ru: 'релоканта' }
      : answers.who === 'owner'
      ? { en: 'a property owner', ru: 'собственника' }
      : { en: 'a visitor', ru: 'гостя' };

  return {
    en: `Built for ${persona.en} planning to ${answers.goal} in Phuket.`,
    ru: `Подобрано для ${persona.ru}, цель — ${answers.goal === 'invest' ? 'инвестировать' : answers.goal === 'live' ? 'жить' : answers.goal === 'manage' ? 'управлять' : 'отдыхать'}.`,
  };
}

export function useStartOnboarding() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [answers, setAnswers] = useState<StartAnswers>({ who: null, goal: null, intensity: null });
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setWho = useCallback((v: WhoAnswer) => setAnswers((a) => ({ ...a, who: v })), []);
  const setGoal = useCallback((v: GoalAnswer) => setAnswers((a) => ({ ...a, goal: v })), []);
  const setIntensity = useCallback((v: IntensityAnswer) => setAnswers((a) => ({ ...a, intensity: v })), []);

  const next = useCallback(() => setStep((s) => Math.min(3, (s + 1) as 0 | 1 | 2 | 3)), []);
  const back = useCallback(() => setStep((s) => Math.max(0, (s - 1) as 0 | 1 | 2 | 3)), []);
  const reset = useCallback(() => {
    setAnswers({ who: null, goal: null, intensity: null });
    setStep(0);
    setResult(null);
    setError(null);
  }, []);

  const canSubmit = useMemo(
    () => Boolean(answers.who && answers.goal && answers.intensity),
    [answers],
  );

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const filled = answers as Required<StartAnswers>;
      const items = recommend(filled);
      const reasoning = reasoningFor(filled);

      const sessionPayload: Record<string, unknown> = {
        channel: 'web_start',
        who: filled.who,
        goal: filled.goal,
        intensity: filled.intensity,
        language,
        raw_answers: filled as unknown as Record<string, unknown>,
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      if (user?.id) {
        sessionPayload.user_id = user.id;
      } else {
        sessionPayload.anon_session_id = getOrCreateAnonId();
      }

      const { data: session, error: sessionError } = await supabase
        .from('concierge_sessions' as any)
        .insert(sessionPayload as any)
        .select('id')
        .single();

      if (sessionError) throw sessionError;
      const sessionId = (session as any).id as string;

      const primary = items[0] ?? { route: '/discover', title: { en: 'Discover', ru: 'Найти' } };

      const journeyPayload: Record<string, unknown> = {
        session_id: sessionId,
        recommended_services: items as unknown as Record<string, unknown>,
        recommended_routes: items.map((i) => i.route),
        primary_cta: primary.route,
        reasoning: language === 'ru' ? reasoning.ru : reasoning.en,
        generator: 'rules_v1',
      };
      if (user?.id) journeyPayload.user_id = user.id;

      const { error: journeyError } = await supabase
        .from('concierge_journeys' as any)
        .insert(journeyPayload as any);

      if (journeyError) throw journeyError;

      setResult({
        sessionId,
        primaryCta: { route: primary.route, label: primary.title },
        items,
        reasoning,
      });
      setStep(3);
    } catch (e) {
      console.error('Onboarding submit failed', e);
      setError(e instanceof Error ? e.message : 'Failed to save your answers');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, canSubmit, language, user?.id]);

  return {
    step,
    answers,
    setWho,
    setGoal,
    setIntensity,
    next,
    back,
    reset,
    canSubmit,
    submit,
    isSubmitting,
    result,
    error,
  };
}
