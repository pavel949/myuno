import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

function KPICard({ title, value, change, changeLabel, icon: Icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : trend === 'down' ? (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                ) : null}
                <span className={trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : ''}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MCCOverviewTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Fetch lead stats
  const { data: leadStats } = useQuery({
    queryKey: ['mcc-lead-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_leads')
        .select('id, status, priority, score, created_at', { count: 'exact' });
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const hot = data?.filter(l => l.priority === 'hot').length || 0;
      const converted = data?.filter(l => l.status === 'converted').length || 0;
      const today = data?.filter(l => {
        const created = new Date(l.created_at);
        const now = new Date();
        return created.toDateString() === now.toDateString();
      }).length || 0;

      return { total, hot, converted, today, conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : 0 };
    }
  });

  // Fetch campaign stats
  const { data: campaignStats } = useQuery({
    queryKey: ['mcc-campaign-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_campaigns')
        .select('id, status');
      
      if (error) throw error;
      
      const active = data?.filter(c => c.status === 'active').length || 0;
      const total = data?.length || 0;

      return { active, total };
    }
  });

  // Mock channel data (will be populated from mcc_channel_metrics)
  const channelData = [
    { name: 'Google Ads', leads: 450, spend: 520, color: 'bg-chart-1' },
    { name: 'Meta Ads', leads: 280, spend: 380, color: 'bg-chart-2' },
    { name: 'Organic', leads: 320, spend: 0, color: 'bg-chart-3' },
    { name: 'Email', leads: 120, spend: 45, color: 'bg-chart-4' },
    { name: 'WhatsApp', leads: 77, spend: 20, color: 'bg-chart-5' },
  ];

  // Mock AI insights
  const aiInsights = [
    {
      type: 'warning',
      title: isRu ? 'Высокий отток на этапе регистрации' : 'High drop-off at signup',
      description: isRu ? '35% пользователей уходят на форме регистрации' : '35% of users drop off at signup form',
      action: isRu ? 'Упростить форму' : 'Simplify form'
    },
    {
      type: 'insight',
      title: isRu ? 'WhatsApp показывает лучший ROI' : 'WhatsApp shows best ROI',
      description: isRu ? '3.2x ROAS против 2.1x в среднем' : '3.2x ROAS vs 2.1x average',
      action: isRu ? 'Увеличить бюджет' : 'Increase budget'
    },
    {
      type: 'opportunity',
      title: isRu ? '127 горячих лидов без контакта' : '127 hot leads without contact',
      description: isRu ? 'Средний возраст: 2 дня' : 'Average age: 2 days',
      action: isRu ? 'Запустить nurture' : 'Start nurture'
    }
  ];

  // Mock recent leads
  const recentLeads = [
    { name: 'John D.', priority: 'hot', time: '5 min', source: 'Google' },
    { name: 'Maria S.', priority: 'warm', time: '12 min', source: 'Meta' },
    { name: 'Alex K.', priority: 'cold', time: '1 hr', source: 'Organic' },
    { name: 'Elena P.', priority: 'hot', time: '2 hr', source: 'WhatsApp' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'bg-destructive text-destructive-foreground';
      case 'warm': return 'bg-warning text-warning-foreground';
      case 'cold': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title={isRu ? 'Всего лидов' : 'Total Leads'}
          value={leadStats?.total || 0}
          change={12}
          changeLabel={isRu ? 'за неделю' : 'this week'}
          icon={Users}
          trend="up"
        />
        <KPICard
          title="CAC"
          value="$12.50"
          change={-8}
          changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
          icon={DollarSign}
          trend="up"
        />
        <KPICard
          title={isRu ? 'Конверсия' : 'Conversion'}
          value={`${leadStats?.conversionRate || 0}%`}
          change={0.3}
          icon={TrendingUp}
          trend="up"
        />
        <KPICard
          title="ROAS"
          value="3.8x"
          change={0.5}
          icon={Target}
          trend="up"
        />
        <KPICard
          title={isRu ? 'Активные кампании' : 'Active Campaigns'}
          value={campaignStats?.active || 0}
          icon={Megaphone}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isRu ? 'Воронка привлечения' : 'Acquisition Funnel'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { stage: isRu ? 'Показы' : 'Impressions', value: '45,000', width: '100%' },
                { stage: isRu ? 'Клики' : 'Clicks', value: '3,200', width: '71%' },
                { stage: isRu ? 'Лиды' : 'Leads', value: '1,247', width: '39%' },
                { stage: isRu ? 'Регистрации' : 'Signups', value: '892', width: '28%' },
                { stage: isRu ? 'Активные' : 'Active', value: '654', width: '20%' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{item.stage}</div>
                  <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-chart-1 flex items-center justify-end px-2"
                      style={{ width: item.width }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Эффективность каналов' : 'Channel Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channelData.map((channel, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${channel.color}`} />
                  <span className="text-sm">{channel.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{channel.leads} leads</span>
                  <span className="text-xs text-muted-foreground">
                    {channel.spend > 0 ? `$${channel.spend}` : 'Free'}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2">
              {isRu ? 'Подробнее' : 'View Details'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isRu ? 'AI Инсайты' : 'AI Insights'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-start gap-2">
                  {insight.type === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="w-full">
                  {insight.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Последние лиды' : 'Recent Leads'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLeads.map((lead, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(lead.priority)} variant="secondary">
                    {lead.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{lead.time}</span>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2">
              {isRu ? 'Все лиды' : 'View All Leads'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
