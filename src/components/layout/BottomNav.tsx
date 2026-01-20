import React, { forwardRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/discover', icon: Compass, labelKey: 'nav.discover' },
  { path: '/support', icon: MessageCircle, labelKey: 'nav.support' },
  { path: '/bookings', icon: Calendar, labelKey: 'nav.bookings' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export const BottomNav = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { t } = useLanguage();
    const location = useLocation();

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      triggerRipple(e);
      triggerHaptic('light');
    };

    return (
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 md:hidden" {...props}>
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border" />
        
        {/* Nav items */}
        <div className="relative flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, labelKey }) => {
            const isActive = location.pathname === path;
            const tourId = path === '/profile' ? 'profile' : path === '/bookings' ? 'cart' : undefined;
            
            return (
              <NavLink
                key={path}
                to={path}
                onClick={handleNavClick}
                data-tour={tourId}
                className={cn(
                  "relative overflow-hidden flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all truncate max-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {t(labelKey)}
                </span>
              </NavLink>
            );
          })}
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-background/80" />
      </nav>
    );
  }
);

BottomNav.displayName = 'BottomNav';