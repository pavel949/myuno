import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IntakeSummary } from '@/hooks/useIntakeAgent';
import { CheckCircle, Loader2, RotateCcw, Sparkles } from 'lucide-react';

interface IntakeBulkActionsProps {
  summary: IntakeSummary;
  onApproveAll: () => void;
  onReset: () => void;
  isApproving: boolean;
  approvedCount: number;
  discardedCount: number;
}

export function IntakeBulkActions({ 
  summary, 
  onApproveAll, 
  onReset, 
  isApproving,
  approvedCount,
  discardedCount
}: IntakeBulkActionsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const pendingCount = summary.total - approvedCount - discardedCount;
  const allProcessed = pendingCount === 0;

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-none border">
      <div className="flex items-center gap-4">
        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {summary.total} {isRu ? 'всего' : 'total'}
          </Badge>
          {approvedCount > 0 && (
            <Badge className="bg-success text-success-foreground">
              {approvedCount} {isRu ? 'создано' : 'created'}
            </Badge>
          )}
          {discardedCount > 0 && (
            <Badge variant="outline">
              {discardedCount} {isRu ? 'отклонено' : 'discarded'}
            </Badge>
          )}
        </div>

        {/* Verticals breakdown */}
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          {Object.entries(summary.byVertical).slice(0, 3).map(([vertical, count]) => (
            <span key={vertical} className="px-2 py-0.5 bg-background rounded-none">
              {vertical}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Average confidence */}
        <div className="hidden sm:flex items-center gap-1 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            {isRu ? 'Уверенность:' : 'Confidence:'}
          </span>
          <span className="font-medium">
            {Math.round(summary.avgConfidence * 100)}%
          </span>
        </div>

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          {isRu ? 'Сброс' : 'Reset'}
        </Button>

        {!allProcessed && (
          <Button 
            size="sm" 
            onClick={onApproveAll}
            disabled={isApproving || summary.readyToApprove === 0}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                {isRu ? 'Создаю...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                {isRu 
                  ? `Создать все (${summary.readyToApprove})` 
                  : `Create All (${summary.readyToApprove})`
                }
              </>
            )}
          </Button>
        )}

        {allProcessed && (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isRu ? 'Готово!' : 'Done!'}
          </Badge>
        )}
      </div>
    </div>
  );
}
