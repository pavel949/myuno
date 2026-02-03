import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCollections } from '@/hooks/useUserCollections';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Flame, Star, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAccessLinkProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  badge?: number;
  onClick: () => void;
}

function QuickAccessLink({ icon, iconBg, label, badge, onClick }: QuickAccessLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "hover:bg-muted/50 active:bg-muted transition-colors"
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="px-2 py-0.5 text-xs">
          {badge}
        </Badge>
      )}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

interface QuickAccessSectionProps {
  onNavigate: () => void;
}

export function QuickAccessSection({ onNavigate }: QuickAccessSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { wishlistCount } = useUserCollections({ itemType: 'product' });

  const handleNav = (path: string) => {
    onNavigate();
    navigate(path);
  };

  const links = [
    {
      icon: <Flame className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      label: language === 'ru' ? 'Акции и скидки' : 'Deals & Discounts',
      path: '/market/category/deals',
    },
    {
      icon: <Star className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      label: language === 'ru' ? 'Хиты продаж' : 'Bestsellers',
      path: '/market/category/popular',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      label: language === 'ru' ? 'Новинки' : 'New Arrivals',
      path: '/market/category/new',
    },
    {
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      label: language === 'ru' ? 'Избранное' : 'Wishlist',
      path: '/market/wishlist',
      badge: wishlistCount,
    },
  ];

  return (
    <div className="py-1">
      <div className="px-4 py-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {language === 'ru' ? 'Быстрый доступ' : 'Quick Access'}
        </span>
      </div>
      {links.map((link, i) => (
        <QuickAccessLink
          key={i}
          icon={link.icon}
          iconBg={link.iconBg}
          label={link.label}
          badge={link.badge}
          onClick={() => handleNav(link.path)}
        />
      ))}
    </div>
  );
}
