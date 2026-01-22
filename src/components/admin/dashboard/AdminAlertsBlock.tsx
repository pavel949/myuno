import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, MessageSquare, FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminAlertsBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-6 w-24" />
      </Card>
    );
  }

  // Calculate alerts - these would come from actual data
  const alerts = [
    { key: 'moderation', count: data?.pendingContent || 0, icon: FileText, label: isRu ? 'Модерация' : 'Moderation', href: '/admin/moderation' },
    { key: 'tickets', count: 0, icon: MessageSquare, label: isRu ? 'Тикеты' : 'Tickets', href: '/admin/tickets' },
  ].filter(a => a.count > 0);

  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);
  const hasAlerts = totalAlerts > 0;

  if (!hasAlerts) {
    return (
      <Card 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/admin/moderation')}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Оповещения' : 'Alerts'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 py-2">
          <div className="p-2 rounded-full bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium">{isRu ? 'Всё в порядке' : 'All clear'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Нет срочных задач' : 'No urgent tasks'}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        totalAlerts > 5 ? "border-destructive/30" : "border-warning/30"
      )}
      onClick={() => navigate(alerts[0]?.href || '/admin/moderation')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className={cn(
            "h-4 w-4",
            totalAlerts > 5 ? "text-destructive" : "text-warning"
          )} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Оповещения' : 'Alerts'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Count */}
      <div className="mb-2">
        <span className={cn(
          "text-3xl font-bold",
          totalAlerts > 5 ? "text-destructive" : "text-warning"
        )}>
          {totalAlerts}
        </span>
        <span className="text-sm text-muted-foreground ml-1.5">
          {isRu ? 'требует внимания' : 'need attention'}
        </span>
      </div>

      {/* Alert badges */}
      <div className="flex flex-wrap gap-1.5">
        {alerts.map((alert) => (
          <div 
            key={alert.key}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning"
          >
            <alert.icon className="h-3 w-3" />
            <span>{alert.count} {alert.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
