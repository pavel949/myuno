import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { formatServicePrice } from '@/lib/services/formatServicePrice';
import { formatPhuketTime } from '@/lib/services/slots';
import { useMyProvider, useProviderHours, useProviderOrders, useProviderServicesAdmin } from '@/hooks/useServiceMarketplace';

const NEXT: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
};

export default function VendorServiceDesk() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const providerQ = useMyProvider(user?.id);
  if (providerQ.isLoading) return <div className="p-4 space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-40" /></div>;
  if (providerQ.isError) return <p className="p-4 text-destructive">{L('Не удалось загрузить данные', 'Failed to load', 'โหลดไม่สำเร็จ')}</p>;
  if (!providerQ.data) return (
    <div className="p-6 max-w-md space-y-3">
      <h1 className="text-xl font-serif">{L('Кабинет исполнителя', 'Service desk', 'โต๊ะบริการ')}</h1>
      <p className="text-sm text-muted-foreground">{L('К вашей учётной записи не привязан профиль исполнителя.', 'No provider profile is linked to your account.', 'ไม่มีโปรไฟล์ผู้ให้บริการในบัญชีของคุณ')}</p>
      <Button asChild><Link to="/become-partner">{L('Подать заявку на подключение', 'Become a partner', 'เป็นพาร์ทเนอร์')}</Link></Button>
    </div>
  );

  return <ProviderServiceDesk key={`${user?.id}:${providerQ.data.id}`} provider={providerQ.data} />;
}

/** Shared canonical service desk; its queries and writes retain database RLS. */
export function ProviderServiceDesk({ provider }: { provider: { id: string; name: string } }) {
  const { language } = useLanguage();
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });
  const qc = useQueryClient();
  const pid = provider.id;
  const servicesQ = useProviderServicesAdmin(pid);
  const hoursQ = useProviderHours(pid);
  const ordersQ = useProviderOrders(pid);
  const [newHours, setNewHours] = useState({ weekday: 1, start: '09:00', end: '18:00' });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const STATUS: Record<string, string> = {
    pending: L('Поступил', 'New', 'ใหม่'), confirmed: L('Подтверждён', 'Confirmed', 'ยืนยันแล้ว'),
    in_progress: L('Выполняется', 'In progress', 'กำลังทำ'), completed: L('Выполнен', 'Completed', 'เสร็จแล้ว'),
    cancelled: L('Отменён', 'Cancelled', 'ยกเลิก'), rejected: L('Отклонён', 'Declined'), assigned: L('Назначен', 'Assigned'),
  };
  const WD = language === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : language === 'th' ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fail = () => toast.error(L('Не удалось сохранить изменения', 'Could not save', 'บันทึกไม่สำเร็จ'));

  const setStatus = async (id: string, previousStatus: string, status: string) => {
    if (!pid || savingRef.current || !NEXT[previousStatus]?.includes(status)) return;
    savingRef.current = true;
    setSaving(true);
    const patch: { status: string; started_at?: string; completed_at?: string } = { status };
    if (status === 'in_progress') patch.started_at = new Date().toISOString();
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    try {
      const { data, error } = await supabase.from('service_orders').update(patch).eq('id', id).eq('provider_id', pid).eq('status', previousStatus).select('id').single();
      if (error || !data) return fail();
      qc.invalidateQueries({ queryKey: ['provider-service-orders', pid] });
      qc.invalidateQueries({ queryKey: ['guest-service-orders'] });
      qc.invalidateQueries({ queryKey: ['provider-busy', pid] });
    } catch { fail(); } finally { savingRef.current = false; setSaving(false); }
  };
  const save = async (write: () => PromiseLike<{ data: unknown; error: unknown }>, invalidate: string[]) => {
    if (!pid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const { data, error } = await write();
      if (error || !data) return fail();
      for (const key of invalidate) void qc.invalidateQueries({ queryKey: [key] });
    } catch { fail(); } finally { savingRef.current = false; setSaving(false); }
  };
  const toggleService = (id: string, is_active: boolean) => save(
    () => supabase.from('services').update({ is_active }).eq('id', id).eq('provider_id', pid!).select('id').single(),
    ['provider-services-admin', 'marketplace-services'],
  );
  const addHours = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(newHours.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(newHours.end)
      || newHours.end <= newHours.start || !Number.isInteger(newHours.weekday) || newHours.weekday < 0 || newHours.weekday > 6) return fail();
    return save(() => supabase.from('provider_availability').insert({ provider_id: pid!, weekday: newHours.weekday, start_time: newHours.start, end_time: newHours.end }).select('id').single(), ['provider-hours']);
  };
  const removeHours = (id: string) => save(
    () => supabase.from('provider_availability').delete().eq('id', id).eq('provider_id', pid!).select('id').single(), ['provider-hours'],
  );

  const orders = ordersQ.data ?? [];
  const openCount = orders.filter((o) => ['pending', 'confirmed', 'in_progress'].includes(o.status ?? '')).length;

  return (
    <div className="p-4 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-serif">{L('Кабинет исполнителя', 'Service desk', 'โต๊ะบริการ')} · {provider.name}</h1>
        <p className="text-sm text-muted-foreground">{L('Заказы, график приёма и перечень услуг, которые клиенты видят в разделе «Услуги».', 'Orders, schedule and the services customers see in Services.', 'คำสั่งซื้อ ตารางเวลา และบริการ')}</p>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="rounded-none">
          <TabsTrigger value="orders">{L('Заказы', 'Orders', 'คำสั่งซื้อ')} ({openCount})</TabsTrigger>
          <TabsTrigger value="hours">{L('График приёма', 'Working hours', 'เวลาทำการ')}</TabsTrigger>
          <TabsTrigger value="services">{L('Услуги', 'Services', 'บริการ')}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-2">
          {ordersQ.isLoading ? <Skeleton className="h-24" /> : ordersQ.isError ? <p className="text-destructive text-sm">{L('Не удалось загрузить данные', 'Failed to load', 'โหลดไม่สำเร็จ')}</p>
            : orders.length === 0 ? <p className="text-sm text-muted-foreground border border-border p-4">{L('Заказов пока нет.', 'No orders yet.', 'ยังไม่มีคำสั่งซื้อ')}</p>
            : orders.map((o) => (
              <div key={o.id} className="border border-border bg-card p-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{(language === 'ru' ? o.service_name_ru : o.service_name) || o.service_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {o.scheduled_at ? `${new Date(o.scheduled_at).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB', { timeZone: 'Asia/Bangkok' })} ${formatPhuketTime(new Date(o.scheduled_at))}` : '—'}
                    {` · ${formatServicePrice(o.amount, o.currency, language)}`}
                  </div>
                  <div className="text-xs break-words">{o.guest_name}{o.notes ? ` — ${o.notes}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="rounded-none">{STATUS[o.status ?? ''] ?? `${L('Неизвестный статус', 'Unknown status')}: ${o.status ?? '—'}`}</Badge>
                  {o.guest_phone && <Button size="sm" variant="outline" asChild><a href={`tel:${o.guest_phone}`} aria-label="Call"><Phone className="h-4 w-4" /></a></Button>}
                  {(NEXT[o.status ?? ''] ?? []).map((s) => (
                    <Button key={s} size="sm" disabled={saving} variant={s === 'cancelled' ? 'outline' : 'default'} onClick={() => setStatus(o.id, o.status ?? '', s)}>{STATUS[s]}</Button>
                  ))}
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="hours" className="space-y-3">
          {hoursQ.isError && <p role="alert" className="text-destructive">{L('Не удалось загрузить график.', 'Could not load working hours.', 'โหลดเวลาทำการไม่สำเร็จ')} <Button variant="outline" onClick={() => void hoursQ.refetch()}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button></p>}
          <p className="text-xs text-muted-foreground">{L('Время указывается по Пхукету. Пока график приёма не заполнен, онлайн-запись недоступна.', 'Phuket time. Without working hours online booking stays closed.', 'เวลาภูเก็ต')}</p>
          {(hoursQ.data ?? []).map((h) => (
            <div key={h.id} className="flex items-center gap-3 border border-border p-2 text-sm">
              <span className="w-10">{WD[h.weekday]}</span>
              <span className="font-mono">{h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}</span>
              <Button size="sm" variant="ghost" className="ml-auto" aria-label={L('Удалить', 'Delete')} disabled={saving} onClick={() => removeHours(h.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label={L('День недели', 'Weekday')} className="h-10 border border-input bg-background px-2 text-sm" value={newHours.weekday} onChange={(e) => setNewHours({ ...newHours, weekday: Number(e.target.value) })}>
              {WD.map((w, i) => <option key={i} value={i}>{w}</option>)}
            </select>
            <Input aria-label={L('Начало работы', 'Opening time')} type="time" className="w-28" value={newHours.start} onChange={(e) => setNewHours({ ...newHours, start: e.target.value })} />
            <Input aria-label={L('Конец работы', 'Closing time')} type="time" className="w-28" value={newHours.end} onChange={(e) => setNewHours({ ...newHours, end: e.target.value })} />
            <Button disabled={saving} onClick={addHours}><Plus className="h-4 w-4 mr-1" />{L('Добавить', 'Add', 'เพิ่ม')}</Button>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-2">
          {servicesQ.isError && <p role="alert" className="text-destructive">{L('Не удалось загрузить услуги.', 'Could not load services.', 'โหลดบริการไม่สำเร็จ')} <Button variant="outline" onClick={() => void servicesQ.refetch()}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button></p>}
          {(servicesQ.data ?? []).length === 0 && !servicesQ.isLoading && !servicesQ.isError && <p className="text-sm text-muted-foreground">{L('Услуги пока не добавлены. Их добавляет команда myUNO после проверки.', 'No services yet — added by the myUNO team during review.', 'ยังไม่มีบริการ')}</p>}
          {(servicesQ.data ?? []).map((s) => (
            <div key={s.id} className="flex items-center gap-3 border border-border bg-card p-3 text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{(language === 'ru' ? s.name_ru : s.name_en) || s.name_en}</div>
                <div className="text-xs text-muted-foreground font-mono">{formatServicePrice(s.price, s.currency, language)}{s.duration_minutes != null ? ` · ${s.duration_minutes} ${L('мин', 'min', 'นาที')}` : ''}</div>
              </div>
              {s.approval_status !== 'approved' && <Badge variant="outline" className="rounded-none">{L('На модерации', 'In review', 'รอตรวจ')}</Badge>}
              <Switch disabled={saving} checked={!!s.is_active} onCheckedChange={(v) => toggleService(s.id, v)} aria-label={L('Показывать клиентам', 'Visible', 'แสดง')} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
