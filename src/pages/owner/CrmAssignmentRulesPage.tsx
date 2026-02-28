import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmAssignmentRules, useCreateAssignmentRule, useDeleteAssignmentRule, useUpdateAssignmentRule } from '@/hooks/useCrmAssignmentRules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Shuffle, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function CrmAssignmentRulesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: rules = [], isLoading } = useCrmAssignmentRules(companyId);
  const createRule = useCreateAssignmentRule();
  const deleteRule = useDeleteAssignmentRule();
  const updateRule = useUpdateAssignmentRule();
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !companyId) return;
    await createRule.mutateAsync({
      company_id: companyId,
      name: newName.trim(),
      pipeline_id: null,
      rule_type: 'round_robin',
      assignees: [],
      is_active: true,
    });
    setNewName('');
    setOpen(false);
    toast.success(isRu ? 'Правило создано' : 'Rule created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Распределение лидов' : 'Lead Assignment'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Round Robin — автоматическое распределение лидов между агентами' : 'Round Robin — automatic lead distribution among agents'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Новое правило' : 'New Rule'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать правило' : 'Create Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={isRu ? 'Название правила' : 'Rule name'}
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={!newName.trim() || createRule.isPending} className="w-full">
                {createRule.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Shuffle className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isRu ? 'Нет правил распределения' : 'No assignment rules yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-primary" />
                    {rule.name}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {rule.rule_type === 'round_robin' ? 'Round Robin' : rule.rule_type}
                    </Badge>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { deleteRule.mutate(rule.id); toast.success(isRu ? 'Удалено' : 'Deleted'); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {rule.assignees.length} {isRu ? 'агентов' : 'agents'}
                  <span className="mx-1">•</span>
                  {isRu ? 'Текущий индекс' : 'Current index'}: {rule.last_assigned_index}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
