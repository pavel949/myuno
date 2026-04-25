/**
 * ClearViewGauge — semi-circular 0–100 gauge for project rating display.
 * Used in OffplanDetail hero and ClearViewReport summary card.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  scoreToGrade,
  gradeTokenClass,
  type ClearViewGrade,
} from '@/lib/clearview/methodology';

export interface ClearViewGaugeProps {
  score: number | null | undefined;
  grade?: ClearViewGrade | string | null;
  size?: number;
  className?: string;
  isRu?: boolean;
}

export function ClearViewGauge({
  score,
  grade,
  size = 180,
  className,
  isRu = false,
}: ClearViewGaugeProps) {
  const safeScore = Math.max(0, Math.min(100, score ?? 0));
  const resolvedGrade = (grade as ClearViewGrade | null) ?? scoreToGrade(safeScore);
  const tk = gradeTokenClass(resolvedGrade);

  // Semi-circle path
  const cx = size / 2;
  const cy = size * 0.55;
  const r = size * 0.4;
  const strokeWidth = size * 0.08;

  // Arc from 180° (left) → 0° (right)
  const startAngle = Math.PI;
  const endAngle = startAngle - Math.PI * (safeScore / 100);

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = safeScore > 50 ? 1 : 0;

  const arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        {/* Score arc */}
        {safeScore > 0 && (
          <path
            d={arcPath}
            fill="none"
            className={tk.text}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Center text */}
        <text
          x={cx}
          y={cy - size * 0.05}
          textAnchor="middle"
          className={cn('font-mono font-bold fill-current', tk.text)}
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round(safeScore)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.06}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.07 }}
        >
          /100
        </text>
      </svg>
      <div className="flex flex-col items-center -mt-2">
        <span
          className={cn(
            'font-mono font-bold tracking-tight',
            tk.text,
          )}
          style={{ fontSize: size * 0.13 }}
        >
          {resolvedGrade ?? '—'}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {isRu ? 'Рейтинг ClearView V3' : 'ClearView V3 grade'}
        </span>
      </div>
    </div>
  );
}

export default ClearViewGauge;
