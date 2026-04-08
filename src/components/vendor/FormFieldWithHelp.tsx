import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, AlertCircle, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FormFieldWithHelpProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  /** Type of input */
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'textarea';
  /** Placeholder text */
  placeholder?: string;
  /** Example text shown below input */
  example?: string;
  /** Tooltip help text */
  helpText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Success state */
  isValid?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** Additional class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Min value for number inputs */
  min?: number;
  /** Max value for number inputs */
  max?: number;
  /** Step for number inputs */
  step?: number;
}

export function FormFieldWithHelp({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  example,
  helpText,
  required = false,
  error,
  isValid,
  rows = 3,
  className,
  disabled = false,
  min,
  max,
  step,
}: FormFieldWithHelpProps) {
  const hasError = !!error;
  const showValid = isValid && !hasError && value;

  const inputClasses = cn(
    'transition-colors',
    hasError && 'border-destructive focus-visible:ring-destructive',
    showValid && 'border-success focus-visible:ring-success'
  );

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={inputClasses}
        />
      );
    }

    return (
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={inputClasses}
      />
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Status icons */}
        {hasError && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        {showValid && (
          <Check className="h-4 w-4 text-success" />
        )}
      </div>

      <div className="relative">
        {renderInput()}
      </div>

      {/* Example text */}
      {example && !error && (
        <p className="text-xs text-muted-foreground">
          {example}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Compact version for inline fields
interface CompactFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export function CompactField({ label, children, error, className }: CompactFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
