/**
 * AdminAnalyticsDashboard — situation clicks + page views with filters
 * by role, language and click source.
 *
 * Reads from `public.analytics_events` (admin-only via RLS).
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type EventRow = {
  id: string;
  event_name: string;
  page_path: string | null;
  referrer: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  event_data: Record<string, unknown> | null;
};

const ANY = '__any__';

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default function AdminAnalyticsDashboard() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [eventName, setEventName] = useState<'situation_click' | 'page_view' | 'all'>('all');
  const [role, setRole] = useState<string>(ANY);
  const [language, setLanguage] = useState<string>(ANY);
  const [source, setSource] = useState<string>(ANY);
  const [days, setDays] = useState<number>(7);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      let q = supabase
        .from('analytics_events')
        .select('id, event_name, page_path, referrer, created_at, user_id, session_id, event_data')
        .gte('created_at', daysAgoIso(days))
        .order('created_at', { ascending: false })
        .limit(2000);

      if (eventName !== 'all') q = q.eq('event_name', eventName);

      const { data, error: err } = await q;
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRows([]);
      } else {
        setRows((data ?? []) as EventRow[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [eventName, days]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = (r.event_data ?? {}) as Record<string, unknown>;
      if (role !== ANY && d.role !== role) return false;
      if (language !== ANY && d.language !== language) return false;
      if (source !== ANY && d.source !== source) return false;
      return true;
    });
  }, [rows, role, language, source]);

  const facets = useMemo(() => {
    const roles = new Set<string>();
    const langs = new Set<string>();
    const sources = new Set<string>();
    rows.forEach((r) => {
      const d = (r.event_data ?? {}) as Record<string, unknown>;
      if (typeof d.role === 'string' && d.role) roles.add(d.role);
      if (typeof d.language === 'string' && d.language) langs.add(d.language);
      if (typeof d.source === 'string' && d.source) sources.add(d.source);
    });
    return {
      roles: [...roles].sort(),
      langs: [...langs].sort(),
      sources: [...sources].sort(),
    };
  }, [rows]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sessions = new Set(filtered.map((r) => r.session_id).filter(Boolean)).size;
    const users = new Set(filtered.map((r) => r.user_id).filter(Boolean)).size;
    const clicks = filtered.filter((r) => r.event_name === 'situation_click').length;
    const views = filtered.filter((r) => r.event_name === 'page_view').length;
    return { total, sessions, users, clicks, views };
  }, [filtered]);

  const topSituations = useMemo(() => {
    const counts = new Map<string, number>();
    filtered
      .filter((r) => r.event_name === 'situation_click')
      .forEach((r) => {
        const code = (r.event_data as Record<string, unknown>)?.situation_code;
        if (typeof code === 'string') counts.set(code, (counts.get(code) ?? 0) + 1);
      });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [filtered]);

  const topPages = useMemo(() => {
    const counts = new Map<string, number>();
    filtered
      .filter((r) => r.event_name === 'page_view')
      .forEach((r) => {
        const p = r.page_path ?? '(none)';
        counts.set(p, (counts.get(p) ?? 0) + 1);
      });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [filtered]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display">Аналитика кликов и просмотров</h1>
        <p className="text-sm text-muted-foreground mt-1">
          События из <code>analytics_events</code>: <code>situation_click</code> и <code>page_view</code>.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Фильтры</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Событие</Label>
            <Select value={eventName} onValueChange={(v) => setEventName(v as typeof eventName)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="situation_click">situation_click</SelectItem>
                <SelectItem value="page_view">page_view</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Роль</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Любая" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Любая</SelectItem>
                {facets.roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Язык</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue placeholder="Любой" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Любой</SelectItem>
                {facets.langs.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Источник клика</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue placeholder="Любой" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Любой</SelectItem>
                {facets.sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">За последние (дней)</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card><CardContent className="p-4 text-destructive">Ошибка: {error}</CardContent></Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Всего событий" value={stats.total} />
        <StatCard label="Сессий" value={stats.sessions} />
        <StatCard label="Юзеров" value={stats.users} />
        <StatCard label="situation_click" value={stats.clicks} />
        <StatCard label="page_view" value={stats.views} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Топ ситуаций</CardTitle></CardHeader>
          <CardContent>
            {topSituations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Код</TableHead><TableHead className="text-right">Кликов</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topSituations.map(([code, n]) => (
                    <TableRow key={code}><TableCell className="font-mono text-xs">{code}</TableCell><TableCell className="text-right">{n}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Топ страниц</CardTitle></CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Путь</TableHead><TableHead className="text-right">Просмотров</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topPages.map(([p, n]) => (
                    <TableRow key={p}><TableCell className="font-mono text-xs truncate max-w-[280px]">{p}</TableCell><TableCell className="text-right">{n}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Последние события {loading && <span className="text-xs text-muted-foreground">(загрузка…)</span>}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Событие</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Язык</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Ситуация / Путь</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((r) => {
                const d = (r.event_data ?? {}) as Record<string, unknown>;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{r.event_name}</Badge></TableCell>
                    <TableCell className="text-xs">{(d.role as string) ?? '—'}</TableCell>
                    <TableCell className="text-xs">{(d.language as string) ?? '—'}</TableCell>
                    <TableCell className="text-xs">{(d.source as string) ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[280px]">
                      {(d.situation_code as string) ?? r.page_path ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-display mt-1 tabular-nums">{value.toLocaleString('ru-RU')}</div>
      </CardContent>
    </Card>
  );
}
