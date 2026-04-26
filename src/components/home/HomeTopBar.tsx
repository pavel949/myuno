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
  // On very narrow phones (Telegram WebView ≈ 339px) the role pill +
  // bell + avatar starve the wordmark column. Cap to 2 avatars below
  // sm so a 3rd persona folds into the existing `+N` counter, then
  // restore 3 from sm up.
  const isOnNavy = variant === 'onNavy';
  const maxAvatarsXs = 2;
  const maxAvatarsSm = 3;
  const overflowXs = Math.max(0, personas.length - maxAvatarsXs);
  const overflowSm = Math.max(0, personas.length - maxAvatarsSm);
  const displayPersonas = personas.slice(0, maxAvatarsSm);

  // Style atoms — keeps the JSX readable while the two contracts diverge.
  // On navy: cream-tinted icons, translucent borders, glassy hover surfaces.
  // On cream (default): existing greyscale chrome unchanged.
  const iconButtonCls = isOnNavy
    ? 'text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground'
    : 'text-foreground hover:bg-muted/40';
  const borderedButtonCls = isOnNavy
    ? 'border border-primary-foreground/20 text-primary-foreground/90 hover:bg-primary-foreground/10 hover:border-primary-foreground/30 hover:text-primary-foreground'
    : 'border border-border text-muted-foreground hover:text-foreground';
  const subtitleCls = isOnNavy
    ? 'text-primary-foreground/65'
    : 'text-muted-foreground/60';
  const rolePillCls = isOnNavy
    ? 'border border-primary-foreground/20 bg-primary-foreground/[0.08] hover:bg-primary-foreground/[0.14] hover:border-primary-foreground/30'
    : 'border border-border bg-card/40 hover:border-border-strong hover:bg-card/60';
  const roleAvatarBorder = isOnNavy ? 'border-primary' : 'border-background';
  const rolePillCountCls = isOnNavy ? 'text-primary-foreground/70' : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between pt-2 pb-3 gap-2 sm:gap-3">
      {/* Drawer trigger + logo cluster — does NOT shrink; the wordmark
          must always render on a single line. */}
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
          {/* Subtitle competes with the wordmark on narrow phones (it forced
              the wordmark to truncate as "myUNO — P…" in the user-reported
              Telegram WebView). Hide below sm; show from tablet up. */}
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

      {/* Right cluster — allowed to shrink so the logo always wins. */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {/* Role stack pill — min 44px touch target */}
        {displayPersonas.length > 0 && (
          <button
            onClick={onRoleSheetOpen}
            aria-label="Manage roles"
            className={cn(
              'flex items-center gap-0 min-h-[44px] px-2 sm:px-2.5 rounded-full transition-colors',
              rolePillCls,
            )}
          >
            <div className="flex">
              {displayPersonas.map((p, i) => {
                const meta = ROLE_META[p];
                if (!meta) return null;
                // Hide the 3rd avatar below sm (Telegram WebView ≈339px) —
                // it folds into the `+N` counter so the affordance stays.
                const hideOnXs = i >= maxAvatarsXs;
                return (
                  <div
                    key={p}
                    className={cn(
                      'w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[11px] font-bold border-2 bg-muted shadow-sm',
                      roleAvatarBorder,
                      hideOnXs && 'hidden sm:flex',
                    )}
                    style={{ color: meta.color, marginLeft: i === 0 ? 0 : -9, zIndex: 10 - i }}
                  >
                    {meta.glyph}
                  </div>
                );
              })}
            </div>
            {/* Two responsive counters: shows `+N` based on how many avatars
                are actually visible at the current breakpoint. */}
            {overflowXs > 0 && (
              <span className={cn('sm:hidden text-[10px] tabular-nums ml-1.5 font-sans', rolePillCountCls)}>
                +{overflowXs}
              </span>
            )}
            {overflowSm > 0 && (
              <span className={cn('hidden sm:inline text-[10px] tabular-nums ml-1.5 font-sans', rolePillCountCls)}>
                +{overflowSm}
              </span>
            )}
            {/* Caret hidden on xs to save ~18px; the role pill is still
                tappable and the avatar stack reads as a switcher. */}
            <svg className="hidden sm:block ml-2 opacity-50" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

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

