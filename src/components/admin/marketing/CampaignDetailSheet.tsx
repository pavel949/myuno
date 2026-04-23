import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Pencil, Copy, CheckCircle, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import type { Campaign, CampaignStatus } from '@/types/marketing';
import { GOAL_LABELS, SEGMENT_LABELS, CHANNEL_LABELS, CURRENCY_SYMBOLS, STATUS_LABELS } from '@/types/marketing';

interface CampaignDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onEdit: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
  onComplete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/20 text-info',
  active: 'bg-success/20 text-success',
  paused: 'bg-warning/20 text-warning',
  completed: 'bg-secondary text-secondary-foreground',
};

export function CampaignDetailSheet({
  open,
  onOpenChange,
  campaign,
  onEdit,
  onToggleStatus,
  onComplete,
  onDuplicate,
}: CampaignDetailSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!campaign) return null;

  const budget = campaign.budget;
  const performance = campaign.performance_data;
  const schedule = campaign.schedule;
  const kpiTargets = campaign.kpi_targets;
  
  const spend = performance?.spend || 0;
  const budgetTotal = budget?.total || 0;
  const budgetProgress = budgetTotal > 0 ? Math.min((spend / budgetTotal) * 100, 100) : 0;
  const currencySymbol = budget?.currency ? CURRENCY_SYMBOLS[budget.currency] : '$';

  const leads = performance?.leads || 0;
  const conversions = performance?.conversions || 0;
  const cvr = leads > 0 ? ((conversions / leads) * 100).toFixed(1) : '0';
  const cac = conversions > 0 ? (spend / conversions).toFixed(2) : '0';

  const canEdit = campaign.status === 'draft' || campaign.status === 'paused';
  const canToggle = campaign.status === 'active' || campaign.status === 'paused';
  const canComplete = campaign.status === 'active' || campaign.status === 'paused';

  const goalLabel = GOAL_LABELS[campaign.goal];
  const segmentLabel = campaign.target_segment ? SEGMENT_LABELS[campaign.target_segment] : null;
  const statusLabel = STATUS_LABELS[campaign.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{campaign.name}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            <Badge className={STATUS_STYLES[campaign.status]} variant="secondary">
              {isRu ? statusLabel.ru : statusLabel.en}
            </Badge>
            <Badge variant="outline">
              {isRu ? goalLabel.ru : goalLabel.en}
            </Badge>
            {segmentLabel && (
              <Badge variant="outline">
                {isRu ? segmentLabel.ru : segmentLabel.en}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="metrics">{isRu ? 'Метрики' : 'Metrics'}</TabsTrigger>
            <TabsTrigger value="details">{isRu ? 'Детали' : 'Details'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{leads}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Лиды' : 'Leads'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{conversions}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Конверсии' : 'Conversions'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{currencySymbol}{spend}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Расход' : 'Spent'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{cvr}%</p>
                  <p className="text-xs text-muted-foreground">CVR</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Progress */}
            {budgetTotal > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{isRu ? 'Прогресс бюджета' : 'Budget Progress'}</h4>
                    <span className="text-sm text-muted-foreground">
                      {currencySymbol}{spend} / {currencySymbol}{budgetTotal} ({budgetProgress.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={budgetProgress} className="h-3" />
                  {budget?.daily_cap && (
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Дневной лимит' : 'Daily cap'}: {currencySymbol}{budget.daily_cap}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Channels Performance */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4">{isRu ? 'Каналы' : 'Channels'}</h4>
                <div className="space-y-3">
                  {campaign.channels.map((channel) => {
                    const channelLabel = CHANNEL_LABELS[channel];
                    return (
                      <div key={channel} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {isRu ? channelLabel?.ru : channelLabel?.en}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {campaign.status === 'active' && (
                              <Badge variant="success" className="text-xs">● Live</Badge>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            {/* KPI Targets vs Actual */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4">{isRu ? 'KPI: План vs Факт' : 'KPI: Target vs Actual'}</h4>
                <div className="space-y-4">
                  {kpiTargets?.target_leads && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isRu ? 'Лиды' : 'Leads'}</span>
                        <span>{leads} / {kpiTargets.target_leads}</span>
                      </div>
                      <Progress 
                        value={Math.min((leads / kpiTargets.target_leads) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                  {kpiTargets?.target_conversions && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isRu ? 'Конверсии' : 'Conversions'}</span>
                        <span>{conversions} / {kpiTargets.target_conversions}</span>
                      </div>
                      <Progress 
                        value={Math.min((conversions / kpiTargets.target_conversions) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                  {kpiTargets?.target_cac && (
                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm">{isRu ? 'Целевой CAC' : 'Target CAC'}</span>
                      <span className={`font-medium ${parseFloat(cac) <= kpiTargets.target_cac ? 'text-success' : 'text-warning'}`}>
                        {currencySymbol}{cac} / {currencySymbol}{kpiTargets.target_cac}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-4">{isRu ? 'Дополнительные метрики' : 'Additional Metrics'}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-none">
                    <p className="text-2xl font-bold">{performance?.impressions || 0}</p>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Показы' : 'Impressions'}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-none">
                    <p className="text-2xl font-bold">{performance?.clicks || 0}</p>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Клики' : 'Clicks'}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-none">
                    <p className="text-2xl font-bold">{performance?.ctr?.toFixed(2) || 0}%</p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-none">
                    <p className="text-2xl font-bold">{currencySymbol}{cac}</p>
                    <p className="text-xs text-muted-foreground">CAC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Campaign Info */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <h4 className="font-medium">{isRu ? 'Информация о кампании' : 'Campaign Information'}</h4>
                
                {campaign.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{isRu ? 'Описание' : 'Description'}</p>
                    <p className="text-sm">{campaign.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">{isRu ? 'Создана' : 'Created'}</p>
                    <p>{format(new Date(campaign.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">{isRu ? 'Обновлена' : 'Updated'}</p>
                    <p>{format(new Date(campaign.updated_at), 'PPP')}</p>
                  </div>
                  {schedule?.start_date && (
                    <div>
                      <p className="text-muted-foreground mb-1">{isRu ? 'Старт' : 'Start Date'}</p>
                      <p>{format(new Date(schedule.start_date), 'PPP')}</p>
                    </div>
                  )}
                  {schedule?.end_date && (
                    <div>
                      <p className="text-muted-foreground mb-1">{isRu ? 'Окончание' : 'End Date'}</p>
                      <p>{format(new Date(schedule.end_date), 'PPP')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6 flex-wrap gap-2">
          {canToggle && (
            <Button
              variant={campaign.status === 'active' ? 'secondary' : 'default'}
              onClick={() => onToggleStatus(campaign)}
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  {isRu ? 'Пауза' : 'Pause'}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {isRu ? 'Возобновить' : 'Resume'}
                </>
              )}
            </Button>
          )}
          {canComplete && (
            <Button variant="outline" onClick={() => onComplete(campaign.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isRu ? 'Завершить' : 'Complete'}
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => onEdit(campaign)}>
              <Pencil className="h-4 w-4 mr-2" />
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onDuplicate(campaign.id)}>
            <Copy className="h-4 w-4 mr-2" />
            {isRu ? 'Дублировать' : 'Duplicate'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
