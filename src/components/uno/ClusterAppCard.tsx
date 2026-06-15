/**
 * ClusterAppCard — compact link tile for cluster landing grids (Arrive, Legal, …).
 */
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { ClusterId, ServiceStatus } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const ACCENT_BG: Record<ClusterId, string> = {
  arrive: 'bg-cluster-arrive',
  live: 'bg-cluster-live',
  manage: 'bg-cluster-manage',
  invest: 'bg-cluster-invest',
  legal: 'bg-cluster-legal',
  build: 'bg-cluster-build',
};

const ACCENT_BORDER: Record<ClusterId, string> = {
  arrive: 'border-cluster-arrive',
  live: 'border-cluster-live',
  manage: 'border-cluster-manage',
  invest: 'border-cluster-invest',
  legal: 'border-cluster-legal',
  build: 'border-cluster-build',
};

export interface ClusterAppCardProps {
  clusterId: ClusterId;
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  status: ServiceStatus;
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === 'available') return null;
  const label = status === 'soon' ? 'Soon' : 'Pro';
  return (
    <span className="rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

export function ClusterAppCard({
  clusterId,
  icon: Icon,
  title,
  description,
  path,
  status,
}: ClusterAppCardProps) {
  const isSoon = status === 'soon';

  return (
    <Link
      to={path}
      className={cn(
        'group block rounded-none border border-border bg-background p-4 transition-colors',
        'hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isSoon && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-none border',
            ACCENT_BG[clusterId],
            ACCENT_BORDER[clusterId],
          )}
        >
          <Icon className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-body font-semibold tracking-tight text-foreground">{title}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 font-sans text-body-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
