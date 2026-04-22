import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuestExplorationBannerProps {
  className?: string;
  variant?: 'inline' | 'floating';
  onDismiss?: () => void;
}

/**
 * Optional banner inviting guests to sign up.
 * Non-intrusive - can be dismissed.
 */
export function GuestExplorationBanner({ 
  className, 
  variant = 'inline',
  onDismiss,
}: GuestExplorationBannerProps) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isRu = language === 'ru';

  // Don't show if authenticated or loading
  if (isLoading || user) return null;

  const handleSignIn = () => {
    navigate('/auth', { state: { from: location.pathname } });
  };

  if (variant === 'floating') {
    return (
      <div 
        className={cn(
          "fixed bottom-[calc(var(--bottom-nav-h)+1rem)] left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm",
          "bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg",
          "p-4 animate-in slide-in-from-bottom-4 duration-300",
          className
        )}
      >
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {isRu ? 'Получите больше возможностей' : 'Unlock more features'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRu 
                ? 'Войдите для кэшбэка и отслеживания заказов' 
                : 'Sign in for cashback and order tracking'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button onClick={handleSignIn} size="sm" className="flex-1 gap-1.5">
            <LogIn className="w-3.5 h-3.5" />
            {isRu ? 'Войти' : 'Sign in'}
          </Button>
          <Button onClick={onDismiss} variant="ghost" size="sm">
            {isRu ? 'Позже' : 'Later'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-primary/5 border border-primary/20 rounded-xl p-3",
        "flex items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground truncate">
          {isRu ? 'Войдите для кэшбэка и бонусов' : 'Sign in for cashback & rewards'}
        </p>
      </div>
      <Button onClick={handleSignIn} size="sm" variant="outline" className="flex-shrink-0 gap-1">
        <LogIn className="w-3 h-3" />
        {isRu ? 'Войти' : 'Sign in'}
      </Button>
    </div>
  );
}
