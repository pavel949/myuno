/**
 * PopularTasks — GOV.UK-style "Popular on GOV.UK" block.
 *
 * Shows the 6 tasks foreigners on Phuket reach for most often. Source:
 * `analytics_events` (event_name = 'task_open', last 7 days). Falls back to a
 * curated default list when there is no data yet.
 *
 * Gated by `feature_flag:popular_tasks_block` in `system_settings`.
 *
 * @see docs/INFO_ARCHITECTURE.md for the canonical task vocabulary
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';

interface Task {
  id: string;
  route: string;
  titleRu: string;
  titleEn: string;
}

/** Curated fallback when analytics has no signal yet. Order matters. */
const DEFAULT_TASKS: Task[] = [
  { id: 'extend_visa', route: APP_ROUTES.VISA_QUIZ, titleRu: 'Продлить визу', titleEn: 'Extend visa' },
  { id: 'sim_card', route: APP_ROUTES.SIM_START, titleRu: 'SIM-карта', titleEn: 'SIM card' },
  { id: 'airport_transfer', route: APP_ROUTES.AIRPORT_TRANSFER, titleRu: 'Трансфер из аэропорта', titleEn: 'Airport transfer' },
  { id: 'find_doctor', route: APP_ROUTES.MEDICAL, titleRu: 'Найти врача', titleEn: 'Find a doctor' },
  { id: 'long_term_rent', route: `${APP_ROUTES.PROPERTY_BROWSE}?tenancy=long`, titleRu: 'Аренда на долгий срок', titleEn: 'Long-term rental' },
  { id: 'open_bank', route: APP_ROUTES.BANKING, titleRu: 'Открыть счёт в банке', titleEn: 'Open a bank account' },
];

interface AnalyticsRow {
  event_data: { task_id?: string } | null;
}

async function fetchTopTasks(): Promise<Task[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_data')
    .eq('event_name', 'task_open')
    .gte('created_at', since)
    .limit(1000);

  if (error || !data?.length) return DEFAULT_TASKS;

  const counts = new Map<string, number>();
  for (const row of data as AnalyticsRow[]) {
    const id = row.event_data?.task_id;
    if (typeof id === 'string') counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  if (counts.size === 0) return DEFAULT_TASKS;

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => DEFAULT_TASKS.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t));

  // Fill remaining slots from default list, preserving order, no duplicates.
  const seen = new Set(ranked.map((t) => t.id));
  for (const t of DEFAULT_TASKS) {
    if (ranked.length >= 6) break;
    if (!seen.has(t.id)) ranked.push(t);
  }

  return ranked.slice(0, 6);
}

function trackTaskOpen(taskId: string) {
  // Fire-and-forget; do not await or surface errors to the user.
  void supabase
    .from('analytics_events')
    .insert({ event_name: 'task_open', event_data: { task_id: taskId } });
}

export function PopularTasks() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: tasks = DEFAULT_TASKS } = useQuery({
    queryKey: ['popular-tasks-7d'],
    queryFn: fetchTopTasks,
    staleTime: 10 * 60_000,
  });

  return (
    <section className="px-4 pb-5" aria-labelledby="popular-tasks-heading">
      <div
        id="popular-tasks-heading"
        className="text-[10.5px] tracking-[0.1em] uppercase text-muted-foreground/60 font-semibold mb-2"
      >
        {isRu ? 'Чаще всего ищут на Пхукете' : 'Most popular on Phuket'}
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {tasks.map((task, i) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => {
                trackTaskOpen(task.id);
                navigate(task.route);
              }}
              className="w-full text-left rounded-[12px] bg-card border border-border px-3 py-3 active:scale-[0.99] transition-transform min-h-[56px] flex items-start gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="font-mono text-[11px] text-muted-foreground/70 mt-0.5 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[13px] font-semibold text-foreground leading-snug">
                {isRu ? task.titleRu : task.titleEn}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
