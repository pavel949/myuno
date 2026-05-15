/**
 * CalmClusterHero — neutral, gov-style hero for cluster landing pages.
 *
 * Standard:
 *  - No gradient, no white-on-color, no ALL CAPS heading.
 *  - Mono icon (cluster accent token), card surface.
 *  - Single-line factual subtitle.
 *
 * See mem://style/calm-vertical-tone-standard.
 */
import { LucideIcon } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import type { ClusterId } from '@/lib/catalog';
import { cn } from '@/lib/utils';

interface CalmClusterHeroProps {
  clusterId: ClusterId;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  fallbackPath?: string;
  className?: string;
}

const ACCENT_BG: Record<ClusterId, string> = {
  arrive: 'bg-cluster-arrive/10',
  live: 'bg-cluster-live/10',
  manage: 'bg-cluster-manage/10',
  invest: 'bg-cluster-invest/10',
  legal: 'bg-cluster-legal/10',
  build: 'bg-cluster-build/10',
};

const ACCENT_TEXT: Record<ClusterId, string> = {
  arrive: 'text-cluster-arrive',
  live: 'text-cluster-live',
  manage: 'text-cluster-manage',
  invest: 'text-cluster-invest',
  legal: 'text-cluster-legal',
  build: 'text-cluster-build',
};

export function CalmClusterHero({
  clusterId,
  icon: Icon,
  title,
  subtitle,
  fallbackPath = '/',
  className,
}: CalmClusterHeroProps) {
  return (
    <div className={cn('relative px-4 pt-4 pb-5', className)}>
      <BackButton fallbackPath={fallbackPath} className="mb-3" />
      <div className="rounded-none border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-none flex items-center justify-center flex-shrink-0',
              ACCENT_BG[clusterId],
            )}
          >
            <Icon className={cn('h-[22px] w-[22px]', ACCENT_TEXT[clusterId])} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-h2 font-normal tracking-tight text-foreground leading-[1.1] sm:text-h1">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 font-sans text-body-sm leading-relaxed text-muted-foreground sm:text-body">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
