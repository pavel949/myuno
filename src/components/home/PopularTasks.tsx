/**
 * PopularTasks — GOV.UK-style "Popular on GOV.UK" block (mobile/full grid).
 *
 * Renders the top-6 most opened tasks. Data lives in `usePopularTasks` so
 * the desktop hero preview can share the same React Query cache.
 *
 * Gated by `feature_flag:popular_tasks_block` in `system_settings`.
 *
 * @see docs/INFO_ARCHITECTURE.md for the canonical task vocabulary
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopularTasks, trackTaskOpen } from '@/hooks/home/usePopularTasks';

export function PopularTasks() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: tasks } = usePopularTasks();

  return (
    <section className="px-4 pb-5 lg:hidden" aria-labelledby="popular-tasks-heading">
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
