import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCapitalContact } from '@/hooks/capital/useCapitalContacts';
import { useCapitalContacts } from '@/hooks/capital';
import { useCapitalOutreach } from '@/hooks/capital/useCapitalOutreach';
import { useCapitalPipeline } from '@/hooks/capital/useCapitalPipeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, MessageCircle, Send } from 'lucide-react';
import {
  WARMTH_LABELS, WARMTH_COLORS, BUYER_TYPE_LABELS, CHANNEL_LABELS,
  PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS,
  type Warmth, type BuyerType, type PreferredChannel, type PipelineStage,
} from '@/types/capital';

export default function CapitalContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useCapitalContact(id);
  const { updateContact } = useCapitalContacts();
  const { outreach } = useCapitalOutreach(id);
  const { deals } = useCapitalPipeline(id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Контакт не найден</p>
        <Button variant="ghost" onClick={() => navigate('/capital/contacts')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Button>
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      telegram_id: contact.telegram_id || '',
      whatsapp_phone: contact.whatsapp_phone || '',
      notes: contact.notes || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        telegram_id: form.telegram_id || null,
        whatsapp_phone: form.whatsapp_phone || null,
        notes: form.notes || null,
      });
      toast.success('Контакт обновлён');
      setEditing(false);
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/capital/contacts')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold flex-1">{contact.name}</h1>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit}>Редактировать</Button>
        ) : (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Сохранить
          </Button>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-border/50 p-4 space-y-3">
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Имя</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Телефон</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} /></div>
            <div><Label>Telegram</Label><Input value={form.telegram_id} onChange={(e) => setForm({ ...form, telegram_id: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Заметки</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Контакты</p>
              {contact.phone && <p className="text-sm">{contact.phone}</p>}
              {contact.email && <p className="text-sm">{contact.email}</p>}
              {contact.whatsapp_phone && (
                <a href={`https://wa.me/${contact.whatsapp_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-500 hover:underline flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}
              {contact.telegram_id && (
                <a href={`https://t.me/${contact.telegram_id.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                  <Send className="w-3 h-3" /> Telegram
                </a>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Профиль</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Badge className={WARMTH_COLORS[contact.warmth as Warmth]}>{WARMTH_LABELS[contact.warmth as Warmth]}</Badge>
                {contact.buyer_type && <Badge variant="outline">{BUYER_TYPE_LABELS[contact.buyer_type as BuyerType]}</Badge>}
              </div>
              {(contact.budget_min || contact.budget_max) && (
                <p className="text-sm mt-1">Бюджет: {contact.budget_min?.toLocaleString()}–{contact.budget_max?.toLocaleString()} {contact.budget_currency}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Источник</p>
              <p className="text-sm">{contact.source || '—'}</p>
              {contact.notes && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">Заметки</p>
                  <p className="text-sm">{contact.notes}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="outreach">
        <TabsList>
          <TabsTrigger value="outreach">Касания ({outreach.length})</TabsTrigger>
          <TabsTrigger value="deals">Сделки ({deals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="outreach" className="space-y-2 mt-3">
          {outreach.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Касаний пока нет</p>
          ) : (
            outreach.map((o: Record<string, unknown>) => (
              <div key={o.id as string} className="rounded-lg border border-border/30 p-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {CHANNEL_LABELS[(o.channel as string) as keyof typeof CHANNEL_LABELS] || o.channel as string}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {o.sent_at ? new Date(o.sent_at as string).toLocaleDateString('ru-RU') : 'не отправлено'}
                    </span>
                  </div>
                  {o.message_text && <p className="text-sm mt-1 line-clamp-2">{o.message_text as string}</p>}
                  {o.response_type && (
                    <Badge className="mt-1 text-xs" variant="secondary">{o.response_type as string}</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="deals" className="space-y-2 mt-3">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Сделок пока нет</p>
          ) : (
            deals.map((d: Record<string, unknown>) => (
              <div key={d.id as string} className="rounded-lg border border-border/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge className={PIPELINE_STAGE_COLORS[(d.stage as PipelineStage)]}>
                    {PIPELINE_STAGE_LABELS[(d.stage as PipelineStage)]}
                  </Badge>
                  {(d.capital_projects as Record<string, string> | null)?.name && (
                    <span className="text-sm">{(d.capital_projects as Record<string, string>).name}</span>
                  )}
                </div>
                {d.commission_expected && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ожидаемая комиссия: {(d.commission_expected as number).toLocaleString()} {d.price_currency as string}
                  </p>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
