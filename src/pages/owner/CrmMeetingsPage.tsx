import { pickLang } from '@/lib/i18n/pickLang';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmMeetings, useCreateMeeting, useDeleteMeeting } from '@/hooks/useCrmMeetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Trash2, MapPin, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, ru, th } from 'date-fns/locale';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CrmMeetingsPage() {
  const { language } = useLanguage();
  const dateLocale = language === 'ru' ? ru : language === 'th' ? th : enUS;
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: meetings = [], isLoading, isError: meetingsError, refetch: refetchMeetings } = useCrmMeetings(companyId);
  const createMeeting = useCreateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('action') !== 'create' || !companyId || !user || meetingsError) return;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, companyId, user, meetingsError]);
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
      toast(pickLang(language, {"en": "Meeting created", "ru": "Встреча создана", "th": "สร้างการนัดหมายแล้ว"}));
    } catch {
      toast.error(pickLang(language, {"en": "Error", "ru": "Ошибка", "th": "เกิดข้อผิดพลาด"}));
    }
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { en: string; ru: string; th: string }> = {
      scheduled: { en: 'Scheduled', ru: 'Запланирована', th: 'กำหนดไว้แล้ว' },
      in_progress: { en: 'In progress', ru: 'В процессе', th: 'กำลังดำเนินการ' },
      completed: { en: 'Completed', ru: 'Завершена', th: 'เสร็จสิ้น' },
      cancelled: { en: 'Cancelled', ru: 'Отменена', th: 'ยกเลิกแล้ว' },
      missed: { en: 'Missed', ru: 'Пропущена', th: 'ไม่ได้เข้าร่วม' },
    };
    // Preserve unfamiliar source values rather than claiming a known state.
    return Object.prototype.hasOwnProperty.call(labels, status) ? pickLang(language, labels[status]) : status;
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' => {
    if (s === 'completed') return 'default';
    if (s === 'cancelled') return 'destructive';
    return 'secondary';
  };

  if (meetingsError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{pickLang(language, {"en": "Failed to load meetings", "ru": "Ошибка загрузки встреч", "th": "โหลดการนัดหมายไม่สำเร็จ"})}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchMeetings()}>
          {pickLang(language, {"en": "Retry", "ru": "Повторить", "th": "ลองอีกครั้ง"})}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{pickLang(language, {"en": "Meetings", "ru": "Встречи", "th": "การนัดหมาย"})}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pickLang(language, {"en": "Manage client meetings", "ru": "Управление встречами с клиентами", "th": "จัดการการนัดหมายกับลูกค้า"})}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{pickLang(language, {"en": "New Meeting", "ru": "Новая встреча", "th": "นัดหมายใหม่"})}</Button>
          </DialogTrigger>
          <DialogContent hideCloseButton>
            <DialogClose className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={pickLang(language, { en: 'Close', ru: 'Закрыть', th: 'ปิด' })}>
              <X className="h-4 w-4" aria-hidden />
            </DialogClose>
            <DialogHeader className="pr-10">
              <DialogTitle>{pickLang(language, {"en": "New Meeting", "ru": "Новая встреча", "th": "นัดหมายใหม่"})}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <p id="meeting-required" className="text-xs text-muted-foreground">
                {pickLang(language, { en: 'Title and date/time are required.', ru: 'Укажите тему, дату и время.', th: 'โปรดระบุหัวข้อ วันที่ และเวลา' })}
              </p>
              <div>
                <Label htmlFor="meeting-title">{pickLang(language, {"en": "Title", "ru": "Тема", "th": "หัวข้อ"})}</Label>
                <Input required aria-describedby="meeting-required" id="meeting-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="meeting-scheduled_at">{pickLang(language, {"en": "Date & Time", "ru": "Дата и время", "th": "วันที่และเวลา"})}</Label>
                <Input required aria-describedby="meeting-required" id="meeting-scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="meeting-duration_minutes">{pickLang(language, {"en": "Duration (min)", "ru": "Длительность (мин)", "th": "ระยะเวลา (นาที)"})}</Label>
                  <Input id="meeting-duration_minutes" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="meeting-location">{pickLang(language, {"en": "Location", "ru": "Место", "th": "สถานที่"})}</Label>
                  <Input id="meeting-location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!form.title || !form.scheduled_at || createMeeting.isPending} className="w-full">
                {createMeeting.isPending ? pickLang(language, { en: 'Creating...', ru: 'Создание...', th: 'กำลังสร้าง...' }) : pickLang(language, { en: 'Create', ru: 'Создать', th: 'สร้าง' })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{pickLang(language, {"en": "Loading...", "ru": "Загрузка...", "th": "กำลังโหลด..."})}</p>
      ) : meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{pickLang(language, {"en": "No meetings", "ru": "Нет встреч", "th": "ยังไม่มีการนัดหมาย"})}</p>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium break-words min-w-0">{m.title}</span>
                    <Badge variant={statusVariant(m.status)} className="text-[10px] whitespace-normal break-words">
                      {statusLabel(m.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex min-w-0 items-center gap-1 break-words">
                      <Clock className="h-3 w-3" />
                      {format(new Date(m.scheduled_at), 'PP p', { locale: dateLocale })} · {m.duration_minutes}{pickLang(language, {"en": " min", "ru": " мин", "th": " นาที"})}
                    </span>
                    {m.location && (
                      <span className="flex min-w-0 items-center gap-1 break-words">
                        <MapPin className="h-3 w-3" /> {m.location}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmId(m.id)}
                  aria-label={pickLang(language, {"en": "Delete", "ru": "Удалить", "th": "ลบ"})}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteMeeting.mutate(confirmId);
          setConfirmId(null);
        }}
        confirmLabel={pickLang(language, { en: 'Delete', ru: 'Удалить', th: 'ลบ' })}
        cancelLabel={pickLang(language, { en: 'Cancel', ru: 'Отмена', th: 'ยกเลิก' })}
        title={pickLang(language, {"en": "Delete meeting?", "ru": "Удалить встречу?", "th": "ลบการนัดหมายนี้หรือไม่?"})}
      />
    </div>
  );
}
