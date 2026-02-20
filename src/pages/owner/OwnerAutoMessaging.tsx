import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingMessageRules, TRIGGER_EVENTS, CHANNELS, BookingMessageRule } from '@/hooks/useBookingMessageRules';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MessageCircle, Clock, Trash2, Zap, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function RuleCard({ rule, isRu, onToggle, onDelete }: {
  rule: BookingMessageRule;
  isRu: boolean;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const trigger = TRIGGER_EVENTS.find(t => t.value === rule.trigger_event);
  const channel = CHANNELS.find(c => c.value === rule.channel);

  return (
    <Card className={cn(
      "p-4 transition-all",
      !rule.is_active && "opacity-50"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-2xl">{trigger?.icon || '📩'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {isRu ? trigger?.labelRu : trigger?.labelEn}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {channel?.icon} {isRu ? channel?.labelRu : channel?.labelEn}
              </Badge>
              {rule.delay_hours > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="w-3 h-3 mr-1" />
                  {rule.delay_hours}h
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {isRu ? (rule.custom_body_ru || rule.custom_body) : rule.custom_body}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={rule.is_active}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(rule.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function OwnerAutoMessaging() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { rules, isLoading, createRule, toggleRule, deleteRule, isCreating } = useBookingMessageRules();
  const { data: properties } = useOwnerProperties();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    trigger_event: 'booking_confirmed',
    channel: 'in_app',
    delay_hours: 0,
    property_id: '',
    custom_subject: '',
    custom_subject_ru: '',
    custom_body: '',
    custom_body_ru: '',
  });

  const handleCreate = async () => {
    const triggerMeta = TRIGGER_EVENTS.find(t => t.value === form.trigger_event);
    await createRule({
      trigger_event: form.trigger_event,
      channel: form.channel,
      delay_hours: form.delay_hours || triggerMeta?.defaultDelay || 0,
      property_id: form.property_id || null,
      custom_subject: form.custom_subject || null,
      custom_subject_ru: form.custom_subject_ru || null,
      custom_body: form.custom_body || `Auto-message for ${form.trigger_event}`,
      custom_body_ru: form.custom_body_ru || null,
    });
    setSheetOpen(false);
    setForm({ trigger_event: 'booking_confirmed', channel: 'in_app', delay_hours: 0, property_id: '', custom_subject: '', custom_subject_ru: '', custom_body: '', custom_body_ru: '' });
  };

  // Group rules by trigger for visual timeline
  const grouped = TRIGGER_EVENTS.map(trigger => ({
    ...trigger,
    rules: rules.filter(r => r.trigger_event === trigger.value),
  })).filter(g => g.rules.length > 0);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowDown className="w-4 h-4 rotate-90" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{isRu ? 'Авто-сообщения' : 'Auto Messages'}</h1>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Автоматические сообщения гостям' : 'Automated guest messages'}
          </p>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="flex items-center gap-2 px-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          {isRu ? 'Цепочка сообщений' : 'Message Chain'}
        </span>
        <Badge variant="secondary" className="text-[10px]">
          {rules.filter(r => r.is_active).length} {isRu ? 'активных' : 'active'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : grouped.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">{isRu ? 'Нет правил' : 'No rules yet'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Создайте автоматические сообщения для гостей' : 'Create automated messages for your guests'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {grouped.map((group, gi) => (
            <React.Fragment key={group.value}>
              {gi > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
              <div className="space-y-2">
                {group.rules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isRu={isRu}
                    onToggle={(id, active) => toggleRule({ id, is_active: active })}
                    onDelete={(id) => deleteRule(id)}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 rounded-full h-14 w-14 shadow-lg z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{isRu ? 'Новое правило' : 'New Rule'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            {/* Trigger */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Триггер' : 'Trigger Event'}
              </label>
              <Select value={form.trigger_event} onValueChange={(v) => setForm(f => ({ ...f, trigger_event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {isRu ? t.labelRu : t.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Канал' : 'Channel'}
              </label>
              <Select value={form.channel} onValueChange={(v) => setForm(f => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {isRu ? c.labelRu : c.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delay */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Задержка (часы)' : 'Delay (hours)'}
              </label>
              <Input
                type="number"
                min={0}
                value={form.delay_hours}
                onChange={(e) => setForm(f => ({ ...f, delay_hours: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Property (optional) */}
            {properties && properties.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {isRu ? 'Объект (необязательно)' : 'Property (optional)'}
                </label>
                <Select value={form.property_id} onValueChange={(v) => setForm(f => ({ ...f, property_id: v === 'all' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
                    {properties.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject EN */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Тема (EN)' : 'Subject (EN)'}
              </label>
              <Input
                value={form.custom_subject}
                onChange={(e) => setForm(f => ({ ...f, custom_subject: e.target.value }))}
                placeholder="Welcome to your stay!"
              />
            </div>

            {/* Body EN */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Сообщение (EN)' : 'Message (EN)'}
              </label>
              <Textarea
                value={form.custom_body}
                onChange={(e) => setForm(f => ({ ...f, custom_body: e.target.value }))}
                placeholder="Hi {{guest_name}}, welcome to {{property_name}}!"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isRu ? 'Переменные: {{guest_name}}, {{property_name}}, {{check_in}}, {{check_out}}' : 'Variables: {{guest_name}}, {{property_name}}, {{check_in}}, {{check_out}}'}
              </p>
            </div>

            {/* Subject RU */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Тема (RU)' : 'Subject (RU)'}
              </label>
              <Input
                value={form.custom_subject_ru}
                onChange={(e) => setForm(f => ({ ...f, custom_subject_ru: e.target.value }))}
                placeholder="Добро пожаловать!"
              />
            </div>

            {/* Body RU */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isRu ? 'Сообщение (RU)' : 'Message (RU)'}
              </label>
              <Textarea
                value={form.custom_body_ru}
                onChange={(e) => setForm(f => ({ ...f, custom_body_ru: e.target.value }))}
                placeholder="Привет {{guest_name}}, добро пожаловать в {{property_name}}!"
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={isCreating || !form.custom_body}
              className="w-full"
            >
              {isCreating ? (isRu ? 'Создание...' : 'Creating...') : (isRu ? 'Создать правило' : 'Create Rule')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
