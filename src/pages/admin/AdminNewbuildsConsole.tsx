/**
 * Admin Newbuilds Console — central hub for managing developers, projects, leads, documents.
 */
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, AlertTriangle, Clock, FileText, TrendingUp, Plus } from 'lucide-react';
import { useAdminNewbuildsKpi } from '@/hooks/useAdminNewbuildsKpi';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminNewbuildsConsole() {
  const { data, isLoading } = useAdminNewbuildsKpi();

  const kpis = [
    { label: 'Проекты в модерации', value: data?.pendingProjects, color: 'text-amber-500', icon: Clock, href: '/admin/projects?filter=pending' },
    { label: 'Заявки застройщиков', value: data?.pendingDevs, color: 'text-amber-500', icon: Users, href: '/admin/developers?filter=pending' },
    { label: 'Orphan-проекты', value: data?.orphan, color: 'text-destructive', icon: AlertTriangle, href: '/admin/projects?filter=orphan' },
    { label: 'Требуют ревью', value: data?.needsReview, color: 'text-destructive', icon: AlertTriangle, href: '/admin/projects?filter=needs_review' },
    { label: 'Stale (>45 дней)', value: data?.stale, color: 'text-orange-500', icon: Clock, href: '/admin/projects?filter=stale' },
    { label: 'Лидов сегодня', value: data?.leadsToday, color: 'text-primary', icon: TrendingUp, href: '/admin/projects?tab=leads' },
    { label: 'Лидов за неделю', value: data?.leadsWeek, color: 'text-primary', icon: TrendingUp, href: '/admin/projects?tab=leads' },
    { label: 'Всего проектов', value: data?.totalProjects, color: 'text-muted-foreground', icon: Building2, href: '/admin/projects' },
    { label: 'Активных застройщиков', value: data?.totalDevs, color: 'text-muted-foreground', icon: Users, href: '/admin/developers' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Newbuilds Console</h1>
          <p className="text-muted-foreground">Управление застройщиками, проектами, документами и лидами.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/developers"><Button variant="outline"><Plus className="w-4 h-4 mr-1" /> Застройщик</Button></Link>
          <Link to="/admin/projects"><Button><Plus className="w-4 h-4 mr-1" /> Проект</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link to={kpi.href} key={kpi.label}>
              <Card className="p-4 hover:bg-muted/40 transition-colors h-full">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value ?? 0}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/developers"><Card className="p-6 hover:border-primary/50 transition-colors h-full">
          <Users className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Застройщики</h3>
          <p className="text-sm text-muted-foreground">Полный CRUD: контакты, лицензии, верификация, track record.</p>
        </Card></Link>
        <Link to="/admin/projects"><Card className="p-6 hover:border-primary/50 transition-colors h-full">
          <Building2 className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Проекты</h3>
          <p className="text-sm text-muted-foreground">Все проекты, юниты, цены, статусы. Bulk-действия.</p>
        </Card></Link>
        <Link to="/admin/newbuilds/documents"><Card className="p-6 hover:border-primary/50 transition-colors h-full">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Документы</h3>
          <p className="text-sm text-muted-foreground">Vault документов проектов: ClearView checklist, версионирование.</p>
        </Card></Link>
      </div>
    </div>
  );
}
