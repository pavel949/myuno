import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCrmTask } from '@/hooks/useCrmTasks';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Phone, Calendar, FileText, MessageCircle, Mail,
  UserPlus, PlusCircle, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/lib/config/routes';

export function CrmQuickActions() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: company } = useMyCompanyId();
  const createTask = useCreateCrmTask();
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const handleQuickTask = async () => {
    if (!quickTaskTitle.trim() || !company?.company_id || !user?.id) return;
    try {
      await createTask.mutateAsync({
        company_id: company.company_id,
        title: quickTaskTitle.trim(),
        task_type: 'follow_up',
        priority: 'normal',
        created_by: user.id,
        assigned_to: user.id,
        due_date: new Date().toISOString(),
      });
      setQuickTaskTitle('');
      setQuickTaskOpen(false);
      toast.success(isRu ? 'Задача создана' : 'Task created');
    } catch { /* handled */ }
  };

  const actions = [
    { icon: Phone, label: isRu ? 'Звонок' : 'Call', color: 'text-success', action: () => navigate(APP_ROUTES.MC_TASKS) },
    { icon: Calendar, label: isRu ? 'Показ' : 'Showing', color: 'text-primary', action: () => navigate('/mc/meetings') },
    { icon: FileText, label: isRu ? 'КП' : 'Quote', color: 'text-info', action: () => navigate('/mc/quotes') },
    { icon: Mail, label: isRu ? 'Email' : 'Email', color: 'text-warning', action: () => navigate('/mc/crm-emails') },
    { icon: UserPlus, label: isRu ? 'Контакт' : 'Contact', color: 'text-accent-foreground', action: () => navigate(APP_ROUTES.MC_CONTACTS) },
    { icon: PlusCircle, label: isRu ? 'Задача' : 'Task', color: 'text-muted-foreground', action: () => setQuickTaskOpen(true) },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {actions.map(a => (
          <button
            key={a.label}
            onClick={a.action}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors shrink-0"
          >
            <a.icon className={cn('h-3.5 w-3.5', a.color)} />
            <span className="text-xs font-medium whitespace-nowrap">{a.label}</span>
          </button>
        ))}
      </div>

      {quickTaskOpen && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={quickTaskTitle}
            onChange={e => setQuickTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickTask()}
            placeholder={isRu ? 'Быстрая задача...' : 'Quick task...'}
            className="h-8 text-xs flex-1"
          />
          <Button size="sm" className="h-8" onClick={handleQuickTask} disabled={createTask.isPending}>
            {isRu ? 'Добавить' : 'Add'}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuickTaskOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
