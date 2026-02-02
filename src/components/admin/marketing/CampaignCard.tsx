import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Pause, MoreHorizontal, Pencil, Copy, Trash2, CheckCircle, Eye } from 'lucide-react';
import type { Campaign, CampaignStatus } from '@/types/marketing';
import { GOAL_LABELS, CHANNEL_LABELS, CURRENCY_SYMBOLS } from '@/types/marketing';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onView: (campaign: Campaign) => void;
  onToggleStatus: (campaign: Campaign) => void;
  onLaunch: (id: string) => void;
  onComplete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/20 text-info',
  active: 'bg-success/20 text-success',
  paused: 'bg-warning/20 text-warning',
  completed: 'bg-secondary text-secondary-foreground',
};

export function CampaignCard({
  campaign,
  onEdit,
  onView,
  onToggleStatus,
  onLaunch,
  onComplete,
  onDuplicate,
  onDelete,
}: CampaignCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const budget = campaign.budget;
  const performance = campaign.performance_data;
  const spend = performance?.spend || 0;
  const budgetTotal = budget?.total || 0;
  const budgetProgress = budgetTotal > 0 ? Math.min((spend / budgetTotal) * 100, 100) : 0;
  const currencySymbol = budget?.currency ? CURRENCY_SYMBOLS[budget.currency] : '$';

  const goalLabel = GOAL_LABELS[campaign.goal];

  const canEdit = campaign.status === 'draft' || campaign.status === 'paused';
  const canDelete = campaign.status === 'draft';
  const canLaunch = campaign.status === 'draft';
  const canToggle = campaign.status === 'active' || campaign.status === 'paused';
  const canComplete = campaign.status === 'active' || campaign.status === 'paused';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-base truncate pr-2">{campaign.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_STYLES[campaign.status]} variant="secondary">
                {campaign.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {isRu ? goalLabel.ru : goalLabel.en}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(campaign)}>
                <Eye className="h-4 w-4 mr-2" />
                {isRu ? 'Просмотр' : 'View Details'}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {isRu ? 'Редактировать' : 'Edit'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(campaign.id)}>
                <Copy className="h-4 w-4 mr-2" />
                {isRu ? 'Дублировать' : 'Duplicate'}
              </DropdownMenuItem>
              {canComplete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onComplete(campaign.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isRu ? 'Завершить' : 'Complete'}
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(campaign.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isRu ? 'Удалить' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channels */}
        <div className="flex flex-wrap gap-1">
          {campaign.channels.map((channel) => (
            <Badge key={channel} variant="outline" className="text-xs capitalize">
              {isRu ? CHANNEL_LABELS[channel]?.ru : CHANNEL_LABELS[channel]?.en}
            </Badge>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{performance?.leads ?? 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Лиды' : 'Leads'}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{performance?.conversions ?? 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Конверсии' : 'Conversions'}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{currencySymbol}{spend}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Расход' : 'Spent'}</p>
          </div>
        </div>

        {/* Budget Progress */}
        {budgetTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isRu ? 'Бюджет' : 'Budget'}</span>
              <span>{currencySymbol}{spend} / {currencySymbol}{budgetTotal}</span>
            </div>
            <Progress value={budgetProgress} className="h-2" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canLaunch && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onLaunch(campaign.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              {isRu ? 'Запустить' : 'Launch'}
            </Button>
          )}
          {canToggle && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => onToggleStatus(campaign)}
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  {isRu ? 'Пауза' : 'Pause'}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  {isRu ? 'Возобновить' : 'Resume'}
                </>
              )}
            </Button>
          )}
          {campaign.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDuplicate(campaign.id)}
            >
              <Copy className="h-4 w-4 mr-1" />
              {isRu ? 'Дублировать' : 'Duplicate'}
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(campaign)}
            >
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
