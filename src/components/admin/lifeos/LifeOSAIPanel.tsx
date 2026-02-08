/**
 * LifeOS AI Insights Panel - READ-ONLY Analysis
 * 
 * Displays AI suggestions without auto-execution.
 * All actions require explicit human confirmation.
 */

import React, { useState } from 'react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useLifeOSAIInsights, 
  getAnalysisModeInfo, 
  getImpactStyle,
  getConfidenceStyle,
  type AnalysisMode,
  type AISuggestion,
} from '@/hooks/useLifeOSAIInsights';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const isRu = language === 'ru';
  
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('scenario_gaps');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { isLoading, result, error, runAnalysis, clearResult } = useLifeOSAIInsights({
    situationCode,
    entityType,
  });

  const handleRunAnalysis = () => {
    runAnalysis(selectedMode);
  };

  const copySuggestion = (suggestion: AISuggestion) => {
    const text = `${suggestion.reason}\n\nAction: ${suggestion.recommended_human_action}`;
    navigator.clipboard.writeText(text);
    toast({
      title: isRu ? 'Скопировано' : 'Copied',
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
                      {isRu ? 'Только чтение' : 'Read-Only'}
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
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Disclaimer */}
                <Alert className="bg-muted/30">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {result.disclaimer}
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
}

function SuggestionCard({ suggestion, isRu, onCopy }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default LifeOSAIPanel;
