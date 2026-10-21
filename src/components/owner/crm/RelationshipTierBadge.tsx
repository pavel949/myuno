/**
 * RelationshipTierBadge — A/B/C engagement tier pill.
 *
 * Independent from HNW wealth tier. A = strategic (weekly touch), B = active
 * (monthly), C = watch (quarterly). Uses semantic tokens only — A is accent
 * (orange), B is primary (navy), C is muted-foreground.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type RelationshipTier = 'A' | 'B' | 'C';

interface RelationshipTierBadgeProps {
  tier: RelationshipTier | null | undefined;
  size?: 'sm' | 'md';
  /** Hide when tier is null. Default: show muted "—" placeholder. */
  hideEmpty?: boolean;
  className?: string;
}

const TIER_STYLES: Record<RelationshipTier, string> = {
  A: 'bg-accent/15 text-accent border-accent/30',
  B: 'bg-primary/10 text-primary border-primary/25',
  C: 'bg-muted text-muted-foreground border-border',
};

export function RelationshipTierBadge({
  tier,
  size = 'sm',
  hideEmpty,
  className,
}: RelationshipTierBadgeProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

  if (!tier) {
    if (hideEmpty) return null;
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center border border-border bg-card text-muted-foreground font-mono',
          size === 'sm' ? 'h-5 min-w-5 px-1 text-[10px]' : 'h-6 min-w-6 px-1.5 text-xs',
          className,
        )}
        title={t('crm.tier.unset')}
        aria-label={t('crm.tier.unset')}
      >
        —
      </span>
    );
  }

  const label = t(`crm.tier.${tier.toLowerCase()}.label` as const);
  const description = t(`crm.tier.${tier.toLowerCase()}.description` as const);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border font-mono font-semibold',
        size === 'sm' ? 'h-5 min-w-5 px-1.5 text-[10px]' : 'h-6 min-w-6 px-2 text-xs',
        TIER_STYLES[tier],
        className,
      )}
      title={`${label}${isRu ? ' — ' : ' — '}${description}`}
      aria-label={label}
    >
      {tier}
    </span>
  );
}
