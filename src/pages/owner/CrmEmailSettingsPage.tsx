/**
 * CrmEmailSettingsPage — /mc/crm-emails/settings
 *
 * Connect / disconnect a Google Workspace inbox for the owner-CRM. When
 * connected, CRM emails are sent through Gmail (so they appear in Sent
 * folder) and replies are auto-synced into contact timelines.
 */
import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCrmEmailAccount,
  useConnectGmail,
  useDisconnectGmail,
  useTriggerGmailSync,
} from '@/hooks/useCrmEmailAccount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, Mail, RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale, enUS as enLocale } from 'date-fns/locale';

const STATUS_META: Record<string, { badge: 'default' | 'secondary' | 'destructive' | 'outline'; ru: string; en: string }> = {
  ok: { badge: 'default', ru: 'Активна', en: 'Active' },
  pending: { badge: 'secondary', ru: 'Ожидает первой синхронизации', en: 'Awaiting first sync' },
  error: { badge: 'destructive', ru: 'Ошибка синхронизации', en: 'Sync error' },
  reauth_required: { badge: 'destructive', ru: 'Нужно переподключить', en: 'Reconnect required' },
};

export default function CrmEmailSettingsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = isRu ? ruLocale : enLocale;
  const [params, setParams] = useSearchParams();

  const { data: account, isLoading } = useCrmEmailAccount();
  const connect = useConnectGmail();
  const disconnect = useDisconnectGmail();
  const sync = useTriggerGmailSync();

  // Show banner from OAuth callback redirect.
  useEffect(() => {
    const status = params.get('status');
    if (status === 'connected') {
      toast.success(isRu ? 'Gmail подключён' : 'Gmail connected');
      params.delete('status');
      params.delete('message');
      setParams(params, { replace: true });
    } else if (status === 'error') {
      const msg = params.get('message') || 'unknown';
      toast.error(isRu ? 'Не удалось подключить Gmail' : 'Gmail connection failed', { description: msg });
      params.delete('status');
      params.delete('message');
      setParams(params, { replace: true });
    }
  }, [params, setParams, isRu]);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <header className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          CRM · {isRu ? 'Настройки почты' : 'Email settings'}
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
          {isRu ? 'Почтовая интеграция' : 'Email integration'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          {isRu
            ? 'Подключите Google Workspace, чтобы отправлять письма из CRM от вашего адреса и получать ответы прямо в карточку контакта.'
            : 'Connect your Google Workspace inbox to send CRM emails from your own address and receive replies inside contact timelines.'}
        </p>
      </header>

      {isLoading && <Skeleton className="h-40 w-full rounded-none" />}

      {!isLoading && !account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-5 h-5 text-primary" strokeWidth={1.75} />
              {isRu ? 'Подключить Gmail' : 'Connect Gmail'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Письма из CRM будут отправляться через ваш Gmail и автоматически попадать в папку "Отправленные". Входящие ответы появятся в карточке контакта в течение 2 минут.'
                : 'CRM emails will be sent via your Gmail and land in your Sent folder automatically. Inbound replies appear in the contact card within ~2 minutes.'}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li>{isRu ? 'Требуется Google Workspace (домен)' : 'Requires Google Workspace domain account'}</li>
              <li>{isRu ? 'Запрашиваемые разрешения: send, readonly, modify' : 'Requested scopes: send, readonly, modify'}</li>
              <li>{isRu ? 'Refresh-токен хранится зашифрованным в Supabase Vault' : 'Refresh token is stored encrypted in Supabase Vault'}</li>
            </ul>
            <Button
              onClick={() => connect.mutate()}
              disabled={connect.isPending}
              className="w-full sm:w-auto"
            >
              {connect.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {isRu ? 'Подключить Gmail' : 'Connect Gmail'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && account && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  {account.last_sync_status === 'ok' ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  ) : account.last_sync_status === 'reauth_required' || account.last_sync_status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={1.75} />
                  ) : (
                    <Mail className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base leading-tight">{account.email_address}</CardTitle>
                  {account.display_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{account.display_name}</p>
                  )}
                </div>
              </div>
              <Badge variant={STATUS_META[account.last_sync_status]?.badge ?? 'secondary'}>
                {isRu ? STATUS_META[account.last_sync_status]?.ru : STATUS_META[account.last_sync_status]?.en}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">{isRu ? 'Провайдер' : 'Provider'}</dt>
                <dd className="font-mono text-[13px]">{account.provider}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{isRu ? 'Последняя синхронизация' : 'Last sync'}</dt>
                <dd className="font-mono text-[13px]">
                  {account.last_synced_at
                    ? formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true, locale: dateLocale })
                    : (isRu ? '—' : '—')}
                </dd>
              </div>
              {account.last_sync_error && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs">{isRu ? 'Ошибка' : 'Error'}</dt>
                  <dd className="text-destructive text-xs font-mono break-all">{account.last_sync_error}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                {sync.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {isRu ? 'Синхронизировать сейчас' : 'Sync now'}
              </Button>
              {account.last_sync_status === 'reauth_required' && (
                <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
                  <Mail className="w-4 h-4 mr-2" />
                  {isRu ? 'Переподключить' : 'Reconnect'}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => disconnect.mutate(account.id)}
                disabled={disconnect.isPending}
                className="text-destructive hover:text-destructive"
              >
                {disconnect.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unplug className="w-4 h-4 mr-2" />}
                {isRu ? 'Отключить' : 'Disconnect'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground pt-2">
        <Link to="/mc/crm-emails" className="underline hover:text-foreground">
          ← {isRu ? 'Все письма CRM' : 'All CRM emails'}
        </Link>
      </p>
    </div>
  );
}
