import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmMeetings, useCreateMeeting, useDeleteMeeting } from '@/hooks/useCrmMeetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Trash2, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CrmMeetingsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: meetings = [], isLoading, isError: meetingsError, refetch: refetchMeetings } = useCrmMeetings(companyId);
  const createMeeting = useCreateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', scheduled_at: '', duration_minutes: '30', location: '' });

  const handleCreate = async () => {
    if (!companyId || !user || !form.title || !form.scheduled_at) return;
    try {
      await createMeeting.mutateAsync({
        company_id: companyId,
        host_user_id: user.id,
        title: form.title,
        meeting_type: 'general',
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes) || 30,
        location: form.location || null,
        status: 'scheduled',
        notes: null,
        contact_id: null,
        deal_id: null,
      });
      setOpen(false);
      setForm({ title: '', scheduled_at: '', duration_minutes: '30', location: '' });
      toast(isRu ? 'Встреча создана' : 'Meeting created');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return 'default';
    if (s === 'cancelled') return 'destructive';
    return 'secondary';
  };

  if (meetingsError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки встреч' : 'Failed to load meetings'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchMeetings()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Встречи' : 'Meetings'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Управление встречами с клиентами' : 'Manage client meetings'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Новая встреча' : 'New Meeting'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новая встреча' : 'New Meeting'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>{isRu ? 'Тема' : 'Title'}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Дата и время' : 'Date & Time'}</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Длительность (мин)' : 'Duration (min)'}</Label>
                  <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                </div>
                <div>
                  <Label>{isRu ? 'Место' : 'Location'}</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.title || !form.scheduled_at || createMeeting.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет встреч' : 'No meetings'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => (
            <Card key={m.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-none bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.title}</span>
                    <Badge variant={statusColor(m.status) as any} className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(m.scheduled_at), 'dd.MM.yyyy HH:mm')} · {m.duration_minutes}{isRu ? ' мин' : ' min'}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {m.location}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    if (confirm(isRu ? 'Удалить?' : 'Delete?')) deleteMeeting.mutate(m.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
