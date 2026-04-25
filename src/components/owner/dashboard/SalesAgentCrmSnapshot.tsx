/**
 * SalesAgentCrmSnapshot — Unified CRM summary card for the `sales_agent`
 * dashboard. Replaces the stack of three separate widgets:
 *   - ActiveDealsWidget   (active_deals)
 *   - CrmTasksWidget      (crm_tasks)
 *   - SellSignalWidget    (sell_signal)
 *
 * Why dedupe:
 *   - All three rendered as separate cards on the OwnerDashboard for a
 *     sales_agent, while the same agent already has a dedicated workspace
 *     at /owner/crm-dashboard that surfaces the full board.
 *   - Each widget mounted its own loader and skeleton, fragmenting the page.
 *
 * Data sources are reused (TanStack cache shared with CrmDashboardPage):
 *   - useAgentDeals(companyId) → active deal counts
 *   - useTodayTasksCount()     → tasks due today
 *   - sell_signal query        → STAYS→DEALS auto-leads (deduped key)
 *
 * Single CTA → /owner/crm-dashboard for the full workspace; secondary
 * deep links go to specific filters (sell signals, tasks, sales board).
 */
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId } from '@/hooks/useAgentDeals';
import { useTodayTasksCount } from '@/hooks/useCrmTasks';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  ListTodo,
  Sparkles,
  ArrowRight,
  KanbanSquare,
} from 'lucide-react';

export function SalesAgentCrmSnapshot() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: membership } = useMyCompanyId();
  const companyId = membership?.company_id;

  const { data: dealsResult, isLoading: dealsLoading } = useAgentDeals(companyId);
  const deals = dealsResult?.data || [];
  const { data: tasksDueToday = 0 } = useTodayTasksCount();

  // Sell signals share the same query key the standalone widget used so the
  // TanStack cache stays warm across navigations.
  const { data: sellSignals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['sell-signal-deals', companyId],
    enabled: !!companyId,
    ...CACHE_PROFILES.DYNAMIC,
    queryFn: async () => {
      if (!companyId) return [] as Array<{ id: string }>;
      const { data, error } = await supabase
        .from('agent_deals')
        .select('id')
        .eq('company_id', companyId)
        .eq('deal_status', 'active')
        .eq('stage', 'new')
        .contains('tags', ['stays_signal'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) return [];
      return data ?? [];
    },
  });

  if (!membership) return null;

  const isLoading = dealsLoading || signalsLoading;

  // Pure, no-network derivations from already-cached deals
  const activeDeals = deals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost',
  );
  const hotDeals = activeDeals.filter((d) => d.stage === 'showing' || d.stage === 'negotiation');
  const reservations = activeDeals.filter((d) => d.stage === 'contract');
  const signals = sellSignals.length;

  return (
    <Card className="rounded-none border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {isRu ? 'Мой CRM' : 'My CRM'}
          </h3>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {isRu ? '· сводка для агента продаж' : '· sales agent snapshot'}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => navigate('/owner/crm-dashboard')}
        >
          {isRu ? 'Открыть CRM' : 'Open CRM'}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* KPI row */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SnapshotTile
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            value={activeDeals.length}
            label={isRu ? 'Активные сделки' : 'Active deals'}
            onClick={() => navigate('/mc/sales')}
          />
          <SnapshotTile
            icon={<TrendingUp className="h-4 w-4 text-warning" />}
            value={hotDeals.length}
            label={isRu ? 'Горячие' : 'Hot'}
            onClick={() => navigate('/mc/sales?stage=hot')}
          />
          <SnapshotTile
            icon={<Sparkles className="h-4 w-4 text-success" />}
            value={signals}
            label={isRu ? 'Сигналы STAYS' : 'STAYS signals'}
            onClick={() => navigate('/mc/contacts?source=stays')}
            highlight={signals > 0}
          />
          <SnapshotTile
            icon={<ListTodo className="h-4 w-4 text-info" />}
            value={tasksDueToday}
            label={isRu ? 'Задачи сегодня' : 'Tasks today'}
            onClick={() => navigate('/owner/crm-dashboard?tab=tasks')}
            highlight={tasksDueToday > 0}
          />
        </div>
      )}

      {/* Secondary insight: pipeline value-in-flight */}
      {!isLoading && reservations.length > 0 && (
        <div className="rounded-none border border-success/30 bg-success/5 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="rounded-none bg-success/15 text-success border-success/30">
              {reservations.length}
            </Badge>
            <span>
              {isRu
                ? 'сделок в стадии резервирования / контракта'
                : 'deals in reservation / contract stage'}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigate('/mc/sales?stage=reservation')}
          >
            {isRu ? 'Открыть' : 'Open'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeDeals.length === 0 && signals === 0 && tasksDueToday === 0 && (
        <div className="text-center text-xs text-muted-foreground py-2">
          {isRu
            ? 'Нет активных сделок, сигналов и задач — самое время добавить лид.'
            : 'No active deals, signals or tasks yet — good time to add a lead.'}
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/owner/crm-dashboard')}
            >
              {isRu ? 'Создать сделку' : 'Create deal'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SnapshotTile({
  icon,
  value,
  label,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-none border p-3 transition-colors hover:border-primary/40 ${
        highlight ? 'border-primary/40 bg-primary/5' : 'border-border/40'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">{icon}</div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground truncate">{label}</p>
    </button>
  );
}

export default SalesAgentCrmSnapshot;
