import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { StatusPill } from '@/components/ui/status-pill';
import { Search, Users, ChevronDown, Shield, Mail, Phone, KeyRound, Ban, CheckCircle, XCircle, Trash2, Plus, Minus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileWithRoles {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  status: string;
  roles: string[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-destructive/15 text-destructive border-destructive/30',
  uno_team: 'bg-primary/15 text-primary border-primary/30',
  moderator: 'bg-warning/15 text-warning border-warning/30',
  vendor: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  owner: 'bg-success/15 text-success border-success/30',
  user: 'bg-muted text-muted-foreground border-border',
};

const ALL_ROLES = ['admin', 'moderator', 'vendor', 'owner', 'uno_team'] as const;

const STATUS_MAP: Record<string, { status: 'active' | 'warning' | 'danger' | 'inactive'; labelEn: string; labelRu: string }> = {
  active: { status: 'active', labelEn: 'Active', labelRu: 'Активен' },
  suspended: { status: 'warning', labelEn: 'Suspended', labelRu: 'Приостановлен' },
  deactivated: { status: 'danger', labelEn: 'Deactivated', labelRu: 'Деактивирован' },
};

export function ControlUsersTab() {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const invokeAction = async (action: string, userId: string, extra: Record<string, unknown> = {}) => {
    setLoadingAction(`${action}-${userId}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('admin-manage-user', {
        body: { action, user_id: userId, ...extra },
      });
      if (res.error) throw new Error(res.error.message || 'Function error');
      if (res.data?.error) throw new Error(res.data.message || res.data.error);
      toast.success(isRu ? 'Действие выполнено' : 'Action completed');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-with-roles'] });
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async (email: string | null, userId: string) => {
    if (!email) {
      toast.error(isRu ? 'У пользователя нет email' : 'User has no email');
      return;
    }
    setLoadingAction(`reset-${userId}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success(isRu ? `Ссылка отправлена на ${email}` : `Reset link sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoadingAction(null);
    }
  };

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles-with-roles', searchQuery],
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      let query = (supabase as any)
        .from('profiles')
        .select('id, full_name, email, phone, created_at, status')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (searchQuery) {
        const s = sanitizeSearchTerm(searchQuery);
        if (s) query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
      }
      
      const { data: profilesData, error } = await query;
      if (error) throw error;
      if (!profilesData || profilesData.length === 0) return [];

      const ids = profilesData.map((p: any) => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', ids);

      const rolesMap = new Map<string, string[]>();
      rolesData?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      return profilesData.map((p: any) => ({
        ...p,
        status: p.status || 'active',
        roles: rolesMap.get(p.id) || [],
      }));
    }
  });

  const isActionLoading = (action: string, userId: string) => loadingAction === `${action}-${userId}`;
  const isSelf = (userId: string) => currentUser?.id === userId;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {isRu ? 'Пользователи' : 'Users'}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {profiles?.length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {isRu ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : (
              <div className="space-y-1">
                {profiles?.map((profile) => {
                  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP.active;
                  return (
                    <Collapsible
                      key={profile.id}
                      open={expandedUser === profile.id}
                      onOpenChange={() => setExpandedUser(prev => prev === profile.id ? null : profile.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium truncate">
                                {profile.full_name || '—'}
                              </span>
                              <StatusPill status={statusInfo.status} className="text-[10px]">
                                {isRu ? statusInfo.labelRu : statusInfo.labelEn}
                              </StatusPill>
                              {profile.roles.map(role => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', ROLE_COLORS[role] || ROLE_COLORS.user)}
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.email || '—'}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {profile.created_at
                              ? formatDistanceToNow(new Date(profile.created_at), {
                                  addSuffix: false,
                                  locale: isRu ? ru : undefined,
                                })
                              : '—'}
                          </span>
                          <ChevronDown className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform',
                            expandedUser === profile.id && 'rotate-180'
                          )} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-3 pl-3 border-l-2 border-muted py-2 space-y-3">
                          {/* Info */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> <span>{profile.email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> <span>{profile.phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              <span>{isRu ? 'Роли' : 'Roles'}: {profile.roles.length > 0 ? profile.roles.join(', ') : (isRu ? 'нет' : 'none')}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              ID: <code className="bg-muted px-1 rounded text-[10px]">{profile.id.slice(0, 8)}…</code>
                            </p>
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-wrap gap-1.5">
                            {profile.status !== 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('activate', profile.id); }}
                              >
                                <CheckCircle className="h-3 w-3" />
                                {isRu ? 'Активировать' : 'Activate'}
                              </Button>
                            )}
                            {profile.status !== 'suspended' && !isSelf(profile.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-warning border-warning/30 hover:bg-warning/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('suspend', profile.id); }}
                              >
                                <Ban className="h-3 w-3" />
                                {isRu ? 'Приостановить' : 'Suspend'}
                              </Button>
                            )}
                            {profile.status !== 'deactivated' && !isSelf(profile.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('deactivate', profile.id); }}
                              >
                                <XCircle className="h-3 w-3" />
                                {isRu ? 'Деактивировать' : 'Deactivate'}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={!!loadingAction}
                              onClick={(e) => { e.stopPropagation(); handleResetPassword(profile.email, profile.id); }}
                            >
                              <KeyRound className="h-3 w-3" />
                              {isRu ? 'Сбросить пароль' : 'Reset Password'}
                            </Button>

                            {!isSelf(profile.id) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                    disabled={!!loadingAction}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    {isRu ? 'Удалить' : 'Delete'}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {isRu ? 'Удалить пользователя?' : 'Delete user?'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {isRu
                                        ? `${profile.full_name || profile.email} будет безвозвратно удалён.`
                                        : `${profile.full_name || profile.email} will be permanently deleted.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => invokeAction('delete', profile.id, { hard_delete: true })}
                                    >
                                      {isRu ? 'Удалить' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          {/* Role Management */}
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              {isRu ? 'Управление ролями' : 'Role Management'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {ALL_ROLES.map(role => {
                                const hasRole = profile.roles.includes(role);
                                return (
                                  <Button
                                    key={role}
                                    variant={hasRole ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                      'h-6 text-[10px] gap-1 px-2',
                                      hasRole && 'bg-primary/80'
                                    )}
                                    disabled={!!loadingAction || (role === 'admin' && isSelf(profile.id))}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      invokeAction(hasRole ? 'remove_role' : 'add_role', profile.id, { role });
                                    }}
                                  >
                                    {hasRole ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                                    {role}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                {(!profiles || profiles.length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {isRu ? 'Пользователи не найдены' : 'No users found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
