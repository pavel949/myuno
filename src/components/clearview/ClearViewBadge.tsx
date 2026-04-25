/**
 * ClearViewBadge — compact grade chip used on cards, maps, and trust strips.
 *
 * Sizes:
 *  - xs : tiny (map InfoWindow, tight strips)
 *  - sm : default (PropertyListingCard overlay, TrustStrip)
 *  - md : prominent (OffplanDetail header)
 */

import React from 'react';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ClearViewGrade,
  gradeTokenClass,
  scoreToGrade,
} from '@/lib/clearview/methodology';

export interface ClearViewBadgeProps {
  grade?: ClearViewGrade | string | null;
  score?: number | null;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  isRu?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ClearViewBadge({
  grade,
  score,
  size = 'sm',
  showLabel = true,
  isRu = false,
  className,
  onClick,
}: ClearViewBadgeProps) {
  const resolvedGrade =
    (grade as ClearViewGrade | null) ?? (score != null ? scoreToGrade(score) : null);
  if (!resolvedGrade) return null;

  const tk = gradeTokenClass(resolvedGrade);

  const sizes = {
    xs: { wrap: 'text-[10px] px-1.5 py-0.5 gap-1', icon: 'w-2.5 h-2.5' },
    sm: { wrap: 'text-[11px] px-2 py-0.5 gap-1', icon: 'w-3 h-3' },
    md: { wrap: 'text-xs px-2.5 py-1 gap-1.5', icon: 'w-3.5 h-3.5' },
  } as const;
  const s = sizes[size];

  const label = showLabel
    ? `ClearView ${resolvedGrade}`
    : resolvedGrade;

  return (
    <span
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      title={
        isRu
          ? `Институциональный рейтинг ClearView V3 · ${resolvedGrade}`
          : `Institutional ClearView V3 rating · ${resolvedGrade}`
      }
      className={cn(
        'inline-flex items-center font-mono font-semibold rounded-none border whitespace-nowrap',
        s.wrap,
        tk.bg,
        tk.text,
        tk.border,
        onClick && 'cursor-pointer hover:opacity-80',
        className,
      )}
    >
      <Award className={cn('shrink-0', s.icon)} aria-hidden />
      {label}
    </span>
  );
}

export default ClearViewBadge;
