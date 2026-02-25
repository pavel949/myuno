import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

interface MuunoScoreWidgetProps {
  score: number | null;
  riskLevel?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showRisk?: boolean;
  showScore?: boolean;
  className?: string;
}

export function MuunoScoreWidget({
  score,
  riskLevel,
  size = 'md',
  showLabel = true,
  showRisk = true,
  showScore = true,
  className,
}: MuunoScoreWidgetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (score === null || score === undefined) {
    return null;
  }

  const getRiskConfig = (level: string | null | undefined) => {
    switch (level) {
      case 'low':
        return {
          color: 'text-success',
          bg: 'bg-success',
          bgLight: 'bg-success/10',
          border: 'border-success/30',
          label: { en: 'Low Risk', ru: 'Низкий риск' },
          icon: CheckCircle2,
        };
      case 'medium':
        return {
          color: 'text-warning',
          bg: 'bg-warning',
          bgLight: 'bg-warning/10',
          border: 'border-warning/30',
          label: { en: 'Medium Risk', ru: 'Средний риск' },
          icon: TrendingUp,
        };
      case 'elevated':
        return {
          color: 'text-accent-amber',
          bg: 'bg-accent-amber',
          bgLight: 'bg-accent-amber/10',
          border: 'border-accent-amber/30',
          label: { en: 'Elevated Risk', ru: 'Повышенный риск' },
          icon: AlertTriangle,
        };
      case 'high':
        return {
          color: 'text-destructive',
          bg: 'bg-destructive',
          bgLight: 'bg-destructive/10',
          border: 'border-destructive/30',
          label: { en: 'High Risk', ru: 'Высокий риск' },
          icon: AlertTriangle,
        };
      default:
        // Derive from score
        if (score >= 85) return getRiskConfig('low');
        if (score >= 60) return getRiskConfig('medium');
        if (score >= 40) return getRiskConfig('elevated');
        return getRiskConfig('high');
    }
  };

  const config = getRiskConfig(riskLevel);
  const RiskIcon = config.icon;

  const sizeStyles = {
    sm: {
      container: 'gap-1',
      score: 'text-sm font-semibold',
      dots: 'h-1 w-1',
      label: 'text-[10px]',
    },
    md: {
      container: 'gap-1.5',
      score: 'text-base font-bold',
      dots: 'h-1.5 w-1.5',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-2',
      score: 'text-xl font-bold',
      dots: 'h-2 w-2',
      label: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  // Calculate filled dots (out of 5)
  const filledDots = Math.round(score / 20);

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      <div className="flex items-center gap-1.5">
        {/* Score dots visualization */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((dot) => (
            <div
              key={dot}
              className={cn(
                'rounded-full transition-colors',
                styles.dots,
                dot <= filledDots ? config.bg : 'bg-muted'
              )}
            />
          ))}
        </div>
        
        {/* Numeric score */}
        {showScore && (
          <span className={cn(styles.score, config.color)}>
            {score}
          </span>
        )}
      </div>

      {/* Risk label */}
      {showRisk && (
        <div className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded-full w-fit',
          config.bgLight,
          config.border,
          'border'
        )}>
          <RiskIcon className={cn('h-3 w-3', config.color)} />
          <span className={cn(styles.label, config.color, 'font-medium')}>
            {isRu ? config.label.ru : config.label.en}
          </span>
        </div>
      )}

      {/* muUNO label */}
      {showLabel && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Shield className="h-2.5 w-2.5" />
          muUNO Score
        </span>
      )}
    </div>
  );
}
