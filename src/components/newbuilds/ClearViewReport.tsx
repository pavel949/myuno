/**
 * ClearViewReport — full ClearView V3 due-diligence block.
 *
 * Layout:
 *  ┌───────────────────────────────────────────────┐
 *  │ Header (Shield + Admin actions)              │
 *  │ Conflict-of-interest banner (if brokered)    │
 *  │ FREE SUMMARY                                 │
 *  │  · Gauge + Recommendation chip              │
 *  │  · Radar (8 categories)                      │
 *  │  · Top-3 strengths / Top-3 risks             │
 *  │  · Executive summary                         │
 *  │ PAYWALL → FULL REPORT                        │
 *  │  · Per-category findings                     │
 *  │  · Evidence gaps                             │
 *  │  · Modifiers                                 │
 *  │  · All recommendations                       │
 *  └───────────────────────────────────────────────┘
 */
import React from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIPPLeadEvent } from '@/hooks/useIPPLeadEvent';
import {
  useDueDiligenceReport,
  useGenerateDueDiligence,
  useTogglePublishDueDiligence,
} from '@/hooks/useDueDiligence';
import { useClearViewAccess } from '@/hooks/useClearViewPurchase';
import { ClearViewBadge } from '@/components/clearview/ClearViewBadge';
import { ClearViewGauge } from '@/components/clearview/ClearViewGauge';
import { ClearViewRadar } from '@/components/clearview/ClearViewRadar';
import { ClearViewPaywall } from '@/components/clearview/ClearViewPaywall';
import {
  CLEARVIEW_CATEGORIES,
  gradeToRecommendation,
  recommendationLabel,
  type ClearViewGrade,
} from '@/lib/clearview/methodology';

interface Props {
  projectId: string;
  /** Pre-known flag from caller; otherwise read from report */
  isBrokered?: boolean;
}

export function ClearViewReport({ projectId, isBrokered }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: report, isLoading } = useDueDiligenceReport(projectId);
  const { data: access } = useClearViewAccess(projectId);
  const generate = useGenerateDueDiligence();
  const togglePublish = useTogglePublishDueDiligence();
  const { track } = useIPPLeadEvent();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (report && (report.is_published || isAdmin)) {
      track({ eventType: 'clearview_summary_open', projectId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, report?.is_published, isAdmin, projectId]);

  React.useEffect(() => {
    let cancel = false;
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancel) setIsAdmin(!!data);
    })();
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  const brokered = isBrokered ?? report?.is_brokered_project ?? false;
  const hasFullAccess = isAdmin || (access?.hasAccess ?? false);

  return (
    <section className="border border-border bg-card p-5 sm:p-6 space-y-5 rounded-none">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-foreground" />
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              ClearView™ Due Diligence
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRu
                ? 'Институциональный рейтинг проекта · методология V3'
                : 'Institutional project rating · V3 methodology'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {report && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-none"
                onClick={() =>
                  togglePublish.mutate({
                    id: report.id,
                    projectId,
                    publish: !report.is_published,
                  })
                }
              >
                {report.is_published ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                    {isRu ? 'Скрыть' : 'Unpublish'}
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    {isRu ? 'Опубликовать' : 'Publish'}
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-none"
              onClick={() => generate.mutate({ projectId, isBrokeredProject: brokered })}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  {isRu ? 'Анализируем…' : 'Analyzing…'}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {report
                    ? isRu
                      ? 'Перегенерировать'
                      : 'Regenerate'
                    : isRu
                      ? 'Сгенерировать'
                      : 'Generate'}
                </>
              )}
            </Button>
          </div>
        )}
      </header>

      {/* Conflict of interest disclosure */}
      {brokered && (
        <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-foreground">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <strong>
              {isRu
                ? 'Не оценён — раскрытие конфликта интересов.'
                : 'Not Rated — Conflict of Interest Disclosure.'}
            </strong>{' '}
            {isRu
              ? 'Этот проект продаётся через myUNO как брокер. В первый год работы ClearView™ мы не присваиваем рейтинги собственным брокерским объектам, чтобы избежать конфликта интересов.'
              : 'This project is sold via myUNO as a broker. In ClearView™ year one we do not rate brokered projects to avoid conflict of interest.'}
          </div>
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">{isRu ? 'Загружаем отчёт…' : 'Loading report…'}</div>}

      {!isLoading && !report && (
        <div className="text-sm text-muted-foreground">
          {isAdmin
            ? isRu
              ? 'Отчёт ещё не сгенерирован. Нажмите «Сгенерировать».'
              : 'No report yet. Click Generate.'
            : isRu
              ? 'ClearView отчёт для этого проекта в подготовке.'
              : 'ClearView report for this project is in preparation.'}
        </div>
      )}

      {report && !report.is_published && !isAdmin && (
        <div className="text-sm text-muted-foreground">
          {isRu
            ? 'Отчёт находится на проверке у аналитика и скоро будет опубликован.'
            : 'Report is under analyst review and will be published soon.'}
        </div>
      )}

      {report && (report.is_published || isAdmin) && (
        <>
          {/* ── FREE SUMMARY ───────────────────────────────── */}
          <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-start">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <ClearViewGauge
                score={Number(report.total_score) || 0}
                grade={report.grade as ClearViewGrade | null}
                size={170}
                isRu={isRu}
              />
              {report.grade && (
                <ClearViewBadge
                  grade={report.grade as ClearViewGrade}
                  size="md"
                  showLabel={false}
                  isRu={isRu}
                  className="self-center"
                />
              )}
              {(() => {
                const rec = gradeToRecommendation(report.grade as ClearViewGrade | null);
                if (!rec) return null;
                const cls =
                  rec === 'BUY'
                    ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                    : rec === 'WATCH'
                      ? 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10'
                      : 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10';
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-medium rounded-none self-center ${cls}`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    {recommendationLabel(rec, isRu)}
                  </span>
                );
              })()}
            </div>

            <div className="space-y-3">
              <ClearViewRadar report={report} isRu={isRu} height={240} />
              {report.executive_summary && (
                <p className="text-sm leading-relaxed text-foreground">{report.executive_summary}</p>
              )}
            </div>
          </div>

          {/* Top-3 flags */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            {report.green_flags?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRu ? 'Сильные стороны' : 'Strengths'}
                </h4>
                <ul className="text-xs space-y-1 text-foreground">
                  {report.green_flags.slice(0, 3).map((f, i) => (
                    <li key={i}>· {f}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.red_flags?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isRu ? 'Риски' : 'Risks'}
                </h4>
                <ul className="text-xs space-y-1 text-foreground">
                  {report.red_flags.slice(0, 3).map((f, i) => (
                    <li key={i}>· {f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── PAYWALL: FULL REPORT ───────────────────────── */}
          <ClearViewPaywall projectId={projectId} isRu={isRu} bypass={hasFullAccess}>
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                {isRu ? 'Полный анализ по 8 категориям' : 'Full 8-category analysis'}
              </h4>
              {CLEARVIEW_CATEGORIES.map((cat) => {
                const score = Number(
                  (report as unknown as Record<string, number | null>)[cat.scoreField] ?? 0,
                );
                const finding = report.analysis?.[cat.code]
                  ?? report.analysis?.[cat.scoreField.replace('score_', '')];
                return (
                  <div key={cat.code} className="border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {isRu ? cat.nameRu : cat.nameEn}{' '}
                        <span className="text-muted-foreground font-mono text-[11px]">
                          ({Math.round(cat.weight * 100)}%)
                        </span>
                      </span>
                      <span className="font-mono text-sm text-foreground">
                        {score.toFixed(1)} / 100
                      </span>
                    </div>
                    {finding && Array.isArray(finding.findings) && finding.findings.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {finding.findings.map((f: string, i: number) => (
                          <li key={i}>· {f}</li>
                        ))}
                      </ul>
                    )}
                    {finding && Array.isArray(finding.evidence_gaps) && finding.evidence_gaps.length > 0 && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        ⚠ {isRu ? 'Недостаточно данных:' : 'Evidence gaps:'}{' '}
                        {finding.evidence_gaps.join('; ')}
                      </p>
                    )}
                  </div>
                );
              })}

              {report.recommendations?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <h4 className="text-xs uppercase tracking-wider text-foreground">
                    {isRu ? 'Рекомендации' : 'Recommendations'}
                  </h4>
                  <ul className="text-xs space-y-1 text-foreground">
                    {report.recommendations.map((r, i) => (
                      <li key={i}>
                        {i + 1}. {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ClearViewPaywall>

          <p className="text-[10px] pt-2 border-t border-border text-muted-foreground">
            {isRu
              ? 'ClearView™ — собственная методология оценки в 8 критериях. Не является финансовым или юридическим советом. Покупатель обязан провести независимый due diligence.'
              : 'ClearView™ is a proprietary 8-criteria methodology. Not financial or legal advice. Buyer must conduct independent due diligence.'}
          </p>
        </>
      )}
    </section>
  );
}

export default ClearViewReport;
