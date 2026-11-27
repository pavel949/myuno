/**
 * LifeOS Structure Tab (read-only)
 * Shows the full taxonomy as the public site renders it:
 * situation -> scenarios -> steps, plus linked catalogue counts and gaps.
 * No writes: data changes require separate owner approval.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';

interface Sit { id: string; code: string; title_en: string; title_ru: string; is_active: boolean; priority: number }
interface Scen { id: string; life_situation_id: string; code: string; title_en: string; title_ru: string; is_active: boolean; priority: number | null }
interface Task { id: string; life_scenario_id: string; title_en: string; title_ru: string; is_active: boolean; priority: number | null }

async function fetchAll<T>(table: 'life_scenarios' | 'life_tasks', cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < 1000) return out;
  }
}

async function fetchMapCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('catalog_life_map').select('life_situation_id').range(from, from + 999);
    if (error) throw error;
    for (const r of data ?? []) {
      const id = (r as { life_situation_id: string | null }).life_situation_id;
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    if (!data || data.length < 1000) return counts;
  }
}

export function LifeOSStructureTab() {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const [q, setQ] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const query = useQuery({
    queryKey: ['admin-lifeos-structure'],
    queryFn: async () => {
      const [s, sc, t, m] = await Promise.all([
        supabase.from('life_situations').select('id, code, title_en, title_ru, is_active, priority').order('priority'),
        fetchAll<Scen>('life_scenarios', 'id, life_situation_id, code, title_en, title_ru, is_active, priority'),
        fetchAll<Task>('life_tasks', 'id, life_scenario_id, title_en, title_ru, is_active, priority'),
        fetchMapCounts(),
      ]);
      if (s.error) throw s.error;
      return { sits: (s.data ?? []) as Sit[], scens: sc, tasks: t, maps: m };
    },
  });

  const rows = useMemo(() => {
    if (!query.data) return [];
    const { sits, scens, tasks, maps } = query.data;
    return sits.map((s) => {
      const sc = scens.filter((x) => x.life_situation_id === s.id).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      const withTasks = sc.map((x) => ({ ...x, tasks: tasks.filter((t) => t.life_scenario_id === x.id) }));
      const services = maps[s.id] ?? 0;
      const gaps: string[] = [];
      if (s.is_active && sc.length === 0) gaps.push(ru ? 'нет сценариев' : 'no scenarios');
      if (s.is_active && services === 0) gaps.push(ru ? 'нет сервисов' : 'no services');
      if (withTasks.some((x) => x.is_active && x.tasks.length === 0)) gaps.push(ru ? 'сценарий без шагов' : 'scenario without steps');
      return { s, scens: withTasks, services, gaps };
    });
  }, [query.data, ru]);

  const filtered = rows.filter((r) => {
    if (gapsOnly && r.gaps.length === 0) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [r.s.code, r.s.title_en, r.s.title_ru, ...r.scens.map((x) => x.title_en + ' ' + x.title_ru)]
      .join(' ').toLowerCase().includes(needle);
  });

  const totals = {
    sits: rows.filter((r) => r.s.is_active).length,
    scens: rows.reduce((n, r) => n + r.scens.length, 0),
    tasks: rows.reduce((n, r) => n + r.scens.reduce((m, x) => m + x.tasks.length, 0), 0),
    gaps: rows.filter((r) => r.gaps.length > 0).length,
  };

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.isError) {
    return <p className="text-sm text-destructive">{ru ? 'Не удалось загрузить структуру. Повторите позже.' : 'Could not load the structure. Try again later.'}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {ru
          ? 'Так структура отображается на сайте: ситуация → сценарии → шаги → сервисы. Только просмотр.'
          : 'How the site shows it: situation → scenarios → steps → services. Read-only.'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [ru ? 'Активные ситуации' : 'Active situations', totals.sits],
          [ru ? 'Сценарии' : 'Scenarios', totals.scens],
          [ru ? 'Шаги' : 'Steps', totals.tasks],
          [ru ? 'Ситуации с пробелами' : 'Situations with gaps', totals.gaps],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="font-mono text-xl">{v}</div>
          </CardContent></Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Input className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} placeholder={ru ? 'Поиск' : 'Search'} aria-label={ru ? 'Поиск' : 'Search'} />
        <div className="flex items-center gap-2">
          <Switch id="gaps-only" checked={gapsOnly} onCheckedChange={setGapsOnly} />
          <Label htmlFor="gaps-only">{ru ? 'Только с пробелами' : 'Gaps only'}</Label>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map(({ s, scens, services, gaps }) => {
          const isOpen = open[s.id];
          return (
            <Card key={s.id}>
              <CardContent className="p-3">
                <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} aria-expanded={isOpen}>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">{ru ? s.title_ru : s.title_en}</span>
                  <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
                  {!s.is_active && <Badge variant="outline">{ru ? 'скрыта' : 'hidden'}</Badge>}
                  <span className="ml-auto flex flex-wrap gap-1">
                    <Badge variant="secondary">{scens.length} {ru ? 'сцен.' : 'scen.'}</Badge>
                    <Badge variant="secondary">{services} {ru ? 'серв.' : 'serv.'}</Badge>
                    {gaps.map((g) => (
                      <Badge key={g} variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{g}</Badge>
                    ))}
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-2 border-l border-border pl-4">
                    <Link to={`/discover/${s.code}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-primary underline">
                      {ru ? 'Открыть на сайте' : 'Open on site'} <ExternalLink className="h-3 w-3" />
                    </Link>
                    {scens.length === 0 && <p className="text-sm text-muted-foreground">{ru ? 'Сценариев нет — на сайте показывается только заявка команде.' : 'No scenarios — site shows only the team request.'}</p>}
                    {scens.map((x) => (
                      <div key={x.id}>
                        <div className="text-sm font-medium">
                          {ru ? x.title_ru : x.title_en}
                          {!x.is_active && <Badge variant="outline" className="ml-2">{ru ? 'скрыт' : 'hidden'}</Badge>}
                        </div>
                        <ul className="ml-4 list-disc text-sm text-muted-foreground">
                          {x.tasks.length === 0 && <li>{ru ? 'Шагов нет' : 'No steps'}</li>}
                          {x.tasks.map((t) => <li key={t.id}>{ru ? t.title_ru : t.title_en}</li>)}
                        </ul>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      {ru ? 'Шаги пока не привязаны к сервисам: ведут на заявку команде.' : 'Steps are not linked to services yet: they lead to a team request.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
