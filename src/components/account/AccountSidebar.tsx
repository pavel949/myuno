import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';


import { AccountProfileCard } from './AccountProfileCard';
import { AccountQuickSettings } from './AccountQuickSettings';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ShoppingBag, Heart, CreditCard, Gift, Bell, FileText,
  Settings, HelpCircle, LogOut,
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/bookings', icon: ShoppingBag, labelEn: 'Bookings & Orders', labelRu: 'Заказы и брони' },
  { path: '/favorites', icon: Heart, labelEn: 'Favorites', labelRu: 'Избранное' },
  { path: '/wallet', icon: CreditCard, labelEn: 'Wallet & Payments', labelRu: 'Кошелёк и оплата' },
  { path: '/profile/referral', icon: Gift, labelEn: 'Invite & Earn', labelRu: 'Пригласить' },
  { path: '/notifications', icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления' },
  { path: '/profile/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы' },
  { path: '/profile/settings', icon: Settings, labelEn: 'Settings', labelRu: 'Настройки' },
  { path: '/support', icon: HelpCircle, labelEn: 'Help', labelRu: 'Помощь' },
];

export function AccountSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const isRu = language === 'ru';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-8 pr-6 space-y-5">
      {/* Profile */}
      <AccountProfileCard />

      <Separator />

      {/* Navigation */}
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{isRu ? item.labelRu : item.labelEn}</span>
            </button>
          );
        })}
      </nav>

      <Separator />

      {/* Quick Settings */}
      <AccountQuickSettings />

      {/* Logout */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>{isRu ? 'Выйти' : 'Log out'}</span>
        </button>
      </div>
    </aside>
  );
}
