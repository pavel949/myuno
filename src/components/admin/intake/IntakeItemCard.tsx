import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { IntakeItem } from '@/hooks/useIntakeAgent';
import { IntakeVerticalBadge } from './IntakeVerticalBadge';
import { IntakeConfidenceBar } from './IntakeConfidenceBar';
import { INTAKE_VERTICALS } from '@/lib/intakeVerticals';
import { validateIntakeItem, describeValidation } from '@/lib/intake/validateItem';
import { 
  Check, 
  X, 
  Pencil, 
  AlertTriangle, 
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntakeItemCardProps {
  item: IntakeItem;
  onApprove: () => void;
  onDiscard: () => void;
  onEdit: () => void;
  isApproving?: boolean;
}

export function IntakeItemCard({ 
  item, 
  onApprove, 
  onDiscard, 
  onEdit,
  isApproving 
}: IntakeItemCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const vertical = INTAKE_VERTICALS.find(v => v.id === item.detectedVertical);
  const title = isRu 
    ? item.suggestedTitle?.ru || item.suggestedTitle?.en 
    : item.suggestedTitle?.en || item.suggestedTitle?.ru;

  // Get display fields (top 4 most important)
  const displayFields = Object.entries(item.extractedFields)
    .filter(([key]) => !['name_en', 'name_ru', 'description_en', 'description_ru'].includes(key))
    .slice(0, 4);

  const isCompleted = item.status === 'created' || item.status === 'discarded';
  const validation = validateIntakeItem(item);
  const { missingText, warningText } = describeValidation(validation, isRu, vertical?.fieldLabels);
  const hasMissingFields = !validation.valid;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <Card className={cn(
      "transition-all group",
      "lg:hover:shadow-md lg:hover:border-primary/20",
      item.status === 'created' && "border-success/50 bg-success/5",
      item.status === 'discarded' && "border-muted bg-muted/30 opacity-60"
    )}>
      <CardHeader className="pb-2 lg:pb-1.5 lg:pt-3 lg:px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <IntakeVerticalBadge 
                verticalId={item.detectedVertical} 
                confidence={item.verticalConfidence}
                size="sm"
              />
              {item.sourceUrl && (
                <a 
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <h3 className="font-semibold truncate">
              {title || (isRu ? 'Без названия' : 'Untitled')}
            </h3>
          </div>
          
          {/* Status indicator */}
          {item.status === 'created' && (
            <Badge className="bg-success text-success-foreground shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isRu ? 'Создан' : 'Created'}
            </Badge>
          )}
          {item.status === 'discarded' && (
            <Badge variant="secondary" className="shrink-0">
              <XCircle className="h-3 w-3 mr-1" />
              {isRu ? 'Отклонён' : 'Discarded'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 lg:space-y-2 lg:px-3 lg:pb-3">
        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{isRu ? 'Уверенность' : 'Confidence'}</span>
          </div>
          <IntakeConfidenceBar value={item.overallConfidence} size="sm" />
        </div>

        {/* Extracted fields preview */}
        {displayFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {displayFields.map(([key, field]) => {
              const fieldConfig = vertical?.fieldLabels[key];
              const label = fieldConfig 
                ? (isRu ? fieldConfig.ru : fieldConfig.en)
                : key;
              
              return (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-muted-foreground truncate">{label}</span>
                  <span className="font-medium truncate">
                    {String(field.value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Warnings */}
        {(hasMissingFields || hasWarnings) && (
          <div className="space-y-1">
            {hasMissingFields && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {isRu ? 'Не хватает: ' : 'Missing: '}
                  {missingText}
                </span>
              </div>
            )}
            {hasWarnings && (
              <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 p-2 rounded">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{warningText}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isCompleted && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Редакт.' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isApproving || hasMissingFields}
              className="flex-1"
              title={hasMissingFields ? (isRu ? `Не хватает: ${missingText}` : `Missing: ${missingText}`) : undefined}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Создать' : 'Create'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
