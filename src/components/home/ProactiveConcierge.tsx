import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIConcierge, ConciergeSuggestion } from '@/hooks/useAIConcierge';
import { SectionCard } from '@/components/uno/SectionCard';
import { X, RefreshCw, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const urgencyConfig: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  high: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/5 dark:bg-destructive/10',
    badge: 'bg-destructive/10 text-destructive',
    badgeText: 'Urgent',
  },
  medium: {
    border: 'border-l-warning',
    bg: 'bg-warning/5 dark:bg-warning/10',
    badge: 'bg-warning/10 text-warning',
    badgeText: 'Soon',
  },
  low: {
    border: 'border-l-primary',
    bg: 'bg-primary/5 dark:bg-primary/10',
    badge: 'bg-primary/10 text-primary',
    badgeText: 'Tip',
  },
};

function SuggestionCard({
  suggestion,
  onDismiss,
  onNavigate,
  index,
}: {
  suggestion: ConciergeSuggestion;
  onDismiss: () => void;
  onNavigate: () => void;
  index: number;
}) {
  const config = urgencyConfig[suggestion.urgency] || urgencyConfig.low;
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const badgeLabel = suggestion.urgency === 'high'
    ? (isRu ? 'Срочно' : config.badgeText)
    : suggestion.urgency === 'medium'
      ? (isRu ? 'Скоро' : config.badgeText)
      : (isRu ? 'Совет' : config.badgeText);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      layout
    >
      <button
        onClick={onNavigate}
        className={cn(
          'w-full text-left rounded-none border-l-[3px] border border-border/40 transition-all duration-150',
          'hover:shadow-sm active:scale-[0.98]',
          'p-3.5',
          config.border,
          config.bg,
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-9 h-9 rounded-none bg-card border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-base leading-none">{suggestion.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {suggestion.title}
              </p>
              {suggestion.urgency === 'high' && (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-medium',
                config.badge,
              )}>
                {badgeLabel}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">
                {isRu ? 'Подробнее' : 'View'}
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 rounded-none hover:bg-muted/80 transition-colors shrink-0 -mt-0.5 -mr-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </button>
    </motion.div>
  );
}

export function ProactiveConcierge() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { suggestions, isLoading, hasSuggestions, dismiss, refresh } = useAIConcierge();

  if (isLoading && suggestions.length === 0) {
    return (
      <SectionCard className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-none bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-[76px] w-full rounded-none" />
          <Skeleton className="h-[76px] w-full rounded-none" />
        </div>
      </SectionCard>
    );
  }

  if (!hasSuggestions) return null;

  return (
    <SectionCard className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-none bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {isRu ? 'Рекомендации для вас' : 'Suggestions for you'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isRu ? 'На основе вашего контекста' : 'Based on your context'}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-none hover:bg-muted transition-colors group"
          title={isRu ? 'Обновить' : 'Refresh'}
        >
          <RefreshCw className={cn(
            'w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors',
            isLoading && 'animate-spin'
          )} />
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={s.title}
              suggestion={s}
              index={i}
              onDismiss={() => dismiss(s.title)}
              onNavigate={() => navigate(s.path)}
            />
          ))}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}
