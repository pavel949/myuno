import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  usePropertyDelegates, 
  useInviteDelegate, 
  useRevokeDelegate,
  useUpdateDelegate,
  DelegateRole,
  DelegatePermissions,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  DEFAULT_PERMISSIONS,
  PropertyDelegate
} from '@/hooks/usePropertyDelegates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  UserPlus, Users, Shield, MoreVertical, Mail, 
  Clock, Check, X, Briefcase, Building2, User, Loader2,
  Eye, Edit, DollarSign, Calendar, Wrench
} from 'lucide-react';

interface PropertyTeamTabProps {
  propertyId: string;
}

export function PropertyTeamTab({ propertyId }: PropertyTeamTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: delegates, isLoading } = usePropertyDelegates(propertyId);
  const inviteDelegate = useInviteDelegate();
  const revokeDelegate = useRevokeDelegate();
  const updateDelegate = useUpdateDelegate();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState<PropertyDelegate | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'agent' as DelegateRole,
  });

  const handleInvite = async () => {
    if (!inviteData.email) return;

    await inviteDelegate.mutateAsync({
      property_id: propertyId,
      role: inviteData.role,
      invited_email: inviteData.email,
      invited_name: inviteData.name || undefined,
    });

    setShowInviteDialog(false);
    setInviteData({ email: '', name: '', role: 'agent' });
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    await revokeDelegate.mutateAsync(revokeId);
    setRevokeId(null);
  };

  const handleUpdatePermissions = async (delegate: PropertyDelegate, permissions: DelegatePermissions) => {
    await updateDelegate.mutateAsync({
      id: delegate.id,
      permissions,
    });
    setShowPermissionsDialog(null);
  };

  const getRoleIcon = (role: DelegateRole) => {
    switch (role) {
      case 'trustee': return <Shield className="h-4 w-4" />;
      case 'agent': return <User className="h-4 w-4" />;
      case 'manager': return <Briefcase className="h-4 w-4" />;
      case 'management_company': return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success"><Check className="h-3 w-3 mr-1" />{isRu ? 'Активен' : 'Active'}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{isRu ? 'Ожидает' : 'Pending'}</Badge>;
      case 'expired':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />{isRu ? 'Истёк' : 'Expired'}</Badge>;
      default:
        return null;
    }
  };

  const activeDelegates = delegates?.filter(d => d.status === 'active') || [];
  const pendingDelegates = delegates?.filter(d => d.status === 'pending') || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isRu ? 'Команда' : 'Team'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'Управляйте доступом к объекту для агентов и управляющих' 
              : 'Manage property access for agents and managers'}
          </p>
        </div>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              {isRu ? 'Пригласить' : 'Invite'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Пригласить в команду' : 'Invite to Team'}</DialogTitle>
              <DialogDescription>
                {isRu 
                  ? 'Приглашённый получит доступ к этому объекту согласно выбранной роли' 
                  : 'Invited user will get access to this property based on selected role'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Email' : 'Email'}</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Имя (опционально)' : 'Name (optional)'}</Label>
                <Input
                  placeholder={isRu ? 'Иван Иванов' : 'John Doe'}
                  value={inviteData.name}
                  onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Роль' : 'Role'}</Label>
                <Select 
                  value={inviteData.role} 
                  onValueChange={(v) => setInviteData(prev => ({ ...prev, role: v as DelegateRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(key as DelegateRole)}
                          <span>{isRu ? labels.ru : labels.en}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? ROLE_DESCRIPTIONS[inviteData.role].ru 
                    : ROLE_DESCRIPTIONS[inviteData.role].en}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleInvite} 
                disabled={!inviteData.email || inviteDelegate.isPending}
              >
                {inviteDelegate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRu ? 'Отправить приглашение' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      {pendingDelegates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {isRu ? 'Ожидающие приглашения' : 'Pending Invitations'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingDelegates.map(delegate => (
              <div 
                key={delegate.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(delegate.invited_name || delegate.invited_email || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {delegate.invited_name || delegate.invited_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[delegate.role][isRu ? 'ru' : 'en']}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(delegate.status)}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setRevokeId(delegate.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Team Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isRu ? 'Активные участники' : 'Active Members'}
            {activeDelegates.length > 0 && (
              <Badge variant="secondary">{activeDelegates.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeDelegates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {isRu 
                  ? 'Пока нет участников команды' 
                  : 'No team members yet'}
              </p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isRu ? 'Пригласить первого' : 'Invite first member'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeDelegates.map(delegate => (
                <div 
                  key={delegate.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={delegate.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(delegate.profile?.full_name || delegate.invited_name || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {delegate.profile?.full_name || delegate.invited_name || delegate.invited_email}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getRoleIcon(delegate.role)}
                          <span className="ml-1">
                            {ROLE_LABELS[delegate.role][isRu ? 'ru' : 'en']}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowPermissionsDialog(delegate)}>
                        <Shield className="h-4 w-4 mr-2" />
                        {isRu ? 'Настроить права' : 'Configure Permissions'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setRevokeId(delegate.id)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {isRu ? 'Отозвать доступ' : 'Revoke Access'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      {showPermissionsDialog && (
        <PermissionsDialog
          delegate={showPermissionsDialog}
          isRu={isRu}
          onClose={() => setShowPermissionsDialog(null)}
          onSave={handleUpdatePermissions}
          isLoading={updateDelegate.isPending}
        />
      )}

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Отозвать доступ?' : 'Revoke Access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Пользователь потеряет доступ к этому объекту.' 
                : 'User will lose access to this property.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
              {isRu ? 'Отозвать' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Permissions Dialog Component
function PermissionsDialog({
  delegate,
  isRu,
  onClose,
  onSave,
  isLoading,
}: {
  delegate: PropertyDelegate;
  isRu: boolean;
  onClose: () => void;
  onSave: (delegate: PropertyDelegate, permissions: DelegatePermissions) => Promise<void>;
  isLoading: boolean;
}) {
  const [permissions, setPermissions] = useState<DelegatePermissions>(
    delegate.permissions || DEFAULT_PERMISSIONS[delegate.role]
  );

  const permissionItems = [
    { key: 'view', icon: Eye, label: isRu ? 'Просмотр' : 'View', description: isRu ? 'Просмотр информации об объекте' : 'View property information' },
    { key: 'edit', icon: Edit, label: isRu ? 'Редактирование' : 'Edit', description: isRu ? 'Редактирование данных объекта' : 'Edit property data' },
    { key: 'bookings', icon: Calendar, label: isRu ? 'Бронирования' : 'Bookings', description: isRu ? 'Управление бронированиями' : 'Manage bookings' },
    { key: 'financials', icon: DollarSign, label: isRu ? 'Финансы' : 'Financials', description: isRu ? 'Доступ к финансам' : 'Access financials' },
    { key: 'maintenance', icon: Wrench, label: isRu ? 'Обслуживание' : 'Maintenance', description: isRu ? 'Управление заявками' : 'Manage service requests' },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRu ? 'Настройка прав доступа' : 'Configure Permissions'}</DialogTitle>
          <DialogDescription>
            {delegate.profile?.full_name || delegate.invited_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {permissionItems.map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={permissions[item.key as keyof DelegatePermissions]}
                onCheckedChange={(checked) => 
                  setPermissions(prev => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={() => onSave(delegate, permissions)} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
