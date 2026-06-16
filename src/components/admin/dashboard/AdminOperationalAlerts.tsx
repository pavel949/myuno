import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ds';
import {
  AlertTriangle, Clock, MessageSquare, FileText,
  Users, ChevronRight, CheckCircle,
  Scale, Inbox, CreditCard, FileCheck,
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

/**
 * ALERTS — every actionable «needs your attention» source surfaced
 * on the admin dashboard inbox. Ordered roughly by typical urgency
 * (disputes → unpaid orders → applications → moderation → providers
 * → tickets → bookings → manual payments).
 *
 * Add a new alert by appending to this list AND extending
 * useAdminDashboardStats with the corresponding count.
 */
const ALERTS: AlertConfig[] = [
  {
    id: 'disputes',
    icon: Scale,
    label: 'Open Disputes',
    labelRu: 'Открытые споры',
    href: '/admin/disputes',
    getCount: (d) => d?.openDisputes || 0,
    urgentThreshold: 3,
    warningThreshold: 1,
  },
  {
    id: 'unpaidOrders',
    icon: CreditCard,
    label: 'Unpaid > 24h',
    labelRu: 'Не оплачено > 24ч',
    href: '/admin/operations?tab=orders&status=pending',
    getCount: (d) => d?.unpaidOrders24h || 0,
    urgentThreshold: 5,
    warningThreshold: 1,
  },
  {
    id: 'partnerApplications',
    icon: FileCheck,
    label: 'Partner Applications',
    labelRu: 'Заявки партнёров',
    href: '/admin/partner-applications',
    getCount: (d) => d?.pendingPartnerApplications || 0,
    urgentThreshold: 5,
    warningThreshold: 1,
  },
  {
    id: 'moderation',
    icon: FileText,
    label: 'Pending Moderation',
    labelRu: 'На модерации',
    href: '/admin/operations?tab=moderation',
    getCount: (d) => d?.pendingContent || 0,
    urgentThreshold: 10,
    warningThreshold: 3,
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
  {
    id: 'tickets',
    icon: MessageSquare,
    label: 'Open Tickets',
    labelRu: 'Открытые тикеты',
    href: '/admin/tickets',
    getCount: (d) => d?.openTickets || 0,
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
    id: 'manualPayments',
    icon: Inbox,
    label: 'Manual Payments',
    labelRu: 'Ручные оплаты',
    href: '/admin/operations?tab=manual_payments',
    getCount: (d) => d?.pendingManualPayments || 0,
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
      <Surface variant="card" padding="md" radius="xl">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Surface>
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
    <Surface variant="card" padding="md" radius="xl">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader
          title={isRu ? 'Что требует внимания' : 'Action Inbox'}
          icon={AlertTriangle}
          iconClassName={totalAlerts > 0 ? 'text-warning' : undefined}
          size="sm"
        />
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
    </Surface>
  );
}
