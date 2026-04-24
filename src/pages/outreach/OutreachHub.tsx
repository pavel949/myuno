/**
 * OutreachHub — единый хаб исходящих коммуникаций (Stage 4).
 * URL: /outreach
 * Tabs: vendor / investor / guest / mcc_lead
 *
 * Старые точки входа редиректят сюда:
 * - /admin/crm?tab=outreach → /outreach?audience=vendor
 * - /capital/outreach       → /outreach?audience=investor
 * - /mc/sequences           → /outreach?audience=guest
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Inbox, Users, Megaphone, Sparkles } from 'lucide-react';
import {
  useOutreachMessages,
  useUnifiedCampaigns,
  type OutreachMessage,
} from '@/hooks/useOutreachMessages';
import {
  useOutreachTemplates,
  type OutreachAudience,
} from '@/hooks/useOutreachTemplates';

const AUDIENCE_LABELS: Record<OutreachAudience, { ru: string; icon: typeof Users }> = {
  vendor: { ru: 'Партнёры', icon: Users },
  investor: { ru: 'Инвесторы', icon: Sparkles },
  guest: { ru: 'Гости / MC', icon: Inbox },
  owner: { ru: 'Собственники', icon: Users },
  mcc_lead: { ru: 'Маркетинг', icon: Megaphone },
  custom: { ru: 'Другое', icon: Send },
};

const STATUS_BADGE: Record<string, string> = {
  queued: 'bg-slate-500/20 text-slate-400',
  sending: 'bg-amber-500/20 text-amber-400',
  sent: 'bg-success/20 text-success',
  delivered: 'bg-success/20 text-success',
  opened: 'bg-primary/20 text-primary',
  clicked: 'bg-primary/30 text-primary',
  replied: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
  bounced: 'bg-red-500/20 text-red-400',
};

export default function OutreachHub() {
  const [params, setParams] = useSearchParams();
  const audience = (params.get('audience') as OutreachAudience) || 'vendor';

  const setAudience = (next: string) => {
    const p = new URLSearchParams(params);
    p.set('audience', next);
    setParams(p, { replace: true });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-sm text-muted-foreground">
            Единый центр исходящих коммуникаций по всем аудиториям и каналам
          </p>
        </div>
      </header>

      <Tabs value={audience} onValueChange={setAudience} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full md:w-auto">
          {(['vendor', 'investor', 'guest', 'mcc_lead'] as OutreachAudience[]).map((a) => {
            const Icon = AUDIENCE_LABELS[a].icon;
            return (
              <TabsTrigger key={a} value={a} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {AUDIENCE_LABELS[a].ru}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(['vendor', 'investor', 'guest', 'mcc_lead'] as OutreachAudience[]).map((a) => (
          <TabsContent key={a} value={a} className="mt-4">
            <AudiencePanel audience={a} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AudiencePanel({ audience }: { audience: OutreachAudience }) {
  const { data: messages, isLoading: msgLoading } = useOutreachMessages(audience, 50);
  const { data: templates, isLoading: tmplLoading } = useOutreachTemplates(audience);
  const { data: campaigns, isLoading: campLoading } = useUnifiedCampaigns();

  const audienceCampaigns = useMemo(() => {
    if (!campaigns) return [];
    if (audience === 'investor')
      return campaigns.filter((c) => c.campaign_source === 'capital_campaigns');
    if (audience === 'mcc_lead')
      return campaigns.filter((c) => c.campaign_source === 'mcc_campaigns');
    if (audience === 'guest')
      return campaigns.filter((c) => c.campaign_source === 'crm_sequences');
    return [];
  }, [campaigns, audience]);

  const stats = useMemo(() => {
    const list = messages ?? [];
    return {
      total: list.length,
      sent: list.filter((m) => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(m.status)).length,
      opened: list.filter((m) => m.opened_at).length,
      replied: list.filter((m) => m.replied_at).length,
    };
  }, [messages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Campaigns + Stats */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Метрики</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Всего" value={stats.total} />
            <Stat label="Отправлено" value={stats.sent} />
            <Stat label="Открыто" value={stats.opened} />
            <Stat label="Ответили" value={stats.replied} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Кампании
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : audienceCampaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Кампаний пока нет</p>
            ) : (
              <ul className="space-y-2">
                {audienceCampaigns.slice(0, 8).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-xs border border-border/40 rounded p-2"
                  >
                    <span className="truncate font-medium">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {c.status ?? '—'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Center: Live feed */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="w-4 h-4" />
              Последние сообщения
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {messages?.length ?? 0}
            </Badge>
          </CardHeader>
          <CardContent>
            {msgLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <EmptyFeed audience={audience} />
            ) : (
              <ul className="divide-y divide-border/40">
                {messages.map((m) => (
                  <MessageRow key={m.id} m={m} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Templates library */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Библиотека шаблонов</CardTitle>
          </CardHeader>
          <CardContent>
            {tmplLoading ? (
              <Skeleton className="h-20" />
            ) : !templates || templates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Нет активных шаблонов для аудитории «{AUDIENCE_LABELS[audience].ru}»
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border border-border/40 rounded p-2 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{t.name}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {t.channel} · {t.stage}
                      </Badge>
                    </div>
                    {t.subject && (
                      <div className="text-muted-foreground truncate">{t.subject}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function MessageRow({ m }: { m: OutreachMessage }) {
  const when = m.sent_at ?? m.created_at;
  return (
    <li className="py-2 flex items-center gap-3 text-sm">
      <Badge className={`text-[10px] shrink-0 ${STATUS_BADGE[m.status] ?? ''}`}>
        {m.status}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{m.identity_name ?? m.to_address ?? '—'}</div>
        {m.subject && (
          <div className="text-xs text-muted-foreground truncate">{m.subject}</div>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground shrink-0">
        {m.channel}
        {m.followup_sequence > 0 && ` · F${m.followup_sequence}`}
      </div>
      <div className="text-[11px] text-muted-foreground shrink-0 hidden md:block">
        {new Date(when).toLocaleDateString()}
      </div>
    </li>
  );
}

function EmptyFeed({ audience }: { audience: OutreachAudience }) {
  return (
    <div className="text-center py-8 text-sm text-muted-foreground">
      <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p>Сообщений по аудитории «{AUDIENCE_LABELS[audience].ru}» пока нет</p>
      <p className="text-xs mt-1">Используйте dispatch-outreach или панели каналов для отправки</p>
    </div>
  );
}
