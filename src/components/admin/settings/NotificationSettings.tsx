import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, Save } from 'lucide-react';
import { z } from 'zod';
import { normalizeWhatsapp } from '@/lib/seo/normalizeWhatsapp';
import { readAdminSystemSettings, saveAdminSystemSettings, type SystemSettingRow } from '@/lib/adminSystemSettings';

const KEYS = ['admin_emails', 'admin_whatsapp'] as const;
function contacts(rows: SystemSettingRow[]) {
  const values = new Map(rows.map(row => [row.key, row.value]));
  const raw = values.get('admin_emails');
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw ?? [];
  if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) throw new Error('Notification contacts could not be verified.');
  const phone = values.get('admin_whatsapp');
  if (phone !== undefined && phone !== null && typeof phone !== 'string' && typeof phone !== 'number') throw new Error('Notification contacts could not be verified.');
  return { emails: parsed.join(', '), whatsapp: phone == null ? '' : String(phone) };
}

export function NotificationSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const actorId = user?.id ?? null;
  const actor = useRef(actorId); actor.current = actorId;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const queryClient = useQueryClient();
  const key = ['admin-notification-settings', actorId];
  const assertActor = (expected: string | null) => { if (!expected || actor.current !== expected || !alive.current) throw new Error('Settings account changed. Reload before continuing.'); };
  const query = useQuery({
    queryKey: key,
    queryFn: async () => contacts(await readAdminSystemSettings(KEYS, () => assertActor(actorId))),
    enabled: !!actorId,
  });
  const [form, setForm] = useState({ actorId: null as string | null, emails: '', whatsapp: '' });
  const [mustReload, setMustReload] = useState(false);
  useEffect(() => { if (query.data) { setForm({ actorId, ...query.data }); setMustReload(false); } }, [actorId, query.data]);
  const saveMutation = useMutation({
    mutationFn: async (input: { actorId: string; emails: string[]; phone: string }) => {
      const rows = await saveAdminSystemSettings([
        { key: 'admin_emails', value: JSON.stringify(input.emails) }, { key: 'admin_whatsapp', value: input.phone },
      ], () => assertActor(input.actorId));
      return { actorId: input.actorId, ...contacts(rows) };
    },
    onSuccess: result => {
      if (actor.current !== result.actorId || !alive.current) return;
      queryClient.setQueryData(['admin-notification-settings', result.actorId], { emails: result.emails, whatsapp: result.whatsapp });
      setForm(result); setMustReload(false);
      toast.success(isRu ? 'Настройки сохранены и проверены' : 'Settings saved and verified');
    },
    onError: (_error, input) => {
      if (actor.current !== input.actorId || !alive.current) return;
      setMustReload(true); toast.error(isRu ? 'Сохранение не подтверждено. Загрузите настройки заново.' : 'Save not confirmed. Reload settings before retrying.');
    },
  });
  const reload = async () => {
    const expected = actorId; const result = await query.refetch();
    if (actor.current !== expected || !alive.current || result.error || !result.data) return;
    setForm({ actorId: expected, ...result.data }); setMustReload(false);
  };
  if (!actorId) return <p role="alert">{isRu ? 'Войдите для управления настройками.' : 'Sign in to manage settings.'}</p>;
  if (query.error) return <div role="alert"><p>{isRu ? 'Настройки уведомлений недоступны.' : 'Notification settings are unavailable.'}</p><Button disabled={query.isFetching} onClick={() => void reload()}>{isRu ? 'Повторить загрузку' : 'Reload settings'}</Button></div>;
  if (query.isLoading || form.actorId !== actorId) return <p role="status">{isRu ? 'Загрузка настроек…' : 'Loading settings…'}</p>;
  const save = () => {
    const emails = form.emails.split(',').map(value => value.trim()).filter(Boolean);
    const phone = form.whatsapp.trim() ? normalizeWhatsapp(form.whatsapp) : null;
    if (!z.array(z.string().email()).safeParse(emails).success || (form.whatsapp.trim() && !phone)) {
      toast.error(isRu ? 'Проверьте email и номер WhatsApp.' : 'Check the email addresses and WhatsApp number.'); return;
    }
    saveMutation.mutate({ actorId, emails, phone: phone?.digits ?? '' });
  };
  return <Card>
    <CardHeader className="pb-3"><CardTitle className="text-base">{isRu ? 'Уведомления администратора' : 'Admin Notifications'}</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">{isRu ? 'Общие контакты платформы для операционных уведомлений.' : 'Platform-wide contacts for operational notifications.'}</p>
      {mustReload && <div role="alert"><p>{isRu ? 'Сохранение не подтверждено. Сначала загрузите настройки заново.' : 'Save not confirmed. Reload settings before retrying.'}</p><Button disabled={query.isFetching} onClick={() => void reload()}>{isRu ? 'Повторить загрузку' : 'Reload settings'}</Button></div>}
      <div className="space-y-2"><Label htmlFor="admin-notification-emails" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{isRu ? 'Email-адреса (через запятую)' : 'Email addresses (comma-separated)'}</Label>
        <Input id="admin-notification-emails" disabled={saveMutation.isPending || mustReload} value={form.emails} onChange={event => setForm({ ...form, emails: event.target.value })} placeholder="email1@example.com, email2@example.com" /></div>
      <div className="space-y-2"><Label htmlFor="admin-notification-whatsapp" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{isRu ? 'WhatsApp номер' : 'WhatsApp number'}</Label>
        <Input id="admin-notification-whatsapp" disabled={saveMutation.isPending || mustReload} value={form.whatsapp} onChange={event => setForm({ ...form, whatsapp: event.target.value })} /></div>
      <Button onClick={save} disabled={saveMutation.isPending || mustReload || query.isFetching} size="sm">{saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}{isRu ? 'Сохранить' : 'Save'}</Button>
    </CardContent>
  </Card>;
}
