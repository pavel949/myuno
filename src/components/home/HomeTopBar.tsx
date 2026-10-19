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
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

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

  // Keep the existing caller API; home preferences are opened by the
  // explicit Customize home controls in the hero and app drawer.
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
            aria-label={pickLang(language, { ru: 'Открыть меню', en: 'Open menu', th: 'เปิดเมนู' })}
            className={cn(
              'w-11 h-11 -ml-2 rounded-full flex items-center justify-center transition-colors',
              iconButtonCls,
            )}
          >
            <Menu className="w-[19px] h-[19px]" aria-hidden="true" />
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
            {pickLang(language, { ru: 'Инфраструктура для жизни на Пхукете', en: 'Infrastructure for life in Phuket', th: 'โครงสร้างพื้นฐานสำหรับชีวิตในภูเก็ต' })}
          </span>
        </div>
      </div>

      {/* Right cluster — notifications and account. */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">

        {/* Bell — 44px tap target, badge only when there's something pending */}
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.NOTIFICATIONS)}
          aria-label={
            hasUnread
              ? pickLang(language, { ru: 'Уведомления — есть непрочитанные', en: 'Notifications — unread items', th: 'การแจ้งเตือน มีรายการที่ยังไม่ได้อ่าน' })
              : pickLang(language, { ru: 'Уведомления', en: 'Notifications', th: 'การแจ้งเตือน' })
          }
          className={cn(
            'relative w-11 h-11 rounded-full flex items-center justify-center transition-colors',
            borderedButtonCls,
          )}
        >
          <Bell className="w-[17px] h-[17px]" aria-hidden="true" />
          {hasUnread && (
            <span
              aria-hidden="true"
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
          type="button"
          onClick={() => navigate(APP_ROUTES.ME_PROFILE)}
          aria-label={pickLang(language, { ru: 'Профиль', en: 'Profile', th: 'โปรไฟล์' })}
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

