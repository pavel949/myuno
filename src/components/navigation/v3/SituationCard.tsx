import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { LifeSituation } from '@/hooks/useLifeOS';

interface SituationCardProps {
  situation: LifeSituation;
  serviceCount?: number;
  className?: string;
}

export function SituationCard({ situation, serviceCount, className }: SituationCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? situation.title_ru : situation.title_en;
  const description = isRu ? situation.description_ru : situation.description_en;
  const color = situation.color || '#0A2240';

  return (
    <Link
      to={`/discover/${situation.code}`}
      className={cn(
        'group relative flex flex-col gap-4 p-5 min-h-[180px]',
        'border border-border bg-card text-card-foreground',
        'transition-all duration-150',
        'hover:border-primary/40 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <DynamicIcon
            name={situation.icon || 'Compass'}
            className="w-6 h-6"
            style={{ color }}
            strokeWidth={1.75}
          />
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors"
          strokeWidth={1.75}
        />
      </div>

      <div className="flex-1 space-y-1.5">
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-[13px] leading-[1.5] text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {typeof serviceCount === 'number' && serviceCount > 0 && (
        <div className="pt-3 border-t border-border/60">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {serviceCount} {isRu ? (serviceCount === 1 ? 'услуга' : serviceCount < 5 ? 'услуги' : 'услуг') : serviceCount === 1 ? 'service' : 'services'}
          </span>
        </div>
      )}
    </Link>
  );
}
