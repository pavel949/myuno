import { useMemo } from 'react';
import { useRealtimeStats, useAdminAnalytics } from './useAdminAnalytics';
import {
  MARKET_DATA,
  PAIN_POINTS,
  SERVICE_VERTICALS,
  COMPETITORS,
  REVENUE_STREAMS,
  FINANCIAL_PROJECTIONS,
  PMF_TARGETS,
  INVESTMENT_DETAILS,
  VALUE_PROPOSITIONS,
} from '@/lib/config';

// Re-export for backwards compatibility
export {
  MARKET_DATA,
  PAIN_POINTS,
  SERVICE_VERTICALS,
  COMPETITORS,
  REVENUE_STREAMS,
  FINANCIAL_PROJECTIONS,
  PMF_TARGETS,
  INVESTMENT_DETAILS,
  VALUE_PROPOSITIONS,
};

export function useInvestorMetrics() {
  const { stats, isLoading: statsLoading } = useRealtimeStats();
  const { summary, revenueChartData, isLoading: analyticsLoading } = useAdminAnalytics(30);

  const tractionMetrics = useMemo(() => ({
    totalUsers: stats.totalUsers || summary.totalUsers || 0,
    totalProviders: stats.totalProviders || summary.totalProviders || 0,
    totalBookings: stats.totalBookings || summary.totalBookings || 0,
    gmv: summary.totalGMV || 0,
    revenue: summary.totalRevenue || 0,
    growth: {
      users: summary.userGrowth || 0,
      providers: summary.providerGrowth || 0,
      bookings: summary.bookingGrowth || 0,
      revenue: summary.revenueGrowth || 0,
    }
  }), [stats, summary]);

  const tamSamSom = useMemo(() => ({
    tam: MARKET_DATA.phuketTourismRevenue2024,
    sam: MARKET_DATA.addressableMarket,
    som: MARKET_DATA.potentialRevenue / 1000, // Convert to billions
  }), []);

  return {
    tractionMetrics,
    revenueChartData,
    tamSamSom,
    marketData: MARKET_DATA,
    painPoints: PAIN_POINTS,
    serviceVerticals: SERVICE_VERTICALS,
    competitors: COMPETITORS,
    revenueStreams: REVENUE_STREAMS,
    financialProjections: FINANCIAL_PROJECTIONS,
    pmfTargets: PMF_TARGETS,
    investmentDetails: INVESTMENT_DETAILS,
    valuePropositions: VALUE_PROPOSITIONS,
    isLoading: statsLoading || analyticsLoading,
  };
}
