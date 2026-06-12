/**
 * <CommissionDisplay /> — single-source-of-truth commission badge.
 *
 * Sprint D requirement: any UI text mentioning a commission rate
 * (landings, vendor pages, FAQ blocks) MUST read from
 * `vertical_commission_rules` via this component rather than hardcoding
 * a percentage string. When ops updates the rate in DB, the UI follows.
 */
import { useCommissionRate, type CommissionVertical } from '@/hooks/useCommissionRate';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  vertical: CommissionVertical;
  /** Render variant: 'inline' (default) — span; 'badge' — pill-shaped. */
  variant?: 'inline' | 'badge';
  className?: string;
}

export function CommissionDisplay({ vertical, variant = 'inline', className }: Props) {
  const { display, isLoading } = useCommissionRate(vertical);
  if (isLoading) return <Skeleton className="inline-block h-3 w-8 align-middle" />;
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center rounded-none border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] ${className ?? ''}`}
        title="Source: vertical_commission_rules"
      >
        {display}
      </span>
    );
  }
  return (
    <span className={`font-mono ${className ?? ''}`} title="Source: vertical_commission_rules">
      {display}
    </span>
  );
}
