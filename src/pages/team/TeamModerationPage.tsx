import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck, Eye, ThumbsUp, ThumbsDown, MessageSquare, Image,
  Star, Clock, CheckCircle2, XCircle, AlertTriangle, FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// TODO: Replace with DB query - moderation items should come from moderation_queue table
// Mock moderation queue for demo purposes
const MOCK_ITEMS = [
  { id: '1', type: 'review', title: 'Review for Villa Ocean View', user: 'John S.', rating: 4, content: 'Great place, amazing view!', time: new Date(Date.now() - 2 * 3600000) },
  { id: '2', type: 'photo', title: 'Property photos update', user: 'Maria G.', count: 5, time: new Date(Date.now() - 4 * 3600000) },
  { id: '3', type: 'listing', title: 'New restaurant listing', user: 'Alex J.', category: 'Restaurant', time: new Date(Date.now() - 6 * 3600000) },
  { id: '4', type: 'review', title: 'Review for Thai Cooking Class', user: 'Emily B.', rating: 5, content: 'Excellent experience!', time: new Date(Date.now() - 8 * 3600000) },
];

const TYPE_CONFIG = {
  review: { icon: Star, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', labelEn: 'Review', labelRu: 'Отзыв' },
  photo: { icon: Image, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', labelEn: 'Photos', labelRu: 'Фото' },
  listing: { icon: FileText, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', labelEn: 'Listing', labelRu: 'Листинг' },
  comment: { icon: MessageSquare, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', labelEn: 'Comment', labelRu: 'Комментарий' },
};

export default function TeamModerationPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  const [activeTab, setActiveTab] = useState('pending');

  const pendingCount = MOCK_ITEMS.length;

  return (
    <TeamLayout title={isRu ? 'Модерация' : 'Moderation'}>
      <div className="py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              {isRu ? 'Модерация контента' : 'Content Moderation'}
            </h1>
            <p className="text-muted-foreground">
              {isRu 
                ? 'Проверка и одобрение пользовательского контента' 
                : 'Review and approve user-generated content'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
            <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Ожидают' : 'Pending'}</p>
          </Card>
          <Card className="p-3 text-center bg-green-50 dark:bg-green-950/30 border-green-200">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold">24</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Одобрено' : 'Approved'}</p>
          </Card>
          <Card className="p-3 text-center bg-red-50 dark:bg-red-950/30 border-red-200">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Отклонено' : 'Rejected'}</p>
          </Card>
          <Card className="p-3 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold">~5m</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Ср. время' : 'Avg Time'}</p>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              {isRu ? 'На проверке' : 'Pending'}
              {pendingCount > 0 && <Badge variant="secondary">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved">{isRu ? 'Одобрено' : 'Approved'}</TabsTrigger>
            <TabsTrigger value="rejected">{isRu ? 'Отклонено' : 'Rejected'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {MOCK_ITEMS.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">{isRu ? 'Очередь пуста' : 'Queue is empty'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {MOCK_ITEMS.map(item => {
                        const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
                        const Icon = config?.icon || FileText;
                        
                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg shrink-0", config?.color)}>
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
                                  {item.user} • {formatDistanceToNow(item.time, { addSuffix: true, locale: dateLocale })}
                                </p>
                                
                                {item.type === 'review' && (
                                  <div className="p-2 bg-muted/50 rounded-lg text-sm mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={cn(
                                            "h-3 w-3",
                                            i < (item.rating || 0) ? "text-amber-500 fill-amber-500" : "text-muted"
                                          )} 
                                        />
                                      ))}
                                    </div>
                                    "{item.content}"
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 hover:bg-green-50">
                                    <ThumbsUp className="h-3 w-3" />
                                    {isRu ? 'Одобрить' : 'Approve'}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50">
                                    <ThumbsDown className="h-3 w-3" />
                                    {isRu ? 'Отклонить' : 'Reject'}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                                    <Eye className="h-3 w-3" />
                                    {isRu ? 'Подробнее' : 'View'}
                                  </Button>
                                </div>
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
