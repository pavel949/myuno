/**
 * UserAvatarMenu — Airbnb-style dropdown from avatar + hamburger button
 * Consolidates: navigation, role switch, settings, logout
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingBag, MessageSquare, User, Settings, Globe,
  HelpCircle, Gift, LogOut, Store, Building2, Shield, Headphones,
  Menu, Bell, CreditCard, UserCog, Briefcase, Construction,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

const ROLE_SWITCH_CONFIG: Partial<Record<AppRole, {
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}>> = {
  vendor: {
    labelEn: 'Switch to Provider',
    labelRu: 'Панель провайдера',
    descEn: 'Manage your services',
    descRu: 'Управление услугами',
    icon: Store,
    path: '/vendor',
  },
  owner: {
    labelEn: 'Property owner',
    labelRu: 'Кабинет собственника',
    descEn: 'Your own properties & bookings',
    descRu: 'Личные объекты: брони и сервисы',
    icon: Building2,
    path: '/owner',
  },
  admin: {
    labelEn: 'Admin Panel',
    labelRu: 'Панель админа',
    descEn: 'Platform administration',
    descRu: 'Администрирование',
    icon: Shield,
    path: '/admin',
  },
  uno_team: {
    labelEn: 'Team Dashboard',
    labelRu: 'Команда myUNO',
    descEn: 'Support & operations',
    descRu: 'Поддержка и операции',
    icon: Headphones,
    path: '/team',
  },
  staff: {
    labelEn: 'Staff workspace',
    labelRu: 'Сотрудник',
    descEn: 'Internal staff tools',
    descRu: 'Внутренние инструменты',
    icon: UserCog,
    path: '/staff',
  },
  property_manager: {
    labelEn: 'Management company (MC)',
    labelRu: 'Управляющая компания (УК)',
    descEn: 'MC dashboard for client properties',
    descRu: 'Панель компании — объекты клиентов',
    icon: Briefcase,
    path: '/mc',
  },
};

export function UserAvatarMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { availableRoles, activeRole, switchContext } = useUserContext();
  const { unreadCount } = useNotifications();
  const isRu = language === 'ru';

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = userName.charAt(0).toUpperCase();

  // Roles that can be switched to (exclude 'user'/'guest')
  const switchableRoles = availableRoles.filter(
    (r) => r !== 'user' && r !== 'guest' && r !== 'partner' && ROLE_SWITCH_CONFIG[r]
  );

  const handleRoleSwitch = async (role: AppRole) => {
    const config = ROLE_SWITCH_CONFIG[role];
    if (!config) return;
    await switchContext({ role });
    navigate(config.path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Primary nav items
  const primaryItems = [
    { icon: Heart, labelEn: 'Favorites', labelRu: 'Избранное', path: '/favorites' },
    { icon: ShoppingBag, labelEn: 'Bookings & Orders', labelRu: 'Заказы и брони', path: '/bookings' },
    {
      icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления', path: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { icon: User, labelEn: 'Profile', labelRu: 'Профиль', path: '/account' },
  ];

  // Secondary items
  const secondaryItems = [
    { icon: Settings, labelEn: 'Settings', labelRu: 'Настройки', path: '/profile/settings' },
    { icon: CreditCard, labelEn: 'Wallet & Payments', labelRu: 'Кошелёк и оплата', path: '/wallet' },
    { icon: HelpCircle, labelEn: 'Help Center', labelRu: 'Центр помощи', path: '/support' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-10 pl-3 pr-1.5 rounded-full",
            "border border-border/60 bg-background hover:shadow-md",
            "transition-all duration-200 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Menu className="w-4 h-4 text-foreground/70" />
          <div className="relative">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full ring-2 ring-background" />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 p-0 rounded-2xl shadow-xl border border-border/50 max-h-[min(85vh,560px)] overflow-y-auto overflow-x-hidden"
      >
        {/* Role switch + developer portal — top, prominent (portal is not an AppRole) */}
        <DropdownMenuGroup>
            {switchableRoles.map((role) => {
              const config = ROLE_SWITCH_CONFIG[role]!;
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50"
                >
                  <Icon className="w-5 h-5 text-foreground/70 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {isRu ? config.labelRu : config.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? config.descRu : config.descEn}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            {/* Developer portal — not an AppRole; direct link (no profile → apply flow) */}
            <DropdownMenuItem
              onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50"
            >
              <Construction className="w-5 h-5 text-foreground/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {isRu ? 'Портал застройщика' : 'Developer portal'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Кабинет застройщика: проекты, лиды, аналитика'
                    : 'Developer workspace: projects, leads, analytics'}
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-0" />
        </DropdownMenuGroup>

        {/* Primary navigation */}
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50"
            >
              <Icon className="w-5 h-5 text-foreground/70 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">
                {isRu ? item.labelRu : item.labelEn}
              </span>
              {'badge' in item && item.badge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-0" />

        {/* Secondary navigation */}
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer focus:bg-muted/50"
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground/80">
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-0" />

        {/* Referral CTA */}
        <DropdownMenuItem
          onClick={() => navigate('/profile/referral')}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50"
        >
          <Gift className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isRu ? 'Пригласить друга' : 'Invite & Earn'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Получите бонус за каждого друга' : 'Earn bonus for every referral'}
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0" />

        {/* Log out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer text-foreground/70 hover:text-foreground focus:bg-muted/50"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{isRu ? 'Выйти' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
