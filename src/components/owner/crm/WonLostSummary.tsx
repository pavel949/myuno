import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, formatValue, DEAL_TYPE_LABELS, DealType } from '@/hooks/useAgentDeals';
import { Trophy, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subDays, isAfter } from 'date-fns';

interface WonLostSummaryProps {
  deals: AgentDeal[];
  wonLostKeys: { won: string[]; lost: string[]; closed: string[] };
}

export function WonLostSummary({ deals, wonLostKeys }: WonLostSummaryProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const stats = useMemo(() => {
    const now = new Date();
    const d30 = subDays(now, 30);

    const wonDeals = deals.filter(d => wonLostKeys.won.includes(d.stage));
    const lostDeals = deals.filter(d => wonLostKeys.lost.includes(d.stage));
    const wonRecent = wonDeals.filter(d => d.closed_at && isAfter(new Date(d.closed_at), d30));
    const lostRecent = lostDeals.filter(d => d.closed_at && isAfter(new Date(d.closed_at), d30));

    const wonValue = wonRecent.reduce((s, d) => s + Number(d.deal_value || 0), 0);
    const lostValue = lostRecent.reduce((s, d) => s + Number(d.deal_value || 0), 0);

    // Top lost reasons
    const lostReasonMap = new Map<string, number>();
    lostDeals.forEach(d => {
      const reason = d.lost_reason || (isRu ? 'Не указана' : 'Not specified');
      lostReasonMap.set(reason, (lostReasonMap.get(reason) || 0) + 1);
    });
    const topLostReasons = [...lostReasonMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Won by deal type
    const wonByType = new Map<string, number>();
    wonRecent.forEach(d => {
      const t = d.deal_type || 'sale';
      wonByType.set(t, (wonByType.get(t) || 0) + 1);
    });

    const closedCount = wonRecent.length + lostRecent.length;
    const winRate = closedCount > 0 ? Math.round((wonRecent.length / closedCount) * 100) : 0;

    return { wonRecent, lostRecent, wonValue, lostValue, topLostReasons, wonByType, winRate };
  }, [deals, wonLostKeys, isRu]);

  if (stats.wonRecent.length === 0 && stats.lostRecent.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Won */}
      <div className="rounded-none border border-success/30 bg-success/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-success" />
            <span className="text-xs font-semibold text-success">{isRu ? 'Выиграно (30д)' : 'Won (30d)'}</span>
          </div>
          <span className="text-sm font-bold text-success flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            {stats.wonRecent.length}
          </span>
        </div>
        <p className="text-lg font-bold">{formatValue(stats.wonValue)}</p>
        {stats.wonByType.size > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...stats.wonByType.entries()].map(([type, count]) => (
              <span key={type} className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                {isRu ? DEAL_TYPE_LABELS[type as DealType]?.ru : DEAL_TYPE_LABELS[type as DealType]?.en}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lost */}
      <div className="rounded-none border border-destructive/30 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{isRu ? 'Проиграно (30д)' : 'Lost (30d)'}</span>
          </div>
          <span className="text-sm font-bold text-destructive flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" />
            {stats.lostRecent.length}
          </span>
        </div>
        <p className="text-lg font-bold">{formatValue(stats.lostValue)}</p>
        {stats.topLostReasons.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">{isRu ? 'Причины:' : 'Reasons:'}</p>
            {stats.topLostReasons.map(([reason, count]) => (
              <div key={reason} className="flex justify-between text-[10px]">
                <span className="truncate text-foreground">{reason}</span>
                <span className="text-muted-foreground ml-2 shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
