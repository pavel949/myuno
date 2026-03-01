/**
 * @module useDynamicPipelineStages
 * Provides dynamic pipeline stages from crm_pipeline_stages, with fallback to hardcoded defaults.
 * Used across all sales pipeline UI components.
 */
import { useMemo } from 'react';
import { useCrmPipelines, CrmPipelineStage, PipelineWithStages } from '@/hooks/useCrmPipelines';
import { DEAL_STAGES, DEAL_STAGE_LABELS, STAGE_PROBABILITIES, DealStage } from '@/hooks/useAgentDeals';

export interface DynamicStage {
  key: string;
  nameEn: string;
  nameRu: string;
  shortEn: string;
  shortRu: string;
  probability: number;
  color: string;
  barColor: string;
  borderColor: string;
  isWon: boolean;
  isLost: boolean;
  sortOrder: number;
}

const COLOR_MAP: Record<string, { bar: string; border: string }> = {
  primary: { bar: 'bg-primary', border: 'border-t-primary' },
  info: { bar: 'bg-info', border: 'border-t-info' },
  warning: { bar: 'bg-warning', border: 'border-t-warning' },
  success: { bar: 'bg-success', border: 'border-t-success' },
  destructive: { bar: 'bg-destructive', border: 'border-t-destructive' },
  accent: { bar: 'bg-accent-foreground', border: 'border-t-accent-foreground' },
};

function getColors(color: string | null) {
  const c = COLOR_MAP[color || 'primary'] || COLOR_MAP.primary;
  return c;
}

/** Convert a CrmPipelineStage to our unified DynamicStage format */
function toDynamic(s: CrmPipelineStage): DynamicStage {
  const colors = getColors(s.color);
  return {
    key: s.id,
    nameEn: s.name_en,
    nameRu: s.name_ru,
    shortEn: s.name_en.slice(0, 4),
    shortRu: s.name_ru.slice(0, 3),
    probability: s.probability / 100,
    color: s.color || 'primary',
    barColor: colors.bar,
    borderColor: colors.border,
    isWon: s.is_won,
    isLost: s.is_lost,
    sortOrder: s.sort_order,
  };
}

/** Build default stages from hardcoded DEAL_STAGES */
function buildDefaults(): DynamicStage[] {
  const colorMapping: Record<DealStage, string> = {
    new: 'primary',
    contacted: 'info',
    showing: 'warning',
    negotiation: 'warning',
    contract: 'accent',
    closed_won: 'success',
    closed_lost: 'destructive',
  };

  return DEAL_STAGES.map((key, idx) => {
    const labels = DEAL_STAGE_LABELS[key];
    const color = colorMapping[key];
    const colors = getColors(color);
    return {
      key,
      nameEn: labels.en,
      nameRu: labels.ru,
      shortEn: labels.short,
      shortRu: labels.shortRu,
      probability: STAGE_PROBABILITIES[key],
      color,
      barColor: colors.bar,
      borderColor: colors.border,
      isWon: key === 'closed_won',
      isLost: key === 'closed_lost',
      sortOrder: idx,
    };
  });
}

export interface DynamicPipelineResult {
  pipelines: PipelineWithStages[];
  activePipeline: PipelineWithStages | null;
  stages: DynamicStage[];
  activeStages: DynamicStage[]; // excludes lost
  isLoading: boolean;
  /** Map stage key → DynamicStage for quick lookups */
  stageMap: Map<string, DynamicStage>;
  /** Get probability by stage key */
  getProbability: (stageKey: string) => number;
  /** Get label by stage key */
  getLabel: (stageKey: string, isRu: boolean) => string;
  /** Get short label */
  getShortLabel: (stageKey: string, isRu: boolean) => string;
}

export function useDynamicPipelineStages(
  companyId: string | undefined,
  selectedPipelineId?: string | null
): DynamicPipelineResult {
  const { data: pipelines = [], isLoading } = useCrmPipelines(companyId);

  return useMemo(() => {
    // Find active pipeline
    let activePipeline: PipelineWithStages | null = null;
    if (selectedPipelineId) {
      activePipeline = pipelines.find(p => p.id === selectedPipelineId) || null;
    }
    if (!activePipeline && pipelines.length > 0) {
      activePipeline = pipelines.find(p => p.is_default) || pipelines[0];
    }

    // Build stages
    let stages: DynamicStage[];
    if (activePipeline && activePipeline.stages.length > 0) {
      stages = activePipeline.stages
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toDynamic);
    } else {
      stages = buildDefaults();
    }

    const activeStages = stages.filter(s => !s.isLost);
    const stageMap = new Map(stages.map(s => [s.key, s]));

    return {
      pipelines,
      activePipeline,
      stages,
      activeStages,
      isLoading,
      stageMap,
      getProbability: (key: string) => stageMap.get(key)?.probability ?? 0,
      getLabel: (key: string, isRu: boolean) => {
        const s = stageMap.get(key);
        return s ? (isRu ? s.nameRu : s.nameEn) : key;
      },
      getShortLabel: (key: string, isRu: boolean) => {
        const s = stageMap.get(key);
        return s ? (isRu ? s.shortRu : s.shortEn) : key;
      },
    };
  }, [pipelines, selectedPipelineId, isLoading]);
}
