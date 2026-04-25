/**
 * MC Onboarding Wizard — 7-step guided setup for new management companies.
 * Route: /mc/onboarding/wizard
 */
import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import {
  useMcOnboarding, useUpdateOnboardingStep, useDismissOnboarding, useCompleteOnboarding,
  ONBOARDING_STEPS, computeProgress, type OnboardingStepKey,
} from '@/hooks/useMcOnboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { CheckCircle2, Circle, Rocket, ArrowRight, X, Building2, Users, Home, Tag, Radio, CreditCard, CalendarCheck } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const STEP_META: Record<OnboardingStepKey, { icon: any; route: string; descEn: string; descRu: string }> = {
  step_company_profile: { icon: Building2, route: APP_ROUTES.MC_SETTINGS, descEn: 'Logo, contacts, legal info', descRu: 'Логотип, контакты, реквизиты' },
  step_team_invited: { icon: Users, route: APP_ROUTES.MC_STAFF, descEn: 'Invite cleaners, managers, accountant', descRu: 'Пригласите уборщиков, менеджеров, бухгалтера' },
  step_first_property: { icon: Home, route: APP_ROUTES.MC_PROPERTIES, descEn: 'Add your first property to manage', descRu: 'Добавьте первый объект для управления' },
  step_pricing_set: { icon: Tag, route: APP_ROUTES.MC_RATES, descEn: 'Set seasonal rates and rules', descRu: 'Сезонные тарифы и правила' },
  step_channel_connected: { icon: Radio, route: APP_ROUTES.MC_CHANNELS, descEn: 'Sync with Airbnb / Booking.com', descRu: 'Синхронизация с Airbnb / Booking.com' },
  step_payment_method: { icon: CreditCard, route: APP_ROUTES.MC_SUBSCRIPTION, descEn: 'Activate subscription', descRu: 'Активация подписки' },
  step_first_booking: { icon: CalendarCheck, route: APP_ROUTES.MC_BOOKINGS_LIST, descEn: 'Receive your first booking', descRu: 'Получите первое бронирование' },
};

export default function McOnboardingWizardPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany, isLoading: companyLoading } = useActiveCompany();
  const { data: progress, isLoading } = useMcOnboarding();
  const updateStep = useUpdateOnboardingStep();
  const dismiss = useDismissOnboarding();
  const complete = useCompleteOnboarding();

  // No company yet → push user to the 4-step creation flow first.
  if (!companyLoading && !activeCompany) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  if (isLoading || companyLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  const pct = computeProgress(progress);
  const allDone = pct === 100;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Запустим вашу компанию за 30 минут' : 'Set up your company in 30 minutes'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? '7 шагов, чтобы превратить myUNO в полноценную ERP вашего агентства.' : '7 steps to turn myUNO into a full ERP for your agency.'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => dismiss.mutate()} title={isRu ? 'Закрыть' : 'Dismiss'}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{isRu ? 'Прогресс' : 'Progress'}</span>
            <span className="tabular-nums font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {ONBOARDING_STEPS.filter((s) => (progress as any)?.[s.key]).length} / {ONBOARDING_STEPS.length} {isRu ? 'выполнено' : 'completed'}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {ONBOARDING_STEPS.map((step, idx) => {
          const done = (progress as any)?.[step.key] === true;
          const meta = STEP_META[step.key];
          const Icon = meta.icon;
          return (
            <Card key={step.key} className={cn('transition-all', done && 'bg-success/5 border-success/30')}>
              <CardContent className="p-4 flex items-center gap-3">
                <button
                  onClick={() => updateStep.mutate({ step: step.key, value: !done })}
                  className="shrink-0"
                  aria-label={done ? 'mark incomplete' : 'mark complete'}
                >
                  {done
                    ? <CheckCircle2 className="w-6 h-6 text-success" />
                    : <Circle className="w-6 h-6 text-muted-foreground" />}
                </button>
                <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', done && 'line-through text-muted-foreground')}>
                    {idx + 1}. {isRu ? step.ru : step.en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {isRu ? meta.descRu : meta.descEn}
                  </p>
                </div>
                <Button size="sm" variant={done ? 'ghost' : 'outline'} onClick={() => navigate(meta.route)} className="shrink-0">
                  {isRu ? 'Перейти' : 'Open'} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allDone && !progress?.completed_at && (
        <Card className="bg-gradient-to-br from-primary/10 to-success/10 border-primary/30">
          <CardContent className="p-6 text-center space-y-3">
            <Rocket className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-bold">{isRu ? 'Поздравляем — компания готова!' : 'Congratulations — your company is live!'}</h3>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Вы прошли все 7 шагов. Теперь myUNO — ваша операционная система.' : 'You completed all 7 steps. myUNO is now your operating system.'}
            </p>
            <Button onClick={() => { complete.mutate(); navigate(APP_ROUTES.MC); }}>
              {isRu ? 'В дашборд' : 'Go to dashboard'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
