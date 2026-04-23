import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Power, Activity, Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AgentQuickStats() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Fetch agents count
  const { data: agents } = useQuery({
    queryKey: ['ai-agents-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_agents')
        .select('id, is_active');
      return data || [];
    },
  });

  // Fetch 24h logs
  const { data: logsStats } = useQuery({
    queryKey: ['ai-agent-logs-24h'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data } = await supabase
        .from('ai_agent_logs')
        .select('id, response_time_ms')
        .gte('created_at', yesterday.toISOString());

      const logs = data || [];
      const totalCalls = logs.length;
      const avgResponse = logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length)
        : 0;

      return { totalCalls, avgResponse };
    },
  });

  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter(a => a.is_active).length || 0;
  const calls24h = logsStats?.totalCalls || 0;
  const avgResponse = logsStats?.avgResponse || 0;

  const stats = [
    {
      icon: Bot,
      label: isRussian ? 'Всего' : 'Total',
      value: totalAgents,
      suffix: isRussian ? 'агентов' : 'agents',
    },
    {
      icon: Power,
      label: isRussian ? 'Активных' : 'Active',
      value: activeAgents,
      suffix: isRussian ? 'агентов' : 'agents',
      highlight: activeAgents === totalAgents,
    },
    {
      icon: Activity,
      label: isRussian ? 'За 24ч' : '24h Calls',
      value: calls24h.toLocaleString(),
      suffix: '',
    },
    {
      icon: Timer,
      label: isRussian ? 'Ср. ответ' : 'Avg Response',
      value: avgResponse,
      suffix: 'ms',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <Card key={i} className="border-dashed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-none ${stat.highlight ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold">
                {stat.value}
                {stat.suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{stat.suffix}</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
