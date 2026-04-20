import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPersona } from '@/hooks/useUserPersonas';

export interface FeedItem {
  id: string;
  title: string;
  detail: string;
  meta: string;
  when: string;
  role: UserPersona | null;
}

function roleFromOrderType(orderType: string | null): UserPersona | null {
  if (!orderType) return null;
  if (orderType.includes('transfer') || orderType.includes('experience') || orderType.includes('yacht')) return 'tourist';
  if (orderType.includes('cleaning') || orderType.includes('medical') || orderType.includes('visa')) return 'resident';
  if (orderType.includes('property') || orderType.includes('stay')) return 'property_owner';
  if (orderType.includes('invest') || orderType.includes('offplan')) return 'investor';
  return null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return '<1h';
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function formatAmount(amount: number | null): string {
  if (!amount) return '';
  return `฿ ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function useActivityFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['home-activity-feed', user?.id],
    queryFn: async (): Promise<FeedItem[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, order_type, total_amount, created_at, notes, vertical')
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        title: (row.notes as string | null) || (row.order_type as string) || 'Order',
        detail: String(row.status || ''),
        meta: formatAmount(row.total_amount as number | null),
        when: timeAgo(row.created_at as string | null),
        role: roleFromOrderType(row.order_type as string | null),
      }));
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
