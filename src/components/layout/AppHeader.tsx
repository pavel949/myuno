import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useCart } from '@/contexts/CartContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const cartItemCount = getItemCount();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-background/80 backdrop-blur-xl border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between h-12 px-3 max-w-7xl mx-auto">
        {/* Left side - Logo */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">my</span>
          <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">U</span>
          </div>
          {!title && (
            <span className="text-lg font-display font-bold text-gradient-gold hidden sm:block">
              UNO
            </span>
          )}
        </Link>
        
        {title && (
          <h1 className="text-base font-semibold truncate flex-1 text-center mx-2 max-w-[40%]">{title}</h1>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-0.5">
          {/* Theme Switcher */}
          <ThemeSwitcher variant="dropdown" size="sm" />
          
          {/* Currency Switcher */}
          <CurrencySwitcher size="sm" />
          
          {/* Language Switcher */}
          <LanguageSwitcher size="sm" />
          
          {/* Cart Button */}
          <button 
            onClick={() => navigate('/cart')}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              </span>
            )}
          </button>
          
          {user ? (
            <>
              {/* Notifications */}
              <button 
                onClick={() => navigate('/notifications')}
                className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              {/* Profile Avatar */}
              <Link to="/profile">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-primary/30 ml-0.5">
                  <span className="text-xs font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <Link to="/auth" className="ml-1">
              <PremiumButton size="sm" className="h-7 text-xs px-2.5">
                {t('auth.login')}
              </PremiumButton>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
