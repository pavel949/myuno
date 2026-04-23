import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { useTeamMember } from '@/hooks/useTeamMember';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Inbox, CheckCircle2, Clock, AlertTriangle, User,
  MessageCircle, FileText, Eye, Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface InboxTask {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  priority: string;
  time: Date;
}

const TASK_TYPE_CONFIG = {
  lead: { icon: User, color: 'bg-info/10 text-info', labelEn: 'Lead', labelRu: 'Лид' },
  ticket: { icon: MessageCircle, color: 'bg-accent-purple/10 text-accent-purple', labelEn: 'Ticket', labelRu: 'Тикет' },
  moderation: { icon: Eye, color: 'bg-warning/10 text-warning', labelEn: 'Moderation', labelRu: 'Модерация' },
  content: { icon: FileText, color: 'bg-success/10 text-success', labelEn: 'Content', labelRu: 'Контент' },
};

const PRIORITY_CONFIG = {
  high: { color: 'border-destructive/30 bg-destructive/5', labelEn: 'Urgent', labelRu: 'Срочно' },
  medium: { color: 'border-warning/30 bg-warning/5', labelEn: 'Medium', labelRu: 'Средний' },
  low: { color: '', labelEn: 'Normal', labelRu: 'Обычный' },
};

function useInboxTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['team-inbox', user?.id],
    queryFn: async (): Promise<InboxTask[]> => {
      if (!user?.id) return [];

      // Fetch unread notifications as inbox items
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!notifications?.length) return [];

      return notifications.map(n => ({
        id: n.id,
        type: mapNotificationType(n.type),
        title: n.title,
        subtitle: n.body,
        priority: n.is_read ? 'low' : 'medium',
        time: new Date(n.created_at),
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

function mapNotificationType(type: string): string {
  if (type.includes('lead') || type.includes('inquiry')) return 'lead';
  if (type.includes('ticket') || type.includes('support')) return 'ticket';
  if (type.includes('moderation') || type.includes('review')) return 'moderation';
  if (type.includes('content')) return 'content';
  return 'ticket';
}

export default function TeamInboxPage() {
  const { language } = useLanguage();
  const { hasSpecialization, isTeamLead } = useTeamMember();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  const [activeTab, setActiveTab] = useState('all');

  const { data: tasks = [], isLoading } = useInboxTasks();

  // Filter tasks based on user specialization
  const filteredTasks = tasks.filter(task => {
    if (isTeamLead) return true;
    if (task.type === 'lead' && hasSpecialization('sales_manager')) return true;
    if (task.type === 'ticket' && hasSpecialization('support_operator')) return true;
    if (task.type === 'moderation' && hasSpecialization('moderation_officer')) return true;
    if (task.type === 'content' && hasSpecialization('content_manager')) return true;
    return false;
  });

  const urgentCount = filteredTasks.filter(t => t.priority === 'high').length;
  const pendingCount = filteredTasks.length;

  return (
    <TeamLayout title={isRu ? 'Входящие' : 'Inbox'}>
      <div className="py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Inbox className="h-6 w-6 text-primary" />
              {isRu ? 'Входящие задачи' : 'Unified Inbox'}
            </h1>
            <p className="text-muted-foreground">
              {isRu ? 'Все ваши задачи в одном месте' : 'All your tasks in one place'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {urgentCount} {isRu ? 'срочных' : 'urgent'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <Inbox className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</p>
          </Card>
          <Card className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-xl font-bold">{urgentCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Срочных' : 'Urgent'}</p>
          </Card>
          <Card className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Сегодня' : 'Today'}</p>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
            <TabsTrigger value="leads">{isRu ? 'Лиды' : 'Leads'}</TabsTrigger>
            <TabsTrigger value="tickets">{isRu ? 'Тикеты' : 'Tickets'}</TabsTrigger>
            <TabsTrigger value="moderation">{isRu ? 'Модерация' : 'Moderation'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-none" />
                      ))}
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">{isRu ? 'Всё чисто!' : 'All clear!'}</p>
                      <p className="text-sm">{isRu ? 'Нет задач для обработки' : 'No tasks to process'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredTasks
                        .filter(task => activeTab === 'all' || 
                          (activeTab === 'leads' && task.type === 'lead') ||
                          (activeTab === 'tickets' && task.type === 'ticket') ||
                          (activeTab === 'moderation' && task.type === 'moderation'))
                        .map(task => {
                          const config = TASK_TYPE_CONFIG[task.type as keyof typeof TASK_TYPE_CONFIG];
                          const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                          const Icon = config?.icon || FileText;
                          
                          return (
                            <div 
                              key={task.id}
                              className={cn(
                                "p-4 hover:bg-muted/30 cursor-pointer transition-colors",
                                priorityConfig?.color
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-none shrink-0",
                                  config?.color
                                )}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium truncate">{task.title}</span>
                                    {task.priority === 'high' && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                        !
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {task.subtitle}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(task.time, { addSuffix: true, locale: dateLocale })}
                                  </p>
                                  <Badge variant="outline" className="text-[10px] mt-1">
                                    {isRu ? config?.labelRu : config?.labelEn}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeamLayout>
  );
}
