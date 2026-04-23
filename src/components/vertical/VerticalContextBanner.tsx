import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { VERTICAL_CONTEXT_CONFIG, type VerticalContextType } from '@/lib/vertical/contextConfig';

interface VerticalContextBannerProps {
  verticalId: string;
  className?: string;
}

const TYPE_STYLES: Record<VerticalContextType, { bg: string; border: string; iconBg: string }> = {
  weather:      { bg: 'bg-primary/10',     border: 'border-primary/40/20',     iconBg: 'bg-primary/15' },
  market:       { bg: 'bg-primary/10',     border: 'border-primary/20',     iconBg: 'bg-primary/15' },
  alert:        { bg: 'bg-warning/10',     border: 'border-warning/20',     iconBg: 'bg-warning/15' },
  seasonal:     { bg: 'bg-accent/10',      border: 'border-accent/20',      iconBg: 'bg-accent/15' },
  availability: { bg: 'bg-success/10',     border: 'border-success/20',     iconBg: 'bg-success/15' },
  emergency:    { bg: 'bg-destructive/10', border: 'border-destructive/20', iconBg: 'bg-destructive/15' },
};

export function VerticalContextBanner({ verticalId, className }: VerticalContextBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [dismissed, setDismissed] = useState(false);

  const config = VERTICAL_CONTEXT_CONFIG[verticalId];
  if (!config || dismissed) return null;

  const styles = TYPE_STYLES[config.type];
  const title = isRu ? config.titleRu : config.titleEn;
  const body = isRu ? config.bodyRu : config.bodyEn;
  const ctaLabel = isRu ? config.ctaLabelRu : config.ctaLabelEn;

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-none border p-3 mb-4',
      styles.bg, styles.border,
      className
    )}>
      <div className={cn('w-9 h-9 rounded-none flex items-center justify-center shrink-0 text-lg', styles.iconBg)}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
        {config.ctaRoute && ctaLabel && (
          <button
            onClick={() => navigate(config.ctaRoute!)}
            className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            {ctaLabel}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {config.dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
