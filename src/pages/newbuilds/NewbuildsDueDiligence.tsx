/**
 * /newbuilds/due-diligence — Interactive due diligence checklist
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, ArrowRight, Shield, Scale, Banknote, HardHat, Building2, Key } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NewbuildsHero } from '@/components/newbuilds/NewbuildsHero';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from '@/lib/config/dueDiligenceChecklist';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'myuno_dd_checklist';

const categoryIcons: Record<string, React.ElementType> = {
  legal: Scale,
  financial: Banknote,
  construction: HardHat,
  developer: Building2,
  post_purchase: Key,
};

const importanceClass: Record<string, { wrap: string; label: string }> = {
  critical: { wrap: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Критично' },
  high:     { wrap: 'bg-warning/15 text-warning border-warning/30',           label: 'Важно' },
  medium:   { wrap: 'bg-primary/15 text-primary border-primary/30',           label: 'Рекомендуется' },
};

export default function NewbuildsDueDiligence() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const [activeCategory, setActiveCategory] = useState<string>('legal');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked)));
  }, [checked]);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = useMemo(() => {
    const total = CHECKLIST_ITEMS.length;
    const done = checked.size;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [checked]);

  const categoryItems = CHECKLIST_ITEMS.filter(item => item.category === activeCategory);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    CHECKLIST_CATEGORIES.forEach(c => {
      const items = CHECKLIST_ITEMS.filter(i => i.category === c.id);
      counts[c.id] = { total: items.length, done: items.filter(i => checked.has(i.id)).length };
    });
    return counts;
  }, [checked]);

  return (
    <NewbuildsLayout>
      <NewbuildsHero
        icon={Shield}
        title="Due Diligence"
        subtitle="Интерактивный чек-лист для безопасной покупки новостройки на Пхукете"
        backTo={APP_ROUTES.NEWBUILDS}
        backLabel="Новостройки"
      />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Progress bar */}
        <div className="nb-glass p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="nb-label">ОБЩИЙ ПРОГРЕСС</span>
            <span className="nb-mono text-sm font-bold text-primary">
              {progress.done}/{progress.total} ({progress.percent}%)
            </span>
          </div>
          <div className="nb-progress-track h-2" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="nb-progress-fill transition-all duration-500" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist">
          {CHECKLIST_CATEGORIES.map(cat => {
            const Icon = categoryIcons[cat.id] || Shield;
            const counts = categoryCounts[cat.id];
            const isActive = activeCategory === cat.id;
            const isDone = counts.done === counts.total;

            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0 border',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <span>{cat.label_ru}</span>
                <span className={cn(
                  'nb-mono text-[10px] px-1.5 py-0.5 rounded',
                  isDone ? 'bg-success/15 text-success' : 'bg-primary/10 text-muted-foreground'
                )}>
                  {counts.done}/{counts.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {categoryItems.map(item => {
            const isDone = checked.has(item.id);
            const imp = importanceClass[item.importance] || importanceClass.medium;

            return (
              <div
                key={item.id}
                className={cn('nb-glass p-5 transition-opacity', isDone && 'opacity-60')}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className="mt-0.5 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    aria-pressed={isDone}
                    aria-label={isDone ? `Отменить: ${item.title_ru}` : `Отметить выполненным: ${item.title_ru}`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-success" aria-hidden />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" aria-hidden />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={cn(
                        'text-sm font-medium',
                        isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}>
                        {item.title_ru}
                      </h4>
                      <span className={cn('nb-badge text-[9px] border', imp.wrap)}>
                        {imp.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {item.description_ru}
                    </p>

                    {item.service_link && (
                      <Link
                        to={item.service_link}
                        className="inline-flex items-center gap-1 text-xs mt-2 text-primary hover:underline"
                      >
                        {item.service_label_ru || 'Помощь myUNO'} <ArrowRight className="w-3 h-3" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </NewbuildsLayout>
  );
}
