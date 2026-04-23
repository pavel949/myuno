/**
 * ProviderFieldHints - Displays contextual hints and warnings from provider_input_rules
 * Integrated with forms to improve catalog quality through non-blocking guidance
 */

import React from 'react';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProviderInputValidation } from '@/hooks/useProviderInputValidation';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProviderFieldHintsProps {
  /** Entity type for fetching relevant rules (e.g., 'property', 'service') */
  entityType: string;
  /** Field name to show hints for */
  fieldName: string;
  /** Current field value (used for conditional warnings) */
  value?: unknown;
  /** Additional CSS classes */
  className?: string;
  /** Show only hint, only warning, or both */
  showType?: 'hint' | 'warning' | 'both';
}

export function ProviderFieldHints({
  entityType,
  fieldName,
  value,
  className,
  showType = 'both',
}: ProviderFieldHintsProps) {
  const { getFieldHint, getFieldWarning } = useProviderInputValidation(entityType);
  
  const hint = showType !== 'warning' ? getFieldHint(fieldName) : null;
  const warning = showType !== 'hint' ? getFieldWarning(fieldName, value) : null;

  if (!hint && !warning) return null;

  return (
    <div className={cn("space-y-1 mt-1", className)}>
      {hint && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-info" />
          <span>{hint}</span>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-1.5 text-xs text-warning">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get all validation results for a form
 */
export function useFormValidationHints(entityType: string, formData: Record<string, unknown>) {
  const { validate } = useProviderInputValidation(entityType);
  return React.useMemo(() => validate(formData), [validate, formData]);
}

/**
 * Summary component showing all validation issues for a form
 */
export function ProviderFormValidationSummary({
  entityType,
  formData,
  className,
}: {
  entityType: string;
  formData: Record<string, unknown>;
  className?: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const validationResults = useFormValidationHints(entityType, formData);

  const warnings = validationResults.filter(r => r.severity === 'warning');
  const infos = validationResults.filter(r => r.severity === 'info' && r.type !== 'hint');

  if (warnings.length === 0 && infos.length === 0) return null;

  return (
    <div className={cn("rounded-none border border-warning/30 bg-warning/5 p-3 space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-warning">
        <AlertTriangle className="w-4 h-4" />
        {isRu ? 'Рекомендации по улучшению' : 'Improvement Suggestions'}
      </div>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-warning">
            <span className="w-1 h-1 rounded-full bg-warning mt-1.5 shrink-0" />
            <span><strong>{w.field}:</strong> {w.message}</span>
          </li>
        ))}
        {infos.map((info, i) => (
          <li key={`info-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-info mt-1.5 shrink-0" />
            <span><strong>{info.field}:</strong> {info.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProviderFieldHints;
