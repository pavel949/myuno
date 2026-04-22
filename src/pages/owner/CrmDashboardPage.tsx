import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, useCompanyMembers, DEAL_TYPES, DEAL_TYPE_LABELS, DealType, DEAL_STATUS_LABELS, DealStatus, formatValue } from '@/hooks/useAgentDeals';
import { useDynamicPipelineStages } from '@/hooks/useDynamicPipelineStages';
import { useCrmContacts } from '@/hooks/useCrmContacts';
import { useTodayTasksCount } from '@/hooks/useCrmTasks';
import { KanbanBoard } from '@/components/owner/sales/KanbanBoard';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { DealSearchBar } from '@/components/owner/sales/DealSearchBar';
import { MyDayWidget } from '@/components/owner/crm/MyDayWidget';
import { CrmQuickActions } from '@/components/owner/crm/CrmQuickActions';
import { CommissionForecast } from '@/components/owner/crm/CommissionForecast';
import { WonLostSummary } from '@/components/owner/crm/WonLostSummary';
import { HotLeadsWidget } from '@/components/owner/crm/HotLeadsWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Settings, Target, Users, ListTodo, DollarSign,
  Percent, BarChart3, Mail, Zap, FileText, Globe,
  Calendar, Building2, Copy, UserCog, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const companyId = membership?.company_id;
  const { data: dealsResult, isLoading, isError: dealsError, error: dealsErrorDetails, refetch: refetchDeals } = useAgentDeals(companyId);
  const deals = dealsResult?.data || [];
  const { data: members = [] } = useCompanyMembers(companyId);
  const { data: contactsResult } = useCrmContacts(companyId, 0, 1);
  const { data: todayCount = 0 } = useTodayTasksCount();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const pipelineData = useDynamicPipelineStages(companyId, selectedPipelineId);
  const { stages, pipelines } = pipelineData;

  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState<DealType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DealStatus | 'all'>('active');
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dealVipFilter, setDealVipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [contactVipFilter, setContactVipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [activePreset, setActivePreset] = useState<'none' | 'hot_vip' | 'no_contact' | 'high_budget' | 'follow_up_today'>('none');

  const handleApplyPreset = (preset: typeof activePreset) => {
    setActivePreset(preset);
    if (preset === 'none') {
      setDealVipFilter('all');
      setContactVipFilter('all');
      return;
    }
    if (preset === 'hot_vip') {
      setDealVipFilter('yes');
      setContactVipFilter('yes');
    }
  };

  const wonLostKeys = useMemo(() => {
    const won = stages.filter(s => s.isWon).map(s => s.key);
    const lost = stages.filter(s => s.isLost).map(s => s.key);
    return { won, lost, closed: [...won, ...lost] };
  }, [stages]);

  // KPIs
  const kpis = useMemo(() => {
    const activeDeals = deals.filter(d => !wonLostKeys.closed.includes(d.stage));
    const wonDeals = deals.filter(d => wonLostKeys.won.includes(d.stage));
    const lostDeals = deals.filter(d => wonLostKeys.lost.includes(d.stage));
    const closedCount = wonDeals.length + lostDeals.length;
    const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0;
    const totalPipeline = activeDeals.reduce((s, d) => s + Number(d.deal_value || d.budget_max || 0), 0);
    const weighted = activeDeals.reduce((s, d) => {
      const val = Number(d.deal_value || d.budget_max || 0);
      return s + val * pipelineData.getProbability(d.stage);
    }, 0);
    return {
      activeCount: activeDeals.length,
      totalPipeline,
      weighted,
      wonCount: wonDeals.length,
      winRate,
      totalContacts: contactsResult?.count || 0,
      todayTasks: todayCount,
    };
  }, [deals, wonLostKeys, pipelineData, contactsResult, todayCount]);

  // Filtered deals
  const filtered = useMemo(() => {
    let result = deals;
    if (filterStatus !== 'all') {
      result = result.filter(d => (d as any).deal_status === filterStatus || (!(d as any).deal_status && filterStatus === 'active'));
    }
    if (filterType !== 'all') {
      result = result.filter(d => (d as any).deal_type === filterType || (!(d as any).deal_type && filterType === 'sale'));
    }
    if (agentFilter !== 'all') {
      result = result.filter(d => d.agent_id === agentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.client_name.toLowerCase().includes(q) ||
        d.client_phone?.toLowerCase().includes(q) ||
        d.client_email?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q)
      );
    }
    if (dealVipFilter !== 'all') {
      const wantVip = dealVipFilter === 'yes';
      result = result.filter(d => Boolean((d as { is_vip?: boolean }).is_vip) === wantVip);
    }
    if (contactVipFilter !== 'all') {
      const wantVip = contactVipFilter === 'yes';
      result = result.filter(d => {
        const tags = (d as { tags?: string[] }).tags || [];
        const isVip = tags.some(t => t.toLowerCase() === 'vip');
        return isVip === wantVip;
      });
    }
    return result;
  }, [deals, filterType, filterStatus, search, agentFilter, dealVipFilter, contactVipFilter]);

  if (membershipLoading || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground pt-20">
        <p className="text-lg font-medium mb-2">{isRu ? 'Нет доступа' : 'No Access'}</p>
        <p className="text-sm">{isRu ? 'Вы не являетесь членом управляющей компании' : "You're not a member of any management company"}</p>
      </div>
    );
  }

  if (dealsError) {
    return (
      <div className="p-4 md:p-6 text-center pt-20">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки CRM' : 'Failed to load CRM dashboard'}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {dealsErrorDetails instanceof Error ? dealsErrorDetails.message : String(dealsErrorDetails)}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchDeals()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  const kpiItems = [
    { label: isRu ? 'В работе' : 'Active', value: String(kpis.activeCount), icon: Target, color: 'text-primary' },
    { label: isRu ? 'Воронка' : 'Pipeline', value: formatValue(kpis.totalPipeline), icon: DollarSign, color: 'text-primary' },
    { label: isRu ? 'Прогноз' : 'Forecast', value: formatValue(kpis.weighted), icon: TrendingUp, color: 'text-warning' },
    { label: isRu ? 'Конверсия' : 'Win Rate', value: `${kpis.winRate}%`, icon: Percent, color: 'text-success' },
    { label: isRu ? 'Контакты' : 'Contacts', value: String(kpis.totalContacts), icon: Users, color: 'text-info', onClick: () => navigate(APP_ROUTES.MC_CONTACTS) },
    { label: isRu ? 'Задачи' : 'Tasks', value: String(kpis.todayTasks), icon: ListTodo, color: 'text-warning', onClick: () => navigate(APP_ROUTES.MC_TASKS) },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">CRM</h1>
          {pipelines.length > 1 && (
            <Select value={selectedPipelineId || ''} onValueChange={v => setSelectedPipelineId(v || null)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder={isRu ? 'Воронка' : 'Pipeline'} />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {isRu ? p.name_ru : p.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`${APP_ROUTES.MC_SETTINGS}?tab=crm`)} title={isRu ? 'Настройки' : 'Settings'}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`${APP_ROUTES.MC_SALES}/analytics`)}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Новая' : 'New'}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <CrmQuickActions />

      {/* Compact KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {kpiItems.map(k => (
          <button
            key={k.label}
            onClick={k.onClick}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg border bg-card text-left transition-colors',
              k.onClick && 'hover:bg-accent/50 cursor-pointer',
              !k.onClick && 'cursor-default',
            )}
          >
            <k.icon className={cn('h-4 w-4 shrink-0', k.color)} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">{k.label}</p>
              <p className="text-sm font-bold leading-tight">{k.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Commission Forecast */}
      <CommissionForecast deals={deals} pipelineData={pipelineData} wonLostKeys={wonLostKeys} />

      {/* My Day + Won/Lost row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MyDayWidget deals={deals.filter(d => !wonLostKeys.closed.includes(d.stage))} />
        <WonLostSummary deals={deals} wonLostKeys={wonLostKeys} />
      </div>

      {/* Hot Leads */}
      <HotLeadsWidget />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['active', 'on_hold', 'archived', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s === 'all' ? 'all' : s)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
            )}
          >
            {s === 'all' ? (isRu ? 'Все' : 'All') : (isRu ? DEAL_STATUS_LABELS[s].ru : DEAL_STATUS_LABELS[s].en)}
          </button>
        ))}
        {DEAL_TYPES.length > 1 && (
          <>
            <span className="w-px h-5 bg-border shrink-0" />
            {(['all', ...DEAL_TYPES] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t === 'all' ? 'all' : t)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  filterType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
                )}
              >
                {t === 'all' ? (isRu ? 'Все типы' : 'All types') : (isRu ? DEAL_TYPE_LABELS[t].ru : DEAL_TYPE_LABELS[t].en)}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Search + Agent Filter */}
      <DealSearchBar
        search={search}
        onSearchChange={setSearch}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        agents={members}
        dealVipFilter={dealVipFilter}
        onDealVipFilterChange={setDealVipFilter}
        contactVipFilter={contactVipFilter}
        onContactVipFilterChange={setContactVipFilter}
        activePreset={activePreset}
        onApplyPreset={handleApplyPreset}
      />

      {/* Kanban Board */}
      <KanbanBoard
        deals={filtered}
        members={members}
        pipelineData={pipelineData}
        onQuickCreate={() => setShowCreate(true)}
      />

      {/* CRM Tools */}
      <div className="pt-4 border-t">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {isRu ? 'Инструменты CRM' : 'CRM Tools'}
        </p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[
            { icon: Mail, label: isRu ? 'Email' : 'Email', path: APP_ROUTES.MC_CRM_EMAILS },
            { icon: Zap, label: isRu ? 'Автоматизации' : 'Automations', path: APP_ROUTES.MC_AUTOMATIONS },
            { icon: FileText, label: isRu ? 'Шаблоны' : 'Templates', path: APP_ROUTES.MC_CRM_TEMPLATES },
            { icon: Globe, label: isRu ? 'Веб-формы' : 'Web Forms', path: APP_ROUTES.MC_FORMS },
            { icon: Calendar, label: isRu ? 'Встречи' : 'Meetings', path: APP_ROUTES.MC_MEETINGS },
            { icon: Building2, label: isRu ? 'Компании' : 'Companies', path: APP_ROUTES.MC_COMPANIES },
            { icon: Copy, label: isRu ? 'Дубликаты' : 'Duplicates', path: APP_ROUTES.MC_DUPLICATES },
            { icon: UserCog, label: isRu ? 'Назначение' : 'Assignment', path: APP_ROUTES.MC_ASSIGNMENT },
          ].map(tool => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors hover:bg-muted/50 group"
            >
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <tool.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center line-clamp-1">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <CreateDealSheet open={showCreate} onOpenChange={setShowCreate} companyId={membership.company_id} />
    </div>
  );
}
