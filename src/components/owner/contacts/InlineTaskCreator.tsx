import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCrmTask, CrmTask } from '@/hooks/useCrmTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  companyId: string;
  contactId?: string;
  dealId?: string;
  onCreated?: () => void;
}

export function InlineTaskCreator({ companyId, contactId, dealId, onCreated }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const createTask = useCreateCrmTask();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [taskType, setTaskType] = useState('follow_up');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    try {
      await createTask.mutateAsync({
        company_id: companyId,
        title: title.trim(),
        task_type: taskType,
        priority,
        due_date: dueDate || undefined,
        contact_id: contactId,
        deal_id: dealId,
        created_by: user.id,
        assigned_to: user.id,
      });
      toast.success(isRu ? 'Задача создана' : 'Task created');
      setTitle('');
      setDueDate('');
      setExpanded(false);
      onCreated?.();
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)} className="w-full justify-start text-muted-foreground">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        {isRu ? 'Добавить задачу' : 'Add task'}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <Input
        placeholder={isRu ? 'Название задачи...' : 'Task title...'}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        autoFocus
      />
      <div className="flex flex-wrap gap-2">
        <Select value={taskType} onValueChange={setTaskType}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="follow_up">{isRu ? 'Фоллоу-ап' : 'Follow-up'}</SelectItem>
            <SelectItem value="call">{isRu ? 'Звонок' : 'Call'}</SelectItem>
            <SelectItem value="meeting">{isRu ? 'Встреча' : 'Meeting'}</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="task">{isRu ? 'Задача' : 'Task'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{isRu ? 'Низкий' : 'Low'}</SelectItem>
            <SelectItem value="medium">{isRu ? 'Средний' : 'Medium'}</SelectItem>
            <SelectItem value="high">{isRu ? 'Высокий' : 'High'}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="h-8 text-xs pl-7 w-[140px]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={createTask.isPending || !title.trim()} className="h-8">
          {isRu ? 'Создать' : 'Create'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setExpanded(false)} className="h-8">
          {isRu ? 'Отмена' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
