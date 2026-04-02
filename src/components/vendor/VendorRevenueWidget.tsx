/**
 * Vendor Revenue Analytics Widget
 * Shows vendor their earnings, conversion rate, and ranking
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Eye, ShoppingBag, Star } from 'lucide-react';

export function VendorRevenueWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-revenue', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get provider linked to user
      const { data: provider } = await (supabase as any)
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!provider) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Orders this month + previous month
      const sb = supabase as any;
      const [currentRes, prevRes, totalOrdersRes] = await Promise.all([
        sb.from('orders')
          .select('total_amount')
          .eq('provider_id', provider.id)
          .eq('status', 'completed')
          .gte('created_at', startOfMonth),
        sb.from('orders')
          .select('total_amount')
          .eq('provider_id', provider.id)
          .eq('status', 'completed')
          .gte('created_at', startOfPrevMonth)
          .lt('created_at', endOfPrevMonth),
        sb.from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', provider.id)
          .eq('status', 'completed'),
      ]);

      const currentRevenue = (currentRes.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const prevRevenue = (prevRes.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const totalOrders = (totalOrdersRes as any).count || 0;
      const growth = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      return {
        currentRevenue,
        prevRevenue,
        growth,
        totalOrders,
        providerId: provider.id,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const monthGoal = Math.max(data.prevRevenue * 1.1, 10000); // 10% growth target
  const progressPercent = Math.min(100, Math.round((data.currentRevenue / monthGoal) * 100));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {isRu ? 'Ваша выручка' : 'Your Revenue'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue number */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            ฿{data.currentRevenue.toLocaleString()}
          </span>
          {data.growth !== 0 && (
            <Badge
              variant={data.growth > 0 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {data.growth > 0 ? '+' : ''}{data.growth}%
            </Badge>
          )}
        </div>

        {/* Monthly goal progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isRu ? 'Цель месяца' : 'Monthly Goal'}</span>
            <span>฿{monthGoal.toLocaleString()}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">{progressPercent}% {isRu ? 'достигнуто' : 'achieved'}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{data.totalOrders}</p>
              <p className="text-[10px] text-muted-foreground">{isRu ? 'Всего заказов' : 'Total Orders'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                ฿{data.prevRevenue.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">{isRu ? 'Прошлый мес.' : 'Last Month'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
