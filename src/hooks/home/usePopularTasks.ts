/**
 * usePopularTasks — shared data source for the "Popular tasks" feature.
 *
 * Used by both the mobile `PopularTasks` block (full grid of 6) and the
 * desktop hero preview (top 3). Single React Query cache key ensures only
 * one network request for both consumers.
 *
 * Source: `analytics_events` (event_name = 'task_open', last 7 days).
 * Falls back to a curated default list when there's no signal yet.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';

export interface PopularTask {
  id: string;
  route: string;
  titleRu: string;
  titleEn: string;
}

/** Curated fallback when analytics has no signal yet. Order matters. */
export const DEFAULT_POPULAR_TASKS: PopularTask[] = [
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

async function fetchTopTasks(): Promise<PopularTask[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_data')
    .eq('event_name', 'task_open')
    .gte('created_at', since)
    .limit(1000);

  if (error || !data?.length) return DEFAULT_POPULAR_TASKS;

  const counts = new Map<string, number>();
  for (const row of data as AnalyticsRow[]) {
    const id = row.event_data?.task_id;
    if (typeof id === 'string') counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  if (counts.size === 0) return DEFAULT_POPULAR_TASKS;

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => DEFAULT_POPULAR_TASKS.find((t) => t.id === id))
    .filter((t): t is PopularTask => Boolean(t));

  // Fill remaining slots from default list, preserving order, no duplicates.
  const seen = new Set(ranked.map((t) => t.id));
  for (const t of DEFAULT_POPULAR_TASKS) {
    if (ranked.length >= 6) break;
    if (!seen.has(t.id)) ranked.push(t);
  }

  return ranked.slice(0, 6);
}

/** Fire-and-forget analytics event. Errors are silently swallowed. */
export function trackTaskOpen(taskId: string) {
  void supabase
    .from('analytics_events')
    .insert({ event_name: 'task_open', event_data: { task_id: taskId } });
}

export function usePopularTasks() {
  return useQuery({
    queryKey: ['popular-tasks-7d'],
    queryFn: fetchTopTasks,
    staleTime: 10 * 60_000,
    initialData: DEFAULT_POPULAR_TASKS,
  });
}
