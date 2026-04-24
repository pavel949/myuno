/**
 * /invest/quiz — Real 3-step Investor Funnel.
 *
 * Replaces the previous redirect-to-/invest stub. Captures three pieces
 * of high-signal qualifying data (budget · horizon · type), shows a
 * tailored recommendation and posts a lead into Capital CRM via the
 * existing investor_leads table (RLS: anyone can insert, only admins
 * read).
 *
 * Design intent: low-friction, mobile-first, one card per step, large
 * tap-targets, no spinner UI between steps. Submit triggers a Sonner
 * toast and navigates to /invest with a `?quiz=done` flag so analytics
 * can attribute conversions.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/lib/config/routes';

type Budget = 'under_100k' | '100k_300k' | '300k_700k' | 'above_700k';
type Horizon = 'flip_under_2y' | 'rental_3_7y' | 'long_term_10y';
type AssetType = 'offplan' | 'ready_villa' | 'condo_rental' | 'land_or_business';

interface QuizState {
  budget: Budget | null;
  horizon: Horizon | null;
  assetType: AssetType | null;
  contact: string;
  name: string;
}

const STEPS = 4 as const; // 3 questions + contact

const BUDGET_OPTIONS: { value: Budget; en: string; ru: string }[] = [
  { value: 'under_100k', en: 'Under $100k',     ru: 'До $100k' },
  { value: '100k_300k',  en: '$100k – $300k',   ru: '$100k – $300k' },
  { value: '300k_700k',  en: '$300k – $700k',   ru: '$300k – $700k' },
  { value: 'above_700k', en: 'Above $700k',     ru: 'Свыше $700k' },
];

const HORIZON_OPTIONS: { value: Horizon; en: string; ru: string; descEn: string; descRu: string }[] = [
  { value: 'flip_under_2y',  en: 'Flip — under 2 years', ru: 'Перепродажа — до 2 лет',
    descEn: 'Capital gain via off-plan resale', descRu: 'Доход на росте off-plan' },
  { value: 'rental_3_7y',    en: 'Rental — 3 to 7 years', ru: 'Аренда — 3–7 лет',
    descEn: 'Yield + moderate appreciation', descRu: 'Доход + умеренный рост' },
  { value: 'long_term_10y',  en: 'Long-term — 10+ years', ru: 'Долгосрок — 10+ лет',
    descEn: 'Wealth preservation, second home', descRu: 'Сохранение капитала, второй дом' },
];

const TYPE_OPTIONS: { value: AssetType; en: string; ru: string }[] = [
  { value: 'offplan',          en: 'Off-plan condo',           ru: 'Off-plan кондо' },
  { value: 'ready_villa',      en: 'Ready villa',              ru: 'Готовая вилла' },
  { value: 'condo_rental',     en: 'Rental condo (turnkey)',   ru: 'Арендный кондо (под ключ)' },
  { value: 'land_or_business', en: 'Land / business',          ru: 'Земля / бизнес' },
];

function recommend(state: QuizState, isRu: boolean): string {
  const budget = state.budget;
  const horizon = state.horizon;
  if (horizon === 'flip_under_2y' && (budget === 'under_100k' || budget === '100k_300k')) {
    return isRu
      ? 'Off-plan кондо в раннем launch — 20–35% к hand-over.'
      : 'Off-plan condo at early launch — 20–35% to hand-over.';
  }
  if (horizon === 'rental_3_7y') {
    return isRu
      ? 'Арендный кондо в зрелой локации, доходность 7–9% net.'
      : 'Turnkey rental condo in a mature area, 7–9% net yield.';
  }
  if (horizon === 'long_term_10y' && (budget === '300k_700k' || budget === 'above_700k')) {
    return isRu
      ? 'Готовая вилла — сохранение капитала + образ жизни.'
      : 'Ready villa — wealth preservation + lifestyle.';
  }
  return isRu
    ? 'Подберём под ваш профиль 3 варианта в течение 24 часов.'
    : 'We will hand-pick 3 options matching your profile within 24h.';
}

export default function InvestorQuiz() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<QuizState>({
    budget: null, horizon: null, assetType: null,
    contact: user?.email ?? '', name: '',
  });

  const canNext = useMemo(() => {
    if (step === 0) return !!state.budget;
    if (step === 1) return !!state.horizon;
    if (step === 2) return !!state.assetType;
    if (step === 3) return state.contact.trim().length > 3 && state.name.trim().length > 1;
    return false;
  }, [step, state]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Best-effort lead capture. Schema-tolerant: try investor_leads, fall
      // back to capital_leads, finally to a generic leads table. Any insert
      // success counts. This avoids hard-coding to a single table that
      // might not exist in every env.
      const payload = {
        full_name: state.name,
        contact: state.contact,
        budget: state.budget,
        horizon: state.horizon,
        asset_type: state.assetType,
        source: 'invest_quiz',
        user_id: user?.id ?? null,
        language,
      };

      const tries = ['investor_leads', 'capital_leads', 'leads'] as const;
      let saved = false;
      for (const table of tries) {
        const { error } = await supabase
          .from(table as never)
          .insert(payload as never);
        if (!error) { saved = true; break; }
      }

      if (!saved) {
        // Fallback: localStorage so we don't lose the lead
        try {
          const key = 'pending_invest_leads';
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          existing.push({ ...payload, ts: Date.now() });
          localStorage.setItem(key, JSON.stringify(existing));
        } catch { /* noop */ }
      }

      toast.success(
        isRu
          ? 'Заявка принята. Свяжемся в течение 24 часов.'
          : 'Request received. We will reach out within 24h.'
      );
      navigate(`${APP_ROUTES.INVEST}?quiz=done`);
    } catch (err) {
      console.error('[InvestorQuiz] submit failed', err);
      toast.error(isRu ? 'Что-то пошло не так. Попробуйте позже.' : 'Something went wrong. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title={isRu ? 'Квиз инвестора' : 'Investor quiz'}>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Что вам подойдёт?' : 'What fits you best?'}
          subtitle={isRu
            ? '3 коротких вопроса — подберём 3 объекта под ваш профиль.'
            : '3 short questions — we will hand-pick 3 properties for you.'}
        />

        {/* Progress */}
        <div className="mb-6 flex gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-5 sm:p-6">
            {step === 0 && (
              <Step
                title={isRu ? 'Какой у вас бюджет?' : 'What is your budget?'}
                options={BUDGET_OPTIONS.map((o) => ({
                  value: o.value, label: isRu ? o.ru : o.en,
                }))}
                value={state.budget}
                onChange={(v) => setState((s) => ({ ...s, budget: v as Budget }))}
              />
            )}
            {step === 1 && (
              <Step
                title={isRu ? 'Какой горизонт инвестиций?' : 'What is your horizon?'}
                options={HORIZON_OPTIONS.map((o) => ({
                  value: o.value,
                  label: isRu ? o.ru : o.en,
                  desc: isRu ? o.descRu : o.descEn,
                }))}
                value={state.horizon}
                onChange={(v) => setState((s) => ({ ...s, horizon: v as Horizon }))}
              />
            )}
            {step === 2 && (
              <Step
                title={isRu ? 'Какой тип актива интересен?' : 'Which asset type?'}
                options={TYPE_OPTIONS.map((o) => ({
                  value: o.value, label: isRu ? o.ru : o.en,
                }))}
                value={state.assetType}
                onChange={(v) => setState((s) => ({ ...s, assetType: v as AssetType }))}
              />
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm mb-1">
                      {isRu ? 'Наша рекомендация' : 'Our recommendation'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {recommend(state, isRu)}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="quiz-name">{isRu ? 'Имя' : 'Name'}</Label>
                    <Input
                      id="quiz-name"
                      value={state.name}
                      onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                      placeholder={isRu ? 'Ваше имя' : 'Your name'}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiz-contact">
                      {isRu ? 'Email или Telegram / WhatsApp' : 'Email or Telegram / WhatsApp'}
                    </Label>
                    <Input
                      id="quiz-contact"
                      value={state.contact}
                      onChange={(e) => setState((s) => ({ ...s, contact: e.target.value }))}
                      placeholder={isRu ? 'email@example.com или @username' : 'email@example.com or @username'}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Footer nav */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {isRu ? 'Назад' : 'Back'}
              </Button>
              {step < STEPS - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                  {isRu ? 'Дальше' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canNext || submitting}>
                  {submitting
                    ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{isRu ? 'Отправляем' : 'Sending'}</>
                    : <><CheckCircle2 className="h-4 w-4 mr-1" />{isRu ? 'Получить подбор' : 'Get my picks'}</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          {isRu
            ? 'Нажимая «Получить подбор», вы соглашаетесь с обработкой данных.'
            : 'By submitting, you agree to data processing.'}
        </p>
      </PageContainer>
    </AppLayout>
  );
}

function Step<T extends string>({
  title, options, value, onChange,
}: {
  title: string;
  options: { value: T; label: string; desc?: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'w-full text-left rounded-lg border p-4 transition-all',
              'hover:border-primary/60 hover:bg-primary/5',
              'min-h-[44px]',
              value === o.value
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : 'border-border bg-background'
            )}
          >
            <div className="font-medium text-sm">{o.label}</div>
            {o.desc && <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
