import React from 'react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { useTeamLeads, getSlaStatus, type LeadFilters, type LeadStatus, type LeadRequestType } from '@/hooks/useTeamLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Search, Phone, MessageCircle, Clock, CheckCircle2,
  AlertTriangle, User, Building, Palmtree, Eye, Banknote,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const REQUEST_TYPE_CONFIG: Record<LeadRequestType, { icon: typeof Palmtree; labelRu: string; labelEn: string; color: string }> = {
  vacation_rental: { icon: Palmtree, labelRu: 'Аренда на отдых', labelEn: 'Vacation Rental', color: 'bg-accent-cyan/10 text-accent-cyan' },
  property_consultation: { icon: Building, labelRu: 'Консультация', labelEn: 'Consultation', color: 'bg-info/10 text-info' },
  property_tour: { icon: Eye, labelRu: 'Тур по объектам', labelEn: 'Property Tour', color: 'bg-accent-purple/10 text-accent-purple' },
  full_management: { icon: TrendingUp, labelRu: 'Полное управление', labelEn: 'Full Management', color: 'bg-accent-amber/10 text-accent-amber' },
  investment_advice: { icon: Banknote, labelRu: 'Инвестиции', labelEn: 'Investment', color: 'bg-success/10 text-success' },
};

const STATUS_CONFIG: Record<LeadStatus, { labelRu: string; labelEn: string; color: string }> = {
  pending: { labelRu: 'Новый', labelEn: 'New', color: 'bg-warning/10 text-warning' },
  contacted: { labelRu: 'Связались', labelEn: 'Contacted', color: 'bg-info/10 text-info' },
  scheduled: { labelRu: 'Назначено', labelEn: 'Scheduled', color: 'bg-accent-purple/10 text-accent-purple' },
  in_progress: { labelRu: 'В работе', labelEn: 'In Progress', color: 'bg-primary/10 text-primary' },
  completed: { labelRu: 'Завершён', labelEn: 'Completed', color: 'bg-success/10 text-success' },
  cancelled: { labelRu: 'Отменён', labelEn: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

export default function TeamLeadsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;
  
  const { getValue, setValue, setValues } = useUrlFilters();
  const searchQuery = getValue('q', '');
  const setSearchQuery = (v: string) => setValue('q', v || null);
  const activeTab = getValue('tab', 'pending');
  const setActiveTab = (v: string) => setValue('tab', v === 'pending' ? null : v);
  const filters: LeadFilters = {
    status: (getValue('status', 'all') as any),
    requestType: (getValue('type', 'all') as any),
  };
  const setFilters = (updater: LeadFilters | ((prev: LeadFilters) => LeadFilters)) => {
    const next = typeof updater === 'function' ? updater(filters) : updater;
    setValues({
      status: next.status === 'all' ? null : (next.status ?? null),
      type: next.requestType === 'all' ? null : (next.requestType ?? null),
    });
  };

  const { leads, sortedByUrgency, stats, isLoading, recordContact } = useTeamLeads({
    ...filters,
    search: searchQuery || undefined,
    status: activeTab === 'pending' ? 'pending' : activeTab === 'in_progress' ? 'in_progress' : undefined,
  });

  const displayLeads = activeTab === 'pending' ? sortedByUrgency : leads;

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(isRu 
      ? `Здравствуйте, ${name}! Это команда myUNO.`
      : `Hello, ${name}! This is the myUNO team.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <TeamLayout title={isRu ? 'Лиды' : 'Leads'}>
      <div className="py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {isRu ? 'Управление лидами' : 'Lead Management'}
            </h1>
            <p className="text-muted-foreground">
              {isRu 
                ? 'Обработка заявок и конверсия клиентов' 
                : 'Process inquiries and convert clients'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
          <Card className="p-3 text-center bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
            <p className="text-xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Новые' : 'New'}</p>
          </Card>
          <Card className="p-3 text-center bg-red-50 dark:bg-red-950/30 border-red-200">
            <p className="text-xl font-bold">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Просрочено' : 'Overdue'}</p>
          </Card>
          <Card className="p-3 text-center bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <p className="text-xl font-bold">{stats.contacted}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Связались' : 'Contacted'}</p>
          </Card>
          <Card className="p-3 text-center bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200">
            <p className="text-xl font-bold">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</p>
          </Card>
          <Card className="p-3 text-center bg-green-50 dark:bg-green-950/30 border-green-200">
            <p className="text-xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Готово' : 'Done'}</p>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Поиск по имени, телефону...' : 'Search by name, phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.requestType || 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, requestType: v as LeadRequestType | 'all' }))}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder={isRu ? 'Тип' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все типы' : 'All types'}</SelectItem>
              {Object.entries(REQUEST_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {isRu ? config.labelRu : config.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              {isRu ? 'Новые' : 'New'}
              {stats.pending > 0 && <Badge variant="destructive">{stats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="in_progress">{isRu ? 'В работе' : 'In Progress'}</TabsTrigger>
            <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : displayLeads?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">{isRu ? 'Нет лидов' : 'No leads'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayLeads?.map(lead => {
                  const typeConfig = REQUEST_TYPE_CONFIG[lead.request_type as LeadRequestType];
                  const statusConfig = STATUS_CONFIG[lead.status as LeadStatus];
                  const sla = getSlaStatus(lead.sla_deadline);
                  const TypeIcon = typeConfig?.icon || Building;
                  
                  return (
                    <Card key={lead.id} className={cn(
                      sla.isOverdue && lead.status === 'pending' && 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", typeConfig?.color)}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium">{lead.name}</span>
                              {sla.isOverdue && (
                                <Badge variant="destructive" className="text-[10px]">
                                  {isRu ? 'Просрочено' : 'Overdue'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isRu ? typeConfig?.labelRu : typeConfig?.labelEn}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs gap-1"
                                onClick={() => lead.phone && handleCall(lead.phone)}
                              >
                                <Phone className="h-3 w-3" />
                                {isRu ? 'Позвонить' : 'Call'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs gap-1 text-success"
                                onClick={() => lead.phone && handleWhatsApp(lead.phone, lead.name)}
                              >
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </Button>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge className={cn("text-[10px]", statusConfig?.color)}>
                              {isRu ? statusConfig?.labelRu : statusConfig?.labelEn}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeamLayout>
  );
}
