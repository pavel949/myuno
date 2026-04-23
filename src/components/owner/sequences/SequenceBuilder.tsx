import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SequenceWithSteps, CrmSequenceStep, useUpsertSequenceSteps, useUpdateSequence } from '@/hooks/useCrmSequences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, GripVertical, Clock, Phone, Mail, MessageCircle, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';
const ACTION_TYPES = [
  { value: 'task', labelEn: 'Create Task', labelRu: 'Создать задачу', icon: ClipboardList, color: 'text-primary' },
  { value: 'wait', labelEn: 'Wait', labelRu: 'Ожидание', icon: Clock, color: 'text-warning' },
  { value: 'email', labelEn: 'Send Email', labelRu: 'Отправить email', icon: Mail, color: 'text-info' },
  { value: 'whatsapp', labelEn: 'WhatsApp', labelRu: 'WhatsApp', icon: MessageCircle, color: 'text-success' },
  { value: 'call', labelEn: 'Schedule Call', labelRu: 'Запланировать звонок', icon: Phone, color: 'text-accent-foreground' },
];

interface LocalStep {
  step_order: number;
  action_type: string;
  delay_days: number;
  task_type: string;
  task_title: string;
  template_content: string;
}

interface Props {
  sequence: SequenceWithSteps;
}

export function SequenceBuilder({ sequence }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
const upsertSteps = useUpsertSequenceSteps();
  const updateSequence = useUpdateSequence();

  const [steps, setSteps] = useState<LocalStep[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSteps(
      sequence.steps.map(s => ({
        step_order: s.step_order,
        action_type: s.action_type,
        delay_days: s.delay_days,
        task_type: s.task_type || '',
        task_title: s.task_title || '',
        template_content: s.template_content || '',
      }))
    );
    setDirty(false);
  }, [sequence.id, sequence.steps.length]);

  const addStep = () => {
    setSteps(prev => [...prev, {
      step_order: prev.length,
      action_type: 'task',
      delay_days: 1,
      task_type: 'follow_up',
      task_title: '',
      template_content: '',
    }]);
    setDirty(true);
  };

  const removeStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i })));
    setDirty(true);
  };

  const updateStep = (idx: number, field: keyof LocalStep, value: any) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await upsertSteps.mutateAsync({
        sequenceId: sequence.id,
        steps: steps.map((s, i) => ({
          sequence_id: sequence.id,
          step_order: i,
          action_type: s.action_type,
          delay_days: s.delay_days,
          task_type: s.task_type || null,
          task_title: s.task_title || null,
          template_content: s.template_content || null,
          sort_order: i,
        })),
      });
      setDirty(false);
      toast(isRu ? 'Шаги сохранены' : 'Steps saved');
    } catch {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save error');
    }
  };

  const toggleActive = async () => {
    try {
      await updateSequence.mutateAsync({ id: sequence.id, is_active: !sequence.is_active });
      toast(sequence.is_active ? (isRu ? 'Приостановлена' : 'Paused') : (isRu ? 'Активирована' : 'Activated'));
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{sequence.name}</CardTitle>
            {sequence.description && (
              <p className="text-xs text-muted-foreground mt-1">{sequence.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {sequence.is_active ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Запустить' : 'Activate')}
            </Button>
            {dirty && (
              <Button size="sm" onClick={handleSave} disabled={upsertSteps.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isRu ? 'Добавьте шаги в последовательность' : 'Add steps to the sequence'}
          </p>
        )}

        {steps.map((step, idx) => {
          const actionCfg = ACTION_TYPES.find(a => a.value === step.action_type) || ACTION_TYPES[0];
          const Icon = actionCfg.icon;
          return (
            <div key={idx} className="flex items-start gap-2 p-3 rounded-none border bg-card">
              <div className="flex flex-col items-center gap-1 pt-1">
                <Badge variant="outline" className="text-[10px] h-5 w-5 p-0 flex items-center justify-center">
                  {idx + 1}
                </Badge>
                {idx < steps.length - 1 && <div className="w-px h-6 bg-border" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={step.action_type} onValueChange={v => updateStep(idx, 'action_type', v)}>
                    <SelectTrigger className="h-8 text-xs w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          {isRu ? a.labelRu : a.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={step.delay_days}
                      onChange={e => updateStep(idx, 'delay_days', Number(e.target.value))}
                      className="h-8 w-16 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">{isRu ? 'дн.' : 'days'}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeStep(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                {step.action_type === 'task' && (
                  <Input
                    placeholder={isRu ? 'Название задачи' : 'Task title'}
                    value={step.task_title}
                    onChange={e => updateStep(idx, 'task_title', e.target.value)}
                    className="h-8 text-xs"
                  />
                )}
                {(step.action_type === 'email' || step.action_type === 'whatsapp') && (
                  <Input
                    placeholder={isRu ? 'Шаблон сообщения' : 'Message template'}
                    value={step.template_content}
                    onChange={e => updateStep(idx, 'template_content', e.target.value)}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={addStep} className="w-full mt-2">
          <Plus className="h-3.5 w-3.5 mr-1" />
          {isRu ? 'Добавить шаг' : 'Add Step'}
        </Button>
      </CardContent>
    </Card>
  );
}
