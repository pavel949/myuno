/**
 * DuplicatesMergeModal — field-by-field merge UI for duplicate CRM contacts.
 * Shows two contact cards side by side; user picks which value to keep per field.
 */
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmContact, useUpdateContact, useDeleteContact, CrmContact } from '@/hooks/useCrmContacts';
import { useCrmCustomFields, useCrmCustomFieldValues, useUpsertCustomFieldValue } from '@/hooks/useCrmCustomFields';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Merge, Loader2, User, Mail, Phone, Briefcase, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Side = 'left' | 'right';

const MERGE_FIELDS = [
  { key: 'first_name', labelEn: 'First name', labelRu: 'Имя', icon: User },
  { key: 'last_name', labelEn: 'Last name', labelRu: 'Фамилия', icon: User },
  { key: 'email', labelEn: 'Email', labelRu: 'Email', icon: Mail },
  { key: 'phone', labelEn: 'Phone', labelRu: 'Телефон', icon: Phone },
  { key: 'company_name', labelEn: 'Company', labelRu: 'Компания', icon: Briefcase },
  { key: 'job_title', labelEn: 'Job title', labelRu: 'Должность', icon: Briefcase },
  { key: 'contact_type', labelEn: 'Contact type', labelRu: 'Тип контакта', icon: User },
  { key: 'source', labelEn: 'Source', labelRu: 'Источник', icon: User },
  { key: 'lifecycle_stage', labelEn: 'Lifecycle stage', labelRu: 'Этап воронки', icon: User },
  { key: 'linked_user_id', labelEn: 'Assigned to', labelRu: 'Назначен', icon: User },
  { key: 'tags', labelEn: 'Tags', labelRu: 'Теги', icon: Tag },
  { key: 'notes', labelEn: 'Notes', labelRu: 'Заметки', icon: User },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leftId: string;
  rightId: string;
  companyId: string;
  onMerged?: () => void;
}

function formatValue(value: unknown, key: string): string {
  if (value === null || value === undefined) return '—';
  if (key === 'tags' && Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
}

export function DuplicatesMergeModal({ open, onOpenChange, leftId, rightId, companyId, onMerged }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: left } = useCrmContact(leftId);
  const { data: right } = useCrmContact(rightId);
  const { data: customFields = [] } = useCrmCustomFields(companyId, 'contact');
  const { data: leftCustom = {} } = useCrmCustomFieldValues(leftId);
  const { data: rightCustom = {} } = useCrmCustomFieldValues(rightId);
  const upsertCustom = useUpsertCustomFieldValue();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [winnerSide, setWinnerSide] = useState<Side>('left');
  const [fieldChoices, setFieldChoices] = useState<Record<string, Side>>({});
  const [isMerging, setIsMerging] = useState(false);

  const winnerId = winnerSide === 'left' ? leftId : rightId;
  const loserId = winnerSide === 'left' ? rightId : leftId;
  const winner = winnerSide === 'left' ? left : right;
  const loser = winnerSide === 'left' ? right : left;

  const allCustomFieldIds = useMemo(() => customFields.map(f => f.id), [customFields]);

  const getFieldChoice = (key: string): Side => {
    return fieldChoices[key] ?? 'left';
  };

  const setFieldChoice = (key: string, side: Side) => {
    setFieldChoices(prev => ({ ...prev, [key]: side }));
  };

  const getMergedValue = (key: string, leftVal: CrmContact | null, rightVal: CrmContact | null): unknown => {
    const choice = getFieldChoice(key);
    const c = choice === 'left' ? leftVal : rightVal;
    if (!c) return null;
    const v = (c as Record<string, unknown>)[key];
    return v ?? null;
  };

  const handleMerge = async () => {
    if (!left || !right || !user) return;
    setIsMerging(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const { key } of MERGE_FIELDS) {
        const val = getMergedValue(key, left, right);
        if (val !== undefined && val !== null) {
          if (key === 'tags' && Array.isArray(val)) {
            updates[key] = val;
          } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            updates[key] = val;
          }
        }
      }

      await updateContact.mutateAsync({ id: winnerId, ...updates } as Parameters<typeof updateContact.mutateAsync>[0]);

      const dupIds = [loserId];
      await supabase.from('agent_deals').update({ contact_id: winnerId }).in('contact_id', dupIds);
      await supabase.from('crm_tasks').update({ contact_id: winnerId }).in('contact_id', dupIds);
      await (supabase as any).from('crm_contact_notes').update({ contact_id: winnerId }).in('contact_id', dupIds);
      await supabase.from('crm_activities').update({ contact_id: winnerId }).in('contact_id', dupIds);
      const { error: cpErr } = await supabase.from('contact_properties').update({ contact_id: winnerId }).in('contact_id', dupIds);
      if (cpErr) {
        // contact_properties might not exist in all deployments
      }

      for (const field of customFields) {
        const choice = getFieldChoice(`custom_${field.id}`);
        const src = choice === 'left' ? leftCustom : rightCustom;
        const val = src[field.id];
        if (val !== undefined && val !== null) {
          await upsertCustom.mutateAsync({ field_id: field.id, entity_id: winnerId, value: val });
        }
      }

      await deleteContact.mutateAsync(loserId);

      const { data: winnerContact } = await supabase.from('crm_contacts').select('first_name, last_name').eq('id', winnerId).single();
      const winnerName = winnerContact ? `${winnerContact.first_name} ${winnerContact.last_name}`.trim() : '';

      await supabase.from('crm_activities').insert({
        company_id: companyId,
        contact_id: winnerId,
        activity_type: 'merge',
        subject: isRu ? 'Объединение дубликатов' : 'Duplicate merge',
        description: isRu ? `Объединён контакт ${loserId} в ${winnerId}` : `Merged contact ${loserId} into ${winnerId}`,
        logged_by: user.id,
      });

      toast.success(isRu ? `Объединено! Сохранён: ${winnerName}` : `Merged! Kept: ${winnerName}`);
      qc.invalidateQueries({ queryKey: ['crm-duplicates'] });
      qc.invalidateQueries({ queryKey: ['crm-contacts'] });
      onMerged?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(isRu ? 'Ошибка при объединении' : 'Merge failed');
      throw e;
    } finally {
      setIsMerging(false);
    }
  };

  const isLoading = !left || !right;
  const label = (en: string, ru: string) => (isRu ? ru : en);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={label('Merge Duplicates', 'Объединение дубликатов')}
      description={label('Choose which values to keep for each field', 'Выберите, какое значение оставить для каждого поля')}
      size="2xl"
      icon={<Merge className="h-5 w-5" />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMerging}>
            {label('Cancel', 'Отмена')}
          </Button>
          <Button onClick={handleMerge} disabled={isMerging || isLoading}>
            {isMerging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Merge className="h-4 w-4 mr-2" />}
            {label('Merge', 'Объединить')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Winner selection */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">{label('Keep as primary contact:', 'Оставить основным контактом:')}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={winnerSide === 'left' ? 'default' : 'outline'}
                onClick={() => setWinnerSide('left')}
              >
                {left!.first_name} {left!.last_name}
              </Button>
              <Button
                size="sm"
                variant={winnerSide === 'right' ? 'default' : 'outline'}
                onClick={() => setWinnerSide('right')}
              >
                {right!.first_name} {right!.last_name}
              </Button>
            </div>
          </div>

          {/* Side-by-side field comparison */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-medium text-muted-foreground">{label('Field', 'Поле')}</div>
            <div className={cn('font-medium', winnerSide === 'left' && 'text-primary')}>
              {left!.first_name} {left!.last_name}
            </div>
            <div className={cn('font-medium', winnerSide === 'right' && 'text-primary')}>
              {right!.first_name} {right!.last_name}
            </div>

            {MERGE_FIELDS.map(({ key, labelEn, labelRu }) => {
              const leftVal = (left as Record<string, unknown>)[key];
              const rightVal = (right as Record<string, unknown>)[key];
              const leftStr = formatValue(leftVal, key);
              const rightStr = formatValue(rightVal, key);
              const hasDiff = leftStr !== rightStr;
              return (
                <FieldRow
                  key={key}
                  label={label(labelEn, labelRu)}
                  leftStr={leftStr}
                  rightStr={rightStr}
                  choice={getFieldChoice(key)}
                  onChoice={s => setFieldChoice(key, s)}
                  highlight={hasDiff}
                />
              );
            })}

            {customFields.map(field => {
              const leftVal = leftCustom[field.id];
              const rightVal = rightCustom[field.id];
              const leftStr = formatValue(leftVal, '');
              const rightStr = formatValue(rightVal, '');
              const key = `custom_${field.id}`;
              const fieldLabel = isRu ? field.label_ru : field.label_en;
              return (
                <FieldRow
                  key={key}
                  label={fieldLabel}
                  leftStr={leftStr}
                  rightStr={rightStr}
                  choice={getFieldChoice(key)}
                  onChoice={s => setFieldChoice(key, s)}
                  highlight={leftStr !== rightStr}
                />
              );
            })}
          </div>
        </div>
      )}
    </ResponsiveModal>
  );
}

function FieldRow({
  label,
  leftStr,
  rightStr,
  choice,
  onChoice,
  highlight,
}: {
  label: string;
  leftStr: string;
  rightStr: string;
  choice: Side;
  onChoice: (s: Side) => void;
  highlight: boolean;
}) {
  return (
    <>
      <div className={cn('py-1.5', highlight && 'font-medium')}>{label}</div>
      <button
        type="button"
        onClick={() => onChoice('left')}
        className={cn(
          'text-left py-1.5 px-2 rounded border transition-colors truncate',
          choice === 'left' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
        )}
        title={leftStr}
      >
        {leftStr || '—'}
      </button>
      <button
        type="button"
        onClick={() => onChoice('right')}
        className={cn(
          'text-left py-1.5 px-2 rounded border transition-colors truncate',
          choice === 'right' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
        )}
        title={rightStr}
      >
        {rightStr || '—'}
      </button>
    </>
  );
}
