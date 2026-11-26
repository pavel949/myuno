/**
 * /admin/clearview/:reportId — ClearView review editor (Design Bible Round 4A · H1).
 *
 * Left: 8 canon categories with status. Centre: item-level scoring with
 * evidence type; missing evidence caps confidence. Public finding and member
 * detail side by side. Right: live rating, publish checklist, override log,
 * two-person review (server-enforced by hq_publish_clearview_report).
 */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageShell, PageHeader } from '@/components/page';
import { SystemState } from '@/components/page/SystemState';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useClearViewReview } from '@/hooks/useClearViewReview';
import { useDualApproval } from '@/hooks/useDualApproval';
import { WorkflowStatus, type WorkflowTone } from '@/components/admin/hq/WorkflowStatus';
import { CategoryEditor } from '@/components/admin/hq/clearview/CategoryEditor';
import { RatingPanel } from '@/components/admin/hq/clearview/RatingPanel';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';
import {
  analysisKey, categoryStatus, liveScore, overallConfidence, parseCategoryReview, publishChecklist, toReportPatch,
  type CategoryMap, type CategoryStatus, type ReviewModifier,
} from '@/lib/clearview/reviewModel';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<CategoryStatus, WorkflowTone> = { done: 'done', active: 'active', waiting: 'waiting' };

export default function AdminClearViewReview() {
  const { reportId } = useParams<{ reportId: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const enabled = useFeatureFlag('hq_round4a', true);
  const { data: report, isLoading, isError, refetch, save, publish } = useClearViewReview(reportId);
  const dual = useDualApproval('clearview_report', reportId);

  const initial = useMemo<CategoryMap>(() => {
    const out: CategoryMap = {};
    if (!report) return out;
    for (const c of CLEARVIEW_CATEGORIES) out[analysisKey(c)] = parseCategoryReview(report.analysis[analysisKey(c)], report.scores[c.scoreField] ?? null);
    return out;
  }, [report]);

  const [edits, setEdits] = useState<{ id: string; categories: CategoryMap; modifiers: ReviewModifier[] } | null>(null);
  const [selected, setSelected] = useState<string>(analysisKey(CLEARVIEW_CATEGORIES[0]));
  const working = edits && edits.id === report?.id ? edits : null;
  const categories = working?.categories ?? initial;
  const modifiers = working?.modifiers ?? report?.modifiers ?? [];
  const isDirty = Boolean(working);

  const freshApprovals = useMemo(() => {
    const since = report?.updated_at ? new Date(report.updated_at).getTime() : 0;
    return dual.approvals.filter((a) => new Date(a.created_at).getTime() >= since);
  }, [dual.approvals, report?.updated_at]);

  if (!enabled) return <PageShell width="wide"><SystemState variant="not_found" /></PageShell>;
  if (isLoading) return <PageShell width="wide"><SystemState variant="loading" rows={6} /></PageShell>;
  if (isError) return <PageShell width="wide"><SystemState variant="error" onAction={() => void refetch()} /></PageShell>;
  if (!report) {
    return (
      <PageShell width="wide">
        <SystemState variant="not_found" title={tr('Report not found', 'Отчёт не найден')} actionLabel={tr('Back to reviews', 'К проверкам')} actionHref={APP_ROUTES.ADMIN_CLEARVIEW} />
      </PageShell>
    );
  }

  const live = liveScore(categories, modifiers);
  const checks = publishChecklist(categories, new Set(freshApprovals.map((a) => a.approver_id)).size);
  const evidenceItems = Object.values(categories).reduce((a, c) => a + c.items.length, 0);
  const activeCat = CLEARVIEW_CATEGORIES.find((c) => analysisKey(c) === selected) ?? CLEARVIEW_CATEGORIES[0];
  const busy = save.isPending || publish.isPending || dual.approve.isPending;
  const hasApproved = Boolean(user?.id && freshApprovals.some((a) => a.approver_id === user.id));

  const update = (next: Partial<{ categories: CategoryMap; modifiers: ReviewModifier[] }>) =>
    setEdits({ id: report.id, categories: next.categories ?? categories, modifiers: next.modifiers ?? modifiers });

  const handleSave = async () => {
    try {
      await save.mutateAsync(toReportPatch(categories, modifiers, report.analysis));
      setEdits(null);
      toast.success(tr('Draft saved. Earlier sign-offs no longer count.', 'Черновик сохранён. Прежние подписи больше не учитываются.'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('Could not save', 'Не удалось сохранить'));
    }
  };
  const handleApprove = async () => {
    try {
      await dual.approve.mutateAsync(undefined);
      toast.success(tr('Signed off', 'Подписано'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('Could not sign off', 'Не удалось подписать'));
    }
  };
  const handlePublish = async () => {
    try {
      await publish.mutateAsync();
      toast.success(tr('Rating published', 'Рейтинг опубликован'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr('Could not publish', 'Не удалось опубликовать'));
    }
  };

  const reviewerLine = freshApprovals.length >= 2
    ? tr('second reviewer: signed', 'второй проверяющий: подписал')
    : tr('second reviewer: pending', 'второй проверяющий: ожидается');

  return (
    <PageShell width="wide">
      <PageHeader
        title={`ClearView · ${report.project_name}`}
        subtitle={`v${report.version} · ${reviewerLine}${report.is_published ? ` · ${tr('published', 'опубликован')}` : ''}`}
        breadcrumbs={[{ label: tr('ClearView reviews', 'Проверки ClearView'), href: APP_ROUTES.ADMIN_CLEARVIEW }, { label: report.project_name }]}
      />
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <nav aria-label={tr('Categories', 'Категории')} className="flex flex-col gap-1 border border-border bg-card p-3">
          <span className="px-2 pb-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            {report.project_name} · {tr('draft', 'черновик')} v{report.version}
          </span>
          {CLEARVIEW_CATEGORIES.map((c) => {
            const key = analysisKey(c);
            const r = categories[key];
            const st = categoryStatus(r);
            const on = key === selected;
            return (
              <button
                key={key} type="button" aria-current={on ? 'true' : undefined} onClick={() => setSelected(key)}
                className={cn('flex min-h-11 items-center justify-between gap-2 px-2 text-left text-sm hover:bg-muted', on && 'bg-muted font-semibold')}
              >
                <span className="text-foreground">{isRu ? c.shortRu : c.shortEn}</span>
                <WorkflowStatus tone={STATUS_TONE[st]}>{r.score == null ? '—' : Math.round(r.score * 10)}</WorkflowStatus>
              </button>
            );
          })}
          <div className="mt-1 flex min-h-11 items-center justify-between border-t border-border px-2 pt-2 text-sm">
            <span className="text-foreground">{tr('Evidence ledger', 'Реестр оснований')}</span>
            <WorkflowStatus tone="neutral">{evidenceItems} {tr('items', 'пунктов')}</WorkflowStatus>
          </div>
        </nav>

        <CategoryEditor
          key={activeCat.code}
          category={activeCat}
          review={categories[analysisKey(activeCat)]}
          isRu={isRu}
          readOnly={report.is_published}
          onChange={(next) => update({ categories: { ...categories, [analysisKey(activeCat)]: next } })}
        />

        <div className="lg:col-span-2 xl:col-span-1">
          <RatingPanel
            isRu={isRu}
            score={live.score}
            grade={live.grade}
            confidence={overallConfidence(categories)}
            checks={checks}
            modifiers={modifiers}
            approvals={freshApprovals}
            isPublished={report.is_published}
            publicHref={APP_ROUTES.OFFPLAN_DETAIL(report.project_id)}
            canApprove={isAdmin}
            hasApproved={hasApproved}
            isDirty={isDirty}
            busy={busy}
            onModifiersChange={(m) => update({ modifiers: m })}
            onSave={() => void handleSave()}
            onApprove={() => void handleApprove()}
            onPublish={() => void handlePublish()}
          />
        </div>
      </div>
    </PageShell>
  );
}
