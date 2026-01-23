import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Clock, MessageSquare, FileText, 
  Users, ChevronRight, CheckCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertConfig {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  href: string;
  getCount: (data: any) => number;
  urgentThreshold: number;
  warningThreshold: number;
}

const ALERTS: AlertConfig[] = [
  {
    id: 'moderation',
    icon: FileText,
    label: 'Pending Moderation',
    labelRu: 'На модерации',
    href: '/admin/moderation',
    getCount: (d) => d?.pendingContent || 0,
    urgentThreshold: 10,
    warningThreshold: 3,
  },
  {
    id: 'bookings',
    icon: Clock,
    label: 'Pending Bookings',
    labelRu: 'Ожидающие заказы',
    href: '/admin/operations',
    getCount: (d) => d?.pendingBookings || 0,
    urgentThreshold: 5,
    warningThreshold: 1,
  },
  {
    id: 'providers',
    icon: Users,
    label: 'Unverified Providers',
    labelRu: 'Непроверенные провайдеры',
    href: '/admin/providers',
    getCount: (d) => d?.pendingProviders || 0,
    urgentThreshold: 5,
    warningThreshold: 1,
  },
];

export function AdminOperationalAlerts() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const getAlertLevel = (count: number, urgent: number, warning: number) => {
    if (count >= urgent) return 'urgent';
    if (count >= warning) return 'warning';
    return 'info';
  };

  const activeAlerts = ALERTS.map((alert) => ({
    ...alert,
    count: alert.getCount(data),
    level: getAlertLevel(
      alert.getCount(data), 
      alert.urgentThreshold, 
      alert.warningThreshold
    ),
  })).filter((a) => a.count > 0);

  const totalAlerts = activeAlerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "h-4 w-4",
            totalAlerts > 0 ? "text-warning" : "text-muted-foreground"
          )} />
          <h3 className="text-sm font-medium">
            {isRu ? 'Требует внимания' : 'Needs Attention'}
          </h3>
        </div>
        {totalAlerts > 0 && (
          <Badge variant="destructive" className="font-bold">
            {totalAlerts}
          </Badge>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="p-3 rounded-full bg-success/10 mb-3">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium">{isRu ? 'Всё в порядке!' : 'All clear!'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Нет срочных задач' : 'No urgent tasks'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAlerts.map((alert) => {
            const Icon = alert.icon;
            const isUrgent = alert.level === 'urgent';
            const isWarning = alert.level === 'warning';
            
            return (
              <Button
                key={alert.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between h-auto py-3 px-3 border",
                  isUrgent && "bg-destructive/10 border-destructive/30 hover:bg-destructive/20",
                  isWarning && "bg-warning/10 border-warning/30 hover:bg-warning/20",
                  !isUrgent && !isWarning && "bg-muted border-border hover:bg-muted"
                )}
                onClick={() => navigate(alert.href)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-4 w-4",
                    isUrgent && "text-destructive",
                    isWarning && "text-warning"
                  )} />
                  <span className="text-sm font-medium">
                    {isRu ? alert.labelRu : alert.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isUrgent ? "destructive" : isWarning ? "secondary" : "outline"}
                    className="font-bold"
                  >
                    {alert.count}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
