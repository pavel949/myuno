/**
 * MC Webhooks page — manage outbound webhook endpoints.
 * Route: /mc/developer/webhooks
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebhookEndpoints, useCreateWebhook, useToggleWebhook, useDeleteWebhook, WEBHOOK_EVENTS } from '@/hooks/useWebhooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Webhook, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WebhooksPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: endpoints = [], isLoading } = useWebhookEndpoints();
  const createMutation = useCreateWebhook();
  const toggleMutation = useToggleWebhook();
  const deleteMutation = useDeleteWebhook();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (e: string) => {
    setSelectedEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  };

  const handleCreate = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    await createMutation.mutateAsync({ url: url.trim(), description: description.trim() || undefined, events: selectedEvents });
    setUrl(''); setDescription(''); setSelectedEvents([]); setOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Webhooks' : 'Webhooks'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Получайте события компании на ваш URL в реальном времени.' : 'Receive company events on your URL in real time.'}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      <div className="space-y-2">
        {endpoints.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
            <Webhook className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isRu ? 'Нет webhook-ов.' : 'No webhooks yet.'}</p>
          </CardContent></Card>
        ) : endpoints.map((e) => (
          <Card key={e.id} className={cn(!e.is_active && 'opacity-60')}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Webhook className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{e.url}</p>
                  {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.events.slice(0, 6).map((ev) => <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>)}
                    {e.events.length > 6 && <Badge variant="outline" className="text-[10px]">+{e.events.length - 6}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    {e.last_success_at && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" />{new Date(e.last_success_at).toLocaleDateString()}</span>}
                    {e.failure_count > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" />{e.failure_count} {isRu ? 'ошибок' : 'fails'}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={e.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: e.id, is_active: v })} />
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(e.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader><SheetTitle>{isRu ? 'Новый webhook' : 'New webhook'}</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL</label>
              <Input value={url} onChange={(ev) => setUrl(ev.target.value)} placeholder="https://your-server.com/webhook" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{isRu ? 'Описание' : 'Description'}</label>
              <Textarea value={description} onChange={(ev) => setDescription(ev.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">{isRu ? 'События' : 'Events'} ({selectedEvents.length})</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto border rounded-md p-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                    <Checkbox checked={selectedEvents.includes(ev)} onCheckedChange={() => toggleEvent(ev)} />
                    <span className="font-mono">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!url.trim() || selectedEvents.length === 0 || createMutation.isPending}>
              {createMutation.isPending ? (isRu ? 'Создание…' : 'Creating…') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
