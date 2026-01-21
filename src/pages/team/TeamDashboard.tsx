import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTeamLeads, getSlaStatus, type LeadFilters, type LeadStatus, type LeadRequestType } from '@/hooks/useTeamLeads';
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
  Building, Eye, TrendingUp, PhoneCall, Plus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const REQUEST_TYPE_CONFIG: Record<LeadRequestType, { icon: typeof Palmtree; labelRu: string; labelEn: string; color: string }> = {
  vacation_rental: { icon: Palmtree, labelRu: 'Аренда на отдых', labelEn: 'Vacation Rental', color: 'bg-cyan-100 text-cyan-800' },
  property_consultation: { icon: Building, labelRu: 'Консультация', labelEn: 'Consultation', color: 'bg-blue-100 text-blue-800' },
  property_tour: { icon: Eye, labelRu: 'Тур по объектам', labelEn: 'Property Tour', color: 'bg-purple-100 text-purple-800' },
  full_management: { icon: TrendingUp, labelRu: 'Полное управление', labelEn: 'Full Management', color: 'bg-amber-100 text-amber-800' },
  investment_advice: { icon: Banknote, labelRu: 'Инвестиции', labelEn: 'Investment', color: 'bg-green-100 text-green-800' },
};

const STATUS_CONFIG: Record<LeadStatus, { labelRu: string; labelEn: string; color: string }> = {
  pending: { labelRu: 'Новый', labelEn: 'New', color: 'bg-yellow-100 text-yellow-800' },
  contacted: { labelRu: 'Связались', labelEn: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  scheduled: { labelRu: 'Назначено', labelEn: 'Scheduled', color: 'bg-purple-100 text-purple-800' },
  in_progress: { labelRu: 'В работе', labelEn: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  completed: { labelRu: 'Завершён', labelEn: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { labelRu: 'Отменён', labelEn: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

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

  // Access control
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!rolesLoading && user && !hasRole('uno_team') && !hasRole('admin')) {
      navigate('/');
    }
  }, [rolesLoading, user, hasRole, navigate]);

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

  return (
    <AppLayout title={isRu ? 'Панель UNO Team' : 'UNO Team Dashboard'}>
      <div className="container py-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={() => navigate('/team/content')} className="gap-2">
            <Plus className="h-4 w-4" />
            {isRu ? 'Добавить контент' : 'Add Content'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Inbox className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                  <p className="text-xs text-yellow-700">{isRu ? 'Новых' : 'New'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
                  <p className="text-xs text-red-700">{isRu ? 'Просрочено' : 'Overdue'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <PhoneCall className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{stats.contacted}</p>
                  <p className="text-xs text-blue-700">{isRu ? 'Связались' : 'Contacted'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-900">{stats.inProgress}</p>
                  <p className="text-xs text-indigo-700">{isRu ? 'В работе' : 'In Progress'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                  <p className="text-xs text-green-700">{isRu ? 'Завершено' : 'Completed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRu ? 'Поиск по имени, телефону, email...' : 'Search by name, phone, email...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => setFilters(f => ({ ...f, status: v as LeadStatus | 'all' }))}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRu ? 'Все статусы' : 'All statuses'}</SelectItem>
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
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={isRu ? 'Тип заявки' : 'Request type'} />
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
          </CardContent>
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
              {isRu ? 'Все лиды' : 'All Leads'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : displayLeads?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isRu ? 'Нет заявок' : 'No leads found'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayLeads?.map(lead => {
                  const typeConfig = REQUEST_TYPE_CONFIG[lead.request_type as LeadRequestType] || REQUEST_TYPE_CONFIG.property_consultation;
                  const statusConfig = STATUS_CONFIG[lead.status as LeadStatus] || STATUS_CONFIG.pending;
                  const sla = getSlaStatus(lead.sla_deadline);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card key={lead.id} className={sla.isOverdue && lead.status === 'pending' ? 'border-red-300 bg-red-50/50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Lead Info */}
                          <div className="flex-1 space-y-3">
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
                              <div className={`text-sm font-medium ${sla.color}`}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {sla.label}
                              </div>
                            </div>

                            {/* Contact */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{lead.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {lead.phone}
                              </div>
                              {lead.email && (
                                <div className="text-sm text-muted-foreground">
                                  {lead.email}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {lead.preferred_dates && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {Array.isArray(lead.preferred_dates) 
                                    ? lead.preferred_dates.map((d: any) => d.date).join(', ')
                                    : lead.preferred_dates.check_in && lead.preferred_dates.check_out
                                      ? `${format(new Date(lead.preferred_dates.check_in), 'd MMM', { locale: dateLocale })} - ${format(new Date(lead.preferred_dates.check_out), 'd MMM', { locale: dateLocale })}`
                                      : null
                                  }
                                </div>
                              )}
                              {(lead.guests_count || lead.children_count) && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {lead.guests_count} {isRu ? 'гостей' : 'guests'}
                                  {lead.children_count ? `, ${lead.children_count} ${isRu ? 'детей' : 'children'}` : ''}
                                </div>
                              )}
                              {(lead.budget_min || lead.budget_max) && (
                                <div className="flex items-center gap-1">
                                  <Banknote className="h-4 w-4" />
                                  {lead.budget_min?.toLocaleString()} - {lead.budget_max?.toLocaleString()} {lead.currency || '฿'}
                                </div>
                              )}
                              {lead.districts?.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {lead.districts.slice(0, 2).join(', ')}
                                  {lead.districts.length > 2 && ` +${lead.districts.length - 2}`}
                                </div>
                              )}
                            </div>

                            {/* Meta */}
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: dateLocale })}
                              {lead.contact_attempts > 0 && (
                                <span className="ml-2">
                                  • {lead.contact_attempts} {isRu ? 'попыток связи' : 'contact attempts'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex md:flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleCall(lead.phone)}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              {isRu ? 'Позвонить' : 'Call'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleWhatsApp(lead.phone, lead.name)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                            {lead.status === 'pending' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleMarkContacted(lead.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {isRu ? 'Связался' : 'Contacted'}
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
