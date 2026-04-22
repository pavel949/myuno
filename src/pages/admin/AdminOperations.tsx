import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, ShieldCheck, MessageSquare, Users, 
  Plus, Building2, Home, Package, FileText, ArrowRight,
  RefreshCw, AlertTriangle, Wallet
} from 'lucide-react';
import { OperationsBookingsTab } from '@/components/admin/operations/OperationsBookingsTab';
import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { OperationsLeadsTab } from '@/components/admin/operations/OperationsLeadsTab';
import { OperationsInquiriesTab } from '@/components/admin/operations/OperationsInquiriesTab';
import { OperationsDisputesTab } from '@/components/admin/operations/OperationsDisputesTab';
import { OperationsManualPaymentsTab } from '@/components/admin/operations/OperationsManualPaymentsTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useOperationsOverview() {
  return useQuery({
    queryKey: ['operations-overview'],
    queryFn: async () => {
      const [orders, tickets, prospects] = await Promise.all([
        supabase.from('orders').select('status', { count: 'exact', head: false })
          .is('deleted_at', null).limit(500),
        supabase.from('support_tickets').select('status', { count: 'exact', head: false })
          .limit(500),
        supabase.from('vendor_prospects').select('status', { count: 'exact', head: false })
          .limit(500),
      ]);

      return {
        pendingOrders: orders.data?.filter(o => o.status === 'pending').length || 0,
        openTickets: tickets.data?.filter(t => t.status === 'open').length || 0,
        newLeads: prospects.data?.filter(p => p.status === 'new' || !p.status).length || 0,
      };
    },
    refetchInterval: 30000,
  });
}

const VALID_TABS = ['bookings', 'moderation', 'leads', 'inquiries', 'disputes', 'manual-payments'] as const;

export default function AdminOperations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<typeof VALID_TABS[number]>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) ? tabFromUrl as typeof VALID_TABS[number] : 'bookings'
  );
  const { data: overview, refetch: refetchOverview } = useOperationsOverview();

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number])) {
      setActiveTab(tabFromUrl as typeof VALID_TABS[number]);
    }
  }, [tabFromUrl]);

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
      label: isRu ? 'Лиды' : 'Leads', 
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
      color: 'text-emerald-600',
    },
    { 
      label: isRu ? 'УК' : 'PM Company', 
      icon: Building2, 
      path: '/admin/pm-companies',
      color: 'text-indigo-600',
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
      color: 'text-violet-600',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1536px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-display">
            {isRu ? 'Операции' : 'Operations'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Заказы, модерация, лиды и тикеты' : 'Orders, moderation, leads & tickets'}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => refetchOverview()}
          className="text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions Bar */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {isRu ? 'Быстрые действия' : 'Quick actions'}
            </span>
            <div className="h-4 w-px bg-border shrink-0" />
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 data-[state=active]:bg-background flex-1 sm:flex-none"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-[20px] px-1.5 text-xs font-bold"
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
      </Tabs>
    </div>
  );
}
