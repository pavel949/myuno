/** /discover/:code/:scenario — Life OS level 2–3: one scenario and its tasks, read from the backend. */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeScenarios, useLifeSituations, useLifeTasks, scenarioSlug, type LifeTask } from '@/hooks/useLifeOS';
import { buildSituationListUrl } from '@/lib/navigation/situationUrls';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { APP_ROUTES } from '@/lib/config/routes';
import { LifeOsPageHeader, LIFE_OS_CONTAINER, LIFE_OS_SECTION_TITLE } from './LifeOsPageHeader';

export default function LifeScenarioPage() {
  const { code = '', scenario: slug = '' } = useParams<{ code: string; scenario: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const situations = useLifeSituations();
  const situation = situations.data?.find(s => s.code === code);
  const scenarios = useLifeScenarios(situation?.id);
  const scenario = scenarios.data?.find(s => scenarioSlug(s.code) === slug);
  const tasks = useLifeTasks(scenario?.id);
  const [task, setTask] = useState<LifeTask | null>(null);
  const loading = situations.isLoading || scenarios.isLoading || (Boolean(scenario) && tasks.isLoading);
  const failed = situations.isError || scenarios.isError || tasks.isError;
  const title = scenario ? (isRu ? scenario.title_ru : scenario.title_en) : '';
  const desc = scenario ? (isRu ? scenario.description_ru : scenario.description_en) : null;
  const situationTitle = situation ? (isRu ? situation.title_ru : situation.title_en) : '';
  const taskTitle = (t: LifeTask) => (isRu ? t.title_ru : t.title_en);

  return <AppLayout>
    <div className={LIFE_OS_CONTAINER}>
      {loading && <div className="space-y-3"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/2" /></div>}
      {!loading && failed && <p role="alert" className="text-destructive">{isRu ? 'Не удалось загрузить раздел. Обновите страницу.' : 'Could not load this section. Please refresh.'}</p>}
      {!loading && !failed && !scenario && <>
        <LifeOsPageHeader current={isRu ? 'Раздел' : 'Section'} title={isRu ? 'Раздел не найден' : 'Section not found'} />
        <Link className="ds-focus inline-flex min-h-11 items-center underline underline-offset-4" to={APP_ROUTES.DISCOVER_SITUATIONS}>{isRu ? 'Все жизненные ситуации' : 'All life situations'}</Link>
      </>}
      {!loading && !failed && scenario && situation && <>
        <LifeOsPageHeader current={title} title={title} lead={desc}>
          <Link className="ds-focus mt-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground underline underline-offset-4" to={buildSituationListUrl(situation.code)}>{situationTitle}</Link>
        </LifeOsPageHeader>
        <section aria-labelledby="life-tasks-title">
          <h2 id="life-tasks-title" className={`${LIFE_OS_SECTION_TITLE} mb-4 border-b border-border pb-2`}>{isRu ? 'Что нужно сделать' : 'What to do'}</h2>
          {(tasks.data ?? []).length === 0 ? <p className="text-muted-foreground">{isRu ? 'Шаги для этого раздела ещё готовятся.' : 'Steps for this section are being prepared.'}</p> :
          <ol className="grid gap-3 md:grid-cols-2">{(tasks.data ?? []).map((t, i) => <li key={t.id} className="flex flex-col justify-between gap-4 rounded-[var(--bible-radius-card)] border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-medium text-foreground">{taskTitle(t)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setTask(t)}>{isRu ? 'Отправить заявку' : 'Send a request'}<ArrowRight className="size-4" aria-hidden="true" /></Button>
            </div>
          </li>)}</ol>}
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-[var(--bible-radius-card)] border border-border bg-muted p-4">
            <CircleCheck className="size-5 text-primary" aria-hidden="true" />
            <p className="flex-1 text-sm text-muted-foreground">{isRu ? 'Подходящие сервисы для этой ситуации собраны на её странице.' : 'Matching services for this situation are on its page.'}</p>
            <Link className="ds-focus inline-flex min-h-11 items-center gap-1 text-sm font-medium underline underline-offset-4" to={`${buildSituationListUrl(situation.code)}#situation-services`}>{isRu ? 'Смотреть сервисы' : 'See services'}<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </>}
    </div>
    {task && scenario && <ConciergeHelpSheet open onOpenChange={(o) => { if (!o) setTask(null); }} topic="general" initialSubject={`${title}: ${taskTitle(task)}`} sourceData={{ source: 'life_os_task', situation_code: code, scenario_code: scenario.code, task_code: task.code }} />}
  </AppLayout>;
}
