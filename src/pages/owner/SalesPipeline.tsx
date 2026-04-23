import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPast, isToday } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, useCompanyMembers, DEAL_TYPES, DEAL_TYPE_LABELS, DealType, DEAL_STATUS_LABELS, DealStatus } from '@/hooks/useAgentDeals';
import { useDynamicPipelineStages } from '@/hooks/useDynamicPipelineStages';
import { DealCard } from '@/components/owner/sales/DealCard';
import { KanbanBoard } from '@/components/owner/sales/KanbanBoard';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { DealSearchBar } from '@/components/owner/sales/DealSearchBar';
import { PipelineSummary } from '@/components/owner/sales/PipelineSummary';
import { PipelinePivotTable } from '@/components/owner/sales/PipelinePivotTable';
import { BulkActions } from '@/components/owner/sales/BulkActions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutList, Columns3, BarChart3, CheckSquare, Settings, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type QuickPreset = 'none' | 'hot_vip' | 'no_contact' | 'high_budget' | 'follow_up_today';

export default function SalesPipeline() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const { data: dealsResult, isLoading, isError: dealsError, refetch: refetchDeals } = useAgentDeals(membership?.company_id);
  const deals = dealsResult?.data || [];
  const { data: members = [] } = useCompanyMembers(membership?.company_id);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const pipelineData = useDynamicPipelineStages(membership?.company_id, selectedPipelineId);
  const { stages, activeStages, pipelines, getLabel } = pipelineData;
  const [showCreate, setShowCreate] = useState(false);
  const [createStage, setCreateStage] = useState('new');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterType, setFilterType] = useState<DealType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DealStatus | 'all'>('active');
  const [view, setView] = useState<'list' | 'kanban' | 'pivot'>('list');
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dealVipFilter, setDealVipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [contactVipFilter, setContactVipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [highBudgetOnly, setHighBudgetOnly] = useState(false);
  const [noContactOnly, setNoContactOnly] = useState(false);
  const [activePreset, setActivePreset] = useState<QuickPreset>('none');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: vipContactIds = new Set<string>() } = useQuery({
    queryKey: ['crm-vip-contact-ids', membership?.company_id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('crm_contacts')
          .select('id, tags')
          .eq('company_id', membership!.company_id)
          .not('tags', 'is', null);
        if (error) throw error;
        return new Set(
          (data || [])
            .filter(item => Array.isArray(item.tags) && item.tags.includes('VIP'))
            .map(item => item.id)
        );
      } catch {
        return new Set<string>();
      }
    },
    enabled: !!membership?.company_id,
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const wonLostKeys = useMemo(() => {
    const won = stages.filter(s => s.isWon).map(s => s.key);
    const lost = stages.filter(s => s.isLost).map(s => s.key);
    return { won, lost, closed: [...won, ...lost] };
  }, [stages]);

  const filteredBeforeStage = useMemo(() => {
    let result = deals;

    // Status filter (default: active)
    if (filterStatus !== 'all') {
      result = result.filter(d => (d as any).deal_status === filterStatus || (!( d as any).deal_status && filterStatus === 'active'));
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(d => (d as any).deal_type === filterType || (!(d as any).deal_type && filterType === 'sale'));
    }

    // Agent filter
    if (agentFilter !== 'all') {
      result = result.filter(d => d.agent_id === agentFilter);
    }

    // Deal VIP filter
    if (dealVipFilter === 'yes') {
      result = result.filter(d => d.is_vip);
    } else if (dealVipFilter === 'no') {
      result = result.filter(d => !d.is_vip);
    }

    // Contact VIP filter
    if (contactVipFilter === 'yes') {
      result = result.filter(d => !!d.contact_id && vipContactIds.has(d.contact_id));
    } else if (contactVipFilter === 'no') {
      result = result.filter(d => !d.contact_id || !vipContactIds.has(d.contact_id));
    }

    if (highBudgetOnly) {
      result = result.filter(d => Number(d.budget_max || 0) >= 10_000_000);
    }

    if (noContactOnly) {
      result = result.filter(d => !d.contact_id);
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.client_name.toLowerCase().includes(q) ||
        d.client_phone?.toLowerCase().includes(q) ||
        d.client_email?.toLowerCase().includes(q) ||
        d.client_source?.toLowerCase().includes(q) ||
        d.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        d.notes?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [deals, filterType, filterStatus, search, agentFilter, dealVipFilter, contactVipFilter, highBudgetOnly, noContactOnly, vipContactIds]);

  const overdueCount = useMemo(() => {
    return filteredBeforeStage.filter(d => {
      if (wonLostKeys.closed.includes(d.stage)) return false;
      if (!d.next_action_date) return false;
      const nd = new Date(d.next_action_date);
      return isPast(nd) || isToday(nd);
    }).length;
  }, [filteredBeforeStage, wonLostKeys]);

  const filtered = useMemo(() => {
    if (filterStage === 'follow_up') {
      return filteredBeforeStage.filter(d => {
        if (wonLostKeys.closed.includes(d.stage)) return false;
        if (!d.next_action_date) return false;
        const nd = new Date(d.next_action_date);
        return isPast(nd) || isToday(nd);
      });
    }
    if (filterStage !== 'all') {
      return filteredBeforeStage.filter(d => d.stage === filterStage);
    }
    return filteredBeforeStage;
  }, [filteredBeforeStage, filterStage, wonLostKeys]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of filteredBeforeStage) counts[d.stage] = (counts[d.stage] || 0) + 1;
    return counts;
  }, [filteredBeforeStage]);

  const applyPreset = useCallback((preset: QuickPreset) => {
    setActivePreset(preset);
    if (preset === 'none') {
      setDealVipFilter('all');
      setContactVipFilter('all');
      setHighBudgetOnly(false);
      setNoContactOnly(false);
      setFilterStage('all');
      return;
    }
    if (preset === 'hot_vip') {
      setDealVipFilter('yes');
      setContactVipFilter('all');
      setHighBudgetOnly(false);
      setNoContactOnly(false);
      setFilterStage('all');
      return;
    }
    if (preset === 'no_contact') {
      setDealVipFilter('all');
      setContactVipFilter('all');
      setHighBudgetOnly(false);
      setNoContactOnly(true);
      setFilterStage('all');
      return;
    }
    if (preset === 'high_budget') {
      setDealVipFilter('all');
      setContactVipFilter('all');
      setHighBudgetOnly(true);
      setNoContactOnly(false);
      setFilterStage('all');
      return;
    }
    setDealVipFilter('all');
    setContactVipFilter('all');
    setHighBudgetOnly(false);
    setNoContactOnly(false);
    setFilterStage('follow_up');
  }, []);

  if (membershipLoading || isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-none" />
        <Skeleton className="h-20 w-full rounded-none" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground pt-20 max-w-[1536px] mx-auto">
        <p className="text-lg font-medium mb-2">{isRu ? 'Нет доступа' : 'No Access'}</p>
        <p className="text-sm">{isRu ? 'Вы не являетесь членом управляющей компании' : "You're not a member of any management company"}</p>
      </div>
    );
  }

  if (dealsError) {
    return (
      <div className="p-4 md:p-6 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки сделок' : 'Failed to load deals'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchDeals()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('pt-6 pb-24 md:pb-8 space-y-4 px-4 md:px-6 lg:px-8 max-w-[1536px] mx-auto w-full')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{isRu ? 'Воронка продаж' : 'Sales Pipeline'}</h1>
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
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/mc/sales/settings')} title={isRu ? 'Настройки воронки' : 'Pipeline settings'}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/mc/sales/analytics')}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          {view === 'list' && (
            <Button
              variant={selectMode ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          )}
          <div className="flex border rounded-none overflow-hidden">
            <button
              onClick={() => { setView('list'); setSelectMode(false); setSelectedIds([]); }}
              className={cn('p-2', view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
              title={isRu ? 'Список' : 'List'}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setView('kanban'); setSelectMode(false); setSelectedIds([]); }}
              className={cn('p-2', view === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
              title="Kanban"
            >
              <Columns3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setView('pivot'); setSelectMode(false); setSelectedIds([]); }}
              className={cn('p-2', view === 'pivot' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
              title="Pivot"
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => { setCreateStage('new'); setShowCreate(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Сделка' : 'Deal'}
          </Button>
        </div>
      </div>

      {/* Status + Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Status tabs */}
        {(['active', 'on_hold', 'archived', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s === 'all' ? 'all' : s)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
            )}
          >
            {s === 'all' ? (isRu ? 'Все статусы' : 'All statuses') : (isRu ? DEAL_STATUS_LABELS[s].ru : DEAL_STATUS_LABELS[s].en)}
          </button>
        ))}
        {DEAL_TYPES.length > 1 && (
          <>
            <span className="w-px bg-border shrink-0" />
            {/* Type tabs */}
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

      {/* Pipeline Summary */}
      <PipelineSummary deals={filtered} pipelineData={pipelineData} />

      {/* Search + Agent Filter */}
      <DealSearchBar
        search={search}
        onSearchChange={setSearch}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        dealVipFilter={dealVipFilter}
        onDealVipFilterChange={setDealVipFilter}
        contactVipFilter={contactVipFilter}
        onContactVipFilterChange={setContactVipFilter}
        agents={members}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
      />

      {/* Bulk Actions */}
      {selectMode && (
        <BulkActions selectedIds={selectedIds} onClear={() => { setSelectedIds([]); setSelectMode(false); }} />
      )}

      {/* Stage filter (shared for list/kanban/pivot) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilterStage('all')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            filterStage === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
          )}
        >
          {isRu ? 'Все' : 'All'} ({filteredBeforeStage.length})
        </button>
        {overdueCount > 0 && (
          <button
            onClick={() => setFilterStage('follow_up')}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filterStage === 'follow_up' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-destructive/10 border-destructive/30 text-destructive',
            )}
          >
            🔔 Follow-up ({overdueCount})
          </button>
        )}
        {stages.map(stage => (
          <button
            key={stage.key}
            onClick={() => setFilterStage(stage.key)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filterStage === stage.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
            )}
          >
            {isRu ? stage.nameRu : stage.nameEn} ({stageCounts[stage.key] || 0})
          </button>
        ))}
      </div>

      {view === 'pivot' ? (
        <PipelinePivotTable deals={filtered} pipelineData={pipelineData} />
      ) : view === 'kanban' ? (
        <KanbanBoard deals={filtered} members={members} pipelineData={pipelineData} onQuickCreate={(stageKey) => { setCreateStage(stageKey); setShowCreate(true); }} />
      ) : (
        <>
          {/* Deals list */}
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">{isRu ? 'Сделок пока нет' : 'No deals yet'}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setCreateStage('new'); setShowCreate(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Создать первую сделку' : 'Create your first deal'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  selectable={selectMode}
                  selected={selectedIds.includes(deal.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateDealSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        companyId={membership.company_id}
        prefilledStage={createStage}
      />
    </div>
  );
}
