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
import { getPasswordResetRedirectUrl } from '@/lib/config/routes';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { formatDistanceToNow } from 'date-fns';
import { ru, th as thLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { pickLang } from '@/lib/i18n/pickLang';

interface ProfileWithRoles {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  status: string | null;
  roles: string[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-destructive/15 text-destructive border-destructive/30',
  uno_team: 'bg-primary/15 text-primary border-primary/30',
  vendor: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  owner: 'bg-success/15 text-success border-success/30',
  finance: 'bg-warning/15 text-warning border-warning/30',
  support: 'bg-primary/15 text-primary border-primary/40',
  sales: 'bg-primary/15 text-primary border-primary/40',
  user: 'bg-muted text-muted-foreground border-border',
};

const ALL_ROLES = ['admin', 'uno_team', 'vendor', 'owner', 'finance', 'support', 'sales'] as const;

const STATUS_MAP: Record<string, { status: 'active' | 'warning' | 'danger' | 'inactive'; labelKey: string }> = {
  active: { status: 'active', labelKey: 'admin.users.status.active' },
  suspended: { status: 'warning', labelKey: 'admin.users.status.suspended' },
  deactivated: { status: 'danger', labelKey: 'admin.users.status.deactivated' },
};

export function ControlUsersTab() {
  const { language, t } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const dateLocale = language === 'ru' ? ru : language === 'th' ? thLocale : undefined;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const invokeAction = async (action: string, userId: string, extra: Record<string, unknown> = {}) => {
    setLoadingAction(`${action}-${userId}`);
    try {
      const res = await supabase.functions.invoke('admin-manage-user', {
        body: { action, user_id: userId, ...extra },
      });
      if (res.error) {
        // invoke() reports any non-2xx as a generic "non-2xx status code" error;
        // read the function's JSON body so the admin sees the real reason (403 etc.).
        let serverMessage: string | undefined;
        const ctx = (res.error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            serverMessage = body?.message || body?.error;
          } catch {
            /* non-JSON body — fall back to the generic message */
          }
        }
        throw new Error(serverMessage || res.error.message || 'Function error');
      }
      if (res.data?.error) throw new Error(res.data.message || res.data.error);
      toast.success(t('admin.users.toast.actionDone'));
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-with-roles'] });
    } catch (e: any) {
      toast.error(e.message || t('admin.crud.error'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async (email: string | null, userId: string) => {
    if (!email) {
      toast.error(t('admin.users.toast.noEmail'));
      return;
    }
    setLoadingAction(`reset-${userId}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });
      if (error) throw error;
      toast.success(`${t('admin.users.toast.resetSent')} ${email}`);
    } catch (e: any) {
      toast.error(e.message || t('admin.crud.error'));
    } finally {
      setLoadingAction(null);
    }
  };

  const { data: profiles, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-profiles-with-roles', currentUser?.id, searchQuery],
    enabled: Boolean(currentUser?.id),
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
      const { data: rolesData, error: rolesError, count: roleCount } = await supabase
        .from('user_roles')
        .select('user_id, role', { count: 'exact' })
        .in('user_id', ids);
      if (rolesError) throw rolesError;
      if (roleCount != null && roleCount !== rolesData?.length) {
        throw new Error('Incomplete account role assignments');
      }

      const rolesMap = new Map<string, Set<string>>();
      rolesData?.forEach(r => {
        const existing = rolesMap.get(r.user_id) ?? new Set<string>();
        existing.add(r.role);
        rolesMap.set(r.user_id, existing);
      });

      return profilesData.map((p: any) => ({
        ...p,
        status: p.status ?? null,
        roles: Array.from(rolesMap.get(p.id) ?? []),
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
              {t('admin.users.title')}
            </CardTitle>
            {profiles && !isError && (
              <Badge variant="secondary" className="text-xs">
                <span className="sr-only">{local('Аккаунтов показано', 'Accounts shown', 'บัญชีที่แสดง')} </span>
                {profiles.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label={local('Поиск аккаунтов', 'Search accounts', 'ค้นหาบัญชี')}
                placeholder={t('admin.users.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-11 pl-9 text-sm"
              />
            </div>

            {isLoading ? (
              <div role="status">
                <span className="sr-only">{t('admin.users.loading')}</span>
                <div aria-hidden="true"><ContentSkeleton variant="list" count={3} /></div>
              </div>
            ) : isError ? (
              <QueryRecovery onRetry={refetch} isRetrying={isFetching} />
            ) : (
              <div className="space-y-1">
                {profiles?.map((profile) => {
                  const statusInfo = profile.status ? STATUS_MAP[profile.status] : undefined;
                  const effectiveStatus = profile.status || 'active';
                  return (
                    <Collapsible
                      key={profile.id}
                      open={expandedUser === profile.id}
                      onOpenChange={() => setExpandedUser(prev => prev === profile.id ? null : profile.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <button type="button" className="flex w-full items-start gap-3 rounded-[var(--bible-radius-card)] border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-muted/50">
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="break-words text-sm font-medium">
                                {profile.full_name || '—'}
                              </span>
                              <StatusPill status={statusInfo?.status ?? 'inactive'} className="text-[10px]">
                                {statusInfo ? t(statusInfo.labelKey) : local('Статус не указан', 'Status unavailable', 'ไม่ทราบสถานะ')}
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
                            </span>
                            <span className="block break-all text-xs text-muted-foreground">
                              {profile.email || '—'}
                            </span>
                          </span>
                          <span className="min-w-0 text-body-sm text-muted-foreground [overflow-wrap:anywhere]">
                            {profile.created_at
                              ? formatDistanceToNow(new Date(profile.created_at), {
                                  addSuffix: false,
                                  locale: dateLocale,
                                })
                              : '—'}
                          </span>
                          <ChevronDown aria-hidden="true" className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            expandedUser === profile.id && 'rotate-180'
                          )} />
                        </button>
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
                              <span>{t('admin.users.roles')}: {profile.roles.length > 0 ? profile.roles.join(', ') : t('admin.users.noRoles')}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              ID: <code className="bg-muted px-1 rounded-none text-[10px]">{profile.id.slice(0, 8)}…</code>
                            </p>
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-wrap gap-1.5">
                            {effectiveStatus !== 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('activate', profile.id); }}
                              >
                                <CheckCircle className="h-3 w-3" />
                                {t('admin.users.actions.activate')}
                              </Button>
                            )}
                            {effectiveStatus !== 'suspended' && !isSelf(profile.id) && !profile.roles.includes('admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-warning border-warning/30 hover:bg-warning/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('suspend', profile.id); }}
                              >
                                <Ban className="h-3 w-3" />
                                {t('admin.users.actions.suspend')}
                              </Button>
                            )}
                            {effectiveStatus !== 'deactivated' && !isSelf(profile.id) && !profile.roles.includes('admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                disabled={!!loadingAction}
                                onClick={(e) => { e.stopPropagation(); invokeAction('deactivate', profile.id); }}
                              >
                                <XCircle className="h-3 w-3" />
                                {t('admin.users.actions.deactivate')}
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
                              {t('admin.users.actions.resetPassword')}
                            </Button>

                            {!isSelf(profile.id) && !profile.roles.includes('admin') && (
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
                                    {t('admin.users.actions.delete')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('admin.users.delete.title')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {`${profile.full_name || profile.email} ${t('admin.users.delete.descSuffix')}`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('admin.users.actions.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => invokeAction('delete', profile.id, { hard_delete: true })}
                                    >
                                      {t('admin.users.actions.delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>

                          {/* Role Management */}
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              {t('admin.users.roleManagement')}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {ALL_ROLES.map(role => {
                                const hasRole = profile.roles.includes(role);
                                // Mirrors admin-manage-user: platform roles can't be granted here,
                                // can't be removed from yourself, and admin can't be stripped from another admin.
                                const isPlatformRole = role === 'admin' || role === 'uno_team';
                                const blocked =
                                  (isPlatformRole && !hasRole) ||
                                  (isPlatformRole && isSelf(profile.id)) ||
                                  (role === 'admin' && hasRole);
                                return (
                                  <Button
                                    key={role}
                                    variant={hasRole ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                      'h-6 text-[10px] gap-1 px-2',
                                      hasRole && 'bg-primary/80'
                                    )}
                                    disabled={!!loadingAction || blocked}
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
                    {t('admin.users.empty')}
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
