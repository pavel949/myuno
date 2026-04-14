/**
 * LifeOS AI Insights Panel
 *
 * Displays AI suggestions with optional fix execution.
 * All fix actions require explicit human confirmation.
 */

import React, { useState, useCallback, forwardRef } from 'react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Database,
  Copy,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Info,
  Wrench,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AnalysisMode =
  | 'scenario_gaps'
  | 'mapping_suggestions'
  | 'catalog_hygiene'
  | 'provider_risks';

interface AISuggestion {
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

interface AnalysisResult {
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

function useLifeOSAIInsights(options: UseLifeOSAIInsightsOptions = {}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<Record<number, { success: boolean; actions: string[] }>>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (mode: AnalysisMode) => {
    setIsLoading(true);
    setError(null);
    setFixResults({});

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
        if (data.error.includes('Rate limit')) {
          toast.error(isRu ? 'Превышен лимит' : 'Rate Limited', {
            description: isRu
              ? 'Слишком много запросов. Попробуйте позже.'
              : 'Too many requests. Please try again later.',
          });
        } else if (data.error.includes('credits')) {
          toast.error(isRu ? 'Кредиты исчерпаны' : 'Credits Exhausted', {
            description: isRu
              ? 'Свяжитесь с администратором.'
              : 'Please contact the administrator.',
          });
        }
        throw new Error(data.error);
      }

      setResult(data as AnalysisResult);

      toast(isRu ? 'Анализ завершён' : 'Analysis Complete', {
        description: isRu
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
  }, [options.situationCode, options.entityType, language, isRu]);

  const applySuggestion = useCallback(async (suggestion: AISuggestion, index: number) => {
    setIsFixing(String(index));

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lifeos-ai-fix', {
        body: { suggestion, language },
      });

      if (fnError) throw new Error(fnError.message);

      if (data.error) throw new Error(data.error);

      setFixResults(prev => ({ ...prev, [index]: { success: data.success, actions: data.actions } }));

      toast(data.success
          ? (isRu ? 'Исправление применено' : 'Fix Applied')
          : (isRu ? 'Частично применено' : 'Partially Applied'), {
        description: data.actions?.[0] || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fix failed';
      setFixResults(prev => ({ ...prev, [index]: { success: false, actions: [message] } }));
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: message,
      });
    } finally {
      setIsFixing(null);
    }
  }, [language, isRu]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setFixResults({});
  }, []);

  return {
    isLoading,
    isFixing,
    fixResults,
    result,
    error,
    runAnalysis,
    applySuggestion,
    clearResult,
  };
}

function getAnalysisModeInfo(mode: AnalysisMode, isRu: boolean): {
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

function getImpactStyle(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case 'MEDIUM':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'LOW':
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getConfidenceStyle(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'HIGH':
      return 'text-success';
    case 'MEDIUM':
      return 'text-warning';
    case 'LOW':
      return 'text-muted-foreground';
  }
}
interface LifeOSAIPanelProps {
  situationCode?: string;
  entityType?: string;
  className?: string;
}

const ANALYSIS_MODES: AnalysisMode[] = [
  'scenario_gaps',
  'mapping_suggestions', 
  'catalog_hygiene',
  'provider_risks',
];

export function LifeOSAIPanel({ situationCode, entityType, className }: LifeOSAIPanelProps) {
  const { language } = useLanguage();
const isRu = language === 'ru';
  
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('scenario_gaps');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { isLoading, isFixing, fixResults, result, error, runAnalysis, applySuggestion, clearResult } = useLifeOSAIInsights({
    situationCode,
    entityType,
  });

  const handleRunAnalysis = () => {
    runAnalysis(selectedMode);
  };

  const copySuggestion = (suggestion: AISuggestion) => {
    const text = `${suggestion.reason}\n\nAction: ${suggestion.recommended_human_action}`;
    navigator.clipboard.writeText(text);
    toast(isRu ? 'Скопировано' : 'Copied', {
      description: isRu ? 'Рекомендация скопирована' : 'Suggestion copied to clipboard',
    });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {isRu ? 'ИИ Аналитик' : 'AI Insights'}
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {isRu ? 'Анализ + Фикс' : 'Analyze + Fix'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isRu 
                      ? 'Рекомендации без автоматических изменений'
                      : 'Suggestions only — no automatic changes'}
                  </CardDescription>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Mode Selection */}
            <div className="flex flex-wrap gap-2">
              {ANALYSIS_MODES.map((mode) => {
                const info = getAnalysisModeInfo(mode, isRu);
                return (
                  <Button
                    key={mode}
                    variant={selectedMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMode(mode)}
                    className="gap-1.5 text-xs"
                  >
                    {(() => { const Icon = resolveIcon(info.icon); return <Icon className="w-4 h-4" />; })()}
                    {info.label}
                  </Button>
                );
              })}
            </div>

            {/* Selected Mode Description */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{getAnalysisModeInfo(selectedMode, isRu).description}</span>
            </div>

            {/* Run Analysis Button */}
            <Button
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRu ? 'Анализирую...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {isRu ? 'Запустить анализ' : 'Run Analysis'}
                </>
              )}
            </Button>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                {/* Metadata */}
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {result.data_sources.length} {isRu ? 'источников' : 'sources'}
                  </span>
                </div>

                {/* Summary */}
                {result.summary && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {result.summary}
                  </p>
                )}

                {/* Suggestions List */}
                <ScrollArea className="h-[400px] pr-3">
                  <div className="space-y-3">
                    {result.suggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {isRu ? 'Рекомендаций не найдено' : 'No suggestions found'}
                      </p>
                    ) : (
                      result.suggestions.map((suggestion, idx) => (
                        <SuggestionCard 
                          key={idx} 
                          suggestion={suggestion} 
                          isRu={isRu}
                          onCopy={() => copySuggestion(suggestion)}
                          onFix={() => applySuggestion(suggestion, idx)}
                          isFixing={isFixing === String(idx)}
                          fixResult={fixResults[idx]}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Apply All Fixable */}
                {result.suggestions.some((s, i) => 
                  s.suggestion_type !== 'risk' && !s.governance_conflict && !fixResults[i]
                ) && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    disabled={!!isFixing}
                    onClick={async () => {
                      for (let i = 0; i < result.suggestions.length; i++) {
                        const s = result.suggestions[i];
                        if (s.suggestion_type !== 'risk' && !s.governance_conflict && !fixResults[i]) {
                          await applySuggestion(s, i);
                        }
                      }
                    }}
                  >
                    <Wrench className="w-4 h-4" />
                    {isRu ? 'Применить все исправления' : 'Apply All Fixes'}
                  </Button>
                )}

                {/* Disclaimer */}
                <Alert className="bg-muted/30">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {isRu 
                      ? 'ИИ предоставляет рекомендации. Фиксы применяются после вашей команды и логируются в аудит.'
                      : 'AI provides recommendations. Fixes are applied on your command and logged to audit.'}
                  </AlertDescription>
                </Alert>

                {/* Clear Button */}
                <Button variant="outline" size="sm" onClick={clearResult} className="w-full">
                  {isRu ? 'Очистить результаты' : 'Clear Results'}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  isRu: boolean;
  onCopy: () => void;
  onFix: () => void;
  isFixing: boolean;
  fixResult?: { success: boolean; actions: string[] };
}

const SuggestionCard = forwardRef<HTMLDivElement, SuggestionCardProps>(function SuggestionCard({ suggestion, isRu, onCopy, onFix, isFixing, fixResult }, ref) {
  const [expanded, setExpanded] = useState(false);
  const isFixed = !!fixResult;
  const canFix = suggestion.suggestion_type !== 'risk' && !suggestion.governance_conflict && !isFixed;

  return (
    <div 
      ref={ref}
      className={cn(
        "border rounded-lg p-3 space-y-2 transition-colors",
        getImpactStyle(suggestion.impact_level)
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {suggestion.suggestion_type}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn("text-[10px]", getImpactStyle(suggestion.impact_level))}
          >
            {suggestion.impact_level}
          </Badge>
          {suggestion.affected_life_situation && (
            <Badge variant="secondary" className="text-[10px]">
              📍 {suggestion.affected_life_situation}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy}>
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      {/* Reason */}
      <p className="text-sm">{suggestion.reason}</p>

      {/* Entity Info */}
      {suggestion.entity_type && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{suggestion.entity_type}</span>
          {suggestion.entity_title && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]">{suggestion.entity_title}</span>
            </>
          )}
          {suggestion.entity_id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                // Could link to entity editor in future
                navigator.clipboard.writeText(suggestion.entity_id!);
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Expandable Action */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-1 text-xs h-7">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {isRu ? 'Рекомендуемое действие' : 'Recommended Action'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="bg-background/50 p-2 rounded text-xs space-y-2">
            <p>{suggestion.recommended_human_action}</p>
            
            {/* Governance Conflict Warning */}
            {suggestion.governance_conflict && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  ⚠️ {isRu ? 'Конфликт с правилами:' : 'Governance conflict:'} {suggestion.governance_conflict}
                </AlertDescription>
              </Alert>
            )}

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {isRu ? 'Уверенность:' : 'Confidence:'}
              </span>
              <span className={cn("font-medium", getConfidenceStyle(suggestion.confidence))}>
                {suggestion.confidence}
              </span>
            </div>

            {/* Fix Button */}
            {canFix && (
              <Button
                size="sm"
                variant="default"
                className="w-full gap-2 mt-2"
                onClick={onFix}
                disabled={isFixing}
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isRu ? 'Применяю...' : 'Applying...'}
                  </>
                ) : (
                  <>
                    <Wrench className="w-3 h-3" />
                    {isRu ? 'Применить исправление' : 'Apply Fix'}
                  </>
                )}
              </Button>
            )}

            {/* Fix Result */}
            {fixResult && (
              <div className={cn(
                "p-2 rounded text-xs space-y-1 mt-2",
                fixResult.success ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"
              )}>
                <div className="flex items-center gap-1.5 font-medium">
                  {fixResult.success ? (
                    <><CheckCircle2 className="w-3 h-3 text-primary" /> {isRu ? 'Применено' : 'Applied'}</>
                  ) : (
                    <><XCircle className="w-3 h-3 text-destructive" /> {isRu ? 'Ошибка' : 'Failed'}</>
                  )}
                </div>
                {fixResult.actions.map((a, i) => (
                  <p key={i} className="text-muted-foreground">{a}</p>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

export default LifeOSAIPanel;
