import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyOwnershipInvites, PropertyOwnershipInvite } from '@/hooks/usePropertyOwnership';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Home, 
  UserPlus, 
  KeyRound, 
  ChevronRight, 
  Check, 
  X,
  Loader2,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function OwnershipInviteBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { 
    pendingInvites, 
    isLoading, 
    acceptInvite, 
    declineInvite,
    isAccepting,
    isDeclining,
  } = usePropertyOwnershipInvites();
  
  const [selectedInvite, setSelectedInvite] = useState<PropertyOwnershipInvite | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | null>(null);

  if (isLoading || pendingInvites.length === 0) {
    return null;
  }

  const handleAccept = async () => {
    if (!selectedInvite) return;
    
    try {
      await acceptInvite(selectedInvite.id);
      toast.success(
        isRu 
          ? 'Приглашение принято! Объект добавлен в ваш аккаунт' 
          : 'Invitation accepted! Property added to your account'
      );
      setSelectedInvite(null);
      setConfirmAction(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDecline = async () => {
    if (!selectedInvite) return;
    
    try {
      await declineInvite(selectedInvite.id);
      toast.success(
        isRu 
          ? 'Приглашение отклонено' 
          : 'Invitation declined'
      );
      setSelectedInvite(null);
      setConfirmAction(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getInviteTypeLabel = (type: string) => {
    if (type === 'ownership_transfer') {
      return isRu ? 'Передача владения' : 'Ownership Transfer';
    }
    return isRu ? 'Приглашение в команду' : 'Team Invitation';
  };

  const getInviteIcon = (type: string) => {
    if (type === 'ownership_transfer') {
      return <KeyRound className="h-5 w-5 text-amber-500" />;
    }
    return <UserPlus className="h-5 w-5 text-primary" />;
  };

  return (
    <>
      <Card className="mb-4 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {isRu ? 'У вас есть приглашения' : 'You have invitations'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pendingInvites.length === 1
                  ? (isRu ? 'Вас пригласили управлять объектом' : 'You have been invited to manage a property')
                  : (isRu 
                      ? `${pendingInvites.length} приглашения ожидают ответа` 
                      : `${pendingInvites.length} invitations waiting for response`)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div 
                key={invite.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border"
              >
                <div className="p-2 rounded-lg bg-muted">
                  {invite.property?.cover_image ? (
                    <img 
                      src={invite.property.cover_image} 
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <Home className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {invite.property?.title || (isRu ? 'Объект' : 'Property')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={invite.invite_type === 'ownership_transfer' 
                        ? 'border-amber-500/50 text-amber-600 text-[10px]' 
                        : 'text-[10px]'}
                    >
                      {getInviteIcon(invite.invite_type)}
                      <span className="ml-1">{getInviteTypeLabel(invite.invite_type)}</span>
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isRu ? 'Действует до ' : 'Valid until '}
                    {format(new Date(invite.expires_at), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedInvite(invite);
                      setConfirmAction('decline');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedInvite(invite);
                      setConfirmAction('accept');
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accept confirmation dialog */}
      <AlertDialog open={confirmAction === 'accept'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedInvite?.invite_type === 'ownership_transfer'
                ? (isRu ? 'Принять владение объектом?' : 'Accept property ownership?')
                : (isRu ? 'Присоединиться к команде?' : 'Join the team?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedInvite?.invite_type === 'ownership_transfer' ? (
                isRu 
                  ? `Вы станете владельцем объекта "${selectedInvite?.property?.title}". Это даст вам полный контроль над объектом, включая финансы и бронирования.`
                  : `You will become the owner of "${selectedInvite?.property?.title}". This gives you full control over the property, including finances and bookings.`
              ) : (
                isRu
                  ? `Вы будете добавлены в команду объекта "${selectedInvite?.property?.title}" с соответствующими правами доступа.`
                  : `You will be added to the team of "${selectedInvite?.property?.title}" with appropriate access permissions.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAccepting}>
              {isRu ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isRu ? 'Принять' : 'Accept'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline confirmation dialog */}
      <AlertDialog open={confirmAction === 'decline'} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Отклонить приглашение?' : 'Decline invitation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? `Вы уверены, что хотите отклонить приглашение для объекта "${selectedInvite?.property?.title}"? Это действие нельзя отменить.`
                : `Are you sure you want to decline the invitation for "${selectedInvite?.property?.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeclining}>
              {isRu ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDecline} 
              disabled={isDeclining}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeclining ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isRu ? 'Отклонить' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
