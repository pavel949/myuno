import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ExtendedPlatformMetrics {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_providers: number;
  active_providers: number;
  new_providers: number;
  total_bookings: number;
  new_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  gmv: number;
  platform_revenue: number;
  subscription_revenue: number;
  page_views: number;
  unique_visitors: number;
  // Extended M&A metrics
  avg_order_value: number;
  repeat_purchase_rate: number;
  cross_sell_rate: number;
  dau: number;
  mau: number;
  d7_retention: number;
  d30_retention: number;
  property_listings_count: number;
  property_occupancy_rate: number;
  property_adr: number;
  property_gmv: number;
  tours_count: number;
  tours_gmv: number;
  tours_avg_rating: number;
  yachts_count: number;
  yachts_gmv: number;
  avg_take_rate: number;
  gross_margin: number;
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
}

export interface CohortMetrics {
  id: string;
  cohort_date: string;
  cohort_size: number;
  d1_retained: number;
  d7_retained: number;
  d30_retained: number;
  d90_retained: number;
  d1_retention_rate: number;
  d7_retention_rate: number;
  d30_retention_rate: number;
  d90_retention_rate: number;
}

export interface VerticalMetrics {
  id: string;
  date: string;
  vertical: string;
  listings_count: number;
  active_listings: number;
  providers_count: number;
  bookings_count: number;
  gmv: number;
  avg_order_value: number;
  avg_rating: number;
  take_rate: number;
  revenue: number;
}

export interface CrossSellMetrics {
  id: string;
  date: string;
  from_vertical: string;
  to_vertical: string;
  users_count: number;
  conversion_rate: number;
}

export interface GeographicMetrics {
  id: string;
  date: string;
  location_name: string;
  lat: number | null;
  lng: number | null;
  users_count: number;
  providers_count: number;
  bookings_count: number;
  gmv: number;
  avg_order_value: number;
  top_vertical: string | null;
}

export function useAcquisitionMetrics(days: number = 30) {
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }, [days]);

  const platformMetricsQuery = useQuery({
    queryKey: ["acquisition-platform-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_metrics")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data as ExtendedPlatformMetrics[];
    },
  });

  const cohortMetricsQuery = useQuery({
    queryKey: ["cohort-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cohort_metrics")
        .select("*")
        .gte("cohort_date", startDate)
        .order("cohort_date", { ascending: true });
      
      if (error) throw error;
      return data as CohortMetrics[];
    },
  });

  const verticalMetricsQuery = useQuery({
    queryKey: ["vertical-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vertical_metrics")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data as VerticalMetrics[];
    },
  });

  const crossSellMetricsQuery = useQuery({
    queryKey: ["cross-sell-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cross_sell_metrics")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data as CrossSellMetrics[];
    },
  });

  const geographicMetricsQuery = useQuery({
    queryKey: ["geographic-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geographic_metrics")
        .select("*")
        .gte("date", startDate)
        .order("gmv", { ascending: false });
      
      if (error) throw error;
      return data as GeographicMetrics[];
    },
  });

  // Aggregated summary metrics
  const summary = useMemo(() => {
    const metrics = platformMetricsQuery.data || [];
    if (metrics.length === 0) {
      return {
        avgLTV: 0,
        avgCAC: 50,
        ltvCacRatio: 0,
        avgTakeRate: 10,
        grossMargin: 0,
        avgOrderValue: 0,
        repeatPurchaseRate: 0,
        crossSellRate: 0,
        avgD7Retention: 0,
        avgD30Retention: 0,
        propertyOccupancy: 0,
        propertyADR: 0,
        totalPropertyGMV: 0,
        totalToursGMV: 0,
        totalYachtsGMV: 0,
      };
    }

    const latest = metrics[metrics.length - 1];
    const sum = metrics.reduce((acc, m) => ({
      ltv: acc.ltv + (m.ltv || 0),
      repeatPurchaseRate: acc.repeatPurchaseRate + (m.repeat_purchase_rate || 0),
      crossSellRate: acc.crossSellRate + (m.cross_sell_rate || 0),
      d7Retention: acc.d7Retention + (m.d7_retention || 0),
      d30Retention: acc.d30Retention + (m.d30_retention || 0),
      propertyGMV: acc.propertyGMV + (m.property_gmv || 0),
      toursGMV: acc.toursGMV + (m.tours_gmv || 0),
      yachtsGMV: acc.yachtsGMV + (m.yachts_gmv || 0),
    }), { ltv: 0, repeatPurchaseRate: 0, crossSellRate: 0, d7Retention: 0, d30Retention: 0, propertyGMV: 0, toursGMV: 0, yachtsGMV: 0 });

    return {
      avgLTV: sum.ltv / metrics.length,
      avgCAC: 50, // Assumed for now
      ltvCacRatio: latest.ltv_cac_ratio || 0,
      avgTakeRate: latest.avg_take_rate || 10,
      grossMargin: latest.gross_margin || 0,
      avgOrderValue: latest.avg_order_value || 0,
      repeatPurchaseRate: sum.repeatPurchaseRate / metrics.length,
      crossSellRate: sum.crossSellRate / metrics.length,
      avgD7Retention: sum.d7Retention / metrics.length,
      avgD30Retention: sum.d30Retention / metrics.length,
      propertyOccupancy: latest.property_occupancy_rate || 0,
      propertyADR: latest.property_adr || 0,
      totalPropertyGMV: sum.propertyGMV,
      totalToursGMV: sum.toursGMV,
      totalYachtsGMV: sum.yachtsGMV,
    };
  }, [platformMetricsQuery.data]);

  // Vertical performance aggregation
  const verticalSummary = useMemo(() => {
    const metrics = verticalMetricsQuery.data || [];
    const byVertical: Record<string, { gmv: number; bookings: number; providers: number; avgAOV: number }> = {};
    
    metrics.forEach(m => {
      if (!byVertical[m.vertical]) {
        byVertical[m.vertical] = { gmv: 0, bookings: 0, providers: 0, avgAOV: 0 };
      }
      byVertical[m.vertical].gmv += m.gmv || 0;
      byVertical[m.vertical].bookings += m.bookings_count || 0;
      byVertical[m.vertical].providers = m.providers_count || byVertical[m.vertical].providers;
    });

    return Object.entries(byVertical)
      .map(([vertical, data]) => ({
        vertical,
        ...data,
        avgAOV: data.bookings > 0 ? data.gmv / data.bookings : 0,
      }))
      .sort((a, b) => b.gmv - a.gmv);
  }, [verticalMetricsQuery.data]);

  // Cross-sell matrix
  const crossSellMatrix = useMemo(() => {
    const metrics = crossSellMetricsQuery.data || [];
    const matrix: Record<string, Record<string, number>> = {};
    
    metrics.forEach(m => {
      if (!matrix[m.from_vertical]) matrix[m.from_vertical] = {};
      matrix[m.from_vertical][m.to_vertical] = (matrix[m.from_vertical][m.to_vertical] || 0) + m.users_count;
    });
    
    return matrix;
  }, [crossSellMetricsQuery.data]);

  return {
    platformMetrics: platformMetricsQuery.data || [],
    cohortMetrics: cohortMetricsQuery.data || [],
    verticalMetrics: verticalMetricsQuery.data || [],
    crossSellMetrics: crossSellMetricsQuery.data || [],
    geographicMetrics: geographicMetricsQuery.data || [],
    summary,
    verticalSummary,
    crossSellMatrix,
    isLoading: platformMetricsQuery.isLoading || cohortMetricsQuery.isLoading || verticalMetricsQuery.isLoading,
    error: platformMetricsQuery.error || cohortMetricsQuery.error || verticalMetricsQuery.error,
  };
}

// Hook for Airbnb-specific metrics
export function useAirbnbMetrics(days: number = 30) {
  const { platformMetrics, verticalSummary, isLoading } = useAcquisitionMetrics(days);
  
  const airbnbMetrics = useMemo(() => {
    const latest = platformMetrics[platformMetrics.length - 1];
    const propertyData = verticalSummary.find(v => v.vertical === 'property');
    const tourData = verticalSummary.find(v => v.vertical === 'tour');
    const yachtData = verticalSummary.find(v => v.vertical === 'yacht');

    return {
      // Property metrics (core Airbnb business)
      propertyListings: latest?.property_listings_count || 0,
      propertyOccupancyRate: latest?.property_occupancy_rate || 0,
      propertyADR: latest?.property_adr || 0,
      propertyGMV: latest?.property_gmv || 0,
      propertyRevPAR: (latest?.property_occupancy_rate || 0) * (latest?.property_adr || 0) / 100,
      
      // Experiences metrics (Airbnb Experiences)
      toursCount: latest?.tours_count || 0,
      toursGMV: latest?.tours_gmv || 0,
      toursAvgRating: latest?.tours_avg_rating || 0,
      
      // Luxury tier (Airbnb Luxe potential)
      yachtsCount: latest?.yachts_count || 0,
      yachtsGMV: latest?.yachts_gmv || 0,
      
      // Cross-sell opportunity
      crossSellRate: latest?.cross_sell_rate || 0,
      
      // Strategic value
      uniqueVerticals: verticalSummary.length,
      totalGMV: propertyData?.gmv || 0 + (tourData?.gmv || 0) + (yachtData?.gmv || 0),
    };
  }, [platformMetrics, verticalSummary]);

  return { airbnbMetrics, isLoading };
}
