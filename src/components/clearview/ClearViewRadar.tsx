/**
 * ClearViewRadar — 8-axis radar chart visualizing per-category scores.
 * Used in the public ClearView summary and full report.
 */

import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CLEARVIEW_CATEGORIES } from '@/lib/clearview/methodology';
import type { DueDiligenceReport } from '@/hooks/useDueDiligence';

export interface ClearViewRadarProps {
  report:
    | Pick<
        DueDiligenceReport,
        | 'score_legal'
        | 'score_developer'
        | 'score_construction'
        | 'score_location'
        | 'score_financial'
        | 'score_returns'
        | 'score_marketing'
        | 'score_liquidity'
      >
    | null
    | undefined;
  isRu?: boolean;
  height?: number;
}

export function ClearViewRadar({ report, isRu = false, height = 280 }: ClearViewRadarProps) {
  const data = useMemo(() => {
    if (!report) return [];
    return CLEARVIEW_CATEGORIES.map((cat) => ({
      category: isRu ? cat.shortRu : cat.shortEn,
      fullName: isRu ? cat.nameRu : cat.nameEn,
      score: Number(report[cat.scoreField] ?? 0),
      weight: cat.weight,
    }));
  }, [report, isRu]);

  if (!report) return null;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            stroke="hsl(var(--border))"
          />
          <Radar
            name={isRu ? 'Балл' : 'Score'}
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 0,
              fontSize: 12,
            }}
            formatter={(value: number, _name, props) => [
              `${value}/100 · ${Math.round(props.payload.weight * 100)}%`,
              props.payload.fullName,
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ClearViewRadar;
