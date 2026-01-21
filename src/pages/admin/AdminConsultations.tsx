import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminConsultations, type ConsultationFilters } from '@/hooks/useAdminConsultations';
import type { ConsultationRequest, ConsultationStatus, ConsultationRequestType } from '@/hooks/useConsultationRequests';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Search, Phone, Mail, MessageCircle, Calendar, Users, Home,
  Clock, CheckCircle, XCircle, AlertCircle, Palmtree, TrendingUp, MapPin
} from 'lucide-react';

const REQUEST_TYPE_CONFIG: Record<ConsultationRequestType, { icon: typeof Palmtree; labelRu: string; labelEn: string; color: string }> = {
  vacation_rental: { icon: Palmtree, labelRu: 'Аренда на отпуск', labelEn: 'Vacation Rental', color: 'bg-green-500' },
  property_consultation: { icon: Home, labelRu: 'Покупка', labelEn: 'Purchase', color: 'bg-blue-500' },
  property_tour: { icon: MapPin, labelRu: 'Тур', labelEn: 'Tour', color: 'bg-purple-500' },
  investment_advice: { icon: TrendingUp, labelRu: 'Инвестиции', labelEn: 'Investment', color: 'bg-amber-500' },
  full_management: { icon: Home, labelRu: 'Управление', labelEn: 'Management', color: 'bg-slate-500' },
};

const STATUS_CONFIG: Record<ConsultationStatus, { labelRu: string; labelEn: string; color: string; icon: typeof Clock }> = {
  pending: { labelRu: 'Новая', labelEn: 'New', color: 'bg-yellow-500', icon: AlertCircle },
  contacted: { labelRu: 'Связались', labelEn: 'Contacted', color: 'bg-blue-500', icon: Phone },
  scheduled: { labelRu: 'Назначена', labelEn: 'Scheduled', color: 'bg-purple-500', icon: Calendar },
  in_progress: { labelRu: 'В работе', labelEn: 'In Progress', color: 'bg-orange-500', icon: Clock },
  completed: { labelRu: 'Завершена', labelEn: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { labelRu: 'Отменена', labelEn: 'Cancelled', color: 'bg-red-500', icon: XCircle },
};

function ConsultationCard({ 
  consultation, 
  onStatusChange,
  onNotesChange,
  isRu 
}: { 
  consultation: ConsultationRequest; 
  onStatusChange: (id: string, status: ConsultationStatus, notes?: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  isRu: boolean;
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notes, setNotes] = useState(consultation.admin_notes || '');
  
  const typeConfig = REQUEST_TYPE_CONFIG[consultation.request_type];
  const statusConfig = STATUS_CONFIG[consultation.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM, HH:mm', { locale: isRu ? ru : enUS });
  };

  // Parse preferred dates for vacation rental
  const getDatesDisplay = () => {
    if (!consultation.preferred_dates) return null;
    const dates = consultation.preferred_dates as { check_in?: string; check_out?: string };
    if (dates.check_in && dates.check_out) {
      return `${format(new Date(dates.check_in), 'd MMM')} — ${format(new Date(dates.check_out), 'd MMM yyyy')}`;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${typeConfig.color}`}>
                <TypeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium truncate">{consultation.name}</span>
              <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                <StatusIcon className="w-3 h-3" />
                {isRu ? statusConfig.labelRu : statusConfig.labelEn}
              </Badge>
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <a href={`tel:${consultation.phone}`} className="flex items-center gap-1 hover:text-foreground">
                <Phone className="w-3.5 h-3.5" />
                {consultation.phone}
              </a>
              {consultation.email && (
                <a href={`mailto:${consultation.email}`} className="flex items-center gap-1 hover:text-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {consultation.email}
                </a>
              )}
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {consultation.preferred_contact_method}
              </span>
            </div>

            {/* Request details */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                {isRu ? typeConfig.labelRu : typeConfig.labelEn}
              </Badge>
              {consultation.request_type === 'vacation_rental' && (
                <>
                  {getDatesDisplay() && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getDatesDisplay()}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {consultation.guests_count || 1} {isRu ? 'взр.' : 'adults'}
                    {(consultation.children_count || 0) > 0 && `, ${consultation.children_count} ${isRu ? 'дет.' : 'kids'}`}
                  </Badge>
                </>
              )}
              {consultation.budget_min || consultation.budget_max ? (
                <Badge variant="outline">
                  {consultation.budget_min?.toLocaleString() || '0'} — {consultation.budget_max?.toLocaleString() || '∞'} {consultation.currency}
                  {consultation.request_type === 'vacation_rental' ? (isRu ? '/ночь' : '/night') : ''}
                </Badge>
              ) : null}
              {consultation.districts && consultation.districts.length > 0 && (
                <Badge variant="outline">
                  {consultation.districts.slice(0, 2).join(', ')}
                  {consultation.districts.length > 2 && ` +${consultation.districts.length - 2}`}
                </Badge>
              )}
            </div>

            {/* Notes preview */}
            {consultation.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                💬 {consultation.notes}
              </p>
            )}
          </div>

          {/* Right side: time + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatDate(consultation.created_at)}
            </span>
            
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  {isRu ? 'Детали' : 'Details'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5" />
                    {consultation.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Contact */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{isRu ? 'Контакты' : 'Contact'}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${consultation.phone}`} className="hover:underline">{consultation.phone}</a>
                      </div>
                      {consultation.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <a href={`mailto:${consultation.email}`} className="hover:underline">{consultation.email}</a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{consultation.preferred_contact_method} • {consultation.preferred_language}</span>
                      </div>
                    </div>
                  </div>

                  {/* Request details */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{isRu ? 'Запрос' : 'Request'}</h4>
                    <div className="space-y-1 text-sm">
                      {getDatesDisplay() && (
                        <div><strong>{isRu ? 'Даты:' : 'Dates:'}</strong> {getDatesDisplay()}</div>
                      )}
                      {consultation.guests_count && (
                        <div>
                          <strong>{isRu ? 'Гости:' : 'Guests:'}</strong> {consultation.guests_count} {isRu ? 'взрослых' : 'adults'}
                          {(consultation.children_count || 0) > 0 && `, ${consultation.children_count} ${isRu ? 'детей' : 'children'}`}
                        </div>
                      )}
                      {(consultation.budget_min || consultation.budget_max) && (
                        <div>
                          <strong>{isRu ? 'Бюджет:' : 'Budget:'}</strong> {consultation.budget_min?.toLocaleString() || '0'} — {consultation.budget_max?.toLocaleString() || '∞'} {consultation.currency}
                          {consultation.request_type === 'vacation_rental' ? (isRu ? ' за ночь' : ' per night') : ''}
                        </div>
                      )}
                      {consultation.property_types && consultation.property_types.length > 0 && (
                        <div><strong>{isRu ? 'Тип:' : 'Type:'}</strong> {consultation.property_types.join(', ')}</div>
                      )}
                      {consultation.districts && consultation.districts.length > 0 && (
                        <div><strong>{isRu ? 'Районы:' : 'Districts:'}</strong> {consultation.districts.join(', ')}</div>
                      )}
                      {consultation.purpose && (
                        <div><strong>{isRu ? 'Цель:' : 'Purpose:'}</strong> {consultation.purpose}</div>
                      )}
                    </div>
                  </div>

                  {/* Client notes */}
                  {consultation.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{isRu ? 'Пожелания клиента' : 'Client Notes'}</h4>
                      <p className="text-sm bg-muted p-2 rounded">{consultation.notes}</p>
                    </div>
                  )}

                  {/* Status change */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{isRu ? 'Статус' : 'Status'}</h4>
                    <Select 
                      value={consultation.status} 
                      onValueChange={(v) => onStatusChange(consultation.id, v as ConsultationStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {isRu ? config.labelRu : config.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin notes */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">{isRu ? 'Заметки (внутренние)' : 'Admin Notes'}</h4>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isRu ? 'Добавьте заметку...' : 'Add a note...'}
                      rows={3}
                    />
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        onNotesChange(consultation.id, notes);
                      }}
                    >
                      {isRu ? 'Сохранить' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick status buttons */}
            {consultation.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={() => onStatusChange(consultation.id, 'contacted')}
              >
                {isRu ? 'Связался' : 'Contacted'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminConsultations() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [filters, setFilters] = useState<ConsultationFilters>({
    status: 'all',
    requestType: 'all',
    search: '',
  });

  const { 
    consultations, 
    isLoading, 
    updateStatus, 
    updateNotes,
    pendingCount,
    inProgressCount,
    completedCount,
  } = useAdminConsultations(filters);

  const handleStatusChange = (id: string, status: ConsultationStatus, notes?: string) => {
    updateStatus.mutate({ id, status, admin_notes: notes });
  };

  const handleNotesChange = (id: string, notes: string) => {
    updateNotes.mutate({ id, admin_notes: notes });
  };

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Заявки на консультации' : 'Consultation Requests'}
        subtitle={isRu ? 'Управление заявками на аренду и покупку' : 'Manage rental and purchase inquiries'}
        showBack
        fallbackPath="/admin"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">{isRu ? 'Новые' : 'New'}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
            <div className="text-xs text-muted-foreground">{isRu ? 'Завершено' : 'Completed'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по имени, телефону...' : 'Search by name, phone...'}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select 
            value={filters.status} 
            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v as ConsultationStatus | 'all' }))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все статусы' : 'All Statuses'}</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {isRu ? config.labelRu : config.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.requestType} 
            onValueChange={(v) => setFilters(prev => ({ ...prev, requestType: v as ConsultationRequestType | 'all' }))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={isRu ? 'Тип' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRu ? 'Все типы' : 'All Types'}</SelectItem>
              {Object.entries(REQUEST_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {isRu ? config.labelRu : config.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Consultations list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {isRu ? 'Загрузка...' : 'Loading...'}
          </div>
        ) : consultations && consultations.length > 0 ? (
          consultations.map((consultation) => (
            <ConsultationCard
              key={consultation.id}
              consultation={consultation}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              isRu={isRu}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isRu ? 'Заявок пока нет' : 'No requests yet'}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
