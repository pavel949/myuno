import { useLanguage } from '@/contexts/LanguageContext';
import { useLookupOptions, LookupType } from '@/hooks/useLookupValues';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface LookupSelectProps {
  lookupType: LookupType;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function LookupSelect({
  lookupType,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
}: LookupSelectProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { options, isLoading } = useLookupOptions(lookupType);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || (isRussian ? 'Выберите...' : 'Select...')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {isRussian ? option.label_ru : option.label_en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface LookupMultiSelectProps {
  lookupType: LookupType;
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxItems?: number;
}

export function LookupMultiSelect({
  lookupType,
  values,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  maxItems,
}: LookupMultiSelectProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { options, isLoading } = useLookupOptions(lookupType);

  const handleSelect = (newValue: string) => {
    if (values.includes(newValue)) {
      onChange(values.filter((v) => v !== newValue));
    } else if (!maxItems || values.length < maxItems) {
      onChange([...values, newValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(values.filter((v) => v !== valueToRemove));
  };

  const getLabel = (value: string) => {
    const option = options.find((o) => o.value === value);
    return option ? (isRussian ? option.label_ru : option.label_en) : value;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const availableOptions = options.filter((o) => !values.includes(o.value));

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {getLabel(value)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(value)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      <Select 
        value="" 
        onValueChange={handleSelect} 
        disabled={disabled || (maxItems ? values.length >= maxItems : false)}
      >
        <SelectTrigger>
          <SelectValue 
            placeholder={
              maxItems && values.length >= maxItems
                ? (isRussian ? `Максимум ${maxItems}` : `Max ${maxItems}`)
                : (placeholder || (isRussian ? 'Добавить...' : 'Add...'))
            } 
          />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {isRussian ? option.label_ru : option.label_en}
            </SelectItem>
          ))}
          {availableOptions.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {isRussian ? 'Все выбрано' : 'All selected'}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
