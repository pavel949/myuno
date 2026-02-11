import React, { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICAL_GROUPS, type VerticalGroupItem } from '@/lib/verticalGroups';
import { VERTICALS } from '@/lib/verticals';
import { resolveIcon } from '@/lib/iconMap';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

function resolveItem(item: VerticalGroupItem, language: string) {
  if (item.verticalId) {
    const v = Object.values(VERTICALS).find(v => v.id === item.verticalId);
    if (!v) return null;
    return {
      id: v.id,
      icon: v.icon,
      label: language === 'ru' ? v.labelRu : v.labelEn,
      route: `/${v.plural}`,
    };
  }
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
  };
}

const INITIAL_GROUPS_VISIBLE = 3;

export const AllServicesGrid = memo(function AllServicesGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [expanded, setExpanded] = useState(false);

  const visibleGroups = expanded ? VERTICAL_GROUPS : VERTICAL_GROUPS.slice(0, INITIAL_GROUPS_VISIBLE);

  const handleNav = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        {isRu ? 'Все сервисы' : 'All Services'}
      </h2>

      <div className="space-y-5">
        {visibleGroups.map((group) => {
          const items = group.items
            .map(item => resolveItem(item, language))
            .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[];

          return (
            <div key={group.id} className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {isRu ? group.labelRu : group.labelEn}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {items.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.route)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl",
                        "bg-muted/30 hover:bg-muted/60",
                        "active:scale-[0.96] transition-all duration-150",
                        "text-center cursor-pointer"
                      )}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-card border border-border/40 flex items-center justify-center shadow-sm">
                        <Icon className="w-4 h-4 text-foreground/70" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground/80 leading-tight line-clamp-2">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {VERTICAL_GROUPS.length > INITIAL_GROUPS_VISIBLE && (
        <button
          onClick={() => { setExpanded(!expanded); triggerHaptic('light'); }}
          className="flex items-center gap-1.5 mx-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{isRu ? (expanded ? 'Свернуть' : 'Показать все') : (expanded ? 'Show less' : 'Show all')}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </section>
  );
});
