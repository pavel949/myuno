/**
 * Compact circular health-score indicator for IntakeItemCard.
 * SVG ring + % in the centre + tooltip with breakdown.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateHealthScore, healthScoreColor } from '@/lib/intake/healthScore';
import type { IntakeItem } from '@/hooks/useIntakeAgent';

interface IntakeHealthBadgeProps {
  item: IntakeItem;
  size?: 'sm' | 'md';
  className?: string;
}

const MISSING_LABELS: Record<string, { en: string; ru: string }> = {
  image: { en: 'image', ru: 'фото' },
  description: { en: 'description', ru: 'описание' },
  location: { en: 'location', ru: 'локация' },
  price: { en: 'price', ru: 'цена' },
};

export function IntakeHealthBadge({ item, size = 'sm', className }: IntakeHealthBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const health = calculateHealthScore(item);
  const colors = healthScoreColor(health.level);

  const dim = size === 'md' ? 44 : 36;
  const stroke = 4;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (health.score / 100) * c;

  const missingText = health.missing
    .map((m) => MISSING_LABELS[m]?.[isRu ? 'ru' : 'en'] ?? m)
    .join(', ');

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('relative inline-flex items-center justify-center shrink-0', className)}
            style={{ width: dim, height: dim }}
            aria-label={`Health ${health.score}%`}
          >
            <svg width={dim} height={dim} className="-rotate-90">
              <circle
                cx={dim / 2}
                cy={dim / 2}
                r={r}
                strokeWidth={stroke}
                fill="none"
                className="stroke-muted"
              />
              <circle
                cx={dim / 2}
                cy={dim / 2}
                r={r}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
                className={cn('transition-all', colors.ring)}
              />
            </svg>
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center font-semibold',
                size === 'md' ? 'text-xs' : 'text-[10px]',
                colors.text,
              )}
            >
              {health.score}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">
              {isRu ? 'Готовность:' : 'Health:'} {health.score}%
            </div>
            {health.missing.length > 0 ? (
              <div className="text-muted-foreground">
                {isRu ? 'Не хватает: ' : 'Missing: '}
                {missingText}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {isRu ? 'Все блоки заполнены' : 'All blocks filled'}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
