/**
 * UserAvatarMenu — Airbnb-style dropdown from avatar + hamburger button
 * Consolidates: navigation, role switch, settings, logout
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingBag, User, Settings,
  HelpCircle, Gift, LogOut, Store, Building2, Shield, Headphones,
  Menu, Bell, CreditCard, UserCog, Briefcase, Construction, Crown,
  LineChart, Eye, Zap,
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformViewAs } from '@/contexts/PlatformViewAsContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
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
    // /owner redirects to /mc — point directly to avoid an extra hop.
    path: '/mc',
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
  investor: {
    labelEn: 'Investor workspace',
    labelRu: 'Кабинет инвестора',
    descEn: 'Capital & portfolio tools',
    descRu: 'Капитал и портфель',
    icon: LineChart,
    // /investor route does not exist — investor dashboard lives under /invest/dashboard.
    path: APP_ROUTES.INVEST_DASHBOARD,
  },
};

/** Platform / staff roles shown first in the switcher */
const PLATFORM_ROLE_ORDER: AppRole[] = ['admin', 'uno_team', 'staff', 'investor'];
/** Business / workspace roles */
const WORKSPACE_ROLE_ORDER: AppRole[] = ['vendor', 'owner', 'property_manager'];

function orderSwitchable(roles: AppRole[], order: AppRole[]): AppRole[] {
  return order.filter((r) => roles.includes(r));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function UserAvatarMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { availableRoles, switchContext } = useUserContext();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useIsAdmin();
  const { enter: enterViewAs } = usePlatformViewAs();
  const isRu = language === 'ru';

  const [viewAsOpen, setViewAsOpen] = useState(false);
  const [viewAsQuery, setViewAsQuery] = useState('');
  const [viewAsBusy, setViewAsBusy] = useState(false);
  const [viewAsError, setViewAsError] = useState<string | null>(null);

  const switchableRoles = useMemo(
    () =>
      availableRoles.filter(
        (r) => r !== 'user' && r !== 'guest' && r !== 'partner' && ROLE_SWITCH_CONFIG[r]
      ),
    [availableRoles]
  );

  const platformRoles = useMemo(
    () => orderSwitchable(switchableRoles, PLATFORM_ROLE_ORDER),
    [switchableRoles]
  );
  const workspaceRoles = useMemo(
    () => orderSwitchable(switchableRoles, WORKSPACE_ROLE_ORDER),
    [switchableRoles]
  );

  // Quick Operate — single-tap shortcut for multi-role operators.
  // Priority: last-used (localStorage) → admin → property_manager → owner → vendor → investor.
  // Only shown when user has 2+ operational roles (otherwise Platform/Workspaces blocks already cover it).
  const QUICK_OPERATE_PRIORITY: AppRole[] = ['admin', 'property_manager', 'owner', 'vendor', 'investor', 'uno_team', 'staff'];
  const quickOperateRole = useMemo<AppRole | null>(() => {
    if (switchableRoles.length < 2) return null;
    try {
      const last = localStorage.getItem('myuno:lastOperateRole') as AppRole | null;
      if (last && switchableRoles.includes(last) && ROLE_SWITCH_CONFIG[last]) return last;
    } catch { /* ignore */ }
    return QUICK_OPERATE_PRIORITY.find((r) => switchableRoles.includes(r)) ?? null;
  }, [switchableRoles]);

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = userName.charAt(0).toUpperCase();

  const handleRoleSwitch = async (role: AppRole) => {
    const config = ROLE_SWITCH_CONFIG[role];
    if (!config) return;
    try { localStorage.setItem('myuno:lastOperateRole', role); } catch { /* ignore */ }
    await switchContext({ role });
    navigate(config.path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleViewAsSubmit = async () => {
    setViewAsError(null);
    const q = viewAsQuery.trim();
    if (!q) {
      setViewAsError(isRu ? 'Введите email или ID пользователя' : 'Enter user email or UUID');
      return;
    }
    setViewAsBusy(true);
    try {
      let targetId: string | null = null;
      let targetEmail: string | null = null;

      if (UUID_RE.test(q)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,email')
          .eq('id', q)
          .maybeSingle();
        if (error) throw error;
        if (!data?.id) {
          setViewAsError(isRu ? 'Пользователь не найден' : 'User not found');
          return;
        }
        targetId = data.id;
        targetEmail = data.email ?? null;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,email')
          .ilike('email', q)
          .maybeSingle();
        if (error) throw error;
        if (!data?.id) {
          setViewAsError(isRu ? 'Пользователь не найден' : 'User not found');
          return;
        }
        targetId = data.id;
        targetEmail = data.email ?? null;
      }

      if (targetId === user.id) {
        setViewAsError(isRu ? 'Это ваш аккаунт' : 'That is your own account');
        return;
      }

      await enterViewAs(targetId, targetEmail, isRu ? 'View-as из меню' : 'View-as from menu');
      setViewAsOpen(false);
      setViewAsQuery('');
    } catch (e) {
      setViewAsError(e instanceof Error ? e.message : 'Error');
    } finally {
      setViewAsBusy(false);
    }
  };

  const renderRoleItems = (roles: AppRole[]) =>
    roles.map((role) => {
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
    });

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
    <>
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
        className="w-72 p-0 rounded-none shadow-xl border border-border/50 max-h-[min(85vh,560px)] overflow-y-auto overflow-x-hidden"
      >
        {/* Role switch + developer portal — top, prominent (portal is not an AppRole) */}
        <DropdownMenuGroup>
            {platformRoles.length > 0 && (
              <>
                <DropdownMenuLabel className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isRu ? 'Платформа' : 'Platform'}
                </DropdownMenuLabel>
                {renderRoleItems(platformRoles)}
              </>
            )}
            {workspaceRoles.length > 0 && (
              <>
                <DropdownMenuLabel className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isRu ? 'Рабочие пространства' : 'Workspaces'}
                </DropdownMenuLabel>
                {renderRoleItems(workspaceRoles)}
              </>
            )}
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => {
                  setViewAsError(null);
                  setViewAsOpen(true);
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50 bg-accent/5"
              >
                <Eye className="w-5 h-5 text-accent dark:text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {isRu ? 'Просмотр от имени пользователя' : 'View as user (audit)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Запись в журнале; права не меняются'
                      : 'Logged for audit; permissions stay yours'}
                  </p>
                </div>
              </DropdownMenuItem>
            )}
            {/* Newbuilds Console — admin-only shortcut (Ignatev Estate director) */}
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => navigate('/admin/newbuilds')}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer focus:bg-muted/50 bg-primary/5"
              >
                <Crown className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {isRu ? 'Newbuilds Console' : 'Newbuilds Console'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Ignatev Estate — застройщики, проекты, документы' : 'Ignatev Estate — developers, projects, docs'}
                  </p>
                </div>
              </DropdownMenuItem>
            )}
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

    <Dialog open={viewAsOpen} onOpenChange={setViewAsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Просмотр от имени пользователя' : 'View as user'}</DialogTitle>
          <DialogDescription>
            {isRu
              ? 'Введите email или UUID профиля. Действие записывается в журнал; RLS и ваши права не меняются.'
              : 'Enter profile email or UUID. This is audited; RLS still applies to your admin session.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Input
            placeholder={isRu ? 'email или UUID' : 'email or user UUID'}
            value={viewAsQuery}
            onChange={(e) => {
              setViewAsQuery(e.target.value);
              setViewAsError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleViewAsSubmit();
            }}
            disabled={viewAsBusy}
            autoComplete="off"
          />
          {viewAsError && (
            <p className="text-sm text-destructive">{viewAsError}</p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={() => setViewAsOpen(false)} disabled={viewAsBusy}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button type="button" onClick={() => void handleViewAsSubmit()} disabled={viewAsBusy}>
            {viewAsBusy ? '…' : isRu ? 'Начать' : 'Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
