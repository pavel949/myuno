import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Headphones, Search, MessageCircle, Phone, Clock, CheckCircle2,
  AlertTriangle, User, ExternalLink, Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// TODO: Replace with DB query - tickets should come from support_tickets table
// Mock tickets data for demo purposes
const MOCK_TICKETS = [
  { id: '1', subject: 'Payment not processed', user: 'John Smith', status: 'open', priority: 'high', created: new Date(Date.now() - 30 * 60000) },
  { id: '2', subject: 'Booking cancellation request', user: 'Maria Garcia', status: 'in_progress', priority: 'medium', created: new Date(Date.now() - 2 * 3600000) },
  { id: '3', subject: 'Property not available on dates', user: 'Alex Johnson', status: 'open', priority: 'low', created: new Date(Date.now() - 5 * 3600000) },
  { id: '4', subject: 'Refund inquiry', user: 'Emily Brown', status: 'resolved', priority: 'medium', created: new Date(Date.now() - 24 * 3600000) },
];

const STATUS_CONFIG = {
  open: { labelEn: 'Open', labelRu: 'Открыт', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  in_progress: { labelEn: 'In Progress', labelRu: 'В работе', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  resolved: { labelEn: 'Resolved', labelRu: 'Решён', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  closed: { labelEn: 'Closed', labelRu: 'Закрыт', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export default function TeamSupportPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  const filteredTickets = MOCK_TICKETS.filter(ticket => {
    if (activeTab === 'open') return ticket.status === 'open' || ticket.status === 'in_progress';
    if (activeTab === 'resolved') return ticket.status === 'resolved' || ticket.status === 'closed';
    return true;
  });

  const openCount = MOCK_TICKETS.filter(t => t.status === 'open').length;
  const inProgressCount = MOCK_TICKETS.filter(t => t.status === 'in_progress').length;

  return (
    <TeamLayout title={isRu ? 'Поддержка' : 'Support'}>
      <div className="py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              {isRu ? 'Центр поддержки' : 'Support Center'}
            </h1>
            <p className="text-muted-foreground">
              {isRu 
                ? 'Управление тикетами и запросами клиентов' 
                : 'Manage customer tickets and requests'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Открытых' : 'Open'}</p>
          </Card>
          <Card className="p-3 text-center bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Сегодня' : 'Today'}</p>
          </Card>
          <Card className="p-3 text-center">
            <MessageCircle className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold">~15m</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Ср. ответ' : 'Avg Response'}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск тикетов...' : 'Search tickets...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tickets */}
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
                  {filteredTickets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Headphones className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">{isRu ? 'Нет тикетов' : 'No tickets'}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredTickets.map(ticket => {
                        const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
                        
                        return (
                          <div 
                            key={ticket.id}
                            className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{ticket.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium truncate">{ticket.subject}</span>
                                  {ticket.priority === 'high' && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      {isRu ? 'Срочно' : 'Urgent'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.user} • #{ticket.id}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <Badge className={cn("text-[10px]", status?.color)}>
                                  {isRu ? status?.labelRu : status?.labelEn}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(ticket.created, { addSuffix: true, locale: dateLocale })}
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
