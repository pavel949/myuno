import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';

interface HomeTopBarProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

function useHasUnread(userId: string | undefined) {
  return useQuery({
    queryKey: ['home-unread', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', userId)
        .in('status', ['pending', 'pending_review', 'action_required']);
      return (count ?? 0) > 0;
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

export function HomeTopBar({ personas, onRoleSheetOpen }: HomeTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const { data: hasUnread = false } = useHasUnread(user?.id);
  const displayPersonas = personas.slice(0, 3);

  return (
    <div className="flex items-center justify-between pt-2 pb-3">
      {/* Logo */}
      <div className="flex items-baseline gap-0">
        <span className="font-display text-[22px] font-normal text-muted-foreground tracking-[-0.02em]">my</span>
        <span className="font-display text-[22px] font-bold text-foreground tracking-[0.02em]">UNO</span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Role stack pill — min 44px touch target */}
        {displayPersonas.length > 0 && (
          <button
            onClick={onRoleSheetOpen}
            aria-label="Manage roles"
            className="flex items-center gap-0 min-h-[44px] px-2.5 rounded-full border border-border hover:border-border-strong transition-colors"
          >
            <div className="flex">
              {displayPersonas.map((p, i) => {
                const meta = ROLE_META[p];
                if (!meta) return null;
                return (
                  <div
                    key={p}
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[11px] font-bold text-[#08101E] border-2 border-background"
                    style={{ background: meta.color, marginLeft: i === 0 ? 0 : -9, zIndex: 10 - i }}
                  >
                    {meta.glyph}
                  </div>
                );
              })}
            </div>
            {personas.length > 3 && (
              <span className="font-mono text-[10px] text-muted-foreground ml-1.5">+{personas.length - 3}</span>
            )}
            <svg className="ml-2 opacity-40" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Bell — 44px tap target, badge only when there's something pending */}
        <button
          onClick={() => navigate('/account?tab=notifications')}
          aria-label="Notifications"
          className="relative w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-[17px] h-[17px]" />
          {hasUnread && (
            <span className="absolute top-[9px] right-[10px] w-[6px] h-[6px] rounded-full bg-primary" />
          )}
        </button>

        {/* Avatar — 44px tap target */}
        <button
          onClick={() => navigate('/account')}
          aria-label="Account"
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center font-display text-[12px] font-semibold text-foreground"
          style={{ background: 'linear-gradient(135deg, #26314A 0%, #0F1C2E 100%)' }}
        >
          {initials}
        </button>
      </div>
    </div>
  );
}
