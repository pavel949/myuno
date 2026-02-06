import React from 'react';
import { User, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface GuestModeBadgeProps {
  className?: string;
  variant?: 'minimal' | 'chip';
  showLoginHint?: boolean;
}

/**
 * Subtle indicator showing user is browsing as a guest.
 * Only shows when user is NOT authenticated.
 */
export function GuestModeBadge({ 
  className, 
  variant = 'minimal',
  showLoginHint = false,
}: GuestModeBadgeProps) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isRu = language === 'ru';

  // Don't show if authenticated or loading
  if (isLoading || user) return null;

  const handleClick = () => {
    navigate('/auth', { state: { from: location.pathname } });
  };

  if (variant === 'chip') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
          "text-xs font-medium transition-colors",
          className
        )}
      >
        <User className="w-3 h-3" />
        <span>{isRu ? 'Гость' : 'Guest'}</span>
        {showLoginHint && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <LogIn className="w-3 h-3" />
            <span>{isRu ? 'Войти' : 'Sign in'}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <User className="w-3 h-3" />
      <span>{isRu ? 'Гость' : 'Guest'}</span>
    </div>
  );
}
