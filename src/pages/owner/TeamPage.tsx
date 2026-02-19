import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIncomingRequests, useOutgoingRequests, useRespondToRequest, useCancelRequest } from '@/hooks/useManagementRequests';
import { usePropertyDelegates } from '@/hooks/usePropertyDelegates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  Check, 
  X, 
  Building2,
  Shield,
  Eye,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { InviteTeamMemberDialog } from '@/components/owner/team/InviteTeamMemberDialog';

export default function TeamPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  const { data: incoming, isLoading: loadingIncoming } = useIncomingRequests();
  const { data: outgoing, isLoading: loadingOutgoing } = useOutgoingRequests();
  const { data: delegates, isLoading: loadingDelegates } = usePropertyDelegates();
  
  const respondMutation = useRespondToRequest();
  const cancelMutation = useCancelRequest();

  const handleAccept = (requestId: string) => {
    respondMutation.mutate({ requestId, status: 'accepted' });
  };

  const handleDecline = (requestId: string) => {
    respondMutation.mutate({ requestId, status: 'declined' });
  };

  const handleCancel = (requestId: string) => {
    cancelMutation.mutate(requestId);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, { en: string; ru: string }> = {
      trustee: { en: 'Trustee', ru: 'Доверенное лицо' },
      agent: { en: 'Agent', ru: 'Агент' },
      manager: { en: 'Manager', ru: 'Управляющий' },
      management_company: { en: 'Management Company', ru: 'Управляющая компания' },
    };
    return roles[role]?.[isRu ? 'ru' : 'en'] || role;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: isRu ? 'Ожидает' : 'Pending' },
      accepted: { variant: 'default', label: isRu ? 'Принято' : 'Accepted' },
      declined: { variant: 'destructive', label: isRu ? 'Отклонено' : 'Declined' },
      expired: { variant: 'outline', label: isRu ? 'Истекло' : 'Expired' },
      cancelled: { variant: 'outline', label: isRu ? 'Отменено' : 'Cancelled' },
    };
    const { variant, label } = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const PermissionIcon = ({ permission, enabled }: { permission: string; enabled: boolean }) => {
    const icons: Record<string, React.ReactNode> = {
      view: <Eye className="h-3.5 w-3.5" />,
      edit: <Shield className="h-3.5 w-3.5" />,
      financial: <DollarSign className="h-3.5 w-3.5" />,
      bookings: <CalendarDays className="h-3.5 w-3.5" />,
    };
    
    return (
      <div 
        className={`p-1.5 rounded-md ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
        title={permission}
      >
        {icons[permission]}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Моя команда' : 'My Team'}</h1>
          <p className="text-muted-foreground">
            {isRu ? 'Управление доступом к вашим объектам' : 'Manage access to your properties'}
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {isRu ? 'Пригласить' : 'Invite'}
        </Button>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Команда' : 'Team'}
            {delegates && delegates.length > 0 && (
              <Badge variant="secondary" className="ml-1">{delegates.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <Mail className="h-4 w-4" />
            {isRu ? 'Входящие' : 'Incoming'}
            {incoming && incoming.length > 0 && (
              <Badge variant="destructive" className="ml-1">{incoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <Clock className="h-4 w-4" />
            {isRu ? 'Исходящие' : 'Outgoing'}
          </TabsTrigger>
        </TabsList>

        {/* Active Team Members */}
        <TabsContent value="team" className="space-y-4">
          {loadingDelegates ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : delegates && delegates.length > 0 ? (
            <div className="grid gap-4">
              {delegates.map((delegate) => (
                <Card key={delegate.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {delegate.invited_email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">
                            {delegate.invited_name || delegate.invited_email}
                          </h3>
                          <Badge variant="outline">{getRoleLabel(delegate.role)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {delegate.invited_email}
                        </p>
                        {delegate.property_id && (
                          <div className="flex items-center gap-2 mt-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">
                              {isRu
                                ? ((delegate as any).property?.title_ru || (delegate as any).property?.title || delegate.property_id)
                                : ((delegate as any).property?.title || (delegate as any).property?.title_ru || delegate.property_id)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <PermissionIcon permission="view" enabled={delegate.permissions?.view} />
                        <PermissionIcon permission="edit" enabled={delegate.permissions?.edit} />
                        <PermissionIcon permission="financial" enabled={delegate.permissions?.financials} />
                        <PermissionIcon permission="bookings" enabled={delegate.permissions?.bookings} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  {isRu ? 'Пока никого нет' : 'No team members yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRu 
                    ? 'Пригласите управляющего или агента для совместной работы' 
                    : 'Invite a manager or agent to collaborate'}
                </p>
                <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isRu ? 'Пригласить' : 'Invite'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Incoming Requests */}
        <TabsContent value="incoming" className="space-y-4">
          {loadingIncoming ? (
            <Skeleton className="h-32 w-full" />
          ) : incoming && incoming.length > 0 ? (
            <div className="grid gap-4">
              {incoming.map((request) => (
                <Card key={request.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {request.request_type === 'request_management' 
                              ? (isRu ? 'Запрос на управление' : 'Management Request')
                              : (isRu ? 'Приглашение' : 'Invitation')}
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm mb-2">
                          {isRu ? 'От: ' : 'From: '}
                          <span className="font-medium">
                            {request.requester?.email || request.target_email || request.requester_id}
                          </span>
                        </p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground italic">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {isRu ? 'Истекает: ' : 'Expires: '}
                          {format(new Date(request.expires_at), 'dd MMM yyyy', { 
                            locale: isRu ? ru : enUS 
                          })}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAccept(request.id)}
                            disabled={respondMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {isRu ? 'Принять' : 'Accept'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDecline(request.id)}
                            disabled={respondMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {isRu ? 'Отклонить' : 'Decline'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  {isRu ? 'Нет входящих приглашений' : 'No incoming requests'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Здесь появятся приглашения от управляющих компаний' 
                    : 'Invitations from management companies will appear here'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Outgoing Requests */}
        <TabsContent value="outgoing" className="space-y-4">
          {loadingOutgoing ? (
            <Skeleton className="h-32 w-full" />
          ) : outgoing && outgoing.length > 0 ? (
            <div className="grid gap-4">
              {outgoing.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-muted-foreground">
                            {isRu ? 'Кому: ' : 'To: '}{request.target_email}
                          </span>
                        </div>
                        {request.property && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {isRu ? request.property.title_ru : request.property.title}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {isRu ? 'Отправлено: ' : 'Sent: '}
                          {format(new Date(request.created_at), 'dd MMM yyyy', { 
                            locale: isRu ? ru : enUS 
                          })}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleCancel(request.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  {isRu ? 'Нет отправленных приглашений' : 'No outgoing requests'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isRu 
                    ? 'Пригласите кого-нибудь в свою команду' 
                    : 'Invite someone to join your team'}
                </p>
                <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isRu ? 'Пригласить' : 'Invite'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <InviteTeamMemberDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog} 
      />
    </div>
  );
}
