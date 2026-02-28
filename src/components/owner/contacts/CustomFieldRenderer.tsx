import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CrmCustomField } from '@/hooks/useCrmCustomFields';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  field: CrmCustomField;
  value: any;
  onChange: (value: any) => void;
  readonly?: boolean;
}

export function CustomFieldRenderer({ field, value, onChange, readonly = false }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const label = isRu ? field.label_ru : field.label_en;

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'url':
      case 'phone':
      case 'email':
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={readonly}
            placeholder={label}
            className="h-8 text-sm"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            disabled={readonly}
            className="h-8 text-sm"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={readonly}
            className="h-8 text-sm"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={onChange}
            disabled={readonly}
          />
        );
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={readonly}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {isRu ? opt.label_ru : opt.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multiselect': {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1">
            {(field.options || []).map((opt: any) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readonly}
                  onClick={() => {
                    if (isSelected) onChange(selected.filter((v: string) => v !== opt.value));
                    else onChange([...selected, opt.value]);
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] border transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                    readonly && 'opacity-60 cursor-default',
                  )}
                >
                  {isRu ? opt.label_ru : opt.label_en}
                </button>
              );
            })}
          </div>
        );
      }
      default:
        return <span className="text-xs text-muted-foreground">{String(value || '—')}</span>;
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {field.is_required && <span className="text-destructive">*</span>}
      </label>
      {renderField()}
    </div>
  );
}
