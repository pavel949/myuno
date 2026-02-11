import React, { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Grid3X3 } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Grid3X3 className="w-4 h-4 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {isRu ? 'Все сервисы' : 'All Services'}
        </h2>
      </div>

      <div className="rounded-2xl bg-muted/20 border border-border/40 p-4 space-y-5">
        {visibleGroups.map((group, gi) => {
          const items = group.items
            .map(item => resolveItem(item, language))
            .filter(Boolean) as NonNullable<ReturnType<typeof resolveItem>>[];

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{group.icon}</span>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {isRu ? group.labelRu : group.labelEn}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {items.map((item) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.route)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl",
                        "bg-card hover:bg-card/80 border border-border/30",
                        "hover:shadow-md hover:-translate-y-0.5",
                        "active:scale-[0.95] transition-all duration-200",
                        "text-center cursor-pointer group"
                      )}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-4.5 h-4.5 text-foreground/70 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground/70 leading-tight line-clamp-2 group-hover:text-foreground transition-colors">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {VERTICAL_GROUPS.length > INITIAL_GROUPS_VISIBLE && (
            <motion.button
              layout
              onClick={() => { setExpanded(!expanded); triggerHaptic('light'); }}
              className="flex items-center gap-1.5 mx-auto py-2 px-4 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <span>{isRu ? (expanded ? 'Свернуть' : 'Показать все') : (expanded ? 'Show less' : 'Show all')}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", expanded && "rotate-180")} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
