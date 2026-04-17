/**
 * CapitalDevelopersPending — broker/admin review queue + all-developers claim management.
 *
 * Tabs:
 *   • Pending — new applications (devmod_status='pending') with approve/reject
 *   • All — every developer profile with a "Send claim invite" CTA when user_id is null
 */
import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Globe, Mail, Phone, User, Send, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// ── Pending application card ─────────────────────────────────────────

function DeveloperCard({ developer, onApprove, onReject, isApproving, isRejecting }: {
  developer: PendingDeveloper;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{developer.name_en}</CardTitle>
              {developer.name_ru && (
                <p className="text-sm text-muted-foreground">{developer.name_ru}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 shrink-0">
            <Clock className="w-3 h-3 mr-1" />
            На проверке
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
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{developer.country}</span>
            </div>
          )}
          {developer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{developer.email}</span>
            </div>
          )}
          {developer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{developer.phone}</span>
            </div>
          )}
          {developer.website && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <a
                href={developer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary hover:underline"
              >
                {developer.website}
              </a>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Заявка подана{' '}
          {formatDistanceToNow(new Date(developer.created_at), { addSuffix: true, locale: ru })}
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={onReject}
            disabled={isRejecting || isApproving}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            {isRejecting ? 'Отклоняем...' : 'Отклонить'}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={onApprove}
            disabled={isApproving || isRejecting}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {isApproving ? 'Одобряем...' : 'Одобрить'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── All developers row (claim flow) ──────────────────────────────────

function AllDeveloperRow({ dev, onClaim }: { dev: DeveloperForClaim; onClaim: (d: DeveloperForClaim) => void }) {
  const claimed = !!dev.user_id;
  return (
    <Card className="border border-border">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{dev.name_en}</div>
            <div className="text-xs text-muted-foreground truncate">
              {dev.email ?? '—'} · {dev.devmod_status ?? 'no_status'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {claimed ? (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              <Link2 className="w-3 h-3 mr-1" />
              Claimed
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="text-muted-foreground">Unclaimed</Badge>
              <Button size="sm" variant="outline" onClick={() => onClaim(dev)}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send claim invite
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function CapitalDevelopersPending() {
  const { data: developers, isLoading } = usePendingDevelopers();
  const { data: allDevelopers, isLoading: loadingAll } = useAllDevelopersForClaim();
  const approveMutation = useApproveDeveloper();
  const rejectMutation = useRejectDeveloper();
  const claimMutation = useSendClaimInvite();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<DeveloperForClaim | null>(null);
  const [claimEmail, setClaimEmail] = useState('');

  const unclaimedCount = useMemo(
    () => (allDevelopers ?? []).filter((d) => !d.user_id).length,
    [allDevelopers]
  );

  const handleApprove = async (developerId: string) => {
    setApprovingId(developerId);
    try {
      await approveMutation.mutateAsync(developerId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setRejectingId(rejectTarget);
    setRejectTarget(null);
    try {
      await rejectMutation.mutateAsync({ developerId: rejectTarget });
    } finally {
      setRejectingId(null);
    }
  };

  const openClaim = (d: DeveloperForClaim) => {
    setClaimTarget(d);
    setClaimEmail(d.email ?? '');
  };

  const handleSendClaim = async () => {
    if (!claimTarget || !claimEmail) return;
    try {
      await claimMutation.mutateAsync({ developer_id: claimTarget.id, email: claimEmail.trim() });
      setClaimTarget(null);
      setClaimEmail('');
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Застройщики</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управление заявками и привязка существующих профилей к аккаунтам
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            На проверке
            {developers && developers.length > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                {developers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            Все застройщики
            {unclaimedCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                {unclaimedCount} unclaimed
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending tab */}
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border border-border">
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
          ) : !developers || developers.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Нет новых заявок</h3>
                <p className="text-muted-foreground text-sm">Все заявки обработаны</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {developers.map((dev) => (
                <DeveloperCard
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

        {/* All developers tab */}
        <TabsContent value="all" className="space-y-3">
          {loadingAll ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : !allDevelopers || allDevelopers.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-12 text-center text-muted-foreground">
                Застройщиков нет
              </CardContent>
            </Card>
          ) : (
            allDevelopers.map((dev) => (
              <AllDeveloperRow key={dev.id} dev={dev} onClaim={openClaim} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject confirmation */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Застройщик будет переведён в статус «Приостановлен». Это действие можно отменить вручную в базе данных.
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
      <Dialog open={!!claimTarget} onOpenChange={(open) => !open && setClaimTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить claim invite</DialogTitle>
            <DialogDescription>
              Застройщик «{claimTarget?.name_en}» получит magic link на указанный email.
              После клика и входа профиль будет привязан к его аккаунту.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Email получателя</label>
            <Input
              type="email"
              placeholder="owner@developer.com"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimTarget(null)}>Отмена</Button>
            <Button
              onClick={handleSendClaim}
              disabled={!claimEmail || claimMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {claimMutation.isPending ? 'Отправка…' : 'Отправить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
