/**
 * BusinessPulseStrip — the founder's "where is the money coming from" row.
 *
 * 6 click-through cards:
 *   1. Active deals + pipeline value
 *   2. Weighted forecast
 *   3. New leads this month (contacts created in current month)
 *   4. Deals closing within 30 days
 *   5. Cold contacts count
 *   6. Commission MTD / QTD / Rolling-12
 *
 * Each card has a deep-link onClick — Pavel reads data fast, no menus.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useColdContactsCount } from '@/hooks/useColdContacts';
import { useCommissionRollups } from '@/hooks/useCommissionForecastSeries';
import { type AgentDeal, formatValue } from '@/hooks/useAgentDeals';
import { type DynamicPipelineResult } from '@/hooks/useDynamicPipelineStages';
import { cn } from '@/lib/utils';
import {
  Target,
  TrendingUp,
  UserPlus,
  CalendarClock,
  Snowflake,
  DollarSign,
} from 'lucide-react';

interface BusinessPulseStripProps {
  companyId: string;
  deals: AgentDeal[];
  pipelineData: DynamicPipelineResult;
  wonLostKeys: { won: string[]; lost: string[]; closed: string[] };
  className?: string;
}

/** Count of crm_contacts created in the current calendar month. */
function useLeadsThisMonth(companyId: string | undefined) {
  return useQuery({
    queryKey: ['crm-leads-this-month', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const { count, error } = await supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', start);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

export function BusinessPulseStrip({
  companyId,
  deals,
  pipelineData,
  wonLostKeys,
  className,
}: BusinessPulseStripProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: leadsThisMonth = 0 } = useLeadsThisMonth(companyId);
  const { data: coldCount = 0 } = useColdContactsCount(companyId, 30);
  const { rollups } = useCommissionRollups(companyId);

  const pulse = useMemo(() => {
    const activeDeals = deals.filter((d) => !wonLostKeys.closed.includes(d.stage));
    const totalPipeline = activeDeals.reduce(
      (s, d) => s + Number(d.deal_value || d.budget_max || 0),
      0,
    );
    const weighted = activeDeals.reduce((s, d) => {
      const val = Number(d.deal_value || d.budget_max || 0);
      return s + val * pipelineData.getProbability(d.stage);
    }, 0);
    const now = Date.now();
    const in30 = now + 30 * 24 * 60 * 60 * 1000;
    const closing30 = activeDeals.filter((d) => {
      if (!d.expected_close_date) return false;
      const ts = new Date(d.expected_close_date).getTime();
      return ts >= now && ts <= in30;
    }).length;
    return { activeCount: activeDeals.length, totalPipeline, weighted, closing30 };
  }, [deals, wonLostKeys.closed, pipelineData]);

  const cards = [
    {
      key: 'active',
      label: t('crm.pulse.activeDeals'),
      primary: String(pulse.activeCount),
      secondary: formatValue(pulse.totalPipeline),
      Icon: Target,
      tone: 'text-primary',
    },
    {
      key: 'forecast',
      label: t('crm.pulse.weightedForecast'),
      primary: formatValue(pulse.weighted),
      secondary: t('crm.pulse.commissionRolling12') + ': ' + formatValue(rollups.rolling12),
      Icon: TrendingUp,
      tone: 'text-accent',
    },
    {
      key: 'leadsMonth',
      label: t('crm.pulse.leadsMonth'),
      primary: String(leadsThisMonth),
      secondary: '',
      Icon: UserPlus,
      tone: 'text-primary',
      onClick: () => navigate('/mc/contacts?created=mtd'),
    },
    {
      key: 'closing30d',
      label: t('crm.pulse.closing30d'),
      primary: String(pulse.closing30),
      secondary: '',
      Icon: CalendarClock,
      tone: 'text-warning',
      onClick: () => navigate('/mc/sales?closing=30d'),
    },
    {
      key: 'cold',
      label: t('crm.pulse.coldCount'),
      primary: String(coldCount),
      secondary: '',
      Icon: Snowflake,
      tone: coldCount > 0 ? 'text-destructive' : 'text-muted-foreground',
      onClick: () => navigate('/mc/contacts?cold=30'),
    },
    {
      key: 'commission',
      label: t('crm.pulse.commissionMtd'),
      primary: formatValue(rollups.mtd),
      secondary: t('crm.pulse.commissionQtd') + ': ' + formatValue(rollups.qtd),
      Icon: DollarSign,
      tone: 'text-success',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2', className)}>
      {cards.map((card) => {
        const interactive = !!card.onClick;
        const Wrapper: 'button' | 'div' = interactive ? 'button' : 'div';
        return (
          <Wrapper
            key={card.key}
            type={interactive ? 'button' : undefined}
            onClick={card.onClick}
            className={cn(
              'flex flex-col items-start gap-1 border bg-card p-3 text-left',
              interactive && 'transition-colors hover:bg-muted/40 cursor-pointer',
            )}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              <card.Icon className={cn('h-3.5 w-3.5', card.tone)} strokeWidth={2} aria-hidden />
              <span>{card.label}</span>
            </div>
            <p className="font-display text-lg font-semibold leading-tight text-foreground tabular-nums">
              {card.primary}
            </p>
            {card.secondary && (
              <p className="font-mono text-[10px] text-muted-foreground tabular-nums truncate w-full">
                {card.secondary}
              </p>
            )}
          </Wrapper>
        );
      })}
    </div>
  );
}
