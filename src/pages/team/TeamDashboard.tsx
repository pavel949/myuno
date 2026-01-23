import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTeamLeads, getSlaStatus, type LeadFilters, type LeadStatus, type LeadRequestType } from '@/hooks/useTeamLeads';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Inbox, Clock, CheckCircle2, AlertTriangle, Phone, MessageCircle,
  Search, Filter, User, Calendar, MapPin, Banknote, Users, Palmtree,
  Building, Eye, TrendingUp, PhoneCall, Plus, FileText, Ticket,
  LayoutDashboard, ChevronRight, Package, Ship, Utensils
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const REQUEST_TYPE_CONFIG: Record<LeadRequestType, { icon: typeof Palmtree; labelRu: string; labelEn: string; color: string }> = {
  vacation_rental: { icon: Palmtree, labelRu: 'Аренда на отдых', labelEn: 'Vacation Rental', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  property_consultation: { icon: Building, labelRu: 'Консультация', labelEn: 'Consultation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  property_tour: { icon: Eye, labelRu: 'Тур по объектам', labelEn: 'Property Tour', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  full_management: { icon: TrendingUp, labelRu: 'Полное управление', labelEn: 'Full Management', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  investment_advice: { icon: Banknote, labelRu: 'Инвестиции', labelEn: 'Investment', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

const STATUS_CONFIG: Record<LeadStatus, { labelRu: string; labelEn: string; color: string }> = {
  pending: { labelRu: 'Новый', labelEn: 'New', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  contacted: { labelRu: 'Связались', labelEn: 'Contacted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  scheduled: { labelRu: 'Назначено', labelEn: 'Scheduled', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  in_progress: { labelRu: 'В работе', labelEn: 'In Progress', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  completed: { labelRu: 'Завершён', labelEn: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { labelRu: 'Отменён', labelEn: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

// Quick actions for team
const QUICK_ACTIONS = [
  { id: 'content', icon: Plus, labelEn: 'Add Content', labelRu: 'Добавить', href: '/team/content', primary: true },
  { id: 'moderation', icon: FileText, labelEn: 'Moderation', labelRu: 'Модерация', href: '/admin/moderation' },
  { id: 'tickets', icon: Ticket, labelEn: 'Tickets', labelRu: 'Тикеты', href: '/admin/tickets' },
  { id: 'leads', icon: Users, labelEn: 'All Leads', labelRu: 'Все лиды', href: '/admin/leads' },
];

// Platform stats to show
const PLATFORM_VERTICALS = [
  { key: 'properties', icon: Building, labelEn: 'Properties', labelRu: 'Недвижимость' },
  { key: 'yachts', icon: Ship, labelEn: 'Yachts', labelRu: 'Яхты' },
  { key: 'tours', icon: MapPin, labelEn: 'Tours', labelRu: 'Туры' },
  { key: 'restaurants', icon: Utensils, labelEn: 'Restaurants', labelRu: 'Рестораны' },
];

export default function TeamDashboard() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ru : enUS;

  const [filters, setFilters] = useState<LeadFilters>({ status: 'all', requestType: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  const { leads, sortedByUrgency, stats, isLoading, recordContact } = useTeamLeads({
    ...filters,
    search: searchQuery || undefined,
    overdue: activeTab === 'overdue',
  });

  const { data: platformStats, isLoading: platformLoading } = useAdminDashboardStats();

  // Note: Access control is handled by TeamGuard wrapper in AnimatedRoutes
  // No need for duplicate redirect logic here

  if (authLoading || rolesLoading) {
    return (
      <AppLayout title="UNO Team">
        <div className="container py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(isRu 
      ? `Здравствуйте, ${name}! Это команда UNO. Мы получили вашу заявку и хотели бы обсудить детали.`
      : `Hello, ${name}! This is the UNO team. We received your request and would like to discuss the details.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleMarkContacted = async (id: string) => {
    await recordContact({ id, status: 'contacted' });
  };

  const displayLeads = activeTab === 'inbox' ? sortedByUrgency : leads;

  const getVerticalCount = (key: string): number => {
    if (!platformStats) return 0;
    return (platformStats as any)[key] || 0;
  };

  return (
    <AppLayout title={isRu ? 'Команда UNO' : 'UNO Team'}>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              {isRu ? 'Панель команды' : 'Team Dashboard'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRu ? 'Управление лидами и контентом платформы' : 'Manage leads and platform content'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isRu ? 'Быстрые действия' : 'Quick Actions'}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.primary ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-2.5 px-3 flex flex-col items-center gap-1.5"
                  onClick={() => navigate(action.href)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">
                    {isRu ? action.labelRu : action.labelEn}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Platform Stats + Lead Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Platform Overview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{isRu ? 'Платформа' : 'Platform'}</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/analytics')} className="text-xs gap-1">
                {isRu ? 'Подробнее' : 'Details'}
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PLATFORM_VERTICALS.map((vertical) => {
                const Icon = vertical.icon;
                const count = getVerticalCount(vertical.key);
                return (
                  <div key={vertical.key} className="text-center p-2 rounded-lg bg-muted/50">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{platformLoading ? '-' : count}</p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {isRu ? vertical.labelRu : vertical.labelEn}
                    </p>
                  </div>
                );
              })}
            </div>
            {platformStats && (
              <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                <span>{isRu ? 'Пользователей' : 'Users'}: {platformStats.totalUsers}</span>
                <span>{isRu ? 'Провайдеров' : 'Providers'}: {platformStats.providers}</span>
                <span>{isRu ? 'На модерации' : 'Pending'}: {platformStats.pendingContent}</span>
              </div>
            )}
          </Card>

          {/* Lead Stats */}
          <div className="grid grid-cols-5 gap-2">
            <Card className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
              <div className="flex flex-col items-center text-center">
                <Inbox className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mb-1" />
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
                <p className="text-[9px] text-yellow-700 dark:text-yellow-300">{isRu ? 'Новые' : 'New'}</p>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                <p className="text-xl font-bold text-red-900 dark:text-red-100">{stats.overdue}</p>
                <p className="text-[9px] text-red-700 dark:text-red-300">{isRu ? 'Просрочено' : 'Overdue'}</p>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex flex-col items-center text-center">
                <PhoneCall className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{stats.contacted}</p>
                <p className="text-[9px] text-blue-700 dark:text-blue-300">{isRu ? 'Связались' : 'Contacted'}</p>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{stats.inProgress}</p>
                <p className="text-[9px] text-indigo-700 dark:text-indigo-300">{isRu ? 'В работе' : 'In Progress'}</p>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                <p className="text-xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
                <p className="text-[9px] text-green-700 dark:text-green-300">{isRu ? 'Готово' : 'Done'}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, status: v as LeadStatus | 'all' }))}
            >
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {isRu ? config.labelRu : config.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              {isRu ? 'Входящие' : 'Inbox'}
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {isRu ? 'Просроченные' : 'Overdue'}
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.overdue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              {isRu ? 'Все' : 'All'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : displayLeads?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">{isRu ? 'Нет заявок' : 'No leads found'}</p>
                  <p className="text-sm mt-1">{isRu ? 'Новые заявки появятся здесь' : 'New leads will appear here'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {displayLeads?.map(lead => {
                  const typeConfig = REQUEST_TYPE_CONFIG[lead.request_type as LeadRequestType] || REQUEST_TYPE_CONFIG.property_consultation;
                  const statusConfig = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.pending;
                  const sla = getSlaStatus(lead.sla_deadline);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card key={lead.id} className={cn(
                      "transition-all",
                      sla.isOverdue && lead.status === 'pending' && 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Lead Info */}
                          <div className="flex-1 space-y-2">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={typeConfig.color}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {isRu ? typeConfig.labelRu : typeConfig.labelEn}
                                </Badge>
                                <Badge className={statusConfig.color}>
                                  {isRu ? statusConfig.labelRu : statusConfig.labelEn}
                                </Badge>
                              </div>
                              <div className={cn("text-xs font-medium", sla.color)}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {sla.label}
                              </div>
                            </div>

                            {/* Contact */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{lead.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{lead.phone}</span>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {lead.preferred_dates && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {lead.preferred_dates.check_in && lead.preferred_dates.check_out
                                    ? `${format(new Date(lead.preferred_dates.check_in), 'd MMM', { locale: dateLocale })} - ${format(new Date(lead.preferred_dates.check_out), 'd MMM', { locale: dateLocale })}`
                                    : null
                                  }
                                </div>
                              )}
                              {lead.guests_count && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {lead.guests_count} {isRu ? 'гостей' : 'guests'}
                                </div>
                              )}
                              {(lead.budget_min || lead.budget_max) && (
                                <div className="flex items-center gap-1">
                                  <Banknote className="h-3.5 w-3.5" />
                                  {lead.budget_min?.toLocaleString()} - {lead.budget_max?.toLocaleString()} {lead.currency || '฿'}
                                </div>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: dateLocale })}
                              {lead.contact_attempts > 0 && (
                                <span className="ml-2">• {lead.contact_attempts} {isRu ? 'попыток' : 'attempts'}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex md:flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 flex-1"
                              onClick={() => handleWhatsApp(lead.phone, lead.name)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 flex-1"
                              onClick={() => handleCall(lead.phone)}
                            >
                              <Phone className="h-4 w-4" />
                              <span className="hidden sm:inline">{isRu ? 'Звонок' : 'Call'}</span>
                            </Button>
                            {lead.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5 flex-1"
                                onClick={() => handleMarkContacted(lead.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="hidden sm:inline">{isRu ? 'Связались' : 'Contacted'}</span>
                              </Button>
                            )}
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
    </AppLayout>
  );
}
