import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIConcierge, ConciergeSuggestion } from '@/hooks/useAIConcierge';
import { SectionCard } from '@/components/uno/SectionCard';
import { X, RefreshCw, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const urgencyStyles: Record<string, string> = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-primary bg-primary/5',
};

function SuggestionCard({
  suggestion,
  onDismiss,
  onNavigate,
}: {
  suggestion: ConciergeSuggestion;
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  return (
    <button
      onClick={onNavigate}
      className={cn(
        'w-full text-left p-3 rounded-xl border-l-4 border border-border/50 transition-all hover:shadow-sm active:scale-[0.98]',
        urgencyStyles[suggestion.urgency] || urgencyStyles.low
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg shrink-0 mt-0.5">{suggestion.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {suggestion.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-0.5 rounded-full hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {suggestion.description}
          </p>
          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-primary">
            {suggestion.urgency === 'high' && (
              <AlertTriangle className="w-3 h-3" />
            )}
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
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
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </SectionCard>
    );
  }

  if (!hasSuggestions) return null;

  return (
    <SectionCard className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {isRu ? 'Рекомендации для вас' : 'Suggestions for you'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title={isRu ? 'Обновить' : 'Refresh'}
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.title}
            suggestion={s}
            onDismiss={() => dismiss(s.title)}
            onNavigate={() => navigate(s.path)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
