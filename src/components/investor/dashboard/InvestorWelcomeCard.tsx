import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Heart, Eye, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function InvestorWelcomeCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['investor-welcome-stats', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const interestsRes = await (supabase as any)
        .from('investment_interests')
        .select('id, status', { count: 'exact' })
        .eq('user_id', user!.id);
      const viewingsRes = await (supabase as any)
        .from('viewing_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const interests = interestsRes.data || [];
      const active = interests.filter((i: any) =>
        ['new', 'qualified', 'viewing', 'reservation'].includes(i.status)
      ).length;
      return {
        interests: interestsRes.count ?? interests.length ?? 0,
        active,
        viewings: viewingsRes.count ?? 0,
      };
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-none bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Мои инвестиции' : 'My Investments'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Отслеживайте ваши инвестиционные интересы' : 'Track your investment interests'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Heart className="h-4 w-4 text-primary" />} value={stats?.interests ?? 0} label={isRu ? 'Интересов' : 'Interests'} />
          <Stat icon={<Sparkles className="h-4 w-4 text-warning" />} value={stats?.active ?? 0} label={isRu ? 'В работе' : 'Active'} />
          <Stat icon={<Eye className="h-4 w-4 text-info" />} value={stats?.viewings ?? 0} label={isRu ? 'Просмотров' : 'Viewings'} />
        </div>
      )}
    </Card>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-none border border-border/40 p-3">
      <div className="flex items-center gap-1.5 mb-1">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
