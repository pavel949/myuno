/**
 * useAcquisitionMetrics — stub for acquisition analytics dashboard.
 * Returns zeroed metrics. TODO: Connect to real analytics data source.
 */
import { useQuery } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlatformMetric = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CohortMetric = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VerticalSummaryItem = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CrossSellItem = Record<string, any>;

interface AcquisitionSummary {
  totalVisitors: number;
  totalConversions: number;
  avgCac: number;
  avgCAC: number;
  ltv: number;
  avgLTV: number;
  ltvCacRatio: number;
  repeatPurchaseRate: number;
  crossSellRate: number;
  avgOrderValue: number;
  avgTakeRate: number;
  grossMargin: number;
  avgD7Retention: number;
  avgD30Retention: number;
}

interface AirbnbMetrics {
  syncedProperties: number;
  bookings30d: number;
  revenue30d: number;
  avgRating: number;
  propertyListings: number;
  propertyOccupancyRate: number;
  propertyADR: number;
  propertyRevPAR: number;
  propertyGMV: number;
  toursCount: number;
  toursAvgRating: number;
  toursGMV: number;
  yachtsCount: number;
  yachtsGMV: number;
  crossSellRate: number;
  uniqueVerticals: number;
  totalGMV: number;
  ltvCacRatio: number;
}

const EMPTY_SUMMARY: AcquisitionSummary = {
  totalVisitors: 0,
  totalConversions: 0,
  avgCac: 0,
  avgCAC: 0,
  ltv: 0,
  avgLTV: 0,
  ltvCacRatio: 0,
  repeatPurchaseRate: 0,
  crossSellRate: 0,
  avgOrderValue: 0,
  avgTakeRate: 0,
  grossMargin: 0,
  avgD7Retention: 0,
  avgD30Retention: 0,
};

const EMPTY_AIRBNB: AirbnbMetrics = {
  syncedProperties: 0,
  bookings30d: 0,
  revenue30d: 0,
  avgRating: 0,
  propertyListings: 0,
  propertyOccupancyRate: 0,
  propertyADR: 0,
  propertyRevPAR: 0,
  propertyGMV: 0,
  toursCount: 0,
  toursAvgRating: 0,
  toursGMV: 0,
  yachtsCount: 0,
  yachtsGMV: 0,
  crossSellRate: 0,
  uniqueVerticals: 0,
  totalGMV: 0,
  ltvCacRatio: 0,
};

export function useAcquisitionMetrics(_period: number = 30) {
  const { isLoading } = useQuery({
    queryKey: ['acquisition-metrics', _period],
    queryFn: async () => ({}),
    staleTime: 5 * 60 * 1000,
  });

  return {
    platformMetrics: [] as PlatformMetric[],
    cohortMetrics: [] as CohortMetric[],
    verticalSummary: [] as VerticalSummaryItem[],
    crossSellMatrix: [] as CrossSellItem[],
    summary: EMPTY_SUMMARY,
    isLoading,
  };
}

export function useAirbnbMetrics(_period: number = 30) {
  return {
    airbnbMetrics: EMPTY_AIRBNB,
  };
}
