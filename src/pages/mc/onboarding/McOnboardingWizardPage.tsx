/**
 * MC Onboarding Wizard — 7-step guided setup for new management companies.
 * Route: /mc/onboarding/wizard
 */
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
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

const STEP_META: Record<OnboardingStepKey, { icon: LucideIcon; route: string; descEn: string; descRu: string }> = {
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
  const { activeCompany, isLoading: companyLoading, isError: companyError, refetch: reloadCompany } = useActiveCompany();
  const { data: progress, isLoading, isError, refetch } = useMcOnboarding();
  const updateStep = useUpdateOnboardingStep();
  const dismiss = useDismissOnboarding();
  const complete = useCompleteOnboarding();

  // A failed membership read must not be treated as an unregistered company.
  if (companyError) {
    return <div role="alert" className="p-6 space-y-3">
      <p>{isRu ? 'Не удалось загрузить компанию. Повторите попытку.' : 'Could not load your company. Please try again.'}</p>
      <Button onClick={() => { void reloadCompany(); }}>{isRu ? 'Повторить' : 'Retry'}</Button>
    </div>;
  }
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
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Настройка рабочего пространства' : 'Workspace setup'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? 'Заполняйте разделы по мере готовности. Команду, объекты и правила можно добавить позже.' : 'Set up sections when you are ready. Add your team, properties and rules later.'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => dismiss.mutate(undefined, { onSuccess: () => navigate(APP_ROUTES.MC), onError: () => toast.error(isRu ? 'Не удалось закрыть' : 'Could not dismiss') })} title={isRu ? 'Закрыть' : 'Dismiss'} aria-label={isRu ? 'Закрыть' : 'Dismiss'}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate(APP_ROUTES.MC)}>{isRu ? 'Открыть рабочий кабинет' : 'Open workspace'}</Button>
        <Button variant="outline" onClick={() => navigate(APP_ROUTES.MC_SETTINGS)}>{isRu ? 'Настройки' : 'Settings'}</Button>
      </div>

      {isError && <div role="alert" className="border border-destructive/30 p-4 space-y-2">
        <p>{isRu ? 'Не удалось загрузить отметки. Разделы доступны; сохранённый прогресс пока неизвестен.' : 'Could not load checklist marks. Sections are available; saved progress is currently unknown.'}</p>
        <Button variant="outline" onClick={() => { void refetch(); }}>{isRu ? 'Повторить' : 'Retry'}</Button>
      </div>}

      {!isError && <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{isRu ? 'Ваши отметки' : 'Your checklist'}</span>
            <span className="tabular-nums font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {ONBOARDING_STEPS.filter((step) => progress?.[step.key] === true).length} / {ONBOARDING_STEPS.length} {isRu ? 'выполнено' : 'completed'}
          </p>
        </CardContent>
      </Card>}
      <p className="text-sm text-muted-foreground">{isRu ? 'Отметки — ваш личный ориентир. Они не подтверждают настройку правил или готовность платежей. Все шаги можно выполнить позже.' : 'Checklist marks are a personal guide. They do not confirm configured rules or payment readiness. Every step can be completed later.'}</p>

      <div className="space-y-2">
        {ONBOARDING_STEPS.map((step, idx) => {
          const done = progress?.[step.key] === true;
          const meta = STEP_META[step.key];
          const Icon = meta.icon;
          return (
            <Card key={step.key} className={cn('transition-all', done && 'bg-success/5 border-success/30')}>
              <CardContent className="p-4 flex items-center gap-3">
                <button
                  onClick={() => updateStep.mutate({ step: step.key, value: !done }, { onError: () => toast.error(isRu ? 'Не удалось сохранить шаг' : 'Could not save step') })}
                  className="shrink-0 disabled:opacity-50"
                  disabled={isError || updateStep.isPending}
                  aria-pressed={done}
                  aria-label={`${isRu ? (done ? 'Снять отметку' : 'Отметить') : (done ? 'Mark incomplete' : 'Mark complete')}: ${isRu ? step.ru : step.en}`}
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
                  <p className="text-xs text-muted-foreground mt-0.5">
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

      {!isError && allDone && !progress?.completed_at && (
        <Card className="bg-gradient-to-br from-primary/10 to-success/10 border-primary/30">
          <CardContent className="p-6 text-center space-y-3">
            <Rocket className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-bold">{isRu ? 'Все пункты отмечены' : 'All items marked'}</h3>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Можно вернуться к настройкам в любое время.' : 'You can return to setup at any time.'}
            </p>
            <Button disabled={complete.isPending} onClick={() => complete.mutate(undefined, {
              onSuccess: () => navigate(APP_ROUTES.MC),
              onError: () => toast.error(isRu ? 'Не удалось завершить' : 'Could not finish'),
            })}>
              {isRu ? 'В дашборд' : 'Go to dashboard'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
