import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useRelocationPlan } from '@/hooks/useRelocationPlan';
import { cn } from '@/lib/utils';
import type { RelocationPlanStep } from '@/lib/relocation/planFromQuiz';

export default function RelocationDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { plan, isLoading, isSaving, setStepStatus, progress } = useRelocationPlan();

  const title = isRu ? 'Мой план переезда' : 'My relocation plan';
  const description = isRu
    ? 'Чеклист шагов: отмечайте прогресс и открывайте гайды.'
    : 'Track steps, open guides, and keep progress in one place.';

  const cycleStatus = (current: RelocationPlanStep['status']): RelocationPlanStep['status'] => {
    if (current === 'todo') return 'doing';
    if (current === 'doing') return 'done';
    return 'todo';
  };

  const labelForStatus = (s: RelocationPlanStep['status']) => {
    if (isRu) {
      if (s === 'done') return 'Готово';
      if (s === 'doing') return 'В работе';
      return 'Не начато';
    }
    if (s === 'done') return 'Done';
    if (s === 'doing') return 'In progress';
    return 'Not started';
  };

  return (
    <AppLayout>
      <SEOHead title={title} description={description} url="https://myuno.app/relocate/my-plan" />
      <div className="px-4 pb-28 pt-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallbackPath={APP_ROUTES.RELOCATE} variant="ghost" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>

        {!user && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 rounded-none border border-amber-500/30 bg-amber-500/10 p-3">
            {isRu
              ? 'Вы не вошли в аккаунт — план сохраняется только на этом устройстве. Войдите, чтобы синхронизировать между устройствами.'
              : 'You are not signed in — the plan is stored on this device only. Sign in to sync across devices.'}
          </p>
        )}

        {isLoading && <p className="text-sm text-muted-foreground mt-6">{isRu ? 'Загрузка…' : 'Loading…'}</p>}

        {!isLoading && !plan && (
          <div className="mt-8 rounded-none border border-border bg-card p-5">
            <p className="text-sm text-foreground">
              {isRu ? 'Пока нет сохранённого плана. Пройдите квиз на странице переезда.' : 'No saved plan yet. Complete the quiz on the relocation page.'}
            </p>
            <Button asChild className="mt-4 w-full">
              <Link to={`${APP_ROUTES.RELOCATE}#relocation-quiz`}>{isRu ? 'Перейти к квизу' : 'Open quiz'}</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to={APP_ROUTES.RELOCATION_GUIDES}>{isRu ? 'Читать гайды' : 'Read guides'}</Link>
            </Button>
          </div>
        )}

        {plan && (
          <>
            <div className="mt-6 rounded-none border border-border bg-muted/30 p-4">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{isRu ? 'Прогресс' : 'Progress'}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.steps.map((step) => (
                <li key={step.id} className="rounded-none border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{isRu ? step.title_ru : step.title_en}</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {step.article_slug && (
                          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                            <Link to={APP_ROUTES.RELOCATION_GUIDE(step.article_slug)}>{isRu ? 'Гайд' : 'Guide'}</Link>
                          </Button>
                        )}
                        {step.route && (
                          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                            <Link to={step.route}>{isRu ? 'Сервис' : 'Service'}</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setStepStatus(step.id, cycleStatus(step.status))}
                      className={cn(
                        'shrink-0 rounded-none border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                        step.status === 'done' && 'border-primary bg-primary/15 text-primary',
                        step.status === 'doing' && 'border-accent text-accent-foreground',
                        step.status === 'todo' && 'border-border text-muted-foreground',
                      )}
                    >
                      {labelForStatus(step.status)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" className="w-full mt-6">
              <Link to={APP_ROUTES.RELOCATION_GUIDES}>{isRu ? 'Все гайды' : 'All guides'}</Link>
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
