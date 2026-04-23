/**
 * Visual Automation Rules Builder
 * Allows creating business rules with trigger → condition → action pattern
 */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMCCAutomation, type NewAutomationRule } from '@/hooks/useMCCAutomation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Zap, ArrowRight, Power } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_ENTITIES = [
  { value: 'vendor_prospect', labelEn: 'Vendor Prospect', labelRu: 'Вендор-проспект' },
  { value: 'crm_contact', labelEn: 'CRM Contact', labelRu: 'CRM контакт' },
  { value: 'agent_deal', labelEn: 'Deal', labelRu: 'Сделка' },
  { value: 'property_booking', labelEn: 'Booking', labelRu: 'Бронирование' },
  { value: 'property_financial', labelEn: 'Invoice/Payment', labelRu: 'Счёт/Платёж' },
  { value: 'property', labelEn: 'Property', labelRu: 'Объект' },
];

const CONDITION_FIELDS: Record<string, { value: string; labelEn: string; labelRu: string }[]> = {
  vendor_prospect: [
    { value: 'ai_score', labelEn: 'AI Score', labelRu: 'AI балл' },
    { value: 'status', labelEn: 'Status', labelRu: 'Статус' },
    { value: 'category', labelEn: 'Category', labelRu: 'Категория' },
  ],
  crm_contact: [
    { value: 'source', labelEn: 'Source', labelRu: 'Источник' },
    { value: 'lifecycle_stage', labelEn: 'Lifecycle Stage', labelRu: 'Стадия' },
    { value: 'scoring', labelEn: 'Score', labelRu: 'Балл' },
  ],
  agent_deal: [
    { value: 'stage', labelEn: 'Stage', labelRu: 'Этап' },
    { value: 'deal_value', labelEn: 'Deal Value', labelRu: 'Сумма сделки' },
    { value: 'days_stale', labelEn: 'Days Without Update', labelRu: 'Дней без обновления' },
  ],
  property_booking: [
    { value: 'status', labelEn: 'Status', labelRu: 'Статус' },
    { value: 'total_amount', labelEn: 'Total Amount', labelRu: 'Сумма' },
    { value: 'rating', labelEn: 'Guest Rating', labelRu: 'Оценка гостя' },
  ],
  property_financial: [
    { value: 'status', labelEn: 'Status', labelRu: 'Статус' },
    { value: 'days_overdue', labelEn: 'Days Overdue', labelRu: 'Дней просрочки' },
    { value: 'amount', labelEn: 'Amount', labelRu: 'Сумма' },
  ],
  property: [
    { value: 'occupancy_percent', labelEn: 'Occupancy %', labelRu: 'Загрузка %' },
    { value: 'days_vacant', labelEn: 'Days Vacant', labelRu: 'Дней пустует' },
  ],
};

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: '∋' },
];

const ACTION_TYPES = [
  { value: 'create_task', labelEn: 'Create Task', labelRu: 'Создать задачу' },
  { value: 'send_email', labelEn: 'Send Email', labelRu: 'Отправить email' },
  { value: 'send_whatsapp', labelEn: 'Send WhatsApp', labelRu: 'Отправить WhatsApp' },
  { value: 'change_stage', labelEn: 'Change Stage', labelRu: 'Сменить стадию' },
  { value: 'alert_dashboard', labelEn: 'Alert on Dashboard', labelRu: 'Алерт в дашборд' },
  { value: 'run_agent', labelEn: 'Run AI Agent', labelRu: 'Запустить AI-агента' },
];

interface RuleFormData {
  name: string;
  triggerEntity: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  actionType: string;
  actionConfig: string;
  cooldownHours: number;
}

const EMPTY_FORM: RuleFormData = {
  name: '',
  triggerEntity: '',
  conditionField: '',
  conditionOperator: 'gt',
  conditionValue: '',
  actionType: 'create_task',
  actionConfig: '',
  cooldownHours: 0,
};

export function AutomationRulesBuilder() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { rules, isLoading, toggleRule, createRule, deleteRule, isCreating } = useMCCAutomation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);

  const conditionFields = CONDITION_FIELDS[form.triggerEntity] || [];

  const handleCreate = () => {
    if (!form.name || !form.triggerEntity || !form.conditionField || !form.conditionValue) {
      toast.error(isRu ? 'Заполните все поля' : 'Please fill all fields');
      return;
    }

    const rule: NewAutomationRule = {
      name: form.name,
      description: `When ${form.triggerEntity}.${form.conditionField} ${form.conditionOperator} ${form.conditionValue} → ${form.actionType}`,
      trigger_type: form.triggerEntity,
      trigger_conditions: {
        entity_type: form.triggerEntity,
        field: form.conditionField,
        operator: form.conditionOperator,
        value: form.conditionValue,
        cooldown_hours: form.cooldownHours,
      },
      actions: [{
        type: form.actionType,
        config: form.actionConfig ? JSON.parse(form.actionConfig) : {},
      }],
      is_active: true,
    };

    createRule(rule);
    setForm(EMPTY_FORM);
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isRu ? 'Правила автоматизации' : 'Automation Rules'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Настройте бизнес-правила без кода' : 'Set up business rules without code'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {isRu ? 'Новое правило' : 'New Rule'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Создать правило' : 'Create Rule'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-1">
                <div>
                  <Label>{isRu ? 'Название' : 'Rule Name'}</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={isRu ? 'Напр: Авто-follow-up для hot leads' : 'e.g. Auto follow-up for hot leads'}
                  />
                </div>

                {/* Trigger */}
                <div className="p-3 bg-muted/50 rounded-none space-y-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {isRu ? 'Когда (триггер)' : 'When (Trigger)'}
                  </p>
                  <Select value={form.triggerEntity} onValueChange={v => setForm(f => ({ ...f, triggerEntity: v, conditionField: '' }))}>
                    <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите сущность' : 'Select entity'} /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_ENTITIES.map(e => (
                        <SelectItem key={e.value} value={e.value}>{isRu ? e.labelRu : e.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                {form.triggerEntity && (
                  <div className="p-3 bg-muted/50 rounded-none space-y-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {isRu ? 'Если (условие)' : 'If (Condition)'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={form.conditionField} onValueChange={v => setForm(f => ({ ...f, conditionField: v }))}>
                        <SelectTrigger><SelectValue placeholder={isRu ? 'Поле' : 'Field'} /></SelectTrigger>
                        <SelectContent>
                          {conditionFields.map(f => (
                            <SelectItem key={f.value} value={f.value}>{isRu ? f.labelRu : f.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={form.conditionOperator} onValueChange={v => setForm(f => ({ ...f, conditionOperator: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={form.conditionValue}
                        onChange={e => setForm(f => ({ ...f, conditionValue: e.target.value }))}
                        placeholder={isRu ? 'Значение' : 'Value'}
                      />
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="p-3 bg-muted/50 rounded-none space-y-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {isRu ? 'Тогда (действие)' : 'Then (Action)'}
                  </p>
                  <Select value={form.actionType} onValueChange={v => setForm(f => ({ ...f, actionType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(a => (
                        <SelectItem key={a.value} value={a.value}>{isRu ? a.labelRu : a.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cooldown */}
                <div>
                  <Label>{isRu ? 'Кулдаун (часы)' : 'Cooldown (hours)'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.cooldownHours}
                    onChange={e => setForm(f => ({ ...f, cooldownHours: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu ? 'Не срабатывать повторно в течение N часов' : 'Do not fire again within N hours'}
                  </p>
                </div>

                <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                  {isCreating ? '...' : isRu ? 'Создать правило' : 'Create Rule'}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {isRu ? 'Нет правил автоматизации. Создайте первое!' : 'No automation rules yet. Create one!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const conditions = rule.trigger_conditions as Record<string, unknown>;
            const actions = (Array.isArray(rule.actions) ? rule.actions : []) as { type?: string }[];
            return (
              <Card key={rule.id} className={cn(!rule.is_active && 'opacity-60')}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={v => toggleRule(rule.id, v)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rule.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {(conditions.entity_type as string) || rule.trigger_type}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px]">
                          {conditions.field as string} {conditions.operator as string} {conditions.value as string}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge className="text-[10px] bg-primary/10 text-primary">
                          {actions[0]?.type || 'action'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {rule.executions_count}x
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
