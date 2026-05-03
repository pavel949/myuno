import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { cn } from '@/lib/utils';
import {
  Settings,
  FileText,
  Bell,
  HelpCircle,
  CreditCard,
  Heart,
  ShoppingBag,
  Home,
  Plus,
  Gift,
  ChevronRight,
  Building2,
  Construction,
  CalendarClock,
  CalendarRange,
  ShoppingCart,
  ArrowRightLeft,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { APP_ROUTES } from '@/lib/config/routes';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const STANDARD_ITEMS: MenuItem[] = [
  { path: '/bookings', icon: ShoppingBag, labelKey: 'account.menu.bookings' },
  { path: '/favorites', icon: Heart, labelKey: 'account.menu.favorites' },
  { path: '/account/saved-searches', icon: Bookmark, labelKey: 'account.menu.savedSearches' },
  { path: '/account/newbuild-alerts', icon: BellRing, labelKey: 'account.menu.newbuildAlerts' },
  { path: '/wallet', icon: CreditCard, labelKey: 'account.menu.wallet' },
  { path: '/profile/referral', icon: Gift, labelKey: 'account.menu.referral' },
  { path: '/notifications', icon: Bell, labelKey: 'account.menu.notifications' },
  { path: '/profile/documents', icon: FileText, labelKey: 'account.menu.documents' },
  { path: '/profile/settings', icon: Settings, labelKey: 'account.menu.settings' },
  { path: '/support', icon: HelpCircle, labelKey: 'account.menu.support' },
];

const OWNER_ITEMS: MenuItem[] = [
  { path: '/owner', icon: Home, labelKey: 'account.menu.ownerProperties' },
  { path: '/list-with-us', icon: Plus, labelKey: 'account.menu.listWithUno' },
];

function PropertySection({
  onNavigate,
  t,
}: {
  onNavigate: (path: string) => void;
  t: (k: string) => string;
}) {
  const links: { path: string; icon: typeof Building2; labelKey: string }[] = [
    { path: APP_ROUTES.PROPERTY, icon: LayoutGrid, labelKey: 'account.property.hub' },
    {
      path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`,
      icon: CalendarClock,
      labelKey: 'account.property.rentShort',
    },
    {
      path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`,
      icon: CalendarRange,
      labelKey: 'account.property.rentLong',
    },
    { path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=buy`, icon: ShoppingCart, labelKey: 'account.property.buy' },
    { path: APP_ROUTES.OFFPLAN, icon: Building2, labelKey: 'account.property.newBuild' },
    { path: APP_ROUTES.RESALE, icon: ArrowRightLeft, labelKey: 'account.property.resale' },
    { path: APP_ROUTES.INVEST, icon: TrendingUp, labelKey: 'account.property.invest' },
    { path: '/property/my', icon: Home, labelKey: 'account.property.myHub' },
    {
      path: APP_ROUTES.DEVELOPER_PORTAL,
      icon: Construction,
      labelKey: 'account.property.developerPortal',
    },
  ];

  return (
    <div className="pb-2">
      <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t('account.property.section')}
      </p>
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={cn(
              'w-full flex items-center gap-4 py-3 text-left',
              'hover:opacity-70 transition-opacity '
            )}
          >
            <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{t(item.labelKey)}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>
        );
      })}
    </div>
  );
}

export function AccountFlatMenu() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeRole } = useUserContext();
  const { companies } = useActiveCompany();

  const hasCompany = companies.length > 0;
  const isOwner = activeRole === 'owner';

  const mcItem: MenuItem = {
    path: '/mc',
    icon: Building2,
    labelKey: 'account.menu.mcWorkspace',
  };

  const prefix: MenuItem[] = [];
  if (hasCompany) prefix.push(mcItem);
  if (isOwner) prefix.push(...OWNER_ITEMS);

  return (
    <nav className="space-y-0">
      {prefix.map((item) => {
        const Icon = item.icon;
        const label = t(item.labelKey);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'w-full flex items-center gap-4 py-4 text-left',
              'hover:opacity-70 transition-opacity '
            )}
          >
            <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{label}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>
        );
      })}
      {prefix.length > 0 ? <div className="border-t my-2" /> : null}

      <PropertySection onNavigate={(p) => navigate(p)} t={t} />
      <div className="border-t my-2" />

      {STANDARD_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'w-full flex items-center gap-4 py-4 text-left',
              'hover:opacity-70 transition-opacity '
            )}
          >
            <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{t(item.labelKey)}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>
        );
      })}
    </nav>
  );
}
