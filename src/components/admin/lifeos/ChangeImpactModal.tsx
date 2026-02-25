/**
 * Change Impact Preview Modal
 * Shows impact before save/delete with confirmation
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChangeImpact, ValidationResult } from '@/hooks/useLifeOSGovernance';

interface ChangeImpactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  action: 'create' | 'update' | 'delete';
  impact: ChangeImpact | null;
  validation: ValidationResult | null;
  isLoading?: boolean;
}

export function ChangeImpactModal({
  open,
  onOpenChange,
  onConfirm,
  action,
  impact,
  validation,
  isLoading,
}: ChangeImpactModalProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const actionLabels = {
    create: isRussian ? 'Создать маппинг' : 'Create Mapping',
    update: isRussian ? 'Обновить маппинг' : 'Update Mapping',
    delete: isRussian ? 'Удалить маппинг' : 'Delete Mapping',
  };

  const riskColors = {
    LOW: 'bg-success/10 text-success border-success/30',
    MEDIUM: 'bg-warning/10 text-warning border-warning/30',
    HIGH: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const isBlocked = validation?.blocked || false;
  const hasWarnings = (validation?.warnings.length || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : hasWarnings ? (
              <AlertTriangle className="w-5 h-5 text-warning" />
            ) : (
              <CheckCircle className="w-5 h-5 text-success" />
            )}
            {isRussian ? 'Предпросмотр изменений' : 'Change Preview'}
          </DialogTitle>
          <DialogDescription>
            {isRussian 
              ? 'Проверьте влияние изменения перед сохранением'
              : 'Review the impact of this change before proceeding'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Impact Summary */}
          {impact && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Затронутые сценарии' : 'Affected Situations'}
                </span>
                <Badge variant="outline">{impact.affectedSituations}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Основные блоки' : 'Primary Blocks'}
                </span>
                <Badge variant="outline">{impact.primaryBlocksImpacted}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Уровень риска' : 'Risk Level'}
                </span>
                <Badge variant="outline" className={riskColors[impact.riskLevel]}>
                  {impact.riskLevel}
                </Badge>
              </div>

              {/* Health Delta */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{isRussian ? 'Здоровье' : 'Health'}:</span>
                  <div className="flex items-center gap-2 flex-1">
                    <Progress value={impact.healthDelta.before} className="w-16 h-2" />
                    <span className="text-xs">{impact.healthDelta.before}%</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Progress 
                      value={impact.healthDelta.after} 
                      className={cn(
                        "w-16 h-2",
                        impact.healthDelta.after < impact.healthDelta.before && "[&>div]:bg-warning"
                      )} 
                    />
                    <span className={cn(
                      "text-xs",
                      impact.healthDelta.after < impact.healthDelta.before && "text-warning"
                    )}>
                      {impact.healthDelta.after}%
                    </span>
                  </div>
                </div>
              </div>

              {impact.requiresPlatformAdmin && (
                <div className="flex items-center gap-2 pt-2 text-sm text-warning">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isRussian ? 'Требуется права администратора' : 'Requires platform admin'}</span>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {validation?.errors.map((error, idx) => (
            <div key={idx} className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {isRussian ? error.messageRu : error.message}
                  </p>
                  {error.affectedSituations && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRussian ? 'Затронуто:' : 'Affected:'} {error.affectedSituations.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Warnings */}
          {validation?.warnings.map((warning, idx) => (
            <div key={idx} className="rounded-lg border border-warning/50 bg-warning/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-warning">
                    {isRussian ? warning.messageRu : warning.message}
                  </p>
                  {warning.suggestedFix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {warning.suggestedFix}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRussian ? 'Отмена' : 'Cancel'}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isBlocked || isLoading}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {isLoading ? (isRussian ? 'Сохранение...' : 'Saving...') : actionLabels[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
