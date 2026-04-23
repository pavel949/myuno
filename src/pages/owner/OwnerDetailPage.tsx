/**
 * Owner Account Detail — full profile with tabs
 */
import React, { useMemo } from 'react';
import OwnerPortalSetupCard from '@/components/owner/owners/OwnerPortalSetupCard';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerAccounts, useOwnerAccountDetail } from '@/hooks/useOwnerAccounts';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Gift,
  Globe,
  Building2,
  FileText,
  DollarSign,
  ClipboardList,
  CalendarPlus,
  FileOutput,
  User,
  Heart,
  ShieldAlert,
  Percent,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: owners, isLoading: ownersLoading } = useOwnerAccounts();
  const { data: detail, isLoading: detailLoading } = useOwnerAccountDetail(id || null);
  const { activeCompany } = useActiveCompany();

  const owner = useMemo(() => owners?.find(o => o.id === id), [owners, id]);

  if (ownersLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>{isRu ? 'Собственник не найден' : 'Owner not found'}</p>
        <Button variant="link" onClick={() => navigate('/mc/owners')}>
          {isRu ? '← Назад к списку' : '← Back to list'}
        </Button>
      </div>
    );
  }

  const birthdayInfo = owner.birthday ? (() => {
    const bd = parseISO(owner.birthday);
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
    return {
      date: format(bd, 'd MMMM', { locale: isRu ? ru : undefined }),
      daysUntil: differenceInDays(thisYear, today),
    };
  })() : null;

  // Financial aggregations
  const revenue = (detail?.financials || [])
    .filter(f => (f as any).transaction_type === 'income')
    .reduce((s, f) => s + ((f as any).amount || 0), 0);
  const expenses = (detail?.financials || [])
    .filter(f => (f as any).transaction_type === 'expense')
    .reduce((s, f) => s + ((f as any).amount || 0), 0);

  const handleCreateReminder = async () => {
    if (!activeCompany?.company_id || !id) return;
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      await supabase.from('crm_tasks').insert({
        company_id: activeCompany.company_id,
        contact_id: id,
        title: isRu ? `Связаться с ${owner.first_name} ${owner.last_name}` : `Follow up with ${owner.first_name} ${owner.last_name}`,
        task_type: 'follow_up',
        status: 'pending',
        priority: 'medium',
        created_by: currentUser?.id || '',
      });
      // Log activity
      if (currentUser) {
        await supabase.from('team_activity_log').insert({
          user_id: currentUser.id,
          action_type: 'task_created',
          entity_type: 'crm_task',
          entity_id: id,
          metadata: { contact_name: `${owner.first_name} ${owner.last_name}` },
        } as any);
      }
      toast.success(isRu ? 'Напоминание создано' : 'Reminder created');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/mc/owners')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        {isRu ? 'Собственники' : 'Owners'}
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={owner.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {owner.first_name[0]}{owner.last_name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">
                {owner.first_name} {owner.last_name}
              </h1>

              <div className="flex flex-wrap gap-2 mt-2">
                {owner.phone && (
                  <a href={`tel:${owner.phone}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" /> {owner.phone}
                  </a>
                )}
                {owner.email && (
                  <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" /> {owner.email}
                  </a>
                )}
                {owner.nationality && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" /> {owner.nationality}
                  </span>
                )}
              </div>

              {birthdayInfo && (
                <div className="flex items-center gap-1 mt-1.5 text-sm">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  <span>{birthdayInfo.date}</span>
                  {birthdayInfo.daysUntil <= 30 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {birthdayInfo.daysUntil === 0
                        ? (isRu ? 'Сегодня! 🎂' : 'Today! 🎂')
                        : `${isRu ? 'через' : 'in'} ${birthdayInfo.daysUntil} ${isRu ? 'дн.' : 'd.'}`
                      }
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {owner.whatsapp && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/${owner.whatsapp}`} target="_blank" rel="noopener">
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                </a>
              </Button>
            )}
            {owner.telegram && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://t.me/${owner.telegram}`} target="_blank" rel="noopener">
                  <Send className="h-4 w-4 mr-1" /> Telegram
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCreateReminder}>
              <CalendarPlus className="h-4 w-4 mr-1" />
              {isRu ? 'Напоминание' : 'Reminder'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/mc/reports')}
            >
              <FileOutput className="h-4 w-4 mr-1" />
              {isRu ? 'Отчёт' : 'Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="properties">{isRu ? 'Объекты' : 'Properties'}</TabsTrigger>
          <TabsTrigger value="finance">{isRu ? 'Финансы' : 'Finance'}</TabsTrigger>
          <TabsTrigger value="documents">{isRu ? 'Документы' : 'Documents'}</TabsTrigger>
          <TabsTrigger value="portal">{isRu ? 'Портал' : 'Portal'}</TabsTrigger>
          <TabsTrigger value="activity">{isRu ? 'Активность' : 'Activity'}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Personal info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {isRu ? 'Личная информация' : 'Personal Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {owner.family_info && (
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Семья' : 'Family'}</p>
                    <p>{owner.family_info}</p>
                  </div>
                </div>
              )}
              {owner.emergency_contact_name && (
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRu ? 'Экстренный контакт' : 'Emergency Contact'}</p>
                    <p>{owner.emergency_contact_name} {owner.emergency_contact_relation ? `(${owner.emergency_contact_relation})` : ''}</p>
                    {owner.emergency_contact_phone && <p className="text-muted-foreground">{owner.emergency_contact_phone}</p>}
                  </div>
                </div>
              )}
              {owner.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Заметки' : 'Notes'}</p>
                  <p className="text-muted-foreground">{owner.notes}</p>
                </div>
              )}
              {owner.special_notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Особенности' : 'Special Notes'}</p>
                  <p className="text-muted-foreground">{owner.special_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{owner.properties_count}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Объектов' : 'Properties'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{owner.avg_occupancy}%</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Загрузка' : 'Occupancy'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  ฿{owner.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Доход' : 'Revenue'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-accent-foreground">
                  ฿{owner.total_commission.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Комиссия УК' : 'MC Commission'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{owner.documents_count}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Документов' : 'Documents'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Document status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {isRu ? 'Статус документов' : 'Document Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant={owner.has_contract ? 'default' : 'destructive'}>
                  {isRu ? 'Договор' : 'Contract'} {owner.has_contract ? '✓' : '✗'}
                </Badge>
                <Badge variant={owner.has_passport ? 'default' : 'destructive'}>
                  {isRu ? 'Паспорт' : 'Passport'} {owner.has_passport ? '✓' : '✗'}
                </Badge>
                <Badge variant={owner.has_power_of_attorney ? 'default' : 'outline'}>
                  {isRu ? 'Доверенность' : 'PoA'} {owner.has_power_of_attorney ? '✓' : '—'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROPERTIES TAB */}
        <TabsContent value="properties" className="space-y-3 mt-4">
          {owner.properties.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{isRu ? 'Нет привязанных объектов' : 'No linked properties'}</p>
                <p className="text-xs mt-1">
                  {isRu
                    ? 'Привяжите объект к этому собственнику в карточке объекта'
                    : 'Link a property to this owner in the property editor'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            owner.properties.map(prop => (
              <Card
                key={prop.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/mc/properties/${prop.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{prop.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {prop.type && <span>{prop.type}</span>}
                        {prop.district && <span>• {prop.district}</span>}
                        {prop.bedrooms && <span>• {prop.bedrooms} BR</span>}
                      </div>
                      {prop.commission_rate && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Percent className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium">
                            {prop.commission_rate}% {prop.commission_type || 'commission'}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance" className="space-y-4 mt-4">
          {detailLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <>
              {/* Recent transactions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    {isRu ? 'Последние операции' : 'Recent Transactions'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(detail?.financials || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRu ? 'Нет финансовых записей' : 'No financial records'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(detail?.financials || []).slice(0, 10).map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{f.description || f.category}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.transaction_date && format(parseISO(f.transaction_date), 'dd.MM.yyyy')}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold ${f.transaction_type === 'income' ? 'text-success' : 'text-red-500'}`}>
                            {f.transaction_type === 'income' ? '+' : '-'}฿{Math.abs(f.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent bookings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {isRu ? 'Бронирования' : 'Bookings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(detail?.bookings || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {isRu ? 'Нет бронирований' : 'No bookings'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(detail?.bookings || []).slice(0, 8).map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{b.guest_name || 'Guest'}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.check_in && format(parseISO(b.check_in), 'dd.MM')} – {b.check_out && format(parseISO(b.check_out), 'dd.MM.yy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">
                              ฿{(b.total_amount || 0).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="ml-2 text-[10px]">{b.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-3 mt-4">
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (detail?.documents || []).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{isRu ? 'Нет документов' : 'No documents'}</p>
              </CardContent>
            </Card>
          ) : (
            (detail?.documents || []).map((doc: any) => (
              <Card key={doc.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_type} • {format(parseISO(doc.created_at), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </div>
                  {doc.expires_at && (
                    <Badge
                      variant={new Date(doc.expires_at) < new Date() ? 'destructive' : 'outline'}
                      className="text-[10px]"
                    >
                      {isRu ? 'до' : 'exp'} {format(parseISO(doc.expires_at), 'dd.MM.yy')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* PORTAL TAB */}
        <TabsContent value="portal" className="mt-4">
          <OwnerPortalSetupCard
            contactId={owner.id}
            email={owner.email}
            linkedUserId={owner.linked_user_id}
            properties={owner.properties.map(p => ({ id: p.id, name: p.name }))}
          />
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-3 mt-4">
          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (detail?.tasks || []).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{isRu ? 'Нет запланированных действий' : 'No planned activities'}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={handleCreateReminder}>
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  {isRu ? 'Создать напоминание' : 'Create reminder'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            (detail?.tasks || []).map((task: any) => (
              <Card key={task.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.due_date && format(parseISO(task.due_date), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  <Badge variant={task.status === 'done' ? 'default' : task.status === 'overdue' ? 'destructive' : 'outline'}>
                    {task.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
