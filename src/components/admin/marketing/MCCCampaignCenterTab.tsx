import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Megaphone, Mail, Bell, MessageSquare, Shield,
  Clock, Zap, Loader2, Trash2
} from 'lucide-react';
import { useCampaignRules, useCreateCampaignRule, useToggleCampaignRule, useDeleteCampaignRule } from '@/hooks/useMCCControlTower';
import { toast } from 'sonner';

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  push: Bell,
  email: Mail,
  whatsapp: MessageSquare,
  'in-app': Zap,
};

const ALL_STATES = ['identified', 'first_action', 'returning', 'multi_vertical', 'expat_candidate', 'investor_candidate', 'dormant', 'churned'];
const TRIGGER_EVENTS = ['form_submitted', 'first_service_completed', 'second_service_started', 'session_started', 'inactivity_detected', 'landing_view', 'primary_cta_click'];

interface WizardForm {
  trigger_event: string;
  target_state: string;
  channel: string;
  cooldown_hours: number;
  message_en: string;
  message_ru: string;
}

const EMPTY_FORM: WizardForm = {
  trigger_event: '',
  target_state: '',
  channel: 'push',
  cooldown_hours: 48,
  message_en: '',
  message_ru: '',
};

export function MCCCampaignCenterTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: rules, isLoading } = useCampaignRules();
  const createMut = useCreateCampaignRule();
  const toggleMut = useToggleCampaignRule();
  const deleteMut = useDeleteCampaignRule();
  const [showWizard, setShowWizard] = useState(false);
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);

  const handleCreate = async () => {
    if (!form.trigger_event) {
      toast.error(isRu ? 'Выберите триггер' : 'Select a trigger event');
      return;
    }
    try {
      await createMut.mutateAsync({
        campaign_id: crypto.randomUUID(),
        trigger_event: form.trigger_event,
        target_state: form.target_state || undefined,
        channel: form.channel,
        cooldown_hours: form.cooldown_hours,
        message_template: { en: form.message_en, ru: form.message_ru },
      });
      toast.success(isRu ? 'Правило создано' : 'Rule created');
      setShowWizard(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error(isRu ? 'Ошибка создания' : 'Failed to create');
    }
  };

  const handleToggle = (id: string, current: boolean) => {
    toggleMut.mutate(
      { id, is_active: !current },
      { onSuccess: () => toast.success(isRu ? 'Обновлено' : 'Updated') }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm(isRu ? 'Удалить правило?' : 'Delete this rule?')) return;
    deleteMut.mutate(id, {
      onSuccess: () => toast.success(isRu ? 'Удалено' : 'Deleted'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            {isRu ? 'Центр кампаний L1' : 'Campaign Center L1'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Поведенческие кампании с event-триггерами' : 'Behavior-based campaigns with event triggers'}
          </p>
        </div>
        <Button onClick={() => setShowWizard(!showWizard)}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Создать правило' : 'Create Rule'}
        </Button>
      </div>

      {/* Safety Rules */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{isRu ? 'Правила безопасности' : 'Safety Rules'}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>• Max 1 push / 48h</span>
                <span>• Max 2 email / 7d</span>
                <span>• {isRu ? 'Тихие часы' : 'Quiet hours'}: 22:00-08:00</span>
                <span>• {isRu ? 'Нет рассылок anonymous' : 'No messages to anonymous'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wizard */}
      {showWizard && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Новое правило кампании' : 'New Campaign Rule'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Триггер-событие' : 'Trigger Event'} *</label>
                <Select value={form.trigger_event} onValueChange={(v) => setForm(f => ({ ...f, trigger_event: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите событие' : 'Select event'} />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Целевое состояние' : 'Target State'}</label>
                <Select value={form.target_state} onValueChange={(v) => setForm(f => ({ ...f, target_state: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Любое' : 'Any'} />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Канал' : 'Channel'}</label>
                <Select value={form.channel} onValueChange={(v) => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Кулдаун (часы)' : 'Cooldown (hours)'}</label>
                <Input
                  type="number"
                  value={form.cooldown_hours}
                  onChange={(e) => setForm(f => ({ ...f, cooldown_hours: Number(e.target.value) || 48 }))}
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Шаблон (EN)' : 'Template (EN)'}</label>
                <Input
                  placeholder="Hey {{name}}, check out..."
                  value={form.message_en}
                  onChange={(e) => setForm(f => ({ ...f, message_en: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRu ? 'Шаблон (RU)' : 'Template (RU)'}</label>
                <Input
                  placeholder="Привет {{name}}, посмотрите..."
                  value={form.message_ru}
                  onChange={(e) => setForm(f => ({ ...f, message_ru: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {isRu ? 'Создать' : 'Create'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowWizard(false); setForm(EMPTY_FORM); }}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isRu ? 'Приоритеты сообщений' : 'Message Priority'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">{isRu ? 'Приоритет' : 'Priority'}</th>
                  <th className="text-left p-2 font-medium">{isRu ? 'Тип' : 'Type'}</th>
                  <th className="text-left p-2 font-medium">{isRu ? 'Частота' : 'Frequency'}</th>
                  <th className="text-left p-2 font-medium">{isRu ? 'Тихие часы' : 'Quiet Hours'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { p: 'P0', type: isRu ? 'Транзакционные' : 'Transactional', freq: isRu ? 'Без лимита' : 'Unlimited', quiet: isRu ? 'Нет' : 'None' },
                  { p: 'P1', type: isRu ? 'По действию' : 'Action-triggered', freq: '1 / 24h', quiet: isRu ? 'Да' : 'Yes' },
                  { p: 'P2', type: isRu ? 'Поведенческие' : 'Behavioral', freq: '1 / 48h', quiet: isRu ? 'Да' : 'Yes' },
                  { p: 'P3', type: isRu ? 'Дайджест' : 'Digest', freq: '1 / 7d', quiet: isRu ? 'Да' : 'Yes' },
                ].map(row => (
                  <tr key={row.p} className="border-t">
                    <td className="p-2"><Badge variant="outline">{row.p}</Badge></td>
                    <td className="p-2">{row.type}</td>
                    <td className="p-2">{row.freq}</td>
                    <td className="p-2">{row.quiet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {isRu ? 'Правила кампаний' : 'Campaign Rules'} ({rules?.length || 0})
        </h3>
        {rules && rules.length > 0 ? (
          rules.map((rule: any) => {
            const ChannelIcon = CHANNEL_ICONS[rule.channel] || Bell;
            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${rule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <ChannelIcon className={`h-4 w-4 ${rule.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{rule.trigger_event}</Badge>
                          <span className="text-muted-foreground text-xs">→</span>
                          <Badge variant="secondary" className="text-xs">{rule.target_state || 'any'}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rule.cooldown_hours}h
                          </span>
                          <span>{rule.channel}</span>
                          {rule.message_template && (
                            <span className="truncate max-w-[200px]">
                              "{(rule.message_template as any)?.en || ''}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Нет правил. Создайте первое правило.' : 'No rules yet. Create your first rule.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
