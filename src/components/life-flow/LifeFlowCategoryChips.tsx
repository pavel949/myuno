/**
 * LifeFlowCategoryChips - Horizontal scroll chips for quick category navigation
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { getEntityType } from '@/lib/config/entityTypes';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LifeFlowCategoryChipsProps {
  entityTypes: string[];
  activeType: string | null;
  onSelect: (type: string | null) => void;
  itemCounts: Record<string, number>;
}

export function LifeFlowCategoryChips({ entityTypes, activeType, onSelect, itemCounts }: LifeFlowCategoryChipsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (entityTypes.length <= 1) return null;

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-2 pb-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
            "border",
            !activeType
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          )}
        >
          {isRu ? 'Все' : 'All'}
        </button>
        {entityTypes.map((type) => {
          const config = getEntityType(type);
          const Icon = config.icon;
          const count = itemCounts[type] || 0;
          const isActive = activeType === type;

          return (
            <button
              key={type}
              onClick={() => onSelect(isActive ? null : type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
                "border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isRu ? config.pluralRu : config.pluralEn}</span>
              <span className={cn(
                "text-[10px] px-1 rounded-full min-w-[16px] text-center",
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="h-1" />
    </ScrollArea>
  );
}
