import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import {
  useCrmWorkflows, useCreateWorkflow, useDeleteWorkflow, useUpdateWorkflow,
  useUpsertWorkflowActions, TRIGGER_TYPES, ACTION_TYPES, WorkflowWithActions,
} from '@/hooks/useCrmWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Workflow, Trash2, Play, Pause, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CrmWorkflowsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: workflows = [], isLoading, isError: workflowsError, refetch: refetchWorkflows } = useCrmWorkflows(companyId);
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', trigger_type: 'deal_created' });

  const handleCreate = async () => {
    if (!companyId || !user) return;
    try {
      await createWorkflow.mutateAsync({
        company_id: companyId,
        name: form.name,
        trigger_type: form.trigger_type,
        trigger_config: {},
        is_active: false,
        created_by: user.id,
      });
      setCreateOpen(false);
      setForm({ name: '', trigger_type: 'deal_created' });
      toast(isRu ? 'Автоматизация создана' : 'Workflow created');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const toggleActive = async (wf: WorkflowWithActions) => {
    try {
      await updateWorkflow.mutateAsync({ id: wf.id, is_active: !wf.is_active });
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const getTriggerLabel = (type: string) => {
    const t = TRIGGER_TYPES.find(t => t.value === type);
    return t ? (isRu ? t.labelRu : t.labelEn) : type;
  };

  if (workflowsError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки автоматизаций' : 'Failed to load automations'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchWorkflows()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Автоматизации' : 'Automations'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Настройте автоматические действия по триггерам' : 'Set up automatic actions based on triggers'}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Создать' : 'Create'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новая автоматизация' : 'New Automation'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>{isRu ? 'Название' : 'Name'}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Триггер' : 'Trigger'}</Label>
                <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {isRu ? t.labelRu : t.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!form.name || createWorkflow.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет автоматизаций' : 'No automations yet'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Создайте первую автоматизацию для CRM' : 'Create your first CRM automation'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => (
            <Card key={wf.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-none bg-primary/10">
                    <Workflow className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{wf.name}</span>
                      <Badge variant={wf.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {wf.is_active ? (isRu ? 'Активна' : 'Active') : (isRu ? 'Пауза' : 'Paused')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">{isRu ? 'Триггер:' : 'Trigger:'}</span>
                      <span>{getTriggerLabel(wf.trigger_type)}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{wf.actions.length} {isRu ? 'действий' : 'actions'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(wf)}>
                      {wf.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setConfirmId(wf.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
