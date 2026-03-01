import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useStaffMembers } from '@/hooks/useStaffMembers';
import { useCreateCrmTask } from '@/hooks/useCrmTasks';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { CRM_TASK_TYPE_ORDER, CRM_TASK_TYPES } from '@/config/crmTaskTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ClipboardPlus } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTaskDialog({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const { data: staff } = useStaffMembers();
  const { data: company } = useMyCompanyId();
  const createTask = useCreateCrmTask();

  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('other');
  const [propertyId, setPropertyId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !user || !company?.company_id) return;

    createTask.mutate(
      {
        company_id: company.company_id,
        title: title.trim(),
        task_type: taskType,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        property_id: propertyId || undefined,
        assigned_to: assignedTo || undefined,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          toast.success(isRu ? 'Задача создана' : 'Task created');
          setTitle('');
          setTaskType('other');
          setPropertyId('');
          setAssignedTo('');
          setPriority('medium');
          setDueDate('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Новая задача' : 'New Task'}
      icon={<ClipboardPlus className="w-5 h-5 text-primary" />}
      size="md"
      footer={
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending}>
            {createTask.isPending
              ? (isRu ? 'Создание...' : 'Creating...')
              : (isRu ? 'Создать' : 'Create')}
          </Button>
        </div>
      }
    >
      <div>
        <Label>{isRu ? 'Название' : 'Title'}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isRu ? 'Что нужно сделать?' : 'What needs to be done?'}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'Тип' : 'Type'}</Label>
          <Select value={taskType} onValueChange={setTaskType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CRM_TASK_TYPE_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {isRu ? CRM_TASK_TYPES[t].labelRu : CRM_TASK_TYPES[t].labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{isRu ? 'Приоритет' : 'Priority'}</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{isRu ? 'Низкий' : 'Low'}</SelectItem>
              <SelectItem value="medium">{isRu ? 'Средний' : 'Medium'}</SelectItem>
              <SelectItem value="high">{isRu ? 'Высокий' : 'High'}</SelectItem>
              <SelectItem value="urgent">{isRu ? 'Срочный' : 'Urgent'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{isRu ? 'Объект' : 'Property'}</Label>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{isRu ? 'Без объекта' : 'No property'}</SelectItem>
            {allProperties.map((p) => (
              <SelectItem key={p.property_id} value={p.property_id}>
                {isRu ? p.title_ru : p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{isRu ? 'Исполнитель' : 'Assignee'}</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger><SelectValue placeholder={isRu ? 'Назначить сотрудника' : 'Assign staff'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{isRu ? 'Не назначен' : 'Unassigned'}</SelectItem>
            {(staff || []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{isRu ? 'Дедлайн' : 'Due date'}</Label>
        <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
    </ResponsiveModal>
  );
}
