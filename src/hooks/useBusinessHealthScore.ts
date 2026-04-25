/**
 * @module useBusinessHealthScore
 * Aggregates key business metrics into a 0-100 health score.
 * Formula: 5 pillars × 20 points each:
 *   1. Deals Moving (active deals with recent activity)
 *   2. Tasks On Time (non-overdue / total active)
 *   3. Occupancy (current month)
 *   4. Revenue Trend (MoM growth)
 *   5. Response Time (open service requests under control)
 */
import { useMemo } from 'react';
import { useDashboardMetrics, type DashboardKPI, type DashboardOps } from './useDashboardMetrics';
import { useMyProperties } from './useMyProperties';

export interface HealthPillar {
  key: string;
  labelEn: string;
  labelRu: string;
  score: number; // 0-20
  percent: number; // 0-100 for display
  status: 'good' | 'warning' | 'critical';
}

export interface BusinessHealthResult {
  score: number;
  pillars: HealthPillar[];
  isLoading: boolean;
  urgentCount: number;
  onTrackCount: number;
}

function pillarStatus(percent: number): 'good' | 'warning' | 'critical' {
  if (percent >= 70) return 'good';
  if (percent >= 40) return 'warning';
  return 'critical';
}

export function useBusinessHealthScore(): BusinessHealthResult {
  const { data, isLoading } = useDashboardMetrics();
  const { allProperties } = useMyProperties();
  const kpi = data?.kpi as DashboardKPI | null | undefined;
  const ops = data?.ops as DashboardOps | null | undefined;
  const propertyCount = allProperties?.length ?? 0;

  return useMemo(() => {
    if (!kpi || !ops) {
      return { score: 0, pillars: [], isLoading, urgentCount: 0, onTrackCount: 0 };
    }

    // 1. Deals Moving — healthy when ≈ 1 active deal per 3 properties.
    //    Solo MC (no properties) judged by absolute count.
    const dealsTarget = Math.max(propertyCount * 0.3, 1);
    const dealsPercent = Math.min(100, Math.round((ops.activeDeals / dealsTarget) * 100));
    const dealsScore = Math.round((dealsPercent / 100) * 20);

    // 2. Tasks On Time — (total - overdue) / total
    const totalTasks = ops.openTasks || 1;
    const onTimePercent = Math.max(0, Math.round(((totalTasks - ops.overdueTasks) / totalTasks) * 100));
    const tasksScore = Math.round((onTimePercent / 100) * 20);

    // 3. Occupancy
    const occPercent = kpi.occupancyRate;
    const occScore = Math.round((Math.min(100, occPercent) / 100) * 20);

    // 4. Revenue Trend (MoM)
    const revGrowth = kpi.revenuePrev > 0
      ? Math.round(((kpi.revenue - kpi.revenuePrev) / kpi.revenuePrev) * 100)
      : kpi.revenue > 0 ? 100 : 0;
    const revPercent = Math.min(100, Math.max(0, 50 + revGrowth)); // normalize around 50
    const revScore = Math.round((revPercent / 100) * 20);

    // 5. Service Health — open requests normalised per property (≈ 0.5 req/property = healthy).
    //    Solo MC: each open request still costs 20%, capped at 0%.
    const serviceDenominator = Math.max(propertyCount, 1);
    const requestRatio = ops.openServiceRequests / serviceDenominator;
    const servicePercent = ops.openServiceRequests === 0
      ? 100
      : Math.max(0, Math.round(100 - requestRatio * 50));
    const serviceScore = Math.round((servicePercent / 100) * 20);

    const pillars: HealthPillar[] = [
      { key: 'deals', labelEn: 'Deals', labelRu: 'Сделки', score: dealsScore, percent: dealsPercent, status: pillarStatus(dealsPercent) },
      { key: 'tasks', labelEn: 'Tasks', labelRu: 'Задачи', score: tasksScore, percent: onTimePercent, status: pillarStatus(onTimePercent) },
      { key: 'occupancy', labelEn: 'Occupancy', labelRu: 'Загрузка', score: occScore, percent: occPercent, status: pillarStatus(occPercent) },
      { key: 'revenue', labelEn: 'Revenue', labelRu: 'Выручка', score: revScore, percent: revPercent, status: pillarStatus(revPercent) },
      { key: 'service', labelEn: 'Service', labelRu: 'Сервис', score: serviceScore, percent: servicePercent, status: pillarStatus(servicePercent) },
    ];

    const totalScore = pillars.reduce((s, p) => s + p.score, 0);
    const urgentCount = pillars.filter(p => p.status === 'critical').length + ops.overdueTasks;
    const onTrackCount = pillars.filter(p => p.status === 'good').length;

    return { score: totalScore, pillars, isLoading, urgentCount, onTrackCount };
  }, [kpi, ops, isLoading, propertyCount]);
}
