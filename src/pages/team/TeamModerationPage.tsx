import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck, Eye, ThumbsUp, ThumbsDown, MessageSquare, Image,
  Star, Clock, CheckCircle2, XCircle, FileText, Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamModerationPage, fetchTeamModerationCounts, reviewTeamModerationItem, TEAM_MODERATION_PAGE_SIZE, type TeamReviewStatus } from '@/lib/teamModeration';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  review: { icon: Star, color: 'bg-warning/10 text-warning', labelEn: 'Review', labelRu: 'Отзыв' },
  photo: { icon: Image, color: 'bg-info/10 text-info', labelEn: 'Photos', labelRu: 'Фото' },
  listing: { icon: FileText, color: 'bg-success/10 text-success', labelEn: 'Listing', labelRu: 'Листинг' },
  comment: { icon: MessageSquare, color: 'bg-accent-purple/10 text-accent-purple', labelEn: 'Comment', labelRu: 'Комментарий' },
};

interface ModerationItem {
  id: string;
  item_type: string;
  title: string;
  content: string | null;
  rating: number | null;
  photo_count: number | null;
  category: string | null;
  submitted_by_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function TeamModerationPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  const [activeTab, setActiveTab] = useState<TeamReviewStatus>('pending');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['moderation-queue', 'team', user?.id, activeTab, page], enabled: !!user,
    queryFn: () => fetchTeamModerationPage(activeTab, page),
  });
  const { data: counts, isError: countsError } = useQuery({ queryKey: ['moderation-queue', 'team-counts', user?.id], queryFn: fetchTeamModerationCounts, enabled: !!user });
  const items = (data?.items ?? []) as ModerationItem[];
  const updateStatus = useMutation({
    mutationFn: reviewTeamModerationItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success(isRu ? 'Статус обновлён' : 'Status updated');
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.error(isRu ? 'Ошибка обновления' : 'Update failed');
    },
  });

  const filteredItems = items;
  const pendingCount = countsError ? null : counts?.pending ?? null;
  const approvedCount = countsError ? null : counts?.approved ?? null;
  const rejectedCount = countsError ? null : counts?.rejected ?? null;

  return (
    <TeamLayout title={isRu ? 'Модерация' : 'Moderation'}>
      <div className="py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              {isRu ? 'Модерация контента' : 'Content Moderation'}
            </h1>
            <p className="text-muted-foreground">
              {isRu ? 'Проверка и одобрение пользовательского контента' : 'Review and approve user-generated content'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center bg-warning/10 border-warning/30">
            <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-bold">{pendingCount ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Ожидают' : 'Pending'}</p>
          </Card>
          <Card className="p-3 text-center bg-success/10 border-success/30">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-xl font-bold">{approvedCount ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Одобрено' : 'Approved'}</p>
          </Card>
          <Card className="p-3 text-center bg-destructive/10 border-destructive/30">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-xl font-bold">{rejectedCount ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Отклонено' : 'Rejected'}</p>
          </Card>
        </div>

        <nav className="flex items-center gap-3" aria-label="Review pages">
          <Button variant="outline" disabled={page === 0 || isFetching} onClick={() => setPage(value => value - 1)}>{isRu ? 'Назад' : 'Previous'}</Button>
          <span>{page + 1} · {isError ? '—' : data?.total ?? '—'}</span>
          <Button variant="outline" disabled={isFetching || !data || (page + 1) * TEAM_MODERATION_PAGE_SIZE >= data.total} onClick={() => setPage(value => value + 1)}>{isRu ? 'Далее' : 'Next'}</Button>
        </nav>
        <Tabs value={activeTab} onValueChange={value => { setActiveTab(value as TeamReviewStatus); setPage(0); }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              {isRu ? 'На проверке' : 'Pending'}
              {(pendingCount ?? 0) > 0 && <Badge variant="secondary">{pendingCount ?? '—'}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved">{isRu ? 'Одобрено' : 'Approved'}</TabsTrigger>
            <TabsTrigger value="rejected">{isRu ? 'Отклонено' : 'Rejected'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                    </div>
                  ) : isError ? <div role="alert" className="p-4"><p>{isRu ? 'Не удалось загрузить очередь. Количество неизвестно.' : 'Could not load the queue. Count unavailable.'}</p><Button onClick={() => void refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div> : filteredItems.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">{isRu ? 'Очередь пуста' : 'Queue is empty'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredItems.map(item => {
                        const config = TYPE_CONFIG[item.item_type as keyof typeof TYPE_CONFIG];
                        const Icon = config?.icon || FileText;
                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-none shrink-0", config?.color)}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium truncate">{item.title}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {isRu ? config?.labelRu : config?.labelEn}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.submitted_by_name || (isRu ? 'Аноним' : 'Anonymous')} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: dateLocale })}
                                </p>
                                {item.item_type === 'review' && item.content && (
                                  <div className="p-2 bg-muted/50 rounded-none text-sm mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={cn("h-3 w-3", i < (item.rating || 0) ? "text-warning fill-warning" : "text-muted")} />
                                      ))}
                                    </div>
                                    "{item.content}"
                                  </div>
                                )}
                                {item.status === 'pending' && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm" variant="outline"
                                      className="h-7 text-xs gap-1 text-success hover:bg-success/10"
                                      onClick={() => updateStatus.mutate({ id: item.id, status: 'approved', expectedUpdatedAt: item.updated_at })}
                                      disabled={updateStatus.isPending || isFetching || !item.updated_at}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                      {isRu ? 'Одобрить' : 'Approve'}
                                    </Button>
                                    <Button
                                      size="sm" variant="outline"
                                      className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                                      onClick={() => updateStatus.mutate({ id: item.id, status: 'rejected', expectedUpdatedAt: item.updated_at })}
                                      disabled={updateStatus.isPending || isFetching || !item.updated_at}
                                    >
                                      <ThumbsDown className="h-3 w-3" />
                                      {isRu ? 'Отклонить' : 'Reject'}
                                    </Button>
                                  </div>
                                )}
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
