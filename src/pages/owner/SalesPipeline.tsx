import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { DealCard } from '@/components/owner/sales/DealCard';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SalesPipeline() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const { data: deals = [], isLoading } = useAgentDeals(membership?.company_id);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStage, setFilterStage] = useState<DealStage | 'all'>('all');

  const filtered = useMemo(() => {
    if (filterStage === 'all') return deals;
    return deals.filter(d => d.stage === filterStage);
  }, [deals, filterStage]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of deals) {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    }
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
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Воронка продаж' : 'Sales Pipeline'}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Сделка' : 'Deal'}
        </Button>
      </div>

      {/* Stage summary */}
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
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      <CreateDealSheet open={showCreate} onOpenChange={setShowCreate} companyId={membership.company_id} />
    </div>
  );
}
