/**
 * CapitalDevelopersPending — Admin Hub for managing developers.
 *
 * Three pillars:
 *   1) KPI strip      — counts (total / unclaimed / pending / active)
 *   2) Pending queue  — new applications waiting for approve/reject
 *   3) Directory      — every developer with claim status, search, filters,
 *                       send-invite, copy magic link
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, Building2, Globe, Mail, Phone, User,
  Send, Link2, Search, Copy, ExternalLink, Filter, Users, Sparkles, Eye,
} from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  usePendingDevelopers,
  useApproveDeveloper,
  useRejectDeveloper,
  useAllDevelopersForClaim,
  useSendClaimInvite,
  PendingDeveloper,
  DeveloperForClaim,
} from '@/hooks/useDeveloperOnboarding';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DirectoryFilter = 'all' | 'unclaimed' | 'claimed' | 'active' | 'pending';

// ── KPI tile ─────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon, label, value, tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone?: 'primary' | 'warning' | 'success' | 'muted';
}) {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    muted: 'bg-muted text-muted-foreground',
  }[tone ?? 'primary'];

  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-none flex items-center justify-center shrink-0', toneClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-semibold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Pending application card ─────────────────────────────────────────

function PendingCard({
  developer, onApprove, onReject, isApproving, isRejecting,
}: {
  developer: PendingDeveloper;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  return (
    <Card className="border border-border hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{developer.name_en}</CardTitle>
              {developer.name_ru && (
                <p className="text-sm text-muted-foreground truncate">{developer.name_ru}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 shrink-0">
            <Clock className="w-3 h-3 mr-1" />На проверке
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {developer.legal_name && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{developer.legal_name}</span>
            </div>
          )}
          {developer.country && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" /><span>{developer.country}</span>
            </div>
          )}
          {developer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{developer.email}</span>
            </div>
          )}
          {developer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" /><span>{developer.phone}</span>
            </div>
          )}
          {developer.website && (
            <a
              href={developer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline col-span-2 truncate"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{developer.website}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
            </a>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Заявка подана{' '}
          {formatDistanceToNow(new Date(developer.created_at), { addSuffix: true, locale: ru })}
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline" size="sm"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={onReject} disabled={isRejecting || isApproving}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            {isRejecting ? 'Отклоняем…' : 'Отклонить'}
          </Button>
          <Button
            size="sm" className="flex-1"
            onClick={onApprove} disabled={isApproving || isRejecting}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {isApproving ? 'Одобряем…' : 'Одобрить'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Directory row ─────────────────────────────────────────────────────

function DirectoryRow({
  dev, onClaim, onImpersonate,
}: {
  dev: DeveloperForClaim;
  onClaim: (d: DeveloperForClaim) => void;
  onImpersonate: (d: DeveloperForClaim) => void;
}) {
  const claimed = !!dev.user_id;

  const statusBadge = (() => {
    if (dev.devmod_status === 'active') return { label: 'Активен', tone: 'bg-success/10 text-success border-success/20' };
    if (dev.devmod_status === 'pending') return { label: 'На проверке', tone: 'bg-warning/10 text-warning border-warning/20' };
    if (dev.devmod_status === 'suspended') return { label: 'Приостановлен', tone: 'bg-destructive/10 text-destructive border-destructive/20' };
    return { label: dev.devmod_status ?? 'нет', tone: 'bg-muted text-muted-foreground' };
  })();

  return (
    <Card className="border border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{dev.name_en}</div>
            <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{dev.email ?? '— нет email —'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn('text-xs', statusBadge.tone)}>
            {statusBadge.label}
          </Badge>
          {claimed ? (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              <Link2 className="w-3 h-3 mr-1" />Привязан
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="text-muted-foreground">Нет аккаунта</Badge>
              <Button size="sm" variant="outline" onClick={() => onClaim(dev)}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Инвайт
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => onImpersonate(dev)} title="Войти как этот застройщик">
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Войти как
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function CapitalDevelopersPending() {
  const navigate = useNavigate();
  const { enter: enterImpersonation } = useImpersonation();
  const { data: pending, isLoading: loadingPending } = usePendingDevelopers();
  const { data: allDevelopers, isLoading: loadingAll } = useAllDevelopersForClaim();
  const approveMutation = useApproveDeveloper();
  const rejectMutation = useRejectDeveloper();
  const claimMutation = useSendClaimInvite();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<DeveloperForClaim | null>(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimResult, setClaimResult] = useState<{ link: string; expires_at: string } | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DirectoryFilter>('all');

  // ── KPIs ──
  const kpis = useMemo(() => {
    const list = allDevelopers ?? [];
    return {
      total: list.length,
      unclaimed: list.filter((d) => !d.user_id).length,
      pending: pending?.length ?? 0,
      active: list.filter((d) => d.devmod_status === 'active').length,
    };
  }, [allDevelopers, pending]);

  // ── Filtered + searched directory ──
  const directory = useMemo(() => {
    let list = allDevelopers ?? [];
    if (filter === 'unclaimed') list = list.filter((d) => !d.user_id);
    if (filter === 'claimed') list = list.filter((d) => !!d.user_id);
    if (filter === 'active') list = list.filter((d) => d.devmod_status === 'active');
    if (filter === 'pending') list = list.filter((d) => d.devmod_status === 'pending');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name_en.toLowerCase().includes(q) ||
          d.name_ru?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allDevelopers, filter, search]);

  // ── Actions ──
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try { await approveMutation.mutateAsync(id); }
    finally { setApprovingId(null); }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setRejectingId(id);
    setRejectTarget(null);
    try { await rejectMutation.mutateAsync({ developerId: id }); }
    finally { setRejectingId(null); }
  };

  const openClaim = (d: DeveloperForClaim) => {
    setClaimTarget(d);
    setClaimEmail(d.email ?? '');
    setClaimResult(null);
  };

  const openImpersonate = async (d: DeveloperForClaim) => {
    await enterImpersonation(d.id, d.name_en || d.name_ru || 'Developer');
    navigate(APP_ROUTES.DEVELOPER_PORTAL);
  };

  const handleSendClaim = async () => {
    if (!claimTarget || !claimEmail) return;
    try {
      const res = await claimMutation.mutateAsync({
        developer_id: claimTarget.id,
        email: claimEmail.trim(),
      });
      setClaimResult({ link: res.link, expires_at: res.expires_at });
    } catch {
      // toast handled in hook
    }
  };

  const copyLink = async () => {
    if (!claimResult) return;
    await navigator.clipboard.writeText(claimResult.link);
    toast.success('Ссылка скопирована');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Управление застройщиками</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Заявки, привязка профилей к аккаунтам, отправка приглашений
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={Building2} label="Всего застройщиков" value={kpis.total} tone="primary" />
        <KpiTile icon={Users} label="Без аккаунта" value={kpis.unclaimed} tone="muted" />
        <KpiTile icon={Clock} label="На проверке" value={kpis.pending} tone="warning" />
        <KpiTile icon={Sparkles} label="Активные" value={kpis.active} tone="success" />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Заявки
            {pending && pending.length > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="directory" className="gap-2">
            Все застройщики
            {kpis.unclaimed > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                {kpis.unclaimed} без аккаунта
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Pending ── */}
        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !pending || pending.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Нет новых заявок</h3>
                <p className="text-muted-foreground text-sm">Все заявки обработаны</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pending.map((dev) => (
                <PendingCard
                  key={dev.id}
                  developer={dev}
                  onApprove={() => handleApprove(dev.id)}
                  onReject={() => setRejectTarget(dev.id)}
                  isApproving={approvingId === dev.id}
                  isRejecting={rejectingId === dev.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Directory ── */}
        <TabsContent value="directory" className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или email…"
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as DirectoryFilter)}>
              <SelectTrigger className="sm:w-56">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="unclaimed">Без аккаунта</SelectItem>
                <SelectItem value="claimed">С аккаунтом</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="pending">На проверке</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {loadingAll ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : directory.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-12 text-center text-muted-foreground">
                {search ? 'Ничего не найдено' : 'Застройщиков нет'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Показано {directory.length} из {allDevelopers?.length ?? 0}
              </p>
              {directory.map((dev) => (
                <DirectoryRow key={dev.id} dev={dev} onClaim={openClaim} onImpersonate={openImpersonate} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject confirmation */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Застройщик будет переведён в статус «Приостановлен».
              Это можно отменить вручную в базе данных.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Отклонить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Claim invite dialog */}
      <Dialog
        open={!!claimTarget}
        onOpenChange={(open) => {
          if (!open) {
            setClaimTarget(null);
            setClaimEmail('');
            setClaimResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Привязка профиля к аккаунту</DialogTitle>
            <DialogDescription>
              «{claimTarget?.name_en}» получит magic-link на указанный email.
              После клика и входа профиль будет автоматически привязан.
            </DialogDescription>
          </DialogHeader>

          {!claimResult ? (
            <>
              <div className="space-y-2 py-2">
                <label className="text-sm font-medium">Email получателя</label>
                <Input
                  type="email"
                  placeholder="owner@developer.com"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Ссылка действует 24 часа. Можно также скопировать её и переслать вручную.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClaimTarget(null)}>Отмена</Button>
                <Button onClick={handleSendClaim} disabled={!claimEmail || claimMutation.isPending}>
                  <Send className="w-4 h-4 mr-1.5" />
                  {claimMutation.isPending ? 'Отправка…' : 'Отправить инвайт'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-3 py-2">
              <div className="rounded-none border border-success/20 bg-success/5 p-3 text-sm">
                <CheckCircle className="w-4 h-4 inline mr-1.5 text-success" />
                Email отправлен. Срок действия:{' '}
                <strong>{new Date(claimResult.expires_at).toLocaleString('ru-RU')}</strong>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Magic-link для пересылки вручную
                </label>
                <div className="flex gap-2">
                  <Input value={claimResult.link} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setClaimTarget(null); setClaimResult(null); }}>
                  Готово
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
