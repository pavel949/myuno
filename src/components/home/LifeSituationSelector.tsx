/**
 * LifeSituationSelector — Calm life context picker
 * "What's happening in your life?" — not "what do you need?"
 * Soft cards, no sparkle icons, trust-first tone
 */
import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';

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
  const isRu = language === 'ru';
  const [showAll, setShowAll] = useState(false);

  const handleSelect = (situation: {
    code: string;
    title_en: string;
    title_ru: string;
    color: string;
  }) => {
    const title = isRu ? situation.title_ru : situation.title_en;
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
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!situations?.length) return null;

  const VISIBLE_COUNT = 6;
  const displayedSituations = showAll ? situations : situations.slice(0, VISIBLE_COUNT);
  const hiddenCount = situations.length - VISIBLE_COUNT;

  return (
    <section className={cn("space-y-3", className)}>
      {/* Section label — calm, not pushy */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {isRu ? 'Ваша ситуация' : 'Your situation'}
      </p>

      {/* 2-column grid — minimal cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayedSituations.map((situation) => {
          const Icon = getIcon(situation.icon);
          const selected = isActive(situation.code);
          
          return (
            <button
              key={situation.id}
              onClick={() => handleSelect(situation)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150",
                "text-left active:scale-[0.97]",
                selected
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                  : "bg-card border-border/60 hover:border-border"
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${situation.color}10` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: situation.color }}
                />
              </div>
              <span className="text-[13px] font-medium leading-tight line-clamp-2 text-foreground">
                {isRu ? situation.title_ru : situation.title_en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more/less */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAll ? (
            <>
              {isRu ? 'Свернуть' : 'Show less'}
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              {isRu ? `Ещё ${hiddenCount} ситуаций` : `${hiddenCount} more`}
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </section>
  );
});

export default LifeSituationSelector;
