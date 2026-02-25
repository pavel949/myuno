import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, ChevronRight, ClipboardCheck, CreditCard,
  PackageOpen, MessageCircle, Wrench, Star,
} from 'lucide-react';

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
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { allProperties } = useMyProperties();
  const allPropertyIds = allProperties.map(p => p.property_id);

  const { data: actions, isLoading } = useQuery({
    queryKey: ['today-actions', user?.id, companyId, allPropertyIds.join(',')],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date().toISOString().slice(0, 10);

      const queries = await Promise.all([
        // Overdue CRM tasks
        companyId
          ? supabase.from('crm_tasks')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', companyId)
              .neq('status', 'done')
              .lt('due_date', today)
          : Promise.resolve({ count: 0 }),
        // Open service requests
        supabase.from('property_service_requests')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .in('status', ['pending', 'in_progress']),
        // Low stock items
        supabase.from('property_inventory_items')
          .select('id, quantity, min_quantity')
          .eq('owner_id', user.id)
          .eq('is_active', true),
        // Unread booking messages
        allPropertyIds.length > 0
          ? supabase.from('booking_notifications_log')
              .select('id', { count: 'exact', head: true })
              .is('read_at', null)
              .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          : Promise.resolve({ count: 0 }),
        // Pending invoices
        supabase.from('property_financials')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('transaction_type', 'expense')
          .eq('status', 'pending'),
      ]);

      const items: ActionItem[] = [];

      const overdueTasks = (queries[0] as any).count || 0;
      if (overdueTasks > 0) {
        items.push({
          id: 'overdue-tasks',
          icon: ClipboardCheck,
          title: isRu ? 'Просроченные задачи' : 'Overdue Tasks',
          subtitle: isRu ? `${overdueTasks} задач требуют внимания` : `${overdueTasks} tasks need attention`,
          count: overdueTasks,
          priority: 'urgent',
          href: '/owner/tasks',
        });
      }

      const openRequests = (queries[1] as any).count || 0;
      if (openRequests > 0) {
        items.push({
          id: 'service-requests',
          icon: Wrench,
          title: isRu ? 'Открытые заявки' : 'Open Requests',
          subtitle: isRu ? `${openRequests} в работе` : `${openRequests} in progress`,
          count: openRequests,
          priority: openRequests > 3 ? 'high' : 'normal',
          href: '/owner/operations',
        });
      }

      const inventoryItems = (queries[2] as any).data || [];
      const lowStock = inventoryItems.filter((i: any) =>
        i.min_quantity != null && i.quantity != null && i.quantity < i.min_quantity
      ).length;
      if (lowStock > 0) {
        items.push({
          id: 'low-stock',
          icon: PackageOpen,
          title: isRu ? 'Низкий запас' : 'Low Stock',
          subtitle: isRu ? `${lowStock} позиций нужно пополнить` : `${lowStock} items need restocking`,
          count: lowStock,
          priority: 'high',
          href: '/owner/inventory',
        });
      }

      const unreadMessages = (queries[3] as any).count || 0;
      if (unreadMessages > 0) {
        items.push({
          id: 'unread-messages',
          icon: MessageCircle,
          title: isRu ? 'Непрочитанные' : 'Unread Messages',
          subtitle: isRu ? `${unreadMessages} новых сообщений` : `${unreadMessages} new messages`,
          count: unreadMessages,
          priority: 'normal',
          href: '/owner/inbox',
        });
      }

      const pendingInvoices = (queries[4] as any).count || 0;
      if (pendingInvoices > 0) {
        items.push({
          id: 'pending-invoices',
          icon: CreditCard,
          title: isRu ? 'Ожидают оплаты' : 'Pending Payments',
          subtitle: isRu ? `${pendingInvoices} неоплаченных` : `${pendingInvoices} unpaid`,
          count: pendingInvoices,
          priority: pendingInvoices > 2 ? 'high' : 'normal',
          href: '/owner/invoices',
        });
      }

      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (!actions || actions.length === 0) {
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
