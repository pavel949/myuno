import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmPipelines } from '@/hooks/useCrmPipelines';
import { useCrmContacts } from '@/hooks/useCrmContacts';
import { useCrmTasks, useTodayTasksCount } from '@/hooks/useCrmTasks';
import { useAgentDeals, DEAL_STAGE_LABELS, type DealStage } from '@/hooks/useAgentDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Target, Users, ListTodo, Mail, ChevronRight,
  AlertTriangle, CheckCircle, Plus, ContactRound, BarChart3,
} from 'lucide-react';
import { isToday, isPast, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CrmDashboardPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  // Data
  const { data: pipelines = [] } = useCrmPipelines(companyId);
  const { data: contactsResult } = useCrmContacts(companyId, 0, 1);
  const { data: todayCount = 0 } = useTodayTasksCount();
  const { data: overdueTasks } = useCrmTasks({ status: 'pending' });
  const { data: dealsResult } = useAgentDeals(companyId);

  const totalContacts = contactsResult?.count || 0;
  const deals = dealsResult?.data || [];
  const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  const wonDeals = deals.filter(d => d.stage === 'closed_won');

  const overdueCount = (overdueTasks || []).filter(
    t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  ).length;

  // Stage distribution for active deals
  const stageCounts: Partial<Record<DealStage, number>> = {};
  for (const d of activeDeals) {
    stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
  }

  const stats = [
    {
      labelEn: 'Contacts', labelRu: 'Контакты', value: totalContacts,
      icon: ContactRound, color: 'text-primary', path: '/owner/contacts',
    },
    {
      labelEn: 'Active Deals', labelRu: 'Активные сделки', value: activeDeals.length,
      icon: TrendingUp, color: 'text-success', path: '/owner/sales',
    },
    {
      labelEn: "Today's Tasks", labelRu: 'Задачи сегодня', value: todayCount,
      icon: ListTodo, color: 'text-warning', path: '/owner/tasks',
    },
    {
      labelEn: 'Overdue', labelRu: 'Просрочено', value: overdueCount,
      icon: AlertTriangle, color: 'text-destructive', path: '/owner/tasks',
    },
  ];

  const quickLinks = [
    { labelEn: 'New Contact', labelRu: 'Новый контакт', path: '/owner/contacts', icon: Plus },
    { labelEn: 'New Deal', labelRu: 'Новая сделка', path: '/owner/sales/new', icon: Plus },
    { labelEn: 'Duplicates', labelRu: 'Дубликаты', path: '/owner/duplicates', icon: Users },
    { labelEn: 'Web Forms', labelRu: 'Веб-формы', path: '/owner/forms', icon: Mail },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'CRM Обзор' : 'CRM Overview'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Продажи, контакты и задачи' : 'Sales, contacts, and tasks'}
          </p>
        </div>
        <div className="flex gap-2">
          {quickLinks.map(link => (
            <Button
              key={link.path + link.labelEn}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate(link.path)}
            >
              <link.icon className="h-3 w-3 mr-1" />
              {isRu ? link.labelRu : link.labelEn}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card
            key={stat.labelEn}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(stat.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon className={cn('h-4 w-4', stat.color)} />
                <span className="text-xs text-muted-foreground">{isRu ? stat.labelRu : stat.labelEn}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{isRu ? 'Воронка продаж' : 'Sales Funnel'}</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/owner/sales')}>
                {isRu ? 'Открыть' : 'Open'} <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>

            {activeDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRu ? 'Нет активных сделок' : 'No active deals'}
              </p>
            ) : (
              <div className="space-y-2">
                {(Object.entries(stageCounts) as [DealStage, number][]).map(([stage, count]) => {
                  const pct = Math.round((count / activeDeals.length) * 100);
                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{isRu ? DEAL_STAGE_LABELS[stage]?.ru : DEAL_STAGE_LABELS[stage]?.en}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {wonDeals.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">
                  {isRu ? `${wonDeals.length} закрытых сделок` : `${wonDeals.length} won deals`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-warning" />
                <h3 className="font-semibold text-sm">{isRu ? 'Срочные задачи' : 'Urgent Tasks'}</h3>
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{overdueCount}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/owner/tasks')}>
                {isRu ? 'Все' : 'All'} <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>

            {(() => {
              const urgent = (overdueTasks || [])
                .filter(t => t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date))))
                .slice(0, 5);

              if (urgent.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRu ? 'Нет срочных задач ✓' : 'No urgent tasks ✓'}
                  </p>
                );
              }

              return (
                <div className="space-y-1.5">
                  {urgent.map(task => {
                    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm cursor-pointer hover:bg-muted/80',
                          isOverdue ? 'bg-destructive/5' : 'bg-muted/50'
                        )}
                        onClick={() => navigate('/owner/tasks')}
                      >
                        <span className="flex-1 truncate">{task.title}</span>
                        {isOverdue && <Badge variant="destructive" className="text-[10px] px-1 py-0">!</Badge>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Pipelines Overview */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">{isRu ? 'Воронки' : 'Pipelines'}</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/owner/sales/settings')}>
              {isRu ? 'Настройки' : 'Settings'} <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          {pipelines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRu ? 'Нет воронок' : 'No pipelines'}
            </p>
          ) : (
            <div className="space-y-3">
              {pipelines.map(pipeline => (
                <div key={pipeline.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{isRu ? pipeline.name_ru : pipeline.name_en}</h4>
                    <Badge variant="outline" className="text-[10px]">{pipeline.pipeline_type}</Badge>
                    {pipeline.is_default && <Badge className="text-[10px]">Default</Badge>}
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {pipeline.stages.map(stage => (
                      <div key={stage.id} className="shrink-0 text-center py-1.5 px-2 rounded text-[10px] bg-muted border min-w-[60px]">
                        <span className="font-medium">{isRu ? stage.name_ru : stage.name_en}</span>
                        <span className="block text-muted-foreground">{stage.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
