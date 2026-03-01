import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminMCSubscriptions from '@/components/admin/mc/AdminMCSubscriptions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Building2,
  Search,
  Users,
  Home,
  CreditCard,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  Calendar,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MCWithStats {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
  paid_slots: number;
  properties_managed: number | null;
  properties_count: number | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  director_name: string | null;
  district: string | null;
  service_types: string[] | null;
  // Computed
  member_count: number;
  active_slot_count: number;
}

function useAdminMCData() {
  return useQuery({
    queryKey: ['admin-mc-dashboard'],
    queryFn: async () => {
      // Fetch all management companies
      const { data: companies, error: mcError } = await supabase
        .from('management_companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (mcError) throw mcError;

      // Fetch member counts per company
      const { data: members, error: membersError } = await supabase
        .from('management_company_members')
        .select('company_id, is_active');
      if (membersError) throw membersError;

      // Fetch active slot counts
      const { data: slots, error: slotsError } = await supabase
        .from('mc_property_slots')
        .select('company_id, is_active');
      if (slotsError) throw slotsError;

      // Aggregate
      const memberMap = new Map<string, number>();
      (members || []).forEach(m => {
        if (m.is_active) {
          memberMap.set(m.company_id, (memberMap.get(m.company_id) || 0) + 1);
        }
      });

      const slotMap = new Map<string, number>();
      (slots || []).forEach(s => {
        if (s.is_active) {
          slotMap.set(s.company_id, (slotMap.get(s.company_id) || 0) + 1);
        }
      });

      return (companies || []).map((c): MCWithStats => ({
        ...c,
        member_count: memberMap.get(c.id) || 0,
        active_slot_count: slotMap.get(c.id) || 0,
      }));
    },
    refetchInterval: 60_000,
  });
}

export default function AdminMCDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: companies = [], isLoading } = useAdminMCData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selectedMC, setSelectedMC] = useState<MCWithStats | null>(null);
  const [pageTab, setPageTab] = useState('overview');

  const filtered = useMemo(() => {
    let list = companies;
    if (tab === 'active') list = list.filter(c => c.is_active);
    if (tab === 'trial') list = list.filter(c => !c.stripe_subscription_id && c.is_active);
    if (tab === 'paid') list = list.filter(c => !!c.stripe_subscription_id);
    if (tab === 'inactive') list = list.filter(c => !c.is_active);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name_en.toLowerCase().includes(q) ||
        c.name_ru.toLowerCase().includes(q) ||
        c.slug.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [companies, tab, search]);

  // Summary stats
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.is_active).length;
    const paid = companies.filter(c => !!c.stripe_subscription_id).length;
    const totalSlots = companies.reduce((sum, c) => sum + c.active_slot_count, 0);
    const totalMembers = companies.reduce((sum, c) => sum + c.member_count, 0);
    const totalProperties = companies.reduce((sum, c) => sum + (c.properties_managed || 0), 0);
    return { total, active, paid, totalSlots, totalMembers, totalProperties };
  }, [companies]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isRu ? 'Управляющие компании' : 'Management Companies'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRu ? 'Мониторинг всех подключённых УК' : 'Monitor all connected MCs'}
          </p>
        </div>
      </div>

      {/* Page-level tabs */}
      <Tabs value={pageTab} onValueChange={setPageTab}>
        <TabsList>
          <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="subscriptions">{isRu ? 'Подписки' : 'Subscriptions'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard icon={Building2} label={isRu ? 'Всего УК' : 'Total MCs'} value={stats.total} />
            <KPICard icon={Zap} label={isRu ? 'Активных' : 'Active'} value={stats.active} accent />
            <KPICard icon={CreditCard} label={isRu ? 'С подпиской' : 'Paid'} value={stats.paid} />
            <KPICard icon={Home} label={isRu ? 'Объектов' : 'Properties'} value={stats.totalProperties} />
            <KPICard icon={Activity} label={isRu ? 'Платных слотов' : 'Active Slots'} value={stats.totalSlots} />
            <KPICard icon={Users} label={isRu ? 'Сотрудников' : 'Team Members'} value={stats.totalMembers} />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">{isRu ? 'Все' : 'All'} ({companies.length})</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">{isRu ? 'Активные' : 'Active'}</TabsTrigger>
                <TabsTrigger value="paid" className="text-xs">{isRu ? 'Платные' : 'Paid'}</TabsTrigger>
                <TabsTrigger value="trial" className="text-xs">{isRu ? 'Триал' : 'Trial'}</TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs">{isRu ? 'Неакт.' : 'Inactive'}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isRu ? 'Поиск УК...' : 'Search MCs...'}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Company List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{isRu ? 'Нет компаний' : 'No companies found'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(mc => (
                <MCRow key={mc.id} mc={mc} isRu={isRu} onClick={() => setSelectedMC(mc)} />
              ))}
            </div>
          )}

          {/* Detail Sheet */}
          <Sheet open={!!selectedMC} onOpenChange={v => { if (!v) setSelectedMC(null); }}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
              {selectedMC && <MCDetail mc={selectedMC} isRu={isRu} />}
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4">
          <AdminMCSubscriptions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── KPI Card ──
function KPICard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
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

// ── MC Row ──
function MCRow({ mc, isRu, onClick }: { mc: MCWithStats; isRu: boolean; onClick: () => void }) {
  const name = isRu ? mc.name_ru : mc.name_en;
  const hasSub = !!mc.stripe_subscription_id;

  return (
    <Card className="hover:border-primary/20 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-3 flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={mc.logo || undefined} />
          <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{name}</span>
            {mc.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            {!mc.is_active && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {isRu ? 'Неакт.' : 'Inactive'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {mc.properties_managed || 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {mc.member_count}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {mc.active_slot_count}/{mc.paid_slots} {isRu ? 'слотов' : 'slots'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasSub ? (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
              <CreditCard className="h-3 w-3 mr-1" />
              {isRu ? 'Подписка' : 'Subscribed'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              <Clock className="h-3 w-3 mr-1" />
              {isRu ? 'Триал' : 'Trial'}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── MC Detail ──
function MCDetail({ mc, isRu }: { mc: MCWithStats; isRu: boolean }) {
  const name = isRu ? mc.name_ru : mc.name_en;
  const locale = isRu ? ru : undefined;

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={mc.logo || undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle className="text-left">{name}</SheetTitle>
            <p className="text-xs text-muted-foreground font-mono">/{mc.slug}</p>
          </div>
        </div>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {mc.is_active ? (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isRu ? 'Активна' : 'Active'}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {isRu ? 'Неактивна' : 'Inactive'}
            </Badge>
          )}
          {mc.is_verified && (
            <Badge variant="outline">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isRu ? 'Верифицирована' : 'Verified'}
            </Badge>
          )}
          {mc.stripe_subscription_id ? (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CreditCard className="h-3 w-3 mr-1" />
              {isRu ? 'Подписка активна' : 'Subscription Active'}
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {isRu ? 'Без подписки' : 'No Subscription'}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <MetricBox label={isRu ? 'Объектов' : 'Properties'} value={mc.properties_managed || 0} icon={Home} />
          <MetricBox label={isRu ? 'Сотрудников' : 'Members'} value={mc.member_count} icon={Users} />
          <MetricBox label={isRu ? 'Слотов' : 'Slots'} value={`${mc.active_slot_count}/${mc.paid_slots}`} icon={Activity} />
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{isRu ? 'Контакты' : 'Contacts'}</h3>
          {mc.director_name && (
            <InfoRow icon={Users} label={isRu ? 'Директор' : 'Director'} value={mc.director_name} />
          )}
          {mc.email && <InfoRow icon={Mail} label="Email" value={mc.email} />}
          {mc.phone && <InfoRow icon={Phone} label={isRu ? 'Телефон' : 'Phone'} value={mc.phone} />}
          {mc.website && <InfoRow icon={Globe} label={isRu ? 'Сайт' : 'Website'} value={mc.website} />}
          {mc.district && <InfoRow icon={Home} label={isRu ? 'Район' : 'District'} value={mc.district} />}
        </div>

        <Separator />

        {/* Dates */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{isRu ? 'Активность' : 'Activity'}</h3>
          <InfoRow
            icon={Calendar}
            label={isRu ? 'Создана' : 'Created'}
            value={format(new Date(mc.created_at), 'dd MMM yyyy', { locale })}
          />
          <InfoRow
            icon={Clock}
            label={isRu ? 'Обновлена' : 'Updated'}
            value={formatDistanceToNow(new Date(mc.updated_at), { addSuffix: true, locale })}
          />
        </div>

        {/* Service types */}
        {mc.service_types && mc.service_types.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{isRu ? 'Услуги' : 'Services'}</h3>
              <div className="flex flex-wrap gap-1.5">
                {mc.service_types.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Stripe info */}
        {mc.stripe_customer_id && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Stripe</h3>
              <div className="text-xs text-muted-foreground font-mono space-y-1">
                <p>Customer: {mc.stripe_customer_id}</p>
                {mc.stripe_subscription_id && <p>Subscription: {mc.stripe_subscription_id}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MetricBox({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
