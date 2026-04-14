import { useState } from 'react';
import { useCapitalOutreach } from '@/hooks/capital/useCapitalOutreach';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageCircle, Send, Check, Clock, X, MinusCircle, ExternalLink, Calendar } from 'lucide-react';
import { CHANNEL_LABELS, type ResponseType } from '@/types/capital';

const REACTION_BUTTONS: { type: ResponseType; label: string; icon: typeof Check; color: string }[] = [
  { type: 'interested', label: 'Интересно', icon: Check, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
  { type: 'not_now', label: 'Не сейчас', icon: Clock, color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
  { type: 'declined', label: 'Отказ', icon: X, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { type: 'no_response', label: 'Нет ответа', icon: MinusCircle, color: 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30' },
];

export default function CapitalOutreach() {
  const { todayFeed, isTodayLoading, outreach, isLoading, recordReaction, updateOutreach } = useCapitalOutreach();
  const [tab, setTab] = useState<'today' | 'all'>('today');
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleReaction = async (id: string, type: ResponseType) => {
    try {
      await recordReaction.mutateAsync({ id, response_type: type });
      toast.success(type === 'interested' ? 'Создана сделка в воронке!' : 'Реакция записана');
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleFollowUp = async (id: string) => {
    if (!followUpDate) return;
    try {
      await updateOutreach.mutateAsync({
        id,
        follow_up_date: followUpDate,
        follow_up_done: false,
      });
      toast.success('Follow-up запланирован');
      setFollowUpId(null);
      setFollowUpDate('');
    } catch {
      toast.error('Ошибка');
    }
  };

  const markSent = async (id: string) => {
    try {
      await updateOutreach.mutateAsync({ id, sent_at: new Date().toISOString() });
      toast.success('Отмечено как отправленное');
    } catch {
      toast.error('Ошибка');
    }
  };

  const currentItems = tab === 'today' ? todayFeed : outreach;
  const loading = tab === 'today' ? isTodayLoading : isLoading;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Касания</h1>
        <Badge variant="outline">{todayFeed.length} на сегодня</Badge>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <Button variant={tab === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setTab('today')}
          className={tab === 'today' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
          На сегодня ({todayFeed.length})
        </Button>
        <Button variant={tab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTab('all')}
          className={tab === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
          Все ({outreach.length})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{tab === 'today' ? 'На сегодня касаний нет' : 'Касаний пока нет'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentItems.map((o: Record<string, unknown>) => {
            const contact = o.capital_contacts as Record<string, string> | null;
            const project = o.capital_projects as Record<string, string> | null;
            const phone = contact?.whatsapp_phone || contact?.phone || '';
            const telegramId = contact?.telegram_id || '';

            return (
              <div key={o.id as string} className="rounded-lg border border-border/50 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{contact?.name || 'Контакт'}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {project?.name && <Badge variant="outline" className="text-xs">{project.name}</Badge>}
                      <Badge variant="secondary" className="text-xs">
                        {CHANNEL_LABELS[(o.channel as string) as keyof typeof CHANNEL_LABELS] || o.channel as string}
                      </Badge>
                      {o.response_type && (
                        <Badge className="text-xs">{o.response_type as string}</Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {o.sent_at ? new Date(o.sent_at as string).toLocaleDateString('ru-RU') : 'не отправлено'}
                  </span>
                </div>

                {/* Message preview */}
                {o.message_text && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{o.message_text as string}</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Deep links */}
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}${o.message_text ? `?text=${encodeURIComponent(o.message_text as string)}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markSent(o.id as string)}
                    >
                      <Button variant="outline" size="sm" className="text-green-400 border-green-400/30">
                        <ExternalLink className="w-3 h-3 mr-1" /> WhatsApp
                      </Button>
                    </a>
                  )}
                  {telegramId && (
                    <a href={`https://t.me/${telegramId.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      onClick={() => markSent(o.id as string)}>
                      <Button variant="outline" size="sm" className="text-blue-400 border-blue-400/30">
                        <Send className="w-3 h-3 mr-1" /> Telegram
                      </Button>
                    </a>
                  )}

                  {/* Reaction buttons */}
                  {!o.response_type && (
                    <>
                      <div className="w-px h-6 bg-border self-center mx-1" />
                      {REACTION_BUTTONS.map((rb) => (
                        <Button
                          key={rb.type}
                          variant="ghost"
                          size="sm"
                          className={rb.color}
                          onClick={() => handleReaction(o.id as string, rb.type)}
                        >
                          <rb.icon className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">{rb.label}</span>
                        </Button>
                      ))}
                    </>
                  )}

                  {/* Follow-up */}
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setFollowUpId(followUpId === o.id ? null : o.id as string)}>
                    <Calendar className="w-3 h-3 mr-1" /> Follow-up
                  </Button>
                </div>

                {/* Follow-up date picker */}
                {followUpId === o.id && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Дата follow-up</Label>
                      <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFollowUp(o.id as string)}>
                      Сохранить
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
