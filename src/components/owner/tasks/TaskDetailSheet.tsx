import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, CheckCircle2, Clock, Play, MessageSquareMore, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { TaskComments } from '@/components/owner/tasks/TaskComments';
import { TaskDueDateTimeField } from '@/components/owner/tasks/TaskDueDateTimeField';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { isTaskCompletedStatus } from '@/lib/tasks/taskStatus';
import { PMS_PHOTO_BUCKET } from '@/lib/tasks/pmsPendingPhoto';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedTask {
  id: string;
  source: 'crm' | 'ops';
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null; // normalized
  assigned_to: string | null;
  property_id: string | null;
  task_type: string;
  raw: any;
}

interface TaskDetailSheetProps {
  task: UnifiedTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { user_id: string; name: string }[];
  properties: { property_id: string; title: string }[];
  onUpdate: (id: string, source: 'crm' | 'ops', updates: Record<string, any>) => void | Promise<void>;
  onDelete: (id: string, source: 'crm' | 'ops') => void;
  queueProof?: (photo: File) => Promise<boolean>;
}

const STATUS_OPTIONS = [
  { value: 'pending', labelEn: 'Pending', labelRu: 'Ожидает', icon: Clock, color: 'text-warning' },
  { value: 'in_progress', labelEn: 'In Progress', labelRu: 'В работе', icon: Play, color: 'text-info' },
  { value: 'completed', labelEn: 'Completed', labelRu: 'Выполнено', icon: CheckCircle2, color: 'text-success' },
];

export function TaskDetailSheet({ task, open, onOpenChange, members, properties, onUpdate, onDelete, queueProof }: TaskDetailSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const { notifyAssignment, notifyStatusRequest } = useTaskNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [saving, setSaving] = useState(false);
  const [proof, setProof] = useState<{ scope: string; file: File } | null>(null);
  const [proofBusy, setProofBusy] = useState(false);
  const [proofLinks, setProofLinks] = useState<{ scope: string; links: string[] } | null>(null);
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('none');
  const [dueDate, setDueDate] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assigned_to || 'none');
      setDueDate(task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '');
      setActualCost(String(task.raw?.actual_cost ?? ''));
    }
  }, [task]);

  useEffect(() => { setProofLinks(null); }, [open, task?.id, user?.id]);

  if (!task) return null;

  const proofScope = JSON.stringify([open, user?.id, task.source, task.id]);
  const proofFile = proof?.scope === proofScope ? proof.file : null;
  const currentProofLinks = proofLinks?.scope === proofScope ? proofLinks.links : [];
  const recordedProof = task.source === 'ops' && Array.isArray(task.raw?.photo_proof)
    ? (task.raw.photo_proof as unknown[]).filter((item): item is string => typeof item === 'string' && item.startsWith(task.id + '/'))
    : [];
  const submitProof = async () => {
    if (!proofFile || !queueProof || proofBusy) return;
    setProofBusy(true);
    try {
      if (!await queueProof(proofFile)) {
        toast.error(t('Could not queue the photo. Use a JPG, PNG or WebP up to 8 MB and refresh the task.', 'Не удалось сохранить фото. Выберите JPG, PNG или WebP до 8 МБ и обновите задачу.'));
        return;
      }
      setProof(null);
      toast(t('Photo and task completion are saved on this device until sync.', 'Фото и отметка о выполнении сохранены на устройстве до отправки.'));
    } finally {
      setProofBusy(false);
    }
  };
  const openProof = async () => {
    const { data, error } = await supabase.storage.from(PMS_PHOTO_BUCKET).createSignedUrls(recordedProof, 120);
    const links = (data ?? []).flatMap(item => item.signedUrl ? [item.signedUrl] : []);
    if (error || !links.length) {
      toast.error(t('Could not open the photos. Try again.', 'Не удалось открыть фото. Попробуйте ещё раз.'));
      return;
    }
    setProofLinks({ scope: proofScope, links });
  };

  const handleSave = async () => {
    if (saving) return;
    const updates: Record<string, any> = { title, priority };
    const prevAssignee = task.assigned_to;
    const willBeCompleted = isTaskCompletedStatus(status);
    const existingCompletedAt = task.raw?.completed_at ?? null;
    const existingCompletedBy = task.raw?.completed_by ?? null;
    if (task.source === 'crm') {
      updates.description = description || null;
      updates.status = status;
      updates.due_date = dueDate ? new Date(dueDate).toISOString() : null;
      updates.completed_at = willBeCompleted
        ? existingCompletedAt || new Date().toISOString()
        : null;
    } else {
      updates.status = status;
      updates.notes = description || null;
      if (dueDate) {
        updates.scheduled_date = format(new Date(dueDate), 'yyyy-MM-dd');
        updates.scheduled_time = format(new Date(dueDate), 'HH:mm');
      }
      if (willBeCompleted) {
        updates.completed_at = existingCompletedAt || new Date().toISOString();
        updates.completed_by = existingCompletedBy || (user?.id ?? null);
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }
      updates.actual_cost = actualCost ? Number(actualCost) || 0 : null;
    }
    updates.assigned_to = assignedTo !== 'none' ? assignedTo : null;

    setSaving(true);
    try {
      await onUpdate(task.id, task.source, updates);
    } catch {
      toast.error(t('The task was not saved. Try again.', 'Не удалось сохранить задачу. Попробуйте ещё раз.'));
      return;
    } finally {
      setSaving(false);
    }
    if (assignedTo !== 'none' && assignedTo !== prevAssignee && assignedTo !== user?.id) {
      void notifyAssignment({ assigneeId: assignedTo, taskTitle: title, taskId: task.id, taskSource: task.source, propertyId: task.property_id });
    }
    onOpenChange(false);
    toast.success(t('Task updated', 'Задача обновлена'));
  };

  const handleRequestStatus = async () => {
    if (!task.assigned_to || task.assigned_to === user?.id) {
      toast.info(t('Task is assigned to you', 'Задача назначена вам'));
      return;
    }
    const myName = members.find(m => m.user_id === user?.id)?.name;
    await notifyStatusRequest({
      assigneeId: task.assigned_to,
      taskTitle: task.title,
      taskId: task.id,
      taskSource: task.source,
      propertyId: task.property_id,
      requesterName: myName,
    });
    toast.success(t('Status request sent', 'Запрос статуса отправлен'));
  };

  const handleDelete = () => {
    onDelete(task.id, task.source);
    setConfirmDelete(false);
    onOpenChange(false);
    toast.success(t('Task deleted', 'Задача удалена'));
  };

  const memberName = members.find(m => m.user_id === task.assigned_to)?.name;
  const propertyTitle = properties.find(p => p.property_id === task.property_id)?.title;

  const footer = (
    <div className="flex gap-2 w-full">
      <Button onClick={handleSave} disabled={saving} className="flex-1">
        {t('Save', 'Сохранить')}
      </Button>
      <Button variant="destructive" size="icon" aria-label={t('Delete', 'Удалить')} onClick={() => setConfirmDelete(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={t('Task Details', 'Детали задачи')}
        icon={<ClipboardList className="h-5 w-5 text-primary" />}
        size="lg"
        footer={footer}
      >
          <div className="space-y-5">
            {/* Source badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {task.source === 'crm' ? t('Business', 'Бизнес') : t('Operations', 'Операции')}
              </Badge>
              {propertyTitle && (
                <Badge variant="secondary" className="text-xs">{propertyTitle}</Badge>
              )}
              {memberName && (
                <Badge variant="secondary" className="text-xs">→ {memberName}</Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <Label>{t('Title', 'Название')}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {(queueProof || recordedProof.length > 0) && (
              <section className="space-y-2 border-t border-border pt-3" aria-label={t('Task photos', 'Фото выполненной работы')}>
                {queueProof && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      {t('Photo of completed work', 'Фото выполненной работы')}
                      <Input
                        type="file" accept="image/jpeg,image/png,image/webp"
                        className="mt-1 min-h-11"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          setProof(file ? { scope: proofScope, file } : null);
                          event.target.value = '';
                        }}
                      />
                    </label>
                    {proofFile && <p className="break-all text-sm">{proofFile.name}</p>}
                    <p className="text-sm text-muted-foreground">{t('JPG, PNG or WebP, up to 8 MB. The photo is sent when you reconnect.', 'JPG, PNG или WebP до 8 МБ. Фото отправится, когда появится связь.')}</p>
                    <Button type="button" size="sm" variant="outline" disabled={!proofFile || proofBusy} onClick={submitProof}>
                      {t('Complete the task with a photo', 'Завершить с фото')}
                    </Button>
                  </div>
                )}
                {recordedProof.length > 0 && (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={openProof}>{t('Show photos', 'Показать фото')}</Button>
                    {currentProofLinks.map((href, index) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="block min-h-11 text-sm text-primary underline">
                        {t('Photo', 'Фото')} {index + 1}
                      </a>
                    ))}
                  </>
                )}
              </section>
            )}

            {/* Status */}
            <div>
              <Label>{t('Status', 'Статус')}</Label>
              <div className="flex gap-2 mt-1">
                {STATUS_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-sm transition-all',
                        status === opt.value
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', opt.color)} />
                      {isRu ? opt.labelRu : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <Label>{t('Priority', 'Приоритет')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('🔴 High', '🔴 Высокий')}</SelectItem>
                  <SelectItem value="medium">{t('🟡 Medium', '🟡 Средний')}</SelectItem>
                  <SelectItem value="low">{t('🟢 Low', '🟢 Низкий')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            {members.length > 0 && (
              <div>
                <Label>{t('Assigned to', 'Назначено')}</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('Unassigned', 'Не назначено')}</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description / Notes */}
            <div>
              <Label>{task.source === 'crm' ? t('Description', 'Описание') : t('Notes', 'Заметки')}</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('Add notes...', 'Добавить заметки...')}
                rows={4}
              />
            </div>

            <TaskDueDateTimeField
              value={dueDate}
              onChange={setDueDate}
              allowClear={task.source === 'crm'}
            />

            {/* Cost (ops tasks only) */}
            {task.source === 'ops' && (
              <div>
                <Label>{t('Actual Cost (THB)', 'Фактическая стоимость (THB)')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCost}
                  onChange={e => setActualCost(e.target.value)}
                  placeholder="0"
                />
                {status === 'completed' && Number(actualCost) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('💰 Expense will be auto-recorded to financials', '💰 Расход будет автоматически записан в финансы')}
                  </p>
                )}
              </div>
            )}

            {/* Comments */}
            <TaskComments taskId={task.id} taskSource={task.source} />

            {/* Request Status */}
            {task.assigned_to && task.assigned_to !== user?.id && !isTaskCompletedStatus(task.status) && (
              <Button variant="outline" className="w-full" onClick={handleRequestStatus}>
                <MessageSquareMore className="h-4 w-4 mr-2" />
                {t('Request Status Update', 'Запросить статус')}
              </Button>
            )}
          </div>
      </ResponsiveModal>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete task?', 'Удалить задачу?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('This cannot be undone', 'Это действие нельзя отменить')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('Delete', 'Удалить')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
