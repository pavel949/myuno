import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Power, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRoles } from '@/hooks/useUserRoles';

export function AIAgentStatusWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { hasRole } = useUserRoles();
  const isAdmin = hasRole('admin');

  const { data, isLoading } = useQuery({
    queryKey: ['ai-agents-dashboard-status'],
    queryFn: async () => {
      const [agentsRes, logsRes] = await Promise.all([
        supabase.from('ai_agents').select('id, is_active, name_en, name_ru'),
        supabase.from('ai_agent_logs')
          .select('id, is_success, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      const agents = agentsRes.data || [];
      const logs = logsRes.data || [];
      const errors24h = logs.filter(l => l.is_success === false).length;

      return {
        total: agents.length,
        active: agents.filter(a => a.is_active).length,
        calls24h: logs.length,
        errors24h,
      };
    },
    staleTime: 60_000,
  });

  // Hide AI agents ops widget for non-admin MC users (was bouncing on AdminGuard)
  if (!isAdmin) return null;

  if (isLoading) {
    return <Skeleton className="h-[120px] rounded-none" />;
  }

  const hasErrors = (data?.errors24h || 0) > 0;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          {isRu ? 'AI Агенты' : 'AI Agents'}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => navigate('/admin/ai-ops')}
        >
          {isRu ? 'Открыть' : 'Open'}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Power className="h-3.5 w-3.5 text-success" />
            <span className="font-medium">{data?.active}/{data?.total}</span>
            <span className="text-muted-foreground text-xs">{isRu ? 'активных' : 'active'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{data?.calls24h}</span>
            <span className="text-muted-foreground text-xs">{isRu ? 'за 24ч' : '24h calls'}</span>
          </div>
          {hasErrors && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-medium">{data?.errors24h}</span>
              <span className="text-xs">{isRu ? 'ошибок' : 'errors'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
