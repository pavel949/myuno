/**
 * /account/newbuild-alerts — global alert preferences for newbuild favorites.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Save, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { EmptyState } from '@/components/uno/EmptyState';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNbAlertPreferences, type NbAlertPreferences } from '@/hooks/useNbAlertPreferences';
import { toast } from 'sonner';

export default function NewbuildAlerts() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data, isLoading, save } = useNbAlertPreferences();
  const [draft, setDraft] = useState<NbAlertPreferences | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  if (!user) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={isRu ? 'Уведомления о новостройках' : 'Newbuild alerts'} showBack />
          <EmptyState
            icon={Bell}
            title={isRu ? 'Войдите в аккаунт' : 'Sign in required'}
            description={isRu ? 'Войдите, чтобы настроить уведомления' : 'Sign in to configure alerts'}
            action={<Button onClick={() => navigate('/auth')}>{isRu ? 'Войти' : 'Sign in'}</Button>}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  if (isLoading || !draft) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={isRu ? 'Уведомления о новостройках' : 'Newbuild alerts'} showBack />
          <LoadingSpinner />
        </PageContainer>
      </AppLayout>
    );
  }

  const set = <K extends keyof NbAlertPreferences>(k: K, v: NbAlertPreferences[K]) =>
    setDraft((prev) => (prev ? { ...prev, [k]: v } : prev));

  const handleSave = async () => {
    try {
      await save.mutateAsync(draft);
      toast.success(isRu ? 'Настройки сохранены' : 'Preferences saved');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={isRu ? 'Уведомления о новостройках' : 'Newbuild alerts'} showBack />

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">{isRu ? 'Каналы доставки' : 'Delivery channels'}</h3>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={draft.email ?? ''}
                onChange={(e) => set('email', e.target.value || null)}
                placeholder={user.email ?? 'your@email.com'}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRu ? 'Получать на email' : 'Receive via email'}</span>
                <Switch checked={draft.channel_email} onCheckedChange={(v) => set('channel_email', v)} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <Label>WhatsApp</Label>
              <Input
                value={draft.whatsapp_phone ?? ''}
                onChange={(e) => set('whatsapp_phone', e.target.value.replace(/[^0-9+]/g, '') || null)}
                placeholder="+66922407355"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isRu ? 'Получать в WhatsApp' : 'Receive via WhatsApp'}</span>
                <Switch checked={draft.channel_whatsapp} onCheckedChange={(v) => set('channel_whatsapp', v)} />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">{isRu ? 'Что присылать' : 'What to send'}</h3>
            {[
              { k: 'notify_new_units', ru: 'Новые юниты в избранных ЖК', en: 'New units in favourite projects' },
              { k: 'notify_progress_updates', ru: 'Апдейты стройки', en: 'Construction progress updates' },
              { k: 'notify_price_changes', ru: 'Изменения цен', en: 'Price changes' },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between">
                <span className="text-sm">{isRu ? row.ru : row.en}</span>
                <Switch
                  checked={draft[row.k as keyof NbAlertPreferences] as boolean}
                  onCheckedChange={(v) => set(row.k as keyof NbAlertPreferences, v as never)}
                />
              </div>
            ))}
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">{isRu ? 'Тихие часы' : 'Quiet hours'}</h3>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'В этом промежутке уведомления откладываются.' : 'Alerts are deferred during this window.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRu ? 'С (час)' : 'From (hour)'}</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={draft.quiet_hours_start ?? ''}
                  onChange={(e) => set('quiet_hours_start', e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">{isRu ? 'До (час)' : 'To (hour)'}</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={draft.quiet_hours_end ?? ''}
                  onChange={(e) => set('quiet_hours_end', e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
            </div>
          </Card>

          <Button onClick={handleSave} disabled={save.isPending} className="w-full">
            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
