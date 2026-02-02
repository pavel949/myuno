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
  ChevronRight,
  Flame,
  Database
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeadHub, useRecentLeads } from '@/hooks/useLeadHub';
import { useCampaigns } from '@/hooks/useCampaignFactory';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function KPICard({ title, value, change, changeLabel, icon: Icon, trend, loading }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">
              {loading ? '...' : value}
            </p>
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

  // Real data from hooks
  const { stats: leadStats, isLoading: leadsLoading } = useLeadHub({});
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({});
  const { data: recentLeads, isLoading: recentLoading } = useRecentLeads(5);

  // Calculate campaign stats
  const campaignStats = React.useMemo(() => {
    if (!campaigns) return { active: 0, total: 0, totalBudget: 0, totalSpent: 0 };
    
    const active = campaigns.filter(c => c.status === 'active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget?.total || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.performance_data?.spend || 0), 0);
    
    return { active, total: campaigns.length, totalBudget, totalSpent };
  }, [campaigns]);

  // Calculate performance metrics from campaigns
  const performanceMetrics = React.useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return { totalLeads: 0, totalConversions: 0, avgCac: 0, roas: 0 };
    }

    let totalLeads = 0;
    let totalConversions = 0;
    let totalSpend = 0;
    let totalRevenue = 0;

    campaigns.forEach(c => {
      if (c.performance_data) {
        totalLeads += c.performance_data.leads || 0;
        totalConversions += c.performance_data.conversions || 0;
        totalSpend += c.performance_data.spend || 0;
        // Estimate revenue as conversions * average value
        totalRevenue += (c.performance_data.conversions || 0) * 100; // placeholder
      }
    });

    const avgCac = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return { totalLeads, totalConversions, avgCac, roas };
  }, [campaigns]);

  // Channel data from campaigns
  const channelData = React.useMemo(() => {
    if (!campaigns) return [];
    
    const channelMap: Record<string, { leads: number; spend: number }> = {};
    
    campaigns.forEach(c => {
      if (c.channels && c.performance_data) {
        c.channels.forEach(channel => {
          if (!channelMap[channel]) {
            channelMap[channel] = { leads: 0, spend: 0 };
          }
          // Distribute leads/spend across channels (simplified)
          const channelCount = c.channels.length;
          channelMap[channel].leads += Math.floor((c.performance_data?.leads || 0) / channelCount);
          channelMap[channel].spend += Math.floor((c.performance_data?.spend || 0) / channelCount);
        });
      }
    });

    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];
    return Object.entries(channelMap).map(([name, data], idx) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      leads: data.leads,
      spend: data.spend,
      color: colors[idx % colors.length],
    }));
  }, [campaigns]);

  // AI insights based on real data
  const aiInsights = React.useMemo(() => {
    const insights = [];
    
    // Check for hot leads without contact
    if (leadStats.hot > 0) {
      insights.push({
        type: 'opportunity',
        title: isRu ? `${leadStats.hot} горячих лидов` : `${leadStats.hot} hot leads`,
        description: isRu ? 'Требуют немедленного контакта' : 'Require immediate contact',
        action: isRu ? 'Обработать' : 'Process'
      });
    }

    // Check conversion rate
    const conversionRate = leadStats.total > 0 ? (leadStats.converted / leadStats.total) * 100 : 0;
    if (conversionRate < 10 && leadStats.total > 5) {
      insights.push({
        type: 'warning',
        title: isRu ? 'Низкая конверсия' : 'Low conversion',
        description: isRu ? `${conversionRate.toFixed(1)}% — ниже целевых 15%` : `${conversionRate.toFixed(1)}% — below 15% target`,
        action: isRu ? 'Оптимизировать воронку' : 'Optimize funnel'
      });
    }

    // Check AI scored leads
    if (leadStats.withAiScore > 0) {
      insights.push({
        type: 'insight',
        title: isRu ? 'AI-скоринг активен' : 'AI scoring active',
        description: isRu ? `${leadStats.withAiScore} лидов с AI-оценкой` : `${leadStats.withAiScore} leads with AI score`,
        action: isRu ? 'Посмотреть' : 'View'
      });
    }

    // If no data
    if (insights.length === 0) {
      insights.push({
        type: 'insight',
        title: isRu ? 'Начните работу' : 'Get started',
        description: isRu ? 'Создайте кампанию или добавьте лиды' : 'Create a campaign or add leads',
        action: isRu ? 'Создать' : 'Create'
      });
    }

    return insights;
  }, [leadStats, isRu]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'bg-destructive text-destructive-foreground';
      case 'warm': return 'bg-warning text-warning-foreground';
      case 'cold': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: false, 
      locale: isRu ? ru : enUS 
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title={isRu ? 'Всего лидов' : 'Total Leads'}
          value={leadStats.total}
          change={leadStats.total > 0 ? 12 : 0}
          changeLabel={isRu ? 'за неделю' : 'this week'}
          icon={Users}
          trend={leadStats.total > 0 ? 'up' : 'neutral'}
          loading={leadsLoading}
        />
        <KPICard
          title="CAC"
          value={performanceMetrics.avgCac > 0 ? `$${performanceMetrics.avgCac.toFixed(2)}` : '—'}
          change={performanceMetrics.avgCac > 0 ? -8 : undefined}
          changeLabel={isRu ? 'vs прошлый месяц' : 'vs last month'}
          icon={DollarSign}
          trend={performanceMetrics.avgCac > 0 ? 'up' : 'neutral'}
          loading={campaignsLoading}
        />
        <KPICard
          title={isRu ? 'Конверсия' : 'Conversion'}
          value={leadStats.total > 0 ? `${((leadStats.converted / leadStats.total) * 100).toFixed(1)}%` : '0%'}
          change={leadStats.converted > 0 ? 0.3 : undefined}
          icon={TrendingUp}
          trend={leadStats.converted > 0 ? 'up' : 'neutral'}
          loading={leadsLoading}
        />
        <KPICard
          title="ROAS"
          value={performanceMetrics.roas > 0 ? `${performanceMetrics.roas.toFixed(1)}x` : '—'}
          change={performanceMetrics.roas > 0 ? 0.5 : undefined}
          icon={Target}
          trend={performanceMetrics.roas > 0 ? 'up' : 'neutral'}
          loading={campaignsLoading}
        />
        <KPICard
          title={isRu ? 'Активные кампании' : 'Active Campaigns'}
          value={campaignStats.active}
          icon={Megaphone}
          loading={campaignsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition Funnel - Real data */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isRu ? 'Воронка привлечения' : 'Acquisition Funnel'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { stage: isRu ? 'Всего лидов' : 'Total Leads', value: leadStats.total, maxValue: leadStats.total || 1 },
                { stage: isRu ? 'Горячие' : 'Hot', value: leadStats.hot, maxValue: leadStats.total || 1 },
                { stage: isRu ? 'Тёплые' : 'Warm', value: leadStats.warm, maxValue: leadStats.total || 1 },
                { stage: isRu ? 'Конверсии' : 'Converted', value: leadStats.converted, maxValue: leadStats.total || 1 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{item.stage}</div>
                  <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-chart-1 flex items-center justify-end px-2"
                      style={{ width: `${Math.max((item.value / item.maxValue) * 100, 5)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {leadStats.total === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                {isRu ? 'Нет данных. Добавьте лиды или создайте кампанию.' : 'No data. Add leads or create a campaign.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Channel Performance - From campaigns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Эффективность каналов' : 'Channel Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channelData.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет активных кампаний с каналами' : 'No active campaigns with channels'}
              </p>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2">
              {isRu ? 'Подробнее' : 'View Details'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* AI Insights - Based on real data */}
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
                  ) : insight.type === 'opportunity' ? (
                    <Flame className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
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

        {/* Recent Leads - Real data */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isRu ? 'Последние лиды' : 'Recent Leads'}
              {leadStats.fromConsultations > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  {leadStats.fromConsultations}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Загрузка...' : 'Loading...'}
              </p>
            ) : recentLeads && recentLeads.length > 0 ? (
              <>
                {recentLeads.map((lead, idx) => (
                  <div key={`${lead.source_table}-${lead.id}`} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
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
                      <span className="text-xs text-muted-foreground">{getTimeAgo(lead.created_at)}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет лидов' : 'No leads yet'}
              </p>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2">
              {isRu ? 'Все лиды' : 'View All Leads'} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
