/**
 * /newbuilds/due-diligence — Interactive due diligence checklist
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Circle, ArrowRight, Shield, Scale, Banknote, HardHat, Building2, Key } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES, type ChecklistItem } from '@/lib/config/dueDiligenceChecklist';
import { APP_ROUTES } from '@/lib/config/routes';

const STORAGE_KEY = 'myuno_dd_checklist';

const categoryIcons: Record<string, React.ElementType> = {
  legal: Scale,
  financial: Banknote,
  construction: HardHat,
  developer: Building2,
  post_purchase: Key,
};

const importanceColors: Record<string, { bg: string; color: string; border: string; label: string }> = {
  critical: { bg: 'hsl(0 70% 50% / 0.12)', color: 'hsl(0 70% 60%)', border: 'hsl(0 70% 50% / 0.3)', label: 'Критично' },
  high: { bg: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 60%)', border: 'hsl(38 92% 50% / 0.3)', label: 'Важно' },
  medium: { bg: 'hsl(var(--nb-gold) / 0.12)', color: 'hsl(var(--nb-gold))', border: 'hsl(var(--nb-gold) / 0.3)', label: 'Рекомендуется' },
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
      <section className="relative px-4 pt-20 pb-12 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link to={APP_ROUTES.NEWBUILDS} className="inline-flex items-center gap-1 text-sm mb-4 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-4 h-4" /> Новостройки
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" style={{ color: 'hsl(var(--nb-gold))' }} />
            <h1 className="nb-display text-3xl md:text-5xl" style={{ color: 'hsl(var(--nb-gold))' }}>
              Due Diligence
            </h1>
          </div>
          <p className="mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>
            Интерактивный чек-лист для безопасной покупки новостройки на Пхукете
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Progress bar */}
        <div className="nb-glass p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="nb-label">ОБЩИЙ ПРОГРЕСС</span>
            <span className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>
              {progress.done}/{progress.total} ({progress.percent}%)
            </span>
          </div>
          <div className="nb-progress-track h-2">
            <div className="nb-progress-fill transition-all duration-500" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CHECKLIST_CATEGORIES.map(cat => {
            const Icon = categoryIcons[cat.id] || Shield;
            const counts = categoryCounts[cat.id];
            const isActive = activeCategory === cat.id;
            const isDone = counts.done === counts.total;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: isActive ? 'hsl(var(--nb-gold) / 0.15)' : 'hsl(var(--nb-surface))',
                  color: isActive ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-text-secondary))',
                  border: `1px solid ${isActive ? 'hsl(var(--nb-gold) / 0.3)' : 'hsl(var(--nb-gold) / 0.1)'}`,
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label_ru}</span>
                <span className="nb-mono text-[10px] px-1.5 py-0.5 rounded" style={{
                  background: isDone ? 'hsl(142 70% 45% / 0.15)' : 'hsl(var(--nb-gold) / 0.1)',
                  color: isDone ? 'hsl(142 70% 55%)' : 'hsl(var(--nb-muted))',
                }}>
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
            const imp = importanceColors[item.importance];

            return (
              <div
                key={item.id}
                className="nb-glass p-5 transition-all"
                style={{ opacity: isDone ? 0.6 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(item.id)} className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <CheckCircle className="w-5 h-5" style={{ color: 'hsl(142 70% 55%)' }} />
                    ) : (
                      <Circle className="w-5 h-5" style={{ color: 'hsl(var(--nb-muted))' }} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4
                        className="text-sm font-medium"
                        style={{
                          color: isDone ? 'hsl(var(--nb-muted))' : 'hsl(var(--nb-text))',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {item.title_ru}
                      </h4>
                      <span className="nb-badge text-[9px]" style={{ background: imp.bg, color: imp.color, border: `1px solid ${imp.border}` }}>
                        {imp.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                      {item.description_ru}
                    </p>

                    {item.service_link && (
                      <Link
                        to={item.service_link}
                        className="inline-flex items-center gap-1 text-xs mt-2 transition-colors hover:opacity-80"
                        style={{ color: 'hsl(var(--nb-gold))' }}
                      >
                        {item.service_label_ru || 'Помощь myUNO'} <ArrowRight className="w-3 h-3" />
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
