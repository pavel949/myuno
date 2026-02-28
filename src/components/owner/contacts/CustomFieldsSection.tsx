import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCrmCustomFields, useCrmCustomFieldValues, useUpsertCustomFieldValue } from '@/hooks/useCrmCustomFields';
import { CustomFieldRenderer } from './CustomFieldRenderer';

interface Props {
  companyId: string;
  entityType: 'contact' | 'deal';
  entityId: string;
  readonly?: boolean;
}

export function CustomFieldsSection({ companyId, entityType, entityId, readonly = false }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: fields = [] } = useCrmCustomFields(companyId, entityType);
  const { data: values = {} } = useCrmCustomFieldValues(entityId, fields.map(f => f.id));
  const upsert = useUpsertCustomFieldValue();

  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {isRu ? 'Дополнительные поля' : 'Custom Fields'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(field => (
          <CustomFieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            readonly={readonly}
            onChange={(val) => {
              upsert.mutate({ field_id: field.id, entity_id: entityId, value: val });
            }}
          />
        ))}
      </div>
    </div>
  );
}
