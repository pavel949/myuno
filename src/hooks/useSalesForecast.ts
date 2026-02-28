/**
 * @module useSalesForecast
 * Calculate weighted pipeline forecast from deals + pipeline stages
 */
import { useMemo } from 'react';
import { AgentDeal } from '@/hooks/useAgentDeals';
import { PipelineWithStages } from '@/hooks/useCrmPipelines';

export interface ForecastData {
  weightedTotal: number;
  bestCase: number;
  committed: number;
  closedWon: number;
  closedLost: number;
  totalPipeline: number;
  byStage: { stageId: string; stageName: string; count: number; value: number; weighted: number; probability: number }[];
  byAgent: { agentId: string; agentName: string; weighted: number; deals: number }[];
  winRate: number;
}

export function useSalesForecast(
  deals: AgentDeal[],
  pipeline: PipelineWithStages | undefined,
  agentMap?: Map<string, string>,
): ForecastData {
  return useMemo(() => {
    if (!pipeline || !deals.length) {
      return {
        weightedTotal: 0, bestCase: 0, committed: 0,
        closedWon: 0, closedLost: 0, totalPipeline: 0,
        byStage: [], byAgent: [], winRate: 0,
      };
    }

    const stageProb = new Map<string, number>();
    const stageNames = new Map<string, string>();
    const wonStages = new Set<string>();
    const lostStages = new Set<string>();

    for (const s of pipeline.stages) {
      stageProb.set(s.name_en.toLowerCase().replace(/\s/g, '_'), s.probability / 100);
      stageNames.set(s.name_en.toLowerCase().replace(/\s/g, '_'), s.name_en);
      if (s.is_won) wonStages.add(s.name_en.toLowerCase().replace(/\s/g, '_'));
      if (s.is_lost) lostStages.add(s.name_en.toLowerCase().replace(/\s/g, '_'));
    }

    // Fallback: use hardcoded stage names mapping
    const getProb = (stage: string) => stageProb.get(stage) ?? (
      stage === 'new' ? 0.1 : stage === 'contacted' ? 0.2 : stage === 'showing' ? 0.4 :
      stage === 'negotiation' ? 0.6 : stage === 'contract' ? 0.8 :
      stage === 'closed_won' ? 1 : 0
    );

    let weightedTotal = 0;
    let bestCase = 0;
    let committed = 0;
    let closedWon = 0;
    let closedLost = 0;
    let totalPipeline = 0;
    let closedCount = 0;
    let wonCount = 0;

    const stageAccum = new Map<string, { count: number; value: number; weighted: number }>();
    const agentAccum = new Map<string, { weighted: number; deals: number }>();

    for (const d of deals) {
      const val = Number(d.deal_value || d.budget_max || 0);
      const prob = getProb(d.stage);
      const w = val * prob;

      if (d.stage === 'closed_won' || wonStages.has(d.stage)) {
        closedWon += val;
        wonCount++;
        closedCount++;
      } else if (d.stage === 'closed_lost' || lostStages.has(d.stage)) {
        closedLost += val;
        closedCount++;
      } else {
        weightedTotal += w;
        bestCase += val;
        if (prob >= 0.8) committed += val;
        totalPipeline += val;
      }

      // Stage breakdown
      const acc = stageAccum.get(d.stage) || { count: 0, value: 0, weighted: 0 };
      acc.count++;
      acc.value += val;
      acc.weighted += w;
      stageAccum.set(d.stage, acc);

      // Agent breakdown
      const agentAcc = agentAccum.get(d.agent_id) || { weighted: 0, deals: 0 };
      agentAcc.weighted += w;
      agentAcc.deals++;
      agentAccum.set(d.agent_id, agentAcc);
    }

    const byStage = Array.from(stageAccum.entries()).map(([stageId, acc]) => ({
      stageId,
      stageName: stageNames.get(stageId) || stageId,
      ...acc,
      probability: getProb(stageId) * 100,
    }));

    const byAgent = Array.from(agentAccum.entries()).map(([agentId, acc]) => ({
      agentId,
      agentName: agentMap?.get(agentId) || agentId.slice(0, 8),
      ...acc,
    })).sort((a, b) => b.weighted - a.weighted);

    const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

    return { weightedTotal, bestCase, committed, closedWon, closedLost, totalPipeline, byStage, byAgent, winRate };
  }, [deals, pipeline, agentMap]);
}
