/**
 * AdminOfficialNews — мониторинг агрегатора официальных новостей.
 * Показывает по каждому источнику: количество записей, последний скрейп,
 * последнюю публикацию, статус. Плюс статистику переводов и ручной запуск.
 * Route: /admin/official-news
 */
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Languages, Newspaper, RefreshCw, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewsRow {
  source: string;
  source_label: string | null;
  fetched_at: string | null;
  published_at: string | null;
  title_ru: string | null;
  translated_at: string | null;
}

interface SourceStat {
  source: string;
  label: string;
  total: number;
  lastFetched: string | null;
  lastPublished: string | null;
  lastDayCount: number;
}

const EXPECTED_SOURCES: Array<{ source: string; label: string }> = [
  { source: 'tat', label: 'TAT Newsroom' },
  { source: 'prd', label: 'Government PR Thailand' },
  { source: 'phuket_gov', label: 'Phuket Provincial Gov' },
  { source: 'nation', label: 'The Nation Thailand' },
  { source: 'bangkok_post', label: 'Bangkok Post' },
];

const STALE_HOURS = 12; // если скрейпа не было больше — подсветить warning

const fmtRel = (iso: string | null): string => {
  if (!iso) return 'никогда';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
};

const fmtAbs = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return '—'; }
};

const AdminOfficialNews: React.FC = () => {
  const qc = useQueryClient();
  const [running, setRunning] = React.useState(false);
  const [lastRunResult, setLastRunResult] = React.useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-official-news-stats'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('official_news')
        .select('source, source_label, fetched_at, published_at, title_ru, translated_at')
        .order('fetched_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (rows ?? []) as NewsRow[];
    },
    refetchInterval: 60_000,
  });

  const stats = React.useMemo(() => {
    const rows = data ?? [];
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const bySource = new Map<string, SourceStat>();
    for (const { source, label } of EXPECTED_SOURCES) {
      bySource.set(source, { source, label, total: 0, lastFetched: null, lastPublished: null, lastDayCount: 0 });
    }
    for (const r of rows) {
      const key = r.source;
      const cur = bySource.get(key) ?? {
        source: key, label: r.source_label ?? key, total: 0, lastFetched: null, lastPublished: null, lastDayCount: 0,
      };
      cur.total += 1;
      if (r.fetched_at && (!cur.lastFetched || r.fetched_at > cur.lastFetched)) cur.lastFetched = r.fetched_at;
      if (r.published_at && (!cur.lastPublished || r.published_at > cur.lastPublished)) cur.lastPublished = r.published_at;
      if (r.fetched_at && new Date(r.fetched_at).getTime() > dayAgo) cur.lastDayCount += 1;
      bySource.set(key, cur);
    }
    const sources = Array.from(bySource.values());

    const total = rows.length;
    const translated = rows.filter(r => !!r.title_ru).length;
    const pending = total - translated;
    const lastTranslated = rows.reduce<string | null>((acc, r) => (r.translated_at && (!acc || r.translated_at > acc) ? r.translated_at : acc), null);
    const lastFetchedAny = rows.reduce<string | null>((acc, r) => (r.fetched_at && (!acc || r.fetched_at > acc) ? r.fetched_at : acc), null);

    return { sources, total, translated, pending, lastTranslated, lastFetchedAny };
  }, [data]);

  const handleRun = async () => {
    setRunning(true);
    setLastRunResult(null);
    try {
      const { data: res, error } = await supabase.functions.invoke('fetch-official-news', { body: {} });
      if (error) throw error;
      setLastRunResult(res);
      toast.success('fetch-official-news выполнен');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-official-news-stats'] }),
        qc.invalidateQueries({ queryKey: ['official_news'] }),
      ]);
      await refetch();
    } catch (e: any) {
      toast.error(`Ошибка запуска: ${e?.message ?? 'unknown'}`);
    } finally {
      setRunning(false);
    }
  };

  const sourceStatus = (s: SourceStat): { tone: 'ok' | 'warn' | 'err'; label: string; Icon: typeof CheckCircle2 } => {
    if (!s.lastFetched) return { tone: 'err', label: 'нет данных', Icon: XCircle };
    const ageH = (Date.now() - new Date(s.lastFetched).getTime()) / 3600_000;
    if (ageH > STALE_HOURS) return { tone: 'warn', label: 'устарело', Icon: AlertTriangle };
    return { tone: 'ok', label: 'свежо', Icon: CheckCircle2 };
  };

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <Button onClick={handleRun} disabled={running} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Запуск…' : 'Запустить fetch-official-news'}
          </Button>
        </div>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-accent" />
            Official News · Мониторинг
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            Состояние агрегатора официальных новостей Пхукета/Таиланда и AI-переводов.
            Cron: каждые 4 часа. Stale-порог: {STALE_HOURS} ч.
          </p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Всего записей" value={String(stats.total)} />
          <SummaryCard
            label="Последний скрейп"
            value={fmtRel(stats.lastFetchedAny)}
            sub={fmtAbs(stats.lastFetchedAny)}
          />
          <SummaryCard
            label="Переведено"
            value={`${stats.translated} / ${stats.total}`}
            sub={stats.pending > 0 ? `${stats.pending} ожидают` : 'всё переведено'}
            tone={stats.pending > 0 ? 'warn' : 'ok'}
          />
          <SummaryCard
            label="Последний перевод"
            value={fmtRel(stats.lastTranslated)}
            sub={fmtAbs(stats.lastTranslated)}
          />
        </div>

        {/* Sources table */}
        <section className="mb-6">
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Источники
          </h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.4fr_0.7fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
              <span>Источник</span>
              <span>Всего</span>
              <span>Последний скрейп</span>
              <span>Последняя публикация</span>
              <span>За 24ч</span>
            </div>
            {isLoading && (
              <div className="px-4 py-6 text-[13px] text-muted-foreground text-center">Загрузка…</div>
            )}
            {!isLoading && stats.sources.map((s) => {
              const st = sourceStatus(s);
              return (
                <div
                  key={s.source}
                  className="grid grid-cols-[1.4fr_0.7fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-[13px] border-b border-border last:border-0 items-center"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <st.Icon className={`w-4 h-4 shrink-0 ${st.tone === 'ok' ? 'text-emerald-600' : st.tone === 'warn' ? 'text-amber-600' : 'text-destructive'}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.source} · {st.label}</div>
                    </div>
                  </div>
                  <div className="text-foreground tabular-nums">{s.total}</div>
                  <div>
                    <div className="text-foreground">{fmtRel(s.lastFetched)}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtAbs(s.lastFetched)}</div>
                  </div>
                  <div>
                    <div className="text-foreground">{fmtRel(s.lastPublished)}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtAbs(s.lastPublished)}</div>
                  </div>
                  <div className="tabular-nums text-foreground">{s.lastDayCount}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Last run output */}
        {lastRunResult && (
          <section className="mb-6">
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Результат последнего ручного запуска
            </h2>
            <div className="rounded-2xl border border-border bg-card p-3">
              {Array.isArray(lastRunResult?.fetched) && (
                <ul className="text-[13px] divide-y divide-border">
                  {lastRunResult.fetched.map((f: any) => (
                    <li key={f.source} className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-foreground">{f.source}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">+{f.inserted}</span>
                        {f.error
                          ? <span className="text-destructive text-[11px] truncate max-w-[260px]">{f.error}</span>
                          : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-[12px] text-muted-foreground mt-3 flex items-center gap-2 flex-wrap">
                <Languages className="w-3.5 h-3.5" />
                Переведено за прогон: <span className="text-foreground">{lastRunResult.translated ?? 0}</span>
                {lastRunResult.translateError && (
                  <span className="text-destructive">· {lastRunResult.translateError}</span>
                )}
              </div>
            </div>
          </section>
        )}

        <section>
          <a
            href="/arrive/news"
            className="text-[13px] text-foreground hover:text-accent inline-flex items-center gap-1"
          >
            Открыть публичную ленту /arrive/news
            <ExternalLink className="w-3 h-3" />
          </a>
        </section>
      </div>
    </AppLayout>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; sub?: string; tone?: 'ok' | 'warn' }> = ({ label, value, sub, tone }) => (
  <div className="rounded-2xl border border-border bg-card px-3 py-3">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-lg font-semibold mt-1 ${tone === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

export default AdminOfficialNews;
