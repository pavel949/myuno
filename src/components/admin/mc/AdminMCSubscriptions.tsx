import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  Search,
  Gift,
  ExternalLink,
  Power,
  Activity,
  Building2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const PRICE_PER_SLOT = 25;

interface MCSubscriptionRow {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string;
  logo: string | null;
  is_active: boolean | null;
  paid_slots: number;
  free_slots: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  properties_managed: number | null;
  active_slot_count: number;
}

function useAdminSubscriptionData() {
  return useQuery({
    queryKey: ['admin-mc-subscriptions'],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from('management_companies')
        .select('id, name_en, name_ru, slug, logo, is_active, paid_slots, free_slots, stripe_subscription_id, stripe_customer_id, created_at, properties_managed')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: slots, error: slotsError } = await supabase
        .from('mc_property_slots')
        .select('company_id, is_active');
      if (slotsError) throw slotsError;

      const slotMap = new Map<string, number>();
      (slots || []).forEach(s => {
        if (s.is_active) {
          slotMap.set(s.company_id, (slotMap.get(s.company_id) || 0) + 1);
        }
      });

      return (companies || []).map((c): MCSubscriptionRow => ({
        ...c,
        paid_slots: c.paid_slots || 0,
        free_slots: (c as any).free_slots || 0,
        is_active: c.is_active ?? true,
        active_slot_count: slotMap.get(c.id) || 0,
      }));
    },
    refetchInterval: 60_000,
  });
}

export default function AdminMCSubscriptions() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: companies = [], isLoading } = useAdminSubscriptionData();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [grantDialog, setGrantDialog] = useState<{ company: MCSubscriptionRow; mode: 'grant' | 'revoke' } | null>(null);
  const [slotsInput, setSlotsInput] = useState('1');

  const adminAction = useMutation({
    mutationFn: async (body: { company_id: string; action: string; slots?: number }) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-mc-subscription', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mc-subscriptions'] });
      toast.success(isRu ? 'Действие выполнено' : 'Action completed');
      setGrantDialog(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getStatus = (c: MCSubscriptionRow): 'active' | 'trial' | 'inactive' => {
    if (!c.is_active) return 'inactive';
    if (c.stripe_subscription_id) return 'active';
    return 'trial';
  };

  const filtered = useMemo(() => {
    let list = companies;
    if (statusFilter === 'active') list = list.filter(c => getStatus(c) === 'active');
    if (statusFilter === 'trial') list = list.filter(c => getStatus(c) === 'trial');
    if (statusFilter === 'inactive') list = list.filter(c => getStatus(c) === 'inactive');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name_en.toLowerCase().includes(q) || c.name_ru.toLowerCase().includes(q));
    }
    return list;
  }, [companies, statusFilter, search]);

  const kpi = useMemo(() => {
    const activeCompanies = companies.filter(c => c.is_active && c.stripe_subscription_id);
    const mrr = activeCompanies.reduce((sum, c) => sum + c.paid_slots * PRICE_PER_SLOT, 0);
    const totalSubscribers = activeCompanies.length;
    const trialCount = companies.filter(c => c.is_active && !c.stripe_subscription_id).length;
    const inactiveCount = companies.filter(c => !c.is_active).length;
    const avgSlots = totalSubscribers > 0 ? Math.round(activeCompanies.reduce((s, c) => s + c.paid_slots, 0) / totalSubscribers) : 0;
    const totalFreeSlots = companies.reduce((s, c) => s + c.free_slots, 0);
    return { mrr, totalSubscribers, trialCount, inactiveCount, avgSlots, totalFreeSlots };
  }, [companies]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={DollarSign} label="MRR" value={`$${kpi.mrr.toLocaleString()}`} accent />
        <KPI icon={CreditCard} label={isRu ? 'Подписчики' : 'Subscribers'} value={kpi.totalSubscribers} />
        <KPI icon={Clock} label={isRu ? 'Триал' : 'Trial'} value={kpi.trialCount} />
        <KPI icon={AlertTriangle} label={isRu ? 'Неактивные' : 'Inactive'} value={kpi.inactiveCount} />
        <KPI icon={TrendingUp} label={isRu ? 'Ср. слотов' : 'Avg Slots'} value={kpi.avgSlots} />
        <KPI icon={Gift} label={isRu ? 'Бесп. слотов' : 'Free Slots'} value={kpi.totalFreeSlots} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">{isRu ? 'Все' : 'All'} ({companies.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">{isRu ? 'Активные' : 'Active'}</TabsTrigger>
            <TabsTrigger value="trial" className="text-xs">{isRu ? 'Триал' : 'Trial'}</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">{isRu ? 'Неакт.' : 'Inactive'}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRu ? 'Поиск...' : 'Search...'} className="pl-9 h-9" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-none border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">{isRu ? 'Компания' : 'Company'}</th>
                <th className="text-center p-3 font-medium">{isRu ? 'Статус' : 'Status'}</th>
                <th className="text-center p-3 font-medium">{isRu ? 'Платн.' : 'Paid'}</th>
                <th className="text-center p-3 font-medium">{isRu ? 'Бесп.' : 'Free'}</th>
                <th className="text-center p-3 font-medium">{isRu ? 'Исп.' : 'Used'}</th>
                <th className="text-center p-3 font-medium">{isRu ? 'Дата' : 'Created'}</th>
                <th className="text-right p-3 font-medium">{isRu ? 'Действия' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(mc => {
                const status = getStatus(mc);
                const totalSlots = mc.paid_slots + mc.free_slots;
                return (
                  <tr key={mc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{isRu ? mc.name_ru : mc.name_en}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={status} isRu={isRu} />
                    </td>
                    <td className="p-3 text-center tabular-nums">{mc.paid_slots}</td>
                    <td className="p-3 text-center tabular-nums">{mc.free_slots > 0 ? mc.free_slots : '—'}</td>
                    <td className="p-3 text-center">
                      <span className={`tabular-nums ${mc.active_slot_count >= totalSlots && totalSlots > 0 ? 'text-destructive font-semibold' : ''}`}>
                        {mc.active_slot_count}/{totalSlots}
                      </span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground text-xs">
                      {format(new Date(mc.created_at), 'dd.MM.yy')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => { setGrantDialog({ company: mc, mode: 'grant' }); setSlotsInput('1'); }}
                        >
                          <Gift className="h-3.5 w-3.5 mr-1" />
                          {isRu ? 'Слоты' : 'Slots'}
                        </Button>
                        {mc.stripe_customer_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => window.open(`https://dashboard.stripe.com/customers/${mc.stripe_customer_id}`, '_blank')}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={mc.is_active ? 'ghost' : 'default'}
                          className="h-7 px-2 text-xs"
                          onClick={() => adminAction.mutate({ company_id: mc.id, action: 'toggle_active' })}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {isRu ? 'Нет компаний' : 'No companies found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant/Revoke Dialog */}
      <Dialog open={!!grantDialog} onOpenChange={v => { if (!v) setGrantDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Управление бесплатными слотами' : 'Manage Free Slots'}
            </DialogTitle>
          </DialogHeader>
          {grantDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isRu ? grantDialog.company.name_ru : grantDialog.company.name_en}
                {' — '}
                {isRu ? 'текущих бесп. слотов' : 'current free slots'}: <strong>{grantDialog.company.free_slots}</strong>
              </p>
              <Tabs value={grantDialog.mode} onValueChange={v => setGrantDialog({ ...grantDialog, mode: v as 'grant' | 'revoke' })}>
                <TabsList className="w-full">
                  <TabsTrigger value="grant" className="flex-1">{isRu ? 'Добавить' : 'Grant'}</TabsTrigger>
                  <TabsTrigger value="revoke" className="flex-1">{isRu ? 'Убрать' : 'Revoke'}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div>
                <Label>{isRu ? 'Количество' : 'Quantity'}</Label>
                <Input type="number" min="1" value={slotsInput} onChange={e => setSlotsInput(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog(null)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button
              onClick={() => {
                if (!grantDialog) return;
                adminAction.mutate({
                  company_id: grantDialog.company.id,
                  action: grantDialog.mode === 'grant' ? 'grant_slots' : 'revoke_slots',
                  slots: parseInt(slotsInput, 10),
                });
              }}
              disabled={adminAction.isPending}
            >
              {adminAction.isPending ? '...' : (isRu ? 'Применить' : 'Apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, isRu }: { status: 'active' | 'trial' | 'inactive'; isRu: boolean }) {
  if (status === 'active') {
    return (
      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
        <Activity className="h-3 w-3 mr-1" />
        {isRu ? 'Активна' : 'Active'}
      </Badge>
    );
  }
  if (status === 'trial') {
    return (
      <Badge variant="outline" className="text-[10px]">
        <Clock className="h-3 w-3 mr-1" />
        {isRu ? 'Триал' : 'Trial'}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      <AlertTriangle className="h-3 w-3 mr-1" />
      {isRu ? 'Неакт.' : 'Inactive'}
    </Badge>
  );
}
