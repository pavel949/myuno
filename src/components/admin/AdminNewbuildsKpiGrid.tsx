import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, Clock, TrendingUp, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminNewbuildsKpi } from '@/hooks/useAdminNewbuildsKpi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminNewbuildsKpiGrid() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading, error, refetch } = useAdminNewbuildsKpi();

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-destructive/30 p-4">
        <p className="text-sm text-destructive">{isRu ? 'Не удалось загрузить показатели новостроек.' : 'Could not load new-development counts.'}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button>
      </div>
    );
  }

  const kpis = [
    { labelEn: 'Projects awaiting review', labelRu: 'Проекты на проверке', value: data?.pendingProjects, icon: Clock, href: '/admin/projects?filter=pending' },
    { labelEn: 'Developer applications', labelRu: 'Заявки застройщиков', value: data?.pendingDevs, icon: Users, href: '/admin/developers?filter=pending' },
    { labelEn: 'Projects without developer', labelRu: 'Проекты без застройщика', value: data?.orphan, icon: AlertTriangle, href: '/admin/projects?filter=orphan' },
    { labelEn: 'Need review', labelRu: 'Требуют проверки', value: data?.needsReview, icon: AlertTriangle, href: '/admin/projects?filter=needs_review' },
    { labelEn: 'Not updated for 45+ days', labelRu: 'Не обновлялись более 45 дней', value: data?.stale, icon: Clock, href: '/admin/projects?filter=stale' },
    { labelEn: 'Leads today', labelRu: 'Заявки сегодня', value: data?.leadsToday, icon: TrendingUp, href: '/admin/nb-leads' },
    { labelEn: 'Leads this week', labelRu: 'Заявки за неделю', value: data?.leadsWeek, icon: TrendingUp, href: '/admin/nb-leads' },
    { labelEn: 'Total projects', labelRu: 'Всего проектов', value: data?.totalProjects, icon: Building2, href: '/admin/projects' },
    { labelEn: 'Active developers', labelRu: 'Активные застройщики', value: data?.totalDevs, icon: Users, href: '/admin/developers' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link to={kpi.href} key={kpi.labelEn}>
            <Card className="h-full p-4 transition-colors hover:bg-muted/40">
              <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden />
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{kpi.value ?? '—'}</div>}
              <div className="mt-1 text-xs text-muted-foreground">{isRu ? kpi.labelRu : kpi.labelEn}</div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
