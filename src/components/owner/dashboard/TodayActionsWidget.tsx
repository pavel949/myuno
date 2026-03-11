import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ChevronRight, ClipboardCheck, CreditCard,
  PackageOpen, MessageCircle, Wrench, Star,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

interface ActionItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  count: number;
  priority: 'urgent' | 'high' | 'normal';
  href: string;
}

export function TodayActionsWidget() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: metrics, isLoading } = useDashboardMetrics();
  const ops = metrics?.ops;

  const actions = useMemo<ActionItem[]>(() => {
    if (!ops) return [];
    const items: ActionItem[] = [];

    if (ops.overdueTasks > 0) {
      items.push({
        id: 'overdue-tasks',
        icon: ClipboardCheck,
        title: isRu ? 'Просроченные задачи' : 'Overdue Tasks',
        subtitle: isRu ? `${ops.overdueTasks} задач требуют внимания` : `${ops.overdueTasks} tasks need attention`,
        count: ops.overdueTasks,
        priority: 'urgent',
        href: APP_ROUTES.MC_TASKS,
      });
    }

    if (ops.openServiceRequests > 0) {
      items.push({
        id: 'service-requests',
        icon: Wrench,
        title: isRu ? 'Открытые заявки' : 'Open Requests',
        subtitle: isRu ? `${ops.openServiceRequests} в работе` : `${ops.openServiceRequests} in progress`,
        count: ops.openServiceRequests,
        priority: ops.openServiceRequests > 3 ? 'high' : 'normal',
        href: APP_ROUTES.MC_TASKS,
      });
    }

    if (ops.lowStockItems > 0) {
      items.push({
        id: 'low-stock',
        icon: PackageOpen,
        title: isRu ? 'Низкий запас' : 'Low Stock',
        subtitle: isRu ? `${ops.lowStockItems} позиций нужно пополнить` : `${ops.lowStockItems} items need restocking`,
        count: ops.lowStockItems,
        priority: 'high',
        href: APP_ROUTES.MC_INVENTORY,
      });
    }

    if (ops.unreadMessages > 0) {
      items.push({
        id: 'unread-messages',
        icon: MessageCircle,
        title: isRu ? 'Непрочитанные' : 'Unread Messages',
        subtitle: isRu ? `${ops.unreadMessages} новых сообщений` : `${ops.unreadMessages} new messages`,
        count: ops.unreadMessages,
        priority: 'normal',
        href: APP_ROUTES.MC_MESSAGES,
      });
    }

    if (ops.pendingInvoices > 0) {
      items.push({
        id: 'pending-invoices',
        icon: CreditCard,
        title: isRu ? 'Ожидают оплаты' : 'Pending Payments',
        subtitle: isRu ? `${ops.pendingInvoices} неоплаченных` : `${ops.pendingInvoices} unpaid`,
        count: ops.pendingInvoices,
        priority: ops.pendingInvoices > 2 ? 'high' : 'normal',
        href: APP_ROUTES.MC_INVOICES,
      });
    }

    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
    return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [ops, isRu]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
          <Star className="h-4 w-4 text-primary" />
          {isRu ? 'Действия' : 'Action Items'}
        </h3>
        <Card className="border-dashed">
          <CardContent className="py-5 text-center text-muted-foreground text-sm">
            {isRu ? '✨ Всё под контролем — нет срочных задач' : '✨ All clear — no urgent items'}
          </CardContent>
        </Card>
      </section>
    );
  }

  const priorityStyles = {
    urgent: { border: 'border-l-destructive', bg: 'bg-destructive/5', text: 'text-destructive' },
    high: { border: 'border-l-warning', bg: 'bg-warning/5', text: 'text-warning' },
    normal: { border: 'border-l-primary', bg: 'bg-primary/5', text: 'text-primary' },
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {isRu ? 'Требует внимания' : 'Needs Attention'}
          <Badge variant="secondary" className="text-xs">{actions.length}</Badge>
        </h3>
      </div>
      <div className="space-y-2">
        {actions.map((item) => {
          const Icon = item.icon;
          const styles = priorityStyles[item.priority];
          return (
            <Card
              key={item.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-shadow border-l-4',
                styles.border
              )}
              onClick={() => navigate(item.href)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn('p-2 rounded-lg shrink-0', styles.bg)}>
                  <Icon className={cn('h-4 w-4', styles.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {item.count}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
