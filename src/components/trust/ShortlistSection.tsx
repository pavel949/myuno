/**
 * ShortlistSection — P2.2 Shortlist-First Presentation
 * 
 * All verticals default to showing Top 3–5 options.
 * "Show all" is optional and secondary.
 * Explains shortlist logic explicitly.
 */
import React, { useState, ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { cn } from '@/lib/utils';
import { ChevronDown, Filter } from 'lucide-react';
import { ContextualHeader } from './ContextualHeader';
import { Button } from '@/components/ui/button';

interface ShortlistSectionProps {
  /** Section title */
  title: string;
  /** Vertical type for contextual header */
  vertical: string;
  /** Total available items */
  totalCount: number;
  /** Shortlist size (default 5) */
  shortlistSize?: number;
  /** Why these items were selected */
  shortlistReason?: string;
  /** Render the items (receives isExpanded) */
  children: (isExpanded: boolean) => ReactNode;
  /** Show the "show all" button */
  showExpandButton?: boolean;
  className?: string;
}

const SHORTLIST_REASONS: Record<string, { en: string; ru: string }> = {
  relevance: {
    en: 'Selected for relevance to your situation',
    ru: 'Выбрано по релевантности к вашей ситуации',
  },
  reliability: {
    en: 'Selected for reliability and consistent quality',
    ru: 'Выбрано за надёжность и стабильное качество',
  },
  proximity: {
    en: 'Selected for proximity and convenience',
    ru: 'Выбрано по близости и удобству',
  },
  availability: {
    en: 'Available now and ready to serve',
    ru: 'Доступно сейчас и готово к обслуживанию',
  },
};

export function ShortlistSection({
  title,
  vertical,
  totalCount,
  shortlistSize = 5,
  shortlistReason,
  children,
  showExpandButton = true,
  className,
}: ShortlistSectionProps) {
  const { language } = useLanguage();
  const { activeCode } = useLifeSituationContext();
  const isRu = language === 'ru';
  const [isExpanded, setIsExpanded] = useState(false);

  const shownCount = isExpanded ? totalCount : Math.min(shortlistSize, totalCount);
  const hasMore = totalCount > shortlistSize;

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {!isExpanded && hasMore && (
          <span className="text-xs text-muted-foreground">
            {shownCount} {isRu ? 'из' : 'of'} {totalCount}
          </span>
        )}
      </div>

      {/* Contextual recommendation header (only with active life situation) */}
      {activeCode && (
        <ContextualHeader
          vertical={vertical}
          shownCount={shownCount}
          totalCount={totalCount}
        />
      )}

      {/* Shortlist reason (when no life situation) */}
      {!activeCode && shortlistReason && SHORTLIST_REASONS[shortlistReason] && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Filter className="w-3 h-3" />
          {isRu
            ? SHORTLIST_REASONS[shortlistReason].ru
            : SHORTLIST_REASONS[shortlistReason].en}
        </p>
      )}

      {/* Items */}
      {children(isExpanded)}

      {/* Expand button */}
      {showExpandButton && hasMore && !isExpanded && (
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronDown className="w-4 h-4 mr-1.5" />
          {isRu
            ? `Показать все ${totalCount}`
            : `Show all ${totalCount}`}
        </Button>
      )}
    </section>
  );
}
