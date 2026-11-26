/**
 * /admin/clearview — ClearView review queue (Design Bible Round 4A · H1).
 * Latest report per project; opens the review editor.
 */
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/page';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useClearViewQueue } from '@/hooks/useClearViewReview';
import { WorkflowStatus } from '@/components/admin/hq/WorkflowStatus';
import { SystemState } from '@/components/page/SystemState';
import { APP_ROUTES } from '@/lib/config/routes';

export default function AdminClearViewQueue() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const enabled = useFeatureFlag('hq_round4a', true);
  const { data = [], isLoading, isError, refetch } = useClearViewQueue();
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(isRu ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' }) : '—');

  if (!enabled) return <PageShell width="wide"><SystemState variant="not_found" /></PageShell>;

  return (
    <PageShell width="wide">
      <PageHeader
        title={tr('ClearView reviews', 'Проверки ClearView')}
        subtitle={tr('Latest draft per project · two reviewers before publishing', 'Последняя версия по проекту · публикация после двух проверяющих')}
        actions={<Button asChild variant="outline"><Link to="/admin/newbuilds">{tr('+ New review', '+ Новая проверка')}</Link></Button>}
      />
      {isLoading ? (
        <SystemState variant="loading" />
      ) : isError ? (
        <SystemState variant="error" onAction={() => void refetch()} />
      ) : data.length === 0 ? (
        <SystemState
          variant="empty"
          icon={ShieldCheck}
          title={tr('No ClearView drafts yet', 'Черновиков ClearView пока нет')}
          description={tr('Generate a draft from a new-development project, then review it here.', 'Создайте черновик из карточки новостройки и проверьте его здесь.')}
          actionLabel={tr('Open new developments', 'Открыть новостройки')}
          actionHref="/admin/newbuilds"
        />
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-caption uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">{tr('Project', 'Проект')}</th>
                <th className="px-4 py-2 font-semibold">{tr('Version', 'Версия')}</th>
                <th className="px-4 py-2 font-semibold">{tr('Rating', 'Рейтинг')}</th>
                <th className="px-4 py-2 font-semibold">{tr('Updated', 'Обновлено')}</th>
                <th className="px-4 py-2 font-semibold">{tr('Status', 'Статус')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link to={APP_ROUTES.ADMIN_CLEARVIEW_REVIEW(r.id)} className="font-semibold text-foreground underline-offset-4 hover:underline">
                      {r.project_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">v{r.version}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{r.grade ?? '—'} · {r.total_score ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{date(r.updated_at ?? r.generated_at)}</td>
                  <td className="px-4 py-3">
                    {r.is_published
                      ? <WorkflowStatus tone="done">{tr('Published', 'Опубликован')}</WorkflowStatus>
                      : <WorkflowStatus tone="waiting">{tr('Draft', 'Черновик')}</WorkflowStatus>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
