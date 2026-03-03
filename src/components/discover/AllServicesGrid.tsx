import React, { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICAL_GROUPS } from '@/lib/verticalGroups';
import { resolveVerticalItem } from '@/lib/resolveVerticalItem';
import { IconBadge } from '@/components/ui/IconBadge';
import { Surface } from '@/components/ui/surface';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

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

      <div className="space-y-3">
        {visibleGroups.map((group, gi) => {
          const items = group.items
            .map(item => resolveVerticalItem(item, language))
            .filter(Boolean) as NonNullable<ReturnType<typeof resolveVerticalItem>>[];

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              <Surface variant="card" padding="md" radius="xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{group.icon}</span>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      {isRu ? group.labelRu : group.labelEn}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.route)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2.5 rounded-xl",
                          "hover:bg-muted/50 active:bg-muted",
                          "active:scale-[0.95] transition-all duration-200",
                          "text-center cursor-pointer group touch-manipulation"
                        )}
                      >
                        <IconBadge
                          icon={item.icon}
                          size="lg"
                          variant="gradient"
                          gradient={item.gradient}
                          className="shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200"
                        />
                        <span className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Surface>
            </motion.div>
          );
        })}

        {VERTICAL_GROUPS.length > INITIAL_GROUPS_VISIBLE && (
          <button
            onClick={() => { setExpanded(!expanded); triggerHaptic('light'); }}
            className="flex items-center gap-1.5 mx-auto py-2 px-4 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <span>{isRu ? (expanded ? 'Свернуть' : 'Показать все') : (expanded ? 'Show less' : 'Show all')}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", expanded && "rotate-180")} />
          </button>
        )}
      </div>
    </section>
  );
});
