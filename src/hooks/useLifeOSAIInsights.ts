/**
 * useLifeOSAIInsights - Hook for READ-ONLY AI analysis of LifeOS
 * 
 * All outputs are suggestions only - no auto-execution
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export type AnalysisMode = 
  | 'scenario_gaps'
  | 'mapping_suggestions'
  | 'catalog_hygiene'
  | 'provider_risks';

export interface AISuggestion {
  suggestion_type: 'coverage' | 'mapping' | 'hygiene' | 'risk';
  affected_life_situation: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_title: string | null;
  reason: string;
  impact_level: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_human_action: string;
  governance_conflict: string | null;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AnalysisResult {
  mode: AnalysisMode;
  timestamp: string;
  data_sources: string[];
  suggestions: AISuggestion[];
  summary: string;
  disclaimer: string;
}

interface UseLifeOSAIInsightsOptions {
  situationCode?: string;
  entityType?: string;
}

export function useLifeOSAIInsights(options: UseLifeOSAIInsightsOptions = {}) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (mode: AnalysisMode) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lifeos-ai-analyst', {
        body: {
          mode,
          situationCode: options.situationCode,
          entityType: options.entityType,
          language,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        // Handle specific error codes
        if (data.error.includes('Rate limit')) {
          toast({
            title: language === 'ru' ? 'Превышен лимит' : 'Rate Limited',
            description: language === 'ru' 
              ? 'Слишком много запросов. Попробуйте позже.'
              : 'Too many requests. Please try again later.',
            variant: 'destructive',
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: language === 'ru' ? 'Кредиты исчерпаны' : 'Credits Exhausted',
            description: language === 'ru'
              ? 'Свяжитесь с администратором.'
              : 'Please contact the administrator.',
            variant: 'destructive',
          });
        }
        throw new Error(data.error);
      }

      setResult(data as AnalysisResult);
      
      toast({
        title: language === 'ru' ? 'Анализ завершён' : 'Analysis Complete',
        description: language === 'ru'
          ? `Найдено ${data.suggestions?.length || 0} рекомендаций`
          : `Found ${data.suggestions?.length || 0} suggestions`,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      console.error('[useLifeOSAIInsights] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [options.situationCode, options.entityType, language, toast]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    runAnalysis,
    clearResult,
  };
}

/**
 * Get mode display info
 */
export function getAnalysisModeInfo(mode: AnalysisMode, isRu: boolean): { 
  label: string; 
  description: string;
  icon: string;
} {
  const modes: Record<AnalysisMode, { label: string; labelRu: string; description: string; descriptionRu: string; icon: string }> = {
    scenario_gaps: {
      label: 'Scenario Gaps',
      labelRu: 'Пробелы сценариев',
      description: 'Find missing or weak coverage in life situations',
      descriptionRu: 'Найти недостающее покрытие в жизненных ситуациях',
      icon: '🔍',
    },
    mapping_suggestions: {
      label: 'Mapping Ideas',
      labelRu: 'Идеи маппинга',
      description: 'Suggest entities to add or weight adjustments',
      descriptionRu: 'Предложить сущности для добавления или корректировки весов',
      icon: '💡',
    },
    catalog_hygiene: {
      label: 'Catalog Hygiene',
      labelRu: 'Гигиена каталога',
      description: 'Detect duplicates, inconsistencies, missing data',
      descriptionRu: 'Обнаружить дубликаты, несоответствия, пропущенные данные',
      icon: '🧹',
    },
    provider_risks: {
      label: 'Provider Risks',
      labelRu: 'Риски провайдеров',
      description: 'Identify providers needing education or guidance',
      descriptionRu: 'Определить провайдеров, нуждающихся в обучении',
      icon: '⚠️',
    },
  };

  const info = modes[mode];
  return {
    label: isRu ? info.labelRu : info.label,
    description: isRu ? info.descriptionRu : info.description,
    icon: info.icon,
  };
}

/**
 * Get impact level styling
 */
export function getImpactStyle(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'MEDIUM':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'LOW':
      return 'bg-muted text-muted-foreground border-border';
  }
}

/**
 * Get confidence level styling
 */
export function getConfidenceStyle(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return 'text-success';
    case 'MEDIUM':
      return 'text-warning';
    case 'LOW':
      return 'text-muted-foreground';
  }
}
