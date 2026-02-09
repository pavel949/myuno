/**
 * LifeSituationSelector - "What do you need right now?" entry point
 * 2-column grid layout with show more toggle
 */
import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface LifeSituationSelectorProps {
  className?: string;
  onSelect?: (code: string) => void;
}

export const LifeSituationSelector = memo(function LifeSituationSelector({
  className,
  onSelect,
}: LifeSituationSelectorProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: situations, isLoading } = useLifeSituations();
  const { setLifeSituation, isActive } = useLifeSituationContext();
  const isRussian = language === 'ru';
  const [showAll, setShowAll] = useState(false);

  const handleSelect = (situation: {
    code: string;
    title_en: string;
    title_ru: string;
    color: string;
  }) => {
    const title = isRussian ? situation.title_ru : situation.title_en;
    setLifeSituation(situation.code, title, situation.color);
    
    if (onSelect) {
      onSelect(situation.code);
    } else {
      navigate(`/life-flow/${situation.code}`);
    }
  };

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.Compass;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!situations?.length) return null;

  const VISIBLE_COUNT = 8;
  const displayedSituations = showAll ? situations : situations.slice(0, VISIBLE_COUNT);
  const hiddenCount = situations.length - VISIBLE_COUNT;

  return (
    <section className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-[15px] font-bold">
          {isRussian ? 'Что вам сейчас нужно?' : 'What do you need right now?'}
        </h2>
      </div>

      {/* 2-column grid — compact cards */}
      <div className="grid grid-cols-2 gap-2">
        {displayedSituations.map((situation) => {
          const Icon = getIcon(situation.icon);
          const isSelected = isActive(situation.code);
          
          return (
            <button
              key={situation.id}
              onClick={() => handleSelect(situation)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-150",
                "bg-card hover:bg-accent/50 active:scale-[0.98]",
                "text-left",
                isSelected ? "ring-2 ring-primary border-primary" : "border-border shadow-sm"
              )}
              style={{
                borderColor: isSelected ? situation.color : undefined,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${situation.color}15` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: situation.color }}
                />
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">
                {isRussian ? situation.title_ru : situation.title_en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more / less toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? (
            <>
              {isRussian ? 'Свернуть' : 'Show less'}
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              {isRussian ? `Ещё ${hiddenCount}` : `${hiddenCount} more`}
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </section>
  );
});

export default LifeSituationSelector;
