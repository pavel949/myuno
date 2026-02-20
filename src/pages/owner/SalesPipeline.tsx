import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPast, isToday } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, useCompanyMembers, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { DealCard } from '@/components/owner/sales/DealCard';
import { KanbanBoard } from '@/components/owner/sales/KanbanBoard';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { DealSearchBar } from '@/components/owner/sales/DealSearchBar';
import { PipelineSummary } from '@/components/owner/sales/PipelineSummary';
import { BulkActions } from '@/components/owner/sales/BulkActions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutList, Columns3, BarChart3, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SalesPipeline() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const { data: deals = [], isLoading } = useAgentDeals(membership?.company_id);
  const { data: members = [] } = useCompanyMembers(membership?.company_id);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStage, setFilterStage] = useState<DealStage | 'all' | 'follow_up'>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const overdueCount = useMemo(() => {
    return deals.filter(d => {
      if (d.stage === 'closed_won' || d.stage === 'closed_lost') return false;
      if (!d.next_action_date) return false;
      const nd = new Date(d.next_action_date);
      return isPast(nd) || isToday(nd);
    }).length;
  }, [deals]);

  const filtered = useMemo(() => {
    let result = deals;

    // Agent filter
    if (agentFilter !== 'all') {
      result = result.filter(d => d.agent_id === agentFilter);
    }

    // Stage filter
    if (filterStage === 'follow_up') {
      result = result.filter(d => {
        if (d.stage === 'closed_won' || d.stage === 'closed_lost') return false;
        if (!d.next_action_date) return false;
        const nd = new Date(d.next_action_date);
        return isPast(nd) || isToday(nd);
      });
    } else if (filterStage !== 'all') {
      result = result.filter(d => d.stage === filterStage);
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.client_name.toLowerCase().includes(q) ||
        d.client_phone?.toLowerCase().includes(q) ||
        d.client_email?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [deals, filterStage, search, agentFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of deals) counts[d.stage] = (counts[d.stage] || 0) + 1;
    return counts;
  }, [deals]);

  if (membershipLoading || isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="p-4 text-center text-muted-foreground pt-20 max-w-lg mx-auto">
        <p className="text-lg font-medium mb-2">{isRu ? 'Нет доступа' : 'No Access'}</p>
        <p className="text-sm">{isRu ? 'Вы не являетесь членом управляющей компании' : "You're not a member of any management company"}</p>
      </div>
    );
  }

  const activeStages = DEAL_STAGES.filter(s => s !== 'closed_won' && s !== 'closed_lost');

  return (
    <div className={cn('pt-6 pb-24 space-y-4', view === 'kanban' ? 'px-4' : 'px-4 max-w-lg mx-auto')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Воронка продаж' : 'Sales Pipeline'}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/owner/sales/analytics')}>
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
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => { setView('list'); setSelectMode(false); setSelectedIds([]); }}
              className={cn('p-2', view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setView('kanban'); setSelectMode(false); setSelectedIds([]); }}
              className={cn('p-2', view === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground')}
            >
              <Columns3 className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isRu ? 'Сделка' : 'Deal'}
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <PipelineSummary deals={deals} />

      {/* Search + Agent Filter */}
      <DealSearchBar
        search={search}
        onSearchChange={setSearch}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        agents={members}
      />

      {/* Bulk Actions */}
      {selectMode && (
        <BulkActions selectedIds={selectedIds} onClear={() => { setSelectedIds([]); setSelectMode(false); }} />
      )}

      {view === 'kanban' ? (
        <KanbanBoard deals={filtered} />
      ) : (
        <>
          {/* Stage filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setFilterStage('all')}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                filterStage === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
              )}
            >
              {isRu ? 'Все' : 'All'} ({deals.length})
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
            {activeStages.map(stage => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  filterStage === stage ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
                )}
              >
                {isRu ? DEAL_STAGE_LABELS[stage].ru : DEAL_STAGE_LABELS[stage].en} ({stageCounts[stage] || 0})
              </button>
            ))}
          </div>

          {/* Deals list */}
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">{isRu ? 'Сделок пока нет' : 'No deals yet'}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Создать первую сделку' : 'Create your first deal'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
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

      <CreateDealSheet open={showCreate} onOpenChange={setShowCreate} companyId={membership.company_id} />
    </div>
  );
}
