import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';

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
  const isRu = language === 'ru';

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
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleConfig = ROLE_LABELS[activeRole] || ROLE_LABELS.user;

  return (
    <button
      onClick={() => navigate('/profile/edit')}
      className="w-full flex items-center gap-4 py-2 text-left hover:opacity-80 transition-opacity"
    >
      <Avatar className="h-16 w-16 border-2 border-primary/10">
        <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-xl truncate">{displayName}</h2>
        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        <Badge className={`mt-1 text-[10px] ${roleConfig.color}`}>
          {isRu ? roleConfig.ru : roleConfig.en}
        </Badge>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
    </button>
  );
}
