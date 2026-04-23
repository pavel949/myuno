import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChecklistTemplates, useSubmitChecklist, type ChecklistItem, type CompletedItem } from '@/hooks/useChecklists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ClipboardCheck, Camera, Send, CheckCircle2 } from 'lucide-react';

interface Props {
  propertyId: string;
  bookingId?: string;
  taskId?: string;
  checklistType?: string;
  onComplete?: () => void;
}

export function ChecklistCompletion({ propertyId, bookingId, taskId, checklistType, onComplete }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;

  const { data: templates = [], isLoading } = useChecklistTemplates();
  const submitChecklist = useSubmitChecklist();

  const filteredTemplates = checklistType
    ? templates.filter(t => t.checklist_type === checklistType)
    : templates;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedTemplate = filteredTemplates.find(t => t.id === selectedTemplateId);
  const items: ChecklistItem[] = selectedTemplate?.items || [];
  const allChecked = items.length > 0 && items.every((_, i) => checkedItems[i]);

  const handleToggle = (index: number, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [index]: checked }));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate) return;
    const completedItems: CompletedItem[] = items.map((item, i) => ({
      label: item.label,
      checked: !!checkedItems[i],
    }));

    try {
      await submitChecklist.mutateAsync({
        template_id: selectedTemplate.id,
        property_id: propertyId,
        booking_id: bookingId,
        task_id: taskId,
        items: completedItems,
        notes: notes || undefined,
      });
      setSubmitted(true);
      toast.success(t('Checklist completed', 'Чеклист заполнен'));
      onComplete?.();
    } catch {
      toast.error(t('Failed to submit', 'Ошибка отправки'));
    }
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-none" />;
  }

  if (filteredTemplates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {t('No checklist templates yet. Create one in Settings.', 'Нет шаблонов чеклистов. Создайте в Настройках.')}
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="font-medium text-sm">{t('Checklist submitted!', 'Чеклист отправлен!')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          {t('Checklist', 'Чеклист')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template selector */}
        <Select value={selectedTemplateId} onValueChange={(v) => { setSelectedTemplateId(v); setCheckedItems({}); }}>
          <SelectTrigger>
            <SelectValue placeholder={t('Select template...', 'Выберите шаблон...')} />
          </SelectTrigger>
          <SelectContent>
            {filteredTemplates.map(tmpl => (
              <SelectItem key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
                <Badge variant="outline" className="ml-2 text-[10px]">{tmpl.checklist_type}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Items */}
        {selectedTemplate && (
          <>
            <div className="space-y-2">
              {items.map((item, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-none border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={!!checkedItems[i]}
                    onCheckedChange={(v) => handleToggle(i, !!v)}
                  />
                  <span className="text-sm flex-1">{isRu && item.label_ru ? item.label_ru : item.label}</span>
                  {item.required_photo && (
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </label>
              ))}
            </div>

            {/* Notes */}
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('Additional notes...', 'Дополнительные заметки...')}
              rows={2}
            />

            {/* Progress + Submit */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {Object.values(checkedItems).filter(Boolean).length}/{items.length} {t('completed', 'выполнено')}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitChecklist.isPending}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {t('Submit', 'Отправить')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
