/** The public scenario and its active steps under /discover/:code/:scenario. */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeScenarios, useLifeSituations, useLifeTasks, scenarioSlug } from '@/hooks/useLifeOS';
import { buildSituationListUrl } from '@/lib/navigation/situationUrls';
import { lifeOSLabel } from '@/lib/lifeOsStructure';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
import { APP_ROUTES } from '@/lib/config/routes';
import { LifeOsPageHeader, LIFE_OS_CONTAINER, LIFE_OS_SECTION_TITLE } from './LifeOsPageHeader';

export default function LifeScenarioPage() {
  const { code = '', scenario: slug = '' } = useParams<{ code: string; scenario: string }>();
  const { language } = useLanguage();
  const t = (copy: LangValues) => pickLang(language, copy);
  const situations = useLifeSituations();
  const situation = situations.data?.find(row => row.code === code);
  const scenarios = useLifeScenarios(situation?.id);
  const scenario = scenarios.data?.find(row => scenarioSlug(row.code) === slug);
  const tasks = useLifeTasks(scenario?.id);
  const [selection, setSelection] = useState<{ scenarioId: string; taskId: string } | null>(null);
  const loading = situations.isLoading || scenarios.isLoading || tasks.isLoading;
  const failed = situations.isError || scenarios.isError || tasks.isError;
  const task = selection && selection.scenarioId === scenario?.id
    ? tasks.data?.find(row => row.id === selection.taskId) : undefined;
  const title = scenario ? lifeOSLabel(scenario, language) ?? scenario.code : '';
  const description = scenario ? lifeOSLabel(scenario, language, 'description') : null;
  const situationTitle = situation ? lifeOSLabel(situation, language) ?? situation.code : '';
  const retry = () => Promise.all([situations, scenarios, tasks].filter(query => query.isError).map(query => query.refetch()));

  return <AppLayout>
    <div className={LIFE_OS_CONTAINER}>
      {loading && <div className="space-y-3"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/2" /></div>}
      {!loading && failed && <div className="space-y-2" role="alert">
        <p className="text-destructive">{t({ ru: 'Не удалось загрузить раздел.', en: 'Could not load this section.', th: 'โหลดส่วนนี้ไม่สำเร็จ' })}</p>
        <Button variant="outline" onClick={() => void retry()}>{t({ ru: 'Попробовать ещё раз', en: 'Try again', th: 'ลองอีกครั้ง' })}</Button>
      </div>}
      {!loading && !failed && !scenario && <>
        <LifeOsPageHeader current={t({ ru: 'Раздел', en: 'Section', th: 'ส่วน' })} title={t({ ru: 'Раздел не найден', en: 'Section not found', th: 'ไม่พบส่วนนี้' })} />
        <Link className="ds-focus inline-flex min-h-11 items-center underline underline-offset-4" to={APP_ROUTES.DISCOVER_SITUATIONS}>
          {t({ ru: 'Все жизненные ситуации', en: 'All life situations', th: 'สถานการณ์ทั้งหมด' })}
        </Link>
      </>}
      {!loading && !failed && scenario && situation && <>
        <LifeOsPageHeader current={title} title={title} lead={description}>
          <Link className="ds-focus mt-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground underline underline-offset-4"
            to={buildSituationListUrl(situation.code)}>{situationTitle}</Link>
        </LifeOsPageHeader>
        <section aria-labelledby="life-tasks-title">
          <h2 id="life-tasks-title" className={LIFE_OS_SECTION_TITLE + ' mb-4 border-b border-border pb-2'}>
            {t({ ru: 'Что нужно сделать', en: 'What to do', th: 'สิ่งที่ต้องทำ' })}
          </h2>
          {!tasks.data?.length ? <p className="text-muted-foreground">{t({
            ru: 'Шаги для этого раздела ещё готовятся.', en: 'Steps for this section are being prepared.', th: 'กำลังเตรียมขั้นตอนสำหรับส่วนนี้',
          })}</p> : <ol className="grid gap-3 md:grid-cols-2">
            {tasks.data.map(row => <li key={row.id} className="flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-4">
              <p className="break-words font-medium text-foreground">{lifeOSLabel(row, language) ?? row.code}</p>
              <div>
                <Button variant="outline" className="min-h-11" onClick={() => setSelection({ scenarioId: scenario.id, taskId: row.id })}>
                  {t({ ru: 'Попросить помощи команды', en: 'Ask the team about this step', th: 'ขอความช่วยเหลือสำหรับขั้นตอนนี้' })}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>)}
          </ol>}
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted p-4">
            <p className="text-sm text-muted-foreground">{t({
              ru: 'Подборку для всей ситуации можно посмотреть на её странице.',
              en: 'Explore the catalogue for the whole situation on its page.',
              th: 'ดูแค็ตตาล็อกสำหรับสถานการณ์ทั้งหมดได้ที่หน้าสถานการณ์',
            })}</p>
            <Link className="ds-focus inline-flex min-h-11 items-center gap-1 text-sm font-medium underline underline-offset-4"
              to={buildSituationListUrl(situation.code) + '#situation-services'}>
              {t({ ru: 'Смотреть подборку', en: 'Browse the catalogue', th: 'ดูแค็ตตาล็อก' })}<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </>}
    </div>
    {!loading && !failed && task && scenario && <ConciergeHelpSheet open
      onOpenChange={open => { if (!open) setSelection(null); }}
      topic="general" initialSubject={[title, lifeOSLabel(task, language) ?? task.code].join(': ')}
      sourceData={{ source: 'life_os_task', situation_code: code, scenario_code: scenario.code, task_code: task.code }} />}
  </AppLayout>;
}
