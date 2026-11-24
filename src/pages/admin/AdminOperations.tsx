import { PageHeader } from '@/components/page/PageHeader';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/page/PageShell';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, ShieldCheck, MessageSquare, Users, 
  Plus, Building2, Home, Package, FileText,
  RefreshCw, AlertTriangle, Wallet
} from 'lucide-react';
import { OperationsBookingsTab } from '@/components/admin/operations/OperationsBookingsTab';
import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { OperationsLeadsTab } from '@/components/admin/operations/OperationsLeadsTab';
import { OperationsInquiriesTab } from '@/components/admin/operations/OperationsInquiriesTab';
import { OperationsDisputesTab } from '@/components/admin/operations/OperationsDisputesTab';
import { OperationsManualPaymentsTab } from '@/components/admin/operations/OperationsManualPaymentsTab';
import { OperationsFlowerDeliveriesTab } from '@/components/admin/operations/OperationsFlowerDeliveriesTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { applyOrderQueue, applyTicketQueue } from '@/lib/adminDashboardQueues';
import { pickLang } from '@/lib/i18n/pickLang';

function useOperationsOverview() {
  return useQuery({
    queryKey: ['operations-overview'],
    queryFn: async () => {
      const [orders, tickets, prospects] = await Promise.all([
        applyOrderQueue(supabase.from('orders').select('id', { count: 'exact', head: true }), {status: 'pending', createdBefore: null}),
        applyTicketQueue(supabase.from('support_tickets').select('id', { count: 'exact', head: true }), 'active'),
        supabase.from('vendor_prospects').select('id', { count: 'exact', head: true }).or('status.eq.new,status.is.null'),
      ]);

      return {
        pendingOrders: orders.error ? null : orders.count,
        openTickets: tickets.error ? null : tickets.count,
        newLeads: prospects.error ? null : prospects.count,
      };
    },
    refetchInterval: 30000,
  });
}

const VALID_TABS = ['bookings', 'moderation', 'leads', 'inquiries', 'disputes', 'manual-payments', 'flower-delivery'] as const;

export default function AdminOperations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) ? tabFromUrl as typeof VALID_TABS[number] : 'bookings';
  const { data: overview, refetch: refetchOverview } = useOperationsOverview();

  const tabs = [
    { 
      id: 'bookings', 
      label: isRu ? 'Заказы' : 'Orders', 
      icon: ClipboardList,
      badge: overview?.pendingOrders,
    },
    { 
      id: 'moderation', 
      label: isRu ? 'Модерация' : 'Moderation', 
      icon: ShieldCheck,
    },
    { 
      id: 'leads', 
      label: pickLang(language, { en: 'Supplier prospects', ru: 'Потенциальные поставщики', th: 'ผู้ให้บริการที่คาดหวัง' }),
      icon: Users,
      badge: overview?.newLeads,
    },
    { 
      id: 'inquiries', 
      label: isRu ? 'Тикеты' : 'Tickets', 
      icon: MessageSquare,
      badge: overview?.openTickets,
    },
    { 
      id: 'disputes', 
      label: isRu ? 'Споры' : 'Disputes', 
      icon: AlertTriangle,
    },
    {
      id: 'manual-payments',
      label: isRu ? 'Оплаты ₽' : 'RUB payments',
      icon: Wallet,
    },
    {
      id: 'flower-delivery',
      label: pickLang(language, { en: 'Flower delivery', ru: 'Доставка цветов', th: 'บริการส่งดอกไม้' }),
      icon: ClipboardList,
    },
  ];

  const quickActions = [
    { 
      label: isRu ? 'Провайдер' : 'Provider', 
      icon: Building2, 
      path: '/admin/providers?action=new',
      color: 'text-primary',
    },
    { 
      label: isRu ? 'Объект' : 'Property', 
      icon: Home, 
      path: '/admin/properties',
      action: 'new',
      color: 'text-success',
    },
    { 
      label: isRu ? 'УК' : 'PM Company', 
      icon: Building2, 
      path: '/admin/pm-companies',
      color: 'text-primary',
    },
    { 
      label: isRu ? 'Услуга' : 'Service', 
      icon: Package, 
      path: '/admin/services?action=new',
      color: 'text-warning',
    },
    { 
      label: isRu ? 'Контракт' : 'Contract', 
      icon: FileText, 
      path: '/admin/contracts',
      color: 'text-primary',
    },
  ];

  return (
    <PageShell width="workspace">
      <PageHeader
        title={isRu ? 'Операции' : 'Operations'}
        subtitle={pickLang(language, { en: 'Orders, moderation, supplier prospects and support tickets', ru: 'Заказы, модерация, потенциальные поставщики и обращения в поддержку', th: 'คำสั่งซื้อ การตรวจสอบ ผู้ให้บริการที่คาดหวัง และคำขอความช่วยเหลือ' })}
        actions={
          <Button
            variant="ghost"
            size="icon"
            aria-label={isRu ? 'Обновить' : 'Refresh'}
            onClick={() => refetchOverview()}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Quick Actions Bar */}
      <Card className="border-dashed">
        <CardContent className="p-3 space-y-2">
          <span className="text-xs text-muted-foreground font-medium block">
            {isRu ? 'Быстрые действия' : 'Quick actions'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                size="sm"
                className="gap-1.5 whitespace-nowrap shrink-0 h-8"
                onClick={() => navigate(action.path)}
              >
                <Plus className="h-3 w-3" />
                <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={value => setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('tab', value); return next; })} className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 items-stretch gap-1 bg-muted/50 p-1 sm:grid-cols-3 xl:grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="min-h-11 justify-start gap-1.5 overflow-visible whitespace-normal px-2 text-left data-[state=active]:bg-background"
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-auto min-w-5 shrink-0 justify-center px-1.5 text-xs font-semibold tabular-nums"
                >
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <OperationsBookingsTab />
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <OperationsModerationTab />
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <OperationsLeadsTab />
        </TabsContent>

        <TabsContent value="inquiries" className="mt-4">
          <OperationsInquiriesTab />
        </TabsContent>

        <TabsContent value="disputes" className="mt-4">
          <OperationsDisputesTab />
        </TabsContent>

        <TabsContent value="manual-payments" className="mt-4">
          <OperationsManualPaymentsTab />
        </TabsContent>
        <TabsContent value="flower-delivery" className="mt-4">
          <OperationsFlowerDeliveriesTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
