import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function AppHeader({ title, showBack, onMenuClick, className }: AppHeaderProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-background/80 backdrop-blur-xl border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            {!title && (
              <span className="text-xl font-display font-bold text-gradient-gold hidden sm:block">
                UNO
              </span>
            )}
          </Link>
          
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher size="sm" />
          
          {user ? (
            <>
              <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5" />
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              
              <Link to="/profile">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/30">
                  <span className="text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <PremiumButton size="sm">
                {t('auth.login')}
              </PremiumButton>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
