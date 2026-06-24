import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { hexTint, accentColor } from '@/lib/ui/colorTint';
import { formatServices } from '@/lib/i18n/pluralize';
import { resolveSituationHref } from '@/lib/navigation/situationLandingMap';
import { trackSituationClick } from '@/lib/analytics/track';
import type { LifeSituation } from '@/hooks/useLifeOS';

interface SituationCardProps {
  situation: LifeSituation;
  serviceCount?: number;
  /** Optional Master-Taxonomy cluster ID for accent badge. */
  clusterId?: string;
  /** Cluster colour (hsl(...) token). Used for left-border accent. */
  clusterColor?: string;
  className?: string;
}

export function SituationCard({
  situation,
  serviceCount,
  clusterId,
  clusterColor,
  className,
}: SituationCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? situation.title_ru : situation.title_en;
  const description = isRu ? situation.description_ru : situation.description_en;
  const color = situation.color ?? null;
  const tint = hexTint(color, 0.125);
  const iconColor = accentColor(color);
  const href = resolveSituationHref(situation.code);

  const countLabel =
    typeof serviceCount === 'number' && serviceCount > 0
      ? formatServices(serviceCount, language)
      : isRu ? 'Открыть' : 'Open';

  // Compose a complete accessible name — an aria-label REPLACES the element's
  // name, so it must carry the title, description and localized count.
  const accessibleName = [title, description, countLabel].filter(Boolean).join('. ');

  return (
    <Link
      to={href}
      onClick={() => trackSituationClick(situation.code, {
        source: 'situation_card',
        cluster: clusterId,
        href,
        count: serviceCount,
      })}
      className={cn(
        'group relative flex flex-col gap-4 p-5 min-h-[180px]',
        'border border-border bg-card text-card-foreground',
        'transition-[border-color,transform] duration-150',
        'hover:border-primary/40 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
      style={clusterColor ? { borderLeftWidth: 3, borderLeftColor: clusterColor } : undefined}
      aria-label={accessibleName}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center shrink-0"
          style={{ backgroundColor: tint }}
        >
          <DynamicIcon
            name={situation.icon || 'Compass'}
            className="w-6 h-6"
            style={{ color: iconColor }}
            strokeWidth={1.75}
          />
        </div>
        <ArrowUpRight
          aria-hidden="true"
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

      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {countLabel}
        </span>
        {clusterId && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5"
            style={clusterColor ? { color: clusterColor, borderLeft: `2px solid ${clusterColor}`, paddingLeft: 6 } : undefined}
          >
            {clusterId}
          </span>
        )}
      </div>
    </Link>
  );
}
