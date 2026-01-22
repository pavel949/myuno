import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialSummary {
  totalGmv: number;
  platformRevenue: number;
  vendorPayouts: number;
  pendingPayouts: number;
  subscriptionRevenue: number;
  averageTakeRate: number;
  orderCount: number;
}

export interface VerticalFinancials {
  vertical: string;
  verticalLabel: string;
  gmv: number;
  platformRevenue: number;
  vendorPayouts: number;
  orderCount: number;
  takeRate: number;
}

export interface ProviderFinancials {
  providerId: string;
  providerName: string;
  vertical: string;
  gmv: number;
  platformRevenue: number;
  pendingPayout: number;
  totalPaid: number;
  orderCount: number;
  commissionRate: number;
}

export interface DailyFinancials {
  date: string;
  gmv: number;
  platformRevenue: number;
  vendorPayouts: number;
  orderCount: number;
}

const VERTICAL_LABELS: Record<string, { en: string; ru: string }> = {
  yacht: { en: 'Yachts', ru: 'Яхты' },
  property: { en: 'Property Rental', ru: 'Аренда недвижимости' },
  property_sale: { en: 'Property Sale', ru: 'Продажа недвижимости' },
  tour: { en: 'Tours', ru: 'Туры' },
  transport: { en: 'Transport', ru: 'Транспорт' },
  restaurant: { en: 'Restaurants', ru: 'Рестораны' },
  spa: { en: 'Spa & Wellness', ru: 'Спа' },
  clinic: { en: 'Medical', ru: 'Медицина' },
  event: { en: 'Events', ru: 'Мероприятия' },
  flower: { en: 'Flowers', ru: 'Цветы' },
  cleaning: { en: 'Cleaning', ru: 'Клининг' },
  babysitter: { en: 'Childcare', ru: 'Няни' },
  education: { en: 'Education', ru: 'Образование' },
  legal: { en: 'Legal', ru: 'Юридические' },
  insurance: { en: 'Insurance', ru: 'Страхование' },
};

export function getVerticalLabel(vertical: string, lang: string = 'ru'): string {
  return VERTICAL_LABELS[vertical]?.[lang as 'en' | 'ru'] || vertical;
}

export function useAdminFinance(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Fetch summary metrics
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-finance-summary', days],
    queryFn: async (): Promise<FinancialSummary> => {
      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, platform_fee_amount, vendor_payout_amount, status')
        .gte('created_at', startDateStr)
        .in('status', ['completed', 'confirmed']);

      if (ordersError) throw ordersError;

      const totalGmv = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
      const platformRevenue = orders?.reduce((sum, o) => sum + (Number(o.platform_fee_amount) || 0), 0) || 0;
      const vendorPayouts = orders?.reduce((sum, o) => sum + (Number(o.vendor_payout_amount) || 0), 0) || 0;

      // Get pending payouts from providers
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('pending_payout');

      if (providersError) throw providersError;

      const pendingPayouts = providers?.reduce((sum, p) => sum + (Number(p.pending_payout) || 0), 0) || 0;

      // Get subscription revenue using RPC function for accurate calculation
      const { data: subRevenue, error: subError } = await supabase
        .rpc('get_subscription_revenue', { p_days: days });

      if (subError) {
        console.error('Subscription revenue error:', subError);
      }

      // Extract monthly revenue from RPC result
      const subscriptionRevenue = subRevenue?.[0]?.total_revenue || 0;

      const averageTakeRate = totalGmv > 0 ? (platformRevenue / totalGmv) * 100 : 0;

      return {
        totalGmv,
        platformRevenue,
        vendorPayouts,
        pendingPayouts,
        subscriptionRevenue,
        averageTakeRate,
        orderCount: orders?.length || 0,
      };
    },
  });

  // Fetch by vertical
  const { data: byVertical, isLoading: verticalLoading } = useQuery({
    queryKey: ['admin-finance-by-vertical', days],
    queryFn: async (): Promise<VerticalFinancials[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('vertical, total_amount, platform_fee_amount, vendor_payout_amount, commission_rate_applied')
        .gte('created_at', startDateStr)
        .in('status', ['completed', 'confirmed']);

      if (error) throw error;

      const verticalMap = new Map<string, VerticalFinancials>();

      orders?.forEach((order) => {
        const vertical = order.vertical || 'other';
        const existing = verticalMap.get(vertical) || {
          vertical,
          verticalLabel: getVerticalLabel(vertical),
          gmv: 0,
          platformRevenue: 0,
          vendorPayouts: 0,
          orderCount: 0,
          takeRate: 0,
        };

        existing.gmv += Number(order.total_amount) || 0;
        existing.platformRevenue += Number(order.platform_fee_amount) || 0;
        existing.vendorPayouts += Number(order.vendor_payout_amount) || 0;
        existing.orderCount += 1;
        
        verticalMap.set(vertical, existing);
      });

      // Calculate take rates
      const result = Array.from(verticalMap.values()).map((v) => ({
        ...v,
        takeRate: v.gmv > 0 ? (v.platformRevenue / v.gmv) * 100 : 0,
      }));

      return result.sort((a, b) => b.gmv - a.gmv);
    },
  });

  // Fetch by provider
  const { data: byProvider, isLoading: providerLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['admin-finance-by-provider', days],
    queryFn: async (): Promise<ProviderFinancials[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('provider_org_id, vertical, total_amount, platform_fee_amount, vendor_payout_amount, commission_rate_applied')
        .gte('created_at', startDateStr)
        .in('status', ['completed', 'confirmed'])
        .not('provider_org_id', 'is', null);

      if (error) throw error;

      // Fetch providers separately
      const providerIds = [...new Set(orders?.map(o => o.provider_org_id).filter(Boolean) || [])];
      const { data: providers } = await supabase
        .from('providers')
        .select('id, name, pending_payout, total_earnings, commission_rate')
        .in('id', providerIds);

      const providerMap = new Map<string, ProviderFinancials>();
      const providerDataMap = new Map(providers?.map(p => [p.id, p]) || []);

      orders?.forEach((order) => {
        const providerId = order.provider_org_id;
        if (!providerId) return;
        const provider = providerDataMap.get(providerId);

        const existing = providerMap.get(providerId) || {
          providerId,
          providerName: provider?.name || 'Unknown',
          vertical: order.vertical || 'other',
          gmv: 0,
          platformRevenue: 0,
          pendingPayout: Number(provider?.pending_payout) || 0,
          totalPaid: (Number(provider?.total_earnings) || 0) - (Number(provider?.pending_payout) || 0),
          orderCount: 0,
          commissionRate: Number(provider?.commission_rate) || Number(order.commission_rate_applied) || 10,
        };

        existing.gmv += Number(order.total_amount) || 0;
        existing.platformRevenue += Number(order.platform_fee_amount) || 0;
        existing.orderCount += 1;
        
        providerMap.set(provider.id, existing);
      });

      return Array.from(providerMap.values()).sort((a, b) => b.gmv - a.gmv);
    },
  });

  // Fetch daily data for charts
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['admin-finance-daily', days],
    queryFn: async (): Promise<DailyFinancials[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, platform_fee_amount, vendor_payout_amount')
        .gte('created_at', startDateStr)
        .in('status', ['completed', 'confirmed'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyMap = new Map<string, DailyFinancials>();

      orders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || {
          date,
          gmv: 0,
          platformRevenue: 0,
          vendorPayouts: 0,
          orderCount: 0,
        };

        existing.gmv += Number(order.total_amount) || 0;
        existing.platformRevenue += Number(order.platform_fee_amount) || 0;
        existing.vendorPayouts += Number(order.vendor_payout_amount) || 0;
        existing.orderCount += 1;
        
        dailyMap.set(date, existing);
      });

      return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  return {
    summary,
    byVertical: byVertical || [],
    byProvider: byProvider || [],
    dailyData: dailyData || [],
    isLoading: summaryLoading || verticalLoading || providerLoading || dailyLoading,
    refetchProviders,
  };
}
