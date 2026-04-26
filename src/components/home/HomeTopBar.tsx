import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { BrandWordmark } from '@/components/uno/BrandWordmark';

interface HomeTopBarProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
  /** Open the global app drawer (left-side launcher). */
  onAppDrawerOpen?: () => void;
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
        .in('status', ['pending', 'awaiting_client_payment', 'pending_deposit']);
      return (count ?? 0) > 0;
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

export function HomeTopBar({ personas, onRoleSheetOpen, onAppDrawerOpen }: HomeTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const { data: hasUnread = false } = useHasUnread(user?.id);
  const displayPersonas = personas.slice(0, 3);

  return (
    <div className="flex items-center justify-between pt-2 pb-3 gap-3">
      {/* Drawer trigger + logo cluster */}
      <div className="flex items-center gap-2 min-w-0">
        {onAppDrawerOpen && (
          <button
            type="button"
            onClick={onAppDrawerOpen}
            aria-label={isRu ? 'Открыть меню' : 'Open menu'}
            className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-foreground hover:bg-muted/40 transition-colors"
          >
            <Menu className="w-[19px] h-[19px]" />
          </button>
        )}
        <div className="flex flex-col min-w-0 leading-none">
          <BrandWordmark as="static" className="min-w-0" />
          {/* Subtitle competes with the wordmark on narrow phones (it forced
              the wordmark to truncate as "myUNO — P…" in the user-reported
              Telegram WebView). Hide below sm; show from tablet up. */}
          <span className="hidden sm:block text-[10px] tracking-[0.14em] uppercase text-muted-foreground/60 font-semibold mt-1 truncate">
            {isRu ? 'Инфраструктура для жизни на Пхукете' : 'Infrastructure for life on Phuket'}
          </span>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Role stack pill — min 44px touch target */}
        {displayPersonas.length > 0 && (
          <button
            onClick={onRoleSheetOpen}
            aria-label="Manage roles"
            className="flex items-center gap-0 min-h-[44px] px-2.5 rounded-full border border-border bg-card/40 hover:border-border-strong hover:bg-card/60 transition-colors"
          >
            <div className="flex">
              {displayPersonas.map((p, i) => {
                const meta = ROLE_META[p];
                if (!meta) return null;
                return (
                  <div
                    key={p}
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[11px] font-bold border-2 border-background bg-muted shadow-sm"
                    style={{ color: meta.color, marginLeft: i === 0 ? 0 : -9, zIndex: 10 - i }}
                  >
                    {meta.glyph}
                  </div>
                );
              })}
            </div>
            {personas.length > 3 && (
              <span className="text-[10px] tabular-nums text-muted-foreground ml-1.5 font-sans">+{personas.length - 3}</span>
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
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-[12px] font-semibold text-foreground font-sans bg-gradient-to-br from-card to-secondary shadow-inner"
        >
          {initials}
        </button>
      </div>
    </div>
  );
}
