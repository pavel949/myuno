import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Users, ChevronDown, Shield, Mail, Phone, KeyRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProfileWithRoles {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
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

export function ControlUsersTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);
  const [resettingId, setResettingId] = React.useState<string | null>(null);

  const handleResetPassword = async (email: string | null, userId: string) => {
    if (!email) {
      toast.error(isRussian ? 'У пользователя нет email' : 'User has no email');
      return;
    }
    setResettingId(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success(isRussian ? `Ссылка для сброса отправлена на ${email}` : `Reset link sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setResettingId(null);
    }
  };

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles-with-roles', searchQuery],
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      // Fetch profiles
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data: profilesData, error } = await query;
      if (error) throw error;
      if (!profilesData || profilesData.length === 0) return [];

      // Fetch roles for these profiles
      const ids = profilesData.map(p => p.id);
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

      return profilesData.map(p => ({
        ...p,
        roles: rolesMap.get(p.id) || [],
      }));
    }
  });

  const toggleUser = (id: string) => {
    setExpandedUser(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              {isRussian ? 'Пользователи' : 'Users'}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {profiles?.length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {isRussian ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : (
              <div className="space-y-1">
                {profiles?.map((profile) => (
                  <Collapsible
                    key={profile.id}
                    open={expandedUser === profile.id}
                    onOpenChange={() => toggleUser(profile.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                        {/* Name + roles */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {profile.full_name || '—'}
                            </span>
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
                        {/* Time ago */}
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {profile.created_at
                            ? formatDistanceToNow(new Date(profile.created_at), {
                                addSuffix: false,
                                locale: isRussian ? ru : undefined,
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
                      <div className="ml-3 pl-3 border-l-2 border-muted py-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{profile.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{profile.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span>{isRussian ? 'Роли' : 'Roles'}: {profile.roles.length > 0 ? profile.roles.join(', ') : (isRussian ? 'нет' : 'none')}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          ID: <code className="bg-muted px-1 rounded text-[10px]">{profile.id.slice(0, 8)}…</code>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 mt-1"
                          disabled={resettingId === profile.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetPassword(profile.email, profile.id);
                          }}
                        >
                          <KeyRound className="h-3 w-3" />
                          {resettingId === profile.id
                            ? (isRussian ? 'Отправка...' : 'Sending...')
                            : (isRussian ? 'Сбросить пароль' : 'Reset Password')}
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {isRussian ? 'Пользователи не найдены' : 'No users found'}
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
