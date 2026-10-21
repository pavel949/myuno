import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useNotificationActions } from '@/hooks/useNotificationActions';
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

function NotificationButton({ language, isOnNavy, className }: { language: Language; isOnNavy: boolean; className: string }) {
  const navigate = useNavigate();
  // Reuse the in-app notification source without mounting push/admin features.
  // Opening this button never marks notifications as read.
  const { unreadCount, isLoading } = useNotificationActions();
  const hasUnread = !isLoading && unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => navigate(APP_ROUTES.NOTIFICATIONS)}
      aria-label={
        hasUnread
          ? pickLang(language, { ru: 'Уведомления — есть непрочитанные', en: 'Notifications — unread items', th: 'การแจ้งเตือน มีรายการที่ยังไม่ได้อ่าน' })
          : pickLang(language, { ru: 'Уведомления', en: 'Notifications', th: 'การแจ้งเตือน' })
      }
      className={cn('relative w-11 h-11 rounded-full flex items-center justify-center transition-colors', className)}
    >
      <Bell className="w-[17px] h-[17px]" aria-hidden="true" />
      {hasUnread && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-[9px] right-[10px] w-[6px] h-[6px] rounded-full',
            isOnNavy ? 'bg-[hsl(var(--brand-orange-400))]' : 'bg-primary',
          )}
        />
      )}
    </button>
  );
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
  const fullName = user?.user_metadata?.full_name;
  const initials = typeof fullName === 'string' && fullName.trim()
    ? fullName.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isOnNavy = variant === 'onNavy';

  // Style atoms — keeps the JSX readable while the two contracts diverge.
  const iconButtonCls = 'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ' + (isOnNavy
    ? 'text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground'
    : 'text-foreground hover:bg-muted/40');
  const borderedButtonCls = 'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ' + (isOnNavy
    ? 'border border-primary-foreground/20 text-primary-foreground/90 hover:bg-primary-foreground/10 hover:border-primary-foreground/30 hover:text-primary-foreground'
    : 'border border-border text-muted-foreground hover:text-foreground');
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

        {/* Remount on actor changes so an old account's badge cannot linger. */}
        <NotificationButton key={user?.id ?? 'guest'} language={language} isOnNavy={isOnNavy} className={borderedButtonCls} />

        {/* Avatar — 44px tap target */}
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.ME_PROFILE)}
          aria-label={pickLang(language, { ru: 'Профиль', en: 'Profile', th: 'โปรไฟล์' })}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-semibold font-sans shadow-inner focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
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

