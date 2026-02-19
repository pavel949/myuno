import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, Zap, Mail, MessageSquare, Bell, Clock, Target, Users, MoreHorizontal, Loader2, Trash2
} from 'lucide-react';
import { useMCCAutomation } from '@/hooks/useMCCAutomation';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MCCBroadcastPanel } from './MCCBroadcastPanel';

const TRIGGER_OPTIONS = [
  { value: 'signup', label: 'signup — новая регистрация' },
  { value: 'dormant_30d', label: 'dormant_30d — не заходил 30 дней' },
  { value: 'high_score', label: 'high_score — высокий lead score' },
  { value: 'cart_abandoned', label: 'cart_abandoned — брошенная корзина' },
  { value: 'booking_completed', label: 'booking_completed — завершён заказ' },
  { value: 'lead_scored', label: 'lead_scored — лид оценён' },
  { value: 'user_inactive', label: 'user_inactive — неактивный пользователь' },
];

const ACTION_OPTIONS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'push', label: 'Push', icon: Bell },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

function getTriggerIcon(trigger: string) {
  if (trigger.includes('signup') || trigger.includes('user')) return Users;
  if (trigger.includes('cart') || trigger.includes('lead')) return Target;
  if (trigger.includes('dormant') || trigger.includes('inactive')) return Clock;
  return Zap;
}

function getActionIcon(action: string) {
  if (action === 'email') return Mail;
  if (action === 'whatsapp') return MessageSquare;
  if (action === 'push' || action === 'notification') return Bell;
  return Zap;
}

function CreateRuleDialog({ onCreate, isCreating }: { onCreate: (rule: any) => void; isCreating: boolean }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('signup');
  const [selectedActions, setSelectedActions] = useState<string[]>(['email']);

  const handleSubmit = () => {
    if (!name) return;
    onCreate({
      name,
      description,
      trigger_type: triggerType,
      trigger_conditions: { trigger: triggerType },
      actions: selectedActions.map(a => ({ type: a })),
      is_active: true,
    });
    setOpen(false);
    setName('');
    setDescription('');
    setTriggerType('signup');
    setSelectedActions(['email']);
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Новое правило' : 'New Rule'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Создать правило автоматизации' : 'Create Automation Rule'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{isRu ? 'Название' : 'Name'}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={isRu ? 'Welcome серия' : 'Welcome series'} />
          </div>
          <div>
            <Label>{isRu ? 'Описание' : 'Description'}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>{isRu ? 'Триггер' : 'Trigger'}</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isRu ? 'Действия' : 'Actions'}</Label>
            <div className="flex gap-2 mt-1">
              {ACTION_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={selectedActions.includes(value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAction(value)}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name || isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isRu ? 'Создать' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MCCAutomationTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { rules, activeRules, totalExecutions, isLoading, toggleRule, createRule, deleteRule, isCreating } = useMCCAutomation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isRu ? 'Автоматизация' : 'Automation'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Правила и триггеры для автоматических действий' : 'Rules and triggers for automated actions'}
          </p>
        </div>
        <CreateRuleDialog onCreate={createRule} isCreating={isCreating} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{activeRules.length}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Активных правил' : 'Active Rules'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{rules.length}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего правил' : 'Total Rules'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего выполнений' : 'Total Executions'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{rules.length > 0 ? `${Math.round((activeRules.length / rules.length) * 100)}%` : '—'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Активность' : 'Active Rate'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{isRu ? 'Нет правил автоматизации. Создайте первое!' : 'No automation rules yet. Create one!'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const TriggerIcon = getTriggerIcon(rule.trigger_type);
            const actions = Array.isArray(rule.actions) ? rule.actions : Object.values(rule.actions || {});

            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${rule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <TriggerIcon className={`h-5 w-5 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? (isRu ? 'Активно' : 'Active') : (isRu ? 'Выкл' : 'Disabled')}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-xs">{rule.trigger_type}</Badge>
                          <div className="flex items-center gap-1">
                            {actions.map((action: any, idx) => {
                              const actionType = typeof action === 'string' ? action : action?.type || '';
                              const ActionIcon = getActionIcon(actionType);
                              return <ActionIcon key={idx} className="h-3.5 w-3.5" />;
                            })}
                          </div>
                          <span>{(rule.executions_count || 0).toLocaleString()} {isRu ? 'выполнений' : 'executions'}</span>
                          {rule.last_executed_at && (
                            <span>
                              {isRu ? 'Последний:' : 'Last:'}{' '}
                              {formatDistanceToNow(new Date(rule.last_executed_at), { addSuffix: true, locale: isRu ? ru : undefined })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Broadcast Panel */}
      <MCCBroadcastPanel />
    </div>
  );
}
