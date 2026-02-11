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
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
  showForRoles?: string[];
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/bookings', icon: ShoppingBag, labelEn: 'Bookings & Orders', labelRu: 'Заказы и брони' },
  { path: '/favorites', icon: Heart, labelEn: 'Favorites', labelRu: 'Избранное' },
  { path: '/wallet', icon: CreditCard, labelEn: 'Wallet & Payments', labelRu: 'Кошелёк и оплата' },
  { path: '/profile/referral', icon: Gift, labelEn: 'Invite & Earn', labelRu: 'Пригласить и заработать' },
  { path: '/notifications', icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления' },
  { path: '/profile/documents', icon: FileText, labelEn: 'Documents', labelRu: 'Документы' },
  { path: '/profile/settings', icon: Settings, labelEn: 'Account Settings', labelRu: 'Настройки аккаунта' },
  { path: '/support', icon: HelpCircle, labelEn: 'Help & Support', labelRu: 'Помощь и поддержка' },
];

const OWNER_ITEMS: MenuItem[] = [
  { path: '/owner', icon: Home, labelEn: 'My Properties', labelRu: 'Мои объекты', showForRoles: ['owner'] },
  { path: '/list-with-us', icon: Plus, labelEn: 'List with UNO', labelRu: 'Разместить объявление', showForRoles: ['owner'] },
];

export function AccountFlatMenu() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { activeRole } = useUserContext();
  const isRu = language === 'ru';

  const isOwner = activeRole === 'owner';
  const allItems = isOwner ? [...OWNER_ITEMS, ...MENU_ITEMS] : MENU_ITEMS;

  return (
    <nav className="space-y-0">
      {allItems.map((item, i) => {
        const Icon = item.icon;
        const showDividerAfter = isOwner && i === OWNER_ITEMS.length - 1;

        return (
          <React.Fragment key={item.path}>
            <button
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-4 py-4 text-left",
                "hover:opacity-70 transition-opacity active:scale-[0.99]"
              )}
            >
              <Icon className="h-5 w-5 text-foreground/70 flex-shrink-0" />
              <span className="flex-1 text-[15px] font-medium">{isRu ? item.labelRu : item.labelEn}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </button>
            {showDividerAfter && <div className="border-t my-2" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
