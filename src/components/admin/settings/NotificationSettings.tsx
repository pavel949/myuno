import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Phone, Save } from 'lucide-react';

export function NotificationSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-notification-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['admin_emails', 'admin_whatsapp']);

      const result = {
        emails: 'pavel@ignatevestate.com, pi@myuno.app',
        whatsapp: '66922407355',
      };

      (data || []).forEach(row => {
        if (row.key === 'admin_emails') {
          try {
            const parsed = typeof row.value === 'string' ? JSON.parse(row.value as string) : row.value;
            if (Array.isArray(parsed)) result.emails = parsed.join(', ');
          } catch { /* keep default */ }
        }
        if (row.key === 'admin_whatsapp') {
          result.whatsapp = String(row.value);
        }
      });

      return result;
    },
  });

  const [emails, setEmails] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (settings) {
      setEmails(settings.emails);
      setWhatsapp(settings.whatsapp);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
      const phone = whatsapp.replace(/[^0-9]/g, '');

      for (const setting of [
        { key: 'admin_emails', value: JSON.stringify(emailList) },
        { key: 'admin_whatsapp', value: phone },
      ]) {
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', setting.key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('system_settings')
            .update({ value: setting.value } as any)
            .eq('key', setting.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('system_settings')
            .insert({ key: setting.key, value: setting.value } as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success(isRu ? 'Настройки сохранены' : 'Settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin-notification-settings'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{isRu ? 'Уведомления администратора' : 'Admin Notifications'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {isRu ? 'Email-адреса (через запятую)' : 'Email addresses (comma-separated)'}
          </Label>
          <Input value={emails} onChange={e => setEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {isRu ? 'WhatsApp номер' : 'WhatsApp number'}
          </Label>
          <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="66922407355" />
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          {isRu ? 'Сохранить' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
