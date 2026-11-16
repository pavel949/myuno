import React, { memo, forwardRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';
interface UnifiedSectionHeaderProps {
  icon?: LucideIcon;
  iconEmoji?: string;
  iconImage?: string;
  iconColor?: string;
  title: string;
  count?: number;
  viewAllPath?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  className?: string;
  children?: ReactNode;
}
/** Compatibility adapter: routing remains a link; imperative actions remain buttons. */
export const UnifiedSectionHeader = memo(forwardRef<HTMLDivElement, UnifiedSectionHeaderProps>(function UnifiedSectionHeader({
  icon: Icon, iconEmoji, iconImage, iconColor = 'text-primary', title, count, viewAllPath,
  viewAllLabel = 'All', onViewAll, className, children,
}, ref) {
  const ResolvedIcon = iconEmoji ? resolveIcon(iconEmoji) : Icon;
  const leading = iconImage ? <img src={iconImage} alt="" className="w-10 h-10 rounded-none object-cover shrink-0" /> : ResolvedIcon ? <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center shrink-0"><ResolvedIcon className={cn('ds-section-leading-icon', iconColor)} aria-hidden="true" /></div> : undefined;
  const action = onViewAll ? { label: viewAllLabel, onClick: onViewAll } : viewAllPath ? { label: viewAllLabel, to: viewAllPath } : undefined;
  return <SectionHeader ref={ref} title={title} leading={leading} size="lg" density="workspace" action={action}
    badge={count !== undefined && count > 0 ? <Badge variant="secondary" className="text-xs shrink-0">{count}</Badge> : undefined}
    className={cn('ds-section-header-with-content', className)}>{children}</SectionHeader>;
}));
