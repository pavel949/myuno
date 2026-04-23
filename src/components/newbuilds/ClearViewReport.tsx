/**
 * ClearViewReport — public-facing block on a project page.
 * Shows ClearView™ grade + 8 criteria + flags. Admins can (re)generate.
 *
 * Conflict-of-interest banner when is_brokered_project = true,
 * per OPERATING_MODEL v2.0 Year 1 rule.
 */
import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDueDiligenceReport,
  useGenerateDueDiligence,
  useTogglePublishDueDiligence,
} from '@/hooks/useDueDiligence';

const CRITERION_LABELS: Record<string, { label: string; weight: number }> = {
  legal:        { label: 'Legal & Regulatory',     weight: 20 },
  developer:    { label: 'Developer Credibility',  weight: 20 },
  construction: { label: 'Construction Quality',   weight: 15 },
  location:     { label: 'Location & Market',      weight: 15 },
  financial:    { label: 'Payment Protection',     weight: 10 },
  returns:      { label: 'Investment Returns',     weight: 10 },
  marketing:    { label: 'Sales & Marketing',      weight: 5 },
  liquidity:    { label: 'Liquidity & Exit',       weight: 5 },
};

function gradeColor(grade?: string | null) {
  switch (grade) {
    case 'AAA': return 'hsl(var(--success))';
    case 'AA':  return 'hsl(var(--success))';
    case 'A':   return 'hsl(var(--brand-navy-700))';
    case 'BBB': return 'hsl(var(--accent))';
    case 'BB':  return 'hsl(var(--destructive))';
    default:    return 'hsl(var(--muted-foreground))';
  }
}

interface Props {
  projectId: string;
  /** Pre-known flag from caller; otherwise read from report */
  isBrokered?: boolean;
}

export function ClearViewReport({ projectId, isBrokered }: Props) {
  const { user } = useAuth();
  const { data: report, isLoading } = useDueDiligenceReport(projectId);
  const generate = useGenerateDueDiligence();
  const togglePublish = useTogglePublishDueDiligence();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let cancel = false;
    if (!user?.id) { setIsAdmin(false); return; }
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
    return () => { cancel = true; };
  }, [user?.id]);

  const brokered = isBrokered ?? report?.is_brokered_project ?? false;

  return (
    <section className="nb-glass p-5 sm:p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: 'hsl(var(--nb-gold))' }} />
          <div>
            <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
              ClearView™ Due Diligence
            </h3>
            <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
              AI-powered 8-criteria assessment · v3 methodology
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {report && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePublish.mutate({
                  id: report.id,
                  projectId,
                  publish: !report.is_published,
                })}
              >
                {report.is_published
                  ? (<><EyeOff className="w-3.5 h-3.5 mr-1" />Скрыть</>)
                  : (<><Eye className="w-3.5 h-3.5 mr-1" />Опубликовать</>)}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => generate.mutate({ projectId, isBrokeredProject: brokered })}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Анализируем…</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 mr-1" />{report ? 'Перегенерировать' : 'Сгенерировать'}</>
              )}
            </Button>
          </div>
        )}
      </header>

      {brokered && (
        <div
          className="rounded-lg p-3 text-xs flex items-start gap-2"
          style={{ background: 'hsl(var(--nb-gold) / 0.08)', border: '1px solid hsl(var(--nb-gold) / 0.25)', color: 'hsl(var(--nb-text))' }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
          <div>
            <strong>Not Rated — Conflict of Interest Disclosure.</strong>{' '}
            Этот проект продаётся через myUNO как брокер. В первый год работы ClearView™
            мы не присваиваем рейтинги собственным брокерским объектам, чтобы избежать
            конфликта интересов. Оценка приведена для прозрачности и не является официальным рейтингом.
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>Загружаем отчёт…</div>
      )}

      {!isLoading && !report && (
        <div className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
          {isAdmin
            ? 'Отчёт ещё не сгенерирован. Нажмите «Сгенерировать».'
            : 'Due diligence отчёт для этого проекта в подготовке.'}
        </div>
      )}

      {report && (!report.is_published && !isAdmin) && (
        <div className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
          Отчёт находится на проверке у аналитика и скоро будет опубликован.
        </div>
      )}

      {report && (report.is_published || isAdmin) && (
        <>
          {/* Score hero */}
          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="col-span-1">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: 'hsl(var(--nb-bg))', border: `2px solid ${gradeColor(report.grade)}` }}
              >
                <div className="text-3xl font-bold nb-display" style={{ color: gradeColor(report.grade) }}>
                  {report.grade ?? '—'}
                </div>
                <div className="text-xs mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>
                  {report.total_score?.toFixed(0) ?? '0'} / 100
                </div>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              {Object.entries(CRITERION_LABELS).map(([key, meta]) => {
                const score = (report as unknown as Record<string, number | null>)[`score_${key}`] ?? 0;
                const pct = ((Number(score) || 0) / 10) * 100;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[11px] w-32 shrink-0" style={{ color: 'hsl(var(--nb-muted))' }}>
                      {meta.label} <span className="opacity-60">({meta.weight}%)</span>
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--nb-bg))' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'hsl(var(--nb-gold))' }}
                      />
                    </div>
                    <span className="text-[11px] w-8 text-right tabular-nums" style={{ color: 'hsl(var(--nb-text))' }}>
                      {Number(score).toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Executive summary */}
          {report.executive_summary && (
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--nb-text))' }}>
              {report.executive_summary}
            </p>
          )}

          {/* Flags */}
          <div className="grid sm:grid-cols-2 gap-3">
            {report.green_flags?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#10b981' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />Сильные стороны
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--nb-text))' }}>
                  {report.green_flags.map((f, i) => <li key={i}>· {f}</li>)}
                </ul>
              </div>
            )}
            {report.red_flags?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                  <AlertTriangle className="w-3.5 h-3.5" />Риски
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--nb-text))' }}>
                  {report.red_flags.map((f, i) => <li key={i}>· {f}</li>)}
                </ul>
              </div>
            )}
          </div>

          {report.recommendations?.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'hsl(var(--nb-gold) / 0.15)' }}>
              <h4 className="text-xs uppercase tracking-wider" style={{ color: 'hsl(var(--nb-gold))' }}>
                Рекомендации
              </h4>
              <ul className="text-xs space-y-1" style={{ color: 'hsl(var(--nb-text))' }}>
                {report.recommendations.map((r, i) => <li key={i}>{i + 1}. {r}</li>)}
              </ul>
            </div>
          )}

          <p className="text-[10px] pt-2 border-t" style={{ color: 'hsl(var(--nb-muted))', borderColor: 'hsl(var(--nb-gold) / 0.1)' }}>
            ClearView™ — собственная методология оценки в 8 критериях. Не является финансовым или юридическим советом.
            Покупатель обязан провести независимый due diligence.
          </p>
        </>
      )}
    </section>
  );
}
