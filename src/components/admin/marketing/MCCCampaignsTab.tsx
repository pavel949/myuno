import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, MoreHorizontal, Target, Users, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MCCCampaignsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['mcc-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcc_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success';
      case 'paused': return 'bg-warning/20 text-warning';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'completed': return 'bg-info/20 text-info';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'acquisition': return Users;
      case 'awareness': return Target;
      default: return Target;
    }
  };

  // Mock campaigns for demo
  const mockCampaigns = [
    {
      id: '1',
      name: 'Summer Phuket Launch 2026',
      goal: 'acquisition',
      status: 'active',
      budget: { total: 5000, currency: 'USD' },
      channels: ['google', 'meta', 'tiktok'],
      leads: 892,
      conversions: 127,
      spend: 2340,
    },
    {
      id: '2',
      name: 'Beach Villa Retargeting',
      goal: 'activation',
      status: 'active',
      budget: { total: 1500, currency: 'USD' },
      channels: ['meta', 'email'],
      leads: 234,
      conversions: 45,
      spend: 890,
    },
    {
      id: '3',
      name: 'Expat Community Outreach',
      goal: 'awareness',
      status: 'paused',
      budget: { total: 800, currency: 'USD' },
      channels: ['telegram', 'whatsapp'],
      leads: 156,
      conversions: 23,
      spend: 420,
    },
    {
      id: '4',
      name: 'New User Onboarding Flow',
      goal: 'activation',
      status: 'draft',
      budget: { total: 0, currency: 'USD' },
      channels: ['email', 'push'],
      leads: 0,
      conversions: 0,
      spend: 0,
    },
  ];

  const displayCampaigns = campaigns?.length ? campaigns : mockCampaigns;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Кампании' : 'Campaigns'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Управляйте маркетинговыми кампаниями' : 'Manage your marketing campaigns'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Новая кампания' : 'New Campaign'}
        </Button>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayCampaigns.map((campaign: any) => {
          const GoalIcon = getGoalIcon(campaign.goal);
          const budget = typeof campaign.budget === 'object' ? campaign.budget : { total: 0, currency: 'USD' };
          
          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)} variant="secondary">
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <GoalIcon className="h-3 w-3" />
                        {campaign.goal}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channels */}
                <div className="flex flex-wrap gap-1">
                  {(campaign.channels || []).map((channel: string) => (
                    <Badge key={channel} variant="outline" className="text-xs capitalize">
                      {channel}
                    </Badge>
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold">{campaign.leads || 0}</p>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Лиды' : 'Leads'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{campaign.conversions || 0}</p>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Конверсии' : 'Conversions'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">${campaign.spend || 0}</p>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Расход' : 'Spent'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {campaign.status === 'active' ? (
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Pause className="h-4 w-4 mr-1" />
                      {isRu ? 'Пауза' : 'Pause'}
                    </Button>
                  ) : campaign.status === 'paused' ? (
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      {isRu ? 'Запустить' : 'Resume'}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      {isRu ? 'Запустить' : 'Launch'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    {isRu ? 'Редактировать' : 'Edit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {!displayCampaigns.length && !isLoading && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">
            {isRu ? 'Нет кампаний' : 'No campaigns yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Создайте первую маркетинговую кампанию' : 'Create your first marketing campaign'}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Создать кампанию' : 'Create Campaign'}
          </Button>
        </Card>
      )}
    </div>
  );
}
