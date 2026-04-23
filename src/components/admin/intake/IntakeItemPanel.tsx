/**
 * IntakeItemPanel — Inline detail panel for intake items (desktop lg+ only).
 * Replaces the need to open a separate editor dialog for quick inspection.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PanelSection } from '@/components/uno/PersistentPanelLayout';
import { IntakeItem } from '@/hooks/useIntakeAgent';
import { IntakeVerticalBadge } from './IntakeVerticalBadge';
import { IntakeConfidenceBar } from './IntakeConfidenceBar';
import { INTAKE_VERTICALS } from '@/lib/intakeVerticals';
import { 
  Check, X, Pencil, AlertTriangle, ExternalLink, 
  CheckCircle, XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntakeItemPanelProps {
  item: IntakeItem;
  onApprove: () => void;
  onDiscard: () => void;
  onEdit: () => void;
  isApproving?: boolean;
}

export function IntakeItemPanel({ 
  item, onApprove, onDiscard, onEdit, isApproving 
}: IntakeItemPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const vertical = INTAKE_VERTICALS.find(v => v.id === item.detectedVertical);
  const title = isRu 
    ? item.suggestedTitle?.ru || item.suggestedTitle?.en 
    : item.suggestedTitle?.en || item.suggestedTitle?.ru;

  const allFields = Object.entries(item.extractedFields)
    .filter(([key]) => !['name_en', 'name_ru', 'description_en', 'description_ru'].includes(key));

  const isCompleted = item.status === 'created' || item.status === 'discarded';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <IntakeVerticalBadge verticalId={item.detectedVertical} confidence={item.verticalConfidence} size="sm" />
          {item.status === 'created' && (
            <Badge className="bg-success text-success-foreground text-[10px] h-5">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
              {isRu ? 'Создан' : 'Created'}
            </Badge>
          )}
          {item.status === 'discarded' && (
            <Badge variant="secondary" className="text-[10px] h-5">
              <XCircle className="h-2.5 w-2.5 mr-0.5" />
              {isRu ? 'Отклонён' : 'Discarded'}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-sm">
          {title || (isRu ? 'Без названия' : 'Untitled')}
        </h3>
        {item.sourceUrl && (
          <a 
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            {isRu ? 'Источник' : 'Source'}
          </a>
        )}
      </div>

      {/* Confidence */}
      <PanelSection title={isRu ? 'Уверенность' : 'Confidence'}>
        <IntakeConfidenceBar value={item.overallConfidence} size="sm" />
      </PanelSection>

      {/* All extracted fields */}
      <PanelSection title={isRu ? 'Извлечённые данные' : 'Extracted Fields'}>
        <div className="space-y-1.5">
          {allFields.map(([key, field]) => {
            const fieldConfig = vertical?.fieldLabels[key];
            const label = fieldConfig 
              ? (isRu ? fieldConfig.ru : fieldConfig.en)
              : key;
            
            return (
              <div key={key} className="flex justify-between gap-2 text-xs">
                <span className="text-muted-foreground truncate shrink-0">{label}</span>
                <span className="font-medium truncate text-right">{String(field.value)}</span>
              </div>
            );
          })}
          {allFields.length === 0 && (
            <p className="text-xs text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</p>
          )}
        </div>
      </PanelSection>

      {/* Warnings */}
      {(item.missingRequiredFields.length > 0 || item.warnings.length > 0) && (
        <PanelSection title={isRu ? 'Предупреждения' : 'Warnings'}>
          <div className="space-y-1">
            {item.missingRequiredFields.length > 0 && (
              <div className="flex items-start gap-1.5 text-[10px] text-warning bg-warning/10 p-1.5 rounded-none">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{isRu ? 'Нет: ' : 'Missing: '}{item.missingRequiredFields.join(', ')}</span>
              </div>
            )}
            {item.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded-none">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </PanelSection>
      )}

      {/* Actions */}
      {!isCompleted && (
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            {isRu ? 'Редакт.' : 'Edit'}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={onDiscard}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={onApprove} disabled={isApproving}>
            <Check className="h-3 w-3 mr-1" />
            {isRu ? 'Создать' : 'Create'}
          </Button>
        </div>
      )}
    </div>
  );
}
