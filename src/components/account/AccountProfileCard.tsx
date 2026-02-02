import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit2 } from 'lucide-react';

const ROLE_LABELS: Record<string, { en: string; ru: string; color: string }> = {
  user: { en: 'Buyer', ru: 'Покупатель', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  owner: { en: 'Owner', ru: 'Владелец', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  vendor: { en: 'Provider', ru: 'Поставщик', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  admin: { en: 'Admin', ru: 'Админ', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  uno_team: { en: 'Team', ru: 'Команда', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export function AccountProfileCard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeRole, isLoading: roleLoading } = useUserContext();
  const isRussian = language === 'ru';

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || roleLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleConfig = ROLE_LABELS[activeRole] || ROLE_LABELS.user;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg truncate">{displayName}</h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge className={`mt-1.5 text-[10px] ${roleConfig.color}`}>
              {isRussian ? roleConfig.ru : roleConfig.en}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/profile/edit')}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
