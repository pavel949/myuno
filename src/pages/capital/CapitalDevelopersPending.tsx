/**
 * CapitalDevelopersPending — broker/admin review queue for developer applications.
 */
import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Globe, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { usePendingDevelopers, useApproveDeveloper, useRejectDeveloper, PendingDeveloper } from '@/hooks/useDeveloperOnboarding';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

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

export default function CapitalDevelopersPending() {
  const { data: developers, isLoading } = usePendingDevelopers();
  const approveMutation = useApproveDeveloper();
  const rejectMutation = useRejectDeveloper();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Заявки застройщиков</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Новые заявки на регистрацию в Developer Portal
          </p>
        </div>
        {developers && developers.length > 0 && (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            {developers.length} на проверке
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
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
            <p className="text-muted-foreground text-sm">
              Все заявки обработаны
            </p>
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
    </div>
  );
}
