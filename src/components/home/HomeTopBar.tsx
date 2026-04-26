import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { cn } from '@/lib/utils';

interface HomeTopBarProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
  /** Open the global app drawer (left-side launcher). */
  onAppDrawerOpen?: () => void;
  /**
   * Background tone the bar sits on.
   *  - `default` — cream page surface (existing behaviour).
   *  - `onNavy`  — placed inside the canonical navy brand band; flips text,
   *    icons, and pill chrome to cream-on-navy contracts.
   */
  variant?: 'default' | 'onNavy';
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

export function HomeTopBar({
  personas,
  onRoleSheetOpen,
  onAppDrawerOpen,
  variant = 'default',
}: HomeTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const { data: hasUnread = false } = useHasUnread(user?.id);
  const isOnNavy = variant === 'onNavy';

  // Style atoms — keeps the JSX readable while the two contracts diverge.
  const iconButtonCls = isOnNavy
    ? 'text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground'
    : 'text-foreground hover:bg-muted/40';
  const borderedButtonCls = isOnNavy
    ? 'border border-primary-foreground/20 text-primary-foreground/90 hover:bg-primary-foreground/10 hover:border-primary-foreground/30 hover:text-primary-foreground'
    : 'border border-border text-muted-foreground hover:text-foreground';
  const subtitleCls = isOnNavy
    ? 'text-primary-foreground/65'
    : 'text-muted-foreground/60';

  // Suppress unused-personas-prop warning while keeping the API stable for
  // callers — PersonaHalo now owns the role-stack affordance.
  void personas;
  void onRoleSheetOpen;

  return (
    <div className="flex items-center justify-between pt-2 pb-3 gap-2 sm:gap-3">
      {/* Drawer trigger + logo cluster — does NOT shrink. */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onAppDrawerOpen && (
          <button
            type="button"
            onClick={onAppDrawerOpen}
            aria-label={isRu ? 'Открыть меню' : 'Open menu'}
            className={cn(
              'w-11 h-11 -ml-2 rounded-full flex items-center justify-center transition-colors',
              iconButtonCls,
            )}
          >
            <Menu className="w-[19px] h-[19px]" />
          </button>
        )}
        <div className="flex flex-col leading-none">
          <BrandWordmark
            as="static"
            tone={isOnNavy ? 'onNavy' : 'default'}
          />
          <span
            className={cn(
              'hidden sm:block text-[10px] tracking-[0.14em] uppercase font-semibold mt-1 truncate',
              subtitleCls,
            )}
          >
            {isRu ? 'Инфраструктура для жизни на Пхукете' : 'Infrastructure for life on Phuket'}
          </span>
        </div>
      </div>

      {/* Right cluster — compact: bell + avatar. Role switching now lives
          inside PersonaHalo (tap on identity tile). */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">

        {/* Bell — 44px tap target, badge only when there's something pending */}
        <button
          onClick={() => navigate('/account?tab=notifications')}
          aria-label="Notifications"
          className={cn(
            'relative w-11 h-11 rounded-full flex items-center justify-center transition-colors',
            borderedButtonCls,
          )}
        >
          <Bell className="w-[17px] h-[17px]" />
          {hasUnread && (
            <span
              className={cn(
                'absolute top-[9px] right-[10px] w-[6px] h-[6px] rounded-full',
                // On navy the navy dot would disappear — switch to the
                // canonical orange-400 accent so the cue stays visible.
                isOnNavy ? 'bg-[hsl(var(--brand-orange-400))]' : 'bg-primary',
              )}
            />
          )}
        </button>

        {/* Avatar — 44px tap target */}
        <button
          onClick={() => navigate('/account')}
          aria-label="Account"
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shadow-inner',
            isOnNavy
              ? 'border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15'
              : 'border border-border text-foreground bg-gradient-to-br from-card to-secondary',
          )}
        >
          {initials}
        </button>
      </div>
    </div>
  );
}

