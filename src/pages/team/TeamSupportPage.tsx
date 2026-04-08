import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Headphones, Search, MessageCircle, Clock, CheckCircle2,
  AlertTriangle, Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STATUS_CONFIG = {
  open: { labelEn: 'Open', labelRu: 'Открыт', color: 'bg-warning/10 text-warning' },
  in_progress: { labelEn: 'In Progress', labelRu: 'В работе', color: 'bg-info/10 text-info' },
  resolved: { labelEn: 'Resolved', labelRu: 'Решён', color: 'bg-success/10 text-success' },
  closed: { labelEn: 'Closed', labelRu: 'Закрыт', color: 'bg-muted text-muted-foreground' },
};

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  reporter_name: string | null;
  created_at: string;
}

export default function TeamSupportPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, subject, status, priority, reporter_name, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesTab = activeTab === 'open'
      ? ticket.status === 'open' || ticket.status === 'in_progress'
      : ticket.status === 'resolved' || ticket.status === 'closed';
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.reporter_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTodayCount = tickets.filter(t => {
    if (t.status !== 'resolved' && t.status !== 'closed') return false;
    const today = new Date().toISOString().split('T')[0];
    return t.created_at?.startsWith(today);
  }).length;

  return (
    <TeamLayout title={isRu ? 'Поддержка' : 'Support'}>
      <div className="py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              {isRu ? 'Центр поддержки' : 'Support Center'}
            </h1>
            <p className="text-muted-foreground">
              {isRu ? 'Управление тикетами и запросами клиентов' : 'Manage customer tickets and requests'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-warning/10 border-warning/20">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Открытых' : 'Open'}</p>
          </Card>
          <Card className="p-3 text-center bg-info/10 border-info/20">
            <Clock className="h-5 w-5 mx-auto mb-1 text-info" />
            <p className="text-xl font-bold">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-xl font-bold">{resolvedTodayCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Сегодня' : 'Today'}</p>
          </Card>
          <Card className="p-3 text-center">
            <MessageCircle className="h-5 w-5 mx-auto mb-1 text-accent-purple" />
            <p className="text-xl font-bold">{tickets.length}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего' : 'Total'}</p>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск тикетов...' : 'Search tickets...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="gap-2">
              {isRu ? 'Активные' : 'Active'}
              {openCount + inProgressCount > 0 && (
                <Badge variant="secondary">{openCount + inProgressCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">{isRu ? 'Закрытые' : 'Resolved'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Headphones className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">{isRu ? 'Нет тикетов' : 'No tickets'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredTickets.map(ticket => {
                        const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
                        return (
                          <div key={ticket.id} className="p-4 hover:bg-muted/30 cursor-pointer transition-colors">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{(ticket.reporter_name || '?').charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium truncate">{ticket.subject}</span>
                                  {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      {isRu ? 'Срочно' : 'Urgent'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.reporter_name || (isRu ? 'Аноним' : 'Anonymous')} • #{ticket.id.slice(0, 8)}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge className={cn("text-[10px]", status?.color)}>
                                  {isRu ? status?.labelRu : status?.labelEn}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: dateLocale })}
                                </p>
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
