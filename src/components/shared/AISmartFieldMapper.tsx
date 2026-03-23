import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  reason?: string;
}

interface TargetField {
  name: string;
  label: string;
  required: boolean;
}

interface AISmartFieldMapperProps {
  sourceColumns: string[];
  targetFields: TargetField[];
  sampleData?: Record<string, string>[];
  onMappingsGenerated: (mappings: FieldMapping[]) => void;
}

export function AISmartFieldMapper({
  sourceColumns,
  targetFields,
  sampleData,
  onMappingsGenerated,
}: AISmartFieldMapperProps) {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    mappings: FieldMapping[];
    unmappedColumns: string[];
  } | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-data', {
        body: {
          type: 'field-mapping',
          sourceColumns,
          targetFields,
          sampleData,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const result = data.result;
      setLastResult(result);
      
      // Filter high-confidence mappings
      const confidentMappings = result.mappings.filter(
        (m: FieldMapping) => m.confidence >= 0.7
      );
      
      onMappingsGenerated(confidentMappings);
      
      toast.success(
        language === 'ru'
          ? `Найдено ${confidentMappings.length} совпадений`
          : `Found ${confidentMappings.length} mappings`
      );
    } catch (err) {
      logger.error('AI mapping error:', err);
      toast.error(
        language === 'ru'
          ? 'Ошибка AI анализа'
          : 'AI analysis failed'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing || sourceColumns.length === 0}
        className="gap-2"
      >
        {isAnalyzing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {language === 'ru' ? 'AI Маппинг' : 'AI Smart Map'}
      </Button>

      {lastResult && (
        <div className="text-xs space-y-2">
          <div className="flex flex-wrap gap-1">
            {lastResult.mappings.map((m, i) => (
              <Badge
                key={i}
                variant={m.confidence >= 0.8 ? 'default' : 'secondary'}
                className="text-[10px]"
              >
                {m.confidence >= 0.8 ? (
                  <Check className="h-2 w-2 mr-1" />
                ) : (
                  <AlertCircle className="h-2 w-2 mr-1" />
                )}
                {m.sourceColumn} → {m.targetField}
                <span className="ml-1 opacity-60">
                  {Math.round(m.confidence * 100)}%
                </span>
              </Badge>
            ))}
          </div>
          {lastResult.unmappedColumns.length > 0 && (
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Не распознаны: ' : 'Unmapped: '}
              {lastResult.unmappedColumns.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
