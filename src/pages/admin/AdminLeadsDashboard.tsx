import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLeadAnalytics } from '@/hooks/useLeadActivityLog';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, Clock, CheckCircle2, AlertTriangle, TrendingUp, Target,
  Phone, Calendar, Inbox, ArrowRight, Timer, UserCheck, XCircle,
  Palmtree, Building, Eye, TrendingDown, BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const REQUEST_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  vacation_rental: { ru: 'Аренда на отдых', en: 'Vacation Rental' },
  property_consultation: { ru: 'Консультация', en: 'Consultation' },
  property_tour: { ru: 'Просмотр', en: 'Property Tour' },
  investment_advice: { ru: 'Инвестиции', en: 'Investment' },
  full_management: { ru: 'Управление', en: 'Management' },
};

export default function AdminLeadsDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { analytics, isLoading } = useLeadAnalytics();

  if (isLoading) {
    return (
      <AppLayout title={isRu ? 'Аналитика лидов' : 'Lead Analytics'}>
        <div className="container py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const data = analytics!;

  return (
    <AppLayout title={isRu ? 'Аналитика лидов' : 'Lead Analytics'}>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isRu ? 'Воронка лидов' : 'Lead Funnel'}</h1>
            <p className="text-muted-foreground">
              {isRu ? 'Отслеживание заявок и эффективности работы' : 'Track leads and team performance'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/consultations')}>
              {isRu ? 'Все заявки' : 'All Leads'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button onClick={() => navigate('/team')}>
              {isRu ? 'UNO Team' : 'UNO Team'}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Inbox className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.totalLeads}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Всего заявок' : 'Total Leads'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.overdueLeads}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Просрочено SLA' : 'Overdue SLA'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Конверсия' : 'Conversion'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Timer className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.avgResponseTimeMinutes} {isRu ? 'мин' : 'min'}</p>
                  <p className="text-xs text-muted-foreground">{isRu ? 'Ср. время ответа' : 'Avg Response'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel & Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {isRu ? 'Воронка' : 'Funnel'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FunnelStep 
                label={isRu ? 'Новые заявки' : 'New Leads'} 
                count={data.pendingLeads} 
                total={data.totalLeads}
                color="bg-blue-500"
              />
              <FunnelStep 
                label={isRu ? 'В работе' : 'In Progress'} 
                count={data.inProgressLeads} 
                total={data.totalLeads}
                color="bg-yellow-500"
              />
              <FunnelStep 
                label={isRu ? 'Завершено' : 'Completed'} 
                count={data.completedLeads} 
                total={data.totalLeads}
                color="bg-green-500"
              />
              <FunnelStep 
                label={isRu ? 'Конверсия' : 'Converted'} 
                count={data.convertedLeads} 
                total={data.totalLeads}
                color="bg-emerald-500"
              />
              <FunnelStep 
                label={isRu ? 'Потеряно' : 'Lost'} 
                count={data.lostLeads} 
                total={data.totalLeads}
                color="bg-red-500"
              />
            </CardContent>
          </Card>

          {/* By Request Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {isRu ? 'По типу заявки' : 'By Request Type'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.byRequestType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">
                    {REQUEST_TYPE_LABELS[type]?.[isRu ? 'ru' : 'en'] || type}
                  </span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {isRu ? 'Эффективность команды' : 'Team Performance'}
            </CardTitle>
            <CardDescription>
              {isRu ? 'Статистика по менеджерам' : 'Statistics by team member'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRu ? 'Менеджер' : 'Manager'}</TableHead>
                  <TableHead className="text-center">{isRu ? 'Всего' : 'Total'}</TableHead>
                  <TableHead className="text-center">{isRu ? 'В ожидании' : 'Pending'}</TableHead>
                  <TableHead className="text-center">{isRu ? 'Завершено' : 'Completed'}</TableHead>
                  <TableHead className="text-center">{isRu ? 'Конверсия' : 'Converted'}</TableHead>
                  <TableHead className="text-center">{isRu ? 'CR%' : 'CR%'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.byAssignee).map(([name, stats]) => {
                  const s = stats as { total: number; pending: number; completed: number; converted: number };
                  const cr = s.completed > 0 ? Math.round((s.converted / s.completed) * 100) : 0;
                  return (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-center">{s.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.pending > 5 ? 'destructive' : 'secondary'}>{s.pending}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{s.completed}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">{s.converted}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cr >= 30 ? 'default' : 'secondary'}>{cr}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Period Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{data.todayLeads}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'Сегодня' : 'Today'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{data.weekLeads}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'За неделю' : 'This Week'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{data.monthLeads}</p>
              <p className="text-sm text-muted-foreground">{isRu ? 'За месяц' : 'This Month'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function FunnelStep({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{count} ({percentage}%)</span>
      </div>
      <Progress value={percentage} className={`h-2 [&>div]:${color}`} />
    </div>
  );
}
