import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface Props {
  deals: AgentDeal[];
  agents: { user_id: string; name: string }[];
}

export function AgentLeaderboard({ deals, agents }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const leaderboard = useMemo(() => {
    const map: Record<string, { name: string; won: number; total: number; volume: number }> = {};
    for (const a of agents) {
      map[a.user_id] = { name: a.name, won: 0, total: 0, volume: 0 };
    }
    for (const d of deals) {
      if (!map[d.agent_id]) map[d.agent_id] = { name: d.agent_id.slice(0, 8), won: 0, total: 0, volume: 0 };
      map[d.agent_id].total++;
      if (d.stage === 'closed_won') {
        map[d.agent_id].won++;
        map[d.agent_id].volume += Number(d.deal_value || 0);
      }
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data, rate: data.total ? Math.round((data.won / data.total) * 100) : 0 }))
      .sort((a, b) => b.won - a.won || b.volume - a.volume);
  }, [deals, agents]);

  if (leaderboard.length === 0) return null;

  return (
    <div className="border rounded-none p-4 bg-card">
      <p className="text-sm font-medium mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent-amber" />
        {isRu ? 'Рейтинг агентов' : 'Agent Leaderboard'}
      </p>
      <div className="space-y-2">
        {leaderboard.slice(0, 5).map((a, idx) => (
          <div key={a.id} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-center font-bold text-muted-foreground">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{a.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{a.won}/{a.total}</span>
                <span>{a.rate}%</span>
                {a.volume > 0 && (
                  <span className="flex items-center gap-1 text-success">
                    <TrendingUp className="h-3 w-3" />{(a.volume / 1e6).toFixed(1)}M
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
