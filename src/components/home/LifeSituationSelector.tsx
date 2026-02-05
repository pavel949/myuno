/**
 * LifeSituationSelector - "What do you need right now?" entry point
 * Non-invasive overlay on home page
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeSituations';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';

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
  const isRussian = language === 'ru';

  const handleSelect = (code: string) => {
    if (onSelect) {
      onSelect(code);
    } else {
      navigate(`/life-flow/${code}`);
    }
  };

  // Dynamic icon resolver with safe type casting
  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.Compass;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-28 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!situations?.length) return null;

  return (
    <section className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">
          {isRussian ? 'Что вам нужно сейчас?' : 'What do you need right now?'}
        </h2>
      </div>

      {/* Horizontal scroll chips */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide touch-pan-y snap-x snap-mandatory">
        {situations.map((situation) => {
          const Icon = getIcon(situation.icon);
          return (
            <button
              key={situation.id}
              onClick={() => handleSelect(situation.code)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center gap-2",
                "w-24 h-20 rounded-xl border transition-all duration-200",
                "bg-card hover:bg-accent/50 hover:border-primary/30",
                "shadow-sm hover:shadow-md",
                "snap-start"
              )}
              style={{
                borderColor: `${situation.color}30`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${situation.color}15` }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: situation.color }}
                />
              </div>
              <span className="text-xs font-medium text-center leading-tight px-1 line-clamp-2">
                {isRussian ? situation.title_ru : situation.title_en}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});

export default LifeSituationSelector;
